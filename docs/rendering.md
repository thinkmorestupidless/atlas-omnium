# Rendering

How the model becomes marks on a cream canvas, and how the marks change as the user travels
across scale without the thing they selected changing identity. The visible interface is 2D even
where the data is 3D.

## Architecture

```text
Navigation state (focus, scale, time, mode, history)
        │
        ▼
Representation resolver: (focus, scale) → regime, with hysteresis
        │
        ├── orbit geometry renderer        planetary regime
        ├── point and density renderer     nearby stellar (later: galactic, intergalactic)
        └── composition renderer           structural mode
        │
        ▼
Renderer interface → Canvas 2D backend (WebGL backend when the mark count demands it)
        +
HTML/CSS typographic controls: lock-up, scale rail, time, breadcrumb, search, inspector, legend
```

Data processing never happens in a renderer. A renderer receives derived state (positions already
evaluated for the current time, already projected) and a style resolved from the entity's status,
and draws. The resolver chooses which renderers are active and how far each has faded.

### Canvas 2D first, behind an interface

Feature 001 draws fewer than a hundred discs and tracks and a few hundred points. Canvas 2D does
that at frame rate on a laptop and on a device without a strong GPU, which the brief asks for.
Every renderer draws through one `Renderer` interface (clear, disc, ring, polyline, points, text
anchor) so a WebGL backend can replace it when the galactic regime brings tens of thousands of
points. The decision point is a measurement, not a date: `evaluation.md` names the frame-time
budget and the mark count at which the backend changes. Nothing in the model or navigation layers
knows which backend is drawing.

## One projection plane from Earth orbit to the stars

The orbital view is the Solar System seen from above the ecliptic. The stellar neighbourhood is
drawn in the same plane: ICRS Cartesian positions rotated into the ecliptic, with the Sun at the
origin, the out-of-plane height shown as a short tick or a secondary mark on each star rather than
by a perspective camera. The reward is the signature transition without a change of frame: the
same point on the screen is the Sun at every scale; the planets' tracks shrink into it; the stars
grow out of it. The cost is that the neighbourhood is a flattened projection and must say so on
the scale rail, which it does.

Scale is one number, metres per pixel, on a logarithmic rail. The rail is annotated with the
physical scale, the regime bands and the point where the projection flattens a third dimension.

## Regimes and their marks

| Regime | Marks | Behaviour |
|---|---|---|
| Planetary | solid discs for bodies, thin ellipses for orbit tracks, ticks for scale and time, a small ring for the focus | time-sensitive; true or exaggerated size with the exaggeration labelled; moons appear within their primary's context |
| Nearby stellar | a sparse point cloud, a mark per star sized by a legend's rule, a ring for distance uncertainty, a height tick | the Sun is a point among them; a selected star shows distance, motion and the selection criteria it passed |
| Galactic, intergalactic | density fields, aggregate marks | not in 001; the renderer interface and the regime bands are designed so they can be added without changing the model |
| Terrestrial | geographic forms | not in 001; a separate geographic data regime |
| Molecular, atomic | bonds and constituent marks from the conformer's own coordinates, laid out structurally | never a miniature solar system; entered only by a structural step |

Size exaggeration is a scale policy on the representation (`true`, `exaggerated`, `schematic`)
and is shown: a disc drawn larger than its true angular size carries a distinct edge and the
inspector says the factor. Distance is never exaggerated; the user can always read a true distance.

## The transition

As the Solar System occupies fewer pixels the orbit tracks thin and fade over a scale band; the
planet discs fade before the tracks do; the Sun's disc becomes the Sun's point without moving; the
neighbourhood's points fade in over the next band. Fading is a function of the scale number, so
scrolling back reverses it exactly. A short typographic chapter cue (the regime's name, set
large, receding) marks the crossing. Reduced motion replaces the fades with a cut at the band's
midpoint and drops the chapter cue's movement.

Hysteresis: a regime switch that changes which renderers are active happens at a different scale
going out than coming in, so a user hovering at the boundary does not see flicker.

## Identity across scale

The focus and the selection are atlas ids, never marks. When the regime changes, the renderers look
up the same ids and draw what they draw for them. The breadcrumb shows the id's canonical name
throughout. A test selects the Sun at planetary scale, scrolls to stellar scale and asserts the
selection is unchanged.

## Three vocabularies of line

| Line | Means | Style rule |
|---|---|---|
| Physical relation | an orbit track, a bond, a containment boundary | thin, continuous, in the regime's ink; drawn by the scene renderers |
| Knowledge relation | observed by, derived from, same as | drawn only in the inspector and the evidence view, never in the scene; dashed, with the predicate as its label |
| Graphical | a label's leader, a measurement tick | hairline, grey, with an end mark; drawn by the UI layer |

## Status marks

The marks for observed, derived, inferred and illustrative are a legend the UI shows on demand and
on first use. They are designed in the plan against the actual assertion statuses, not copied from
the concept sketch, and validated with people in the usability sessions. Selection and focus have
their own marks (a ring, a weight) that are never the same shape or colour as a status mark.

## Colour

Tokens in `app/src/styles/tokens.css`: cream canvas, near-black ink, and the flat panel colours
vermilion, cobalt, yellow and violet. An open question the plan tests rather than decides: whether
each regime takes a dominant colour. If it does, the legend says so and no colour encodes a
scientific property at the same time. Status is never colour alone.

## Typography

Bricolage Grotesque for the lock-up, chapter cues and large labels; IBM Plex Mono for metadata,
coordinates, units, epochs and the inspector. Labels avoid collisions by a simple priority rule
(focus, then selection, then by a per-regime importance) and drop rather than overlap.

## Input

| Input | Does |
|---|---|
| wheel, trackpad | scale travel centred on the pointer or the focus, within the spatial view |
| drag | pan in the projection plane |
| click, tap | select an entity or a relation; small in-context metadata |
| double click, Enter | focus the selection |
| Backspace, breadcrumb | back along the real history |
| arrow keys | move selection among visible marks; with modifier, scale travel |
| `t`, space | time controller: play and pause; a field for the date and the rate |
| `/` | search |
| `i` | inspector for the selection |

Keyboard reaches everything a pointer does. Touch gets pinch for scale and drag for pan; a tap
selects and a second tap on the same mark focuses. Reduced motion is honoured from the first screen.
