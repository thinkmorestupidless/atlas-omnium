// The composition root of the browser surface: load the release, build the navigation state and its
// context, wire inputs to the bus, and draw on every change.
import { buildContext } from './navigation/context';
import { initialState } from './navigation/state';
import { loadRelease, UnreproducibleRelease } from './model/release';
import type { Model } from './model/derived';
import { createBus, type Bus } from './input/bus';
import { createCanvas2d } from './renderers/canvas2d';
import type { Renderer } from './renderers/renderer';

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

export interface AtlasApp { model: Model; bus: Bus; renderer: Renderer }

const start = async (): Promise<AtlasApp | null> => {
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

  const shortSide = () => Math.min(canvas.clientWidth, canvas.clientHeight) || 800;
  const ctx = buildContext(model, shortSide);
  const nav = initialState({ release, window: model.release.window, today: today() });
  const bus = createBus({ nav, surface: { inspect: null, legendOpen: false } }, () => ({
    ctx,
    pxToPlane: (dx, dy) => ({ x: dx * bus.get().nav.scale, y: -dy * bus.get().nav.scale }),
    selectable: () => [],
  }));
  return { model, bus, renderer };
};

void start().then((app) => {
  if (!testMode) return;
  const hook = {
    ready: true,
    app,
    state: () => {
      if (!app) return null;
      const n = app.bus.get().nav;
      return {
        ...n,
        breadcrumb: n.breadcrumb.map((c) => ({ id: c.id, name: app.model.entities.name(c.id) })),
      };
    },
    dispatch: (a: Parameters<Bus['dispatch']>[0]) => app?.bus.dispatch(a),
  };
  (window as unknown as { __atlas: unknown }).__atlas = hook;
});
