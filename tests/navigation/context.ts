// A navigation context over a handful of entities, so the transitions are tested without a release.
import { atlasId, type AtlasId, type Kind } from '../../app/src/model/ids';
import type { NavContext } from '../../app/src/navigation/state';

const kinds: Record<string, Kind> = {
  'atlas:earth': 'Planet', 'atlas:mars': 'Planet', 'atlas:sun': 'Star', 'atlas:moon': 'Moon', 'atlas:halley': 'SmallBody',
  'atlas:gaia-dr3-5853498713190525696': 'Star', 'atlas:water': 'Substance', 'atlas:pubchem-962': 'MoleculeType', 'atlas:element-h': 'AtomType',
  'atlas:mercury': 'Planet', 'atlas:element-hg': 'AtomType',
};
const names: Record<string, string> = {
  'atlas:earth': 'Earth', 'atlas:mars': 'Mars', 'atlas:sun': 'Sun', 'atlas:gaia-dr3-5853498713190525696': 'Proxima Centauri',
  'atlas:water': 'water', 'atlas:mercury': 'Mercury', 'atlas:element-hg': 'Mercury',
};
const radiiKm: Record<string, number> = { 'atlas:earth': 6371, 'atlas:mars': 3389.5, 'atlas:sun': 695700 };

export const PROXIMA = atlasId('atlas:gaia-dr3-5853498713190525696');

export const testContext = (viewportShortSidePx = 800): NavContext => ({
  kindOf: (id: AtlasId) => kinds[id],
  domainOf: (id: AtlasId) => {
    const k = kinds[id];
    if (k === 'Substance' || k === 'MoleculeType' || k === 'AtomType') return 'structural';
    if (k === 'Star' && id !== 'atlas:sun') return 'stellar';
    return 'solar-system';
  },
  radiusKm: (id: AtlasId) => radiiKm[id] ?? null,
  viewportShortSidePx,
  madeOf: (id: AtlasId) => (id === 'atlas:earth' ? atlasId('atlas:water') : null),
  search: (q: string) => Object.entries(names)
    .filter(([, n]) => n.toLowerCase().startsWith(q.toLowerCase()))
    .map(([id, name]) => ({ id: id as AtlasId, name, kind: kinds[id] as Kind })),
});
