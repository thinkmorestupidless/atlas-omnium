- `fixtures/`: frozen reference values (Horizons state vectors at held-out epochs, a tiny star
  sample, water's record) the suites compare against.
- `scientific/`: unit conversions, frame rejection, ephemeris evaluation against the fixtures
  within stated precision, no silent defaults.
- `navigation/`: state transitions, history, regime resolution, identity across regimes.
- `visual/`: screenshots at standard scales (Playwright, added when the first screen exists).
