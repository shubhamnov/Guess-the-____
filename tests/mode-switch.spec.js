const { test, expect } = require('@playwright/test');

// Solo ⇄ With a friend from the header chip (shared/mode-switch.js): asks "exit and restart?" instead of refusing.
const PUBLISHED = !!process.env.BASE_URL;
const SIGNAL = PUBLISHED ? '' : '&signal=127.0.0.1:9000';

test('mid-round, With a friend asks first, pauses the clock, and goes on to a room when confirmed', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('guess-the-flag/');
  if (await page.locator('#startBtn').isVisible()) await page.locator('#startBtn').click();
  await expect(page.locator('#game')).toHaveClass(/active/);
  await page.locator('#modeChip a:not([aria-current])').click();
  const ask = page.locator('dialog.mode-switch');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText('Play with a friend instead?');
  // The clock stops while it asks, and answer keys do nothing.
  const t = await page.locator('#time').textContent();
  await page.keyboard.press('1');
  await page.waitForTimeout(2200);
  await expect(page.locator('#time')).toHaveText(t);
  await expect(page.locator('#score')).toHaveText('0');
  // Keep playing: back to the same round, clock running again.
  await ask.locator('.ms-stay').click();
  await expect(ask).toHaveCount(0);
  await expect(page).toHaveURL(/guess-the-flag\/$/);
  await expect(page.locator('#time')).not.toHaveText(t, { timeout: 3000 });
  // Confirm: off to a new room.
  await page.locator('#modeChip a:not([aria-current])').click();
  await page.locator('dialog.mode-switch .ms-go').click();
  await expect(page).toHaveURL(/\?live=new/);
  expect(errors).toEqual([]);
});

test('with no round running, the chip switches straight away', async ({ page }) => {
  await page.goto('name-them-all/');
  await page.locator('#modeChip a:not([aria-current])').click();
  await expect(page).toHaveURL(/name-them-all\/\?live=new/);
  await expect(page.locator('dialog.mode-switch')).toHaveCount(0);
});

test('Name Them All asks too', async ({ page }) => {
  await page.goto('name-them-all/?t=planets');
  await page.locator('#challengeStart').click();
  await expect(page.locator('#answer')).toBeVisible();
  await page.locator('#modeChip a:not([aria-current])').click();
  const ask = page.locator('dialog.mode-switch');
  await expect(ask).toContainText('Yes, play with a friend');
  const t = await page.locator('#time').textContent();
  await page.waitForTimeout(2200);
  await expect(page.locator('#time')).toHaveText(t);
  await ask.locator('.ms-stay').click();
  await expect(ask).toHaveCount(0);
  await page.locator('#modeChip a:not([aria-current])').click();
  await page.locator('dialog.mode-switch .ms-go').click();
  await expect(page).toHaveURL(/name-them-all\/\?live=new/);
});

test('in a room with a friend, Solo asks before leaving', async ({ browser }) => {
  test.skip(PUBLISHED, 'Checked locally only');
  test.setTimeout(90000);
  const hostCtx = await browser.newContext(), guestCtx = await browser.newContext();
  const host = await hostCtx.newPage(), guest = await guestCtx.newPage();
  await host.goto('guess-the-flag/?live' + SIGNAL);
  await host.locator('#nameInput').fill('Sam');
  await host.locator('#createBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Keep this page open', { timeout: 20000 });
  const code = await host.locator('#roomCode').innerText();
  await guest.goto('guess-the-flag/?live=' + code + SIGNAL);
  await expect(guest.locator('#readyBtn')).toBeVisible({ timeout: 45000 });
  await host.locator('#modeChip a:not([aria-current])').click();
  const ask = host.locator('dialog.mode-switch');
  await expect(ask).toContainText('Leave the room and play solo?');
  await ask.locator('.ms-stay').click();
  await expect(host.locator('#roomCode')).toHaveText(code);
  await host.locator('#modeChip a:not([aria-current])').click();
  await host.locator('dialog.mode-switch .ms-go').click();
  await expect(host).toHaveURL(/guess-the-flag\/$/);
  await hostCtx.close(); await guestCtx.close();
});
