// Entities and their relationships, looked up by id and by predicate.
import type { AtlasId, Kind } from './ids';
import type { Entity, Predicate, Relationship } from './schema';

export class Entities {
  private readonly byId = new Map<string, Entity>();
  private readonly incoming = new Map<string, Relationship[]>();

  constructor(all: readonly Entity[]) {
    for (const e of all) {
      if (this.byId.has(e.id)) throw new Error(`duplicate atlas id ${e.id}`);
      this.byId.set(e.id, e);
    }
    for (const e of all) {
      for (const r of e.relations) {
        if (!this.byId.has(r.target)) throw new Error(`${e.id} ${r.predicate} an unknown entity ${r.target}`);
        const list = this.incoming.get(r.target) ?? [];
        list.push(r);
        this.incoming.set(r.target, list);
      }
    }
  }

  get(id: AtlasId): Entity | undefined { return this.byId.get(id); }

  require(id: AtlasId): Entity {
    const e = this.byId.get(id);
    if (!e) throw new Error(`no entity ${id}`);
    return e;
  }

  has(id: string): boolean { return this.byId.has(id); }

  all(): Entity[] { return [...this.byId.values()]; }

  ofKind(kind: Kind): Entity[] { return this.all().filter((e) => e.kind === kind); }

  outgoing(id: AtlasId, predicate?: Predicate): Relationship[] {
    return (this.byId.get(id)?.relations ?? []).filter((r) => !predicate || r.predicate === predicate);
  }

  incomingTo(id: AtlasId, predicate?: Predicate): Relationship[] {
    return (this.incoming.get(id) ?? []).filter((r) => !predicate || r.predicate === predicate);
  }

  name(id: AtlasId): string { return this.byId.get(id)?.names.canonical ?? id; }
}
