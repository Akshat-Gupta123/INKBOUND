export type Tool = 'stroke' | 'arrow' | 'loop';
export type Rect = { x: number; y: number; w: number; h: number };
export type Edit = Rect & {
  id: string; tool: Tool; dx?: number; dy?: number; duration?: number; plate?: boolean;
};
/** A lethal ink saw travelling from (x,y) to (x+dx,y+dy) and back. */
export type Sweeper = {
  x: number; y: number; r: number; dx?: number; dy?: number;
  /** Full out-and-back travel time, in milliseconds. */
  period: number;
  /** Initial cycle position in the range 0..1. */
  phase?: number;
};
export type Level = {
  name: string; chapter: number; subtitle: string; note: string; dialogue: string;
  goal: string; width: number; par: number;
  platforms: Rect[]; edits: Edit[]; hazards: Rect[]; sweepers: Sweeper[];
  fragments: { x: number; y: number }[];
  checkpoint: { x: number; y: number }; exit: { x: number; y: number };
  gate?: Rect; plate?: Rect; secret: string;
};
const floor = (x: number, w: number, y = 610): Rect => ({ x, y, w, h: 65 });
const ledge = (x: number, y: number, w = 150): Rect => ({ x, y, w, h: 22 });
const teeth = (x: number, w: number, y = 582): Rect => ({ x, y, w, h: 28 });
const stroke = (id: string, x: number, y: number, w: number, duration?: number): Edit =>
  ({ id, tool: 'stroke', x, y, w, h: 22, duration });
const rail = (id: string, tool: 'arrow' | 'loop', x: number, y: number, w: number, dx = 0, dy = 0): Edit =>
  ({ id, tool, x, y, w, h: 24, dx, dy });
const saw = (x: number, y: number, dx: number, dy: number, period: number, r = 25, phase = 0): Sweeper =>
  ({ x, y, dx, dy, period, r, phase });

export const chapters = [
  { name: 'Break the Line', color: 0xffd34e, word: 'Find your speed. Keep it.' },
  { name: 'Factory Speed', color: 0xff6757, word: 'The machines do not wait.' },
  { name: 'Clockwork Riot', color: 0x59d9ff, word: 'Read the rhythm. Break through.' },
  { name: 'Erase the Rules', color: 0xc68cff, word: 'No safe route. Make one.' },
];

