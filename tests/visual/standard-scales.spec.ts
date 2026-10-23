// Screenshots at the standard scales, compared against approved baselines. The release banner and
// the date field are masked: they say how the build was run, not what the atlas draws.
import { expect, test, type Page } from '@playwright/test';

const TODAY = '2026-10-22T12:00:00Z';

const open = async (page: Page) => {
  await page.clock.setFixedTime(new Date(TODAY));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?test&release=001-prototype&allow-unreproducible');
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
