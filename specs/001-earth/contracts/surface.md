# Contract: the surface

The boundary decision 0006 fixes. Below it: `app/src/model/`, `app/src/navigation/`, the curated
data. Above it: `app/src/projections/`, `app/src/renderers/`, `app/src/ui/`, `app/src/input/`.
Nothing below imports anything above; an ESLint boundary rule (`no-restricted-imports`) enforces
it and CI runs it.

## Projection

```ts
interface Projection {
  readonly name: 'ecliptic-top-down' | 'conformer-plane';
  readonly flattens: null | { dimension: 'ecliptic-z'; declared: true };
  project(p: PositionAtEpoch, view: View): ScreenPoint & { height?: Quantity<'m'> };   // typed in, pixels out
  unproject(s: ScreenPoint, view: View): PositionAtEpoch;                                // for pan
}
interface View { scale: number; centre: PositionAtEpoch; pan: { x: number; y: number }; width: number; height: number }
```

A projection converts no unit silently: it takes typed quantities and the `View`, and says in
`flattens` what it removed. The scale rail reads `flattens` to declare it (FR-010).

## Renderer

```ts
interface Renderer {
  clear(): void;
  disc(c: ScreenPoint, radiusPx: number, style: MarkStyle): void;
  ring(c: ScreenPoint, radiusPx: number, style: MarkStyle): void;
  polyline(points: ScreenPoint[], style: LineStyle): void;
  points(points: ScreenPoint[], style: MarkStyle): void;
  textAnchor(at: ScreenPoint, text: string, style: TextStyle): void;   // registers a label for the UI layer's collision pass
  flush(): void;
}
```

Canvas 2D implements it in 001 (decision 0002). A scene renderer (orbit geometry, point and
density, composition) receives `{ marks: ResolvedMark[], lines: ResolvedLine[], fade: number }`
from the representation resolver and calls the interface; it reads no model file and evaluates
nothing. `LineStyle.vocabulary` is `'physical' | 'graphical'`; `'knowledge'` lines are drawn only
by the inspector, in HTML (FR-014).

## Representation resolver

`resolve(state: NavigationState, model: Model, projection: Projection): Scene`, where `Scene` names
the active renderers with their fade (0 to 1 as a function of `state.scale` within the band of
research R9), the resolved marks (an `AtlasId`, a `ScreenPoint`, a `MarkStyle` from the entity's
status and the scale policy, an `exaggeration` factor or `null`) and the chapter cue to show. The
resolver is a pure function and is the thing the navigation tier's identity tests call.

## UI and input

Actions are one enum shared by every input adapter and the UI:

```ts
type Action = { kind: 'scale'; factor: number; about: 'pointer' | 'focus' }
            | { kind: 'pan'; dx: number; dy: number }
            | { kind: 'select'; id: AtlasId | null } | { kind: 'focus' } | { kind: 'back' }
            | { kind: 'enterStructural' } | { kind: 'setDate'; utc: string } | { kind: 'play' } | { kind: 'pause' }
            | { kind: 'setRate'; daysPerSecond: number } | { kind: 'search'; query: string }
            | { kind: 'inspect'; target: InspectTarget } | { kind: 'legend' } | { kind: 'scalePolicy'; policy: 'true' | 'exaggerated' };
```

Bindings (from `docs/rendering.md`; the keyboard set is the contract the access feature tests):

| Action | Pointer | Keyboard | Touch |
|---|---|---|---|
| scale | wheel, trackpad | `+` `-`, or arrows with Shift | pinch |
| pan | drag | arrows with Alt | drag |
| select | click | arrows move among visible marks; Tab cycles controls | tap |
| focus | double click | Enter | second tap |
| back | breadcrumb | Backspace | breadcrumb |
| enterStructural | the "what is it made of?" control | `m` | the control |
| time | the controller | `t` toggles play, `[` `]` rate, `d` date field | the controller |
| search | the field | `/` | the field |
| inspect | click a value | `i` on the selection | tap a value |
| legend | the control | `l` | the control |
| scale policy | the control | `x` | the control |

Every control is an HTML element with a visible focus ring and an accessible name; the canvas is
`role="img"` with a live region announcing the selection, the regime and a mode change
(`aria-live="polite"`). `prefers-reduced-motion: reduce` replaces every fade with a cut and the
chapter cue's movement with a static display of one second.

## Inspector

Opens on a value, a position or a relationship without leaving the scene, as a panel beside it.
Shows, in IBM Plex Mono: the value with unit; the uncertainty (σ or an interval); the status mark
and word; the source record (dataset, release, record, retrieved); the epoch in its time scale;
the frame; the model and inputs for a derived state; the attribution line beside the dataset
release (FR-021); for a cross-matched star, both records and the basis; for a missing value, the
word "missing" and no number. Its release view lists the release name, window, every source with
licence, attribution and citations, and the star sample's criteria.
