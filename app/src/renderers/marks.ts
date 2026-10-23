// The selection mark is a ring set apart from the mark; the focus mark is the mark's own ring made
// heavy. Neither shares a shape with a status mark (R11, app/src/ui/status-marks.ts).
export const SELECTION_MARK = { shape: 'offset-ring', gapPx: 5 } as const;
export const FOCUS_MARK = { shape: 'ring-weight', weightPx: 2.5 } as const;
