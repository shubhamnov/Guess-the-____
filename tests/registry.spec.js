const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// shared/games.js lists every engine game and the categories they sit in. The home page, the category pages, the
// Daily Mix, the Live Mix, the category mixes and the live page all follow it, so a new game reaches all of them once
// it is listed there. These checks make sure nothing is left off.

const load = () => {
  const window = {};
  new Function('window', fs.readFileSync(path.join(__dirname, '..', 'shared', 'games.js'), 'utf8'))(window);
  return window;
};
const registry = () => load().GTQ_GAMES;
const categories = () => load().GTQ_CATEGORIES;
const topicsOf = c => registry().filter(g => g.cat === c.id && g.path !== c.mix);

test('the home page has one card per category, Name Them All included', async ({ page }) => {
  await page.goto('./');
  const cards = await page.locator('.choices .game-card').evaluateAll(as => as.map(a => a.getAttribute('href').replace(/^\.\/|\/$/g, '')));
  expect(cards).toEqual(categories().map(c => c.href || c.id));
});

test('every category page lists its topics from shared/games.js, and every game has a smoke test', async ({ page }) => {
  const smoke = fs.readFileSync(path.join(__dirname, 'browser-smoke.spec.js'), 'utf8');
  for (const c of categories().filter(c => c.mix)) {
    await page.goto(c.id + '/');
    const cards = await page.locator('.choices .game-card').evaluateAll(as => as.map(a => a.getAttribute('href').replace(/^\.\.\/|\/$/g, '')));
    expect(cards, c.id).toEqual(topicsOf(c).map(g => g.path));
    const ids = await page.locator('.choices .game-card').evaluateAll(as => as.map(a => a.dataset.id));
    expect(ids, c.id).toEqual(topicsOf(c).map(g => g.id));
    await expect(page.locator('.cat-mix')).toHaveAttribute('href', c.mix.startsWith(c.id + '/') ? './' + c.mix.slice(c.id.length + 1) + '/' : '../' + c.mix + '/');
  }
  for (const g of registry()) {
    expect(smoke, g.path + ' needs a smoke test').toContain("'" + g.path + "/'");
    expect(fs.existsSync(path.join(__dirname, '..', g.path, 'index.html')), g.path).toBe(true);
    expect(categories().some(c => c.id === g.cat), g.path + ' has a category').toBe(true);
  }
});

test('every game saves its best score under the id in shared/games.js', async ({ page }) => {
  test.setTimeout(60000);
  // Each game is opened in a frame with ?mix, where it only hands out questions and reports its id.
  await page.goto('how-to-play/');
  const ids = await page.evaluate(async games => {
    const out = {};
    for (const g of games) {
      const f = document.createElement('iframe'); f.src = '../' + g.path + '/?mix'; document.body.appendChild(f);
      await new Promise(ok => f.onload = ok);
      out[g.path] = f.contentWindow.GuessGameExport && f.contentWindow.GuessGameExport.id; f.remove();
    }
    return out;
  }, registry());
  for (const g of registry()) expect(ids[g.path], g.path).toBe(g.id);
});

test('the live page offers every category mix and topic, plus Name Them All and the Daily Mix', async ({ page }) => {
  await page.goto('live/');
  const links = await page.locator('#categories a.cat').evaluateAll(as => as.map(a => a.getAttribute('href')));
  const want = [];
  for (const c of categories().filter(c => c.mix)) want.push('../' + c.mix + '/?live', ...topicsOf(c).map(g => '../' + g.path + '/?live'));
  expect(links).toEqual([...want, '../name-them-all/?live', '../daily-challenge/?live']);
});

test('every game except the sports topics hands questions to the Daily Mix', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('daily-challenge/?date=2026-01-15');
  await page.waitForFunction(() => window.GTQMix && GTQMix.games().length > 0, null, { timeout: 30000 });
  const loaded = await page.evaluate(() => GTQMix.games().map(g => g.path));
  expect(loaded.sort()).toEqual(registry().filter(g => !g.sub).map(g => g.path).sort());
});

test('a category mix plays questions from that category only, and back goes to the category', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('movies-tv/mix/');
  await expect(page.locator('#game')).toHaveClass(/active/, { timeout: 30000 });
  const loaded = await page.evaluate(() => GTQMix.games().map(g => g.path));
  expect(loaded.sort()).toEqual(registry().filter(g => g.cat === 'movies-tv').map(g => g.path).sort());
  await expect(page.locator('#roundLabel')).toHaveText(/BOLLYWOOD|HOLLYWOOD|SERIES|WEB SERIES/);
  await expect(page.locator('#intro .links a').first()).toHaveText('Movies & TV');
  await expect(page.locator('#intro .links a').first()).toHaveAttribute('href', '../');
  expect(await page.evaluate(() => localStorage.getItem('gtq:recent'))).toContain('Movies & TV mix');
});
