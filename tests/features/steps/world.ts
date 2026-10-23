// The harness: a fixture that opens the built atlas on a release, reads its state through the test
// hook (enabled by ?test only), acts as the person does (keys, clicks, the controls), and fails the
// scenario on any request to a host other than the preview server, which proves FR-018's "no
// external call" for every scenario.
import { expect, type Page } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';

/** The release is reproducible (T074); development mode is for working on an incomplete one. */
export const ALLOW_UNREPRODUCIBLE = process.env.ATLAS_ALLOW_UNREPRODUCIBLE === '1';
/** Every scenario runs on one date so positions, and so the marks' places, are the same each run. */
export const TODAY = '2026-10-22T12:00:00Z';
export const PLANETARY_SCALE = 2e9;
export const HELIOCENTRIC_SCALE = 2e10;
/** The inner edge of the band between the Solar System and the nearby stars (the resolver's BAND.inner). */
export const BAND_INNER = 1e12;
/** A view of the nearby stars: about four parsecs either side of the Sun on the test viewport. */
export const STELLAR_VIEW_SCALE = 3e14;
export const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

export interface Mark {
  id: string; name: string; kind: string; shape: string; at: { x: number; y: number }; radiusPx: number; visible: boolean; alpha: number;
  exaggeration: number | null; radiusMissing: boolean; status: string; hasSourceRecord: boolean; selected: boolean; focused: boolean; label: string | null;
}
export interface Line { id: string; of: string; visible: boolean; style: { vocabulary: string; alpha?: number } }
export interface SceneView { regime: string; scale: number; marks: Mark[]; lines: Line[]; fades: Record<string, number>; cue: { text: string; alpha: number } | null }
export interface StateView {
  focus: string; selection: string | null; mode: string; regime: string; scale: number; pan: { x: number; y: number }; utc: string; playing: boolean; scalePolicy: string;
  breadcrumb: { id: string; name: string }[]; offer: string | null; refusal: { date: string; window: { from: string; to: string } } | null;
  announcement: unknown; candidates: { id: string; name: string; kind: string }[] | null; window: { from: string; to: string }; rate: { daysPerSecond: number };
}

/** window.__atlas, as the application exposes it under ?test. */
interface Hook {
  ready: boolean; loaded: boolean;
  state(): StateView; scene(): SceneView; labels(): { placed: string[]; dropped: string[] };
  dispatch(a: unknown): void; radiusKm(id: string): number | null; nameOf(id: string): string | null; idOf(name: string): string | null;
  positions(): { id: string; r: [number, number, number]; unit: string; frame: string; jd: number; scale: string }[];
  precision(): { subject: string; maxError: { value: number; unit: string } }[];
  marks(): { id: string; name: string; kind: string; status: string; hasSourceRecord: boolean; label: string | null }[];
  markShapes(): Record<string, string>;
}

export class Atlas {
  readonly external: string[] = [];
  /** What a scenario carries from one step to the next. */
  readonly memo: Record<string, unknown> = {};
  constructor(readonly page: Page) {}

  async open(release: string) {
    await this.page.clock.install({ time: new Date(TODAY) });
    // The legend shows itself once on first use; a scenario opens it when it is about the legend.
    await this.page.addInitScript(() => { try { localStorage.setItem('atlas.legend.seen', '1'); } catch { /* no storage */ } });
    const q = ['test', `release=${encodeURIComponent(release)}`, ALLOW_UNREPRODUCIBLE ? 'allow-unreproducible' : ''].filter(Boolean).join('&');
    await this.page.goto(`/?${q}`);
    await this.page.waitForFunction(() => (window as unknown as { __atlas?: { ready?: boolean } }).__atlas?.ready === true);
    const problem = await this.page.locator('#problem').textContent();
    expect(problem ?? '', 'the release loads').toBe('');
  }

  private call<R>(name: keyof Hook, ...args: unknown[]): Promise<R> {
    return this.page.evaluate(([n, a]) => {
      const h = (window as unknown as { __atlas: Record<string, (...x: unknown[]) => unknown> }).__atlas;
      return h[n as string]?.(...(a as unknown[]));
    }, [name, args] as const) as Promise<R>;
  }

