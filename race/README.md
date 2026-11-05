# Live race (test version)

`race/` lets two phones play today's Daily Mix against each other live. It isn't linked from the home page yet.

## How it works
- One player taps **Create race** and sends the invite link (or the 4-letter code).
- The friend opens the link, enters a name and taps **I'm ready**. The creator taps **Start the race**.
- Both phones count down 3-2-1 and play the same 14 questions with the usual rules (60 seconds, +10 / −5).
- A strip above each question shows both scores and progress live. You get a message and a vibration when your friend overtakes you, and a message when they're on a streak.
- **Higher score wins. If the scores tie, whoever finished first wins.** Both phones show the same result.

## How the phones connect
- There is no server of our own. The phones talk directly over WebRTC using [PeerJS](https://peerjs.com) (vendored in `shared/vendor/peerjs.min.js`).
- The free public PeerJS service only introduces the two phones. After that, answers go straight from phone to phone.
- Some strict office and mobile networks block direct connections. If a pair can't connect, try both phones on the same Wi-Fi. A production version would use a hosted service such as Firebase, which works on any network.
- The clock doesn't pause if you leave the page during a race, so both players get the same 60 seconds.
- **Use two devices.** A phone pauses any browser that isn't on screen, so two browsers on one phone can't race each other. Two windows side by side on a computer work, as do a phone and a computer.
- The page reconnects to the PeerJS service when it comes back on screen, and a joining player retries a few times before giving up. A small status line under the lobby shows the state of the service and of the direct link, which helps when a pair can't connect.

## Testing
`npm run test:browser` starts a local PeerJS server and races two browsers against each other (`tests/race.spec.js`). The page connects to that local server through `?signal=127.0.0.1:9000`; `?date=YYYY-MM-DD` picks a fixed Daily Mix.

After each deploy, the post-deploy test run races two browsers on the published site through the real public PeerJS service.
