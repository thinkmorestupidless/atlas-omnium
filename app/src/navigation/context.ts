// The navigation context a model gives the transitions: kinds, domains, radii, what an entity is
// made of, and search over names.
import type { Model } from '../model/derived';
import { IDS, type AtlasId } from '../model/ids';
import { searchNames } from '../model/search';
import type { NavContext } from './state';

export const buildContext = (model: Model, viewportShortSidePx: () => number): NavContext => ({
  kindOf: (id) => model.entities.get(id)?.kind,
  domainOf: (id) => {
    const e = model.entities.get(id);
    if (!e) return undefined;
    if (e.kind === 'Substance' || e.kind === 'MoleculeType' || e.kind === 'AtomType') return 'structural';
    if (e.kind === 'Star' && id !== IDS.sun) return 'stellar';
    return 'solar-system';
  },
  radiusKm: (id) => model.observations.measured(id, 'meanRadius').value,
  get viewportShortSidePx() { return viewportShortSidePx(); },
  madeOf: (id: AtlasId) => model.entities.outgoing(id, 'representativeOf')[0]?.target as AtlasId | undefined ?? null,
  search: (q) => searchNames(model, q),
});
