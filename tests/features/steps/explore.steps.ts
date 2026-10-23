// features/solar-system/explore.feature
import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { Given, HELIOCENTRIC_SCALE, PLANETS, Then, When, type Atlas } from './world';

const AU_KM = 149597870.7;

const metaValue = (atlas: Atlas, field: string) => atlas.page.locator(`.metadata [data-field="${field}"] .meta-value`);
const metaSource = (atlas: Atlas, field: string) => atlas.page.locator(`.metadata [data-field="${field}"] .meta-source`);

When('the person opens the atlas', async ({ atlas }) => {
  await atlas.settle();
});

Then('the focus is {string} and the selection is {string}', async ({ atlas }, focus: string, selection: string) => {
  expect(await atlas.focusName()).toBe(focus);
  expect(await atlas.selectionName()).toBe(selection);
});

Then('{string} is not visible', async ({ atlas }, name: string) => {
  expect((await atlas.mark(name))?.visible ?? false).toBe(false);
});

Then('the scale rail and the time controller are visible', async ({ atlas }) => {
  await expect(atlas.page.getByRole('slider', { name: 'scale' })).toBeVisible();
  await expect(atlas.page.getByRole('region', { name: 'time controller' })).toBeVisible();
});

Given('the focus is {string}', async ({ atlas }, name: string) => {
  expect(await atlas.focusName()).toBe(name);
});

When('the person scales out', async ({ atlas }) => {
  await atlas.page.locator('body').focus();
  await atlas.press('-', 4);
});

Then('{string} is visible as a mark in the context of {string}', async ({ atlas }, name: string, context: string) => {
  const m = await atlas.mark(name);
  const c = await atlas.mark(context);
  expect(m?.visible).toBe(true);
  expect(c?.visible).toBe(true);
  expect(m?.shape).toBe('disc');
});

Given('the focus is {string} and {string} is visible', async ({ atlas }, focus: string, name: string) => {
  expect(await atlas.focusName()).toBe(focus);
  await atlas.scaleOutUntil((_, scene) => scene.marks.some((m) => m.name === name && m.visible));
});

When('the person scales out past {string}', async ({ atlas }, _name: string) => {
  await atlas.scaleOutUntil((s) => s.scale >= HELIOCENTRIC_SCALE);
});

Then('{string} and the eight planets are visible as marks', async ({ atlas }, name: string) => {
  await atlas.settle();
  const visible = new Set((await atlas.scene()).marks.filter((m) => m.visible).map((m) => m.name));
  for (const n of [name, ...PLANETS]) expect(visible.has(n), `${n} is visible`).toBe(true);
});

Then('each planet has an orbit track', async ({ atlas }) => {
  const scene = await atlas.scene();
  for (const n of PLANETS) {
    const id = await atlas.idOf(n);
    const track = scene.lines.find((l) => l.of === id && l.id.startsWith('track:'));
    expect(track?.visible, `${n} has a visible orbit track`).toBe(true);
    expect(track?.style.vocabulary).toBe('physical');
  }
});

Then('the metadata shows the canonical name, the distance from {string} with its unit, and the source record of each', async ({ atlas }, from: string) => {
  const sel = (await atlas.state()).selection as string;
  await expect(metaValue(atlas, 'name')).toHaveText((await atlas.nameOf(sel)) as string);
  await expect(metaSource(atlas, 'name')).toContainText('jpl-horizons');
  await expect(atlas.page.locator('.metadata [data-field="distance"] dt')).toHaveText(`distance from the ${from}`);
  await expect(metaValue(atlas, 'distance')).toHaveText(/^[\d.,]+ (km|au|pc)$/);
  await expect(metaSource(atlas, 'distance')).toContainText('jpl-horizons');
});

Then('the breadcrumb ends with {string} after {string}', async ({ atlas }, last: string, before: string) => {
  const names = await atlas.page.locator('.breadcrumb li').allTextContents();
  expect(names.slice(-2)).toEqual([before, last]);
});

Given('the breadcrumb is {string} then {string}', async ({ atlas }, first: string, second: string) => {
  expect((await atlas.state()).breadcrumb.map((c) => c.name)).toEqual([first]);
  await atlas.planetary();
  await atlas.click(second);
  await atlas.page.locator('body').focus();
  await atlas.press('Enter');
  expect((await atlas.state()).breadcrumb.map((c) => c.name)).toEqual([first, second]);
});

