# 0006: The browser is the first surface; a surface is projections, renderers, UI and input, and nothing below them

*2026-10-23.* Accepted.

## Decision
The atlas is built as a surface-independent core and one surface. The core is the model (entities,
observations, derived states, relationships, evidence), the releases and their curated data, and
the navigation state (focus, selection, breadcrumb, scale, date, mode). A surface is everything
that turns that into something a person sees and operates: the projections, the renderers, the UI
controls and the input bindings. The first surface is the browser page: the single projection
plane of `docs/rendering.md`, Canvas 2D behind the renderer interface (decision 0002), HTML
controls, pointer and keyboard. Nothing in `model/`, `navigation/` or `data/` may name a camera, a
plane, a pixel, a headset or a controller.

Two later surfaces are foreseen and not built: a virtual reality surface, through WebXR first so
it stays in TypeScript and in the browser's runtime, and a console surface. Neither is in 001 or
on the roadmap with a date. The one step towards the console taken early is gamepad input, bound
in the browser surface beside pointer and keyboard, because it costs nothing and tests the
ten-foot reading of the page without a devkit.

## Why
The brief names the browser as the first delivery and excludes VR from the first proof; 001 proves
navigation coherence and data fidelity, and neither depends on the surface. But the question was
raised on 2026-10-23 and the answer is worth fixing now: the parts of the design that are
surface-specific must be known before the plan is written, so the plan does not let a 2D choice
leak into the core. The flattening of the stellar neighbourhood into the ecliptic plane and the
declaration on the scale rail (FR-010) are the browser surface's obligations, not the model's: a
3D surface would not flatten and would not declare. The rule that a structural step is never a
continuation of spatial zoom, and the honouring of reduced motion, are the core's and bind every
surface; in a headset they become the comfort model.

## Alternatives
Build 001 for VR: the evidence story, which is reading source records, releases and epochs, is the
weakest part of the medium, and the editorial flat visual grammar would need redesigning before
the first screen; the proof would be of a surface, not of the data. Build for a console first:
closed SDKs, certification and a game engine, sitting badly with open, reproducible releases, and
a web view on a console is poor or absent. Leave the boundary unstated: the plan would then
reasonably put the ecliptic-plane projection in the navigation layer, and a second surface would
have to unpick it.

## Consequences
The plan for 001 places projections under the surface (`app/src/projections/` is surface code,
not model code) and the navigation state carries no projection. `features/navigation/access.feature`
gains gamepad beside pointer and keyboard, in 001 if the plan finds it cheap and in the next
feature otherwise. A VR surface, when wanted, is a feature of its own that begins with the 3D
projection of the star sample, the comfort model and an inspector that can be read in a headset,
and reuses the core unchanged; its first target is WebXR. A console surface is not planned until a
second surface has shown where the boundary really lies.
