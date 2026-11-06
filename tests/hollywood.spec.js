const { test, expect } = require('@playwright/test');

// Animated films are voiced: their actor questions offer only voice actors, and live-action questions never offer a
// voice-only actor (such as Ellen DeGeneres from Finding Nemo) as a wrong answer.
test('Hollywood keeps film stars and voice actors apart', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('live/');
  const result = await page.evaluate(async () => {
    const f = document.createElement('iframe');
    f.src = '../guess-the-hollywood/?mix';
    document.body.appendChild(f);
    await new Promise(r => (f.onload = r));
    const w = f.contentWindow, exp = w.GuessGameExport;
    await exp.ready;
    const D = w.GTQ_DATA, animated = new Set(D.hollywoodAnimated);
    const missing = D.hollywoodAnimated.filter(t => !D.hollywood.some(r => r[0] === t));
    const live = new Set(), voice = new Set();
    D.hollywood.forEach(r => r[2].forEach(a => (animated.has(r[0]) ? voice : live).add(a)));
    const filmOf = q => D.hollywood.find(r => q.explanation.includes(r[0] + ' (' + r[1] + ')'));
    const bad = [];
    let checked = 0;
    for (let s = 0; s < 80; s++) {
      for (const q of exp.questions('hw' + s, 30)) {
        if (!['Star', 'Co-star', 'Who said it?'].includes(q.kind)) continue;
        const film = filmOf(q);
        if (!film) { bad.push('no film for ' + q.explanation); continue; }
        checked++;
        const isAnimated = animated.has(film[0]);
        for (const o of q.options) {
          if (o === q.answer) continue;
          if (isAnimated ? !voice.has(o) : !live.has(o)) bad.push(q.kind + ' · ' + film[0] + ' offers ' + o);
          if (film[2].includes(o)) bad.push(q.kind + ' · ' + film[0] + ' offers its own cast member ' + o);
        }
        if (isAnimated && !/voice/i.test(q.prompt)) bad.push('animated prompt: ' + q.prompt);
      }
    }
    return { missing, bad: [...new Set(bad)].slice(0, 10), checked };
  });
  expect(result.missing).toEqual([]);
  expect(result.checked).toBeGreaterThan(100);
  expect(result.bad).toEqual([]);
});
