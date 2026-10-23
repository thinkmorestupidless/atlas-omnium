// The breadcrumb: the real history of focuses by canonical name; each earlier stop goes back to it.
import type { Action } from '../input/actions';
import type { Entities } from '../model/entities';
import type { NavigationState } from '../navigation/state';
import { h, replace } from './dom';

export const breadcrumb = (dispatch: (a: Action) => void, entities: Entities) => {
  const list = h('ol', { class: 'crumbs' });
  const el = h('nav', { class: 'breadcrumb mono', 'aria-label': 'breadcrumb' }, list);
  return {
    el,
    update(s: NavigationState) {
      replace(list, ...s.breadcrumb.map((c, i) => {
        const last = i === s.breadcrumb.length - 1;
        const name = entities.name(c.id);
        return h('li', {}, last
          ? h('span', { 'aria-current': 'location', 'data-id': c.id }, name)
          : (() => { const b = h('button', { type: 'button', 'data-id': c.id }, name); b.addEventListener('click', () => dispatch({ kind: 'backTo', index: i })); return b; })());
      }));
    },
  };
};
