// A projection turns a typed position into a point on the screen for a view, and says what it
// removed from view. It converts units only through the model's named functions.
import type { PositionAtEpoch, Vector3 } from '../model/frames';
import type { ScreenPoint } from '../renderers/renderer';

export interface View {
  /** Metres per CSS pixel. */
  readonly scale: number;
  /** The focus's position, in metres, in the projection's frame. */
  readonly centre: Vector3;
  /** Metres of the view centre from the focus. */
  readonly pan: { readonly x: number; readonly y: number };
  readonly width: number;
  readonly height: number;
}

export interface Projected extends ScreenPoint {
  /** The flattened coordinate, in metres, for a height tick. */
  readonly height: number;
}

export interface Projection {
  readonly name: 'ecliptic-top-down' | 'conformer-plane';
  readonly flattens: null | { readonly dimension: 'ecliptic-z' | 'conformer-normal'; readonly declared: true };
  project(p: PositionAtEpoch, view: View): Projected;
  /** A screen offset from the view centre to metres in the plane, for panning and anchoring. */
  unprojectOffset(dx: number, dy: number, view: View): { x: number; y: number };
}
