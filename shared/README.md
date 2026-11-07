# Shared game engine

Every game page loads `engine.css` and `engine.js`, then calls `GuessGame.run(config)` with its own data. The engine builds the page and handles the game loop, scoring, timer, sound, keyboard controls, best scores and the share image, so every game behaves the same way.

## Scoring (the same in every game)

- Every game lasts 60 seconds, including the photo games and the Daily Mix.
- +10 points for a right answer, −5 for a wrong one. A total can go below zero; a personal best is only saved when it is above the previous best (which starts at 0).
- The streak is still shown, but it doesn't change the score.
- To change the rules, edit `SCORING` at the top of `engine.js`; every game reads it.
- Personal bests are stored in `localStorage` under `gtq:best:<game id>`. Older per-game keys are converted once through `legacyBest` (games that used to score 1 point per answer are multiplied by 10).

## Shared behaviour

- **Keyboard:** 1–4 pick an answer, Enter starts another game from the results screen, M toggles sound.
- **The clock pauses** while the tab is hidden.
- **Several question types per game:** a game lists its `formats` (for example Flags: name the country, find the flag, name the continent). The first three questions use the main format; after that `ctx.format(list)` mixes them, with the main format twice as likely.
- **Harder choices after warm-up:** from the sixth question, `ctx.hard` is true and games pick wrong answers from the same group (continent, animal group, script region, and so on).
- **Sound** uses one `AudioContext`, created after the first tap or key press. The on/off choice is shared across games (`gtq_sound`).

## Config fields

| Field | Purpose |
| --- | --- |
| `id`, `label` | Storage id and display name. |
| `eyebrow`, `titleHtml`, `intro`, `note`, `previewHtml`, `pill` | Intro screen text. |
| `prompt` | Default question text (a question can override it). |
| `next(ctx)` | Returns the next question (most games). |
| `makeRound(ctx)` | Alternative to `next`: returns a prepared list of questions (photo games, Daily Mix). The game ends early if the list runs out before 60 seconds. |
| `load()` | Optional async loader (for example, fetching a catalog). |
| `onStart(ctx)`, `onAnswer(q, right, ctx)` | Optional hooks. |
| `formats` | Names of the question types, shown on the intro screen. |
| `formatOption(value)` | Optional display text for an answer value. |
| `legacyBest` | Old storage keys to convert into the shared best score. |
| `links` | Extra links on the intro and results screens. |
| `homeHref`, `homeLabel` | Where the "back" link on the intro and results screens goes. Defaults to the game's category page (from `shared/games.js`) and its name. |
| `autoStart` | Defaults to `true`; the Daily Mix sets it to `false` to show its intro. |
| `onFinish(result)` | Optional: called with `{score, correct, answered, best, seconds, allDone}` when a game ends. |
| `replay` | Set to `false` to hide "Play again" (live mode does this). |
| `pauseWhenHidden` | Set to `false` to keep the clock running when the tab is hidden (live mode, so both players get the same 60 seconds). |
| `live` | Set to `true` for a page that is always played live (the Live Mix). Any other game goes live when opened with `?live`. |
| `liveLink` | Set to `false` to leave out "With a friend": the header Solo / With a friend chip (a plain pill with `pill` text shows instead) and the "⚡ Play with a friend" buttons. |
| `onRegion(region)` | Optional: the game follows the Global / India / Both switch (see below). Rebuild the question pools; return the new intro note or nothing. |
| `friendText` | Text for the "⚡ Play with a friend" button on the intro screen (only games with `autoStart:false` show one). |

`GuessGame.run` returns `{toast, start, ctx, …}`; `start(seed)` begins a game from code. `ctx` also exposes `score`, `correct`, `answered`, `live` and `seed`.

## Global / India / Both

One switch for the whole site, in `shared/region.js` (saved in `localStorage` as `gtq:region`; `?region=global|india|both` overrides it for one visit; live games always use Both).
- **First visit:** any page that is not live or a mix frame asks once (India, Global or Both) and saves the answer. Closing it keeps Both. Games wait for the answer before their clock starts.
- **Everywhere else:** a small 🇮🇳 / 🌍 / 🌐 button at the top right of every page (`GTQRegion.toggle`) opens a three-way menu. The full switch is on the Settings page (`settings/`), linked from the top of the home page. Cards marked `data-region="india"` (Bollywood) are hidden in Global.
- **Engine games:** load `region.js` (every game page does, for the top-right button), build the question pools from `GTQRegion.get()`, and pass `onRegion(region)` to `GuessGame.run`. It rebuilds the pools and may return a new intro note. The engine puts the top-right button in the header; changing it mid-round restarts the round. `reloadOnRegion: true` reloads the page instead (the Daily Mix). Series, Web Series and Sports do this.
- **Name Them All:** topics with `region:'india'` or `region:'global'` follow the switch; topics without one always show.
- Games with no India-specific content (geography, science, logos) ignore it.

