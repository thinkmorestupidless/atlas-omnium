// The small in-context text for the selection: its canonical name, its distance from the Sun with
// the unit, its radius or "missing", how much larger than measured it is drawn, and the source record
// behind each line.
import type { DerivedState, Model } from '../model/derived';
import { norm, toMetres, type PositionAtEpoch } from '../model/frames';
import { IDS, type AtlasId } from '../model/ids';
import type { StarState } from '../model/parallax';
import type { CrossMatch, SourceRecord, Status } from '../model/schema';
import { quantity, readableDistance } from '../model/units';
import type { ResolvedMark } from '../renderers/representation-types';
import { formatFactor } from '../renderers/representation';
import type { Action, InspectTarget } from '../input/actions';
import { fmt, h, replace } from './dom';
import { PREDICATE_WORDS, frameText, jdText } from './inspector';
import { statusMark } from './status-marks';

export const recordText = (s: SourceRecord): string => `${s.dataset} · ${s.release} · ${s.record}`;

const KIND_WORDS: Record<string, string> = {
  Star: 'star', Planet: 'planet', Moon: 'moon', SmallBody: 'small body', Substance: 'substance', MoleculeType: 'molecule type', AtomType: 'atom type',
};

/** Set while a panel is drawn: how a value becomes a control that opens the inspector on it. */
let opener: ((t: InspectTarget) => void) | null = null;

const line = (field: string, label: string, value: string, source: string | null, target?: InspectTarget, status?: Status) => {
  let v: HTMLElement;
  if (target && opener) {
    const open = opener;
    v = h('button', { type: 'button', class: 'meta-value', 'data-inspect': target.kind, title: `inspect the ${label}` }, value);
    v.addEventListener('click', () => open(target));
  } else v = h('span', { class: 'meta-value' }, value);
  return h('div', { class: 'meta-line', 'data-field': field },
    h('dt', {}, label),
    h('dd', {}, v, source || status ? h('span', { class: 'meta-source' }, status ? statusMark(status) : null, status && source ? ' · ' : null, source) : null));
};

export interface MetadataInput {
  model: Model;
  selection: AtlasId | null;
  positions: ReadonlyMap<AtlasId, DerivedState<PositionAtEpoch>>;
  mark: ResolvedMark | undefined;
  /** The selection's derived distance and position when it is a star of the sample. */
  star?: StarState | undefined;
  crossMatch?: CrossMatch | undefined;
  /** Extra lines a regime adds. */
  extra?: HTMLElement[];
}

const BASIS_WORDS: Record<CrossMatch['basis'], string> = {
  'published-cross-identification': 'a published cross-identification',
  'shared-catalogue-identifier': 'a shared catalogue identifier',
  'position-match': 'a position match',
};

/** Enough significant figures that the ends of the range read differently. */
const rangeFigures = (value: number, low: number, high: number) => Math.min(9, Math.max(4, Math.ceil(Math.log10(value / Math.max(high - low, 1e-12))) + 2));

const starLines = (model: Model, star: StarState, cross: CrossMatch | undefined): HTMLElement[] => {
  const rows: HTMLElement[] = [];
  const d = star.distance;
  const plx = model.observations.get(d.from[0] ?? '');
  const subject = d.subject;
  if (d.value === null) rows.push(line('distance', 'distance from the Sun', 'missing', plx ? recordText(plx.source) : null, { kind: 'value', subject, property: 'distance' }));
  else {
    const u = d.uncertainty?.kind === 'interval' ? d.uncertainty : null;
    const sig = u ? rangeFigures(d.value.value, u.low, u.high) : 4;
    const range = u ? `, range ${fmt(u.low, sig)} to ${fmt(u.high, sig)} ${d.value.unit}` : ', no range: the parallax has no uncertainty';
    rows.push(line('distance', 'distance from the Sun', `${fmt(d.value.value, sig)} ${d.value.unit}${range}`, `by ${d.model.name} from the parallax`, { kind: 'value', subject, property: 'distance' }, 'derived'));
  }
  if (plx) {
    const sigma = plx.uncertainty?.kind === 'stddev' ? ` ± ${fmt(plx.uncertainty.sigma, 3)}` : '';
    rows.push(line('parallax', 'parallax', plx.value === null ? 'missing' : `${fmt(plx.value, 7)}${sigma} ${plx.unit}`, recordText(plx.source), { kind: 'value', subject, property: 'parallax' }));
  }
  if (cross) {
    rows.push(line('cross-match', 'cross-match', `entered through ${BASIS_WORDS[cross.basis]}`, cross.records.map(recordText).join(' = '), { kind: 'value', subject, property: 'distance' }));
  }
  return rows;
};

