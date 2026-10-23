// The performance run (research R15, SC-008): headless Chromium against the preview of dist/, through
// Playwright, with a CDP session for the heap and a CDP trace of the regime transition. It reports
// the time each frame takes to draw ('atlas:render', measured in main.ts) as percentiles at each
// standard scale and through the transition, the visible mark count, input to drawn frame for scaling
// and selecting, the release's load time and the heap's growth over a soak (ten minutes by default).
//
//   npm run build && npm run perf [-- --minutes 10]
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { arch, cpus, platform, release as osRelease, totalmem } from 'node:os';
import { chromium, type Page } from '@playwright/test';

const PORT = 4175;
const BASE = `http://localhost:${PORT}`;
const minutes = Number(process.argv[process.argv.indexOf('--minutes') + 1]) || 10;
const SCALES = { opening: null, 'Moon in view': 1.2e6, heliocentric: 2e10, 'transition midpoint': 5e12, stellar: 3e14 } as const;

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s[Math.min(s.length - 1, Math.floor(p * s.length))] as number) : NaN; };
const summary = (xs: number[]) => ({ frames: xs.length, p50: +pct(xs, 0.5).toFixed(3), p95: +pct(xs, 0.95).toFixed(3), p99: +pct(xs, 0.99).toFixed(3), max: +Math.max(...xs).toFixed(3) });

const hook = <R>(page: Page, f: string, ...args: unknown[]) => page.evaluate(([n, a]) => {
  const h = (window as unknown as { __atlas: Record<string, (...x: unknown[]) => unknown> }).__atlas;
  return h[n as string]?.(...(a as unknown[]));
}, [f, args] as const) as Promise<R>;

