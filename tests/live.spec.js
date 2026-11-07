const { test, expect } = require('@playwright/test');

// Live mode: two browsers play each other. Locally they connect through a local PeerJS server (started by
// playwright.config.js); against the published site (BASE_URL) through the free public PeerJS service, as real players do.
const PUBLISHED = !!process.env.BASE_URL;
const SIGNAL = PUBLISHED ? '' : '&signal=127.0.0.1:9000';

async function pair(browser, hostPath, guestPath) {
  const hostCtx = await browser.newContext();
  const guestCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const guest = await guestCtx.newPage();
  for (const p of [host, guest]) p.on('pageerror', e => { throw e; });
  await host.goto(hostPath + '?live' + SIGNAL);
  await host.locator('#nameInput').fill('Sam');
  await host.locator('#createBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Keep this page open', { timeout: 20000 });
  const code = await host.locator('#roomCode').innerText();
  expect(code).toMatch(/^[A-Z]{4}$/);
  await guest.goto((guestPath || hostPath) + '?live=' + code + SIGNAL);
  await expect(guest.locator('#readyBtn')).toBeVisible({ timeout: 45000 });
  await guest.locator('#nameInput').fill('Riya');
  await guest.locator('#readyBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Riya is ready');
  await host.locator('#goBtn').click();
  for (const p of [host, guest]) await expect(p.locator('#game')).toHaveClass(/active/, { timeout: 8000 });
  return { host, guest, close: async () => { await hostCtx.close(); await guestCtx.close(); } };
}

// What a player sees for the current question: label, clue and the answer choices.
function question(p) {
  return p.evaluate(() => ({
    label: document.getElementById('roundLabel').textContent,
    clue: Array.from(document.querySelectorAll('#clue img, #clue svg, #clue div')).map(e => e.getAttribute('src') || e.textContent || e.outerHTML.length).join('|') + '|' + (document.getElementById('clue').getAttribute('style') || ''),
    options: Array.from(document.querySelectorAll('#answers .answer')).map(b => b.dataset.value)
  }));
}
const isOver = p => p.locator('#result').evaluate(r => r.classList.contains('active'));
async function answer(p, key) {
  const label = await p.locator('#roundLabel').innerText();
  await p.keyboard.press(key);
  await expect.poll(async () => (await isOver(p)) || (await p.locator('#roundLabel').innerText()) !== label, { timeout: 5000 }).toBe(true);
}
async function playToEnd(p) {
  for (let i = 0; i < 80 && !(await isOver(p)); i++) await answer(p, String((i % 4) + 1));
  await expect(p.locator('#result')).toHaveClass(/active/, { timeout: 65000 });
}
async function sameResult(host, guest) {
  await expect(host.locator('#resultTitle')).not.toContainText('Waiting', { timeout: 65000 });
  await expect(guest.locator('#resultTitle')).not.toContainText('Waiting', { timeout: 65000 });
  const hostTitle = await host.locator('#resultTitle').innerText();
  const guestTitle = await guest.locator('#resultTitle').innerText();
  if (hostTitle.includes('You win')) expect(guestTitle).toContain('Sam wins');
  else if (hostTitle.includes('Riya wins')) expect(guestTitle).toContain('You win');
  else expect(guestTitle).toBe(hostTitle);
}

test('Live Mix: same questions, live scores, same result and a rematch', async ({ browser }) => {
  test.setTimeout(240000);
  const { host, guest, close } = await pair(browser, 'race/');
  expect(await question(guest)).toEqual(await question(host));
  const total = (await host.locator('.race-row.me .q').innerText()).split('/')[1];
  expect(Number(total)).toBeGreaterThan(20);

  // The guest answers; the host sees the score live. Then the host answers and both still see the same next question.
  await answer(guest, '1');
  const guestScore = await guest.locator('#score').innerText();
  await expect(host.locator('.race-row.rival .pts')).toHaveText(guestScore + ' pts');
  await expect(host.locator('.race-row.rival .q')).toHaveText('Q1/' + total);
  await answer(host, '2');
  expect(await question(guest)).toEqual(await question(host));

  await Promise.all([playToEnd(host), playToEnd(guest)]);
  await sameResult(host, guest);
  await expect(host.locator('#raceTally')).toBeVisible();

  // Rematch: both tap it, a new round starts with fresh questions that are again the same on both devices.
  const firstRound = await question(host);
  await guest.locator('#rematchBtn').click();
  await expect(guest.locator('#rematchBtn')).toContainText('Waiting for Sam');
  await expect(host.locator('#rematchBtn')).toContainText('Riya wants a rematch');
  await host.locator('#rematchBtn').click();
  for (const p of [host, guest]) await expect(p.locator('#game')).toHaveClass(/active/, { timeout: 8000 });
  const hostQ = await question(host);
  expect(await question(guest)).toEqual(hostQ);
  expect(hostQ).not.toEqual(firstRound);
  await expect(host.locator('.race-row.rival .pts')).toHaveText('0 pts');
  await close();
});

