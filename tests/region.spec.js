const { test, expect } = require('@playwright/test');

// The site-wide Global / India / Both switch (shared/region.js).

test('home: Global hides India-only games and the choice carries to the games', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
  const bolly = page.locator('.game-card[href="./guess-the-bollywood/"]');
  await expect(bolly).toBeVisible();
  await page.locator('#regionHost button[data-region="global"]').click();
  await expect(bolly).toBeHidden();
  await page.goto('guess-the-sports/');
  await expect(page.locator('#game .region-pick [aria-pressed="true"]')).toHaveText(/Global/);
  await expect(page.locator('#introNote')).toContainText('International questions only');
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
    await expect(page.locator('#game .region-pick [aria-pressed="true"]')).toHaveText(new RegExp(region === 'india' ? 'India' : 'Global'));
    await expect(page.locator('#introNote')).toContainText(check + ' questions only');
    // Switching mid-round restarts the round with the new pool.
    await page.keyboard.press('1');
    await page.locator('#game .region-pick button[data-region="both"]').click();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#introNote')).not.toContainText('only');
    expect(errors).toEqual([]);
  });
}

test('Name Them All topics follow the switch', async ({ page }) => {
  await page.goto('name-them-all/?region=global');
  await expect(page.locator('[data-topic="srk-films"]')).toHaveCount(0);
  await expect(page.locator('[data-topic="friends"]')).toHaveCount(1);
  await expect(page.locator('[data-topic="planets"]')).toHaveCount(1);
  await page.locator('.region-pick button[data-region="india"]').click();
  await expect(page.locator('[data-topic="srk-films"]')).toHaveCount(1);
  await expect(page.locator('[data-topic="friends"]')).toHaveCount(0);
  await expect(page.locator('[data-topic="planets"]')).toHaveCount(1);
});

test('live games have no switch', async ({ page }) => {
  await page.goto('guess-the-sports/?live&region=india');
  await expect(page.locator('#introEyebrow')).toBeVisible();
  await expect(page.locator('.region-pick')).toHaveCount(0);
});
