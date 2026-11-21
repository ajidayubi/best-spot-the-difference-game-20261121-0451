# best-spot-the-difference-game-20261121-0451

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/ajidayubi/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/ajidayubi/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Lantern Harbour** — a spot-the-difference game. Two near-identical
pictures stand side by side in each of three hand-drawn scenes
(Harbour Sunset, Forest Dawn, Night Market); seven differences hide
in each scene. Click a difference on either picture to ring it green,
watch the counter fall, and clear the scene before the 90-second
lantern burns out. Wrong clicks cost points, hints cost more, and a
time bonus rewards a fast, sharp eye.

## Run it

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

Serve `game/` with any static server and open `index.html` in desktop
Chrome. No network requests, no build step, all art and sound are
procedural.

Controls: click (or tap) a difference on either picture, `H` hint,
`M` mute, `R` restart, `Enter` start / next scene.

## How it works

- `game/src/scenes.js` — the three scenes, drawn entirely in code on
  canvas, with each scene's seven differences and their hit zones.
- `game/src/model.js` — the pure game model: levels, scoring, hints,
  the timer and win/lose. Shared by the browser game and the node
  simulation test, so the rules are identical in both.
- `game/src/render.js` — canvas painting: both panels, found markers,
  miss flashes, hint rings and end screens.
- `game/src/rng.js` — seeded random helpers (mulberry32); every
  decorative scatter is a pure function of its seed, so screenshots
  are reproducible.
- `game/src/audio.js` — tiny WebAudio synth for found chimes, wrong
  buzzes and win fanfares. No audio files.
- `game/src/game.js` — loop, input, state machine and the
  deterministic shot staging (`?shot=start|play|play2|win|over&seed=1`).
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  `/output/dossier.json` with the vendored make.fun library.

## Bounty

Built for [best-spot-the-difference-game-20261121-0451 on make.fun](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451) —
make the best spot the difference game, $50 prize pool. Entry by
[abdul-mazid](https://make.fun/r/cbk8hpf3) — referral code `cbk8hpf3`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=cbk8hpf3&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
