// The schemas every curated file and the manifest are validated against, at ingest and again at
// load. They are the single source of the model's shapes; the types are inferred from them.
import { z } from 'zod';
import { CATALOGUES, KINDS } from './ids';
import { UNITS } from './units';

export const AtlasIdSchema = z.string().regex(/^atlas:[a-z0-9][a-z0-9-]*$/, 'not an atlas id');
export const UnitSchema = z.enum(UNITS);
export const QuantitySchema = z.object({ value: z.number().finite(), unit: UnitSchema }).strict();
export const EpochSchema = z.object({ scale: z.enum(['TDB', 'TT', 'TCB', 'UTC']), jd: z.number().finite() }).strict();
export const Vector3Schema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

export const DATASETS = [
  'jpl-horizons', 'nssdca-factsheet', 'gaia', 'hipparcos2', 'simbad', 'pubchem', 'jpl-keplerian-elements',
] as const;
export const DatasetSchema = z.enum(DATASETS);

export const SourceRecordSchema = z.object({
  dataset: DatasetSchema,
  release: z.string().min(1),
  record: z.string().min(1),
  retrieved: z.string().datetime({ offset: true }),
}).strict();

export const FrameSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('heliocentric-ecliptic'), equinox: z.literal('J2000'), system: z.literal('ICRF') }).strict(),
  z.object({ kind: z.literal('geocentric-ecliptic'), equinox: z.literal('J2000'), system: z.literal('ICRF') }).strict(),
  z.object({ kind: z.literal('icrs-cartesian'), origin: z.literal('sun') }).strict(),
  z.object({ kind: z.literal('molecular-conformer'), source: SourceRecordSchema }).strict(),
]);

export const STATUSES = ['observed', 'derived', 'inferred', 'illustrative'] as const;
export const StatusSchema = z.enum(STATUSES);

export const PREDICATES = [
  'orbits', 'satelliteOf', 'hasPart', 'composedOf', 'representativeOf',
  'observedBy', 'derivedFrom', 'sameAs', 'supportedBy', 'supersededBy',
] as const;
export const PredicateSchema = z.enum(PREDICATES);
export const KNOWLEDGE_PREDICATES: readonly string[] = ['observedBy', 'derivedFrom', 'sameAs', 'supportedBy', 'supersededBy'];

export const RelationshipSchema = z.object({
  source: AtlasIdSchema,
  predicate: PredicateSchema,
  target: AtlasIdSchema,
  status: StatusSchema,
  evidence: z.array(z.string().min(1)),
  validity: z.object({ from: EpochSchema, to: EpochSchema }).strict().optional(),
  count: z.number().int().positive().optional(),
}).strict().superRefine((r, ctx) => {
  if (r.status !== 'illustrative' && r.evidence.length === 0) {
    ctx.addIssue({ code: 'custom', message: `${r.source} ${r.predicate} ${r.target}: a ${r.status} relationship needs evidence` });
  }
  if (r.predicate === 'representativeOf' && r.status !== 'illustrative') {
    ctx.addIssue({ code: 'custom', message: 'representativeOf is only ever illustrative' });
  }
  if ((r.count !== undefined) !== (r.predicate === 'hasPart')) {
    ctx.addIssue({ code: 'custom', message: 'a count belongs to hasPart and only to hasPart' });
  }
});

/** Each property's unit, and whether its value must be positive. */
export const PROPERTIES = {
  meanRadius: { unit: 'km', positive: true, epoch: false },
  mass: { unit: 'kg', positive: true, epoch: false },
  parallax: { unit: 'mas', positive: true, epoch: true },
  ra: { unit: 'deg', positive: false, epoch: true },
  dec: { unit: 'deg', positive: false, epoch: true },
  pmra: { unit: 'mas/yr', positive: false, epoch: true },
  pmdec: { unit: 'mas/yr', positive: false, epoch: true },
  radialVelocity: { unit: 'km/s', positive: false, epoch: true },
  gMagnitude: { unit: 'mag', positive: false, epoch: false },
  vMagnitude: { unit: 'mag', positive: false, epoch: false },
  hpMagnitude: { unit: 'mag', positive: false, epoch: false },
  bpRp: { unit: 'mag', positive: false, epoch: false },
  ruwe: { unit: 'dimensionless', positive: true, epoch: false },
  atomicNumber: { unit: 'dimensionless', positive: true, epoch: false },
  molecularWeight: { unit: 'g/mol', positive: true, epoch: false },
} as const;
export type Property = keyof typeof PROPERTIES;
export const PropertySchema = z.enum(Object.keys(PROPERTIES) as [Property, ...Property[]]);

