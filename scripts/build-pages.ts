import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { StylesheetLink, TransformHtmlDsdResult } from '@methane-ui/ssr';

const ROOT_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CLIENT_DIST_DIR = join(ROOT_DIR, 'dist', 'client');
const SERVER_DIST_ENTRY = join(ROOT_DIR, 'dist', 'server', 'entry-server.js');
const PAGES_DIST_DIR = join(ROOT_DIR, 'dist', 'pages');
const PDF_WORKER_SRC = join(ROOT_DIR, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');

const BASE_PATH = (process.env['ATMOS_BASE_PATH'] ?? '/methane-examples').trim().replace(/\/+$/, '');
const ROUTES = [
  '/',
  '/spatial',
  '/telemetry',
  '/operations',
  '/war-room',
  '/commerce-auth',
  '/studio',
] as const;

interface ServerEntryExports {
  renderUrlToHtml: (
    url: string | URL,
    htmlTemplate: string,
  ) => Promise<{ html: string; links: ReadonlyArray<StylesheetLink> }>;
  getStylesheetCss: (hrefOrFileName: string) => Promise<string | null>;
  getAllCachedStylesheets: () => ReadonlyArray<StylesheetLink>;
  createDemoSsrStream: () => ReadableStream<Uint8Array>;
  runDemoTransformHtmlDsd: (rawHtml?: string) => Promise<TransformHtmlDsdResult>;
}

function resolveDotLottieWasmPath(): string {
  const rootReq = createRequire(import.meta.url);
  const mediaEntry = rootReq.resolve('@methane-ui/media');
  const mediaReq = createRequire(mediaEntry);
  return mediaReq.resolve('@lottiefiles/dotlottie-web/dotlottie-player.wasm');
}

function runViteBuild(args: ReadonlyArray<string>, env: NodeJS.ProcessEnv): void {
  const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  execFileSync(pnpmBin, ['exec', 'vite', 'build', ...args], {
    cwd: ROOT_DIR,
    env,
    stdio: 'inherit',
  });
}

function assertNoRootRelativeAttributes(routeLabel: string, docHtml: string, basePath: string): void {
  const escapedBase = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attrPattern = new RegExp(
    `\\b(?:href|src|poster|fallback-src|worker-src|avatar-src|logo-url)="/(?!${escapedBase.slice(1)}(?:/|$))([^"]*)"`,
    'g',
  );
  const leaks: string[] = [];
  for (const match of docHtml.matchAll(attrPattern)) {
    leaks.push(match[0]);
  }
  if (leaks.length > 0) {
    throw new Error(
      `[build:pages] Found unprefixed root-relative attribute(s) in ${routeLabel}: ${leaks.slice(0, 5).join(', ')}`,
    );
  }
}

async function buildStaticPages(): Promise<void> {
  process.env['ATMOS_BASE_PATH'] = BASE_PATH;
  process.env['ATMOS_STATIC_PAGES'] = '1';

  const buildEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ATMOS_BASE_PATH: BASE_PATH,
    ATMOS_STATIC_PAGES: '1',
  };

  process.stdout.write(`📦 Building client & SSR bundles for base "${BASE_PATH}/"...\n`);
  runViteBuild(['--outDir', 'dist/client'], buildEnv);
  runViteBuild(['--ssr', 'src/entry-server.ts', '--outDir', 'dist/server'], buildEnv);

  await rm(PAGES_DIST_DIR, { recursive: true, force: true });
  await cp(CLIENT_DIST_DIR, PAGES_DIST_DIR, { recursive: true });

  const clientTemplate = await readFile(join(CLIENT_DIST_DIR, 'index.html'), 'utf8');
  const entryServer = (await import(
    `${pathToFileURL(SERVER_DIST_ENTRY).href}?t=${Date.now()}`
  )) as ServerEntryExports;

  const referencedStylesheets = new Set<string>();
  const collectStyleRefs = (docHtml: string) => {
    const stylePattern = /\/_methane\/styles\/([a-z0-9.-]+\.css)/gi;
    for (const match of docHtml.matchAll(stylePattern)) {
      if (match[1]) referencedStylesheets.add(match[1]);
    }
  };

  let totalShadowRoots = 0;
  for (const route of ROUTES) {
    const routeUrl = `http://localhost${BASE_PATH}${route === '/' ? '/' : `${route}/`}`;
    const rendered = await entryServer.renderUrlToHtml(routeUrl, clientTemplate);
    assertNoRootRelativeAttributes(route, rendered.html, BASE_PATH);
    collectStyleRefs(rendered.html);
    totalShadowRoots += rendered.html.split('shadowrootmode="open"').length - 1;

    if (route === '/') {
      await writeFile(join(PAGES_DIST_DIR, 'index.html'), rendered.html, 'utf8');
      await writeFile(join(PAGES_DIST_DIR, '404.html'), rendered.html, 'utf8');
    } else {
      const routeDir = join(PAGES_DIST_DIR, route.slice(1));
      await mkdir(routeDir, { recursive: true });
      await writeFile(join(routeDir, 'index.html'), rendered.html, 'utf8');
    }
  }

  const methaneRuntimeDir = join(PAGES_DIST_DIR, '_methane');
  const stylesOutDir = join(methaneRuntimeDir, 'styles');
  await mkdir(stylesOutDir, { recursive: true });

  // Pre-render static DSD SSR inspector fixtures for /studio
  const transformSample = await entryServer.runDemoTransformHtmlDsd();
  collectStyleRefs(transformSample.html);
  await writeFile(
    join(methaneRuntimeDir, 'ssr-transform-sample.json'),
    JSON.stringify({
      html: transformSample.html,
      expandedTags: transformSample.expandedTags,
    }),
    'utf8',
  );

  const streamSampleHtml = await new Response(entryServer.createDemoSsrStream()).text();
  collectStyleRefs(streamSampleHtml);
  await writeFile(join(methaneRuntimeDir, 'ssr-stream-sample.html'), streamSampleHtml, 'utf8');

  // Warm & emit all content-hashed Declarative Shadow DOM stylesheets
  await entryServer.getStylesheetCss('__warmup__');
  const allStylesheets = entryServer.getAllCachedStylesheets();
  for (const sheet of allStylesheets) {
    const fileName = sheet.href.split('/').pop();
    if (fileName) {
      await writeFile(join(stylesOutDir, fileName), sheet.css, 'utf8');
    }
  }

  for (const expectedCssFile of referencedStylesheets) {
    const outPath = join(stylesOutDir, expectedCssFile);
    if (!existsSync(outPath)) {
      throw new Error(`[build:pages] Missing referenced DSD stylesheet: ${expectedCssFile}`);
    }
  }

  // Copy offline PDF.js worker & DotLottie WASM binaries
  if (!existsSync(PDF_WORKER_SRC)) {
    throw new Error(`[build:pages] Missing PDF.js worker at ${PDF_WORKER_SRC}`);
  }
  await copyFile(PDF_WORKER_SRC, join(methaneRuntimeDir, 'pdf.worker.mjs'));

  const dotLottieWasmSrc = resolveDotLottieWasmPath();
  if (!existsSync(dotLottieWasmSrc)) {
    throw new Error(`[build:pages] Missing DotLottie WASM at ${dotLottieWasmSrc}`);
  }
  await copyFile(dotLottieWasmSrc, join(methaneRuntimeDir, 'dotlottie-player.wasm'));

  // Disable Jekyll underscore-folder filtering on GitHub Pages
  await writeFile(join(PAGES_DIST_DIR, '.nojekyll'), '', 'utf8');

  process.stdout.write(
    `✅ Static DSD Pages export ready at dist/pages (${ROUTES.length} routes + 404.html, ${totalShadowRoots} DSD roots, ${allStylesheets.length} stylesheets).\n`,
  );
}

void buildStaticPages();
