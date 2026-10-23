// The validation report: what each curator counted, found and rejected, written beside the curated
// files. A release with any rejection is not reproducible.
export interface Report {
  release: string;
  sections: Record<string, unknown>;
  rejections: string[];
}

export const newReport = (release: string): Report => ({ release, sections: {}, rejections: [] });
