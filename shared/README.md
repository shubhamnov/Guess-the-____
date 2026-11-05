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
| `replay` | Set to `false` to hide "Play again" (the live race does this). |
| `pauseWhenHidden` | Set to `false` to keep the clock running when the tab is hidden (the live race, so both players get the same 60 seconds). |

`GuessGame.run` returns `{toast, start}`; `start()` begins a game from code (the race starts both phones this way). `ctx` also exposes `score`, `correct` and `answered`.

A question is `{answer, options, render(clueElement), prompt?, kind?, level?, explanation?, answerText?, renderOption?(value, button), credit?(el), clueClass?, category?}`. `kind` labels the question type, and `renderOption` turns the answers into pictures (flags, swatches, logos, outlines). `ctx.util` provides `shuffle`, `pick`, `deck` (draw without repeats), `choices` (four unique options, same-group first when `hard` is set) and `bigClue` (a large text clue).

`world.js` lists all 195 countries with their flag file code and continent. Flags, Capital Cities and Currencies use it.

## Where things live

- `guess-the-*/index.html` — one page per game: the game's config and question logic.
- `data/*.js` — each game's question list, one row per line, so you can add or fix questions without touching code.
- `catalogs/*.json` — the photo catalogs for Landmarks and Cuisine (see `catalogs/README.md`).
- `brand-logos.js`, `daily-challenge-data-v1.js`, `brand-logos-daily-v1.js` — logo data and the frozen Daily Mix snapshot.
- `shared/daily-mix-v1.js` — the frozen Daily Mix question builder, used by the Daily Mix page and the race.
- `race/` — test version of the live two-phone race (see `race/README.md`). `shared/vendor/peerjs.min.js` is the PeerJS library it uses to connect the phones.
