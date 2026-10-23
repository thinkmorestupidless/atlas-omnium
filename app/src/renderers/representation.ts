// The representation resolver: navigation state and the model in, a scene of marks and lines out,
// placed on the screen by the projection and styled from status and the scale policy. A pure
// function; the renderers draw what it returns and evaluate nothing (contracts/surface.md).
import type { DerivedState, Model } from '../model/derived';
import { orbitTrack } from '../model/elements';
import { toMetres, type PositionAtEpoch, type Vector3 } from '../model/frames';
import { IDS, type AtlasId } from '../model/ids';
import type { StarState } from '../model/parallax';
import { moonLoop } from '../model/positions';
import { AU_KM, PC_M } from '../model/units';
import { fadesAt } from '../navigation/resolver';
import type { NavigationState } from '../navigation/state';
import type { Entity } from '../model/schema';
import type { Projection, View } from '../projections/projection';
import { resolveComposition } from './composition';
import type { ResolvedLine, ResolvedMark, Scene } from './representation-types';

export interface ResolveInput {
  readonly state: NavigationState;
  readonly model: Model;
  readonly projection: Projection;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly positions: ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>>;
  /** The star sample's members with their derived distances and positions at the catalogue epoch. */
  readonly stars?: ReadonlyMap<AtlasId, StarState>;
  readonly reducedMotion?: boolean;
}

export { FOCUS_MARK, SELECTION_MARK } from './marks';

/** The smallest disc an exaggerated policy draws; anything drawn larger than measured says by how much. */
export const MIN_DISC_PX = 3;
/** A body whose radius is missing is a point of this radius, never a disc of a guessed size. */
export const POINT_PX = 1.5;
/**
 * Orbit tracks are drawn from approximate elements whose error reaches tens of thousands of km
 * (and Earth's is the Earth–Moon barycentre's); they fade in where that is under a pixel.
 */
export const TRACKS_FROM = 1e8;
export const TRACKS_FULL = 2e8;

const IMPORTANCE: Record<string, number> = { Star: 50, Planet: 40, Moon: 30, SmallBody: 20 };

const ramp = (s: number, from: number, to: number) => (s <= from ? 0 : s >= to ? 1 : Math.log(s / from) / Math.log(to / from));

export const formatFactor = (f: number): string =>
  f >= 100 ? Math.round(f).toLocaleString('en-GB') : f >= 10 ? f.toFixed(0) : f.toFixed(1);

export const focusCentre = (state: NavigationState, positions: ResolveInput['positions'], stars?: ResolveInput['stars']): Vector3 => {
  const p = positions.get(state.focus) ?? stars?.get(state.focus)?.position ?? undefined;
  return p ? toMetres(p.value) : [0, 0, 0];
};

export const viewOf = (i: Pick<ResolveInput, 'state' | 'viewport' | 'positions' | 'stars'>): View => ({
  scale: i.state.scale,
  centre: focusCentre(i.state, i.positions, i.stars),
  pan: i.state.pan,
  width: i.viewport.width,
  height: i.viewport.height,
});

/**
 * A stellar mark's radius by the star's catalogue magnitude (Gaia G, or Hipparcos Hp for a star
 * entered through a cross-match): brighter is larger, in four bands; no magnitude is the smallest.
 * The Sun, whose apparent magnitude no catalogue in the sample gives, is drawn at the largest.
 */
export const STAR_BANDS: readonly { readonly brighterThan: number; readonly px: number; readonly words: string }[] = [
  { brighterThan: 2, px: 3.5, words: 'brighter than magnitude 2' },
  { brighterThan: 6, px: 2.75, words: 'magnitude 2 to 6' },
  { brighterThan: 10, px: 2, words: 'magnitude 6 to 10' },
  { brighterThan: 14, px: 1.5, words: 'magnitude 10 to 14' },
];
export const STAR_FAINTEST_PX = 1.2;
export const SUN_STELLAR_PX = 3.5;
export const starRadiusPx = (mag: number | null): number => (mag === null ? STAR_FAINTEST_PX : STAR_BANDS.find((b) => mag < b.brighterThan)?.px ?? STAR_FAINTEST_PX);

/** An entity is drawn as known only when a source record stands behind it; otherwise it says it is illustrative. */
const hasSource = (e: Entity) => Boolean(e.names.source?.dataset && e.names.source.record);

const onScreen = (x: number, y: number, r: number, v: View) => x + r >= 0 && x - r <= v.width && y + r >= 0 && y - r <= v.height;

