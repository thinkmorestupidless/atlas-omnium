// Water and what it is made of, from PubChem: the substance water, the molecule type CID 962 with
// its molecular weight, the atom types hydrogen and oxygen with their atomic numbers, the conformer
// in its own molecular frame, and the relationships: Earth representative of water (illustrative,
// no evidence), water composed of the molecule type (observed, the PubChem record), the molecule
// type has part hydrogen ×2 and oxygen ×1 (observed, the conformer's atom list).
import { IDS, type AtlasId } from '../../app/src/model/ids';
import type { Conformer, Entity, Observation, SourceRecord } from '../../app/src/model/schema';
import { json } from '../lib/files';
import { emptyFragment } from '../lib/types';
import { CID, RAW } from '../sources/pubchem';
import type { Curator } from './index';
import { rawFiles, readRaw, retrieved, sourceOf } from './raw';

interface Prop { urn: { label?: string; name?: string }; value: { sval?: string; fval?: number; ival?: number } }
interface Compound {
  atoms: { aid: number[]; element: number[] };
  bonds?: { aid1: number[]; aid2: number[]; order: number[] };
  coords: { conformers: { x: number[]; y: number[]; z?: number[] }[] }[];
  props: Prop[];
}

const ELEMENT_IDS: Record<number, AtlasId> = { 1: IDS.hydrogen, 8: IDS.oxygen };
/** The conformer's atom list as evidence: an id the inspector resolves to the molecules file's record. */
export const conformerEvidence = (molecule: string) => `conformer:${molecule}`;

export const moleculesCurator: Curator = {
  name: 'molecules',
  needs: ['pubchem'],
  async run(ctx) {
    const f = emptyFragment();
    const at = retrieved(ctx.manifest, 'pubchem');
    const release = String(sourceOf(ctx.manifest, 'pubchem').source_release);
    const file = (name: string) => rawFiles(ctx.manifest, 'pubchem').find((p) => p.endsWith(`/${name}`)) as string;
    const record = (JSON.parse(await readRaw(file(RAW.record))) as { PC_Compounds: Compound[] }).PC_Compounds[0] as Compound;
    const conf = (JSON.parse(await readRaw(file(RAW.conformer))) as { PC_Compounds: Compound[] }).PC_Compounds[0] as Compound;
    const table = JSON.parse(await readRaw(file(RAW.periodicTable))) as { Table: { Columns: { Column: string[] }; Row: { Cell: string[] }[] } };

    const prop = (label: string, name?: string) => record.props.find((p) => p.urn.label === label && (name === undefined || p.urn.name === name))?.value;
    const src = (rec: string): SourceRecord => ({ dataset: 'pubchem', release, record: rec, retrieved: at });
    const conformerSrc = src(`CID ${CID}, 3D conformer (record/JSON?record_type=3d)`);
    const traditional = prop('IUPAC Name', 'Traditional')?.sval ?? null;
    const preferred = prop('IUPAC Name', 'Preferred')?.sval ?? null;
    const formula = prop('Molecular Formula')?.sval ?? null;
    const weight = prop('Molecular Weight')?.sval ?? null;
    if (!traditional || !preferred) throw new Error(`the PubChem record of CID ${CID} gives no IUPAC name`);

    const molecule = IDS.waterMolecule;
    const obs = (o: Observation) => { f.observations.push(o); f.rawValues.push({ subject: o.subject, property: o.property, value: o.value }); return o.id; };
    const weightObs = obs({ id: `obs:pubchem:${CID}:molecularWeight`, subject: molecule, property: 'molecularWeight', value: weight === null ? null : Number(weight), unit: 'g/mol', source: src(`CID ${CID}, compound record: Molecular Weight`) });

    // The atom types, from the periodic table's rows for the elements the conformer contains.
    const cols = table.Table.Columns.Column;
    const col = (name: string) => cols.indexOf(name);
    const counts = new Map<number, number>();
    for (const z of conf.atoms.element) counts.set(z, (counts.get(z) ?? 0) + 1);
    const atomTypes: Entity[] = [];
    for (const z of [...counts.keys()].sort((a, b) => a - b)) {
      const id = ELEMENT_IDS[z];
      const row = table.Table.Row.find((r) => r.Cell[col('AtomicNumber')] === String(z));
      if (!id || !row) throw new Error(`the conformer has element ${z}, which 001 has no atom type for`);
      const name = row.Cell[col('Name')] as string;
      const symbol = row.Cell[col('Symbol')] as string;
      const s = src(`periodic table: AtomicNumber ${z}, ${name}`);
      const evidence = obs({ id: `obs:pubchem:element-${z}:atomicNumber`, subject: id, property: 'atomicNumber', value: Number(row.Cell[col('AtomicNumber')]), unit: 'dimensionless', source: s });
      atomTypes.push({ id, kind: 'AtomType', names: { canonical: name, aliases: [symbol], catalogue: [], source: s }, classifications: [], relations: [], evidence: [evidence] });
    }

    const conformer: Conformer = {
      molecule, source: conformerSrc, unit: 'angstrom',
      atoms: conf.atoms.aid.map((aid, k) => {
        const c = conf.coords[0]?.conformers[0];
        const z = conf.atoms.element[k] as number;
        return { index: aid, element: ELEMENT_IDS[z] as AtlasId, position: [c?.x[k] ?? NaN, c?.y[k] ?? NaN, c?.z?.[k] ?? NaN] as [number, number, number] };
      }),
      bonds: (conf.bonds?.aid1 ?? []).map((a, k) => ({ a, b: conf.bonds?.aid2[k] as number, order: conf.bonds?.order[k] as 1 | 2 | 3 })),
    };
    if (conformer.atoms.some((a) => a.position.some((v) => !Number.isFinite(v)))) throw new Error('the conformer record lacks a coordinate; no position is guessed');

    f.entities.push(
      { id: IDS.water, kind: 'Substance', names: { canonical: traditional, aliases: [], catalogue: [{ catalogue: 'pubchem-cid', id: String(CID) }], source: src(`CID ${CID}, compound record: IUPAC Name (Traditional)`) },
        classifications: [], evidence: [weightObs],
        relations: [{ source: IDS.water, predicate: 'composedOf', target: molecule, status: 'observed', evidence: [weightObs] }] },
      { id: molecule, kind: 'MoleculeType', names: { canonical: preferred, aliases: formula ? [formula] : [], catalogue: [{ catalogue: 'pubchem-cid', id: String(CID) }], source: src(`CID ${CID}, compound record: IUPAC Name (Preferred)`) },
        classifications: [], evidence: [weightObs, conformerEvidence(molecule)],
        relations: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([z, n]) => ({ source: molecule, predicate: 'hasPart' as const, target: ELEMENT_IDS[z] as AtlasId, status: 'observed' as const, evidence: [conformerEvidence(molecule)], count: n })) },
      ...atomTypes,
    );
    f.relationsOnOthers.push({ source: IDS.earth, predicate: 'representativeOf', target: IDS.water, status: 'illustrative', evidence: [] });
    f.files.push({ path: `${ctx.curatedDir}/molecules.json`, text: json([conformer]), sources: ['pubchem'] });
    f.report = { cid: CID, formula, atoms: conformer.atoms.length, bonds: conformer.bonds.length, counts: Object.fromEntries([...counts].map(([z, n]) => [ELEMENT_IDS[z], n])) };
    return f;
  },
};
