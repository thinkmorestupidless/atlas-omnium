The representation resolver and the renderers it chooses between by regime: orbit geometry,
point and density, composition. All draw through one `Renderer` interface so the backing
technology (Canvas 2D now, WebGL when the mark count demands it) can change without touching the
model. See `docs/rendering.md`.
