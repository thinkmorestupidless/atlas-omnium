// What an evidence id stands for: an observation, the ephemeris a body's state vectors came from
// (`obs:horizons:<slug>:state-vectors`), or a molecule's conformer (`conformer:<atlas id>`). An id that resolves to neither is reported, never guessed.
import type { Model } from './derived';
import type { Conformer, EphemerisFile, Observation, SourceRecord } from './schema';

export type Evidence =
  | { readonly kind: 'observation'; readonly id: string; readonly observation: Observation; readonly source: SourceRecord }
  | { readonly kind: 'ephemeris'; readonly id: string; readonly file: EphemerisFile; readonly source: SourceRecord }
  | { readonly kind: 'conformer'; readonly id: string; readonly conformer: Conformer; readonly source: SourceRecord }
  | { readonly kind: 'unresolved'; readonly id: string };

export const evidenceOf = (model: Pick<Model, 'observations' | 'ephemerides' | 'molecules'>, id: string): Evidence => {
  const o = model.observations.get(id);
  if (o) return { kind: 'observation', id, observation: o, source: o.source };
  const m = id.match(/^obs:horizons:([a-z0-9-]+):state-vectors$/);
  if (m) {
    const file = model.ephemerides.get(`atlas:${m[1]}`);
    if (file) return { kind: 'ephemeris', id, file, source: file.source };
  }
  const c = id.match(/^conformer:(atlas:[a-z0-9-]+)$/);
  if (c) {
    const conformer = model.molecules.find((x) => x.molecule === c[1]);
    if (conformer) return { kind: 'conformer', id, conformer, source: conformer.source };
  }
  return { kind: 'unresolved', id };
};
