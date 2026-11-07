const { test, expect } = require('@playwright/test');

// How to play, About and Settings are the first links on the home page, and each opens its own page.
test('home page leads with How to play, About and Settings, each on its own page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');
  const links = page.locator('.intro-link');
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toContainText('How to play');
  await expect(links.nth(1)).toContainText('About the developer');
  await expect(links.nth(2)).toContainText('Settings');
  await expect(page.locator('#settingsSection, #regionHost')).toHaveCount(0);
  // They come before the games.
  const order = await page.evaluate(() => document.querySelector('.intro-links').compareDocumentPosition(document.querySelector('.choices')) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(order).toBeTruthy();

  await links.nth(0).click();
  await expect(page).toHaveURL(/how-to-play\/$/);
  await expect(page.locator('h1')).toContainText('Sixty seconds');
  await expect(page.locator('.top-actions .region-btn')).toBeVisible();

  await page.locator('.back').click();
  await page.locator('.intro-link').nth(1).click();
  await expect(page).toHaveURL(/about\/$/);
  await expect(page.locator('h1')).toContainText('Shubham Joshi');
  await expect(page.locator('a[href*="linkedin.com"]')).toHaveCount(1);
  await expect(page.locator('.top-actions .region-btn')).toBeVisible();

  await page.locator('.back').click();
  await page.locator('.intro-link').nth(2).click();
  await expect(page).toHaveURL(/settings\/$/);
  await expect(page.locator('#regionHost .region-pick')).toBeVisible();
  await expect(page.locator('#soundSetting')).toBeVisible();
  expect(errors).toEqual([]);
});
