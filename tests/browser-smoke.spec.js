const { test, expect } = require('@playwright/test');

const DAILY_2026_01_15_FIRST_OPTIONS = ['Mauritania', 'United Arab Emirates', 'Slovenia', 'Slovakia'];

const games = [
  { name: 'Colors', path: 'guess-the-color/', kind: 'timed' },
  { name: 'Flags', path: 'guess-the-flag/', kind: 'timed' },
  { name: 'Countries', path: 'guess-the-countries/', kind: 'timed' },
  { name: 'Landmarks', path: 'guess-the-landmarks/', kind: 'photo' },
  { name: 'Cuisine', path: 'guess-the-cuisine/', kind: 'photo' },
  { name: 'Animals', path: 'guess-the-animals/', kind: 'timed' },
  { name: 'Capital Cities', path: 'guess-the-capitals/', kind: 'timed' },
  { name: 'Scripts', path: 'guess-the-scripts/', kind: 'timed' },
  { name: 'Brand Logos', path: 'guess-the-brand-logos/', kind: 'logo' },
  { name: 'Currencies', path: 'guess-the-currencies/', kind: 'timed' },
  { name: 'Elements', path: 'guess-the-elements/', kind: 'timed' },
  { name: 'Languages', path: 'guess-the-languages/', kind: 'timed' },
  { name: 'Bollywood', path: 'guess-the-bollywood/', kind: 'timed' }
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
      if (game.name === 'Landmarks') {
        const labels = await page.locator('#answers .answer').allTextContents();
        expect(labels.every(label => /\(.+\)$/.test(label))).toBe(true);
      }
      await page.screenshot({ path: `test-results/${game.name.toLowerCase().replace(/\s+/g, '-')}-loaded-photo.png`, fullPage: true });
    }
  });
}

for (const game of games) {
  test(`${game.name} gives answer feedback, sound, and advances automatically`, async ({ page }) => {
    await page.goto(game.path, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('#game').evaluate(el => el.classList.contains('active'))).toBe(true);
    const firstLogo = game.kind === 'logo' ? await page.locator('#clue img').getAttribute('src') : null;
    const firstLabel = await page.locator('#roundLabel').innerText();
    const firstOptions = await page.locator('#answers .answer').allTextContents();
    const before = await page.evaluate(() => window.__quizOscillatorStarts || 0);
    await page.locator('#answers .answer').first().click();
    await expect(page.locator('#feedback')).not.toBeEmpty();
    await expect.poll(() => page.evaluate(() => window.__quizOscillatorStarts || 0)).toBeGreaterThan(before);
    if (game.kind === 'photo') {
      await expect.poll(() => page.locator('#roundLabel').innerText(), { timeout: 5000 }).not.toBe(firstLabel);
    } else if (game.kind === 'logo') {
      await expect.poll(() => page.locator('#clue img').getAttribute('src')).not.toBe(firstLogo);
    } else {
      // Timed games replace their answer set as soon as feedback is shown.
      await expect.poll(async () => {
        const current = await page.locator('#answers .answer').allTextContents();
        return current.join('|');
      }, { timeout: 5000 }).not.toBe(firstOptions.join('|'));
    }
  });
}


