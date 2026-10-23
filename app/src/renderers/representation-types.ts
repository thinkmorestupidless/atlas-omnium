// What the representation resolver hands the scene renderers: marks and lines already placed on the
// screen, styled from each entity's status and the scale policy. Renderers evaluate nothing.
import type { AtlasId } from '../model/ids';
import type { Status } from '../model/schema';
import type { Fades } from '../navigation/resolver';
import type { Regime } from '../navigation/state';
import type { LineStyle, MarkStyle, ScreenPoint } from './renderer';

export type MarkShape = 'disc' | 'point' | 'stellar' | 'atom';

export interface ResolvedMark {
  readonly id: AtlasId;
  readonly name: string;
  readonly shape: MarkShape;
  readonly at: ScreenPoint;
  readonly radiusPx: number;
  readonly style: MarkStyle;
  /** How many times larger than measured the mark is drawn, or null when it is not enlarged. */
  readonly exaggeration: number | null;
  /** True when the entity's radius is missing and the mark is a point for that reason. */
  readonly radiusMissing: boolean;
  readonly status: Status;
  readonly hasSourceRecord: boolean;
  readonly selected: boolean;
  readonly focused: boolean;
  /** A ring of uncertainty, in pixels, for a star's distance range. */
  readonly rangePx?: { readonly inner: number; readonly outer: number };
  /** The flattened coordinate as a tick length in pixels, for a star. */
  readonly heightTickPx?: number;
  readonly label: string | null;
  readonly labelPriority: number;
  readonly alpha: number;
}

export interface ResolvedLine {
  readonly id: string;
  readonly points: readonly ScreenPoint[];
  readonly style: LineStyle;
  readonly closed: boolean;
}

export interface Scene {
  readonly regime: Regime;
  readonly fades: Fades;
  readonly marks: readonly ResolvedMark[];
  readonly lines: readonly ResolvedLine[];
  readonly cue: { readonly text: string; readonly alpha: number } | null;
}
