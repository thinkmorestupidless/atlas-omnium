// The inspector: a panel beside the scene that opens on a value, a position, a relationship, an
// entity or the release, and shows where it came from (contracts/surface.md, "Inspector"): the value
// and unit or "missing", the uncertainty, the status mark and word, the source record, the epoch in
// its time scale, the frame, the model and inputs of a derived state, the attribution beside the
// dataset release. Knowledge relations (derived from, observed by, same as) are drawn here only, as
// dashed rules labelled with the predicate (FR-014).
import type { Action, InspectTarget } from '../input/actions';
import type { DerivedState, Model } from '../model/derived';
import { evidenceOf } from '../model/evidence';
import { norm, toMetres, type Frame, type PositionAtEpoch } from '../model/frames';
import type { AtlasId } from '../model/ids';
import type { StarState } from '../model/parallax';
import type { CrossMatch, Observation, Predicate, SourceRecord, Status, Uncertainty } from '../model/schema';
import { epochToIsoUtc, type Epoch } from '../model/time';
import { quantity, readableDistance } from '../model/units';
import { fmt, h, replace } from './dom';
import { criteriaWords } from './legend';
import { statusMark } from './status-marks';

export interface InspectorContext {
  readonly model: Model;
  readonly positions: ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>>;
  readonly stars: ReadonlyMap<AtlasId, StarState>;
  readonly crossMatches: ReadonlyMap<string, CrossMatch>;
}

export const PREDICATE_WORDS: Record<Predicate, string> = {
  orbits: 'orbits', satelliteOf: 'satellite of', hasPart: 'has part', composedOf: 'composed of', representativeOf: 'representative of',
  observedBy: 'observed by', derivedFrom: 'derived from', sameAs: 'same as', supportedBy: 'supported by', supersededBy: 'superseded by',
};

const PROPERTY_WORDS: Record<string, string> = {
  meanRadius: 'mean radius', mass: 'mass', parallax: 'parallax', ra: 'right ascension', dec: 'declination', pmra: 'proper motion in right ascension',
  pmdec: 'proper motion in declination', radialVelocity: 'radial velocity', gMagnitude: 'G magnitude', bpRp: 'BP − RP colour', ruwe: 'RUWE',
  hpMagnitude: 'Hp magnitude', distance: 'distance from the Sun', position: 'position',
};
export const propertyWords = (p: string) => PROPERTY_WORDS[p] ?? p;

/** A Julian date as the time controller writes it: no grouping, to the microday. */
export const jdText = (jd: number) => String(Number(jd.toFixed(6)));

/** The Julian epoch of a catalogue (J2016.0, J1991.25), from its JD. */
const julianEpoch = (jd: number) => `J${Number((2000 + (jd - 2451545) / 365.25).toFixed(2))}`;

/**
 * An epoch in its time scale. A date in the ephemeris window also reads as a UTC instant; a
 * catalogue's epoch (Gaia's in TCB, Hipparcos's in TT before the leap-second table) reads as a Julian
 * epoch, since no UTC date is derived for it.
 */
export const epochText = (e: Epoch): string => {
  let iso = '';
  if (e.scale === 'UTC' || e.scale === 'TDB' || e.scale === 'TT') {
    try { iso = epochToIsoUtc(e).replace('.000Z', ' UTC'); } catch { iso = ''; }
  }
  return `${iso || julianEpoch(e.jd)} · JD ${jdText(e.jd)} ${e.scale}`;
};

export const frameText = (f: Frame): string => {
  switch (f.kind) {
    case 'heliocentric-ecliptic': return 'heliocentric ecliptic of J2000 (ICRF)';
    case 'geocentric-ecliptic': return 'geocentric ecliptic of J2000 (ICRF)';
    case 'icrs-cartesian': return 'ICRS, Cartesian, the Sun at the origin';
    case 'molecular-conformer': return `the molecular frame of ${f.source.dataset} ${f.source.record}`;
  }
};

