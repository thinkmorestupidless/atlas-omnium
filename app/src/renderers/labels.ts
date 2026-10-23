// Label placement: highest priority first; a label that would overlap one already placed is dropped,
// never drawn over it.
export interface LabelBox { x: number; y: number; w: number; h: number }
export interface LabelRequest { text: string; box: LabelBox; priority: number; order: number }

const overlaps = (a: LabelBox, b: LabelBox) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const placeLabels = <T extends LabelRequest>(requests: readonly T[]): { placed: T[]; dropped: T[] } => {
  const sorted = [...requests].sort((a, b) => b.priority - a.priority || a.order - b.order);
  const placed: T[] = [];
  const dropped: T[] = [];
  for (const r of sorted) (placed.some((p) => overlaps(p.box, r.box)) ? dropped : placed).push(r);
  return { placed, dropped };
};