test('Live in one category: a code from another game opens the right game, questions match at any pace', async ({ browser }) => {
  test.setTimeout(180000);
  // The host plays Colors (which gets harder over time); the guest opens the code on the Flags page and is moved to Colors.
  const { host, guest, close } = await pair(browser, 'guess-the-color/', 'guess-the-flag/');
  expect(new URL(guest.url()).pathname).toContain('/guess-the-color/');
  for (let i = 0; i < 8; i++) {
    expect(await question(guest)).toEqual(await question(host));
    await answer(host, String((i % 4) + 1));
    if (i % 3 === 0) await guest.waitForTimeout(900); // the guest plays more slowly
    await answer(guest, String(((i + 1) % 4) + 1));
  }
  await expect(host.locator('.race-row.rival .q')).toHaveText('Q8');
  await close();
});

test('Brand logos stay in step live even when the players’ streaks differ', async ({ browser }) => {
  test.setTimeout(120000);
  const { host, guest, close } = await pair(browser, 'guess-the-brand-logos/');
  for (let i = 0; i < 7; i++) {
    const q = await question(host);
    expect(await question(guest)).toEqual(q);
    // The players answer differently, so their streaks differ (solo play would change their levels differently).
    await answer(host, String((i % 4) + 1));
    await answer(guest, '1');
  }
  await close();
});

test('joining a room that does not exist explains the problem', async ({ page }) => {
  test.skip(PUBLISHED, 'Checked locally only');
  test.setTimeout(60000);
  await page.goto('guess-the-flag/?live=ZZZZ' + SIGNAL);
  await expect(page.locator('#raceStatus')).toContainText('No room found with code ZZZZ', { timeout: 50000 });
  await expect(page.locator('#createBtn')).toBeVisible();
});

test('every game links to live mode and the live page lists them all', async ({ page }) => {
  await page.goto('guess-the-flag/');
  await expect(page.locator('#friendBtn')).toHaveAttribute('href', '?live=new');
  await expect(page.locator('#modeChip a[aria-current]')).toHaveText('Solo');
  await page.goto('live/');
  const hrefs = await page.locator('#categories a, #mixLink').evaluateAll(as => as.map(a => a.getAttribute('href')));
  /* Every registered game, the category mixes, Name Them All, the Daily Mix and the Live Mix. */
  const games = await page.evaluate(() => window.GTQ_GAMES.length + GTQ_CATEGORIES.filter(c => c.mix && c.mix.includes('/')).length);
  expect(hrefs.length).toBe(games + 3);
  for (const href of hrefs) {
    const res = await page.request.get(new URL(href.split('?')[0], page.url()).toString());
    expect(res.ok(), href).toBe(true);
  }
});

test('category page: tapping a topic or the mix asks Solo or With a friend, and a code joins from home', async ({ page }) => {
  await page.goto('./');
  await page.locator('.game-card[href="./world/"]').click();
  await expect(page).toHaveURL(/\/world\/$/);
  await page.locator('.game-card[href="../guess-the-flag/"]').click();
  const sheet = page.locator('#modeSheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#sheetTitle')).toHaveText('Flags');
  await expect(sheet.locator('#sheetSolo')).toHaveAttribute('href', '../guess-the-flag/');
  await expect(sheet.locator('#sheetFriend')).toHaveAttribute('href', '../guess-the-flag/?live=new');
  await page.locator('#sheetClose').click();
  await expect(sheet).toBeHidden();
  await page.locator('.cat-mix').click();
  await expect(sheet.locator('#sheetTitle')).toHaveText('World & Places mix');
  await expect(sheet.locator('#sheetFriend')).toHaveAttribute('href', './mix/?live=new');
  await page.locator('#sheetClose').click();
  await page.goto('./');
  await page.locator('#homeCode').fill('ab');
  await page.locator('#joinForm button').click();
  await expect(page.locator('#joinError')).toContainText('4-letter code');
  await page.route('**/race/**', r => r.fulfill({ body: 'ok' }));
  await page.locator('#homeCode').fill('abcd');
  await page.locator('#joinForm button').click();
  await expect(page).toHaveURL(/race\/\?live=ABCD$/);
});

