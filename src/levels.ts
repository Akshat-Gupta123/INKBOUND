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
  color: number; music: number;
  platforms: Rect[]; edits: Edit[]; hazards: Rect[]; sweepers: Sweeper[];
  fragments: { x: number; y: number }[];
  checkpoint?: { x: number; y: number }; exit: { x: number; y: number };
  gate?: Rect; plate?: Rect; secret: string;
};
const floor = (x: number, w: number, y = 610): Rect => ({ x, y, w, h: 65 });
const ledge = (x: number, y: number, w = 150): Rect => ({ x, y, w, h: 22 });
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

/** Authored height sequences keep each course distinct; the shared construction rules
 * enforce the same unforgiving baseline on every course, including the former easy ones.
 * Shelf-to-shelf gaps are 390–510px, with one 64px fading ink foothold per transfer.
 * No regular course has a checkpoint. Spawn and finish have safe, bounded runways. */
type Course = Pick<Level, 'name' | 'color' | 'music' | 'chapter' | 'subtitle'> & { heights: number[] };
const courses: Course[] = [
  { name: 'Neon Rush', color: 0xffd34e, music: 1, chapter: 0, subtitle: 'Crossed blades. Knife-edge landings.', heights: [510, 385, 490, 350, 465, 330, 450, 340, 480, 390, 520] },
  { name: 'Vanishing Point', color: 0x52d8ff, music: 0, chapter: 0, subtitle: 'Your foothold fades in one second.', heights: [500, 420, 335, 450, 350, 480, 380, 505, 390, 490, 360, 510] },
  { name: 'Vertical Voltage', color: 0xff9857, music: 2, chapter: 0, subtitle: 'Climb, drop, redirect. No recovery floor.', heights: [510, 380, 265, 385, 275, 400, 290, 410, 300, 430, 540] },
  { name: 'Assembly Line', color: 0xff6757, music: 3, chapter: 1, subtitle: 'Double saw presses on every transfer.', heights: [530, 445, 360, 465, 380, 490, 400, 510, 420, 335, 450, 535] },
  { name: 'Kickback', color: 0xff67aa, music: 2, chapter: 1, subtitle: 'Break one blade. Freeze the next.', heights: [520, 400, 500, 375, 490, 365, 480, 350, 470, 390, 525] },
  { name: 'Air Gap', color: 0xb68cff, music: 0, chapter: 1, subtitle: 'Long voids. Draw the landing mid-flight.', heights: [490, 380, 470, 350, 460, 330, 455, 345, 470, 370, 510] },
  { name: 'Phase Lock', color: 0x45e6d3, music: 3, chapter: 2, subtitle: 'Opposing cycles. Less than a second to pass.', heights: [500, 370, 485, 360, 475, 350, 465, 340, 480, 380, 525] },
  { name: 'Cross Current', color: 0x6f8cff, music: 1, chapter: 2, subtitle: 'Vertical blades intersect horizontal rushes.', heights: [515, 390, 275, 395, 285, 410, 300, 425, 315, 445, 535] },
  { name: 'Whiteout', color: 0xb7e9ff, music: 0, chapter: 2, subtitle: 'A short sketch. A shorter opening.', heights: [500, 395, 490, 380, 475, 365, 460, 350, 445, 390, 520] },
  { name: 'Crossfire', color: 0xe8ee55, music: 2, chapter: 3, subtitle: 'Three tools. Every gap contested.', heights: [520, 400, 285, 405, 295, 420, 310, 435, 325, 445, 360, 530] },
  { name: 'Scrap Circuit', color: 0xd66fff, music: 3, chapter: 3, subtitle: 'Needle shelves inside a moving shredder.', heights: [510, 390, 480, 360, 450, 330, 435, 315, 425, 350, 465, 535] },
  { name: 'Terminal Velocity', color: 0xff4675, music: 1, chapter: 3, subtitle: 'Thirteen transfers. One uninterrupted clear.', heights: [495, 365, 470, 340, 450, 320, 430, 300, 415, 335, 455, 540] },
  { name: 'Afterglow', color: 0x70ef99, music: 0, chapter: 0, subtitle: 'The warm-up is gone. Commit immediately.', heights: [515, 385, 495, 375, 480, 355, 465, 345, 455, 385, 530] },
  { name: 'Blue Hour', color: 0x4fafff, music: 1, chapter: 2, subtitle: 'Blue skyline. Red crossing blades.', heights: [500, 370, 475, 345, 450, 325, 435, 350, 465, 390, 525] },
  { name: 'Golden Track', color: 0xffc27b, music: 2, chapter: 1, subtitle: 'Gold rails over a continuous spike bed.', heights: [525, 410, 295, 415, 305, 425, 315, 440, 330, 450, 540] },
  { name: 'Springboard', color: 0xa7ee72, music: 3, chapter: 0, subtitle: 'Land, redraw, launch. Never settle.', heights: [500, 370, 480, 350, 460, 330, 440, 310, 430, 350, 470, 535] },
  { name: 'Tidal Circuit', color: 0x55c9ba, music: 0, chapter: 2, subtitle: 'Three currents through every landing.', heights: [515, 400, 290, 410, 300, 420, 310, 440, 325, 450, 535] },
  { name: 'Skyline Relay', color: 0x8c9dff, music: 1, chapter: 3, subtitle: 'Tiny skyline ledges. Nothing beneath.', heights: [490, 365, 260, 380, 275, 395, 290, 410, 305, 430, 540] },
  { name: 'Rose Engine', color: 0xf197d2, music: 2, chapter: 1, subtitle: 'A running engine of staggered saws.', heights: [520, 405, 290, 420, 305, 435, 320, 445, 335, 455, 540] },
  { name: 'Copper Canyon', color: 0xe5b851, music: 3, chapter: 0, subtitle: 'Cut the canyon in one run.', heights: [505, 375, 480, 350, 455, 325, 430, 300, 415, 340, 460, 535] },
];

