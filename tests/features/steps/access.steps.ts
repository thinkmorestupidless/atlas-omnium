// access.feature: every pointer action has a keyboard twin with the same outcome; reduced motion
// makes the transition a cut and the cue still; no status is told by colour alone.
import { expect, type Page } from '@playwright/test';
import { Atlas, Given, Then, When, type StateView } from './world';

/** What an action's outcome is, compared between the keyboard and the pointer. */
const outcome = async (a: Atlas) => {
  const s = await a.state();
  const inspector = a.page.locator('#inspector');
  return {
    focus: s.focus, selection: s.selection, mode: s.mode, regime: s.regime, utc: s.utc,
    // The wheel's factor is the key's to the ninth digit; six significant figures is the same view.
    scale: Number(s.scale.toPrecision(6)), pan: { x: Math.round(s.pan.x / s.scale), y: Math.round(s.pan.y / s.scale) },
    breadcrumb: s.breadcrumb.map((c) => c.id).join(' / '),
    inspector: (await inspector.isVisible()) ? await inspector.locator('h2').textContent() : null,
  };
};

const twin = async (atlas: Atlas): Promise<Atlas> => {
  const page: Page = await atlas.page.context().newPage();
  const own = new URL(atlas.page.url()).host;
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).host === own) return route.continue();
    atlas.external.push(route.request().url());
    return route.abort();
  });
  const other = new Atlas(page);
  await other.open(new URL(atlas.page.url()).searchParams.get('release') ?? '001-prototype');
  return other;
};

const centre = async (a: Atlas) => {
  const box = await a.page.locator('#scene').boundingBox();
  return { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 };
};

When('the person scales, pans, selects, focuses, goes back, changes the date and inspects by keyboard', async ({ atlas }) => {
  const pointer = await twin(atlas);
  const k = atlas;
  const differences: string[] = [];
  const same = async (action: string) => {
    await k.settle(); await pointer.settle();
    const a = await outcome(k);
    const b = await outcome(pointer);
    if (JSON.stringify(a) !== JSON.stringify(b)) differences.push(`${action}: keyboard ${JSON.stringify(a)}, pointer ${JSON.stringify(b)}`);
  };
  await k.blur();

  // Scale: out by one keyboard step, and by the wheel about the focus by the same factor.
  await k.press('-');
  const c = await centre(pointer);
  await pointer.page.mouse.move(c.x, c.y);
  await pointer.page.mouse.wheel(0, Math.log(2) / 0.0015);
  await same('scale');
  // Out to the planetary view on both, the same way, so marks are there to select.
  for (const a of [k, pointer]) await a.planetary();
  await same('scale to the planetary view');

  // Select: arrows move through the visible marks in reading order until one stands apart from the
  // rest, so a pointer can pick it too; then the same mark by click.
  const apart = async () => {
    const sc = await k.scene();
    const m = sc.marks.find((x) => x.id === (sc.marks.find((y) => y.selected)?.id));
    return Boolean(m && sc.marks.filter((o) => o.visible && o.id !== m.id).every((o) => Math.hypot(o.at.x - m.at.x, o.at.y - m.at.y) > 24));
  };
  for (let i = 0; i < 20; i++) { await k.press('ArrowRight'); if (await apart()) break; }
  const picked = (await k.state()).selection;
  expect(picked, 'an arrow selects a visible mark').not.toBeNull();
  await pointer.click((await pointer.nameOf(picked as string)) as string);
  await same('select');

  // Focus: Enter on the selection, and a double click on it.
  await k.press('Enter');
  await pointer.click((await pointer.nameOf(picked as string)) as string, { double: true });
  await same('focus');

  // Back: Backspace, and the breadcrumb's previous stop.
  await k.press('Backspace');
  await pointer.page.locator('.breadcrumb button').first().click();
  await pointer.settle();
  await same('go back');

  // Pan: Alt+→, and a drag of the same distance.
  await k.page.keyboard.press('Alt+ArrowRight');
  const from = await centre(pointer);
  await pointer.page.mouse.move(from.x, from.y);
  await pointer.page.mouse.down();
  await pointer.page.mouse.move(from.x - 40, from.y, { steps: 4 });
  await pointer.page.mouse.move(from.x - 80, from.y, { steps: 4 });
  await pointer.page.mouse.up();
  await same('pan');

  // The date: d, type, Enter; and the field, type, the go button.
  await k.page.keyboard.press('d');
  await k.page.keyboard.press('ControlOrMeta+a');
  await k.page.keyboard.type('2030-03-20');
  await k.page.keyboard.press('Enter');
  await k.blur();
  await pointer.page.locator('#date').click();
  await pointer.page.locator('#date').fill('2030-03-20');
  await pointer.page.locator('.time-date button[type=submit]').click();
  await pointer.blur();
  await same('change the date');

  // Inspect: i on the selection, and the selection's name in the metadata.
  await k.press('i');
  await pointer.page.locator('.metadata [data-field="name"] button.meta-value').click();
  await same('inspect');

  atlas.memo.differences = differences;
  await pointer.page.close();
});