export const resolve = (i: ResolveInput): Scene => {
  const { state, model, projection } = i;
  const view = viewOf(i);
  const fades = fadesAt(state.scale, { reducedMotion: i.reducedMotion ?? false });
  const marks: ResolvedMark[] = [];
  const lines: ResolvedLine[] = [];

  if (state.mode === 'structural') {
    const c = resolveComposition(state, model, i.viewport);
    return { regime: state.regime, scale: state.scale, fades, marks: c.marks, lines: c.lines, cue: null, parts: c.parts };
  }
  {
    const trackAlpha = fades.tracks * ramp(state.scale, TRACKS_FROM, TRACKS_FULL);
    for (const el of model.elements) {
      if (trackAlpha <= 0) break;
      const t = orbitTrack(el);
      const k = AU_KM * 1000;
      const pts = t.value.points.map((p) => projection.projectMetres([p[0] * k, p[1] * k, p[2] * k], view));
      lines.push({
        id: `track:${el.subject}`, of: el.subject as AtlasId, points: pts, closed: true,
        visible: trackAlpha > 0.01 && pts.some((p) => onScreen(p.x, p.y, 0, view)),
        style: { vocabulary: 'physical', stroke: 'ink', width: 0.75 * fades.trackWidth, alpha: 0.55 * trackAlpha },
      });
    }
    const earth = i.positions.get(IDS.earth);
    if (earth && fades.tracks > 0) {
      const e = toMetres(earth.value);
      const pts = moonLoop(model, earth.value.epoch).map((g) => projection.projectMetres([e[0] + g[0] * 1000, e[1] + g[1] * 1000, e[2] + g[2] * 1000], view));
      const span = pts.length ? Math.max(...pts.map((p) => Math.hypot(p.x - pts[0]!.x, p.y - pts[0]!.y))) : 0;
      if (span > 4) {
        lines.push({
          id: `track:${IDS.moon}`, of: IDS.moon, points: pts, closed: false,
          visible: pts.some((p) => onScreen(p.x, p.y, 0, view)),
          style: { vocabulary: 'physical', stroke: 'ink', width: 0.75 * fades.trackWidth, alpha: 0.55 * fades.tracks },
        });
      }
    }

    for (const [id, pos] of i.positions) {
      const e = model.entities.get(id);
      if (!e) continue;
      const isSun = id === IDS.sun;
      const alpha = isSun ? 1 : fades.discs;
      const p = projection.project(pos.value, view);
      const radius = model.observations.measured(id, 'meanRadius');
      const truePx = radius.value === null ? null : (radius.value * 1000) / state.scale;
      const stellar = isSun && fades.sunPoint > fades.sunDisc;
      let shape: ResolvedMark['shape'] = 'disc';
      let radiusPx = truePx ?? POINT_PX;
      let exaggeration: number | null = null;
      if (stellar) { shape = 'stellar'; radiusPx = SUN_STELLAR_PX; }
      else if (truePx === null) shape = 'point';
      else if (state.scalePolicy === 'exaggerated' && truePx < MIN_DISC_PX) { radiusPx = MIN_DISC_PX; exaggeration = MIN_DISC_PX / truePx; }
      const focused = state.focus === id;
      const selected = state.selection === id;
      const sourced = hasSource(e);
      const name = sourced ? e.names.canonical : `${e.names.canonical} · illustrative`;
      const visible = alpha > 0.01 && onScreen(p.x, p.y, radiusPx, view);
      marks.push({
        id, name, kind: e.kind, shape, at: { x: p.x, y: p.y }, radiusPx, visible,
        style: { fill: 'ink', ...(exaggeration ? { stroke: 'vermilion', lineWidth: 1 } : {}) },
        exaggeration, radiusMissing: truePx === null, status: sourced ? 'derived' : 'illustrative', hasSourceRecord: sourced,
        selected, focused,
        label: exaggeration && (focused || selected) ? `${name} · exaggerated ×${formatFactor(exaggeration)}` : name,
        labelPriority: focused ? 100 : selected ? 90 : isSun ? 60 : (IMPORTANCE[e.kind] ?? 10),
        alpha,
      });
    }

    if (i.stars && fades.stars > 0) {
      for (const [id, st] of i.stars) {
        const e = model.entities.get(id);
        if (!e || !st.position) continue;
        const p = projection.project(st.position.value, view);
        const mag = model.observations.measured(id, 'gMagnitude').value ?? model.observations.measured(id, 'hpMagnitude').value;
        const radiusPx = starRadiusPx(mag);
        const d = st.distance;
        const range = d.value && d.uncertainty?.kind === 'interval'
          ? { inner: ((d.value.value - d.uncertainty.low) * PC_M) / state.scale, outer: ((d.uncertainty.high - d.value.value) * PC_M) / state.scale }
          : undefined;
        const focused = state.focus === id;
        const selected = state.selection === id;
        const visible = fades.stars > 0.01 && onScreen(p.x, p.y, radiusPx, view);
        const sourced = hasSource(e);
        marks.push({
          id, name: e.names.canonical, kind: e.kind, shape: 'stellar', at: { x: p.x, y: p.y }, radiusPx, visible,
          style: { fill: 'ink' }, exaggeration: null, radiusMissing: false, status: sourced ? 'derived' : 'illustrative', hasSourceRecord: sourced,
          selected, focused,
          ...(range ? { rangePx: range } : {}),
          heightTickPx: (p.height) / state.scale,
          label: sourced ? e.names.canonical : `${e.names.canonical} · illustrative`,
          labelPriority: focused ? 100 : selected ? 90 : 40 - (mag ?? 20),
          alpha: fades.stars,
        });
      }
    }
  }
  return { regime: state.regime, scale: state.scale, fades, marks, lines, cue: null };
};