export const UncertaintySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stddev'), sigma: z.number().finite().nonnegative() }).strict(),
  z.object({ kind: z.literal('interval'), low: z.number().finite(), high: z.number().finite() }).strict(),
]);

export const ObservationSchema = z.object({
  id: z.string().regex(/^obs:/),
  subject: AtlasIdSchema,
  property: PropertySchema,
  value: z.number().finite().nullable(),
  unit: UnitSchema,
  uncertainty: UncertaintySchema.optional(),
  source: SourceRecordSchema,
  epoch: EpochSchema.optional(),
  frame: FrameSchema.optional(),
  method: z.string().optional(),
}).strict().superRefine((o, ctx) => {
  const spec = PROPERTIES[o.property];
  if (o.unit !== spec.unit) ctx.addIssue({ code: 'custom', message: `${o.property} is in ${spec.unit}, not ${o.unit}` });
  if (spec.positive && o.value !== null && o.value <= 0) {
    ctx.addIssue({ code: 'custom', message: `${o.subject} ${o.property}: ${o.value} is outside its domain; nothing is clamped` });
  }
  if (spec.epoch && o.value !== null && !o.epoch) ctx.addIssue({ code: 'custom', message: `${o.property} needs an epoch` });
});

export const ClassificationSchema = z.object({ scheme: z.string().min(1), value: z.string().min(1), source: SourceRecordSchema }).strict();

export const EntitySchema = z.object({
  id: AtlasIdSchema,
  kind: z.enum(KINDS),
  names: z.object({
    canonical: z.string().min(1),
    aliases: z.array(z.string()),
    catalogue: z.array(z.object({ catalogue: z.enum(CATALOGUES), id: z.string().min(1) }).strict()),
    source: SourceRecordSchema,
  }).strict(),
  classifications: z.array(ClassificationSchema),
  relations: z.array(RelationshipSchema),
  evidence: z.array(z.string()),
}).strict().superRefine((e, ctx) => {
  for (const r of e.relations) if (r.source !== e.id) ctx.addIssue({ code: 'custom', message: `${e.id} holds a relation from ${r.source}` });
});

export const EphemerisFileSchema = z.object({
  subject: AtlasIdSchema,
  frame: FrameSchema,
  scale: z.literal('TDB'),
  unit: z.literal('km'),
  velocityUnit: z.literal('km/s'),
  stepDays: z.number().positive(),
  source: SourceRecordSchema,
  rows: z.array(z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])).min(2),
}).strict().superRefine((f, ctx) => {
  for (let i = 1; i < f.rows.length; i++) {
    if ((f.rows[i]?.[0] ?? 0) <= (f.rows[i - 1]?.[0] ?? 0)) { ctx.addIssue({ code: 'custom', message: `${f.subject}: rows out of epoch order at ${i}` }); return; }
  }
});

export const ElementsSchema = z.object({
  subject: AtlasIdSchema,
  frame: FrameSchema,
  epoch: EpochSchema,
  a: QuantitySchema,
  e: z.number().min(0).lt(1),
  i: z.number(),
  node: z.number(),
  argPeri: z.number(),
  validity: z.object({ from: z.string(), to: z.string() }).strict(),
  model: z.string().min(1),
  source: SourceRecordSchema,
}).strict();
export const ElementsFileSchema = z.array(ElementsSchema);

