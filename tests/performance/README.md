The performance script against `dist/` (`npm run perf`) and the machine it is measured on. It
reports frame-time percentiles at each standard scale and through the regime transition, the
visible mark count, input-to-paint for scaling and selecting, the release's load time and heap
growth over ten minutes. Results land in `results/<date>.json`; the summary goes into
`specs/001-earth/research.md`.

## Test machine

The machine the 2026-10-23 run was measured on: an Apple M5 with 32 GB of memory, macOS 26.6.2,
Playwright 1.64's bundled Chromium, headless, at a 1280 × 800 viewport. The result file records the
exact browser version.

SC-008 is measured on the machine the usability sessions run on. That machine is not yet named. When
it is, run `npm run build && npm run perf` there and name it here.

## What is measured

- **Draw time per frame**: the `atlas:render` measure in `app/src/main.ts`, while time plays so
  every frame is drawn afresh. Percentiles at each standard scale and through the transition.
- **Input to drawn frame**: from the input event to the end of the first frame drawn after it, for
  a keyboard scale step and a click that selects. A click on a mark already selected draws nothing,
  so the count of selections measured can be under twenty.
- **Load**: from navigation to the release loaded and the first frame drawn.
- **Heap**: after a forced collection, before and after a soak of ten minutes by default
  (`-- --minutes N`), with time playing at a year a second while the view scales and the selection
  changes.
- A CDP trace of the transition is saved beside the result as `<date>-transition.trace.json`. It is
  not committed.
