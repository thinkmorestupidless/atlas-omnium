// A manifest is complete when no field is null and every raw and curated file has a checksum.
import { firstUnfilled } from '../../app/src/model/release';
import type { Manifest } from '../../app/src/model/schema';

export interface ManifestCheck { unfilled: string | null; reproducible: boolean }

export const checkManifest = (m: Manifest): ManifestCheck => {
  const { reproducible: _r, ...rest } = m;
  const unfilled = firstUnfilled(rest as Manifest);
  const noFiles = m.sources.find((s) => (s.raw?.length ?? 0) === 0 || (s.curated?.length ?? 0) === 0);
  const missing = unfilled ?? (noFiles ? `sources[${m.sources.indexOf(noFiles)}] (${noFiles.name}) has no files` : null);
  return { unfilled: missing, reproducible: missing === null };
};
