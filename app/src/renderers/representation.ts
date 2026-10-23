// The representation resolver: navigation state and the model in, a scene of marks and lines out,
// placed on the screen by the projection and styled from status and the scale policy. A pure
// function; the renderers draw what it returns and evaluate nothing (contracts/surface.md).
import type { DerivedState, Model } from '../model/derived';
import { orbitTrack } from '../model/elements';
import { toMetres, type PositionAtEpoch, type Vector3 } from '../model/frames';
import { IDS, type AtlasId } from '../model/ids';
import { moonLoop } from '../model/positions';
import { AU_KM } from '../model/units';
import { fadesAt } from '../navigation/resolver';
import type { NavigationState } from '../navigation/state';
import type { Projection, View } from '../projections/projection';
import type { ResolvedLine, ResolvedMark, Scene } from './representation-types';

export interface ResolveInput {
  readonly state: NavigationState;
  readonly model: Model;
  readonly projection: Projection;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly positions: ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>>;
  readonly reducedMotion?: boolean;
}

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

export const focusCentre = (state: NavigationState, positions: ResolveInput['positions']): Vector3 => {
  const p = positions.get(state.focus);
  return p ? toMetres(p.value) : [0, 0, 0];
};

export const viewOf = (i: Pick<ResolveInput, 'state' | 'viewport' | 'positions'>): View => ({
  scale: i.state.scale,
  centre: focusCentre(i.state, i.positions),
  pan: i.state.pan,
  width: i.viewport.width,
  height: i.viewport.height,
});

const onScreen = (x: number, y: number, r: number, v: View) => x + r >= 0 && x - r <= v.width && y + r >= 0 && y - r <= v.height;

export const resolve = (i: ResolveInput): Scene => {
  const { state, model, projection } = i;
  const view = viewOf(i);
  const fades = fadesAt(state.scale, { reducedMotion: i.reducedMotion ?? false });
  const marks: ResolvedMark[] = [];
  const lines: ResolvedLine[] = [];

  if (state.mode === 'spatial') {
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
      if (stellar) { shape = 'stellar'; radiusPx = 2.5; }
      else if (truePx === null) shape = 'point';
      else if (state.scalePolicy === 'exaggerated' && truePx < MIN_DISC_PX) { radiusPx = MIN_DISC_PX; exaggeration = MIN_DISC_PX / truePx; }
      const focused = state.focus === id;
      const selected = state.selection === id;
      const name = e.names.canonical;
      const visible = alpha > 0.01 && onScreen(p.x, p.y, radiusPx, view);
      marks.push({
        id, name, kind: e.kind, shape, at: { x: p.x, y: p.y }, radiusPx, visible,
        style: { fill: 'ink', ...(exaggeration ? { stroke: 'vermilion', lineWidth: 1 } : {}) },
        exaggeration, radiusMissing: truePx === null, status: 'derived', hasSourceRecord: true,
        selected, focused,
        label: exaggeration && (focused || selected) ? `${name} · exaggerated ×${formatFactor(exaggeration)}` : name,
        labelPriority: focused ? 100 : selected ? 90 : (IMPORTANCE[e.kind] ?? 10),
        alpha,
      });
    }
  }
  return { regime: state.regime, scale: state.scale, fades, marks, lines, cue: null };
};
