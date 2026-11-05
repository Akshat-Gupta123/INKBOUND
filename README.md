# INKBOUND: The Unfinished World

An original, standalone sketchbook puzzle-platformer. Twelve pages across four chapters follow Pip, Scribble, Margin, and the Eraser. All art is drawn with Phaser Graphics, Canvas and CSS; sound and ambient notes are synthesized locally. No accounts, keys, backend, downloads at runtime, or external assets.

## Run

Node 22 or later (developed and verified on Node 24.22.1).

```sh
npm install
npm run dev
```

For repeatable installation use `npm ci`. `npm run build` type-checks and builds `dist/`; `npm run preview` serves that production build. Deploy `dist/` to any static host.

## Play

- A/D or arrows: walk. Space: jump; hold for extra height.
- E: Sketch Mode. Time slows while drawing.
- 1 / 2 / 3: Stroke / Arrow / Loop. Click an eligible highlighted object. Trace, drag along its rail, or draw a rough circle. A short click also works for every tool.
- Stroke creates a solid platform; Arrow sends a mechanism along its illustrated rail; Loop makes it shuttle repeatedly. Rails constrain gestures to preserve puzzle solvability.
- R: undo the puzzle, restore six ink charges, and return to the latest inkwell. Ink fragments already collected stay saved.
- Esc: pause. M: mute. Volume, timer and reduced motion are in Settings.

The chapter library lets you visit **every level from the beginning**, with no grinding or forced unlock order. Golden seals record completion; the three fragments on each page reveal extra story. Look above the main route for Margin's hidden lofts. Temporary storm bridges last 12 game seconds. Brass plates require a directed crate. Gold gates require every drawing (or their associated pressure plate).

Progress, collected fragments, fastest times, settings, and achievements save in this browser's LocalStorage under `inkbound-v1`. Restricted storage still permits play for the current session.

## Project map

- `src/main.ts`: responsive Phaser initialization, Arcade Physics, Canvas renderer.
- `src/game.ts`: scene lifecycle, puzzle objects, pointer gestures, checkpoints, progression and ending.
- `src/player.ts`: fixed collision body, visual animation, acceleration, coyote time, jump buffering and variable jumps.
- `src/levels.ts`: twelve handcrafted level definitions, chapter palettes and gesture recognition.
- `src/art.ts`: procedural textures, character illustration, parallax chapter scenery.
- `src/ui.ts` / `src/style.css`: sketchbook cover, chapter library, HUD, settings, pause, ending and credits.
- `src/audio.ts`: Web Audio effects and synthesized ambient notes; starts after interaction.
- `src/save.ts`: validated, versioned local progress and achievements.
- `tests/`: Vitest campaign/save/gesture tests and Playwright real-browser acceptance checks.

## Add a page

Add a `Level` object to `src/levels.ts`: chapter index, paper width, solid rectangles, tool drawings, hazards, three fragments, an inkwell, and a folded-door exit. Coordinates use a 1280×720 logical canvas; floors normally start at y=610. Pip jumps about 161 px high with a full hold and travels up to about 290 px on a level jump. Make required gaps comfortably smaller and leave headroom. Drawings have unique IDs; `dx` or `dy` defines a constrained mechanism rail. `duration` makes a Stroke temporary. A crate with `plate:true` activates the level's plate. A gate without a plate requires all drawings. Place exit y approximately 70 px above its floor.

The current campaign and save format expect twelve pages and three fragments per page. Expanding the campaign beyond twelve requires adjusting the bounds in `src/save.ts`, menu percentages, chapter counts, and campaign tests. For replacing or rearranging a page, change only its data and rerun the tests. Add helpful level-specific `note`, dialogue, and a hidden `secret` line.

## Validation

```sh
npm test
npm run build
npm run test:browser
```

Browser tests use `/usr/bin/chromium` in the supplied cloud environment and start Vite themselves. On another machine, install Playwright Chromium (`npx playwright install chromium`) and remove `executablePath` from `playwright.config.ts`, or point it at your local Chromium. The suite checks real keyboard movement and jumping, pause/reset, a mouse-created bridge and landing, moving-platform riding, tool effects, checkpoint/fragment state, all twelve exit triggers, saved replay, and the ending/credits. Some progression checks deliberately position the player and activate mechanisms through the scene API; they are integration checks, not a complete unassisted playthrough.

## Scope and limitations

This is a compact playable campaign. The requested 30–50-minute first-playthrough target has not been established through player testing; experienced players may finish considerably faster. Secret areas are optional upper-route story lofts rather than large separate maps. The finale is a restorative puzzle and illustrated dialogue sequence rather than a combat boss. Desktop keyboard and pointer input are required; touch controls and gamepads are not implemented. Phaser produces a large-bundle advisory during build; the complete client bundle is approximately 355 KB gzipped.

## Published site

GitHub Pages is configured through `.github/workflows/pages.yml`. Pushing to `main` runs the unit suite, builds the client, and publishes `dist/`. Vite uses relative asset URLs so the game also works at the `/INKBOUND/` project path. The workflow can also be started manually from GitHub Actions.
