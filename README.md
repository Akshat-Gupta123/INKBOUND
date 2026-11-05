# INKBOUND / ARCADE

A fast precision platformer with live drawing. Pick from 20 demanding full-run courses with no difficulty tiers, with a separate hands-on tutorial, moving saws, directional air dashes, regenerating ink, instant retries and ranked completion times. Each level has its own color palette. Procedural artwork and four original synthesized music tracks run entirely in the browser; no backend or external assets.

## Play

https://akshat-gupta123.github.io/INKBOUND/

The opening carousel lets you choose any level immediately. Browse with **left/right** and press **Enter** to play, or use the preview cards and numbered shortcuts. Every regular course uses the same strict rules: no checkpoints, three ink charges, short-lived drawings and an uninterrupted route to the finish. Cards show a route preview, target time, personal best, furthest progress and collected fragments. Each clear returns you to a choice of replaying or opening the picker. There are no story screens or required level unlocks.

Start with **Mechanics Lab**, a separate nine-lesson tutorial. Each lesson checks that you perform the action before you can continue: move and jump; air dash; land on a drawn Stroke; launch with Arrow; freeze a saw with Loop; dash through a saw; activate all three machine types; collect a cache, reach a checkpoint and reset; then reach the exit. The inkwell checkpoint exists only in practice; the lesson explains that regular courses reset to the start. You can retry a lesson, leave at any time, or replay the tutorial from the picker.

- **A/D or left/right:** move. **Space:** jump; release to cut jump height.
- **Shift or X:** dash. Hold WASD/arrows to aim in eight directions. Dash through a saw to break it temporarily. Ground spikes remain lethal.
- **Mouse:** draw anywhere within reach while moving. Drawing never slows time.
- **1 — Stroke:** draw a temporary solid path. A quick click creates a short flat platform. It lasts 1.1 seconds; slopes become closely spaced collision steps.
- **2 — Arrow:** draw a launch direction. Touch the arrow to accelerate along it. It lasts 1 second. A click creates an upward-forward launch.
- **3 — Loop:** draw around a threat, or click to place a stasis field. Moving saws inside it freeze and become safe for 0.7 seconds.
- **E:** toggle machine guides; no slowdown. Matching outlined machinery still responds to tool clicks. Active Arrow machines reverse on another activation.
- **R:** restart the full run, reset machines and saw cycles, and refill ink. **Esc:** pause. **M:** mute.

Each sketch costs one of three ink charges. Ink regenerates every 1.55 seconds; at most three free drawings coexist. Full mouse paths are capped at 260px, and click platforms span 96px. Dash cooldown stays at 650ms, while broken saws recover after 480ms. Death returns immediately to the start with full ink, resets the attempt timer and obstacle cycles, and grants 120ms of spawn grace. Death counts continue across retries. Practice retains six charges, longer drawing lifetimes and its checkpoint so each action can be learned. Level clear ranks reward time and low death counts. All levels and tools are available immediately.

**Settings** provides separate master, music and sound-effect volumes, a mute toggle, and reduced motion/flashes. The four original tracks are **Vector Bloom**, **Chrome Circuit**, **Prism Run** and **Terminal Velocity**, each with a repeating sixteen-bar arrangement of melody, bass, chords and drums. The picker uses a lighter arrangement; gameplay uses the full track, and pausing stops the music. Audio starts after your first interaction.

Completion, best times, furthest progress, collected fragments, tutorial completion and settings are saved locally in your browser. These rebuilt courses use ruleset 3. Earlier course records are archived once under `inkbound-archive-ruleset-2` (or `inkbound-archive-ruleset-legacy`) in localStorage, while regular clears, fragments, progress and times start fresh. Preferences, tutorial completion and lifetime statistics are retained. Existing level names, colors and music assignments remain attached to their indices.

## Development

Node 22+ (verified on 24). Run `npm ci`, then `npm run dev`.

- `npm run build` — TypeScript check and production build.
- `npm test` — geometry, level, tutorial-data, music-arrangement and save unit tests.
- `npm run test:browser` — Chromium integration and keyboard/mouse checks.
- `npm run preview` — serve the production build.

Playwright uses `/usr/bin/chromium` in this environment. On another system, configure its executable or install Playwright Chromium. GitHub Actions builds/tests and publishes `dist/` after pushes to `main`. Vite uses relative asset paths for project Pages.

## Main files

- `src/game.ts`: level lifecycle, hazards, machines, HUD, checkpoint/reset/ranking and progress tracking.
- `src/player.ts`: 540px/s run, coyote time, jump buffer, variable jump, directional dash and launch momentum.
- `src/liveInk.ts`: live sketch collision bodies, arrow impulses, stasis fields and expiry/cleanup.
- `src/rules.ts`: one regular course ruleset and generous practice timings.
- `src/inkGeometry.ts`: bounded gesture geometry, path sampling, click shortcuts.
- `src/levels.ts`: 20 authored height sequences expanded into narrow shelves, fading footholds, crossed saw lanes and ceiling teeth; tutorial layout, level colors, track assignments, caches and par times.
- `src/tutorial.ts`: nine guided lessons that observe gameplay actions and allow practice retries.
- `src/ui.ts`, `src/style.css`: level carousel, course rules, settings and interface styling.
- `src/art.ts`: procedural scenery, platforms, hazards and effects.
- `src/music.ts`, `src/audio.ts`: four original arrangements, Web Audio scheduling, synthesized instruments/effects and separate volume buses.
- `src/save.ts`: defensive local progress storage, tutorial/settings persistence and ruleset migration.

Add an authored course profile to `levels.ts` with its name, color, track, scenery chapter and height sequence. Append profiles to preserve saved indices; display order is index order. Regular shelves span 36–52px and their origins are 440–512px apart, with a 64px temporary foothold between each pair. Each course has 29–32 moving saws, a continuous spike bed and periodic ceiling teeth. Spawn and finish have protected runways; regular courses have no checkpoint. Sweeper `period` is a full out/back cycle in milliseconds; `phase` is normalized 0–1. Full jump rises about 194px and travels about 500px. Geometric tests check bounds, clearances and structural connectivity, but cannot establish obstacle timing or route fairness.

## Verification limits

Automated checks exercise real free-drawing collisions, launches, stasis, dash/contact, reset, level selection, tutorial gates, music scheduling and save behavior. Exit integration tests deliberately position the player; they do not represent full unassisted playthroughs of all 20 levels. The much stricter routes and par targets still need human balancing, and musical quality needs listening checks. Desktop keyboard/mouse required; no mobile controls. Phaser produces a large-bundle advisory during builds.
