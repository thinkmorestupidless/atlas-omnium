// Steps of features/evidence/inspector.feature: every displayed value opens to where it came from.
import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { parse } from 'yaml';
import { Then, When } from './world';

const RELEASE = '001-prototype';
const attribution = () => JSON.parse(readFileSync(`data/curated/${RELEASE}/attribution.json`, 'utf8')) as { source: string; attribution: string }[];
const inspector = (atlas: { page: import('@playwright/test').Page }) => atlas.page.locator('#inspector');

When('the person inspects the distance from {string}', async ({ atlas }, from: string) => {
  await expect(atlas.page.locator('.metadata [data-field="distance"] dt')).toHaveText(`distance from the ${from}`);
  await atlas.inspectField('distance');
});

Then('the inspector shows the source record, the dataset release and the epoch of the observation', async ({ atlas }) => {
  const insp = inspector(atlas);
  await expect(insp.locator('[data-field="source-record"] dd').first()).not.toBeEmpty();
  await expect(insp.locator('[data-field="dataset-release"]').first()).not.toBeEmpty();
  await expect(insp.locator('[data-field="epoch"] dd').first()).toHaveText(/JD [\d.,]+ (TDB|TT|TCB|UTC)$/);
});

Then('the attribution of the source is shown beside the dataset release', async ({ atlas }) => {
  const line = inspector(atlas).locator('[data-field="source-release"]').first();
  const dataset = (await inspector(atlas).locator('[data-field="source-dataset"] dd').first().textContent()) ?? '';
  const want = attribution().find((a) => a.source === dataset);
  expect(want, `${dataset} has an attribution in the release`).toBeDefined();
  await expect(line.locator('[data-field="attribution"]')).toHaveText(want?.attribution ?? '');
});

When('the person inspects the position', async ({ atlas }) => {
  await atlas.inspectField('position');
});

Then('the inspector shows the reference frame and the epoch in its time scale', async ({ atlas }) => {
  await expect(inspector(atlas).locator('[data-field="frame"] dd').first()).toHaveText('heliocentric ecliptic of J2000 (ICRF)');
  await expect(inspector(atlas).locator('[data-field="epoch"] dd').first()).toHaveText(/ UTC · JD [\d.,]+ TDB$/);
});

When('the person inspects the radius of the body', async ({ atlas }) => {
  await atlas.click(atlas.memo.body as string);
  expect(await atlas.selectionName()).toBe(atlas.memo.body);
  await atlas.inspectField('radius');
});

Then('the inspector shows the radius as missing', async ({ atlas }) => {
  await expect(inspector(atlas).locator('[data-field="value"] dt').first()).toHaveText('mean radius');
  await expect(inspector(atlas).locator('[data-field="value"] dd').first()).toHaveText('missing');
});

Then('no value is shown in its place', async ({ atlas }) => {
  await expect(inspector(atlas).locator('[data-field="value"] dd').first()).not.toHaveText(/\d/);
  await expect(inspector(atlas).locator('[data-field="uncertainty"]')).toHaveCount(0);
});

Then('the inspector shows the uncertainty with the value and its unit', async ({ atlas }) => {
  await expect(inspector(atlas).locator('[data-field="value"] dd').first()).toHaveText(/^[\d.,]+ pc$/);
  await expect(inspector(atlas).locator('[data-field="uncertainty"] dd').first()).toHaveText(/^[\d.,]+ to [\d.,]+ pc$/);
});

When('the person inspects the relationship {string} to {string}', async ({ atlas }, predicate: string, target: string) => {
  await atlas.inspectField('relation', `${predicate} ${target}`);
});

Then('the inspector shows the assertion status by a mark distinct from the selection mark', async ({ atlas }) => {
  const mark = inspector(atlas).locator('[data-field="status"] .status-mark').first();
  const status = (await mark.getAttribute('data-status')) ?? '';
  const shape = (await mark.getAttribute('data-shape')) ?? '';
  const shapes = await atlas.markShapes();
  expect(shape).toBe(shapes[status]);
  expect(shape).not.toBe(shapes.selection);
  expect(shape).not.toBe(shapes.focus);
});

Then('the assertion status is not conveyed by colour alone', async ({ atlas }) => {
  const mark = inspector(atlas).locator('[data-field="status"] .status-mark').first();
  const status = (await mark.getAttribute('data-status')) ?? '';
  await expect(mark).toContainText(status);
  await expect(mark.locator('svg')).toHaveCount(1);
});

When('the person inspects every visible mark', async ({ atlas }) => {
  await atlas.settle();
  const marks = await atlas.marks();
  expect(marks.length).toBeGreaterThan(0);
  const seen: { id: string; shownId: string; record: string; label: string | null; hasSourceRecord: boolean }[] = [];
  for (const m of marks) {
    await atlas.dispatch({ kind: 'inspect', target: { kind: 'entity', subject: m.id } });
    await atlas.settle();
    seen.push({
      id: m.id, label: m.label, hasSourceRecord: m.hasSourceRecord,
      shownId: (await inspector(atlas).locator('[data-field="atlas-id"] dd').textContent()) ?? '',
      record: (await inspector(atlas).locator('[data-field="source-record"] dd').first().textContent()) ?? '',
    });
  }
  atlas.memo.inspected = seen;
});

Then('each mark resolves to an entity with an atlas id', async ({ atlas }) => {
  for (const m of atlas.memo.inspected as { id: string; shownId: string }[]) {
    expect(m.id).toMatch(/^atlas:[a-z0-9-]+$/);
    expect(m.shownId).toBe(m.id);
  }
});

Then('each entity has a source record or is labelled illustrative', async ({ atlas }) => {
  for (const m of atlas.memo.inspected as { id: string; record: string; label: string | null; hasSourceRecord: boolean }[]) {
    if (m.hasSourceRecord) expect(m.record, `${m.id} has a source record`).not.toBe('');
    else expect(m.label ?? '', `${m.id} is labelled illustrative`).toContain('illustrative');
  }
});

When('the person opens the inspector', async ({ atlas }) => {
  await atlas.blur();
  await atlas.press('i');
  await expect(inspector(atlas)).toBeVisible();
});

Then('the inspector shows the release {string}', async ({ atlas }, release: string) => {
  await expect(inspector(atlas).locator('[data-field="release"]')).toContainText(`release ${release}`);
});

When('the person opens the inspector on the release {string}', async ({ atlas }, release: string) => {
  await atlas.blur();
  await atlas.press('i');
  await expect(inspector(atlas).locator('[data-field="release"]')).toContainText(`release ${release}`);
  await inspector(atlas).locator('button[data-inspect="release"]').click();
  await atlas.settle();
});

Then('every source of the release is listed with its licence and its attribution', async ({ atlas }) => {
  const manifest = parse(readFileSync(`data/manifests/${RELEASE}.yaml`, 'utf8')) as { sources: { name: string; licence: string | null; attribution: string | null }[] };
  const listed = inspector(atlas).locator('[data-source]');
  await expect(listed).toHaveCount(manifest.sources.length);
  for (const s of manifest.sources) {
    const block = inspector(atlas).locator(`[data-source="${s.name}"]`);
    expect(s.licence, `${s.name} has a licence in the manifest`).not.toBeNull();
    await expect(block.locator('[data-field="licence"] dd')).toHaveText(s.licence ?? '');
    await expect(block.locator('[data-field="attribution"] dd')).toHaveText(s.attribution ?? '');
  }
});
