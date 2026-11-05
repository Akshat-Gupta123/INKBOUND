# INKBOUND / ARCADE

A fast precision platformer with live drawing. Pick from 20 independent levels across five difficulties, with a separate hands-on tutorial, moving saws, directional air dashes, regenerating ink, instant retries and ranked completion times. Each level has its own color palette. Procedural artwork and four original synthesized music tracks run entirely in the browser; no backend or external assets.

## Play

https://akshat-gupta123.github.io/INKBOUND/

The opening carousel lets you choose any level immediately. Browse with **left/right** and press **Enter** to play, or use the preview cards and numbered shortcuts. Filter by **Easy**, **Normal**, **Hard**, **Insane** or **Extreme**; each tier has four levels. Cards show a route preview, target time, personal best, furthest progress and collected fragments. Each clear returns you to a choice of replaying or opening the picker. There are no story screens or required level unlocks.

Start with **Mechanics Lab**, a separate nine-lesson tutorial. Each lesson checks that you perform the action before you can continue: move and jump; air dash; land on a drawn Stroke; launch with Arrow; freeze a saw with Loop; dash through a saw; activate all three machine types; collect a cache, reach a checkpoint and reset; then reach the exit. You can retry a lesson, leave at any time, or replay the tutorial from the picker.

- **A/D or left/right:** move. **Space:** jump; release to cut jump height.
- **Shift or X:** dash. Hold WASD/arrows to aim in eight directions. Dash through a saw to break it temporarily. Ground spikes remain lethal.
- **Mouse:** draw anywhere within reach while moving. Drawing never slows time.
- **1 — Stroke:** draw a temporary solid path. A quick click creates a short flat platform. It lasts 3.6 seconds; slopes become closely spaced collision steps.
- **2 — Arrow:** draw a launch direction. Touch the arrow to accelerate along it. It lasts 4.3 seconds. A click creates an upward-forward launch.
- **3 — Loop:** draw around a threat, or click to place a stasis field. Moving saws inside it freeze and become safe for 3 seconds.
- **E:** toggle machine guides; no slowdown. Matching outlined machinery still responds to tool clicks. Active Arrow machines reverse on another activation.
- **R:** restart at checkpoint, reset machines and refill ink. **Esc:** pause. **M:** mute.

Each sketch costs one of six ink charges. Ink regenerates every 1.1 seconds; at most five free drawings coexist. Full mouse paths are capped at 420px. Dash cooldown is 650ms. Death returns immediately to the checkpoint with full ink and a brief grace period. Level clear ranks reward time and low death counts. All levels and tools are available immediately.

**Settings** provides separate master, music and sound-effect volumes, a mute toggle, and reduced motion/flashes. The four original tracks are **Vector Bloom**, **Chrome Circuit**, **Prism Run** and **Terminal Velocity**, each with a repeating sixteen-bar arrangement of melody, bass, chords and drums. The picker uses a lighter arrangement; gameplay uses the full track, and pausing stops the music. Audio starts after your first interaction.

Completion, best times, furthest progress, collected fragments, tutorial completion and settings are saved locally in your browser. Existing level identities are preserved when adding the eight Easy/Normal levels, so earlier clears and fragments remain attached to their levels. Ruleset 2 best times are retained; times from the earlier slow ruleset are retired.

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
- `src/inkGeometry.ts`: bounded gesture geometry, path sampling, click shortcuts.
- `src/levels.ts`: 20 handcrafted layouts, tutorial layout, difficulty order, level colors, track assignments, saw motion, checkpoints, caches and par times.
- `src/tutorial.ts`: nine guided lessons that observe gameplay actions and allow practice retries.
- `src/ui.ts`, `src/style.css`: level carousel, difficulty filters, settings and interface styling.
- `src/art.ts`: procedural scenery, platforms, hazards and effects.
- `src/music.ts`, `src/audio.ts`: four original arrangements, Web Audio scheduling, synthesized instruments/effects and separate volume buses.
- `src/save.ts`: defensive local progress storage, tutorial/settings persistence and ruleset migration.

Add a level to `levels.ts`, including its difficulty, color, music track index, platforms, hazards, sweepers, edits, three fragments, checkpoint, exit and par time. Append new levels to preserve existing save indexes; `levelOrder` sorts their display order by difficulty, and save bounds follow `levels.length`. Sweeper `period` is a full out/back cycle in milliseconds; `phase` is normalized 0–1. Keep the spawn and checkpoint outside hazard paths. Full jump rises about 194px and travels about 500px; provide safe landing space at high speeds. Test all intended routes in the browser; geometric tests cannot establish that a route feels fair.

## Verification limits

Automated checks exercise real free-drawing collisions, launches, stasis, dash/contact, reset, level selection, tutorial gates, music scheduling and save behavior. Exit integration tests deliberately position the player; they do not represent full unassisted playthroughs of all 20 levels. Difficulty and par targets still need human balancing, and musical quality needs listening checks. Desktop keyboard/mouse required; no mobile controls. Phaser produces a large-bundle advisory during builds.
