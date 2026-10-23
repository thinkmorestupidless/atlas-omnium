// The harness: a fixture that opens the built atlas on a release, reads its state through the test
// hook (enabled by ?test only), and fails the scenario on any request to a host other than the
// preview server, which proves FR-018's "no external call" for every scenario.
import { expect, type Page } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';

/** Until the release is fully ingested (T074), the harness opens it in development mode. */
export const ALLOW_UNREPRODUCIBLE = process.env.ATLAS_ALLOW_UNREPRODUCIBLE !== '0';

export class Atlas {
  readonly external: string[] = [];
  constructor(readonly page: Page) {}

  async open(release: string, _opts: { test?: boolean } = {}) {
    const q = new URLSearchParams({ release });
    q.set('test', '');
    if (ALLOW_UNREPRODUCIBLE) q.set('allow-unreproducible', '');
    await this.page.goto(`/?${q.toString().replace(/=(&|$)/g, '$1')}`);
    await this.page.waitForFunction(() => (window as unknown as { __atlas?: { ready?: boolean } }).__atlas?.ready === true);
    const problem = await this.page.locator('#problem').textContent();
    expect(problem ?? '', 'the release loads').toBe('');
  }

  /** Evaluate in the page with the test hook. */
  hook<R, A = undefined>(fn: (h: Hook, arg: A) => R, arg?: A): Promise<R> {
    return this.page.evaluate(
      ([src, a]) => {
        const h = (window as unknown as { __atlas: Hook }).__atlas;
        return new Function('h', 'a', `return (${src})(h, a)`)(h, a);
      },
      [fn.toString(), arg] as const,
    ) as Promise<R>;
  }

  state() { return this.hook((h) => h.state()); }
}

/** The shape of window.__atlas, as the application exposes it under ?test. */
export interface Hook {
  ready: boolean;
  state(): {
    focus: string; selection: string | null; mode: string; regime: string; scale: number; utc: string; playing: boolean;
    breadcrumb: { id: string; name: string }[]; offer: string | null; refusal: unknown; announcement: unknown; candidates: unknown;
    scalePolicy: string; window: { from: string; to: string };
  };
  [k: string]: unknown;
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
