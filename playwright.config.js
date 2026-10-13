const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://shubhamnov.github.io/Guess-the-____',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  outputDir: 'test-results'
});