Then('the breadcrumb is {string}', async ({ atlas }, name: string) => {
  expect(await atlas.page.locator('.breadcrumb li').allTextContents()).toEqual([name]);
});

const choosePolicy = async (atlas: Atlas, policy: string) => {
  if ((await atlas.state()).scalePolicy !== policy) { await atlas.page.locator('body').focus(); await atlas.press('x'); }
  expect((await atlas.state()).scalePolicy).toBe(policy);
};

Given('the planetary regime is in force with the scale policy {string}', async ({ atlas }, policy: string) => {
  await atlas.planetary();
  await choosePolicy(atlas, policy);
});

When('the person chooses the scale policy {string}', async ({ atlas }, policy: string) => {
  await choosePolicy(atlas, policy);
});

Then('the mark of {string} is labelled as exaggerated with its factor', async ({ atlas }, name: string) => {
  const m = await atlas.mark(name);
  expect(m?.exaggeration ?? 0).toBeGreaterThan(1);
  expect(m?.label ?? '').toMatch(/exaggerated ×[\d,.]+$/);
  expect((await atlas.labels()).placed).toContain(m?.label);
});

Then('the metadata shows the true distance from {string}', async ({ atlas }, from: string) => {
  const sel = (await atlas.state()).selection as string;
  const p = (await atlas.positions()).find((x) => x.id === sel);
  const au = Math.hypot(...(p?.r ?? [0, 0, 0])) / AU_KM;
  await expect(atlas.page.locator('.metadata [data-field="distance"] dt')).toHaveText(`distance from the ${from}`);
  const shown = Number(((await metaValue(atlas, 'distance').textContent()) ?? '').replace(/[^\d.]/g, ''));
  expect(shown).toBeCloseTo(au, 4);
  await expect(metaSource(atlas, 'exaggeration')).toHaveText('the distance is true');
});

Then('every visible mark is drawn at the measured radius of its entity', async ({ atlas }) => {
  const s = await atlas.state();
  const marks = (await atlas.scene()).marks.filter((m) => m.visible && !m.radiusMissing);
  expect(marks.length).toBeGreaterThan(0);
  for (const m of marks) {
    const r = await atlas.radiusKm(m.id);
    expect(r, `${m.name} has a measured radius`).not.toBeNull();
    expect(m.radiusPx, m.name).toBeCloseTo(((r as number) * 1000) / s.scale, 9);
  }
});

Then('no mark is labelled as exaggerated', async ({ atlas }) => {
  const scene = await atlas.scene();
  expect(scene.marks.filter((m) => m.exaggeration !== null).map((m) => m.name)).toEqual([]);
  expect(scene.marks.filter((m) => (m.label ?? '').includes('exaggerated')).map((m) => m.name)).toEqual([]);
});

Given('a curated body with no observation of its radius', async ({ atlas }) => {
  const report = JSON.parse(readFileSync('data/curated/001-prototype/validation-report.json', 'utf8')) as { sections: { 'solar-system': { missingValues: string[] } } };
  const subjects = report.sections['solar-system'].missingValues.filter((v) => v.includes(' meanRadius:')).map((v) => v.split(' ')[0] as string);
  expect(subjects.length, 'the release has a body without a measured radius').toBeGreaterThan(0);
  await atlas.planetary(HELIOCENTRIC_SCALE);
  const scene = await atlas.scene();
  const body = scene.marks.find((m) => subjects.includes(m.id) && m.visible);
  expect(body, 'one of them is on the screen').toBeDefined();
  atlas.memo.body = body?.name;
});

When('the person selects the body', async ({ atlas }) => {
  await atlas.click(atlas.memo.body as string);
  expect(await atlas.selectionName()).toBe(atlas.memo.body);
});

Then('the mark of the body is a point', async ({ atlas }) => {
  const m = await atlas.mark(atlas.memo.body as string);
  expect(m?.shape).toBe('point');
  expect(m?.radiusMissing).toBe(true);
  expect(m?.exaggeration).toBeNull();
});

Then('the metadata shows the radius as missing', async ({ atlas }) => {
  await expect(metaValue(atlas, 'radius')).toHaveText('missing');
});