const uncertaintyText = (u: Uncertainty | undefined, unit: string): string | null => {
  if (!u) return null;
  return u.kind === 'stddev' ? `± ${fmt(u.sigma, 4)} ${unit} (1σ)` : `${fmt(u.low, 7)} to ${fmt(u.high, 7)} ${unit}`;
};

const row = (field: string, label: string, ...value: (Node | string | null)[]) =>
  h('div', { class: 'insp-line', 'data-field': field }, h('dt', {}, label), h('dd', {}, ...value));

const knowledge = (predicate: Predicate, ...inner: (HTMLElement | null)[]) =>
  h('div', { class: 'knowledge', 'data-predicate': predicate }, h('p', { class: 'knowledge-rule' }, h('span', {}, PREDICATE_WORDS[predicate])), ...inner);

export const inspector = (dispatch: (a: Action) => void) => {
  const body = h('div', { class: 'insp-body' });
  const releaseLine = h('p', { class: 'insp-release', 'data-field': 'release' });
  const releaseButton = h('button', { type: 'button', 'data-inspect': 'release' }, 'the release');
  releaseButton.addEventListener('click', () => dispatch({ kind: 'inspect', target: { kind: 'release' } }));
  const close = h('button', { type: 'button', 'aria-label': 'close the inspector' }, 'close');
  close.addEventListener('click', () => dispatch({ kind: 'inspect', target: null }));
  const title = h('h2', {});
  const el = h('aside', { class: 'inspector mono', id: 'inspector', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'inspector', hidden: true },
    h('header', {}, title, close), body, h('footer', {}, releaseLine, releaseButton));

  const go = (target: InspectTarget, text: string) => {
    const b = h('button', { type: 'button', class: 'insp-link' }, text);
    b.addEventListener('click', () => dispatch({ kind: 'inspect', target }));
    return b;
  };

  return {
    el,
    update(target: InspectTarget | null, c: InspectorContext) {
      el.hidden = !target;
      if (!target) { replace(body); return; }
      const { model } = c;
      releaseLine.textContent = `release ${model.release.name}${model.release.reproducible ? ', reproducible' : ', not reproducible'}`;

      const sourceRows = (s: SourceRecord): HTMLElement[] => {
        const a = model.attribution.find((x) => x.source === s.dataset);
        return [
          row('source-dataset', 'dataset', s.dataset),
          row('source-release', 'dataset release', h('span', { 'data-field': 'dataset-release' }, s.release),
            a ? h('span', { class: 'insp-attribution', 'data-field': 'attribution' }, a.attribution) : h('span', { class: 'insp-attribution', 'data-field': 'attribution' }, 'no attribution recorded for this source')),
          row('source-record', 'record', s.record),
          row('source-retrieved', 'retrieved', s.retrieved),
        ];
      };
      const observationRows = (o: Observation): HTMLElement[] => [
        row('value', propertyWords(o.property), o.value === null ? 'missing' : `${fmt(o.value, 10)} ${o.unit}`),
        ...(o.value !== null && o.uncertainty ? [row('uncertainty', 'uncertainty', uncertaintyText(o.uncertainty, o.unit))] : []),
        row('status', 'status', statusMark('observed')),
        ...sourceRows(o.source),
        ...(o.epoch ? [row('epoch', 'epoch', epochText(o.epoch))] : []),
        ...(o.frame ? [row('frame', 'frame', frameText(o.frame))] : []),
        ...(o.method ? [row('method', 'method', o.method)] : []),
      ];
      const crossRows = (cm: CrossMatch | undefined): HTMLElement[] => cm ? [knowledge('sameAs',
        h('dl', {},
          row('cross-match-basis', 'basis of the match', cm.basis.replace(/-/g, ' ')),
          row('cross-match-records', 'records', ...cm.records.map((r) => h('span', { class: 'insp-record', 'data-field': 'cross-match-record' }, `${r.dataset} · ${r.release} · ${r.record}`))),
          row('cross-match-absence', 'absence from Gaia DR3', cm.absenceChecked)))] : [];
      const derivedRows = (d: DerivedState<unknown>): HTMLElement[] => [
        row('status', 'status', statusMark(d.status as Status)),
        row('model', 'model', `${d.model.name} (version ${d.model.version})`),
        ...(d.precision ? [row('precision', 'stated precision', `${fmt(d.precision.value, 3)} ${d.precision.unit}`)] : []),
      ];

      const name = (id: AtlasId) => model.entities.name(id);
      let heading = '';
      const rows: HTMLElement[] = [];

      if (target.kind === 'release') {
        heading = `release ${model.release.name}`;
        const crit = criteriaWords(model);
        rows.push(
          row('release-name', 'release', model.release.name),
          row('release-window', 'supported window', `${model.release.window.from} to ${model.release.window.to}`),
          row('release-reproducible', 'reproducible', model.release.reproducible ? 'yes: rebuilt from its manifest and raw snapshots to the recorded checksums' : 'no: the manifest is not complete'),
          ...model.release.manifest.sources.map((s) => {
            const a = model.attribution.find((x) => x.source === s.name);
            return h('section', { class: 'insp-source', 'data-source': s.name },
              h('h3', {}, s.name),
              h('dl', {},
                row('source-role', 'role', s.role),
                row('source-release', 'dataset release', s.source_release === null || s.source_release === undefined ? 'not yet acquired' : String(s.source_release)),
                row('licence', 'licence', a?.licence ?? s.licence ?? 'not yet recorded'),
                row('attribution', 'attribution', a?.attribution ?? s.attribution ?? 'not yet recorded'),
                ...((a?.citation ?? s.citation ?? []).length ? [row('citations', 'cite', ...(a?.citation ?? s.citation ?? []).map((x) => h('span', { class: 'insp-record' }, x)))] : [])));
          }),
          ...(crit ? [row('star-sample', 'star sample', `${crit.criteria}. ${crit.count}. Catalogue release: ${crit.release}.`)] : []));
      } else if (target.kind === 'value' && target.property === 'distance') {
        heading = `${name(target.subject)}: distance from the Sun`;
        const star = c.stars.get(target.subject);
        const pos = c.positions.get(target.subject);
        if (star) {
          const d = star.distance;
          const u = d.uncertainty;
          rows.push(row('value', 'distance from the Sun', d.value === null ? 'missing' : `${fmt(d.value.value, 8)} ${d.value.unit}`));
          if (d.value !== null && u) rows.push(row('uncertainty', 'uncertainty', uncertaintyText(u, d.value.unit)));
          rows.push(...derivedRows(d));
          const plx = model.observations.get(d.from[0] ?? '');
          if (plx) rows.push(knowledge('derivedFrom', h('dl', {}, ...observationRows(plx))));
          rows.push(...crossRows(c.crossMatches.get(target.subject)));
        } else if (pos) {
          const dist = readableDistance(quantity(norm(toMetres(pos.value)), 'm'));
          rows.push(row('value', 'distance from the Sun', `${fmt(dist.value, 9)} ${dist.unit}`));
          rows.push(...derivedRows(pos));
          rows.push(row('epoch', 'epoch', epochText(pos.value.epoch)), row('frame', 'frame', frameText(pos.value.frame)));
          const eph = model.ephemerides.get(target.subject);
          if (eph) rows.push(knowledge('derivedFrom', h('dl', {}, row('value', 'state vectors', `every ${eph.stepDays} d, ${eph.rows.length} samples, in ${eph.unit}`), ...sourceRows(eph.source))));
          else rows.push(row('from', 'from', pos.from.join(', ')));
        } else rows.push(row('value', 'distance from the Sun', 'missing'));
      } else if (target.kind === 'value') {
        heading = `${name(target.subject)}: ${propertyWords(target.property)}`;
        const m = model.observations.measured(target.subject, target.property as Observation['property']);
        if (m.observation) rows.push(...observationRows(m.observation));
        else rows.push(row('value', propertyWords(target.property), 'missing'), row('source', 'source', 'no source in this release gives it'));
      } else if (target.kind === 'position') {
        heading = `${name(target.subject)}: position`;
        const p = c.positions.get(target.subject) ?? c.stars.get(target.subject)?.position ?? null;
        if (!p) rows.push(row('value', 'position', 'missing'));
        else {
          rows.push(row('value', 'position', `(${p.value.r.map((v) => fmt(v, 7)).join(', ')}) ${p.value.unit}`));
          if (p.uncertainty) rows.push(row('uncertainty', 'distance range', uncertaintyText(p.uncertainty, p.value.unit)));
          rows.push(row('frame', 'frame', frameText(p.value.frame)), row('epoch', 'epoch', epochText(p.value.epoch)), ...derivedRows(p));
          const eph = model.ephemerides.get(target.subject);
          if (eph) rows.push(knowledge('derivedFrom', h('dl', {}, ...sourceRows(eph.source))));
          for (const id of eph ? [] : p.from) {
            const ev = evidenceOf(model, id);
            if (ev.kind === 'observation') rows.push(knowledge('derivedFrom', h('dl', {}, ...observationRows(ev.observation))));
          }
        }
      } else if (target.kind === 'relationship') {
        heading = `${name(target.source)} ${PREDICATE_WORDS[target.predicate as Predicate] ?? target.predicate} ${name(target.target)}`;
        const r = model.entities.outgoing(target.source).find((x) => x.predicate === target.predicate && x.target === target.target);
        if (!r) rows.push(row('value', 'relationship', 'not in this release'));
        else {
          rows.push(row('relationship', 'relationship', heading), row('status', 'status', statusMark(r.status)));
          if (r.count !== undefined) rows.push(row('count', 'count', String(r.count)));
          if (!r.evidence.length) rows.push(row('evidence', 'evidence', r.status === 'illustrative' ? 'none: it is shown for understanding, not asserted' : 'none'));
          for (const id of r.evidence) {
            const ev = evidenceOf(model, id);
            const predicate: Predicate = r.status === 'observed' ? 'observedBy' : 'derivedFrom';
            if (ev.kind === 'unresolved') rows.push(knowledge(predicate, h('dl', {}, row('evidence', 'evidence', `${id}: no record of it in this release`))));
            else if (ev.kind === 'observation') rows.push(knowledge(predicate, h('dl', {}, ...observationRows(ev.observation))));
            else if (ev.kind === 'conformer') rows.push(knowledge(predicate, h('dl', {}, row('value', 'atom list', `${ev.conformer.atoms.length} atoms, ${ev.conformer.bonds.length} bonds, in ${ev.conformer.unit}`), ...sourceRows(ev.source))));
            else rows.push(knowledge(predicate, h('dl', {}, row('value', 'state vectors', `every ${ev.file.stepDays} d, ${frameText(ev.file.frame)}`), ...sourceRows(ev.source))));
          }
        }
      } else {
        const e = model.entities.get(target.subject);
        heading = e ? e.names.canonical : target.subject;
        if (!e) rows.push(row('value', 'entity', 'not in this release'));
        else {
          const id = e.id as AtlasId;
          rows.push(row('atlas-id', 'atlas id', e.id), row('kind', 'kind', e.kind), row('name', 'name', e.names.canonical), ...sourceRows(e.names.source));
          if (e.names.aliases.length) rows.push(row('aliases', 'also called', e.names.aliases.join(', ')));
          const values: HTMLElement[] = [];
          if (c.positions.has(id) || c.stars.get(id)?.position) {
            values.push(go({ kind: 'position', subject: id }, 'position'));
            if (id !== 'atlas:sun') values.push(go({ kind: 'value', subject: id, property: 'distance' }, 'distance from the Sun'));
          }
          for (const o of model.observations.of(id)) values.push(go({ kind: 'value', subject: id, property: o.property }, propertyWords(o.property)));
          if (values.length) rows.push(row('values', 'values', ...values));
          const rels = e.relations.map((r) => go({ kind: 'relationship', source: r.source as AtlasId, predicate: r.predicate, target: r.target as AtlasId }, `${PREDICATE_WORDS[r.predicate]} ${name(r.target as AtlasId)}`));
          if (rels.length) rows.push(row('relationships', 'relationships', ...rels));
        }
      }
      title.textContent = heading;
      replace(body, h('dl', {}, ...rows));
    },
  };
};
