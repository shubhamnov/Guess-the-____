# Live mode and the Live Mix

Play against a friend on another device, live. Start from **`/live/`** (linked from the home page): pick **Mix of everything** (`race/`) or any single category (every game page with `?live`). Every game also has a "Play live with a friend" link.

## How it works
- One player taps **Create a room** and sends the invite link (or the 4-letter code).
- The friend opens the link, enters a name and taps **I'm ready**. The creator taps **Start the game**.
- Both devices count down 3-2-1 and play the same questions with the usual rules (60 seconds, +10 / −5).
- A strip above each question shows both scores and progress live. You get a message and a vibration when your friend overtakes you, and a message when they're on a streak.
- **Higher score wins. If the scores tie, whoever finished first wins.** Both devices show the same result.
- **Rematch**: both tap it and a new round starts with fresh questions in the same room. A running tally ("Sam 2 – 1 Riya") shows who's ahead.
- A code typed into the wrong game takes the friend to the right one.

## The Live Mix (`race/`)
Two Daily Mix-style sets (two questions from each of the seven categories each) with repeats removed and shuffled: about 28 questions. It is built by the frozen `shared/daily-mix-v1.js` from the round's seed, so the Daily Mix itself never changes. Old `race/?room=CODE` links still join.

## Same questions on both devices
For each round the host picks a random seed and sends it with the start message. While the engine builds questions it swaps `Math.random` for a generator seeded from it, so every game produces the same questions on both devices with no game-specific code. See "Live mode" in `shared/README.md`.

## How the devices connect
- There is no server of our own. The devices talk directly over WebRTC using [PeerJS](https://peerjs.com) (vendored in `shared/vendor/peerjs.min.js`; loaded only in live mode).
- The free public PeerJS service only introduces the two devices. After that, answers go straight from one to the other.
- Some strict office and mobile networks block direct connections. If a pair can't connect, try both on the same Wi-Fi. A production version would use a hosted service such as Firebase, which works on any network.
- The clock doesn't pause if you leave the page during a game, so both players get the same 60 seconds.
- **Use two devices.** A phone pauses any browser that isn't on screen, so two browsers on one phone can't play each other. Two windows side by side on a computer work, as do a phone and a computer.
- The page reconnects to the PeerJS service when it comes back on screen, and a joining player retries a few times before giving up. A small status line under the lobby shows the state of the service and of the direct link.

## Testing
`npm run test:browser` starts a local PeerJS server and plays two browsers against each other (`tests/live.spec.js`): the Live Mix with a rematch, Colors joined from the Flags page at different speeds, and Brand Logos with different streaks. Pages connect to the local server through `?signal=127.0.0.1:9000`.

After each deploy, the post-deploy test run plays two browsers on the published site through the real public PeerJS service.
