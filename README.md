# INKBOUND / OVERDRIVE

A fast precision platformer with live drawing. Twelve stages, moving saws, directional air dashes, regenerating ink, instant retries and ranked completion times. Charcoal procedural artwork and original synthesized audio; no backend or external assets.

## Play

https://akshat-gupta123.github.io/INKBOUND/

- **A/D or left/right:** move. **Space:** jump; release to cut jump height.
- **Shift or X:** dash. Hold WASD/arrows to aim in eight directions. Dash through a saw to break it temporarily. Ground spikes remain lethal.
- **Mouse:** draw anywhere within reach while moving. Drawing never slows time.
- **1 — Stroke:** draw a temporary solid path. A quick click creates a short flat platform. It lasts 3.6 seconds; slopes become closely spaced collision steps.
- **2 — Arrow:** draw a launch direction. Touch the arrow to accelerate along it. It lasts 4.3 seconds. A click creates an upward-forward launch.
- **3 — Loop:** draw around a threat, or click to place a stasis field. Moving saws inside it freeze and become safe for 3 seconds.
- **E:** toggle machine guides; no slowdown. Matching outlined machinery still responds to tool clicks. Active Arrow machines reverse on another activation.
- **R:** restart at checkpoint, reset machines and refill ink. **Esc:** pause. **M:** mute.

Each sketch costs one of six ink charges. Ink regenerates every 1.1 seconds; at most five free drawings coexist. Full mouse paths are capped at420px. Dash cooldown is650ms. Death returns immediately to the checkpoint with full ink and a brief grace period. Stage clear ranks reward time and low death counts. All stages and tools are available immediately.

The campaign was rebuilt for this version. Existing completed stages and fragments remain saved. Old best times are not compared against the new ruleset; version2 starts a fresh time table.

## Development

Node22+ (verified on24). Run `npm ci`, then `npm run dev`.

- `npm run build` — TypeScript check and production build.
- `npm test` — geometry, campaign and save unit tests.
- `npm run test:browser` — Chromium integration and keyboard/mouse checks.
- `npm run preview` — serve the production build.

Playwright uses `/usr/bin/chromium` in this environment. On another system, configure its executable or install Playwright Chromium. GitHub Actions builds/tests and publishes `dist/` after pushes to `main`. Vite uses relative asset paths for project Pages.

## Main files

- `src/game.ts`: stage lifecycle, hazards, machines, HUD, checkpoint/reset/ranking.
- `src/player.ts`:540px/s run, coyote time, jump buffer, variable jump, directional dash and launch momentum.
- `src/liveInk.ts`: live sketch collision bodies, arrow impulses, stasis fields and expiry/cleanup.
- `src/inkGeometry.ts`: bounded gesture geometry, path sampling, click shortcuts.
- `src/levels.ts`: twelve handcrafted layouts, saw motion, checkpoints, caches and par times.
- `src/art.ts`, `src/ui.ts`, `src/style.css`, `src/audio.ts`: procedural art, interfaces and audio.
- `src/save.ts`: defensive local progress storage and ruleset migration.

Add or replace a stage in `levels.ts`, including platforms, hazards, sweepers, edits, three fragments, checkpoint, exit and par time. Sweeper `period` is a full out/back cycle in milliseconds; `phase` is normalized0–1. Keep the spawn and checkpoint outside hazard paths. Full jump rises about194px and travels about500px; provide safe landing space at high speeds. Campaign/save bounds currently assume twelve stages. Test all intended routes in the browser; geometric tests cannot establish that a route feels fair.

## Verification limits

Automated checks exercise real free-drawing collisions, launches, stasis, dash/contact, reset, progression and save behavior. Exit integration tests deliberately position the player; they do not represent a full unassisted campaign playthrough. Difficulty, par targets and first-playthrough length still need human balancing. Desktop keyboard/mouse required; no mobile controls. Phaser produces a large-bundle advisory during builds.
