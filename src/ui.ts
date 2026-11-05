import { levels, levelOrder, tutorialLevel, type Level } from './levels';
import { save, persist } from './save';
import { sound } from './audio';

export const ui = document.querySelector<HTMLDivElement>('#ui')!;
document.documentElement.classList.toggle('reduce-motion', save.reduced);
export const escapeHTML = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const difficultyNames = ['Easy', 'Normal', 'Hard', 'Insane', 'Extreme'] as const;
type Filter = 'All' | typeof difficultyNames[number];
let pickerAbort: AbortController | undefined;
let lastSelected: number | undefined;
let activeFilter: Filter = 'All';

/** Stop picker key listeners before gameplay or a modal takes ownership of input. */
export function leavePicker() { pickerAbort?.abort(); pickerAbort = undefined; }

export function button(text: string, fn: () => void, cls = '') {
  const b = document.createElement('button');
  b.className = cls; b.textContent = text;
  b.onclick = () => { sound.unlock(); sound.play('click'); fn(); };
  return b;
}

export function modal(title: string, copy: string) {
  leavePicker();
  ui.innerHTML = `<div class="veil"><section class="sheet"><div class="eyebrow">INKBOUND / ARCADE</div><h2>${title}</h2><p>${copy}</p><div class="actions"></div></section></div>`;
  return ui.querySelector<HTMLElement>('.actions')!;
}

