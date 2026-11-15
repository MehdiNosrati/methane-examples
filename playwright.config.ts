import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PORT'] ?? 4173);
const BASE_URL = process.env['BASE_URL'] ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
    },
  },
});
