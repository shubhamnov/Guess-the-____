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
| `autoStart` | Defaults to `true`; the Daily Mix sets it to `false` to show its intro. |
| `onFinish(result)` | Optional: called with `{score, correct, answered, best, seconds, allDone}` when a game ends. |
| `replay` | Set to `false` to hide "Play again" (live mode does this). |
| `pauseWhenHidden` | Set to `false` to keep the clock running when the tab is hidden (live mode, so both players get the same 60 seconds). |
| `live` | Set to `true` for a page that is always played live (the Live Mix). Any other game goes live when opened with `?live`. |
| `liveLink` | Set to `false` to leave out the "Play live with a friend" link. |

`GuessGame.run` returns `{toast, start, ctx, …}`; `start(seed)` begins a game from code. `ctx` also exposes `score`, `correct`, `answered`, `live` and `seed`.

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
- `brand-logos.js`, `daily-challenge-data-v1.js`, `brand-logos-daily-v1.js` — logo data and the frozen Daily Mix snapshot.
- `shared/daily-mix-v1.js` — the frozen Daily Mix question builder, used by the Daily Mix page and the Live Mix.
- `shared/live.js` — live mode (see above). `shared/vendor/peerjs.min.js` is the PeerJS library it uses to connect the devices.
- `live/` — the "Play live" page: Mix of everything, or pick a category. `race/` — the Live Mix (questions from every category; see `race/README.md`).