test('a room made from the home page (?live=new) is ready at once, and a code typed on home finds its game', async ({ browser }) => {
  test.skip(PUBLISHED, 'Checked locally only');
  test.setTimeout(90000);
  const hostCtx = await browser.newContext(), guestCtx = await browser.newContext();
  const host = await hostCtx.newPage(), guest = await guestCtx.newPage();
  await host.goto('guess-the-flag/?live=new' + SIGNAL);
  await expect(host.locator('#roomCode')).toHaveText(/^[A-Z]{4}$/);
  await expect(host.locator('#inviteBtn')).toBeVisible();
  await expect(host.locator('#raceStatus')).toContainText('Keep this page open', { timeout: 20000 });
  const code = await host.locator('#roomCode').innerText();
  // The home page sends every code to the Mix page; live mode then moves the guest to the host's game.
  await guest.goto('race/?live=' + code + SIGNAL);
  await expect(guest).toHaveURL(/guess-the-flag\//, { timeout: 45000 });
  await expect(guest.locator('#readyBtn')).toBeVisible({ timeout: 45000 });
  await hostCtx.close(); await guestCtx.close();
});

test('Name Them All live: the host picks the topic, both type against the same board, live scores and a rematch', async ({ browser }) => {
  test.setTimeout(120000);
  const hostCtx = await browser.newContext();
  const guestCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const guest = await guestCtx.newPage();
  for (const p of [host, guest]) p.on('pageerror', e => { throw e; });
  await host.goto('name-them-all/?live' + SIGNAL);
  await expect(host.locator('#modeChip a[aria-current]')).toContainText('With a friend');
  await expect(host.locator('#picker')).toBeHidden();
  await host.locator('#nameInput').fill('Sam');
  await host.locator('#createBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Keep this page open', { timeout: 20000 });
  // Only the room creator sees the topics; picking one sets the room's topic.
  await host.locator('[data-topic="planets"]').click();
  await expect(host.locator('#roomTopicTitle')).toContainText('Name the planets');
  const code = await host.locator('#roomCode').innerText();
  await guest.goto('name-them-all/?live=' + code + SIGNAL);
  await expect(guest.locator('#readyBtn')).toBeVisible({ timeout: 45000 });
  await expect(guest.locator('#picker')).toBeHidden();
  await expect(guest.locator('#roomTopicTitle')).toContainText('surprise');
  await guest.locator('#nameInput').fill('Riya');
  await guest.locator('#readyBtn').click();
  await expect(host.locator('#raceStatus')).toContainText('Riya is ready');
  await host.locator('#goBtn').click();
  for (const p of [host, guest]) await expect(p.locator('#title')).toHaveText('Name the planets', { timeout: 8000 });

  // The guest names one; the host sees it live.
  await guest.locator('#answer').fill('Mars');
  await expect(guest.locator('#found')).toContainText('1');
  await expect(host.locator('.race-row.rival .pts')).toHaveText('10 pts');
  await expect(host.locator('.race-row.rival .q')).toHaveText('1/8');

  // The host names them all (time bonus); the guest gives up. Both agree on the winner.
  for (const p of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) await host.locator('#answer').fill(p);
  await expect(host.locator('#result')).toBeVisible();
  await guest.locator('#giveUp').click();
  await expect(host.locator('#resultTitle')).toHaveText('You win! 🏆');
  await expect(host.locator('.race-row.rival .q')).toHaveText('1/8');
  await expect(guest.locator('#resultTitle')).toHaveText('Sam wins');
  await expect(host.locator('#againBtn')).toBeHidden();

  // Rematch: a new random topic, the same on both devices.
  await guest.locator('#rematchBtn').click();
  await host.locator('#rematchBtn').click();
  await expect(host.locator('#result')).toBeHidden({ timeout: 8000 });
  await expect(host.locator('#answer')).toBeEnabled({ timeout: 8000 });
  const title = await host.locator('#title').innerText();
  expect(title).not.toBe('Name the planets');
  await expect(guest.locator('#title')).toHaveText(title);
  await hostCtx.close(); await guestCtx.close();
});

test('lobby: a third player is told the room is full, and a friend who closes the page can rejoin with the same code', async ({ browser }) => {
  test.skip(PUBLISHED, 'Checked locally only');
  test.setTimeout(90000);
  const ctx = () => browser.newContext().then(c => c.newPage().then(p => ({ c, p })));
  const host = await ctx(), guest = await ctx(), third = await ctx();
  await host.p.goto('guess-the-flag/?live' + SIGNAL);
  await host.p.locator('#createBtn').click();
  await expect(host.p.locator('#raceStatus')).toContainText('Keep this page open', { timeout: 20000 });
  const code = await host.p.locator('#roomCode').innerText();
  await guest.p.goto('guess-the-flag/?live=' + code + SIGNAL);
  await expect(guest.p.locator('#readyBtn')).toBeVisible({ timeout: 30000 });

  await third.p.goto('guess-the-flag/?live=' + code + SIGNAL);
  await expect(third.p.locator('#raceStatus')).toContainText('already has two players', { timeout: 30000 });
  await third.p.waitForTimeout(1000); // the message stays: the room closing the link is not reported as the friend leaving
  await expect(third.p.locator('#raceStatus')).toContainText('already has two players');
  await third.p.locator('#leaveBtn').click();
  await expect(third.p.locator('#createBtn')).toBeVisible();

  // The guest's tab closes without a goodbye; the host notices from the silence and lets them back in.
  await guest.c.close();
  await expect(host.p.locator('#raceStatus')).toContainText('can join with code ' + code, { timeout: 20000 });
  const again = await ctx();
  await again.p.goto('guess-the-flag/?live=' + code + SIGNAL);
  await expect(again.p.locator('#readyBtn')).toBeVisible({ timeout: 30000 });
  await again.p.locator('#readyBtn').click();
  await expect(host.p.locator('#goBtn')).toBeEnabled();
  for (const x of [host, third, again]) await x.c.close();
});
