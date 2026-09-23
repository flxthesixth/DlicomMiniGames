# DLICOM DROP

Endless signal survival minigame for Dlicom. No wallet, no payments — just play.

## Play

Open `index.html` in a browser, or deploy the folder as a static site (Cloudflare Pages: framework preset None, build command empty, output directory `/`).

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
