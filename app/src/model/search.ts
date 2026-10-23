// Search over canonical names and aliases: case-insensitive, by prefix, each match with its kind.
import type { Model } from './derived';
import type { AtlasId, Kind } from './ids';

export interface Match { id: AtlasId; name: string; kind: Kind }

export const searchNames = (model: Pick<Model, 'entities'>, query: string): Match[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Match[] = [];
  for (const e of model.entities.all()) {
    const names = [e.names.canonical, ...e.names.aliases];
    if (names.some((n) => n.toLowerCase().startsWith(q))) out.push({ id: e.id as AtlasId, name: e.names.canonical, kind: e.kind });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
};
