import { defineConfig, devices } from '@playwright/test';

/**
 * Interface tests run the real app against an isolated stack: API on :3101 using the
 * test database (reset and seeded in global-setup) and the web app on :4301.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4301',
    // GitHub runners ship Google Chrome with its system libraries, which saves ~7 min of apt installs.
    channel: process.env['CI'] ? 'chrome' : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } }, grep: /@tablet/ },
  ],
  webServer: [
    {
      command: 'npx nest start',
      cwd: '../api',
      url: 'http://localhost:3101/api/portal/banners',
      // Any HTTP answer (401 here) means the API is up.
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
      env: {
        PORT: '3101',
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://course:course@localhost:5433/course_platform_test',
        WEB_URL: 'http://localhost:4301',
        AUTH_RATE_LIMIT: '1000',
      },
    },
    {
      command: 'npx ng serve --port 4301 --proxy-config proxy.e2e.conf.json',
      url: 'http://localhost:4301',
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
