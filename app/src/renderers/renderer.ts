// The one interface every scene renderer draws through, so the backend (Canvas 2D now, WebGL when a
// measurement says so; decision 0002) changes without touching the model or the resolver.

export interface ScreenPoint { readonly x: number; readonly y: number }

export type Ink = 'ink' | 'muted' | 'rule' | 'vermilion' | 'cobalt' | 'yellow' | 'violet' | 'cream';

export interface MarkStyle {
  readonly fill?: Ink;
  readonly stroke?: Ink;
  readonly lineWidth?: number;
  readonly alpha?: number;
  readonly dash?: readonly number[];
}

/** Physical relations (orbit tracks, bonds) and graphical annotations (ticks, leaders) never share a style. */
export interface LineStyle {
  readonly vocabulary: 'physical' | 'graphical';
  readonly stroke: Ink;
  readonly width: number;
  readonly alpha?: number;
  readonly dash?: readonly number[];
}

export interface TextStyle {
  readonly face: 'sans' | 'mono';
  readonly size: number;
  readonly weight?: number;
  readonly colour: Ink;
  readonly alpha?: number;
  readonly align?: 'left' | 'center' | 'right';
  /** Higher draws first and wins a collision; a label that would overlap one already placed is dropped. */
  readonly priority: number;
}

export interface Renderer {
  size(): { width: number; height: number };
  clear(): void;
  disc(c: ScreenPoint, radiusPx: number, style: MarkStyle): void;
  ring(c: ScreenPoint, radiusPx: number, style: MarkStyle): void;
  polyline(points: readonly ScreenPoint[], style: LineStyle, closed?: boolean): void;
  points(points: readonly ScreenPoint[], radiusPx: number, style: MarkStyle): void;
  /** Registers a label; labels are placed by priority and drawn at flush. */
  textAnchor(at: ScreenPoint, text: string, style: TextStyle): void;
  flush(): { placed: string[]; dropped: string[] };
}
