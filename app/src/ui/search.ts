// Search: `/` puts the cursor in the field; Enter searches. One match moves the focus to that entity
// in its context (the transitions choose the regime); several are offered with their kinds, and
// choosing one focuses it. Nothing else changes while candidates are offered.
import type { Action } from '../input/actions';
import type { AtlasId } from '../model/ids';
import type { NavigationState } from '../navigation/state';
import { h, replace } from './dom';

const KIND_WORDS: Record<string, string> = {
  Star: 'star', Planet: 'planet', Moon: 'moon', SmallBody: 'small body', Substance: 'substance', MoleculeType: 'molecule type', AtomType: 'atom type',
};

export const search = (dispatch: (a: Action) => void) => {
  const input = h('input', { type: 'search', id: 'search', class: 'mono', placeholder: 'search (/)', 'aria-label': 'search by name', autocomplete: 'off', spellcheck: 'false' });
  const results = h('ul', { class: 'search-results mono', 'aria-label': 'matches' });
  const form = h('form', { class: 'search', role: 'search' }, input, results);
  results.hidden = true;
  form.addEventListener('submit', (ev) => { ev.preventDefault(); dispatch({ kind: 'search', query: input.value }); });
  let shown: NavigationState['candidates'] = null;
  return {
    el: form,
    input,
    open() { input.focus(); input.select(); },
    update(s: NavigationState) {
      if (s.candidates === shown) return;
      shown = s.candidates;
      results.hidden = !s.candidates;
      if (!s.candidates) { replace(results); return; }
      if (!s.candidates.length) { replace(results, h('li', { class: 'search-none' }, `nothing in this release is called "${input.value.trim()}"`)); return; }
      replace(results, ...s.candidates.map((c) => {
        const b = h('button', { type: 'button', 'data-id': c.id, 'data-kind': c.kind }, `${c.name} · ${KIND_WORDS[c.kind] ?? c.kind}`);
        b.addEventListener('click', () => dispatch({ kind: 'focus', id: c.id as AtlasId }));
        return h('li', {}, b);
      }));
      (results.querySelector('button') as HTMLButtonElement | null)?.focus();
    },
  };
};
