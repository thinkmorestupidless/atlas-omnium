// The composition root of the browser surface: load the release, build the navigation state and its
// context, wire inputs to the bus, and draw on every change and on every frame while time plays.
import { buildContext } from './navigation/context';
import { initialState } from './navigation/state';
import { loadRelease, UnreproducibleRelease } from './model/release';
import type { DerivedState, Model } from './model/derived';
import type { PositionAtEpoch } from './model/frames';
import type { AtlasId } from './model/ids';
import { starStates } from './model/parallax';
import { bodyPositions, epochOf } from './model/positions';
import { createBus, type Bus, type Store } from './input/bus';
import type { Action } from './input/actions';
import { attachKeyboard } from './input/keyboard';
import { attachPointer } from './input/pointer';
import { attachTouch } from './input/touch';
import { eclipticTopDown } from './projections/ecliptic-top-down';
import { createCanvas2d } from './renderers/canvas2d';
import { drawOrbitGeometry } from './renderers/orbit-geometry';
import { drawPoints } from './renderers/points';
import { drawComposition } from './renderers/composition';
import type { Renderer } from './renderers/renderer';
import { resolve, viewOf } from './renderers/representation';
import type { Scene } from './renderers/representation-types';
import { breadcrumb } from './ui/breadcrumb';
import { chapterCue } from './ui/chapter-cue';
import { inspector } from './ui/inspector';
import { legend } from './ui/legend';
import { MARK_SHAPES } from './ui/status-marks';
import { lockup } from './ui/lockup';
import { madeOf } from './ui/made-of';
import { announcer } from './ui/announcer';
import { metadata } from './ui/metadata';
import { onMotionChange, reducedMotion } from './ui/motion';
import { scaleRail } from './ui/scale-rail';
import { timeController } from './ui/time-controller';

const params = new URLSearchParams(location.search);
const release = params.get('release') ?? '001-prototype';
const testMode = params.has('test');
const allowUnreproducible = params.has('allow-unreproducible');

const fetchText = async (path: string): Promise<string> => {
  const res = await fetch(`./${path}`);
  if (!res.ok) throw new Error(`${res.status} fetching ${path}`);
  return res.text();
};

const el = <T extends HTMLElement>(id: string): T => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`no #${id}`);
  return e as T;
};

const showProblem = (text: string) => {
  const p = el('problem');
  p.textContent = text;
  p.hidden = false;
};

const today = () => new Date().toISOString().slice(0, 10);

export interface AtlasApp {
  model: Model;
  bus: Bus;
  renderer: Renderer;
  scene(): Scene | null;
  positions(): ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>>;
  labels(): { placed: string[]; dropped: string[] };
}

