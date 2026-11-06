const { test, expect } = require('@playwright/test');

// Animated films and shows are voiced: their actor questions offer only voice actors, and live-action questions never
// offer a voice-only actor (such as Ellen DeGeneres from Finding Nemo) as a wrong answer. Nobody in a title's own cast is
// ever a wrong answer for it.
const GAMES = [
  { path: 'guess-the-hollywood', rows: 'hollywood', animated: 'hollywoodAnimated' },
  { path: 'guess-the-series', rows: 'series', animated: 'seriesAnimated' },
  { path: 'guess-the-web-series', rows: 'webSeries', animated: 'webSeriesAnimated' }
];

for (const g of GAMES) {
  test(g.path + ' keeps screen stars and voice actors apart', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('live/');
    const result = await page.evaluate(async g => {
      const f = document.createElement('iframe');
      f.src = '../' + g.path + '/?mix&region=global';
      document.body.appendChild(f);
      await new Promise(r => (f.onload = r));
      const w = f.contentWindow, exp = w.GuessGameExport;
      await exp.ready;
      const rows = w.GTQ_DATA[g.rows], list = w.GTQ_DATA[g.animated] || [], animated = new Set(list);
      const missing = list.filter(t => !rows.some(r => r[0] === t));
      const live = new Set(), voice = new Set();
      rows.forEach(r => r[2].forEach(a => (animated.has(r[0]) ? voice : live).add(a)));
      const titleOf = q => rows.find(r => q.explanation.includes(r[0] + ' (' + r[1] + ')'));
      const bad = [];
      let checked = 0, voiced = 0;
      for (let s = 0; s < 80; s++) {
        for (const q of exp.questions('va' + s, 30)) {
          if (!['Star', 'Co-star', 'Who said it?'].includes(q.kind)) continue;
          const t = titleOf(q);
          if (!t) { bad.push('no title for ' + q.explanation); continue; }
          checked++;
          const isAnimated = animated.has(t[0]);
          if (isAnimated) voiced++;
          for (const o of q.options) {
            if (o === q.answer) continue;
            if (isAnimated ? !voice.has(o) : !live.has(o)) bad.push(q.kind + ' · ' + t[0] + ' offers ' + o);
            if (t[2].includes(o)) bad.push(q.kind + ' · ' + t[0] + ' offers its own cast member ' + o);
          }
          if (q.options.length !== 4) bad.push(q.kind + ' · ' + t[0] + ' has ' + q.options.length + ' options');
          if (isAnimated && !/voice/i.test(q.prompt)) bad.push('animated prompt: ' + q.prompt);
        }
      }
      return { missing, bad: [...new Set(bad)].slice(0, 10), checked, voiced };
    }, g);
    expect(result.missing).toEqual([]);
    expect(result.checked).toBeGreaterThan(100);
    expect(result.bad).toEqual([]);
  });
}
