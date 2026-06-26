// Playwright E2E config — real browser, real server (no mocks). @requirement REQ-004..REQ-010
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    headless: true,
  },
  // Start the real server for E2E. Requires FRED_API_KEY in env/.env.
  webServer: {
    command: 'node src/server.js',
    url: 'http://localhost:3100',
    timeout: 30000,
    reuseExistingServer: false,
    env: { PORT: '3100' },
  },
});