## Live mode
Open any game with `?live` to play it against a friend on another device (`/live/` lists them all; `?live=CODE` joins a room).
- `shared/live.js` (loaded by the engine only in live mode, after `shared/vendor/peerjs.min.js`) runs the room: lobby, invite link, connecting, 3-2-1 countdown, live score strip, head-to-head result, running tally and rematch. See `race/README.md` for how devices connect.
- **Same questions on both devices without game-specific code.** For each round the host picks a random seed and sends it. While the engine builds a question (`onStart`, `makeRound`, `next`, `render`, `renderOption`) it swaps `Math.random` for a generator seeded from it, so both devices build the same questions. Use `ctx.util.shuffle/pick/choices` or `Math.random` in those functions and live mode just works.
- Question building must not depend on how a player is doing or on the real clock. In live mode `ctx.elapsed` is based on the question number (2.5 s per question), so games that get harder over time stay in step. A game that adapts to the player's answers should check `ctx.live` (Brand Logos raises its level by question number there instead of by streak).
- A room code from another game takes the guest to the host's game.

A question is `{answer, options, render(clueElement), prompt?, kind?, level?, explanation?, answerText?, renderOption?(value, button), credit?(el), clueClass?, category?}`. `kind` labels the question type, and `renderOption` turns the answers into pictures (flags, swatches, logos, outlines). `ctx.util` provides `shuffle`, `pick`, `deck` (draw without repeats), `choices` (four unique options, same-group first when `hard` is set) and `bigClue` (a large text clue).

`world.js` lists all 195 countries with their flag file code and continent. Flags, Capital Cities and Currencies use it.

## Where things live

- `guess-the-*/index.html` — one page per game: the game's config and question logic.
- `data/*.js` — each game's question list, one row per line, so you can add or fix questions without touching code.
- `catalogs/*.json` — the photo catalogs for Landmarks and Cuisine (see `catalogs/README.md`).
- `brand-logos.js` — logo data. `daily-challenge-data-v1.js` — the flag-code list `scripts/cache_flag_images.py` caches.
- `shared/games.js` — the categories and every engine game in them (see "Categories" below). `shared/mix.js` — builds the Daily Mix, the Live Mix and the category mixes from it.
- `index.html` + `shared/home.css` — the home page: Daily Mix, "Jump back in", and one card per category.
- `<category>/index.html` (`world/`, `movies-tv/`, `sports/`, `science-nature/`, `general-knowledge/`) — a category page: "Play the mix" and one card per topic. `<category>/mix/` runs `shared/category-mix.js`, a mix of that category's topics (Sports uses Guess the Sports).
- `shared/cards.js` — shared by the home and category pages: the Solo / With a friend sheet for `data-play` cards, best scores on `data-id` cards, hiding `data-region` cards, topic counts, and "Jump back in" (`gtq:recent`, the last 8 games, written by the engine when a game starts).
- `shared/sports-game.js` + `data/sports.js` — every sports page. `window.GTQ_SPORTS_TOPIC` picks the topic: `sports` (all of them), `cricket`, `football`, `tennis`, `f1`, `olympics` or `more-sports`.
- `shared/live.js` — live mode (see above). `shared/vendor/peerjs.min.js` is the PeerJS library it uses to connect the devices.
- `shared/mode-switch.js` — the Solo ⇄ With a friend chip in every game header. If a round is running, or a friend is in the room, it asks “Play with a friend instead?” / “Leave the room and play solo?” before leaving; a solo clock pauses while it asks. Load it after `engine.js` (Name Them All attaches it itself).
- `live/` — the "Play live" page: Mix of everything, or pick a category. `race/` — the Live Mix (questions from every category; see `race/README.md`).

## Categories

`shared/games.js` has two lists. `GTQ_CATEGORIES` is the home page cards (`{id, label, emoji, blurb, mix}`; `id` is the folder, `mix` the folder of its mix game; Name Them All has `href` instead). `GTQ_GAMES` is every topic (`{path, label, emoji, id, cat}`, plus `region:'india'` for an all-Indian game and `sub:true` for a sports topic whose questions are already in Guess the Sports, so the Daily Mix and Live Mix skip it).

## The mixes: one question from every game

Four places read `GTQ_GAMES`:

- **Daily Mix** (`daily-challenge/`): one question from every game, the same for everyone on a given date.
- **Live Mix** (`race/`): two questions from every game for each live round.
- **Category mixes** (`<category>/mix/`): questions from that category's topics only (`GTQMix.load(region, category)`).
- **Play live** (`live/`): each category's mix, then its topics.

`shared/mix.js` loads each listed game in a hidden iframe with `?mix`. In that mode `GuessGame.run(cfg)` builds no page. It sets `window.GuessGameExport` with `questions(seed, count)`, which calls the game's own `next`/`makeRound` with a generator seeded from the seed and the game id. So the mix questions come from the game's real code and data, and they're the same on every device. The Daily Mix follows the Global / India / Both switch (`GTQMix.load(region)`: games marked `region` in games.js are left out of the other region, and each game frame gets `?mix&region=`); the Live Mix uses Both. A game that fails to load within 20 seconds is left out rather than breaking the mix.

### Adding a new game

1. Make `guess-the-<name>/index.html` with `GuessGame.run(cfg)`.
2. Add `{path, label, emoji, id, cat}` to `shared/games.js`, in its category's place.
3. Add a card to its category page (`<category>/index.html`) with `data-play data-id="<id>"`. Give it `data-region="india"` if all of its content is Indian.
4. Add the game to the `games` list in `tests/browser-smoke.spec.js`.
5. If some items are India-specific, tag them `region` and filter with `GTQRegion.keep` (see "Global / India / Both").

The Daily Mix, the Live Mix, the category mix and the live page then include it automatically. `tests/registry.spec.js` fails if step 2, 3 or 4 is missing, or if the game can't hand questions to the mix.
