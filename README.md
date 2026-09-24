# DILI RUN

Three-lane endless runner. No wallet, no payments — just play.

## Play

Open `public/index.html` in a browser. Cloudflare Workers deploy uses `wrangler.jsonc` and uploads only `public/`, so build dependencies cannot become static assets.

## How it works

- Move: `←` `→`, `A` `D`, drag, or tap.
- Collect blue signal nodes. Hit red noise and you lose a shield — no shield, run over.
- Every 3 signals: **SIGNAL SURGE** — 5 seconds of double score and immunity.
- Highscore is stored locally. "POST SCORE ON X" opens a pre-filled post with your invite link; each new player who joins via your link grants you +1 starting shield (max 3).
- Score banner can be saved as PNG for sharing.

## Stack

- `game-core.js` — pure game state (score, combo, surge, shields), no DOM.
- `index.html` — canvas renderer + UI, single file.
- `test/game-core.test.js` — `npm test` (node:test).
