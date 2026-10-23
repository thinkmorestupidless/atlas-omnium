// Every input adapter and every control speaks this one vocabulary (contracts/surface.md).
import type { AtlasId } from '../model/ids';

export type InspectTarget =
  | { kind: 'value'; subject: AtlasId; property: string }
  | { kind: 'position'; subject: AtlasId }
  | { kind: 'relationship'; source: AtlasId; predicate: string; target: AtlasId }
  | { kind: 'release' }
  | { kind: 'entity'; subject: AtlasId };

export type Action =
  | { kind: 'scale'; factor: number; anchorPx?: { x: number; y: number } }
  | { kind: 'pan'; dxPx: number; dyPx: number }
  | { kind: 'select'; id: AtlasId | null }
  | { kind: 'focus'; id?: AtlasId }
  | { kind: 'back' }
  | { kind: 'backTo'; index: number }
  | { kind: 'enterStructural' }
  | { kind: 'setDate'; date: string }
  | { kind: 'play' }
  | { kind: 'pause' }
  | { kind: 'togglePlay' }
  | { kind: 'setRate'; daysPerSecond: number }
  | { kind: 'search'; query: string }
  | { kind: 'inspect'; target: InspectTarget | null }
  | { kind: 'legend'; open?: boolean }
  | { kind: 'scalePolicy'; policy?: 'true' | 'exaggerated' }
  | { kind: 'cycleSelection'; direction: 1 | -1 }
  | { kind: 'tick'; seconds: number };
