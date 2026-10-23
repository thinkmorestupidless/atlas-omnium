// search.feature: a known name moves the focus to the entity in its own regime; a shared name offers
// each entity with its kind and changes nothing else.
import { expect } from '@playwright/test';
import { Given, Then, When } from './world';

When('the person searches {string}', async ({ atlas }, name: string) => {
  atlas.memo.focusBefore = (await atlas.state()).focus;
  await atlas.blur();
  await atlas.page.keyboard.press('/');
  await expect(atlas.page.locator('#search')).toBeFocused();
  await atlas.page.keyboard.type(name);
  await atlas.page.keyboard.press('Enter');
  await atlas.settle();
});

const regimeIs = (regime: string) => async ({ atlas }: { atlas: import('./world').Atlas }) => {
  expect((await atlas.state()).regime).toBe(regime);
};
Then('the planetary regime is in force', regimeIs('planetary'));
Then('the nearby stellar regime is in force', regimeIs('nearby-stellar'));
Then('the molecular regime is in force', regimeIs('molecular'));

Given('two entities share the name {string}', async ({ atlas }, name: string) => {
  const named = await atlas.page.evaluate((n) => (window as unknown as { __atlas: { named(x: string): { id: string; kind: string }[] } }).__atlas.named(n), name);
  expect(named).toHaveLength(2);
  expect(new Set(named.map((e) => e.kind)).size).toBe(2);
  atlas.memo.named = named;
});

Then('each entity is offered with its kind', async ({ atlas }) => {
  const named = atlas.memo.named as { id: string; kind: string }[];
  const offered = await atlas.page.locator('.search-results button').evaluateAll((bs) => bs.map((b) => ({ id: b.getAttribute('data-id'), kind: b.getAttribute('data-kind'), text: b.textContent })));
  expect(offered.map((o) => o.id).sort()).toEqual(named.map((e) => e.id).sort());
  for (const o of offered) expect(o.text).toMatch(/^Mercury · (planet|atom type)$/);
  expect((await atlas.state()).candidates?.map((c) => c.kind).sort()).toEqual(named.map((e) => e.kind).sort());
});

Then('the focus is unchanged', async ({ atlas }) => {
  expect((await atlas.state()).focus).toBe(atlas.memo.focusBefore);
});
