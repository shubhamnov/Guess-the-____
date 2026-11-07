const { test, expect } = require('@playwright/test');

// The site-wide Global / India / Both switch (shared/region.js).

test.describe('first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('asks once, remembers the answer across the site, and does not ask again', async ({ page }) => {
    await page.goto('./');
    const welcome = page.locator('dialog.region-welcome');
    await expect(welcome).toBeVisible();
    await welcome.locator('button[data-region="global"]').click();
    await expect(welcome).toHaveCount(0);
    // Bollywood stays in Global.
    await expect(page.locator('[data-topics="movies-tv"]')).toHaveText('4');
    await page.goto('movies-tv/');
    await expect(page.locator('.game-card[href="../guess-the-bollywood/"]')).toBeVisible();
    await expect(page.locator('#mixNote')).toContainText('all 4 topics');
    await page.goto('settings/');
    await expect(page.locator('#regionHost [aria-pressed="true"]')).toHaveText(/Global/);
    await page.goto('guess-the-sports/');
    await expect(page.locator('dialog.region-welcome')).toHaveCount(0);
    await expect(page.locator('.region-btn')).toHaveAttribute('aria-label', /Global/);
    await expect(page.locator('#introNote')).toContainText('International questions only');
    // The big switches are gone from the game screens.
    await expect(page.locator('.region-pick')).toHaveCount(0);
  });

  test('a game opened first asks too, and closing it keeps Both', async ({ page }) => {
    await page.goto('guess-the-flag/');
    await expect(page.locator('dialog.region-welcome')).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.locator('#time')).toHaveText('60');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.region-welcome')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('gtq:region'))).toBe('both');
    // The game waited for the answer before starting its clock.
    await expect(page.locator('#game')).toHaveClass(/active/);
    await page.reload();
    await expect(page.locator('#soundToggle')).toBeVisible();
    await expect(page.locator('dialog.region-welcome')).toHaveCount(0);
  });
});

test('the Settings page and the top-right button change the same setting', async ({ page }) => {
  await page.goto('settings/');
  await page.locator('#regionHost button[data-region="global"]').click();
  await expect(page.locator('#regionHelp')).toContainText('Bollywood stays in every mode');
  await expect(page.locator('.region-btn')).toHaveAttribute('aria-label', /Global/);
  await page.locator('.back').click();
  const bolly = page.locator('[data-topics="movies-tv"]');
  await expect(bolly).toHaveText('4');
  await expect(page.locator('#settingsSummary')).toHaveText('Questions: Global · Sound on');
  await page.locator('.region-btn').click();
  await page.locator('.region-menu [data-region="both"]').click();
  await expect(bolly).toHaveText('4');
  await page.goto('settings/');
  await expect(page.locator('#regionHost [aria-pressed="true"]')).toHaveText('Both');
  await page.locator('#soundSetting').click();
  await expect(page.locator('#soundSetting')).toHaveText('Off');
  expect(await page.evaluate(() => localStorage.getItem('gtq_sound'))).toBe('off');
});

for (const [path, region, check] of [
  ['guess-the-series/', 'india', 'Indian'],
  ['guess-the-web-series/', 'global', 'International'],
  ['guess-the-sports/', 'india', 'Indian']
]) {
  test(`${path} with ?region=${region} only asks ${check} questions`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(path + '?region=' + region);
    await expect(page.locator('.region-btn')).toHaveAttribute('aria-label', new RegExp(region === 'india' ? 'India' : 'Global'));
    await expect(page.locator('#introNote')).toContainText(check + ' questions only');
    // Switching mid-round from the top-right button restarts the round with the new pool.
    await page.keyboard.press('1');
    await page.locator('.region-btn').click();
    await page.locator('.region-menu [data-region="both"]').click();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#introNote')).not.toContainText('only');
    expect(errors).toEqual([]);
  });
}

test('every game page has the top-right button', async ({ page }) => {
  for (const path of ['guess-the-flag/', 'guess-the-world-politics/', 'name-them-all/', 'daily-challenge/']) {
    await page.goto(path);
    await expect(page.locator('.top-actions .region-btn'), path).toBeVisible();
  }
});

test('Name Them All topics follow the switch', async ({ page }) => {
  await page.goto('name-them-all/?region=global');
  await expect(page.locator('[data-topic="srk-films"]')).toHaveCount(1);
  await expect(page.locator('[data-topic="ipl-teams"]')).toHaveCount(0);
  await expect(page.locator('[data-topic="friends"]')).toHaveCount(1);
  await expect(page.locator('[data-topic="planets"]')).toHaveCount(1);
  await page.locator('.region-btn').click();
  await page.locator('.region-menu [data-region="india"]').click();
  await expect(page.locator('[data-topic="srk-films"]')).toHaveCount(1);
  await expect(page.locator('[data-topic="friends"]')).toHaveCount(0);
  await expect(page.locator('[data-topic="planets"]')).toHaveCount(1);
});

test('live games have no switch', async ({ page }) => {
  await page.goto('guess-the-sports/?live&region=india');
  await expect(page.locator('#introEyebrow')).toBeVisible();
  await expect(page.locator('.region-btn')).toHaveCount(0);
});

test('Daily Mix follows the switch: Global keeps Bollywood and asks international questions', async ({ page }) => {
  await page.goto('daily-challenge/?region=global&date=2026-01-15');
  await expect(page.locator('#intro')).toContainText('International questions only');
  await page.waitForFunction(() => window.GTQMix && GTQMix.games().length > 0, null, { timeout: 30000 });
  const loaded = await page.evaluate(() => GTQMix.games().map(g => g.path));
  expect(loaded).toContain('guess-the-bollywood');
  expect(loaded).toContain('guess-the-series');
  // Each game frame was asked for Global questions only.
  const series = await page.evaluate(() => [...document.querySelectorAll('iframe')].map(f => f.src).find(s => s.includes('guess-the-series/')));
  expect(series).toContain('region=global');
});
