// Observations by subject and property. A value the sources do not give is null: the lookup says
// so with `value: null`, whether an observation recorded the absence or none exists.
import type { AtlasId } from './ids';
import type { Observation, Property } from './schema';

export interface Measured { value: number | null; observation: Observation | null }

export class Observations {
  private readonly bySubject = new Map<string, Map<Property, Observation>>();
  private readonly byId = new Map<string, Observation>();

  constructor(all: readonly Observation[]) {
    for (const o of all) {
      this.byId.set(o.id, o);
      let m = this.bySubject.get(o.subject);
      if (!m) this.bySubject.set(o.subject, (m = new Map()));
      if (m.has(o.property)) throw new Error(`two observations of ${o.subject} ${o.property}`);
      m.set(o.property, o);
    }
  }

  get(id: string): Observation | undefined { return this.byId.get(id); }

  of(subject: AtlasId): Observation[] { return [...(this.bySubject.get(subject)?.values() ?? [])]; }

  measured(subject: AtlasId, property: Property): Measured {
    const o = this.bySubject.get(subject)?.get(property) ?? null;
    return { value: o ? o.value : null, observation: o };
  }
}
