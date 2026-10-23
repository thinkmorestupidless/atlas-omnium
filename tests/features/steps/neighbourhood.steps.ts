// Steps of features/stars/neighbourhood.feature: the band between the Solar System and the nearby
// stars, the Sun's identity across it, a star's distance and records, the legend's criteria.
import { expect } from '@playwright/test';
import { BAND_INNER, Given, Then, When, type Atlas } from './world';

const SAME_PLACE_PX = 0.5;

/** Where the Sun is on the screen at the inner edge of the band, kept for the step that compares. */
const sunAtBandEdge = async (atlas: Atlas) => {
  await atlas.scaleOutUntil((s) => s.scale >= BAND_INNER);
  const sun = await atlas.mark('Sun');
  expect(sun?.visible, 'the Sun is on the screen at the edge of the band').toBe(true);
  atlas.memo.sunAt = sun?.at;
};

const sameSunPlace = async (atlas: Atlas) => {
  const sun = await atlas.mark('Sun');
  const was = atlas.memo.sunAt as { x: number; y: number };
  expect(sun?.visible).toBe(true);
  expect(Math.hypot((sun?.at.x ?? NaN) - was.x, (sun?.at.y ?? NaN) - was.y), 'the Sun stays at the same place on the screen').toBeLessThan(SAME_PLACE_PX);
};

When('the person scales out past the orbit track of {string}', async ({ atlas }, name: string) => {
  await sunAtBandEdge(atlas);
  const track = `track:${await atlas.idOf(name)}`;
  await atlas.scaleOutUntil((_s, sc) => !sc.lines.some((l) => l.id === track && l.visible));
});

Then('the orbit tracks fade', async ({ atlas }) => {
  const sc = await atlas.scene();
  expect(sc.fades.tracks).toBeLessThan(1);
  expect(sc.lines.filter((l) => l.id.startsWith('track:') && l.visible && (l.style.alpha ?? 1) > 0.01)).toEqual([]);
});

Then('{string} is visible as a stellar mark at the same place on the screen', async ({ atlas }, name: string) => {
  const m = await atlas.mark(name);
  expect(m?.shape).toBe('stellar');
  await sameSunPlace(atlas);
});

Given('the planetary regime is in force and the selection is {string}', async ({ atlas }, name: string) => {
  await atlas.planetary();
  await atlas.click(name);
  expect(await atlas.selectionName()).toBe(name);
});

When('the person scales out until the nearby stellar regime is in force', async ({ atlas }) => {
  atlas.memo.breadcrumb = (await atlas.state()).breadcrumb.map((c) => c.id);
  await atlas.stellar();
});

Given('the nearby stellar regime is in force', async ({ atlas }) => {
  await atlas.stellar();
});

Given('the nearby stellar regime is in force and the selection is {string}', async ({ atlas }, name: string) => {
  await atlas.stellar();
  await atlas.click(name);
  expect(await atlas.selectionName()).toBe(name);
  atlas.memo.sunAt = (await atlas.mark('Sun'))?.at;
});

When('the person scales in until the planetary regime is in force', async ({ atlas }) => {
  await atlas.scaleInUntil((s) => s.regime === 'planetary' && s.scale <= BAND_INNER);
});

Then('the breadcrumb is unchanged', async ({ atlas }) => {
  expect((await atlas.state()).breadcrumb.map((c) => c.id)).toEqual(atlas.memo.breadcrumb);
});

Then('the nearby stars of the star sample are visible as marks', async ({ atlas }) => {
  const stars = (await atlas.scene()).marks.filter((m) => m.visible && m.shape === 'stellar' && m.name !== 'Sun');
  expect(stars.length, 'several nearby stars are in view').toBeGreaterThan(5);
  for (const m of stars) expect(m.id, `${m.name} is a member of the star sample`).toMatch(/^atlas:(gaia-dr3|hip)-/);
});

Then('{string} is one mark among them', async ({ atlas }, name: string) => {
  const m = await atlas.mark(name);
  expect(m?.visible).toBe(true);
  expect(m?.shape).toBe('stellar');
});

