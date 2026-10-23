// Every curated observation and entity passes its schema; the first failure per item is reported
// with what it was, so a rejection is never silent.
import { EntitySchema, ObservationSchema } from '../../app/src/model/schema';
import type { Entity, Observation } from '../../app/src/model/schema';

export const checkObservations = (all: readonly Observation[]): string[] =>
  all.flatMap((o) => {
    const r = ObservationSchema.safeParse(o);
    return r.success ? [] : [`${o.id}: ${r.error.issues.map((i) => i.message).join('; ')}`];
  });

export const checkEntities = (all: readonly Entity[]): string[] =>
  all.flatMap((e) => {
    const r = EntitySchema.safeParse(e);
    return r.success ? [] : [`${e.id}: ${r.error.issues.map((i) => i.message).join('; ')}`];
  });