export const StarSampleSchema = z.object({
  release: z.literal('gaia-dr3'),
  criteria: z.object({ parallaxMasGt: z.number(), parallaxOverErrorGt: z.number(), ruweLt: z.number() }).strict(),
  query: z.string().min(1),
  members: z.array(AtlasIdSchema),
  removedByCuts: z.array(z.object({ sourceId: z.string(), name: z.string().nullable(), failed: z.array(z.string()) }).strict()),
}).strict();

export const CrossMatchSchema = z.object({
  entity: AtlasIdSchema,
  records: z.tuple([SourceRecordSchema, SourceRecordSchema]),
  basis: z.enum(['published-cross-identification', 'shared-catalogue-identifier', 'position-match']),
  gaiaDr3: z.string().nullable(),
  absenceChecked: z.string().min(1),
  tolerance: QuantitySchema.optional(),
}).strict();

export const StarsFileSchema = z.object({ sample: StarSampleSchema, crossMatches: z.array(CrossMatchSchema) }).strict();

export const ConformerSchema = z.object({
  molecule: AtlasIdSchema,
  source: SourceRecordSchema,
  unit: z.literal('angstrom'),
  atoms: z.array(z.object({ index: z.number().int().positive(), element: AtlasIdSchema, position: Vector3Schema }).strict()).min(1),
  bonds: z.array(z.object({ a: z.number().int(), b: z.number().int(), order: z.union([z.literal(1), z.literal(2), z.literal(3)]) }).strict()),
}).strict();
export const MoleculesFileSchema = z.array(ConformerSchema);

export const PrecisionFileSchema = z.array(z.object({
  subject: AtlasIdSchema,
  maxError: QuantitySchema,
  heldOut: z.number().int().positive(),
  model: z.object({ name: z.string(), version: z.string() }).strict(),
}).strict());

export const AttributionFileSchema = z.array(z.object({
  source: z.string().min(1),
  role: z.string().min(1),
  licence: z.string().min(1),
  attribution: z.string().min(1),
  citation: z.array(z.string()),
  pages: z.array(z.string()),
}).strict());

export const EntitiesFileSchema = z.array(EntitySchema);
export const ObservationsFileSchema = z.array(ObservationSchema);

// The manifest (contracts/manifest.md). Nulls are placeholders; `reproducible` is written last.
const FileSum = z.object({ file: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict();
export const ManifestSourceSchema = z.object({
  name: z.string(),
  role: z.string(),
  endpoint: z.string(),
  query: z.unknown().nullable(),
  retrieval_time: z.string().nullable(),
  source_release: z.unknown().nullable(),
  api_version: z.string().nullable().optional(),
  licence: z.string().nullable(),
  attribution: z.string().nullable(),
  citation: z.array(z.string()).nullable(),
  terms_pages: z.array(z.string()).nullable(),
  raw: z.array(FileSum).nullable(),
  curated: z.array(FileSum).nullable(),
}).strict();
export const ManifestSchema = z.object({
  atlas_release: z.string(),
  test_release: z.boolean().optional(),
  generated_at: z.string().nullable(),
  reproducible: z.boolean().optional(),
  units_policy: z.string(),
  window: z.object({ from: z.string(), to: z.string(), scale: z.literal('TDB') }).strict(),
  sources: z.array(ManifestSourceSchema),
  validation_report: z.string().nullable(),
}).strict();

export type Entity = z.infer<typeof EntitySchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Predicate = z.infer<typeof PredicateSchema>;
export type EphemerisFile = z.infer<typeof EphemerisFileSchema>;
export type Elements = z.infer<typeof ElementsSchema>;
export type StarSample = z.infer<typeof StarSampleSchema>;
export type CrossMatch = z.infer<typeof CrossMatchSchema>;
export type StarsFile = z.infer<typeof StarsFileSchema>;
export type Conformer = z.infer<typeof ConformerSchema>;
export type Precision = z.infer<typeof PrecisionFileSchema>[number];
export type Attribution = z.infer<typeof AttributionFileSchema>[number];
export type Manifest = z.infer<typeof ManifestSchema>;
export type ManifestSource = z.infer<typeof ManifestSourceSchema>;
export type Uncertainty = z.infer<typeof UncertaintySchema>;