export const levels: Level[] = [
  {
    name: 'First Steps', chapter: 0, subtitle: 'No warm-up lap.', par: 20,
    note: 'A/D move · Space jump · Shift dash · Drag to sketch while moving. Red ink kills. Dash through saws.',
    dialogue: 'MOVE. DRAW. DO NOT STOP.', goal: 'Clear the page. Beat 20 seconds.', width: 2500,
    platforms: [floor(0, 480), floor(830, 540), floor(1720, 780), ledge(330, 480, 100), ledge(710, 400, 120), ledge(1040, 440, 110), ledge(1450, 460, 130), ledge(1950, 430, 130)],
    edits: [stroke('first-cut', 490, 560, 210), rail('fast-track', 'arrow', 1460, 560, 160, 160)],
    hazards: [teeth(1030, 120), teeth(1830, 110), teeth(2210, 90)],
    sweepers: [saw(930, 490, 110, 70, 1900, 23), saw(2000, 365, 190, 0, 1700, 24, .3)],
    fragments: [{ x: 760, y: 345 }, { x: 1090, y: 385 }, { x: 2020, y: 375 }],
    checkpoint: { x: 1280, y: 570 }, exit: { x: 2390, y: 540 },
    secret: 'HIGH ROUTE // Fewer obstacles. Smaller landing zones.',
  },
  {
    name: 'Missing Pieces', chapter: 0, subtitle: 'Build your landing before you need it.', par: 23,
    note: 'Stroke [1] draws a temporary landing. Keep moving; ink regenerates. The blue bridge timer is real.',
    dialogue: 'NOTHING UNDER YOUR FEET? FIX THAT.', goal: 'Chain the fading platforms.', width: 2700,
    platforms: [floor(0, 430), floor(1070, 400), floor(2290, 410), ledge(780, 350, 120), ledge(1170, 420, 120), ledge(1970, 340, 120)],
    edits: [stroke('cut-a', 450, 560, 180, 3400), stroke('cut-b', 720, 500, 170, 3400), stroke('cut-c', 1600, 550, 220, 3000), stroke('cut-d', 1940, 490, 180, 3000)],
    hazards: [teeth(1200, 100), teeth(2390, 120)],
    sweepers: [saw(875, 430, 0, 120, 1700, 25), saw(1740, 420, 200, 0, 1500, 24, .4), saw(2160, 390, 0, 140, 1600, 26)],
    fragments: [{ x: 830, y: 295 }, { x: 1230, y: 365 }, { x: 2030, y: 285 }],
    checkpoint: { x: 1380, y: 570 }, exit: { x: 2590, y: 540 },
    secret: 'A clean run is faster than a perfect drawing.',
  },
  {
    name: 'The Broken Staircase', chapter: 0, subtitle: 'Vertical pressure.', par: 25,
    note: 'Jump, sketch, land, dash. Up + Shift gives a vertical dash. Miss a step and reset instantly with R.',
    dialogue: 'GO UP. DO NOT HESITATE.', goal: 'Climb through the saw lanes.', width: 2700,
    platforms: [floor(0, 500), ledge(650, 470, 160), ledge(1110, 350, 180), ledge(1600, 240, 200), ledge(2060, 380, 180), floor(2350, 350)],
    edits: [stroke('stair-a', 460, 500, 150), stroke('stair-b', 860, 410, 150), stroke('stair-c', 1380, 290, 150), stroke('stair-d', 1830, 310, 140)],
    hazards: [teeth(300, 75), teeth(2420, 90)],
    sweepers: [saw(930, 335, 135, 0, 1500, 24), saw(1740, 170, 0, 155, 1800, 26), saw(2170, 290, 125, 0, 1600, 23, .5)],
    fragments: [{ x: 720, y: 415 }, { x: 1190, y: 295 }, { x: 1690, y: 185 }],
    checkpoint: { x: 1200, y: 315 }, exit: { x: 2590, y: 540 },
    secret: 'HEIGHT IS SPEED // Drop into the next jump.',
  },
  {
    name: 'The Pencil Factory', chapter: 1, subtitle: 'Production never stops.', par: 26,
    note: 'Arrow [2] launches you along a drawn direction. Click the outlined lifts to run their rails.',
    dialogue: 'THE FLOOR IS THE SLOW ROUTE.', goal: 'Use the lifts. Cut across the factory.', width: 2800,
    platforms: [floor(0, 480), floor(890, 360), floor(1790, 420), floor(2500, 300), ledge(650, 390, 170), ledge(1460, 330, 170), ledge(2110, 400, 140)],
    edits: [rail('press-lift', 'arrow', 510, 570, 140, 0, -240), stroke('assembly-step', 1270, 470, 160), rail('loading-lift', 'arrow', 1630, 570, 140, 0, -300), stroke('conveyor-gap', 2220, 540, 220)],
    hazards: [teeth(1000, 100), teeth(1900, 140)],
    sweepers: [saw(780, 320, 0, 170, 1700, 27), saw(1500, 465, 160, 0, 1350, 25), saw(2310, 450, 0, 120, 1550, 27, .3)],
    fragments: [{ x: 720, y: 335 }, { x: 1530, y: 275 }, { x: 2180, y: 345 }],
    checkpoint: { x: 1180, y: 570 }, exit: { x: 2690, y: 540 },
    secret: 'FACTORY RECORD // Top route, no stops.',
  },
  {
    name: 'A Little Push', chapter: 1, subtitle: 'Turn momentum into a weapon.', par: 24,
    note: 'Launch through the gap. A dash destroys a moving saw temporarily. Spikes still kill you.',
    dialogue: 'HIT THE SAW BEFORE IT HITS YOU.', goal: 'Punch through the moving blockade.', width: 2900,
    platforms: [floor(0, 520), floor(880, 480), floor(1730, 450), floor(2520, 380), ledge(630, 420, 150), ledge(1140, 340, 150), ledge(1900, 390, 140)],
    edits: [rail('shove', 'arrow', 540, 530, 170, 230), rail('recoil', 'loop', 1390, 530, 180, 220), stroke('exit-cut', 2210, 540, 220)],
    hazards: [teeth(960, 140), teeth(1830, 120), teeth(2600, 100)],
    sweepers: [saw(750, 440, 0, 100, 1500, 26), saw(1490, 460, 180, 0, 1250, 27), saw(2130, 420, 0, 140, 1500, 28)],
    fragments: [{ x: 700, y: 365 }, { x: 1210, y: 285 }, { x: 1970, y: 335 }],
    checkpoint: { x: 1270, y: 570 }, exit: { x: 2790, y: 540 },
    secret: 'Dash into danger. Not into the floor.',
  },
  {
    name: 'Across the Margin', chapter: 1, subtitle: 'There is no bridge coming.', par: 27,
    note: 'Long gaps reward mid-air sketches. Draw a landing, recover your dash, then launch again.',
    dialogue: 'YOUR LINE IS THE ROUTE.', goal: 'Cross the canyon without losing momentum.', width: 3200,
    platforms: [floor(0, 470), floor(1230, 350), floor(2710, 490), ledge(680, 470, 100), ledge(960, 380, 100), ledge(1770, 480, 130), ledge(2120, 390, 130), ledge(2440, 490, 120)],
    edits: [stroke('ledge-cut', 500, 550, 160), rail('margin-runner', 'arrow', 800, 520, 140, 240), rail('canyon-return', 'loop', 1600, 550, 150, 380), stroke('last-foothold', 2290, 450, 120)],
    hazards: [teeth(2810, 140)],
    sweepers: [saw(870, 350, 0, 170, 1900, 26), saw(1690, 410, 160, 0, 1450, 26), saw(2200, 315, 0, 170, 1650, 28), saw(2590, 420, 110, 0, 1200, 24, .5)],
    fragments: [{ x: 1010, y: 325 }, { x: 1830, y: 425 }, { x: 2190, y: 335 }],
    checkpoint: { x: 1410, y: 570 }, exit: { x: 3090, y: 540 },
    secret: 'AIR ROUTE // The ground is optional.',
  },
  {
    name: 'The Clockwork Page', chapter: 2, subtitle: 'Read the cycle. Commit.', par: 25,
    note: 'Loop [3] draws a stasis field around saws. Loop machines keep moving until reset.',
    dialogue: 'THE NEXT OPENING IS YOURS.', goal: 'Chain the ferries and break the saw rhythm.', width: 2800,
    platforms: [floor(0, 420), floor(1170, 350), floor(2390, 410), ledge(820, 380, 140), ledge(1780, 310, 140), ledge(2130, 420, 140)],
    edits: [rail('clock-a', 'loop', 450, 550, 180, 500), rail('clock-b', 'loop', 1580, 540, 160, 550)],
    hazards: [teeth(1250, 100), teeth(2520, 120)],
    sweepers: [saw(720, 420, 0, 130, 1600, 27), saw(1790, 440, 220, 0, 1450, 28), saw(2270, 310, 0, 160, 1700, 27, .35)],
    fragments: [{ x: 890, y: 325 }, { x: 1850, y: 255 }, { x: 2200, y: 365 }],
    checkpoint: { x: 1440, y: 570 }, exit: { x: 2690, y: 540 },
    secret: 'A loop gives you an opening. You still have to take it.',
  },
  {
    name: 'A Matter of Timing', chapter: 2, subtitle: 'Three axes. No dead time.', par: 28,
    note: 'The lifts move through danger. Sketch in the air, dash off early, and use a Loop to hold a safe window.',
    dialogue: 'ONE BAD LANDING IS ALL IT TAKES.', goal: 'Stay above the machinery.', width: 2900,
    platforms: [floor(0, 450), floor(1080, 340), floor(2470, 430), ledge(950, 360, 220), ledge(1810, 250, 130), ledge(2240, 390, 140)],
    edits: [rail('elevator', 'loop', 500, 560, 180, 0, -240), rail('transfer', 'loop', 1460, 360, 180, 220), stroke('timing-step', 2010, 340, 160)],
    hazards: [teeth(1130, 140), teeth(2560, 140)],
    sweepers: [saw(610, 435, 150, 0, 1400, 27), saw(1220, 290, 140, 0, 1600, 27), saw(1710, 220, 0, 170, 1450, 28), saw(2140, 270, 0, 160, 1600, 26, .4)],
    fragments: [{ x: 590, y: 265 }, { x: 1880, y: 195 }, { x: 2310, y: 335 }],
    checkpoint: { x: 1060, y: 325 }, exit: { x: 2790, y: 540 },
    secret: 'THE FAST LINE // Leave the lift before it stops.',
  },
  {
    name: 'The Inkstorm', chapter: 2, subtitle: 'Your route is already disappearing.', par: 26,
    note: 'Outlined bridges expire in three seconds. Draw late, land clean, move immediately. R resets every timer.',
    dialogue: 'THREE SECONDS. MAKE THEM COUNT.', goal: 'Outrun the fading platforms.', width: 3200,
    platforms: [floor(0, 410), floor(1290, 360), floor(2790, 410), ledge(780, 350, 130), ledge(1400, 410, 130), ledge(2180, 360, 130)],
    edits: [stroke('storm-a', 450, 550, 230, 3000), stroke('storm-b', 850, 490, 240, 3000), stroke('storm-c', 1690, 550, 240, 2800), stroke('storm-d', 2030, 490, 250, 2800), stroke('storm-e', 2390, 530, 260, 3200)],
    hazards: [teeth(1370, 100), teeth(2910, 100)],
    sweepers: [saw(700, 420, 0, 130, 1400, 25), saw(1140, 440, 100, 0, 1300, 26), saw(1900, 375, 0, 160, 1500, 28), saw(2420, 410, 220, 0, 1450, 29, .3)],
    fragments: [{ x: 845, y: 295 }, { x: 1460, y: 355 }, { x: 2240, y: 305 }],
    checkpoint: { x: 1560, y: 570 }, exit: { x: 3090, y: 540 },
    secret: 'Nothing here is permanent. Including the obstacles.',
  },
  {
    name: 'Broken Rules', chapter: 3, subtitle: 'Use everything. Hesitate nowhere.', par: 29,
    note: 'Stroke a landing. Arrow a launch. Loop a saw. Swap tools with 1/2/3 without stopping.',
    dialogue: 'ONE RUN. THREE TOOLS.', goal: 'Break through the mixed gauntlet.', width: 3400,
    platforms: [floor(0, 460), floor(1120, 330), floor(2380, 440), floor(3090, 310), ledge(850, 400, 140), ledge(1810, 320, 150), ledge(2090, 410, 130), ledge(2680, 350, 140)],
    edits: [stroke('fracture', 500, 550, 250, 3500), rail('launch-rig', 'arrow', 1470, 550, 180, 0, -230), rail('crossfire', 'loop', 2000, 360, 170, 260), stroke('exit-fracture', 2840, 520, 190, 3000)],
    hazards: [teeth(1190, 100), teeth(2500, 150), teeth(3150, 70)],
    sweepers: [saw(810, 465, 160, 0, 1350, 27), saw(1700, 410, 0, 150, 1450, 29), saw(2210, 290, 0, 160, 1400, 28), saw(2890, 410, 0, 100, 1200, 26, .5)],
    fragments: [{ x: 920, y: 345 }, { x: 1880, y: 265 }, { x: 2750, y: 295 }],
    checkpoint: { x: 1370, y: 570 }, exit: { x: 3290, y: 540 },
    secret: 'The quickest route is the one you draw yourself.',
  },
  {
    name: 'The Eraser’s Workshop', chapter: 3, subtitle: 'A machine built to delete you.', par: 32,
    note: 'The upper route cuts across the workshop. The lower route has room to recover and worse saw lanes.',
    dialogue: 'DO NOT GIVE THE ERASER A CLEAN SHOT.', goal: 'Cut through the workshop.', width: 3600,
    platforms: [floor(0, 500), floor(1030, 360), floor(1960, 360), floor(3070, 530), ledge(580, 450, 150), ledge(860, 310, 160), ledge(1220, 490, 100), ledge(1370, 400, 140), ledge(1650, 280, 140), ledge(2320, 420, 140), ledge(2700, 300, 170)],
    edits: [rail('workshop-lift', 'arrow', 780, 560, 150, 0, -210), rail('scrap-runner', 'loop', 1540, 540, 160, 190), stroke('archive-cut', 2500, 460, 130), rail('escape-lift', 'arrow', 2890, 540, 150, 0, -160)],
    hazards: [teeth(300, 90), teeth(1110, 100), teeth(2010, 60), teeth(3210, 170)],
    sweepers: [saw(760, 340, 0, 150, 1400, 28), saw(1410, 300, 150, 0, 1250, 28), saw(1840, 390, 0, 165, 1550, 29), saw(2580, 330, 130, 0, 1300, 29), saw(2990, 285, 0, 170, 1400, 27, .4)],
    fragments: [{ x: 930, y: 255 }, { x: 1720, y: 225 }, { x: 2770, y: 245 }],
    checkpoint: { x: 2180, y: 570 }, exit: { x: 3490, y: 540 },
    secret: 'ARCHIVE // Every erased line left a mark.',
  },
  {
    name: 'The Last Drawing', chapter: 3, subtitle: 'Write your way out.', par: 34,
    note: 'Every tool, every axis. Chain dashes through the saws. Keep a charge for the last gap.',
    dialogue: 'THE ERASER IS OUT OF ROOM.', goal: 'Reach the Eraser. End the loop.', width: 3600,
    platforms: [floor(0, 420), floor(1110, 300), floor(2240, 340), floor(3220, 380), ledge(690, 420, 140), ledge(1540, 430, 130), ledge(1890, 310, 150), ledge(2720, 380, 140), ledge(3020, 460, 110)],
    edits: [stroke('last-start', 450, 550, 190), rail('last-launch', 'arrow', 900, 560, 150, 0, -240), rail('last-cycle', 'loop', 1710, 490, 150, 0, -180), stroke('last-memory', 2410, 480, 210, 3000), stroke('last-line', 2870, 500, 170, 2500)],
    hazards: [teeth(1200, 50), teeth(2320, 100), teeth(3310, 100)],
    sweepers: [saw(780, 330, 0, 165, 1300, 28), saw(1530, 330, 140, 0, 1250, 29), saw(2040, 330, 0, 170, 1400, 30), saw(2670, 290, 0, 160, 1200, 29), saw(3140, 365, 0, 125, 1300, 28), saw(3370, 450, 120, 0, 1400, 27, .5)],
    fragments: [{ x: 760, y: 365 }, { x: 1960, y: 255 }, { x: 2790, y: 325 }],
    checkpoint: { x: 1320, y: 570 }, exit: { x: 3490, y: 540 },
    secret: 'FINAL RECORD // No line left behind.',
  },
];

export function availableTools(_level: number): Tool[] {
  return ['stroke', 'arrow', 'loop'];
}

export function gestureValid(tool: Tool, points: { x: number; y: number }[]): boolean {
  if (points.length < 4) return true;
  const a = points[0], b = points[points.length - 1];
  const length = points.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  if (length < 18) return true;
  if (tool === 'stroke') return length > 25;
  if (tool === 'arrow') return Math.hypot(b.x - a.x, b.y - a.y) > 25;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return Math.max(...xs) - Math.min(...xs) > 25 && Math.max(...ys) - Math.min(...ys) > 25 && Math.hypot(b.x - a.x, b.y - a.y) < length * .65;
}