const frames = (page: Page, n: number) => page.evaluate((k) => new Promise<void>((resolve) => { let i = 0; const f = () => (++i >= k ? resolve() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const clear = (page: Page) => page.evaluate(() => performance.clearMeasures('atlas:render'));
const renders = (page: Page) => page.evaluate(() => performance.getEntriesByName('atlas:render').map((e) => e.duration));

const setScale = async (page: Page, scale: number) => {
  const now = (await hook<{ scale: number }>(page, 'state')).scale;
  await hook(page, 'dispatch', { kind: 'scale', factor: scale / now });
  await frames(page, 2);
};

/** Time from an input event to the end of the first frame drawn after it. */
const inputToDrawn = (page: Page, type: 'keydown' | 'pointerup') => page.evaluate((t) => new Promise<number>((resolve) => {
  let t0 = 0;
  window.addEventListener(t, () => { t0 = performance.now(); }, { capture: true, once: true });
  const obs = new PerformanceObserver((list) => {
    const e = list.getEntries().find((x) => x.name === 'atlas:render' && x.startTime >= t0 && t0 > 0);
    if (e) { obs.disconnect(); resolve(e.startTime + e.duration - t0); }
  });
  obs.observe({ type: 'measure' });
}), type);

/** A measurement that never arrives is reported as missing (NaN), never waited on for ever. */
const within = (p: Promise<number>, ms = 1000) => Promise.race([p, new Promise<number>((r) => setTimeout(() => r(NaN), ms))]);

const serve = async () => {
  const p = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(BASE)).ok) return p; } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  p.kill();
  throw new Error('the preview server did not start; run npm run build first');
};

const main = async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const date = new Date().toISOString().slice(0, 10);
  const out = 'tests/performance/results';
  await mkdir(out, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    // tsx names functions with a helper the page lacks; functions passed to evaluate need it there too.
    await page.addInitScript({ content: 'window.__name = (f) => f;' });
    await page.addInitScript(() => { try { localStorage.setItem('atlas.legend.seen', '1'); } catch { /* none */ } });
    const t0 = Date.now();
    await page.goto(`${BASE}/?test&release=001-prototype`);
    await page.waitForFunction(() => (window as unknown as { __atlas?: { ready?: boolean } }).__atlas?.ready === true);
    const loadMs = Date.now() - t0;
    const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined; return n ? { domContentLoaded: n.domContentLoadedEventEnd, load: n.loadEventEnd } : null; });

    console.error('perf: loaded');
    // Each standard scale: time plays, so every frame is drawn afresh.
    const atScales: Record<string, unknown> = {};
    for (const [name, scale] of Object.entries(SCALES)) {
      if (scale) await setScale(page, scale);
      await hook(page, 'dispatch', { kind: 'setRate', daysPerSecond: 1 });
      await hook(page, 'dispatch', { kind: 'play' });
      await frames(page, 10);
      await clear(page);
      await frames(page, 180);
      await hook(page, 'dispatch', { kind: 'pause' });
      const scene = await hook<{ marks: { visible: boolean }[]; lines: { visible: boolean }[] }>(page, 'scene');
      atScales[name] = { scale: (await hook<{ scale: number }>(page, 'state')).scale, drawMs: summary(await renders(page)), visibleMarks: scene.marks.filter((m) => m.visible).length, visibleLines: scene.lines.filter((l) => l.visible).length };
    }

    console.error('perf: standard scales done');
    // The transition: out from the inner edge of the band to its outer edge, one step a frame, traced.
    await setScale(page, 8e11);
    await clear(page);
    await browser.startTracing(page, { path: `${out}/${date}-transition.trace.json`, screenshots: false });
    const transitionFrames = await page.evaluate(() => new Promise<number>((resolve) => {
      const h = (window as unknown as { __atlas: { dispatch(a: unknown): void; state(): { scale: number } } }).__atlas;
      let n = 0;
      const step = () => { if (h.state().scale >= 4e13) { resolve(n); return; } h.dispatch({ kind: 'scale', factor: 1.02 }); n++; requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }));
    await browser.stopTracing();
    const transition = { steps: transitionFrames, drawMs: summary(await renders(page)) };

    console.error('perf: transition done');
    // Input to drawn frame: twenty keyboard scale steps, and twenty selections by click at the planetary view.
    await setScale(page, 2e9);
    const scaleInput: number[] = [];
    for (let i = 0; i < 20; i++) { const m = inputToDrawn(page, 'keydown'); await page.keyboard.press(i % 2 ? '+' : '-'); scaleInput.push(await within(m)); }
    const marks = (await hook<{ marks: { visible: boolean; at: { x: number; y: number }; id: string }[] }>(page, 'scene')).marks.filter((m) => m.visible);
    const selectInput: number[] = [];
    for (let i = 0; i < 20 && marks.length; i++) {
      const m = marks[i % marks.length] as { at: { x: number; y: number } };
      const t = inputToDrawn(page, 'pointerup');
      await page.mouse.click(m.at.x, m.at.y);
      selectInput.push(await within(t));
    }

    console.error('perf: inputs done, soaking');
    // The soak: time plays at a year a second while the view moves; the heap after collection, before and after.
    const cdp = await page.context().newCDPSession(page);
    const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize; };
    await setScale(page, 2e10);
    const before = await heap();
    await hook(page, 'dispatch', { kind: 'setRate', daysPerSecond: 365 });
    await hook(page, 'dispatch', { kind: 'play' });
    const end = Date.now() + minutes * 60_000;
    let k = 0;
    while (Date.now() < end) {
      await hook(page, 'dispatch', { kind: 'scale', factor: k % 2 ? 4 : 0.25 });
      await hook(page, 'dispatch', { kind: 'select', id: k % 3 ? 'atlas:mars' : 'atlas:earth' });
      if (k % 50 === 0) await page.evaluate(() => performance.clearMeasures('atlas:render'));
      await page.waitForTimeout(500);
      k++;
    }
    await hook(page, 'dispatch', { kind: 'pause' });
    const after = await heap();

    const result = {
      date,
      machine: { cpu: cpus()[0]?.model, cores: cpus().length, memoryGB: Math.round(totalmem() / 2 ** 30), os: `${platform()} ${osRelease()} ${arch()}`, browser: `Chromium ${browser.version()} headless` },
      viewport: { width: 1280, height: 800 },
      loadMs, navigation: nav,
      atScales, transition,
      inputToDrawnMs: { scale: summary(scaleInput.filter(Number.isFinite)), select: summary(selectInput.filter(Number.isFinite)) },
      heap: { minutes, beforeMB: +(before / 2 ** 20).toFixed(2), afterMB: +(after / 2 ** 20).toFixed(2), growthMB: +((after - before) / 2 ** 20).toFixed(2) },
    };
    await writeFile(`${out}/${date}.json`, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    server.kill();
  }
};

await main();
