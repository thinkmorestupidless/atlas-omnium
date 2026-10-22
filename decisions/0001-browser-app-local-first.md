# 0001: A browser application in TypeScript, local-first, not on ankka for the first slice

*2026-10-22.* Accepted.

## Decision
The first delivery is a static browser application in TypeScript: HTML and CSS for the
typographic controls, a canvas for the scene, curated JSON loaded by relative URL. No backend,
database, workflow engine or multi-agent architecture. It does not run on ankka.

## Why
The brief (section 7) says so and gives the reason: the proof is of an interaction model and a
data contract, not of infrastructure. The corpus for 001 is tens of bodies, hundreds of stars and
a handful of molecules; it fits in files. Persistent infrastructure is chosen only when corpus
volume, collaborative curation or real-time updates justify it (brief, open question 7).

## Alternatives
An ankka service holding entities and relationships as components, with the browser as a web
service. It would make the atlas another family application and map onto twins and concepts
later, but it would put a platform between a two-week experiment and its first screen. The model
in `docs/data-contracts.md` is kept free of rendering so that mapping stays possible.

## Consequences
Deployment is a static site. Family conventions apply where they fit a Node repository; the
Scala rules do not. The repository is mapped on thinkmorestupidless.com as its own family, not in
ankka's; the site's `w3.yaml` needs an `atlas` entry.
