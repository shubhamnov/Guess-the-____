const { test, expect } = require('@playwright/test');

// Football, Tennis and F1 have hard questions (tagged in data/sports.js). They wait until question 9, and every
// question still has four different options with the right answer among them.
for (const topic of ['football', 'tennis', 'f1']) {
  test(`guess-the-${topic}: hard questions only after the warm-up, and every question is well formed`, async ({ page }) => {
    await page.goto('how-to-play/');
    const res = await page.evaluate(async t => {
      const f = document.createElement('iframe'); f.src = '../guess-the-' + t + '/?mix'; document.body.appendChild(f);
      await new Promise(ok => f.onload = ok);
      const X = f.contentWindow.GuessGameExport; await X.ready;
      let early = 0, hard = 0, bad = [];
      for (let s = 0; s < 10; s++) {
        // The export starts at question 3, so the first 6 questions are questions 3 to 8.
        X.questions('hard' + s, 40).forEach((q, i) => {
          if (q.level === 'Hard') { if (i < 6) early++; else hard++; }
          if (q.options.length !== 4 || new Set(q.options).size !== 4 || !q.options.includes(q.answer)) bad.push(q.answer);
        });
      }
      return { early, hard, bad };
    }, topic);
    expect(res.early).toBe(0);
    expect(res.hard).toBeGreaterThan(20);
    expect(res.bad).toEqual([]);
  });
}
