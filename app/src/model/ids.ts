// Identity. An atlas id is opaque and permanent; names, aliases and catalogue identifiers are
// properties of an entity, never its id (docs/data-contracts.md, "Identity").

export type AtlasId = string & { readonly __brand: 'AtlasId' };

export const atlasId = (s: string): AtlasId => {
  if (!/^atlas:[a-z0-9][a-z0-9-]*$/.test(s)) throw new Error(`not an atlas id: ${s}`);
  return s as AtlasId;
};

/** The kinds of 001 (clarification Q5: the Sun is a Star; dwarf planets, asteroids, comets are SmallBody). */
export const KINDS = ['Star', 'Planet', 'Moon', 'SmallBody', 'Substance', 'MoleculeType', 'AtomType'] as const;
export type Kind = (typeof KINDS)[number];

export const CATALOGUES = ['gaia-dr3', 'hip', 'simbad', 'pubchem-cid', 'horizons'] as const;
export interface CatalogueId { catalogue: (typeof CATALOGUES)[number]; id: string }

/** The fixed ids of release 001-prototype (data-model.md, "Identity"). */
export const IDS = {
  sun: atlasId('atlas:sun'),
  mercury: atlasId('atlas:mercury'),
  venus: atlasId('atlas:venus'),
  earth: atlasId('atlas:earth'),
  mars: atlasId('atlas:mars'),
  jupiter: atlasId('atlas:jupiter'),
  saturn: atlasId('atlas:saturn'),
  uranus: atlasId('atlas:uranus'),
  neptune: atlasId('atlas:neptune'),
  moon: atlasId('atlas:moon'),
  ceres: atlasId('atlas:ceres'),
  pluto: atlasId('atlas:pluto'),
  halley: atlasId('atlas:halley'),
  water: atlasId('atlas:water'),
  waterMolecule: atlasId('atlas:pubchem-962'),
  hydrogen: atlasId('atlas:element-h'),
  oxygen: atlasId('atlas:element-o'),
} as const;

export const gaiaStarId = (sourceId: string): AtlasId => atlasId(`atlas:gaia-dr3-${sourceId}`);
export const hipStarId = (hip: number | string): AtlasId => atlasId(`atlas:hip-${hip}`);
