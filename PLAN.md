# Guess the ____ — plan

Written 13 November 2026 after a full play-through review. It lists what to fix, what to build next, and how to
do each item, so any later session can pick one item and finish it without re-reading the whole project.

How to use this plan: do one numbered item at a time, in order within a phase. Each item says which files to
touch, what "done" means, and how to check it. Tick the box when it is pushed.

---

## 0. What the next session needs to know

**The site.** Static GitHub Pages site, no build step. Every quiz page calls `GuessGame.run(cfg)` from
`shared/engine.js`. `shared/README.md` documents every shared file; read it before changing shared code.

**Where things are.**

| Thing | Where |
|---|---|
| List of categories and games (one source of truth) | `shared/games.js` |
| Game engine: clock, score, result, share image, live mode | `shared/engine.js`, `shared/engine.css` |
| Mixes: Daily Mix, category mixes, mix of everything | `shared/mix.js`, `shared/category-mix.js`, `daily-challenge/`, `mix/` |
| Home and category page cards, Solo / With a friend sheet | `shared/cards.js`, `shared/home.css` |
| Global / India / Both switch | `shared/region.js` |
| Sports topics (one script, six pages) | `shared/sports-game.js`, `data/sports.js` |
| Question data | `data/*.js`, `catalogs/*.json` (photo games) |
| Name Them All (typing game, own code) | `name-them-all/`, `data/name-them-all.js` |
| Tests | `tests/*.spec.js` (Playwright) |

**Rules that must keep holding.**

- Every game: 60 seconds, 4 choices, +10 right, −5 wrong. Do not change scoring per game.
- A game added to `shared/games.js` must appear on its category page, the live page, the Daily Mix and the
  mixes. `tests/registry.spec.js` checks this; add a smoke test for every new game in `tests/browser-smoke.spec.js`.
- Mix pages render other games' questions. Build asset URLs with `new URL(path, location.href)` inside a game,
  never a bare `../assets/...` that is read back later (see "Mix export" in `shared/README.md`).
- India-only questions are tagged and hidden in Global. Bollywood shows in every mode.
- Saved data keys: `gtq:best:<id>`, `gtq:recent`, `gtq:region`, `gtq:daily:<date>`. Never rename a key without
  migrating the old one, or players lose their scores.

**Before every push.**

