const { test, expect } = require('@playwright/test');

// Two browsers race each other through a local PeerJS server (started by playwright.config.js).
// Skipped against the published site: that would need the public PeerJS service.
test.skip(!!process.env.BASE_URL, 'Needs the local PeerJS server');

const SIGNAL = 'signal=127.0.0.1:9000';

test('two players race live and both see the same result', async ({ browser }) => {
  test.setTimeout(90000);
  const hostCtx = await browser.newContext();
  const guestCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const guest = await guestCtx.newPage();
  for (const p of [host, guest]) p.on('pageerror', e => { throw e; });

  await host.goto('race/?' + SIGNAL + '&date=2026-01-15');
  await host.locator('#nameInput').fill('Sam');
  await host.locator('#createBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Waiting for them to join');
  const code = await host.locator('#roomCode').innerText();
  expect(code).toMatch(/^[A-Z]{4}$/);

  await guest.goto('race/?' + SIGNAL + '&room=' + code);
  await expect(guest.locator('#readyBtn')).toBeVisible();
  await guest.locator('#nameInput').fill('Riya');
  await guest.locator('#readyBtn').click();
  await expect(host.locator('#goBtn')).toBeEnabled();
  await expect(host.locator('#raceStatus')).toContainText('Riya is ready');
  await host.locator('#goBtn').click();

  // Both phones count down and start on the same questions (the host's date).
  for (const p of [host, guest]) await expect(p.locator('#game')).toHaveClass(/active/, { timeout: 8000 });
  const hostOpts = await host.locator('#answers .answer').evaluateAll(bs => bs.map(b => b.dataset.value));
  const guestOpts = await guest.locator('#answers .answer').evaluateAll(bs => bs.map(b => b.dataset.value));
  expect(guestOpts).toEqual(hostOpts);

  // The guest answers one question; the host sees the score live.
  await guest.keyboard.press('1');
  const guestScore = await guest.locator('#score').innerText();
  await expect(host.locator('.race-row.rival .pts')).toHaveText(guestScore + ' pts');
  await expect(host.locator('.race-row.rival .q')).toHaveText('Q1/14');

  // Both finish all 14 questions; both results agree on the winner.
  async function finish(p) {
    for (let i = 0; i < 14; i++) {
      if (await p.locator('#result').evaluate(r => r.classList.contains('active'))) break;
      const label = await p.locator('#roundLabel').innerText();
      await p.keyboard.press(String((i % 4) + 1));
      await expect.poll(async () => (await p.locator('#result').evaluate(r => r.classList.contains('active'))) || (await p.locator('#roundLabel').innerText()) !== label, { timeout: 5000 }).toBe(true);
    }
  }
  await Promise.all([finish(host), finish(guest)]);
  for (const p of [host, guest]) await expect(p.locator('#result')).toHaveClass(/active/);
  await expect(host.locator('#resultTitle')).not.toContainText('Waiting');
  await expect(guest.locator('#resultTitle')).not.toContainText('Waiting');
  const hostTitle = await host.locator('#resultTitle').innerText();
  const guestTitle = await guest.locator('#resultTitle').innerText();
  if (hostTitle.includes('You win')) expect(guestTitle).toContain('Sam wins');
  else if (hostTitle.includes('Riya wins')) expect(guestTitle).toContain('You win');
  else expect(guestTitle).toBe(hostTitle);

  await hostCtx.close();
  await guestCtx.close();
});

test('joining a race that does not exist explains the problem', async ({ page }) => {
  await page.goto('race/?' + SIGNAL + '&room=ZZZZ');
  await expect(page.locator('#raceStatus')).toContainText('No race found with code ZZZZ', { timeout: 15000 });
  await expect(page.locator('#createBtn')).toBeVisible();
});