const start = async (): Promise<AtlasApp | null> => {
  const root = el('atlas');
  root.append(lockup());
  const canvas = el<HTMLCanvasElement>('scene');
  const renderer = createCanvas2d(canvas);
  renderer.clear();
  let model: Model;
  try {
    model = await loadRelease(release, fetchText, { allowUnreproducible, allowTestRelease: testMode });
  } catch (e) {
    showProblem(e instanceof UnreproducibleRelease
      ? `Release ${e.release} is not reproducible yet${e.unfilled ? ` (${e.unfilled} is unfilled)` : ''}, so the atlas will not show it.`
      : `The release could not be loaded: ${(e as Error).message}`);
    return null;
  }
  if (!model.release.reproducible) el('release-banner').hidden = false;
  if (model.release.testRelease) { const b = el('release-banner'); b.hidden = false; b.textContent = `test release ${model.release.name}`; }

  const viewport = () => ({ width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 });
  const ctx = buildContext(model, () => Math.min(viewport().width, viewport().height));
  const nav = initialState({ release, window: model.release.window, today: today() });
  let scene: Scene | null = null;
  let positions: ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>> = new Map();
  let labels = { placed: [] as string[], dropped: [] as string[] };
  const projection = eclipticTopDown;
  // The stars are at their catalogue epochs and do not move with the date (no proper motion in 001).
  const stars = starStates(model);
  const crossMatches = new Map((model.stars?.crossMatches ?? []).map((c) => [c.entity, c]));

  const bus = createBus({ nav, surface: { inspect: null, legendOpen: false } }, () => {
    const v = viewOf({ state: bus.get().nav, viewport: viewport(), positions, stars });
    return {
      ctx,
      anchorToPlane: (px) => projection.offsetOf(px, v),
      deltaToPlane: (dx, dy) => ({ x: dx * v.scale, y: -dy * v.scale }),
      selectable: () => (scene?.marks ?? []).filter((m) => m.visible).sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x).map((m) => m.id),
    };
  });
  // Time plays from the instant play is chosen and is counted up to the instant it is paused, so ten
  // seconds of play at one day per second is ten days exactly.
  let last = 0;
  const dispatch = (a: Action) => {
    const playing = bus.get().nav.playing;
    if (playing && (a.kind === 'pause' || a.kind === 'togglePlay')) {
      const now = performance.now();
      bus.dispatch({ kind: 'tick', seconds: (now - last) / 1000 });
      last = now;
    }
    bus.dispatch(a);
    if (!playing && bus.get().nav.playing) last = performance.now();
  };

  const rail = scaleRail(dispatch);
  const crumbs = breadcrumb(dispatch, model.entities);
  const meta = metadata(dispatch);
  const time = timeController(dispatch);
  const offer = madeOf(dispatch);
  const says = announcer();
  const key = legend(dispatch, model);
  const insp = inspector(dispatch);
  const cue = chapterCue();
  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.append(crumbs.el, meta.el, rail.el, offer.el, says.notice, time.el, key.toggle, key.el, insp.el);
  root.append(says.live);
  root.append(cue.el);
  root.append(controls);

  const render = () => {
    const s: Store = bus.get();
    positions = bodyPositions(model, epochOf(s.nav.utc));
    scene = resolve({ state: s.nav, model, projection, viewport: viewport(), positions, stars, reducedMotion: reducedMotion() });
    renderer.clear();
    if (s.nav.mode === 'structural') drawComposition(renderer, scene, viewport());
    else { drawOrbitGeometry(renderer, scene); drawPoints(renderer, scene); }
    labels = renderer.flush();
    rail.update(s.nav, projection);
    crumbs.update(s.nav);
    const sel = s.nav.selection;
    meta.update({ model, selection: sel, positions, mark: scene.marks.find((m) => m.id === sel), star: sel ? stars.get(sel) : undefined, crossMatch: sel ? crossMatches.get(sel) : undefined });
    key.update(s.surface.legendOpen);
    insp.update(s.surface.inspect, { model, positions, stars, crossMatches });
    cue.update(scene, reducedMotion());
    time.update(s.nav);
    offer.update(s.nav, model.entities.name(s.nav.focus));
    says.update(s.nav, (id) => model.entities.name(id));
    canvas.setAttribute('aria-label', `The atlas scene: ${model.entities.name(s.nav.focus)} in focus, the ${s.nav.regime.replace('-', ' ')} regime, ${s.nav.mode} navigation`);
  };

  let frame = 0;
  const loop = () => {
    frame = 0;
    if (bus.get().nav.playing) {
      const now = performance.now();
      const elapsed = (now - last) / 1000;
      last = now;
      if (elapsed > 0) bus.dispatch({ kind: 'tick', seconds: elapsed });
      schedule();
    }
    render();
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(loop); };
  bus.subscribe(schedule);
  window.addEventListener('resize', schedule);
  onMotionChange(schedule);

  attachPointer(canvas, dispatch, () => scene);
  attachTouch(canvas, dispatch, () => scene, () => bus.get().nav.selection);
  attachKeyboard(dispatch, { dateField: () => { time.input.focus(); time.input.select(); }, rateStep: (d) => time.step(d), escape: () => { dispatch({ kind: 'legend', open: false }); dispatch({ kind: 'inspect', target: null }); },
    inspectSelection: () => { const sel = bus.get().nav.selection; dispatch({ kind: 'inspect', target: sel ? { kind: 'entity', subject: sel } : { kind: 'release' } }); } });
  render();

  return { model, bus, renderer, scene: () => scene, positions: () => positions, labels: () => labels };
};

void start().then((app) => {
  if (!testMode) return;
  // The test hook: what the feature harness reads. Present only under ?test.
  const hook = {
    ready: true,
    loaded: app !== null,
    state: () => {
      if (!app) return null;
      const n = app.bus.get().nav;
      return { ...n, breadcrumb: n.breadcrumb.map((c) => ({ ...c, name: app.model.entities.name(c.id) })), surface: app.bus.get().surface };
    },
    scene: () => app?.scene() ?? null,
    labels: () => app?.labels() ?? null,
    dispatch: (a: Action) => app?.bus.dispatch(a),
    positions: () => app ? [...app.positions()].map(([id, p]) => ({ id, r: p.value.r, unit: p.value.unit, frame: p.value.frame.kind, jd: p.value.epoch.jd, scale: p.value.epoch.scale })) : [],
    radiusKm: (id: string) => app?.model.observations.measured(id as AtlasId, 'meanRadius').value ?? null,
    nameOf: (id: string) => app?.model.entities.name(id as AtlasId) ?? null,
    idOf: (name: string) => app?.model.entities.all().find((e) => e.names.canonical === name)?.id ?? null,
    precision: () => app ? [...app.model.precision.values()] : [],
    /** Every visible mark: its entity, its status and whether a source record stands behind it. */
    marks: () => (app?.scene()?.marks ?? []).filter((m) => m.visible).map((m) => ({ id: m.id, name: m.name, kind: m.kind, status: m.status, hasSourceRecord: m.hasSourceRecord, label: m.label })),
    markShapes: () => MARK_SHAPES,
  };
  (window as unknown as { __atlas: unknown }).__atlas = hook;
});
