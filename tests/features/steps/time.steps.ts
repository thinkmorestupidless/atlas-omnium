// features/time/time.feature
import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { bodyPositions, epochOf } from '../../../app/src/model/positions';
import { parseManifest } from '../../../app/src/model/release';
import { EphemerisFileSchema, PrecisionFileSchema, type EphemerisFile } from '../../../app/src/model/schema';
import { epochToIsoUtc } from '../../../app/src/model/time';
import { Given, Then, When, type Atlas } from './world';

const DIR = 'data/curated/001-prototype';
const manifest = () => parseManifest(readFileSync('data/manifests/001-prototype.yaml', 'utf8'));
const SLUGS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon', 'ceres', 'pluto', 'halley'];
let files: Map<string, EphemerisFile> | null = null;
const ephemerides = () => {
  files ??= new Map(SLUGS.map((s) => { const f = EphemerisFileSchema.parse(JSON.parse(readFileSync(`${DIR}/ephemeris/${s}.json`, 'utf8'))); return [f.subject, f]; }));
  return files;
};
const precision = () => new Map(PrecisionFileSchema.parse(JSON.parse(readFileSync(`${DIR}/precision.json`, 'utf8'))).map((p) => [p.subject, p]));

const setDate = async (atlas: Atlas, date: string) => {
  await atlas.blur();
  await atlas.page.keyboard.press('d');
  await atlas.page.keyboard.press('ControlOrMeta+a');
  await atlas.page.keyboard.type(date);
  await atlas.page.keyboard.press('Enter');
  await atlas.blur();
  await atlas.settle();
};

const dateIs = async (atlas: Atlas, date: string) => {
  expect((await atlas.state()).utc.slice(0, 10)).toBe(date);
  await expect(atlas.page.locator('.time-epoch')).toHaveAttribute('data-civil', date);
};

When('the person opens the time controller', async ({ atlas }) => {
  await atlas.blur();
  await atlas.page.keyboard.press('d');
  await expect(atlas.page.locator('#date')).toBeFocused();
});

Then('the supported window is shown with its first date and its last date', async ({ atlas }) => {
  const w = manifest().window;
  const shown = atlas.page.locator('.time-controller [data-field="window"]');
  await expect(shown).toBeVisible();
  await expect(shown).toContainText(w.from);
  await expect(shown).toContainText(w.to);
});

Given('the date is {string}', async ({ atlas }, date: string) => {
  await setDate(atlas, date);
  await dateIs(atlas, date);
});

Given('the date is {string} and the supported window ends at {string}', async ({ atlas }, date: string, end: string) => {
  expect(manifest().window.to, 'the release\'s supported window ends where the scenario says').toBe(end);
  await setDate(atlas, date);
  await dateIs(atlas, date);
});

Given('the date is {string} and the rate is {string}', async ({ atlas }, date: string, rate: string) => {
  await setDate(atlas, date);
  await dateIs(atlas, date);
  for (let i = 0; i < 8 && (await atlas.page.locator('.time-rate').textContent()) !== rate; i++) {
    const d = (await atlas.state()).rate.daysPerSecond;
    await atlas.press(d > 1 ? '[' : ']');
  }
  await expect(atlas.page.locator('.time-rate')).toHaveText(rate);
});

const SECONDS: Record<string, number> = { 'ten seconds': 10, 'one second': 1 };

When('the person plays for {string} and pauses', async ({ atlas }, span: string) => {
  const ms = (SECONDS[span] ?? Number.NaN) * 1000;
  expect(ms).toBeGreaterThan(0);
  // The page's clock is paused so that exactly this much time passes between play and pause.
  await atlas.page.clock.pauseAt(new Date(Date.parse(await atlas.page.evaluate(() => new Date().toISOString())) + 1000));
  await atlas.page.keyboard.press('t');
  expect((await atlas.state()).playing).toBe(true);
  await atlas.page.clock.runFor(ms);
  await atlas.page.keyboard.press('t');
  expect((await atlas.state()).playing).toBe(false);
  await atlas.page.clock.resume();
  await atlas.settle();
});

Then('the date is {string}', async ({ atlas }, date: string) => {
  await dateIs(atlas, date);
});

