import { levels } from './levels';
import { save } from './save';
import { sound } from './audio';
import { hasClearedEveryLevel } from './completion';
import './epilogue.css';
export { hasClearedEveryLevel } from './completion';

export function showEpilogue(host: HTMLElement, onClose: () => void, lastClear?: string): boolean {
  if (!hasClearedEveryLevel(save.completed, levels.length)) return false;
  sound.setContext('menu', 0);
  host.innerHTML = `<main class="epilogue" aria-labelledby="epilogue-title">
    <div class="epilogue-grain" aria-hidden="true"></div>
    <article class="epilogue-page">
      <div class="epilogue-overline">INKBOUND <span>THE FINAL PAGE</span></div>
      <div class="epilogue-rule" aria-hidden="true"><i></i><b>✦</b><i></i></div>
      <p class="epilogue-count">${levels.length} / ${levels.length} COURSES CLEARED</p>
      <h1 id="epilogue-title" tabindex="-1">The space<br><em>between.</em></h1>
      <div class="epilogue-poem">
        <p>At first, there was only distance.<br>Then a mark.</p>
        <p>A bridge held for a breath.<br>A blade passed through the place you left.</p>
        <p>You learned the shape of falling,<br>and drew another answer.</p>
        <p>Now every door stands open.<br>The page is quiet.<br>The next line is yours.</p>
      </div>
      <p class="epilogue-last-clear"></p>
      <button id="epilogue-return" class="epilogue-return">Return to levels <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
      <div class="epilogue-signature">A line ends. The hand remembers.</div>
    </article>
  </main>`;
  host.querySelector('.epilogue-last-clear')!.textContent = lastClear ?? '';
  host.querySelector<HTMLButtonElement>('#epilogue-return')!.onclick = () => { sound.unlock(); sound.play('click'); onClose(); };
  host.querySelector<HTMLElement>('#epilogue-title')!.focus({preventScroll:true});
  return true;
}
