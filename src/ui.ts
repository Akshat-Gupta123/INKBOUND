import { levels, levelOrder, tutorialLevel, difficulties, type Difficulty, type Level } from './levels';
import { save, persist } from './save';
import { sound } from './audio';
import { hasClearedEveryLevel, showEpilogue } from './epilogue';

export const ui = document.querySelector<HTMLDivElement>('#ui')!;
document.documentElement.classList.toggle('reduce-motion', save.reduced);
export const escapeHTML = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
type Filter = 'All' | Difficulty;
const volumes = [
  { name: 'First Ink', from: 0, to: 24 },
  { name: 'Velocity', from: 24, to: 44 },
  { name: 'Undertow', from: 44, to: 64 },
  { name: 'Parallax', from: 64, to: 84 },
  { name: 'Afterlight', from: 84, to: 104 },
] as const;
type Volume = 'All volumes' | typeof volumes[number]['name'];
let activeFilter: Filter = 'All';
let activeVolume: Volume = 'All volumes';
let search = '';
const volumeAt = (index: number) => volumes.find(v => index >= v.from && index < v.to);
const matchesVolume = (index: number) => activeVolume === 'All volumes' || volumeAt(index)?.name === activeVolume;
const courseNumber = (index: number) => String(levelOrder.indexOf(index) + 1).padStart(3, '0');
const courseLabel = (index: number) => `${volumeAt(index)?.name ?? 'Collection'} / ${courseNumber(index)}`;
let pickerAbort: AbortController | undefined;
let lastSelected: number | undefined;

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
  ui.innerHTML = `<div class="veil"><section class="sheet"><div class="eyebrow">INKBOUND</div><h2>${title}</h2><p>${copy}</p><div class="actions"></div></section></div>`;
  return ui.querySelector<HTMLElement>('.actions')!;
}

