export type Tool = 'stroke' | 'arrow' | 'loop';
export const difficulties = ['Easy', 'Normal', 'Hard', 'Insane', 'Extreme'] as const;
export type Difficulty = typeof difficulties[number];
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
  color: number; difficulty: Difficulty; music: number;
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
    name: 'Neon Rush', color: 0xffd34e, difficulty: 'Hard', music: 1, chapter: 0, subtitle: 'No warm-up lap.', par: 20,
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
    name: 'Vanishing Point', color: 0x52d8ff, difficulty: 'Hard', music: 0, chapter: 0, subtitle: 'Build your landing before you need it.', par: 23,
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
    name: 'Vertical Voltage', color: 0xff9857, difficulty: 'Hard', music: 2, chapter: 0, subtitle: 'Vertical pressure.', par: 25,
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
    name: 'Assembly Line', color: 0xff6757, difficulty: 'Hard', music: 3, chapter: 1, subtitle: 'Production never stops.', par: 26,
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
    name: 'Kickback', color: 0xff67aa, difficulty: 'Insane', music: 2, chapter: 1, subtitle: 'Turn momentum into a weapon.', par: 24,
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
    name: 'Air Gap', color: 0xb68cff, difficulty: 'Insane', music: 0, chapter: 1, subtitle: 'There is no bridge coming.', par: 27,
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
    name: 'Phase Lock', color: 0x45e6d3, difficulty: 'Insane', music: 3, chapter: 2, subtitle: 'Read the cycle. Commit.', par: 25,
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
    name: 'Cross Current', color: 0x6f8cff, difficulty: 'Insane', music: 1, chapter: 2, subtitle: 'Three axes. No dead time.', par: 28,
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
    name: 'Whiteout', color: 0xb7e9ff, difficulty: 'Extreme', music: 0, chapter: 2, subtitle: 'Your route is already disappearing.', par: 26,
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
    name: 'Crossfire', color: 0xe8ee55, difficulty: 'Extreme', music: 2, chapter: 3, subtitle: 'Use everything. Hesitate nowhere.', par: 29,
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
    name: 'Scrap Circuit', color: 0xd66fff, difficulty: 'Extreme', music: 3, chapter: 3, subtitle: 'No room for a bad landing.', par: 32,
    note: 'The upper route cuts across the workshop. The lower route has room to recover and worse saw lanes.',
    dialogue: '', goal: 'Cut through the scrap circuit.', width: 3600,
    platforms: [floor(0, 500), floor(1030, 360), floor(1960, 360), floor(3070, 530), ledge(580, 450, 150), ledge(860, 310, 160), ledge(1220, 490, 100), ledge(1370, 400, 140), ledge(1650, 280, 140), ledge(2320, 420, 140), ledge(2700, 300, 170)],
    edits: [rail('workshop-lift', 'arrow', 780, 560, 150, 0, -210), rail('scrap-runner', 'loop', 1540, 540, 160, 190), stroke('archive-cut', 2500, 460, 130), rail('escape-lift', 'arrow', 2890, 540, 150, 0, -160)],
    hazards: [teeth(300, 90), teeth(1110, 100), teeth(2010, 60), teeth(3210, 170)],
    sweepers: [saw(760, 340, 0, 150, 1400, 28), saw(1410, 300, 150, 0, 1250, 28), saw(1840, 390, 0, 165, 1550, 29), saw(2580, 330, 130, 0, 1300, 29), saw(2990, 285, 0, 170, 1400, 27, .4)],
    fragments: [{ x: 930, y: 255 }, { x: 1720, y: 225 }, { x: 2770, y: 245 }],
    checkpoint: { x: 2180, y: 570 }, exit: { x: 3490, y: 540 },
    secret: 'ARCHIVE // Every erased line left a mark.',
  },
  {
    name: 'Terminal Velocity', color: 0xff4675, difficulty: 'Extreme', music: 1, chapter: 3, subtitle: 'Full speed. Full commitment.', par: 34,
    note: 'Every tool, every axis. Chain dashes through the saws. Keep a charge for the last gap.',
    dialogue: '', goal: 'Chain the launch pads. Reach the finish.', width: 3600,
    platforms: [floor(0, 420), floor(1110, 300), floor(2240, 340), floor(3220, 380), ledge(690, 420, 140), ledge(1540, 430, 130), ledge(1890, 310, 150), ledge(2720, 380, 140), ledge(3020, 460, 110)],
    edits: [stroke('last-start', 450, 550, 190), rail('last-launch', 'arrow', 900, 560, 150, 0, -240), rail('last-cycle', 'loop', 1710, 490, 150, 0, -180), stroke('last-memory', 2410, 480, 210, 3000), stroke('last-line', 2870, 500, 170, 2500)],
    hazards: [teeth(1200, 50), teeth(2320, 100), teeth(3310, 100)],
    sweepers: [saw(780, 330, 0, 165, 1300, 28), saw(1530, 330, 140, 0, 1250, 29), saw(2040, 330, 0, 170, 1400, 30), saw(2670, 290, 0, 160, 1200, 29), saw(3140, 365, 0, 125, 1300, 28), saw(3370, 450, 120, 0, 1400, 27, .5)],
    fragments: [{ x: 760, y: 365 }, { x: 1960, y: 255 }, { x: 2790, y: 325 }],
    checkpoint: { x: 1320, y: 570 }, exit: { x: 3490, y: 540 },
    secret: 'FINAL RECORD // No line left behind.',
  },
  {
    name: 'Afterglow', chapter: 0, color: 0x70ef99, difficulty: 'Easy', music: 0,
    subtitle: 'Open floor. Room to find your rhythm.', par: 18,
    note: 'The lower path is forgiving. Jump onto the upper ledges for all three fragments.',
    dialogue: '', goal: 'Find your pace. Reach the finish.', width: 2200,
    platforms: [floor(0, 750), floor(890, 610), floor(1640, 560), ledge(350, 490, 180), ledge(1080, 470, 180), ledge(1780, 490, 180)],
    edits: [stroke('glow-bridge', 750, 600, 140), rail('glow-lift', 'arrow', 1510, 580, 120, 0, -110)],
    hazards: [teeth(1880, 55)],
    sweepers: [saw(1300, 410, 0, 65, 3400, 20)],
    fragments: [{ x: 440, y: 435 }, { x: 1170, y: 415 }, { x: 1860, y: 435 }],
    checkpoint: { x: 1420, y: 570 }, exit: { x: 2090, y: 540 },
    secret: 'UPPER LINE // Extra height buys extra time.',
  },
  {
    name: 'Blue Hour', chapter: 2, color: 0x4fafff, difficulty: 'Easy', music: 1,
    subtitle: 'Wide landings above a quiet clockwork floor.', par: 20,
    note: 'Jump early, land in the center. A Loop field makes the lone saw safe to pass.',
    dialogue: '', goal: 'Cross the broad steps.', width: 2300,
    platforms: [floor(0, 620), floor(760, 580), floor(1480, 820), ledge(370, 475, 210), ledge(840, 430, 230), ledge(1130, 475, 150), ledge(1710, 460, 230)],
    edits: [stroke('blue-step', 630, 535, 120), rail('blue-shuttle', 'loop', 1350, 550, 120, 130)],
    hazards: [teeth(1790, 55)],
    sweepers: [saw(1050, 360, 110, 0, 3600, 20)],
    fragments: [{ x: 465, y: 420 }, { x: 940, y: 375 }, { x: 1810, y: 405 }],
    checkpoint: { x: 1600, y: 570 }, exit: { x: 2190, y: 540 },
    secret: 'CLOCK CHECK // You choose when to go.',
  },
  {
    name: 'Golden Track', chapter: 1, color: 0xffc27b, difficulty: 'Easy', music: 2,
    subtitle: 'A sprint course with clear take-off marks.', par: 17,
    note: 'The floor gaps are short. Use Arrow [2] for a faster line over the small spike patch.',
    dialogue: '', goal: 'Build speed across the track.', width: 2400,
    platforms: [floor(0, 850), floor(990, 600), floor(1730, 670), ledge(400, 470, 210), ledge(1170, 470, 210), ledge(1900, 460, 210)],
    edits: [rail('gold-riser', 'arrow', 860, 580, 120, 0, -100), stroke('gold-span', 1590, 590, 140)],
    hazards: [teeth(2010, 65)],
    sweepers: [saw(1370, 390, 140, 0, 3300, 21)],
    fragments: [{ x: 500, y: 415 }, { x: 1270, y: 415 }, { x: 2000, y: 405 }],
    checkpoint: { x: 1510, y: 570 }, exit: { x: 2290, y: 540 },
    secret: 'CLEAN SPLIT // Dash before the landing, not after.',
  },
  {
    name: 'Springboard', chapter: 0, color: 0xa7ee72, difficulty: 'Easy', music: 3,
    subtitle: 'Take the low road or practice a higher line.', par: 21,
    note: 'Wide steps make room to practice. Draw an extra platform if you miss the upper route.',
    dialogue: '', goal: 'Link the low steps and finish.', width: 2500,
    platforms: [floor(0, 720), floor(860, 620), floor(1620, 880), ledge(300, 495, 190), ledge(560, 395, 180), ledge(1020, 460, 200), ledge(1830, 470, 210), ledge(2110, 380, 160)],
    edits: [stroke('spring-step', 740, 520, 120), rail('spring-lift', 'arrow', 1500, 570, 120, 0, -160)],
    hazards: [teeth(1940, 60)],
    sweepers: [saw(1260, 400, 100, 60, 3500, 20)],
    fragments: [{ x: 640, y: 340 }, { x: 1120, y: 405 }, { x: 2180, y: 325 }],
    checkpoint: { x: 1710, y: 570 }, exit: { x: 2390, y: 540 },
    secret: 'EXTRA HEIGHT // There is no penalty for taking the safer route.',
  },
  {
    name: 'Tidal Circuit', chapter: 2, color: 0x55c9ba, difficulty: 'Normal', music: 0,
    subtitle: 'Moving ferries, predictable timing.', par: 24,
    note: 'Ride the short ferries or draw across them. Watch each saw complete a cycle before committing.',
    dialogue: '', goal: 'Cross the three channels.', width: 2800,
    platforms: [floor(0, 570), floor(960, 430), floor(1780, 390), floor(2530, 270), ledge(700, 440, 170), ledge(1180, 450, 160), ledge(1980, 430, 170)],
    edits: [rail('tide-ferry-a', 'loop', 600, 560, 170, 180), stroke('tide-cut', 1420, 540, 190), rail('tide-ferry-b', 'loop', 2210, 550, 160, 150)],
    hazards: [teeth(1110, 85), teeth(1890, 80)],
    sweepers: [saw(810, 355, 0, 140, 2600, 23), saw(2320, 410, 100, 0, 2400, 23, .4)],
    fragments: [{ x: 780, y: 385 }, { x: 1260, y: 395 }, { x: 2060, y: 375 }],
    checkpoint: { x: 1330, y: 570 }, exit: { x: 2690, y: 540 },
    secret: 'TIDAL WINDOW // The ferry is an option, not a schedule.',
  },
  {
    name: 'Skyline Relay', chapter: 3, color: 0x8c9dff, difficulty: 'Normal', music: 1,
    subtitle: 'A rooftop route with room to recover.', par: 25,
    note: 'Jump to the next roof before the saw returns. Use an upward dash if a jump falls short.',
    dialogue: '', goal: 'Link the rooftop terraces.', width: 2900,
    platforms: [floor(0, 570), floor(1100, 440), floor(2360, 540), ledge(600, 470, 180), ledge(870, 380, 180), ledge(1290, 440, 170), ledge(1740, 380, 190), ledge(2060, 470, 170)],
    edits: [stroke('relay-step', 1560, 490, 160), rail('relay-lift', 'arrow', 1950, 540, 130, 0, -130), stroke('relay-exit', 2240, 550, 120)],
    hazards: [teeth(1230, 80), teeth(2520, 100)],
    sweepers: [saw(1020, 300, 0, 130, 2500, 24), saw(2140, 360, 130, 0, 2200, 24, .4)],
    fragments: [{ x: 950, y: 325 }, { x: 1830, y: 325 }, { x: 2140, y: 415 }],
    checkpoint: { x: 1460, y: 570 }, exit: { x: 2790, y: 540 },
    secret: 'SKYLINE // The roof route cuts a corner.',
  },
  {
    name: 'Rose Engine', chapter: 1, color: 0xf197d2, difficulty: 'Normal', music: 2,
    subtitle: 'Two lifts and a narrow timing window.', par: 26,
    note: 'Launch upward, then dash onto the next platform. Loop fields give you time to line up a landing.',
    dialogue: '', goal: 'Clear the machine rooms.', width: 3000,
    platforms: [floor(0, 620), floor(1060, 400), floor(1920, 400), floor(2670, 330), ledge(800, 420, 180), ledge(1260, 450, 170), ledge(1630, 340, 170), ledge(2200, 450, 150)],
    edits: [rail('rose-lift-a', 'arrow', 650, 570, 130, 0, -140), rail('rose-lift-b', 'arrow', 1490, 550, 130, 0, -180), stroke('rose-span', 2370, 540, 230)],
    hazards: [teeth(1160, 80), teeth(2040, 90), teeth(2750, 65)],
    sweepers: [saw(970, 340, 0, 140, 2600, 23), saw(1790, 390, 0, 110, 2300, 24), saw(2500, 405, 120, 0, 2400, 23, .5)],
    fragments: [{ x: 890, y: 365 }, { x: 1700, y: 285 }, { x: 2270, y: 395 }],
    checkpoint: { x: 1370, y: 570 }, exit: { x: 2890, y: 540 },
    secret: 'ENGINE BYPASS // Boost out before the lift reaches the top.',
  },
  {
    name: 'Copper Canyon', chapter: 0, color: 0xe5b851, difficulty: 'Normal', music: 3,
    subtitle: 'Small islands. Long sightlines.', par: 27,
    note: 'Read the whole gap before jumping. Sketch a mid-air foothold and save a dash for the last island.',
    dialogue: '', goal: 'Find the line through the canyon.', width: 3100,
    platforms: [floor(0, 530), floor(1260, 400), floor(2640, 460), ledge(730, 480, 150), ledge(1010, 390, 150), ledge(1850, 450, 150), ledge(2180, 360, 150), ledge(2470, 480, 130)],
    edits: [stroke('copper-entry', 560, 550, 150), rail('copper-shuttle', 'loop', 1680, 550, 150, 220), stroke('copper-last', 2310, 510, 150)],
    hazards: [teeth(1360, 80), teeth(2790, 100)],
    sweepers: [saw(910, 345, 0, 150, 2600, 23), saw(2050, 340, 0, 150, 2400, 24), saw(2540, 365, 70, 0, 2300, 23, .5)],
    fragments: [{ x: 1080, y: 335 }, { x: 1920, y: 395 }, { x: 2250, y: 305 }],
    checkpoint: { x: 1570, y: 570 }, exit: { x: 2990, y: 540 },
    secret: 'CANYON LINE // A short sketch can save a long fall.',
  },
];

