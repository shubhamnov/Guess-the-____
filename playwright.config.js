const { defineConfig } = require('@playwright/test');

// With BASE_URL set (as in the post-deploy workflow) the tests run against the published site.
// Without it they run against a local static server, so pull requests are checked before merging.
const publishedURL = process.env.BASE_URL;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: publishedURL || 'http://localhost:4173/',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: publishedURL ? undefined : {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore'
  },
  outputDir: 'test-results'
});
