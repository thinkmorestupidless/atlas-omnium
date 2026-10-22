# 0004: Solar System positions are interpolated from sampled Horizons vectors; orbit tracks are drawn from Keplerian elements

*2026-10-22.* Proposed; the plan for 001 confirms the step, the window and the tolerance.

## Decision
Date-driven positions come from JPL Horizons state vectors (position and velocity) sampled at a
fixed step across the supported window, interpolated with the velocity (Hermite). Orbit tracks
are drawn from JPL's approximate Keplerian elements and labelled as a model with a validity range.
Frame: heliocentric ecliptic J2000 on ICRF, time in TDB; the Moon is also held geocentric.

## Why
A position the user reads must trace to an ephemeris release and agree with Horizons within a
stated tolerance; interpolating Horizons' own vectors does that directly, and the held-out epochs
give the tests their reference. Keplerian elements alone are a model accurate to arcminutes and
would make every position `derived` from an approximation. Computing a track from the sampled
vectors would need a full orbit of samples for the outer planets (Neptune: 165 years) and would
still be a curve through derived points; the elements give a clean ellipse honestly labelled.

## Alternatives
Ship SPICE kernels and a JavaScript SPICE reader: the most faithful, and heavy for 001. An
in-browser N-body integration: explicitly declined by the brief. Keplerian elements for both
positions and tracks: smallest data, lowest fidelity; the brief's "agree with frozen reference
ephemerides within stated precision" would then be a statement about the elements, not the atlas.

## Consequences
The supported time window is what the manifest's query covered; the time controller shows it and
refuses to leave it. A ten-day step over 2000 to 2050 is under two thousand rows per body. The
interpolation error is measured against held-out epochs and is the tolerance the acceptance
criterion states.
