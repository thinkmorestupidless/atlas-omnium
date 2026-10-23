The performance script against `dist/` (`npm run perf`) and the machine it is measured on. It
reports frame-time percentiles at each standard scale and through the regime transition, the
visible mark count, input-to-paint for scaling and selecting, the release's load time and heap
growth over ten minutes. Results land in `results/<date>.json`; the summary goes into
`specs/001-earth/research.md`.

## Test machine

Not yet named. SC-008 is measured on the machine the usability sessions run on; write its model,
processor, memory, operating system, browser and version here before the first measured run.
