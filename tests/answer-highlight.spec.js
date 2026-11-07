const { test, expect } = require('@playwright/test');

// After a wrong answer the right one is highlighted, whatever the question type, including answers that are numbers
// (World Politics years).
test('World Politics highlights the right answer after a wrong one, for every question type', async ({ page }) => {
  test.setTimeout(90000);
  // India mode has four question types, so a year question comes up often.
  await page.goto('guess-the-world-politics/?region=india');
  if (await page.locator('#startBtn').isVisible()) await page.locator('#startBtn').click();
  const checked = new Set();
  for (let i = 0; i < 40 && !checked.has('YEAR'); i++) {
    const buttons = page.locator('#answers button:not([disabled])');
    if (!(await buttons.first().isVisible({ timeout: 4000 }).catch(() => false))) break;
    const kind = (await page.locator('#roundLabel').textContent()).split('·').pop().trim();
    await buttons.nth(i % 4).click();
    const wrong = await page.locator('#answers .wrong').count();
    if (wrong) {
      await expect(page.locator('#answers .correct'), kind).toHaveCount(1);
      checked.add(kind);
    }
    await page.waitForTimeout(1900);
  }
  expect(checked.has('YEAR'), 'saw a wrong answer on a year question: ' + [...checked]).toBe(true);
});