const hex = (color: number) => '#' + color.toString(16).padStart(6, '0');
const levelAt = (index: number): Level => index === -1 ? tutorialLevel : levels[index];
function emblem(training: boolean, small = false) {
  const mark = training ? '<path d="m21 44 4-13 16-16 8 8-16 16-12 5Zm4-13 8 8"/>' : '<path d="M18 46 43 16h6L24 46h-6ZM30 46l19-23M18 31l12-15"/>';
  return `<svg class="course-emblem ${small ? 'small' : ''}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${mark}</g></svg>`;
}
function routeArt(level: Level) {
  const sx = (x: number) => 18 + x / level.width * 590;
  const sy = (y: number) => 16 + (y - 120) / 500 * 112;
  const platforms = level.platforms.map(p => `<path d="M${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}h${(p.w / level.width * 590).toFixed(1)}"/>`).join('');
  const edits = level.edits.map(p => `<path class="route-edit" d="M${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}h${(p.w / level.width * 590).toFixed(1)}"/>`).join('');
  const saws = level.sweepers.map(p => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3.5" class="route-saw"/>`).join('');
  return `<svg class="route-art" viewBox="0 0 630 150" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3">${platforms}${edits}${saws}</g><path d="M27 113 35 103 44 113 35 124Z" fill="currentColor"/><path d="M598 114v-27l16 6-16 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}

export function menu(start: (n: number) => void) { selection(start); }
export function selection(start: (n: number) => void, initialIndex?: number) {
  leavePicker();
  pickerAbort = new AbortController();
  const controller = pickerAbort;
  const fallback = !save.tutorialComplete ? -1 : Math.min(levels.length - 1, Math.max(0, save.current));
  let selected = initialIndex ?? (lastSelected !== undefined && lastSelected < levels.length ? lastSelected : fallback);
  const clearFilters = () => { activeFilter = 'All'; activeVolume = 'All volumes'; search = ''; };
  const matchesSearch = (index: number) => !search.trim() || `${levels[index].name} ${courseNumber(index)}`.toLowerCase().includes(search.trim().toLowerCase());
  if ((!save.tutorialComplete && lastSelected === undefined) || (initialIndex !== undefined && (initialIndex === -1 || !matchesVolume(initialIndex) || !matchesSearch(initialIndex) || (activeFilter !== 'All' && levels[initialIndex]?.difficulty !== activeFilter)))) clearFilters();
  const ids = () => {
    const regular = levelOrder.filter(i => matchesVolume(i) && matchesSearch(i) && (activeFilter === 'All' || levels[i].difficulty === activeFilter));
    return activeVolume === 'All volumes' && activeFilter === 'All' && !search.trim() ? [-1, ...regular] : regular;
  };
  const reconcile = () => { const filtered = ids(); if (!filtered.includes(selected)) selected = filtered[0] ?? -1; };
  reconcile();
  const play = () => { if (!ids().includes(selected)) return; lastSelected = selected; leavePicker(); start(selected); };
  const move = (direction: number) => {
    const list = ids();
    if (list.length < 2) return;
    selected = list[(list.indexOf(selected) + direction + list.length) % list.length];
    sound.unlock(); sound.play('click'); render();
  };
  const render = () => {
    const focused = (document.activeElement instanceof HTMLButtonElement || document.activeElement instanceof HTMLInputElement) && ui.contains(document.activeElement) ? document.activeElement : undefined;
    const focusKey = focused?.id || focused?.getAttribute('aria-label') || focused?.textContent;
    const caret = focused instanceof HTMLInputElement ? focused.selectionStart : null;
    const list = ids(), position = list.indexOf(selected), empty = list.length === 0;
    if (!empty) lastSelected = selected;
    const level = levelAt(selected), theme = hex(level.color);
    sound.setContext('menu', level.music); document.documentElement.style.setProperty('--level-color', theme);
    const training = selected === -1, done = training ? save.tutorialComplete : save.completed.includes(selected);
    const previous = list[(position - 1 + list.length) % list.length], next = list[(position + 1) % list.length];
    const preview = (index: number, side: 'previous' | 'next') => {
      const l = levelAt(index);
      return `<button class="side-card ${side}" data-preview="${index}" aria-label="Preview ${escapeHTML(l.name)}" style="--card-color:${hex(l.color)}"><span>${side === 'previous' ? 'PREVIOUS' : 'UP NEXT'}</span>${emblem(index === -1, true)}<strong>${escapeHTML(l.name)}</strong><small>${index === -1 ? 'Practice' : l.difficulty}</small><span class="preview-number">${index === -1 ? '—' : courseNumber(index)}</span></button>`;
    };
    const card = empty ? `<section class="empty-state"><span class="eyebrow">NO COURSES FOUND</span><h1>A different direction.</h1><p>Try another name or clear your filters.</p><button id="clear-filters">Clear filters</button></section>` : `<section class="level-carousel" aria-roledescription="carousel" aria-label="Levels"><button class="carousel-arrow previous-arrow" aria-label="Previous level" ${list.length < 2 ? 'disabled' : ''}>←</button>${preview(previous, 'previous')}<article id="level-card" class="level-card ${training ? 'training-card' : ''}" data-level-index="${selected}" style="--card-color:${theme}" aria-label="Selected level"><div class="card-top"><span class="stage-number">${training ? 'THE PRACTICE ROOM' : escapeHTML(courseLabel(selected))}</span><span class="card-completion">${done ? '✓ COMPLETE' : training ? 'START HERE' : `${save.progress[selected] ?? 0}% BEST`}</span></div><div class="level-identity">${emblem(training)}<span class="difficulty-badge">${training ? 'TUTORIAL' : level.difficulty.toUpperCase()}</span></div><h1>${escapeHTML(level.name)}</h1><p class="level-tagline">${training ? 'Learn the movement. Make your mark.' : escapeHTML(level.subtitle)}</p><div class="route-wrap">${routeArt(level)}</div><div class="level-stats"><div><span>${training ? 'PRACTICE' : 'TARGET TIME'}</span><b>${training ? 'ALL MECHANICS' : `${level.par}s`}</b></div><div><span>PERSONAL BEST</span><b>${!training && save.times[selected] ? formatTime(save.times[selected]) : '—'}</b></div><div><span>${training ? 'STATUS' : 'CACHES'}</span><b>${training ? done ? 'COMPLETE' : 'READY' : `${save.fragments[selected]?.length || 0} / 3`}</b></div></div><div class="level-play"></div><div class="card-track"><i style="width:${training ? (done ? 100 : 0) : (save.progress[selected] ?? 0)}%"></i></div></article>${preview(next, 'next')}<button class="carousel-arrow next-arrow" aria-label="Next level" ${list.length < 2 ? 'disabled' : ''}>→</button></section>`;
    ui.innerHTML = `<main class="picker-screen" style="--picker-color:${theme}" aria-label="Level picker"><header class="picker-header"><div class="brand"><span class="brand-glyph" aria-hidden="true">${emblem(false, true)}</span> INKBOUND</div><div class="picker-header-actions"></div></header><section class="picker-heading"><div><div class="eyebrow">THE COLLECTION</div><h2>Find your line.</h2><p>${levels.length} courses. A world drawn in motion.</p></div><div class="collection-progress" aria-label="${save.completed.length} of ${levels.length} courses complete"><b>${String(save.completed.length).padStart(3, '0')}<span> / ${levels.length}</span></b><small>COURSES COMPLETE</small><i><em style="width:${save.completed.length / levels.length * 100}%"></em></i></div></section><section class="picker-controls" aria-label="Find a course"><nav class="pack-filters" aria-label="Choose a volume"></nav><div class="filter-row"><nav class="difficulty-filters" aria-label="Filter by difficulty"></nav><label class="course-search"><span aria-hidden="true">⌕</span><input id="level-search" type="search" aria-label="Search courses" placeholder="Find a course" value="${escapeHTML(search)}" autocomplete="off" spellcheck="false"></label></div></section>${card}<div class="picker-pagination"><span>${empty ? '0 COURSES' : `${position + 1} / ${list.length}`}</span><span>← → BROWSE <i>·</i> ENTER PLAY</span></div><nav class="level-thumbnails" aria-label="Jump to a level"></nav><footer class="picker-footer"><span>${Object.values(save.fragments).flat().length} / ${levels.length * 3} CACHES COLLECTED</span><span>DRAW <i>·</i> DASH <i>·</i> BEGIN AGAIN</span></footer></main>`;
    const header = ui.querySelector('.picker-header-actions')!;
    if (hasClearedEveryLevel(save.completed, levels.length)) header.append(button('Final page', () => { leavePicker(); showEpilogue(ui, () => selection(start)); }, 'final-page-button'));
    header.append(button(save.tutorialComplete ? 'Replay tutorial' : 'Tutorial', () => { selected = -1; clearFilters(); render(); }, 'tutorial-button'), button('Settings', () => { settings(() => selection(start)); }, 'icon-button'), button('Credits', () => { credits(() => selection(start)); }, 'icon-button'));
    const packs = ui.querySelector('.pack-filters')!;
    for (const volume of ['All volumes', ...volumes.filter(v => v.from < levels.length).map(v => v.name)] as Volume[]) {
      const b = button(volume, () => { activeVolume = volume; reconcile(); render(); }, `pack-button ${activeVolume === volume ? 'active' : ''}`);
      b.setAttribute('aria-pressed', String(activeVolume === volume)); packs.append(b);
    }
    const filters = ui.querySelector('.difficulty-filters')!;
    for (const filter of ['All', ...difficulties] as Filter[]) {
      const b = button(filter, () => { activeFilter = filter; reconcile(); render(); }, `filter-button ${activeFilter === filter ? 'active' : ''}`);
      b.setAttribute('aria-pressed', String(activeFilter === filter)); filters.append(b);
    }
    ui.querySelector<HTMLInputElement>('#level-search')!.addEventListener('input', e => { search = (e.target as HTMLInputElement).value; reconcile(); render(); });
    if (empty) ui.querySelector('#clear-filters')!.addEventListener('click', () => { clearFilters(); selected = lastSelected ?? fallback; reconcile(); render(); });
    else {
      const playButton = button(training ? save.tutorialComplete ? 'Replay tutorial →' : 'Start tutorial →' : `Play ${level.name} →`, play, 'primary play-level');
      playButton.id = 'play-level'; ui.querySelector('.level-play')!.append(playButton);
      ui.querySelector('.previous-arrow')!.addEventListener('click', () => move(-1));
      ui.querySelector('.next-arrow')!.addEventListener('click', () => move(1));
      ui.querySelectorAll<HTMLElement>('[data-preview]').forEach(b => b.onclick = () => { sound.unlock(); sound.play('click'); selected = Number(b.dataset.preview); render(); });
    }
    const thumbnails = ui.querySelector('.level-thumbnails')!;
    for (const index of list) {
      const l = levelAt(index), b = button(index === -1 ? '◈' : courseNumber(index), () => { selected = index; render(); }, `${index === -1 ? 'tutorial-thumb' : 'level-button'} level-thumb ${index === selected ? 'current' : ''} ${index >= 0 && save.completed.includes(index) ? 'completed' : ''}`);
      b.dataset.levelIndex = String(index); b.style.setProperty('--thumb-color', hex(l.color));
      b.setAttribute('aria-label', index === -1 ? 'Select tutorial' : `Select level ${levelOrder.indexOf(index) + 1}: ${l.name}`);
      b.setAttribute('aria-current', index === selected ? 'true' : 'false'); thumbnails.append(b);
    }
    const current = thumbnails.querySelector<HTMLElement>('[aria-current="true"]');
    if (current) thumbnails.scrollLeft = Math.max(0, current.offsetLeft - thumbnails.clientWidth / 2 + current.offsetWidth / 2);
    if (save.reduced) ui.querySelector('.picker-screen')!.classList.add('still');
    if (focusKey) {
      const restore = Array.from(ui.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')).find(b => (b.id || b.getAttribute('aria-label') || b.textContent) === focusKey);
      restore?.focus({ preventScroll: true });
      if (restore instanceof HTMLInputElement && caret !== null) restore.setSelectionRange(caret, caret);
    }
  };
  document.addEventListener('keydown', e => {
    if (!ui.querySelector('.picker-screen') || e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); sound.unlock(); play(); }
  }, { signal: controller.signal });
  render();
}

export function settings(back: () => void) {
  const a = modal('Tune your run', '<strong>MOVE</strong> A / D or arrows · <strong>JUMP</strong> Space, hold for height<br><strong>DASH</strong> Shift / X + direction · <strong>DRAW</strong> Drag while moving<br><strong>1 STROKE</strong> temporary platforms · <strong>2 ARROW</strong> directional launch<br><strong>3 LOOP</strong> freezes threats · <strong>E</strong> guides · <strong>R</strong> checkpoint reset<br><strong>ESC</strong> pause · <strong>M</strong> mute. Six ink charges recharge as you move. Practice every mechanic in the tutorial.');
  const controls = document.createElement('div'); controls.className = 'settings';
  controls.innerHTML = `<label>Master volume <input aria-label="Master volume" data-volume="volume" type="range" min="0" max="1" step=".05" value="${save.volume}"></label><label>Music volume <input aria-label="Music volume" data-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${save.musicVolume}"></label><label>Sound effects <input aria-label="Sound effects volume" data-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${save.sfxVolume}"></label><label><input type="checkbox" id="mute" ${save.muted ? 'checked' : ''}> Mute all audio</label><label><input type="checkbox" id="motion" ${save.reduced ? 'checked' : ''}> Reduce motion and flashes</label>`;
  a.before(controls);
  for (const key of ['volume', 'musicVolume', 'sfxVolume'] as const) controls.querySelector(`[data-volume="${key}"]`)!.addEventListener('input', e => { save[key] = Number((e.target as HTMLInputElement).value); persist(); sound.refreshSettings(); });
  for (const [id, key] of [['mute', 'muted'], ['motion', 'reduced']] as const) controls.querySelector('#' + id)!.addEventListener('change', e => { save[key] = (e.target as HTMLInputElement).checked; document.documentElement.classList.toggle('reduce-motion', save.reduced); persist(); sound.refreshSettings(); });
  a.append(button('Done', back, 'primary'));
}

export function credits(back: () => void) {
  const a = modal('INKBOUND', 'A game of movement, ink and second chances.<br>Artwork and music made for this world.<br><br>Built with Phaser. Design and implementation with Codex.<br>Thank you for playing.');
  a.append(button('Level picker', back, 'primary'));
}
export function formatTime(ms: number) { return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`; }