const hex = (color: number) => '#' + color.toString(16).padStart(6, '0');
const levelAt = (index: number): Level => index === -1 ? tutorialLevel : levels[index];
function face(difficulty: string, small = false) {
  const mood = difficultyNames.indexOf(difficulty as typeof difficultyNames[number]);
  const eyes = mood < 2 ? '<path d="M24 27v7m16-7v7"/>' : mood === 2 ? '<path d="m20 25 10 4m14-4-10 4m-10 3v3m16-3v3"/>' : mood === 3 ? '<path d="m20 25 10 9m0-9-10 9m14-9 10 9m0-9-10 9"/>' : '<path d="m19 23 12 7-10 5m24-12-12 7 10 5"/>';
  const mouth = mood < 1 ? '<path d="M23 42q9 10 18 0"/>' : mood === 1 ? '<path d="M25 44h14"/>' : '<path d="m23 45 5-5 4 5 4-5 5 5"/>';
  return `<svg class="difficulty-face ${small ? 'small' : ''}" viewBox="0 0 64 64" aria-hidden="true"><path class="face-shell" d="M18 4h28l14 14v28L46 60H18L4 46V18Z"/><g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="square">${eyes}${mouth}</g></svg>`;
}
function routeArt(level: Level) {
  const sx = (x: number) => 18 + x / level.width * 590;
  const sy = (y: number) => 16 + (y - 120) / 500 * 112;
  const platforms = level.platforms.map(p => `<path d="M${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}h${(p.w / level.width * 590).toFixed(1)}"/>`).join('');
  const edits = level.edits.map(p => `<path class="route-edit" d="M${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}h${(p.w / level.width * 590).toFixed(1)}"/>`).join('');
  const saws = level.sweepers.map(p => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="5" class="route-saw"/>`).join('');
  return `<svg class="route-art" viewBox="0 0 630 150" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3">${platforms}${edits}${saws}</g><path d="M27 113 35 103 44 113 35 124Z" fill="currentColor"/><path d="M598 114v-27l16 6-16 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}

export function menu(start: (n: number) => void) { selection(start); }
export function selection(start: (n: number) => void, initialIndex?: number) {
  leavePicker();
  pickerAbort = new AbortController();
  const controller = pickerAbort;
  const fallback = !save.tutorialComplete ? -1 : Math.min(levels.length - 1, Math.max(0, save.current));
  let selected = initialIndex ?? (lastSelected !== undefined && lastSelected < levels.length ? lastSelected : fallback);
  if (!save.tutorialComplete && lastSelected === undefined) activeFilter = 'All';
  const ids = () => activeFilter === 'All' ? [-1, ...levelOrder] : levelOrder.filter(i => levels[i].difficulty === activeFilter);
  if (!ids().includes(selected)) selected = ids()[0] ?? -1;
  const play = () => { lastSelected = selected; leavePicker(); start(selected); };
  const move = (direction: number) => {
    const list = ids();
    if (list.length < 2) return;
    selected = list[(list.indexOf(selected) + direction + list.length) % list.length];
    sound.unlock(); sound.play('click'); render();
  };
  const render = () => {
    const focused = document.activeElement instanceof HTMLButtonElement && ui.contains(document.activeElement) ? document.activeElement : undefined;
    const focusKey = focused?.id || focused?.getAttribute('aria-label') || focused?.textContent;
    lastSelected = selected;
    const list = ids(), position = list.indexOf(selected), level = levelAt(selected), theme = hex(level.color);
    sound.setContext('menu',level.music);document.documentElement.style.setProperty('--level-color',theme);
    const training = selected === -1, done = training ? save.tutorialComplete : save.completed.includes(selected);
    const previous = list[(position - 1 + list.length) % list.length], next = list[(position + 1) % list.length];
    const preview = (index: number, side: 'previous' | 'next') => {
      const l = levelAt(index);
      return `<button class="side-card ${side}" data-preview="${index}" aria-label="Preview ${escapeHTML(l.name)}" style="--card-color:${hex(l.color)}"><span>${index === -1 ? 'TRAINING' : `LEVEL ${String(levelOrder.indexOf(index) + 1).padStart(2, '0')}`}</span>${face(index === -1 ? 'Easy' : l.difficulty, true)}<strong>${escapeHTML(l.name)}</strong><small>${index === -1 ? 'Tutorial' : l.difficulty}</small></button>`;
    };
    ui.innerHTML = `<main class="picker-screen" style="--picker-color:${theme}" aria-label="Level picker"><div class="picker-grid" aria-hidden="true"></div><div class="picker-orbit" aria-hidden="true"></div><header class="picker-header"><div class="brand"><span class="brand-glyph">◈</span> INKBOUND<span class="brand-sub">ARCADE / V.03</span></div><div class="picker-header-actions"></div></header><section class="picker-heading"><div class="eyebrow">YOUR LEVEL. YOUR LINE.</div><h2>CHOOSE YOUR RUN</h2><p>${levels.length} levels. Five difficulties. Everything unlocked.</p></section><nav class="difficulty-filters" aria-label="Filter by difficulty"></nav><section class="level-carousel" aria-roledescription="carousel" aria-label="Levels"><button class="carousel-arrow previous-arrow" aria-label="Previous level">‹</button>${preview(previous, 'previous')}<article id="level-card" class="level-card ${training ? 'training-card' : ''}" data-level-index="${selected}" style="--card-color:${theme}" aria-label="Selected level"><div class="card-corner top-left"></div><div class="card-corner bottom-right"></div><div class="card-top"><span class="stage-number">${training ? 'START HERE / TUTORIAL' : `LEVEL ${String(levelOrder.indexOf(selected) + 1).padStart(2, '0')}`}</span><span class="card-completion">${done ? '✓ COMPLETE' : training ? 'LEARN THE FULL KIT' : `${save.progress[selected]??0}% BEST`}</span></div><div class="level-identity">${face(training ? 'Easy' : level.difficulty)}<span class="difficulty-badge">${training ? 'TUTORIAL' : level.difficulty.toUpperCase()}</span></div><h1>${escapeHTML(level.name)}</h1><p class="level-tagline">${training ? 'Move. Jump. Dash. Draw. Learn by doing.' : escapeHTML(level.subtitle)}</p>${routeArt(level)}<div class="level-stats"><div><span>${training ? 'TRAINING' : 'TARGET'}</span><b>${training ? 'ALL MECHANICS' : `${level.par}s`}</b></div><div><span>PERSONAL BEST</span><b>${!training && save.times[selected] ? formatTime(save.times[selected]) : '—'}</b></div><div><span>${training ? 'STATUS' : 'FRAGMENTS'}</span><b>${training ? done ? 'COMPLETE' : 'READY' : `${save.fragments[selected]?.length || 0} / 3`}</b></div></div><div class="level-play"></div><div class="card-track"><i style="width:${training?(done?100:0):(save.progress[selected]??0)}%"></i></div></article>${preview(next, 'next')}<button class="carousel-arrow next-arrow" aria-label="Next level">›</button></section><div class="picker-pagination"><span>${position + 1} / ${list.length}</span><span>← → BROWSE <i>·</i> ENTER PLAY</span></div><nav class="level-thumbnails" aria-label="Jump to a level"></nav><footer class="picker-footer"><span><b>${save.completed.length}</b> / ${levels.length} CLEARED <i>·</i> <b>${Object.values(save.fragments).flat().length}</b> / ${levels.length * 3} FRAGMENTS</span><span>ORIGINAL MUSIC <i>×</i> LIVE DRAWING <i>×</i> FAST RETRIES</span></footer></main>`;
    const header = ui.querySelector('.picker-header-actions')!;
    header.append(button(save.tutorialComplete ? 'Replay tutorial' : 'Tutorial', () => { selected = -1; activeFilter = 'All'; render(); }, 'tutorial-button'), button('Settings', () => { lastSelected = selected; settings(() => selection(start)); }, 'icon-button'), button('Credits', () => { lastSelected = selected; credits(() => selection(start)); }, 'icon-button'));
    const filters = ui.querySelector('.difficulty-filters')!;
    for (const filter of ['All', ...difficultyNames] as Filter[]) {
      const b = button(filter, () => { activeFilter = filter; const filtered = ids(); if (!filtered.includes(selected)) selected = filtered[0] ?? -1; render(); }, `filter-button ${activeFilter === filter ? 'active' : ''}`);
      b.setAttribute('aria-pressed', String(activeFilter === filter)); filters.append(b);
    }
    const playButton = button(training ? save.tutorialComplete ? 'Replay tutorial →' : 'Start tutorial →' : `Play ${level.name} →`, play, 'primary play-level');
    playButton.id = 'play-level'; ui.querySelector('.level-play')!.append(playButton);
    ui.querySelector('.previous-arrow')!.addEventListener('click', () => move(-1));
    ui.querySelector('.next-arrow')!.addEventListener('click', () => move(1));
    ui.querySelectorAll<HTMLElement>('[data-preview]').forEach(b => b.onclick = () => { sound.unlock(); sound.play('click'); selected = Number(b.dataset.preview); render(); });
    const thumbnails = ui.querySelector('.level-thumbnails')!;
    for (const index of list) {
      const l = levelAt(index), b = button(index === -1 ? '◈' : String(levelOrder.indexOf(index) + 1).padStart(2, '0'), () => { selected = index; render(); }, `${index === -1 ? 'tutorial-thumb' : 'level-button'} level-thumb ${index === selected ? 'current' : ''} ${index >= 0 && save.completed.includes(index) ? 'completed' : ''}`);
      b.dataset.levelIndex = String(index); b.style.setProperty('--thumb-color', hex(l.color));
      b.setAttribute('aria-label', index === -1 ? 'Select tutorial' : `Select level ${levelOrder.indexOf(index) + 1}: ${l.name}`);
      b.setAttribute('aria-current', index === selected ? 'true' : 'false'); thumbnails.append(b);
    }
    if (save.reduced) ui.querySelector('.picker-screen')!.classList.add('still');
    if (focusKey) Array.from(ui.querySelectorAll<HTMLButtonElement>('button')).find(b => (b.id || b.getAttribute('aria-label') || b.textContent) === focusKey)?.focus({preventScroll:true});
  };
  document.addEventListener('keydown', e => {
    if (!ui.querySelector('.picker-screen') || e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); sound.unlock(); play(); }
  }, { signal: controller.signal });
  render();
}

