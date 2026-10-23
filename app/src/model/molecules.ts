// A molecule type's atoms in its own reference frame: the conformer's coordinates in ångström, the
// frame carrying the source record, never a celestial frame (FR-016).
import type { Frame, Vector3 } from './frames';
import type { AtlasId } from './ids';
import type { Conformer } from './schema';

export interface MolecularPosition {
  readonly r: Vector3;
  readonly unit: 'angstrom';
  readonly frame: Extract<Frame, { kind: 'molecular-conformer' }>;
}

export const conformerFrame = (c: Conformer): Extract<Frame, { kind: 'molecular-conformer' }> => ({ kind: 'molecular-conformer', source: c.source });

export const atomPosition = (c: Conformer, index: number): MolecularPosition | null => {
  const a = c.atoms.find((x) => x.index === index);
  return a ? { r: a.position, unit: 'angstrom', frame: conformerFrame(c) } : null;
};

export const conformerOf = (molecules: readonly Conformer[], id: AtlasId): Conformer | undefined => molecules.find((c) => c.molecule === id);
