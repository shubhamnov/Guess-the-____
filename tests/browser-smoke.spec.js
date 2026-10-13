const { test, expect } = require('@playwright/test');

const games = [
  { name: 'Colors', path: '/guess-the-color/', kind: 'timed' },
  { name: 'Flags', path: '/guess-the-flag/', kind: 'timed' },
  { name: 'Countries', path: '/guess-the-countries/', kind: 'timed' },
  { name: 'Landmarks', path: '/guess-the-landmarks/', kind: 'photo' },
  { name: 'Cuisine', path: '/guess-the-cuisine/', kind: 'photo' },
  { name: 'Animals', path: '/guess-the-animals/', kind: 'timed' },
  { name: 'Capital Cities', path: '/guess-the-capitals/', kind: 'timed' },
  { name: 'Scripts', path: '/guess-the-scripts/', kind: 'timed' },
  { name: 'Brand Logos', path: '/guess-the-brand-logos/', kind: 'logo' }
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Count real oscillator starts so answer sounds can be checked without
    // depending on a human listener or an audio device in CI.
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    const originalCreateOscillator = AudioCtor.prototype.createOscillator;
    AudioCtor.prototype.createOscillator = function () {
      const oscillator = originalCreateOscillator.call(this);
      const originalStart = oscillator.start.bind(oscillator);
      oscillator.start = function (...args) {
        window.__quizOscillatorStarts = (window.__quizOscillatorStarts || 0) + 1;
        return originalStart(...args);
      };
      return oscillator;
    };
  });
});

for (const game of games) {
  test(`${game.name} starts directly from its game URL`, async ({ page }) => {
    await page.goto(game.path, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('#game').evaluate(el => el.classList.contains('active'))).toBe(true);
    await expect(page.locator('#answers .answer').first()).toBeVisible();
    await expect(page.locator('a[href*="daily-challenge"]')).toHaveCount(0);
    if (game.kind === 'photo') {
      const photo = page.locator('#photo');
      await expect.poll(() => photo.evaluate(el => el.complete && el.naturalWidth > 0), { timeout: 15000 }).toBe(true);
      await expect(photo).toBeVisible();
      await expect(page.locator('#credit a')).toBeVisible();
      await expect(photo).toHaveAttribute('src', /assets\/(landmarks|cuisines)\//);
      await page.screenshot({ path: `test-results/${game.name.toLowerCase().replace(/\s+/g, '-')}-loaded-photo.png`, fullPage: true });
    }
  });
}

for (const game of games) {
  test(`${game.name} gives answer feedback, sound, and advances automatically`, async ({ page }) => {
    await page.goto(game.path, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('#game').evaluate(el => el.classList.contains('active'))).toBe(true);
    const firstPhoto = game.kind === 'photo' ? await page.locator('#photo').getAttribute('src') : null;
    const firstLogo = game.kind === 'logo' ? await page.locator('#clue img').getAttribute('src') : null;
    const firstNumber = game.kind === 'photo' ? await page.locator('#number').innerText() : null;
    const before = await page.evaluate(() => window.__quizOscillatorStarts || 0);
    await page.locator('#answers .answer').first().click();
    await expect(page.locator('#feedback')).not.toBeEmpty();
    await expect.poll(() => page.evaluate(() => window.__quizOscillatorStarts || 0)).toBeGreaterThan(before);
    if (game.kind === 'photo') {
      await expect.poll(() => page.locator('#number').innerText()).not.toBe(firstNumber);
    } else if (game.kind === 'logo') {
      await expect.poll(() => page.locator('#clue img').getAttribute('src')).not.toBe(firstLogo);
    } else {
      await expect.poll(async () => {
        const current = await page.locator('#answers .answer').allTextContents();
        return current.join('|');
      }, { timeout: 5000 }).not.toBe('');
      // Wait for a new round of choices rather than relying on the timer.
      await expect.poll(async () => {
        const current = await page.locator('#answers .answer').allTextContents();
        return current.join('|');
      }, { timeout: 5000 }).not.toBe((await page.locator('#answers .answer').allTextContents()).join('|'));
    }
  });
}

test('homepage contains the Daily Challenge and individual games do not offer it as a mode', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href*="daily-challenge/"]')).toBeVisible();
  const logoLink = page.locator('a[href*="guess-the-brand-logos/"]').first();
  await expect(logoLink).toBeVisible();
  await logoLink.click();
  await expect(page.locator('#game')).toHaveClass(/active/);
  await expect(page.getByText(/adaptive random logos|play the daily mix|daily challenge/i)).toHaveCount(0);
});