for (const catalog of [
  { name: 'Cuisine', route: 'guess-the-cuisine/', catalogUrl: '../catalogs/cuisines-v1.json', assetPrefix: '/assets/cuisines/', screenshot: 'cuisine-contact-sheet.png', columns: 5 },
  { name: 'Landmarks', route: 'guess-the-landmarks/', catalogUrl: '../catalogs/landmarks-v1.json', assetPrefix: '/assets/landmarks/', screenshot: 'landmarks-contact-sheet.png', columns: 4 }
]) {
  test(`all ${catalog.name.toLowerCase()} photos load and produce a review contact sheet`, async ({ page }) => {
    await page.goto(catalog.route, { waitUntil: 'domcontentloaded' });
    const records = await page.evaluate(async ({ catalogUrl, assetPrefix }) => {
      const response = await fetch(catalogUrl);
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const data = await response.json();
      const results = [];
      for (const question of data.questions) {
        const src = new URL(question.image.url, location.href);
        if (!src.pathname.includes(assetPrefix)) throw new Error(`Non-local photo path: ${src.pathname}`);
        const loaded = await new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve({ ok: img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
          img.src = src.href;
        });
        results.push({ id: question.id, answer: question.answer, src: src.href, ...loaded });
      }
      return results;
    }, { catalogUrl: catalog.catalogUrl, assetPrefix: catalog.assetPrefix });
    expect(records.length).toBeGreaterThan(0);
    expect(records.every(record => record.ok)).toBe(true);
    const base = page.url();
    await page.setContent(`<!doctype html><html><head><base href="${base}"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:16px;color:#20231e;background:#f6f5ef}
      h1{font-size:24px;margin:0 0 12px}p{font-size:12px;color:#555;margin:0 0 18px}
      .grid{display:grid;grid-template-columns:repeat(${catalog.columns},minmax(0,1fr));gap:12px}
      article{background:white;border:1px solid #ddd;border-radius:10px;overflow:hidden;padding:8px}
      img{width:100%;height:130px;object-fit:contain;background:#eee}
      b{display:block;font-size:13px;margin-top:7px}small{display:block;color:#666;font-size:10px;margin-top:3px}
    </style></head><body><h1>${catalog.name} · photo review</h1><p>${records.length} local images · image previews and intended answers for manual visual review</p><div class="grid">${records.map(r => `<article><img src="${r.src}" alt=""><b>${r.answer}</b><small>${r.id} · ${r.width}×${r.height}</small></article>`).join('')}</div></body></html>`);
    await page.waitForFunction(() => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0));
    await page.screenshot({ path: `test-results/${catalog.screenshot}`, fullPage: true });
  });
}

test('homepage contains the Daily Challenge and individual games do not offer it as a mode', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href*="daily-challenge/"]')).toBeVisible();
  const logoLink = page.locator('a[href*="guess-the-brand-logos/"]').first();
  await expect(logoLink).toBeVisible();
  await logoLink.click();
  // Tapping a game asks Solo or With a friend first.
  await page.locator('#sheetSolo').click();
  await expect(page.locator('#game')).toHaveClass(/active/);
  await expect(page.getByText(/adaptive random logos|play the daily mix|daily challenge/i)).toHaveCount(0);
});

for (const game of games) {
  test(`${game.name} uses the shared scoring rules`, async ({ page }) => {
    await page.goto(game.path, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('#game').evaluate(el => el.classList.contains('active'))).toBe(true);
    const rules = await page.evaluate(() => ({
      right: window.GuessGame.pointsFor(true),
      wrong: window.GuessGame.pointsFor(false),
      seconds: window.GuessGame.scoring.seconds
    }));
    expect(rules).toEqual({ right: 10, wrong: -5, seconds: 60 });
    await expect(page.locator('#time')).toHaveText(/^(60|59|58)$/);
    await page.keyboard.press('1');
    await expect(page.locator('#feedback')).not.toBeEmpty();
    const score = Number(await page.locator('#score').innerText());
    expect([10, -5]).toContain(score);
  });
}

test('Daily Mix plays all 14 questions within 60 seconds and shows a result', async ({ page }) => {
  await page.goto('daily-challenge/?date=2026-01-15', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#intro')).toBeVisible();
  await page.locator('#startBtn').click();
  for (let i = 1; i <= 14; i++) {
    await expect(page.locator('#roundLabel')).toContainText(String(i).padStart(2, '0'));
    await page.keyboard.press('1');
    if (i < 14) await expect(page.locator('#roundLabel')).toContainText(String(i + 1).padStart(2, '0'), { timeout: 5000 });
  }
  await expect(page.locator('#result')).toHaveClass(/active/);
  await expect(page.locator('#resultEyebrow')).toContainText('ALL DONE');
  await expect(page.locator('#correctCount')).toHaveText(/\/ 14$/);
});

test('Daily Mix questions for a date never change', async ({ page }) => {
  await page.goto('daily-challenge/?date=2026-01-15', { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').click();
  const first = await page.locator('#answers .answer').evaluateAll(bs => bs.map(b => b.dataset.value));
  // Recorded from the Daily Mix v1 builder before the shared-engine change.
  expect(first).toEqual(DAILY_2026_01_15_FIRST_OPTIONS);
});

test('timed games mix several question types', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('guess-the-elements/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#game')).toHaveClass(/active/);
  const kinds = new Set();
  for (let i = 0; i < 16; i++) {
    const label = await page.locator('#roundLabel').innerText();
    kinds.add(label.split(' · ')[1] || 'MAIN');
    await page.keyboard.press('1');
    await expect.poll(() => page.locator('#roundLabel').innerText(), { timeout: 5000 }).not.toBe(label);
  }
  // The first three questions use the main format; after that the formats mix.
  expect(kinds.size).toBeGreaterThan(1);
});