```bash
python3 scripts/validate_catalogs.py
```

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test --trace off --reporter=line
```

All tests must pass (119 at the time of writing). Then check the changed page at 375×667 and 1100 wide.

---

## Phase 1 — Fixes (do first, about one session)

### [ ] 1.1 Photo answers fall off small screens — highest priority
**Problem.** In Landmarks and Cuisine on a 375×667 phone, the second row of answers is 37–50px below the
screen on every question. Players must scroll while the clock runs. Also hits photo questions in the World
mix, the mix of everything and the Daily Mix.

**Cause.** `shared/engine.css` line ~142: `.clue.photo{height:clamp(240px,42vh,380px)}`. The 240px floor is too
tall for short screens.

**Fix.** Size the photo from the space left, not from a fixed floor:
- Change to `height:clamp(150px,calc(100dvh - 430px),380px)` (430px ≈ header + stats + prompt + two answer
  rows; measure and adjust).
- Under `@media(max-height:700px)`, also reduce `.game` gaps and hide `.keys-hint` (keyboard hint is useless
  on a phone).

**Done when.** At 375×667, 360×640 and 390×844 the last answer button's bottom edge is inside the viewport
for 20 questions in Landmarks, Cuisine and `world/mix/`. Add this as a test in `tests/browser-smoke.spec.js`
(measure `getBoundingClientRect().bottom <= innerHeight`).

### [ ] 1.2 Load the next photo ahead of time
**Problem.** A photo (average 100 KB, largest 285 KB) starts downloading only when its question appears, so
the box is blank for the first moment, longer on mobile data.

**Fix.**
- In Cuisine and Landmarks, give each question an `image` URL field the engine can read (they already have
  `q.image.url`). Add `preload: absoluteUrl` to the question object.
- In `shared/engine.js` `next()`: after showing question N, if the round is a list (`fromList`), create
  `new Image().src = S.round[N+1].preload` for the next two questions. Do the same in `exportGame` output so
  mixes can preload: mix pages call it on `questions[i+1].preload`.
- Flags are tiny; skip them.
- Also re-encode the 10 largest photos in `assets/cuisines` and `assets/landmarks` to under 150 KB
  (`cwebp -q 72 -resize 1000 0`). Keep file names.

**Done when.** With network throttled to "Fast 3G" in a Playwright test, question 2 onward shows its photo
(`img.complete && naturalWidth > 0`) within 300 ms of appearing.

### [ ] 1.3 Give direct visitors a start screen
**Problem.** Every game starts the clock the moment the page opens. Fine after the Solo / Friend sheet, but
someone opening a shared link or "Jump back in" loses seconds and never sees the rules.

**Fix.** Start immediately only when the player just chose to play. In `shared/cards.js`, the Solo link adds
`?go` (or sets `sessionStorage.gtqGo=1`). In `shared/engine.js` line ~442, auto-start only when that flag is
present; otherwise show the intro screen (it already exists) with "Let's play". Remove the flag from the URL
with `history.replaceState`. "Play again" keeps starting instantly.

**Done when.** Opening `guess-the-flag/` directly shows the intro; choosing Solo from a card starts at once.
Update the many tests that assume auto-start: add a helper `openGame(page, path)` that appends `?go`.

### [ ] 1.4 Small consistency fixes
- Sports page headline: change "Know your sports?" to "Sports" styled like the other category pages
  (`sports/index.html`).
- The live page's "Mix of everything" points at `race/`; the home card's friend option points at
  `mix/?live=new`. Pick one: make `live/index.html` link to `../mix/?live` and turn `race/` into a redirect to
  `mix/` that keeps the `?live=CODE` query (old invite links must keep working). Update `index.html` join form
  (`./race/?live=`) only if the redirect is in place.
- Home page on phones: make the three info cards (How to play / About / Settings) one compact row of chips
  below the category grid's heading, so the mix and Daily Mix sit higher. **Ask Shubham first** — they asked
  for these at the top.

### [ ] 1.5 Verify on the live site
The review ran on local code only. After 1.1–1.4 are deployed, run the suite against production:

```bash
BASE_URL=https://shubhamnov.github.io/Guess-the-____/ npx playwright test --trace off
```

(The post-deploy workflow does this; read its result in GitHub Actions.) Play one friend game on two real
phones — live mode could not be tested from the cloud session.

---

## Phase 2 — Fill the thin spots (content, no new mechanics)

Each item is data work. Pattern to copy: an existing `data/*.js` file plus its `guess-the-*/index.html`.

### [ ] 2.1 More photos for the photo games
Cuisine has 100 questions, Landmarks 200, Scripts 104. Repeat players see repeats within a few rounds.
- Target: Cuisine 200, Landmarks 300.
- Process is documented in `catalogs/README.md`: find candidates (`scripts/find_photo_candidates.py`), check
  licence (Wikimedia Commons, CC BY / CC BY-SA / public domain only), cache
  (`scripts/cache_cuisine_images.py`, `scripts/cache_landmark_images.py`), then `validate_catalogs.py`.
- Every photo needs creator, licence and source page (the credit line under the photo uses them).
- Each new photo ≤150 KB, 1000px wide.

### [ ] 2.2 General Knowledge: from 2 topics to 5
Add three topics (new folders, register in `shared/games.js` with `cat:'general-knowledge'`):

| New topic | Folder / id | Question types | Source data to write |
|---|---|---|---|
| Inventions & Discoveries | `guess-the-inventions` / `inventions` | "Who invented X?", "What did X invent?", "Which decade?" | ~150 rows: invention, inventor, year, country |
| History | `guess-the-history` / `history` | "Which year?", "Who was…?", "Which empire/war?" | ~200 rows: event, year, people, place; tag India rows |
| Space | `guess-the-space` / `space` | Planets, missions, astronauts, "which is bigger" | ~150 rows; include ISRO missions tagged India |

(Space could sit in Science & Nature instead; decide by which category is thinner at the time.)

### [ ] 2.3 Science & Nature: from 3 topics to 5
| New topic | Folder / id | Question types |
|---|---|---|
| Human Body | `guess-the-body` / `body` | Organs, bones, "which system", numbers (206 bones) |
| Plants & Food Science or Dinosaurs | pick one | Emoji / description clues, like Animals |

### [ ] 2.4 Hard tier for every topic
Sports topics already hold hard questions back until question 9 (`tier` in `shared/sports-game.js`). Do the
same in Flags (obscure flags), Capitals (small states), Elements (lanthanides), Hollywood / Bollywood (older
films): add `hard:1` to data rows, filter with `deck.draw(filter)`, and show the "Hard" level label.

### [ ] 2.5 Fact check pass
Nobody has verified answers end to end. For each `data/*.js` file, review rows in batches of 100 for wrong or
outdated answers (leaders, records, champions change). Record the date checked at the top of the file.
World Politics and Sports records go stale fastest — recheck them every few months.

---

## Phase 3 — New games (new mechanics)

Ordered by value for effort. Each is a normal engine game unless noted.

### [ ] 3.1 Guess the Song (Movies & TV, or a new Music category)
- Clues: lyric line (short, text only — do not host audio or long lyrics), emoji of the title, "which film is
  this song from", "who sang it".
- Bollywood and international sets; tag India rows.
- Keep quoted lyrics to one short line each.

### [ ] 3.2 Higher or Lower (new mechanic, 2 choices)
- "Which has more people: Brazil or Nigeria?" Reuses `data/countries.js` (population, area), `data/elements.js`
  (atomic number), film release years.
- Engine supports 4 choices; allow `options.length===2` (check the `.answers` grid CSS and keys 1–2).
- Good fit for mixes because it needs no new data.

### [ ] 3.3 Map games (World & Places)
- "Which country is highlighted?" on a world or continent map. `guess-the-countries` already draws outlines;
  extend it with a neighbours format: "Which country borders X?" (needs a borders table, ~200 rows).
- Then "Guess the City" from a skyline photo — same pipeline as Landmarks (2.1).

### [ ] 3.4 Timeline (new mechanic)
- "Which came first?" (2 choices) and "Put in order" (tap 4 items in order; +10 if all right).
- "Put in order" needs a new answer mode in the engine: add `q.mode='order'` handled in `next()` and the
  answer click handler; live mode must send the same result shape.
- Data comes from History (2.2), films and sports champions already in the repo.

### [ ] 3.5 More Name Them All topics
41 topics now. Cheap to add in `data/name-them-all.js`: US states, elements by group, F1 champions, Oscar Best
Picture winners, cricket World Cup winners, Indian rivers, capital cities of Europe. Also finish the pending
item: live (friend) mode for Name Them All — check `tests/live.spec.js` for what already works.

### [ ] 3.6 Pending from earlier sessions
- Series / Web Series: more international shows, and confirm the region switch filters them well.
- Re-check that every new topic above joins the Daily Mix without making it too long: the Daily Mix asks one
  question per game in 60 seconds. Above about 22 games most players cannot finish. When the count passes 22,
  change the Daily Mix to pick a dated, seeded subset of 20 games (`daily-challenge/index.html`, `makeRound`).

---

## Phase 4 — Reasons to come back

### [ ] 4.1 Daily streak
The first score of each day is already saved (`gtq:daily:<date>`). Count consecutive days and show
"🔥 5-day streak" on the home Daily Mix strip and on the result screen. Pure client-side; no new storage key
needed (derive from existing keys), but keep only the last 60 days of keys.

### [ ] 4.2 Result screen: review what you missed
After a round, list the questions answered wrong with the right answer. The engine knows `S.q` per question;
collect `{prompt, answer, picked}` in `finish()`. Biggest learning feature for the least work.

### [ ] 4.3 Stats page
`stats/index.html`: best score per game, games played, accuracy per category, Daily Mix history. All from
localStorage. Add games-played and accuracy counters in the engine's `finish()` (`gtq:stats`).

### [ ] 4.4 Install as an app and work offline
Add `manifest.webmanifest` and a service worker that caches shared files, data and flags (not all photos).
**Careful:** a service worker can serve stale files after a deploy — the broken-images report in November
came from a caching delay alone. Use a versioned cache name, network-first for HTML and JS, and test an
update before shipping.

### [ ] 4.5 Sharing
The result image exists. Add a Daily Mix text share in the style of emoji grids
("Daily Mix 7 Nov · 140 pts · 🟩🟩🟥🟩…") — copies well into WhatsApp.

### [ ] 4.6 Later, needs a backend (decide before starting)
Global leaderboards, accounts and saved progress across devices cannot be done on GitHub Pages alone. Options:
a free Firebase / Supabase tier. This adds privacy and cost questions — do not start without Shubham's go-ahead.

---

## Suggested order

1. Phase 1 complete (1.1 and 1.2 first).
2. 4.2 (review missed answers) and 4.1 (streak) — small, high value.
3. 2.2 and 2.3 (even out the categories), then 3.6's Daily Mix cap.
4. 3.2 Higher or Lower, 3.1 Song.
5. 2.1 photos and 2.5 fact check, in the background over time.
6. 3.3, 3.4, 4.3, 4.4.

## How to add a new game — checklist

1. Copy the closest existing game folder; set `id`, `label`, data file.
2. Put data in `data/<name>.js`; tag India-only rows; add `hard` where it applies.
3. Register in `shared/games.js` (`path`, `label`, `emoji`, `id`, `cat`).
4. Add its card to the category page (`<category>/index.html`) with `data-play` and `data-id`.
5. Update topic counts shown on the home card (cards.js fills `data-topics` automatically — check it).
6. Add a smoke test in `tests/browser-smoke.spec.js`; run the full suite.
7. Play it at 375×667, in the category mix and with `?live=new`.
8. Update `shared/README.md` and the tables in this plan.
