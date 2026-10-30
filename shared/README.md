# Shared game engine

Every game page loads `engine.css` and `engine.js`, then calls `GuessGame.run(config)` with its own data. The engine builds the page and handles the game loop, scoring, timer, sound, keyboard controls, best scores and the share image, so every game behaves the same way.

## Scoring (the same in every game)

- 10 points for each correct answer.
- +5 bonus on every correct answer once you are on a streak of 3 or more.
- Wrong answers score 0 and reset the streak.
- Timed games last 60 seconds. Photo rounds (Landmarks, Cuisine) have 10 questions; the Daily Mix has 14.
- Personal bests are stored in `localStorage` under `gtq:best:<game id>`. Older per-game keys are converted once through `legacyBest` (games that used to score 1 point per answer are multiplied by 10).

## Shared behaviour

- **Keyboard:** 1–4 pick an answer, Enter moves to the next photo or Daily Mix question and starts another round from the results screen, M toggles sound.
- **Timed games pause** while the tab is hidden.
- **Harder choices after warm-up:** from the sixth question, `ctx.hard` is true and games pick wrong answers from the same group (continent, animal group, script region, and so on).
- **Sound** uses one `AudioContext`, created after the first tap or key press. The on/off choice is shared across games (`gtq_sound`).

## Config fields

| Field | Purpose |
| --- | --- |
| `id`, `label` | Storage id and display name. |
| `mode` | `'timed'` (default) or `'round'`. |
| `eyebrow`, `titleHtml`, `intro`, `note`, `previewHtml`, `pill` | Intro screen text. |
| `prompt` | Default question text (a question can override it). |
| `next(ctx)` | Timed mode: returns the next question. |
| `makeRound(ctx)` | Round mode: returns the list of questions for one round. |
| `load()` | Optional async loader (for example, fetching a catalog). |
| `onStart(ctx)`, `onAnswer(q, right, ctx)` | Optional hooks. |
| `formatOption(value)` | Optional display text for an answer value. |
| `legacyBest` | Old storage keys to convert into the shared best score. |
| `links` | Extra links on the intro and results screens. |
| `autoStart` | Defaults to `true`; the Daily Mix sets it to `false` to show its intro. |

A question is `{answer, options, render(clueElement), prompt?, level?, explanation?, credit?(el), clueClass?, category?}`. `ctx.util` provides `shuffle`, `pick`, `deck` (draw without repeats) and `choices` (four unique options, same-group first when `hard` is set).

`world.js` lists all 195 countries with their flag file code and continent. Flags, Capital Cities and Currencies use it.