Then('the date does not change while paused', async ({ atlas }) => {
  const before = (await atlas.state()).utc;
  await atlas.page.clock.runFor(3000);
  await atlas.settle();
  expect((await atlas.state()).utc).toBe(before);
});

Then('every supported body is at its derived state for the epoch of {string}', async ({ atlas }, date: string) => {
  await dateIs(atlas, date);
  const want = bodyPositions({ ephemerides: ephemerides(), precision: precision() }, epochOf(`${date}T00:00:00.000Z`));
  const shown = await atlas.positions();
  expect(shown.length).toBe(want.size);
  for (const p of shown) {
    const w = want.get(p.id as never);
    expect(w, p.id).toBeDefined();
    expect(p.jd).toBe(w?.value.epoch.jd);
    expect(p.scale).toBe('TDB');
    for (let k = 0; k < 3; k++) expect(p.r[k], `${p.id} axis ${k}`).toBeCloseTo(w?.value.r[k] ?? NaN, 6);
  }
});

Then('the change is refused with the supported window', async ({ atlas }) => {
  const w = manifest().window;
  const refusal = atlas.page.locator('.time-refusal');
  await expect(refusal).toBeVisible();
  await expect(refusal).toContainText(w.from);
  await expect(refusal).toContainText(w.to);
  expect((await atlas.state()).refusal).not.toBeNull();
});

Then('the epoch of the displayed positions is visible as {string} in its time scale', async ({ atlas }, date: string) => {
  const epoch = atlas.page.locator('.time-epoch');
  await expect(epoch).toBeVisible();
  await expect(epoch).toContainText(date);
  await expect(epoch).toContainText('TDB');
  expect((await atlas.positions()).every((p) => p.scale === 'TDB' && p.jd === epochOf(`${date}T00:00:00.000Z`).jd)).toBe(true);
});

Given('a held-out epoch of the reference ephemeris', async ({ atlas }) => {
  const held = JSON.parse(readFileSync('tests/fixtures/horizons-held-out.json', 'utf8')) as { subject: string; rows: [number, number, number, number][] }[];
  const shared = (held[0]?.rows ?? []).map((r) => r[0]).filter((jd) => held.every((h) => h.rows.some((r) => r[0] === jd)));
  expect(shared.length, 'an epoch held out for every body').toBeGreaterThan(0);
  const jd = shared[0] as number;
  for (const f of ephemerides().values()) expect(f.rows.some((r) => r[0] === jd), 'the epoch is not in the release').toBe(false);
  atlas.memo.heldOut = { jd, held };
});

When('the person changes the date to that epoch', async ({ atlas }) => {
  const { jd } = atlas.memo.heldOut as { jd: number };
  await setDate(atlas, epochToIsoUtc({ scale: 'TDB', jd }));
});

Then('the derived state of every supported body is within the stated precision of the reference ephemeris', async ({ atlas }) => {
  const { jd, held } = atlas.memo.heldOut as { jd: number; held: { subject: string; rows: [number, number, number, number][] }[] };
  const shown = new Map((await atlas.positions()).map((p) => [p.id, p]));
  const stated = new Map((await atlas.precision()).map((p) => [p.subject, p.maxError.value]));
  const earth = shown.get('atlas:earth');
  for (const h of held) {
    const ref = h.rows.find((r) => r[0] === jd) as [number, number, number, number];
    const p = shown.get(h.subject);
    expect(p, h.subject).toBeDefined();
    expect(Math.abs((p?.jd ?? 0) - jd) * 86400, `${h.subject}: the displayed epoch is the held-out one`).toBeLessThan(0.001);
    // The Moon's reference is geocentric, as its samples are; the displayed position is heliocentric.
    const r = h.subject === 'atlas:moon' ? (p?.r ?? [0, 0, 0]).map((v, k) => v - (earth?.r[k] ?? 0)) : (p?.r ?? []);
    const err = Math.hypot((r[0] ?? 0) - ref[1], (r[1] ?? 0) - ref[2], (r[2] ?? 0) - ref[3]);
    const tol = (stated.get(h.subject) ?? 0) * 1.0051 + 0.05;
    expect(err, `${h.subject}: ${err.toFixed(3)} km against a stated ${stated.get(h.subject)} km`).toBeLessThanOrEqual(tol);
  }
});
