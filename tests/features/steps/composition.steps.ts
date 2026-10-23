// composition.feature: the structural step is chosen, announced and undone; water is a
// representative substance; the molecule shows its atom types and counts in its own frame.
import { expect } from '@playwright/test';
import { Given, Then, When, type Atlas } from './world';

const chooseMadeOf = async (atlas: Atlas) => {
  await atlas.blur();
  await atlas.press('m');
};

const structural = async (atlas: Atlas) => {
  await chooseMadeOf(atlas);
  expect((await atlas.state()).mode).toBe('structural');
};

const focusMark = async (atlas: Atlas, name: string) => {
  await atlas.click(name);
  await atlas.blur();
  await atlas.press('Enter');
  expect(await atlas.focusName()).toBe(name);
};

/** The molecule type a substance is composed of, as the substance view shows it. */
const focusMoleculeOf = async (atlas: Atlas, substance: string) => {
  if ((await atlas.focusName()) !== substance) await focusMark(atlas, substance);
  const m = (await atlas.scene()).marks.find((x) => x.kind === 'MoleculeType' && x.visible);
  expect(m, `the molecule type of ${substance} is shown`).toBeDefined();
  await focusMark(atlas, (m as { name: string }).name);
};

When('the person chooses what the focus is made of', async ({ atlas }) => { await chooseMadeOf(atlas); });

Given('structural navigation is in force from {string}', async ({ atlas }, name: string) => {
  expect(await atlas.focusName()).toBe(name);
  await structural(atlas);
});

Given('structural navigation is in force and the focus is {string}', async ({ atlas }, name: string) => {
  await structural(atlas);
  await focusMark(atlas, name);
});

Given('structural navigation is in force and the focus is the molecule type of {string}', async ({ atlas }, substance: string) => {
  await structural(atlas);
  await focusMoleculeOf(atlas, substance);
});

When('the person focuses the molecule type of {string}', async ({ atlas }, substance: string) => {
  await focusMoleculeOf(atlas, substance);
});

When('the person inspects the position of an atom', async ({ atlas }) => {
  await atlas.blur();
  await atlas.press('i');
  await atlas.page.locator('#inspector button.insp-link', { hasText: /^atom \d+/ }).first().click();
  await atlas.settle();
});

When('the person scales in past the minimum scale of {string}', async ({ atlas }, name: string) => {
  expect(await atlas.focusName()).toBe(name);
  await atlas.scaleInUntil((s) => s.offer === 'made-of');
  atlas.memo.minimum = (await atlas.state()).scale;
  await atlas.press('+', 3);
  atlas.memo.radiusKm = await atlas.radiusKm((await atlas.state()).focus);
});

Then('structural navigation is in force', async ({ atlas }) => {
  const s = await atlas.state();
  expect(s.mode).toBe('structural');
  expect(s.regime).toBe('molecular');
});

Then('spatial navigation is in force', async ({ atlas }) => {
  expect((await atlas.state()).mode).toBe('spatial');
});

Then('the mode change is announced', async ({ atlas }) => {
  const s = await atlas.state();
  const words = s.mode === 'structural' ? /^a different kind of step: what .+ is made of$/ : /^back to where .+ is$/;
  await expect(atlas.page.locator('#announcer')).toHaveText(words);
  await expect(atlas.page.locator('.mode-notice')).toBeVisible();
  await expect(atlas.page.locator('.mode-notice')).toHaveText(words);
});

Then('{string} is labelled a representative substance of {string}', async ({ atlas }, substance: string, body: string) => {
  const m = await atlas.mark(substance);
  expect(m?.visible).toBe(true);
  expect(m?.label).toContain(`representative substance of ${body}`);
});

Then('the relationship from {string} to {string} has the assertion status {string}', async ({ atlas }, from: string, to: string, status: string) => {
  expect(await atlas.selectionName()).toBe(to);
  await atlas.inspectField('relation', `representative substance of ${from}`);
  await expect(atlas.page.locator('#inspector [data-field="status"] [data-status]')).toHaveAttribute('data-status', status);
});

Then('the atom types {string} and {string} are visible with the counts {string} and {string}', async ({ atlas }, a: string, b: string, na: string, nb: string) => {
  await atlas.settle();
  const scene = await atlas.scene() as unknown as { parts: { name: string; count: number }[]; marks: { name: string; visible: boolean; shape: string }[] };
  const count = (n: string) => scene.parts.find((p) => p.name.toLowerCase() === n.toLowerCase())?.count;
  expect(count(a)).toBe(Number(na));
  expect(count(b)).toBe(Number(nb));
  const atoms = (n: string) => scene.marks.filter((m) => m.visible && m.shape === 'atom' && m.name.toLowerCase() === n.toLowerCase()).length;
  expect(atoms(a)).toBe(Number(na));
  expect(atoms(b)).toBe(Number(nb));
});

Then('each atom type has a source record', async ({ atlas }) => {
  const scene = await atlas.scene() as unknown as { parts: { hasSourceRecord: boolean }[] };
  expect(scene.parts.length).toBeGreaterThan(0);
  expect(scene.parts.every((p) => p.hasSourceRecord)).toBe(true);
});

Then('the reference frame is the molecular frame of the source record', async ({ atlas }) => {
  await expect(atlas.page.locator('#inspector [data-field="frame"]')).toContainText('the molecular frame of pubchem');
  await expect(atlas.page.locator('#inspector [data-field="source-record"]')).toContainText('3D conformer');
});

Then('no orbit track is visible', async ({ atlas }) => {
  const scene = await atlas.scene();
  expect(scene.lines.filter((l) => l.visible && l.id.startsWith('track:'))).toEqual([]);
});

Then('the scale stays at the minimum scale', async ({ atlas }) => {
  const s = await atlas.state();
  const vp = atlas.page.viewportSize() ?? { width: 1280, height: 800 };
  const radius = atlas.memo.radiusKm as number;
  expect(s.scale).toBe(atlas.memo.minimum);
  expect(s.scale / ((2 * radius * 1000) / (0.9 * Math.min(vp.width, vp.height)))).toBeCloseTo(1, 6);
});

Then('the atlas offers what the focus is made of', async ({ atlas }) => {
  const offer = atlas.page.locator('.made-of');
  await expect(offer).toBeVisible();
  await expect(offer).toBeEnabled();
  await expect(offer).toHaveText(`what is ${await atlas.focusName()} made of?`);
});

Given('spatial navigation is in force', async ({ atlas }) => {
  expect((await atlas.state()).mode).toBe('spatial');
});