Then('each action has the same outcome as by pointer', async ({ atlas }) => {
  expect(atlas.memo.differences).toEqual([]);
});

Given('the device asks for reduced motion', async ({ atlas }) => {
  await atlas.page.emulateMedia({ reducedMotion: 'reduce' });
  await atlas.settle();
  expect(await atlas.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
});

/** Every fade observed while scaling across the band, frame by frame, and the cue at the crossing. */
const crossTheBand = async (atlas: Atlas, direction: '+' | '-', done: (s: StateView) => boolean) => {
  const seen: number[] = [];
  let cue: { text: string; opacity: string; transforms: string[] } | null = null;
  await atlas.blur();
  for (let i = 0; i < 80 && !done(await atlas.state()); i++) {
    const before = (await atlas.state()).regime;
    await atlas.page.keyboard.press(direction);
    for (let f = 0; f < 3; f++) {
      await atlas.settle();
      const sc = await atlas.scene();
      seen.push(...Object.entries(sc.fades).filter(([k]) => k !== 'trackWidth').map(([, v]) => v));
    }
    const after = (await atlas.state()).regime;
    if (!cue && after !== before) {
      const t = atlas.page.locator('.chapter-cue-text');
      const transforms: string[] = [];
      for (let f = 0; f < 4; f++) { transforms.push(await t.evaluate((e) => getComputedStyle(e).transform)); await atlas.settle(); }
      cue = { text: (await t.textContent()) ?? '', opacity: await atlas.page.locator('.chapter-cue').evaluate((e) => ((e as HTMLElement).hidden ? '0' : getComputedStyle(e).opacity)), transforms };
    }
  }
  return { seen, cue };
};

Then('the transition is a cut', async ({ atlas }) => {
  // Back in to the Solar System and out again, watching every frame.
  const inward = await crossTheBand(atlas, '+', (s) => s.regime === 'planetary' && s.scale < 1e12);
  const outward = await crossTheBand(atlas, '-', (s) => s.regime === 'nearby-stellar' && s.scale > 3e13);
  const between = [...inward.seen, ...outward.seen].filter((v) => v > 0 && v < 1);
  expect(between, 'no fade value between none and full').toEqual([]);
  atlas.memo.cue = outward.cue;
});

Then('the chapter cue is shown without movement', async ({ atlas }) => {
  const cue = atlas.memo.cue as { text: string; opacity: string; transforms: string[] } | null;
  expect(cue, 'the cue is shown as the regime changes').not.toBeNull();
  expect(cue?.text).toBe('nearby stars');
  expect(cue?.opacity).toBe('1');
  expect(new Set(cue?.transforms).size, 'the cue does not move between frames').toBe(1);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(cue?.transforms[0]);
});

When('the person inspects every status mark and every legend entry', async ({ atlas }) => {
  await atlas.blur();
  await atlas.press('l');
  const legend = atlas.page.locator('#legend');
  await expect(legend).toBeVisible();
  atlas.memo.legend = await legend.locator('li').evaluateAll((lis) => lis.map((li) => ({
    field: li.getAttribute('data-field'), glyph: Boolean(li.querySelector('svg')), words: (li.textContent ?? '').trim(),
  })));
  await atlas.press('l');
  atlas.memo.statusMarks = await atlas.page.locator('.status-mark').evaluateAll((els) => els.map((e) => ({
    status: e.getAttribute('data-status'), shape: e.getAttribute('data-shape'), words: (e.textContent ?? '').trim(),
  })));
  atlas.memo.shapes = await atlas.markShapes();
});

Then('each status is conveyed by a shape or a label as well as a colour', async ({ atlas }) => {
  const legend = atlas.memo.legend as { field: string; glyph: boolean; words: string }[];
  expect(legend.length).toBeGreaterThan(10);
  for (const e of legend) {
    expect(e.glyph, `${e.field} has a glyph`).toBe(true);
    expect(e.words.length, `${e.field} has words`).toBeGreaterThan(0);
  }
  for (const s of ['observed', 'derived', 'inferred', 'illustrative']) expect(legend.find((e) => e.field === `status-${s}`)?.words).toBe(s);
  const marks = atlas.memo.statusMarks as { status: string; shape: string; words: string }[];
  expect(marks.length, 'the metadata shows status marks').toBeGreaterThan(0);
  for (const m of marks) { expect(m.shape).toBeTruthy(); expect(m.words).toBe(m.status); }
  const shapes = atlas.memo.shapes as Record<string, string>;
  expect(new Set(Object.values(shapes)).size, 'every status, the selection and the focus have their own shape').toBe(Object.keys(shapes).length);
});
