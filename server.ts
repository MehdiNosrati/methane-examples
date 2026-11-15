import { createReadStream, existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import type { ViteDevServer } from 'vite';

const ROOT_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)));
const CLIENT_DIST_DIR = join(ROOT_DIR, 'dist', 'client');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const PDF_WORKER_PATH = join(
  ROOT_DIR,
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs',
);

function resolveDotLottieWasmPath(): string | null {
  try {
    const rootReq = createRequire(import.meta.url);
    const mediaEntry = rootReq.resolve('@methane-ui/media');
    const mediaReq = createRequire(mediaEntry);
    return mediaReq.resolve('@lottiefiles/dotlottie-web/dotlottie-player.wasm');
  } catch {
    return null;
  }
}

const DOTLOTTIE_WASM_PATH = resolveDotLottieWasmPath();

const PORT = Number(process.env['PORT'] ?? 4173);
const HOST = process.env['HOST'] ?? '127.0.0.1';
const IS_PROD =
  process.env['NODE_ENV'] === 'production' || process.argv.includes('--prod');

const MIME_BY_EXT: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.gltf': 'model/gltf+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

interface EntryServerModule {
  renderUrlToHtml: (
    url: string | URL,
    htmlTemplate: string,
  ) => Promise<{ html: string }>;
  getStylesheetCss: (hrefOrFileName: string) => Promise<string | null>;
  createDemoSsrStream: () => ReadableStream<Uint8Array>;
  runDemoTransformHtmlDsd: (rawHtml?: string) => Promise<{
    html: string;
    expandedTags: ReadonlyArray<string>;
  }>;
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function tryServeStaticFile(
  baseDir: string,
  pathname: string,
  res: ServerResponse,
): Promise<boolean> {
  const decoded = decodeURIComponent(pathname);
  const safeRelative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const candidate = resolve(baseDir, `.${safeRelative.startsWith('/') ? safeRelative : `/${safeRelative}`}`);
  if (!candidate.startsWith(baseDir) || !existsSync(candidate)) {
    return false;
  }
  const fileStat = await stat(candidate);
  if (!fileStat.isFile()) {
    return false;
  }
  const ext = extname(candidate).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', fileStat.size);
  if (pathname.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  createReadStream(candidate).pipe(res);
  return true;
}

async function startAtmosServer(): Promise<void> {
  let vite: ViteDevServer | null = null;
  let prodTemplate = '';
  let prodEntryServer: EntryServerModule | null = null;

  if (IS_PROD) {
    prodTemplate = await readFile(join(CLIENT_DIST_DIR, 'index.html'), 'utf8');
    prodEntryServer = (await import(
      new URL('./dist/server/entry-server.js', import.meta.url).href
    )) as EntryServerModule;
  } else {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      root: ROOT_DIR,
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }

  const loadEntryServer = async (): Promise<EntryServerModule> => {
    if (prodEntryServer) {
      return prodEntryServer;
    }
    return (await vite!.ssrLoadModule('/src/entry-server.ts')) as EntryServerModule;
  };

  const server = createHttpServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `${HOST}:${PORT}`}`);
      const { pathname } = requestUrl;

      // 1. Offline PDF.js worker & DotLottie WASM endpoints (100% zero-CDN runtime)
      if (pathname === '/_methane/pdf.worker.mjs' && existsSync(PDF_WORKER_PATH)) {
        const workerStat = await stat(PDF_WORKER_PATH);
        res.writeHead(200, {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Content-Length': workerStat.size,
          'Cache-Control': 'public, max-age=86400',
        });
        createReadStream(PDF_WORKER_PATH).pipe(res);
        return;
      }

      if (pathname === '/_methane/dotlottie-player.wasm' && DOTLOTTIE_WASM_PATH && existsSync(DOTLOTTIE_WASM_PATH)) {
        const wasmStat = await stat(DOTLOTTIE_WASM_PATH);
        res.writeHead(200, {
          'Content-Type': 'application/wasm',
          'Content-Length': wasmStat.size,
          'Cache-Control': 'public, max-age=86400',
        });
        createReadStream(DOTLOTTIE_WASM_PATH).pipe(res);
        return;
      }

      // 2. Content-hashed ADR-008 Declarative Shadow DOM stylesheets (/_methane/styles/:tag.:hash.css)
      if (pathname.startsWith('/_methane/styles/')) {
        const entry = await loadEntryServer();
        const css = await entry.getStylesheetCss(pathname);
        if (css !== null) {
          res.writeHead(200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
          });
          res.end(css);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Stylesheet not found');
        return;
      }

      // 3. WinterCG streaming DSD SSR endpoint (/api/ssr-stream)
      if (pathname === '/api/ssr-stream') {
        const entry = await loadEntryServer();
        const webStream = entry.createDemoSsrStream();
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Atmos-Ssr-Mode': 'stream',
        });
        Readable.fromWeb(webStream as unknown as NodeWebReadableStream<Uint8Array>).pipe(res);
        return;
      }

      // 4. Framework-agnostic transformHtmlDsd endpoint (/api/ssr-transform)
      if (pathname === '/api/ssr-transform') {
        const entry = await loadEntryServer();
        const rawBody = req.method === 'POST' ? await readRequestBody(req) : undefined;
        const transformed = await entry.runDemoTransformHtmlDsd(rawBody);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Atmos-Expanded-Tags': transformed.expandedTags.join(','),
        });
        res.end(transformed.html);
        return;
      }

      // 5. Static assets & Vite dev middleware
      if (IS_PROD) {
        if (pathname !== '/' && (await tryServeStaticFile(CLIENT_DIST_DIR, pathname, res))) {
          return;
        }
        if (pathname !== '/' && (await tryServeStaticFile(PUBLIC_DIR, pathname, res))) {
          return;
        }
      } else if (vite) {
        const handledByVite = await new Promise<boolean>((resolveMiddleware) => {
          vite.middlewares(req, res, () => resolveMiddleware(false));
          res.once('finish', () => resolveMiddleware(true));
        });
        if (handledByVite || res.writableEnded) {
          return;
        }
      }

      // 6. Full-page Declarative Shadow DOM SSR + Hydration payload
      let template = prodTemplate;
      if (!IS_PROD && vite) {
        const rawIndex = await readFile(join(ROOT_DIR, 'index.html'), 'utf8');
        template = await vite.transformIndexHtml(requestUrl.pathname + requestUrl.search, rawIndex);
      }

      const entry = await loadEntryServer();
      const rendered = await entry.renderUrlToHtml(requestUrl, template);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Atmos-Ssr': 'declarative-shadow-dom',
      });
      res.end(rendered.html);
    } catch (err) {
      if (vite && err instanceof Error) {
        vite.ssrFixStacktrace(err);
      }
      const message = err instanceof Error ? err.stack ?? err.message : String(err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`AtmosOps SSR Error:\n${message}`);
    }
  });

  server.listen(PORT, HOST, () => {
    process.stdout.write(
      `🛰️ AtmosOps DSD SSR Command Server listening at http://${HOST}:${PORT} (${IS_PROD ? 'production' : 'development'})\n`,
    );
  });
}

void startAtmosServer();
