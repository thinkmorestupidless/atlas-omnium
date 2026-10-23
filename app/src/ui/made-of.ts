// The offer "what is it made of?", shown when the focus is at its minimum scale and the release says
// what it is made of (FR-015a). Choosing it is the only way into structural navigation.
import type { Action } from '../input/actions';
import type { NavigationState } from '../navigation/state';
import { h } from './dom';

export const madeOf = (dispatch: (a: Action) => void) => {
  const button = h('button', { type: 'button', class: 'made-of', 'aria-keyshortcuts': 'm' }, 'what is it made of?');
  const note = h('span', { class: 'mono made-of-note' });
  button.addEventListener('click', () => dispatch({ kind: 'enterStructural' }));
  const el = h('div', { class: 'made-of-offer' }, button, note);
  return {
    el,
    update(s: NavigationState, focusName: string) {
      el.hidden = !(s.offer === 'made-of' && s.mode === 'spatial');
      button.textContent = `what is ${focusName} made of?`;
      note.textContent = 'a different kind of step (m)';
    },
  };
};