Then('the metadata shows the distance from {string} with its unit and the range of its uncertainty', async ({ atlas }, from: string) => {
  const line = atlas.page.locator('.metadata [data-field="distance"]');
  await expect(line.locator('dt')).toHaveText(`distance from the ${from}`);
  await expect(line.locator('.meta-value')).toHaveText(/^[\d.,]+ pc, range [\d.,]+ to [\d.,]+ pc$/);
});

Then('the inspector shows the parallax observation with its source record and the model the distance is derived from', async ({ atlas }) => {
  await atlas.inspectField('distance');
  const insp = atlas.page.locator('#inspector');
  await expect(insp.locator('[data-field="model"]').first()).toContainText('inverse-parallax');
  const from = insp.locator('[data-predicate="derivedFrom"]');
  await expect(from.locator('[data-field="value"] dt')).toHaveText('parallax');
  await expect(from.locator('[data-field="value"] dd')).toHaveText(/^[\d.,]+ mas$/);
  await expect(from.locator('[data-field="source-dataset"] dd')).toHaveText('gaia');
  await expect(from.locator('[data-field="source-record"] dd')).toContainText('source_id');
});

When('the person focuses {string}', async ({ atlas }, name: string) => {
  await atlas.click(name, { double: true });
  expect(await atlas.focusName()).toBe(name);
});

Then('no mark is visible for an entity the release has no source record for', async ({ atlas }) => {
  const visible = (await atlas.scene()).marks.filter((m) => m.visible);
  for (const m of visible) {
    expect(m.hasSourceRecord, `${m.name} has a source record`).toBe(true);
    expect(await atlas.nameOf(m.id), `${m.id} is an entity of the release`).not.toBeNull();
  }
  expect(visible.filter((m) => m.kind === 'Planet').map((m) => m.name), 'no planet is drawn beside the star').toEqual([]);
});

When('the person opens the legend', async ({ atlas }) => {
  await atlas.blur();
  await atlas.press('l');
});

Then('the selection criteria of the star sample are shown with the catalogue release', async ({ atlas }) => {
  const legend = atlas.page.locator('#legend');
  await expect(legend).toBeVisible();
  await expect(legend.locator('[data-field="criteria"]')).toContainText('parallax over 100 mas');
  await expect(legend.locator('[data-field="criteria"]')).toContainText('RUWE under 1.4');
  await expect(legend.locator('[data-field="catalogue-release"]')).toContainText('Gaia DR3');
  await expect(legend.locator('[data-field="count"]')).toContainText(/\d+ stars from Gaia DR3/);
});

Then('the orbit tracks are visible', async ({ atlas }) => {
  const tracks = (await atlas.scene()).lines.filter((l) => l.id.startsWith('track:') && l.visible && (l.style.alpha ?? 0) > 0.1);
  expect(tracks.length).toBeGreaterThan(0);
});

Then('{string} is at the same place on the screen', async ({ atlas }, _name: string) => {
  await sameSunPlace(atlas);
});

When('the person reads the scale rail', async ({ atlas }) => {
  await expect(atlas.page.locator('.scale-rail')).toBeVisible();
});

Then('the scale rail declares that a dimension is flattened', async ({ atlas }) => {
  await expect(atlas.page.locator('.rail-note')).toContainText('a dimension is flattened');
  await expect(atlas.page.locator('.rail-note')).toHaveAttribute('data-flattens', 'ecliptic-z');
});

Then('the star is visible as a stellar mark', async ({ atlas }) => {
  const s = await atlas.state();
  const m = (await atlas.scene()).marks.find((x) => x.id === s.selection);
  expect(m?.visible).toBe(true);
  expect(m?.shape).toBe('stellar');
});

Then('the inspector shows a cross-match record with both source records and the basis of the match', async ({ atlas }) => {
  await atlas.inspectField('cross-match');
  const same = atlas.page.locator('#inspector [data-predicate="sameAs"]');
  await expect(same.locator('[data-field="cross-match-record"]')).toHaveCount(2);
  await expect(same.locator('[data-field="cross-match-record"]').nth(0)).toContainText('hipparcos2');
  await expect(same.locator('[data-field="cross-match-record"]').nth(1)).toContainText('simbad');
  await expect(same.locator('[data-field="cross-match-basis"] dd')).toHaveText('published cross identification');
});
