# 0002: Canvas 2D first, behind a renderer interface; WebGL when a measurement says so

*2026-10-22.* Accepted.

## Decision
Renderers draw through one `Renderer` interface. The first backend is Canvas 2D. A WebGL (or
WebGPU) backend is added when the performance tier in `docs/evaluation.md` shows the 95th
percentile frame time over 16 ms at a mark count the next regime needs.

## Why
001 draws under a hundred discs and tracks and a few hundred points. Canvas 2D does that at frame
rate everywhere, including devices without a strong GPU, which the brief asks for. A GPU renderer
brings a shader toolchain, text rendering problems and a larger bundle before anything needs them.
The brief says "GPU-backed where performance requires it"; the interface keeps that door open and
the measurement decides when to walk through it.

## Alternatives
PixiJS or regl from the start: less rewriting later, more to learn now, and text and hairlines
are harder to make crisp. Deferred, not rejected.

## Consequences
Nothing in `model/` or `navigation/` may import a backend. Renderers take projected, evaluated
state and a resolved style; they do no data processing. The visual tier's screenshots are taken
against the Canvas 2D backend until the switch.