function buildCourse(course: Course, index: number): Level {
  const platforms: Rect[] = [floor(0, 260)];
  const edits: Edit[] = [], sweepers: Sweeper[] = [], hazards: Rect[] = [];
  let x = 590;
  const shelves = course.heights.map((y, step) => {
    if (step) x += 440 + ((index * 3 + step * 2) % 5) * 18;
    // 36–52px landing shelves: a 67–96ms window at running speed.
    const p = ledge(x, y, 36 + ((index + step) % 5) * 4);
    platforms.push(p);
    return p;
  });
  const finishX = x + 420, width = finishX + 260;
  platforms.push(floor(finishX, 260));
  // The continuous spike bed rules out walking beneath the authored route.
  hazards.push({x:280,y:648,w:finishX-300,h:52});
  const route = [platforms[0], ...shelves, platforms[platforms.length-1]];
  for (let step = 1; step < route.length; step++) {
    const a = route[step-1], b = route[step];
    const mid = (a.x + a.w + b.x) / 2;
    const y = Math.min(570, (a.y + b.y) / 2 + 36);
    edits.push(stroke(`transfer-${step}`, mid-32, y, 64, 950 + (step % 3)*100));
    // Crossed vertical and diagonal lanes demand separate dash / Loop decisions.
    const cycle = 760 + ((index + step) % 5)*65;
    sweepers.push(saw(mid-85, Math.max(155,y-240), 0, 240, cycle, 29+(step%3), (step%4)*.17));
    sweepers.push(saw(mid+80, Math.max(150,y-200), 75, 150, cycle+105, 28+(index%4), .5+(step%3)*.11));
    // A third blade patrols alternating landing shelves. None reaches the runways.
    if (step < route.length-1 && (step+index)%2===0) {
      sweepers.push(saw(b.x-65,b.y-86,140,0,880+(step%3)*80,27,.25));
    }
    // Alternating ceiling teeth force a low entry to selected transfers; they never
    // touch the ink foothold or the landing shelf. Leave 120px+ vertical clearance.
    if (step%3===2) hazards.push({x:mid-25,y:-160,w:50,h:Math.max(250,y-245+160)});
  }
  const cacheSteps = [2, Math.floor(shelves.length/2), shelves.length-2];
  return {
    ...course, dialogue:'', width, par:Math.ceil(width/360)+5,
    note:'NO CHECKPOINTS · 3 INK · Stroke 1.1s / Arrow 1s / Loop 0.7s · R restarts the run.',
    goal:'Clear the entire course in one run.',
    platforms, edits, hazards, sweepers,
    fragments:cacheSteps.map(i=>({x:shelves[i].x+shelves[i].w/2,y:shelves[i].y-65})),
    exit:{x:finishX+150,y:540}, secret:'CACHE / A clean landing buys the next launch.',
  };
}
export const levels: Level[] = courses.map(buildCourse);

/** A separate practice arena; never counted among the twenty ranked levels. */
export const tutorialLevel: Level = {
  name: 'Mechanics Lab', chapter: 0, color: 0x65e5c2, music: 0,
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
export const levelOrder = levels.map((_, index) => index);
