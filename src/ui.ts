import { levels, chapters } from './levels';
import { save, persist, achievementNames } from './save';
import { sound } from './audio';

export const ui = document.querySelector<HTMLDivElement>('#ui')!;
document.documentElement.classList.toggle('reduce-motion', save.reduced);
export const escapeHTML = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function button(text: string, fn: () => void, cls = '') {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = text;
  b.onclick = () => { sound.unlock(); sound.play('click'); fn(); };
  return b;
}

export function modal(title: string, copy: string) {
  ui.innerHTML = `<div class="veil"><section class="sheet"><div class="eyebrow">INKBOUND / LIVE INK</div><h2>${title}</h2><p>${copy}</p><div class="actions"></div></section></div>`;
  return ui.querySelector<HTMLElement>('.actions')!;
}

export function menu(start: (n: number) => void) {
  const fragmentCount = Object.values(save.fragments).flat().length;
  ui.innerHTML = `<main class="menu"><header><span class="brand"><b class="brand-mark">//</b> INKBOUND</span><span class="edition">THE UNFINISHED WORLD <b>V.02 / OVERDRIVE</b></span></header><div class="menu-body"><section class="intro"><div class="eyebrow"><span class="signal-dot"></span> PRECISION PLATFORMING × LIVE DRAWING</div><h1>DRAW.<br><span>DASH.</span><br>SURVIVE.</h1><p class="lede">The page is trying to kill you.<br>Change it before it does.</p><div id="menu-actions"></div><div class="progress"><span><b>${String(save.completed.length).padStart(2,'0')}</b> / 12 STAGES CLEARED</span><span><b>${String(fragmentCount).padStart(2,'0')}</b> / 36 FRAGMENTS</span></div></section><section class="illustration" aria-label="An ink runner dashing across a broken drawing"><div class="art-grid"></div><span class="art-coordinate">X / 0540<br>Y / 0160</span><div class="speed-lines"></div><div class="orbit o1"></div><div class="orbit o2"></div><div class="broken-line bl1"></div><div class="broken-line bl2"></div><div class="blade blade-a"></div><div class="blade blade-b"></div><div class="draw-platform"></div><div class="runner-streak rs1"></div><div class="runner-streak rs2"></div><div class="hero-doodle"><span class="runner-scarf"></span><span class="runner-face"></span><span class="runner-body"></span><span class="runner-leg leg-a"></span><span class="runner-leg leg-b"></span></div><div class="floating-note">DRAW YOUR EXIT<span>↗</span></div><div class="art-caption"><span>NO PAUSE. NO PRESET PATH.</span><b>KEEP MOVING →</b></div><div class="corner-cross cc1">+</div><div class="corner-cross cc2">+</div></section></div><footer><span>A / D <b>MOVE</b> &nbsp; SPACE <b>JUMP</b> &nbsp; SHIFT <b>DASH</b> &nbsp; MOUSE <b>DRAW</b></span><span>12 STAGES <i>·</i> 3 TOOLS <i>·</i> ZERO BRAKES</span></footer></main>`;
  const a = ui.querySelector('#menu-actions')!;
  a.append(button(save.completed.length || save.current ? 'Continue run →' : 'Start run →', () => start(save.current), 'primary'));
  a.append(button('Select stage', () => selection(start), 'text-button'));
  const links = document.createElement('div');
  links.className = 'small-links';
  links.append(button('Restart campaign', () => {
    const actions = modal('Back to stage one?', 'Your best times and fragments stay saved.');
    actions.append(button('Start from one', () => start(0), 'primary'), button('Cancel', () => menu(start)));
  }), button('Settings & controls', () => settings(() => menu(start))), button('Credits', () => credits(() => menu(start))));
  a.append(links);
}

export function selection(start: (n: number) => void) {
  ui.innerHTML = `<div class="library"><div class="eyebrow">STAGE SELECT / ALL ROUTES OPEN</div><h2>Pick your fight.</h2><p>Run it clean. Beat your time. Find the route nobody drew for you.</p><div class="chapter-grid"></div><div class="actions"></div></div>`;
  const grid = ui.querySelector('.chapter-grid')!;
  chapters.forEach((c, i) => {
    const section = document.createElement('section');
    section.innerHTML = `<span class="eyebrow">SECTOR 0${i + 1}</span><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.word)}</p>`;
    levels.forEach((l, n) => {
      if (l.chapter !== i) return;
      const b = button(`${String(n + 1).padStart(2, '0')}   ${l.name}   ${save.completed.includes(n) ? '✓' : '↗'}`, () => start(n), 'level-button');
      const detail = document.createElement('small');
      detail.textContent = `${save.fragments[n]?.length || 0}/3 FRAGMENTS${save.times[n] ? ` · BEST ${formatTime(save.times[n])}` : ' · UNRANKED'}`;
      section.append(b, detail);
    });
    grid.append(section);
  });
  ui.querySelector('.actions')!.append(button('← Main menu', () => menu(start)));
  const ach = achievementNames();
  if (ach.length) {
    const p = document.createElement('p');
    p.className = 'achievement-line';
    p.textContent = `${ach.length} ACHIEVEMENTS UNLOCKED · ${save.completed.length}/12 CLEARED`;
    ui.querySelector('.library')!.append(p);
  }
}

export function settings(back: () => void) {
  const a = modal('Controls / settings', '<strong>MOVE</strong> A / D or arrows · <strong>JUMP</strong> Space, hold for height<br><strong>DASH</strong> Shift / X + direction · <strong>DRAW</strong> Drag the mouse while moving<br><strong>1 STROKE</strong> — temporary platforms · <strong>2 ARROW</strong> — directional launch<br><strong>3 LOOP</strong> — a field that freezes moving threats<br><strong>E</strong> guidance · <strong>R</strong> reset at checkpoint · <strong>ESC</strong> pause · <strong>M</strong> mute<br><br>Draw anywhere near the runner. Click marked machinery with its matching tool. Ink regenerates. The world keeps moving while you draw.');
  const controls = document.createElement('div');
  controls.className = 'settings';
  controls.innerHTML = `<label>Volume <input aria-label="Sound volume" type="range" min="0" max="1" step=".05" value="${save.volume}"></label><label><input type="checkbox" id="mute" ${save.muted ? 'checked' : ''}> Mute sound</label><label><input type="checkbox" id="motion" ${save.reduced ? 'checked' : ''}> Reduce motion and flashes</label>`;
  a.before(controls);
  controls.querySelector('input[type=range]')!.addEventListener('input', e => { save.volume = Number((e.target as HTMLInputElement).value); persist(); });
  for (const [id, key] of [['mute', 'muted'], ['motion', 'reduced']] as const) {
    controls.querySelector('#' + id)!.addEventListener('change', e => { save[key] = (e.target as HTMLInputElement).checked; document.documentElement.classList.toggle('reduce-motion', save.reduced); persist(); });
  }
  a.append(button('Back to it', back, 'primary'));
}

export function credits(back: () => void) {
  const a = modal('INKBOUND', 'THE UNFINISHED WORLD / OVERDRIVE<br><br>Original game, procedural art and synthesized audio.<br>Built with Phaser 3.90, TypeScript and Vite.<br><br>Design & implementation with Codex.<br>Your route. Your time. Your next attempt.');
  a.append(button('Main menu', back, 'primary'));
}

export function formatTime(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`;
}
