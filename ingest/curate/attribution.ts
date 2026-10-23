// attribution.json: each source's licence, attribution and citations, copied from the manifest
// unchanged. The application renders these as they are (FR-021).
import type { Manifest } from '../../app/src/model/schema';
import { json } from '../lib/files';
import { emptyFragment, type Fragment } from '../lib/types';

export const curateAttribution = (m: Manifest, curatedDir: string): Fragment => {
  const f = emptyFragment();
  const rows = m.sources.filter((s) => s.licence !== null).map((s) => ({
    source: s.name,
    role: s.role,
    licence: s.licence as string,
    attribution: s.attribution ?? '',
    citation: s.citation ?? [],
    pages: s.terms_pages ?? [],
  }));
  f.files.push({ path: `${curatedDir}/attribution.json`, text: json(rows), sources: m.sources.filter((s) => s.licence !== null).map((s) => s.name) });
  return f;
};
