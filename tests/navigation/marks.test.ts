// FR-013: a status is told by shape and word, never by colour alone, and the selection and focus
// marks share no shape with any status mark.
import { describe, expect, it } from 'vitest';
import { STATUSES } from '../../app/src/model/schema';
import { FOCUS_MARK, SELECTION_MARK } from '../../app/src/renderers/representation';
import { MARK_SHAPES, STATUS_MARKS } from '../../app/src/ui/status-marks';

describe('the mark shapes', () => {
  it('are pairwise distinct across the four statuses, the selection and the focus', () => {
    const shapes = [...STATUSES.map((s) => STATUS_MARKS[s].shape), SELECTION_MARK.shape, FOCUS_MARK.shape];
    expect(shapes).toHaveLength(6);
    expect(new Set(shapes).size).toBe(6);
    expect(Object.values(MARK_SHAPES).sort()).toEqual([...shapes].sort());
  });

  it('give every status its word as well as its shape', () => {
    for (const s of STATUSES) expect(STATUS_MARKS[s].word).toBe(s);
  });
});
