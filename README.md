# INKBOUND / OVERDRIVE ARCADE

A fast platformer with live drawing, directional air dashes, moving saws and instant checkpoint retries. The collection has **104 courses** across **Normal, Hard, Insane and Extreme**, each with its own color in the picker and in play. Five volumes organize the courses: First Ink (24), Velocity (20), Undertow (20), Parallax (20) and Afterlight (20). The eighty additions use authored terrain, machinery, hazards and route choices.

The interface uses a restrained ink-and-ivory palette, course search, volume filters and a scrollable course index. The courier has a compact hood, porcelain visor, layered coat, coral scarf and separate idle, running, jumping, falling and dash poses. Artwork and four synthesized music tracks run entirely in the browser, without a backend or external assets.

## Play

https://akshat-gupta123.github.io/INKBOUND/

The opening carousel offers every level immediately. Browse with **left/right**, press **Enter** to play, or use the volume tabs, difficulty filters and numbered shortcuts. Search by course name or number. Cards show a route preview, target time, personal best, furthest progress and collected caches. A clear offers replay or the level picker.

Clearing **all 104 courses**, in any order, opens the final page: an original poem, *The space between*. Finishing the final numbered course alone does not unlock it. Once earned, **Final page** in the picker reopens it, including after a reload. Tutorial completion and optional caches are independent of this requirement.

Start with **Mechanics Lab**, a separate nine-lesson tutorial. Each lesson checks an action before you can continue: move and jump; air dash; land on a drawn Stroke; launch with Arrow; freeze a saw with Loop; dash through a saw; activate all three machine types; collect a cache, reach a checkpoint and reset; then reach the exit. Retry a lesson, leave at any time, or replay the tutorial from the picker. The same ink timings and checkpoint mechanics apply in regular levels.

- **A/D or left/right:** move. **Space:** jump; release to cut jump height.
- **Shift or X:** dash. Hold WASD/arrows to aim in eight directions. Dashing through a saw breaks it for 1.8 seconds. Ground spikes remain lethal.
- **Mouse:** draw within reach while moving. Drawing never slows time.
- **1 — Stroke:** draw a solid path lasting 3.6 seconds. A quick click creates a flat platform; slopes become closely spaced collision steps.
- **2 — Arrow:** draw a launch direction. Touch it to accelerate along that direction. It lasts 4.3 seconds. A click creates an upward-forward launch.
- **3 — Loop:** draw around a threat, or click to place a stasis field. Saws inside freeze and become safe while the field lasts, up to 3 seconds.
- **E:** toggle machine guides. Click matching outlined machinery to activate it. Active Arrow machines reverse on another activation.
- **R:** return to your checkpoint, refill ink, clear free sketches and reset machines. **Esc:** pause. **M:** mute.

Each sketch costs one of six ink charges. One charge regenerates every 1.1 seconds, and at most five free drawings coexist. Drawn paths are capped at 420px; click platforms span 170px. Running reaches 540px/s, and dashing reaches 1,000px/s for 140ms with a 650ms cooldown. Touching an inkwell activates the checkpoint and refills ink. Death returns there immediately, clears free sketches, refills ink and grants 450ms of spawn grace. Until you reach a checkpoint, retries return to the start. The run timer and death count continue across retries; replaying from the completion screen starts a fresh run. Ranks reward time and low death counts.

**Settings** provides separate master, music and sound-effect volumes, mute, and reduced motion/flashes. The four original tracks are **Vector Bloom**, **Chrome Circuit**, **Prism Run** and **Terminal Velocity**, each with a repeating sixteen-bar arrangement of melody, bass, chords and drums. The picker uses a lighter arrangement; gameplay uses the full track, and pausing stops the music. Audio starts after your first interaction.

Completion, best times, furthest progress, collected caches, tutorial completion and settings are saved locally in your browser. The expansion appends course IDs 24–103 without resetting existing progress or changing ruleset 5. Records for the previous 24-course collection remain intact. Earlier ruleset migrations archive incompatible records under `inkbound-archive-ruleset-<version>` and preserve preferences and tutorial completion.

The difficulty distribution is 16 Normal, 32 Hard, 32 Insane and 24 Extreme courses. All share the same movement and ink rules; gaps, landing space, machinery, fading bridges and saw timing establish difficulty.

## Development

Node 22+ (verified on 24). Run `npm ci`, then `npm run dev`.

- `npm run build` — TypeScript check and production build.
- `npm test` — geometry, level, tutorial-data, music-arrangement and save unit tests.
- `npm run test:browser` — Chromium integration and keyboard/mouse checks.
- `npm run preview` — serve the production build.

Playwright uses `/usr/bin/chromium` in this environment. On another system, configure its executable or install Playwright Chromium. GitHub Actions builds/tests and publishes `dist/` after pushes to `main`. Vite uses relative asset paths for project Pages.

## Main files

- `src/game.ts`: level lifecycle, hazards, machines, HUD, checkpoint/reset/ranking and progress tracking.
- `src/player.ts`: running, coyote time, jump buffer, variable jump, directional dash and launch momentum.
- `src/liveInk.ts`, `src/inkGeometry.ts`, `src/rules.ts`: free sketch geometry, collision, launch/stasis effects, expiry and shared Overdrive timings.
- `src/levels.ts`: shared course types, catalogue, colors, tutorial and stable display order.
- `src/remixes.ts`, `src/volumes/*.ts`: the remaining course geometry and machinery.
- `src/completion.ts`, `src/epilogue.ts`, `src/epilogue.css`: complete-collection detection and final poem.
- `src/tutorial.ts`: nine lessons that observe gameplay actions and allow practice retries.
- `src/ui.ts`, `src/style.css`: carousel, difficulty filters, settings and interface styling.
- `src/art.ts`: courier pose textures, scenery, platforms, hazards and effects.
- `src/music.ts`, `src/audio.ts`: original arrangements, Web Audio scheduling, synthesized instruments/effects and separate volume buses.
- `src/save.ts`: defensive local storage and migration of progress, tutorial completion and settings.

Add a `Level` in `levels.ts` with its geometry, hazards, machines, safe checkpoint, exit, three caches, difficulty, unique color, music assignment and par time. Append levels to preserve saved indices; `levelOrder` preserves course numbering across volumes. Keep the fast movement and drawing rules consistent, varying gaps, landing space and hazard timing to set difficulty. Sweeper `period` is a full out/back cycle in milliseconds; `phase` is normalized 0–1. A full jump rises about 194px and travels about 500px. Geometry tests check bounds and structural constraints, but cannot establish obstacle timing or route fairness.

## Verification limits

Automated checks exercise free-drawing collisions, launches, stasis, dash/contact, checkpoint retries, selection, search/filter combinations, tutorial gates, music scheduling, save behavior and complete-collection unlocks. An independent fixture guards the first twelve course geometries against release `d6756a3`. Exit integration tests deliberately position the player; they do not represent full unassisted playthroughs of all 104 levels. Course balance and par times still need human playtesting, and musical quality needs listening checks. Desktop keyboard/mouse required; no mobile controls. Phaser produces a large-bundle advisory during builds.
