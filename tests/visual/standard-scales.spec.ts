// Screenshots at the standard scales, compared against approved baselines. The release banner and
// the date field are masked: they say how the build was run, not what the atlas draws.
import { expect, test, type Page } from '@playwright/test';

const TODAY = '2026-10-22T12:00:00Z';

const open = async (page: Page, o: { motion?: boolean } = {}) => {
  await page.clock.setFixedTime(new Date(TODAY));
  await page.emulateMedia({ reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  // The legend shows itself once on first use; these views are of the scene, so it has been seen.
  await page.addInitScript(() => { try { localStorage.setItem('atlas.legend.seen', '1'); } catch { /* no storage */ } });
  await page.goto('/?test&release=001-prototype');
  await page.waitForFunction(() => (window as unknown as { __atlas?: { ready?: boolean } }).__atlas?.ready === true);
  await page.evaluate(() => document.fonts.ready);
};

const scaleTo = async (page: Page, scale: number) => {
  await page.evaluate((target) => {
    const h = (window as unknown as { __atlas: { state(): { scale: number }; dispatch(a: unknown): void } }).__atlas;
    h.dispatch({ kind: 'scale', factor: target / h.state().scale });
  }, scale);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const shot = (page: Page, name: string) =>
  expect(page).toHaveScreenshot(`${name}.png`, { mask: [page.locator('#release-banner')], maxDiffPixelRatio: 0.002 });

// Opening: Earth about 127 px across, the Moon out of view.
test('opening scale', async ({ page }) => { await open(page); await shot(page, 'opening'); });
// The Moon in Earth's context.
test('Moon in view', async ({ page }) => { await open(page); await scaleTo(page, 1.6e6); await shot(page, 'moon-in-view'); });
// The Solar System with every planet's track.
test('heliocentric scale', async ({ page }) => { await open(page); await scaleTo(page, 2e10); await shot(page, 'heliocentric'); });

// The time controller after a date outside the window was refused: the window, the epoch, the refusal.
test('time controller with a refusal', async ({ page }) => {
  await open(page);
  await scaleTo(page, 2e9);
  await page.evaluate(() => {
    const h = (window as unknown as { __atlas: { dispatch(a: unknown): void } }).__atlas;
    h.dispatch({ kind: 'setDate', date: '2030-01-01' });
    h.dispatch({ kind: 'setDate', date: '2100-01-01' });
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(page.locator('.time-controller')).toHaveScreenshot('time-controller-refused.png');
});

// The midpoint of the band between the Solar System and the nearby stars (5 × 10¹² m/px), with motion
// allowed: under reduced motion the band is a cut and its midpoint shows one side or the other.
test('transition midpoint', async ({ page }) => { await open(page, { motion: true }); await scaleTo(page, 5e12); await shot(page, 'transition-midpoint'); });

// The nearby stars, Proxima Centauri selected: its distance, range and parallax record.
test('stellar scale', async ({ page }) => {
  await open(page);
  await scaleTo(page, 3e14);
  await page.evaluate(() => {
    const h = (window as unknown as { __atlas: { idOf(n: string): string; dispatch(a: unknown): void } }).__atlas;
    h.dispatch({ kind: 'select', id: h.idOf('Proxima Centauri') });
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // Under reduced motion the chapter cue is a one-second static display; the view is of what follows.
  await expect(page.locator('.chapter-cue')).toBeHidden({ timeout: 3000 });
  await shot(page, 'stellar');
});

// The inspector on Mars's distance from the Sun: the derived state, its model, and the state vectors'
// record with the attribution beside the dataset release.
test('inspector on a distance', async ({ page }) => {
  await open(page);
  await scaleTo(page, 2e9);
  await page.evaluate(() => {
    const h = (window as unknown as { __atlas: { idOf(n: string): string; dispatch(a: unknown): void } }).__atlas;
    h.dispatch({ kind: 'select', id: h.idOf('Mars') });
    h.dispatch({ kind: 'inspect', target: { kind: 'value', subject: h.idOf('Mars'), property: 'distance' } });
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(page.locator('#inspector')).toHaveScreenshot('inspector-distance.png');
});

// The release view: the release, its window, and every source with its licence and attribution.
test('release view', async ({ page }) => {
  await open(page);
  await page.evaluate(() => (window as unknown as { __atlas: { dispatch(a: unknown): void } }).__atlas.dispatch({ kind: 'inspect', target: { kind: 'release' } }));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(page.locator('#inspector')).toHaveScreenshot('release-view.png');
});

// The structural branch: the substance view from Earth, and the water molecule through its plane.
const hook = (page: import('@playwright/test').Page, f: string, ...args: unknown[]) =>
  page.evaluate(([n, a]) => {
    const h = (window as unknown as { __atlas: Record<string, (...x: unknown[]) => unknown> }).__atlas;
    return h[n as string]?.(...(a as unknown[]));
  }, [f, args] as const);

test('substance view', async ({ page }) => {
  await open(page);
  await hook(page, 'dispatch', { kind: 'enterStructural' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.locator('.mode-notice').evaluate((e) => { (e as HTMLElement).hidden = true; });
  await expect(page).toHaveScreenshot('substance-view.png');
});

test('molecule view', async ({ page }) => {
  await open(page);
  await hook(page, 'dispatch', { kind: 'enterStructural' });
  await hook(page, 'dispatch', { kind: 'focus', id: 'atlas:water' });
  await hook(page, 'dispatch', { kind: 'focus', id: 'atlas:pubchem-962' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.locator('.mode-notice').evaluate((e) => { (e as HTMLElement).hidden = true; });
  await expect(page).toHaveScreenshot('molecule-view.png');
});