export function settings(back: () => void) {
  const a = modal('Tune your run', '<strong>MOVE</strong> A / D or arrows · <strong>JUMP</strong> Space, hold for height<br><strong>DASH</strong> Shift / X + direction · <strong>DRAW</strong> Drag while moving<br><strong>1 STROKE</strong> temporary platforms · <strong>2 ARROW</strong> directional launch<br><strong>3 LOOP</strong> freezes threats · <strong>E</strong> guides · <strong>R</strong> checkpoint reset<br><strong>ESC</strong> pause · <strong>M</strong> mute. Try the tutorial to practice every mechanic.');
  const controls = document.createElement('div'); controls.className = 'settings';
  controls.innerHTML = `<label>Master volume <input aria-label="Master volume" data-volume="volume" type="range" min="0" max="1" step=".05" value="${save.volume}"></label><label>Music volume <input aria-label="Music volume" data-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${save.musicVolume}"></label><label>Sound effects <input aria-label="Sound effects volume" data-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${save.sfxVolume}"></label><label><input type="checkbox" id="mute" ${save.muted ? 'checked' : ''}> Mute all audio</label><label><input type="checkbox" id="motion" ${save.reduced ? 'checked' : ''}> Reduce motion and flashes</label>`;
  a.before(controls);
  for (const key of ['volume', 'musicVolume', 'sfxVolume'] as const) controls.querySelector(`[data-volume="${key}"]`)!.addEventListener('input', e => { save[key] = Number((e.target as HTMLInputElement).value); persist(); sound.refreshSettings(); });
  for (const [id, key] of [['mute', 'muted'], ['motion', 'reduced']] as const) controls.querySelector('#' + id)!.addEventListener('change', e => { save[key] = (e.target as HTMLInputElement).checked; document.documentElement.classList.toggle('reduce-motion', save.reduced); persist(); sound.refreshSettings(); });
  a.append(button('Done', back, 'primary'));
}

export function credits(back: () => void) {
  const a = modal('INKBOUND / ARCADE', 'Original levels, procedural artwork and synthesized music.<br>Built with Phaser 3.90, TypeScript and Vite.<br><br>Design & implementation with Codex.<br>Pick a level. Find your line. Beat your time.');
  a.append(button('Level picker', back, 'primary'));
}
export function formatTime(ms: number) { return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`; }