/** A separate practice arena; never counted among the twenty ranked levels. */
export const tutorialLevel: Level = {
  name: 'Mechanics Lab', chapter: 0, color: 0x65e5c2, difficulty: 'Easy', music: 0,
  subtitle: 'Learn by doing. Retry without penalties.', par: 90,
  note: 'Follow the practice card. A/D move · Space jump · Shift dash · 1/2/3 tools · Mouse draw.',
  dialogue: '', goal: 'Practice movement, dash and all three ink tools.', width: 1600,
  platforms: [floor(0, 1600)],
  edits: [stroke('practice-stroke', 1100, 475, 150), rail('practice-arrow', 'arrow', 1260, 550, 110, 0, -80), rail('practice-loop', 'loop', 1390, 480, 100, 90)],
  hazards: [], sweepers: [saw(850, 490, 160, 0, 4000, 24)],
  fragments: [{ x: 360, y: 555 }, { x: 590, y: 555 }, { x: 1260, y: 555 }],
  checkpoint: { x: 730, y: 570 }, exit: { x: 1500, y: 540 },
  secret: 'Practice is saved separately from ranked level results.',
};

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

/** Display order is independent of saved level IDs. */
export const levelOrder = levels.map((_, index) => index).sort((a,b) => difficulties.indexOf(levels[a].difficulty)-difficulties.indexOf(levels[b].difficulty));