export const distanceFromSun = (p: DerivedState<PositionAtEpoch>) => readableDistance(quantity(norm(toMetres(p.value)), 'm'));

export const metadata = (dispatch: (a: Action) => void) => {
  const inspect = (target: InspectTarget) => dispatch({ kind: 'inspect', target });
  const el = h('aside', { class: 'metadata mono', 'aria-label': 'selection', 'aria-live': 'polite' });
  return {
    el,
    update(i: MetadataInput) {
      const e = i.selection ? i.model.entities.get(i.selection) : undefined;
      el.hidden = !e;
      if (!e || !i.selection) { replace(el); return; }
      opener = inspect;
      const sel = i.selection;
      const rows: HTMLElement[] = [line('name', 'name', e.names.canonical, recordText(e.names.source), { kind: 'entity', subject: sel })];
      const pos = i.positions.get(i.selection);
      const ephemeris = i.model.ephemerides.get(i.selection);
      if (pos && i.selection !== IDS.sun) {
        const d = distanceFromSun(pos);
        const precision = pos.precision ? `, stated precision ${fmt(pos.precision.value, 3)} ${pos.precision.unit}` : '';
        const src = ephemeris ? `${recordText(ephemeris.source)} · by ${pos.model.name}${precision}` : null;
        rows.push(line('distance', 'distance from the Sun', `${fmt(d.value, 5)} ${d.unit}`, src, { kind: 'value', subject: sel, property: 'distance' }, 'derived'));
      }
      const where = pos ?? i.star?.position ?? null;
      if (where) rows.push(line('position', 'position', frameText(where.value.frame), `at JD ${jdText(where.value.epoch.jd)} ${where.value.epoch.scale}`, { kind: 'position', subject: sel }));
      const r = i.model.observations.measured(i.selection, 'meanRadius');
      if (r.observation) {
        rows.push(line('radius', 'mean radius', r.value === null ? 'missing' : `${fmt(r.value, 6)} ${r.observation.unit}`, recordText(r.observation.source), { kind: 'value', subject: sel, property: 'meanRadius' }));
      }
      if (i.mark?.exaggeration) {
        rows.push(line('exaggeration', 'drawn', `exaggerated ×${formatFactor(i.mark.exaggeration)} larger than measured`, 'the distance is true'));
      }
      if (i.mark?.radiusMissing) rows.push(line('mark', 'mark', 'a point: the radius is missing', null));
      if (i.star) rows.push(...starLines(i.model, i.star, i.crossMatch));
      for (const r of e.relations) {
        const words = `${PREDICATE_WORDS[r.predicate]} ${i.model.entities.name(r.target as AtlasId)}`;
        rows.push(line('relation', 'relationship', words, null, { kind: 'relationship', source: sel, predicate: r.predicate, target: r.target as AtlasId }, r.status));
      }
      replace(el,
        h('h2', { class: 'meta-name' }, e.names.canonical),
        h('p', { class: 'meta-kind' }, KIND_WORDS[e.kind] ?? e.kind),
        h('dl', {}, ...rows, ...(i.extra ?? [])));
    },
  };
};
