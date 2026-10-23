// The small in-context text for the selection: its canonical name, its distance from the Sun with
// the unit, its radius or "missing", how much larger than measured it is drawn, and the source record
// behind each line.
import type { DerivedState, Model } from '../model/derived';
import { norm, toMetres, type PositionAtEpoch } from '../model/frames';
import { IDS, type AtlasId } from '../model/ids';
import type { StarState } from '../model/parallax';
import type { CrossMatch, SourceRecord } from '../model/schema';
import { quantity, readableDistance } from '../model/units';
import type { ResolvedMark } from '../renderers/representation-types';
import { formatFactor } from '../renderers/representation';
import { fmt, h, replace } from './dom';

export const recordText = (s: SourceRecord): string => `${s.dataset} · ${s.release} · ${s.record}`;

const KIND_WORDS: Record<string, string> = {
  Star: 'star', Planet: 'planet', Moon: 'moon', SmallBody: 'small body', Substance: 'substance', MoleculeType: 'molecule type', AtomType: 'atom type',
};

const line = (field: string, label: string, value: string, source: string | null) =>
  h('div', { class: 'meta-line', 'data-field': field },
    h('dt', {}, label),
    h('dd', {}, h('span', { class: 'meta-value' }, value), source ? h('span', { class: 'meta-source' }, source) : null));

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
  if (d.value === null) rows.push(line('distance', 'distance from the Sun', 'missing', plx ? recordText(plx.source) : null));
  else {
    const u = d.uncertainty?.kind === 'interval' ? d.uncertainty : null;
    const sig = u ? rangeFigures(d.value.value, u.low, u.high) : 4;
    const range = u ? `, range ${fmt(u.low, sig)} to ${fmt(u.high, sig)} ${d.value.unit}` : ', no range: the parallax has no uncertainty';
    rows.push(line('distance', 'distance from the Sun', `${fmt(d.value.value, sig)} ${d.value.unit}${range}`, `derived by ${d.model.name} from the parallax`));
  }
  if (plx) {
    const sigma = plx.uncertainty?.kind === 'stddev' ? ` ± ${fmt(plx.uncertainty.sigma, 3)}` : '';
    rows.push(line('parallax', 'parallax', plx.value === null ? 'missing' : `${fmt(plx.value, 7)}${sigma} ${plx.unit}`, recordText(plx.source)));
  }
  if (cross) {
    rows.push(line('cross-match', 'cross-match', `entered through ${BASIS_WORDS[cross.basis]}`, cross.records.map(recordText).join(' = ')));
  }
  return rows;
};

export const distanceFromSun = (p: DerivedState<PositionAtEpoch>) => readableDistance(quantity(norm(toMetres(p.value)), 'm'));

export const metadata = () => {
  const el = h('aside', { class: 'metadata mono', 'aria-label': 'selection', 'aria-live': 'polite' });
  return {
    el,
    update(i: MetadataInput) {
      const e = i.selection ? i.model.entities.get(i.selection) : undefined;
      el.hidden = !e;
      if (!e || !i.selection) { replace(el); return; }
      const rows: HTMLElement[] = [line('name', 'name', e.names.canonical, recordText(e.names.source))];
      const pos = i.positions.get(i.selection);
      const ephemeris = i.model.ephemerides.get(i.selection);
      if (pos && i.selection !== IDS.sun) {
        const d = distanceFromSun(pos);
        const precision = pos.precision ? `, stated precision ${fmt(pos.precision.value, 3)} ${pos.precision.unit}` : '';
        const src = ephemeris ? `${recordText(ephemeris.source)} · derived by ${pos.model.name}${precision}` : null;
        rows.push(line('distance', 'distance from the Sun', `${fmt(d.value, 5)} ${d.unit}`, src));
      }
      const r = i.model.observations.measured(i.selection, 'meanRadius');
      if (r.observation) {
        rows.push(line('radius', 'mean radius', r.value === null ? 'missing' : `${fmt(r.value, 6)} ${r.observation.unit}`, recordText(r.observation.source)));
      }
      if (i.mark?.exaggeration) {
        rows.push(line('exaggeration', 'drawn', `exaggerated ×${formatFactor(i.mark.exaggeration)} larger than measured`, 'the distance is true'));
      }
      if (i.mark?.radiusMissing) rows.push(line('mark', 'mark', 'a point: the radius is missing', null));
      if (i.star) rows.push(...starLines(i.model, i.star, i.crossMatch));
      replace(el,
        h('h2', { class: 'meta-name' }, e.names.canonical),
        h('p', { class: 'meta-kind' }, KIND_WORDS[e.kind] ?? e.kind),
        h('dl', {}, ...rows, ...(i.extra ?? [])));
    },
  };
};
