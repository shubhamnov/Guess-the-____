const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// shared/games.js lists every engine game. The Daily Mix, the Live Mix and the live page all read it, so a new game
// reaches all of them once it is listed there. These checks make sure nothing is left off.

const registry = () => {
  const window = {};
  new Function('window', fs.readFileSync(path.join(__dirname, '..', 'shared', 'games.js'), 'utf8'))(window);
  return window.GTQ_GAMES;
};

test('every game on the home page is in shared/games.js and has a smoke test', async ({ page }) => {
  const games = registry().map(g => g.path);
  await page.goto('./');
  const cards = await page.locator('.game-card:not([data-standalone])').evaluateAll(as => as.map(a => a.getAttribute('href').replace(/^\.\/|\/$/g, '')));
  expect(cards.sort()).toEqual([...games].sort());
  const smoke = fs.readFileSync(path.join(__dirname, 'browser-smoke.spec.js'), 'utf8');
  for (const g of games) expect(smoke, g + ' needs a smoke test').toContain("'" + g + "/'");
  for (const g of games) expect(fs.existsSync(path.join(__dirname, '..', g, 'index.html')), g).toBe(true);
});

test('the live page offers every game plus the Daily Mix', async ({ page }) => {
  await page.goto('live/');
  const links = await page.locator('#categories a.cat').evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(links).toEqual([...registry().map(g => '../' + g.path + '/?live'), '../name-them-all/?live', '../daily-challenge/?live']);
});

test('every game can hand questions to the mixes', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('daily-challenge/?date=2026-01-15');
  await page.waitForFunction(() => window.GTQMix && GTQMix.games().length > 0, null, { timeout: 30000 });
  const loaded = await page.evaluate(() => GTQMix.games().map(g => g.path));
  expect(loaded.sort()).toEqual(registry().map(g => g.path).sort());
});
