// The chapter cue: the regime's name, large, as the scale crosses the band between the Solar System
// and the nearby stars, receding as the crossing completes. It names the regime being travelled
// towards. Under reduced motion it is a static display of the regime entered, for one second.
import type { Scene } from '../renderers/representation-types';
import { h } from './dom';

export const CUE_WORDS = { 'nearby-stellar': 'nearby stars', planetary: 'the Solar System' } as const;
export const STATIC_CUE_MS = 1000;

export const chapterCue = () => {
  const text = h('p', { class: 'display chapter-cue-text' });
  const el = h('div', { class: 'chapter-cue', role: 'status', 'aria-live': 'polite' }, text);
  let lastScale: number | null = null;
  let lastRegime: string | null = null;
  let towards: keyof typeof CUE_WORDS = 'nearby-stellar';
  let timer: ReturnType<typeof setTimeout> | null = null;
  const show = (words: string, alpha: number, shrink: number) => {
    text.textContent = words;
    el.style.opacity = String(alpha);
    text.style.transform = `scale(${1 - 0.12 * shrink})`;
    el.hidden = alpha <= 0.01;
  };
  return {
    el,
    update(scene: Scene, reduced: boolean) {
      if (lastScale !== null && scene.scale !== lastScale) towards = scene.scale > lastScale ? 'nearby-stellar' : 'planetary';
      lastScale = scene.scale;
      const entered = lastRegime !== null && scene.regime !== lastRegime && (scene.regime === 'planetary' || scene.regime === 'nearby-stellar');
      lastRegime = scene.regime;
      if (reduced) {
        if (entered) {
          show(CUE_WORDS[scene.regime as keyof typeof CUE_WORDS], 1, 0);
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => { el.hidden = true; timer = null; }, STATIC_CUE_MS);
        }
        return;
      }
      if (timer) { clearTimeout(timer); timer = null; }
      show(CUE_WORDS[towards], scene.fades.cue, 1 - scene.fades.cue);
    },
  };
};