  state() { return this.call<StateView>('state'); }
  scene() { return this.call<SceneView>('scene'); }
  labels() { return this.call<{ placed: string[]; dropped: string[] }>('labels'); }
  positions() { return this.call<ReturnType<Hook['positions']>>('positions'); }
  precision() { return this.call<ReturnType<Hook['precision']>>('precision'); }
  radiusKm(id: string) { return this.call<number | null>('radiusKm', id); }
  marks() { return this.call<ReturnType<Hook['marks']>>('marks'); }
  markShapes() { return this.call<Record<string, string>>('markShapes'); }
  dispatch(a: unknown) { return this.call<void>('dispatch', a); }
  /** The person opens the inspector on a value of the selection's metadata. */
  async inspectField(field: string, text?: string) {
    const v = this.page.locator(`.metadata [data-field="${field}"] button.meta-value`);
    await (text ? v.filter({ hasText: text }) : v).first().click();
    await this.settle();
    await expect(this.page.locator('#inspector')).toBeVisible();
  }
  idOf(name: string) { return this.call<string | null>('idOf', name); }
  nameOf(id: string) { return this.call<string | null>('nameOf', id); }
  /** Leaves any field, so the next key goes to the scene. */
  async blur() { await this.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); }
  /** Waits for the frame the last action scheduled. */
  async settle() { await this.page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); }

  async mark(name: string): Promise<Mark | undefined> { await this.settle(); return (await this.scene()).marks.find((m) => m.name === name); }

  async press(key: string, times = 1) { for (let i = 0; i < times; i++) await this.page.keyboard.press(key); await this.settle(); }

  /** The person scales out with the keyboard until the predicate holds. */
  async scaleOutUntil(done: (s: StateView, scene: SceneView) => boolean, max = 60) {
    await this.blur();
    for (let i = 0; i < max; i++) {
      await this.settle();
      if (done(await this.state(), await this.scene())) return;
      await this.page.keyboard.press('-');
    }
    throw new Error('scaling out never reached the view the step asks for');
  }

  async scaleInUntil(done: (s: StateView, scene: SceneView) => boolean, max = 60) {
    await this.blur();
    for (let i = 0; i < max; i++) {
      await this.settle();
      if (done(await this.state(), await this.scene())) return;
      await this.page.keyboard.press('+');
    }
    throw new Error('scaling in never reached the view the step asks for');
  }

  /** The person clicks the mark of an entity on the screen. */
  async click(name: string, opts: { double?: boolean } = {}) {
    const m = await this.mark(name);
    expect(m?.visible, `${name} is visible to be clicked`).toBe(true);
    const { x, y } = (m as Mark).at;
    const target = await this.page.evaluate(([px, py]) => document.elementFromPoint(px as number, py as number)?.id ?? '', [x, y]);
    expect(target, `nothing covers ${name} on the screen`).toBe('scene');
    if (opts.double) await this.page.mouse.dblclick(x, y); else await this.page.mouse.click(x, y);
    await this.settle();
  }

  async planetary(scale = PLANETARY_SCALE) {
    await this.scaleOutUntil((s) => s.scale >= scale);
    expect((await this.state()).regime).toBe('planetary');
  }

  /** The person scales out until the nearby stellar regime is in force and the nearby stars are in view. */
  async stellar() {
    await this.scaleOutUntil((s, sc) => s.regime === 'nearby-stellar' && s.scale >= STELLAR_VIEW_SCALE && (sc.fades.stars ?? 0) >= 1);
  }

  async focusName() { const s = await this.state(); return this.nameOf(s.focus); }
  async selectionName() { const s = await this.state(); return s.selection ? this.nameOf(s.selection) : null; }
}

export const test = base.extend<{ atlas: Atlas }>({
  atlas: async ({ page, baseURL }, use) => {
    const atlas = new Atlas(page);
    const own = new URL(baseURL ?? 'http://localhost:4173').host;
    await page.route('**/*', (route) => {
      const host = new URL(route.request().url()).host;
      if (host === own) return route.continue();
      atlas.external.push(route.request().url());
      return route.abort();
    });
    await use(atlas);
    expect(atlas.external, 'the atlas made no request to an external service (FR-018)').toEqual([]);
  },
});

export const { Given, When, Then } = createBdd(test);
