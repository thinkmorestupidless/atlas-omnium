// The one place an Action becomes a change: navigation actions become transitions; the rest change
// the surface's own state (what is inspected, whether the legend is open).
import type { AtlasId } from '../model/ids';
import * as t from '../navigation/transitions';
import type { NavContext, NavigationState } from '../navigation/state';
import type { Action, InspectTarget } from './actions';

export interface SurfaceState {
  readonly inspect: InspectTarget | null;
  readonly legendOpen: boolean;
}

export interface Store {
  nav: NavigationState;
  surface: SurfaceState;
}

export interface BusDeps {
  ctx: NavContext;
  /** Metres in the projection plane for a screen offset in pixels (y down on screen). */
  pxToPlane(dx: number, dy: number): { x: number; y: number };
  /** The marks a keyboard can move the selection among, in reading order. */
  selectable(): AtlasId[];
}

export const reduce = (store: Store, a: Action, d: BusDeps): Store => {
  const nav = store.nav;
  const s = (n: NavigationState): Store => (n === nav ? store : { ...store, nav: n });
  switch (a.kind) {
    case 'scale': return s(t.scaleBy(nav, a.factor, d.ctx, a.anchorPx ? d.pxToPlane(a.anchorPx.x, a.anchorPx.y) : undefined));
    case 'pan': { const m = d.pxToPlane(-a.dxPx, -a.dyPx); return s(t.panBy(nav, m.x, m.y)); }
    case 'select': return s(t.select(nav, a.id));
    case 'focus': return s(a.id ? t.focusOn(nav, a.id, d.ctx) : t.focus(nav, d.ctx));
    case 'back': return s(t.back(nav, d.ctx));
    case 'backTo': return s(t.backTo(nav, a.index, d.ctx));
    case 'enterStructural': return s(t.enterStructural(nav, d.ctx));
    case 'setDate': return s(t.setDate(nav, a.date));
    case 'play': return s(t.play(nav));
    case 'pause': return s(t.pause(nav));
    case 'togglePlay': return s(nav.playing ? t.pause(nav) : t.play(nav));
    case 'setRate': return s(t.setRate(nav, a.daysPerSecond));
    case 'search': return s(t.search(nav, a.query, d.ctx));
    case 'tick': return s(t.tick(nav, a.seconds));
    case 'scalePolicy': return s(t.setScalePolicy(nav, a.policy ?? (nav.scalePolicy === 'true' ? 'exaggerated' : 'true')));
    case 'cycleSelection': {
      const ids = d.selectable();
      if (!ids.length) return store;
      const i = nav.selection ? ids.indexOf(nav.selection) : -1;
      const next = ids[(i + a.direction + ids.length) % ids.length] ?? null;
      return s(t.select(nav, next));
    }
    case 'inspect': return { ...store, surface: { ...store.surface, inspect: a.target } };
    case 'legend': return { ...store, surface: { ...store.surface, legendOpen: a.open ?? !store.surface.legendOpen } };
  }
};

export const createBus = (initial: Store, deps: () => BusDeps) => {
  let store = initial;
  const listeners = new Set<(s: Store, prev: Store) => void>();
  return {
    get: () => store,
    dispatch(a: Action) {
      const prev = store;
      store = reduce(store, a, deps());
      if (store !== prev) listeners.forEach((l) => l(store, prev));
    },
    subscribe(l: (s: Store, prev: Store) => void) { listeners.add(l); return () => listeners.delete(l); },
  };
};
export type Bus = ReturnType<typeof createBus>;
