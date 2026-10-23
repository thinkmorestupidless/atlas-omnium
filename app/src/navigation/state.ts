// Navigation state: pure data, no DOM, no projection, no pixel beyond the scale number (decision
// 0006). Every surface derives what it draws from this and the model.
import { IDS, type AtlasId, type Kind } from '../model/ids';

export type Mode = 'spatial' | 'structural';
export type Regime = 'planetary' | 'nearby-stellar' | 'molecular';
export type ScalePolicy = 'true' | 'exaggerated';

/** One stop on the breadcrumb: the focus, the mode it was focused in, and the view it was left at. */
export interface Crumb {
  readonly id: AtlasId;
  readonly mode: Mode;
  readonly regime: Regime;
  readonly scale: number;
  readonly pan: { readonly x: number; readonly y: number };
}

export interface Candidate { readonly id: AtlasId; readonly name: string; readonly kind: Kind }

export interface NavigationState {
  readonly release: string;
  readonly mode: Mode;
  readonly focus: AtlasId;
  readonly selection: AtlasId | null;
  readonly breadcrumb: readonly Crumb[];
  /** Metres per CSS pixel; spatial navigation only. */
  readonly scale: number;
  /** Metres, in the projection's plane, of the view centre from the focus. */
  readonly pan: { readonly x: number; readonly y: number };
  readonly regime: Regime;
  readonly scalePolicy: ScalePolicy;
  /** The civil instant shown, ISO UTC; the epoch is derived by model/time. */
  readonly utc: string;
  readonly playing: boolean;
  readonly rate: { readonly daysPerSecond: number };
  readonly window: { readonly from: string; readonly to: string };
  readonly announcement: { readonly modeChange: 'entered-structural' | 'left-structural'; readonly seq: number } | null;
  readonly offer: 'made-of' | null;
  readonly refusal: { readonly date: string; readonly window: { readonly from: string; readonly to: string } } | null;
  readonly candidates: readonly Candidate[] | null;
}

/** What the transitions need to know about entities, given by whoever holds the model. */
export interface NavContext {
  kindOf(id: AtlasId): Kind | undefined;
  domainOf(id: AtlasId): 'solar-system' | 'stellar' | 'structural' | undefined;
  radiusKm(id: AtlasId): number | null;
  viewportShortSidePx: number;
  /** What an entity is made of, if the release says: Earth to water. */
  madeOf(id: AtlasId): AtlasId | null;
  search(query: string): Candidate[];
}

/** Earth's disc about 120 px across: the Moon, 384,400 km away, is out of view (FR-001). */
export const OPENING_SCALE = 1e5;
/** Arriving at a planet from the stars: every planet's track in view. */
export const HELIOCENTRIC_SCALE = 2e10;
/** Arriving at a star from the Solar System: Proxima Centauri about 400 px from the Sun. */
export const STELLAR_SCALE = 1e14;

export const initialState = (o: { release: string; window: { from: string; to: string }; today: string }): NavigationState => {
  const inWindow = o.today >= o.window.from && o.today <= o.window.to ? o.today : o.window.from;
  return {
    release: o.release,
    mode: 'spatial',
    focus: IDS.earth,
    selection: IDS.earth,
    breadcrumb: [{ id: IDS.earth, mode: 'spatial', regime: 'planetary', scale: OPENING_SCALE, pan: { x: 0, y: 0 } }],
    scale: OPENING_SCALE,
    pan: { x: 0, y: 0 },
    regime: 'planetary',
    scalePolicy: 'exaggerated',
    utc: `${inWindow}T00:00:00.000Z`,
    playing: false,
    rate: { daysPerSecond: 1 },
    window: o.window,
    announcement: null,
    offer: null,
    refusal: null,
    candidates: null,
  };
};
