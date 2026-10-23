// The molecular regime: what the focus is made of, never a continuation of spatial zoom (FR-015).
// Three views. The substance view: the substance the focus is a representative of, labelled as such
// with its relationship's status. The molecule view: the conformer through the conformer plane, atoms
// as marks with their element symbols, bonds as physical lines, each atom type's count beside the
// molecule. The atom-type view: the element with its atomic number and source. Nothing here is sized
// by anything astronomical, and nothing here is an orbit track.
import type { Model } from '../model/derived';
import type { AtlasId } from '../model/ids';
import { atomPosition, conformerOf } from '../model/molecules';
import type { Entity, Status } from '../model/schema';
import type { NavigationState } from '../navigation/state';
import { bestFitPlane, conformerPlane } from '../projections/conformer-plane';
import { drawMarkDecorations } from './orbit-geometry';
import type { Renderer } from './renderer';
import type { ResolvedLine, ResolvedMark } from './representation-types';

/** Marks in the molecular regime are glyphs of a fixed size: their size says nothing about the thing. */
export const SUBSTANCE_PX = 26;
export const ATOM_PX = 15;

export interface Part { readonly id: AtlasId; readonly name: string; readonly symbol: string | null; readonly count: number; readonly hasSourceRecord: boolean }
export interface Composition { readonly marks: ResolvedMark[]; readonly lines: ResolvedLine[]; readonly parts: Part[] }

const hasSource = (e: Entity) => Boolean(e.names.source?.dataset && e.names.source.record);

const mark = (e: Entity, s: NavigationState, at: { x: number; y: number }, radiusPx: number, label: string | null, status: Status, extra: Partial<ResolvedMark> = {}): ResolvedMark => ({
  id: e.id as AtlasId, name: e.names.canonical, kind: e.kind, shape: 'disc', at, radiusPx, visible: true,
  style: { fill: 'cream', stroke: 'ink', lineWidth: 1.5 }, exaggeration: null, radiusMissing: false,
  status, hasSourceRecord: hasSource(e), selected: s.selection === e.id, focused: s.focus === e.id,
  label, labelPriority: s.focus === e.id ? 100 : 50, alpha: 1, ...extra,
});

/** "water · representative substance of Earth", from the relationship that says so. */
const substanceLabel = (model: Model, id: AtlasId): { label: string; status: Status } => {
  const e = model.entities.get(id);
  const rep = model.entities.incomingTo(id, 'representativeOf')[0];
  const name = e?.names.canonical ?? id;
  return rep ? { label: `${name} · representative substance of ${model.entities.name(rep.source as AtlasId)}`, status: rep.status } : { label: name, status: e && hasSource(e) ? 'observed' : 'illustrative' };
};

export const resolveComposition = (s: NavigationState, model: Model, viewport: { width: number; height: number }): Composition => {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const marks: ResolvedMark[] = [];
  const lines: ResolvedLine[] = [];
  const parts: Part[] = [];
  const focus = model.entities.get(s.focus);
  if (!focus) return { marks, lines, parts };

  if (focus.kind === 'MoleculeType') {
    const c = conformerOf(model.molecules, focus.id as AtlasId);
    if (!c) return { marks, lines, parts };
    const plane = bestFitPlane(c.atoms);
    const view = conformerPlane.fit(c, viewport);
    const at = new Map<number, { x: number; y: number }>();
    for (const a of c.atoms) {
      const p = atomPosition(c, a.index);
      if (!p) continue;
      const q = conformerPlane.project(p, plane, view);
      at.set(a.index, { x: q.x, y: q.y });
    }
    for (const b of c.bonds) {
      const p = at.get(b.a);
      const q = at.get(b.b);
      if (p && q) lines.push({ id: `bond:${c.molecule}:${b.a}-${b.b}`, of: c.molecule as AtlasId, points: [p, q], closed: false, visible: true, style: { vocabulary: 'physical', stroke: 'ink', width: 1.5 * b.order } });
    }
    for (const a of c.atoms) {
      const e = model.entities.get(a.element as AtlasId);
      const p = at.get(a.index);
      if (!e || !p) continue;
      marks.push(mark(e, s, p, ATOM_PX, e.names.aliases[0] ?? e.names.canonical, 'observed', { shape: 'atom', atom: a.index, focused: false, labelPriority: 80 }));
    }
    for (const r of model.entities.outgoing(focus.id as AtlasId, 'hasPart')) {
      const e = model.entities.get(r.target as AtlasId);
      if (e && r.count !== undefined) parts.push({ id: e.id as AtlasId, name: e.names.canonical, symbol: e.names.aliases[0] ?? null, count: r.count, hasSourceRecord: hasSource(e) });
    }
    return { marks, lines, parts };
  }

  if (focus.kind === 'AtomType') {
    const z = model.observations.measured(focus.id as AtlasId, 'atomicNumber').value;
    const symbol = focus.names.aliases[0];
    marks.push(mark(focus, s, { x: cx, y: cy }, SUBSTANCE_PX, `${focus.names.canonical}${symbol ? ` · ${symbol}` : ''} · atomic number ${z === null ? 'missing' : z}`, 'observed'));
    return { marks, lines, parts };
  }

  // The substance view: from a body, the substance it is a representative of; from a substance, the
  // substance and the molecule type it is composed of.
  const substance = focus.kind === 'Substance' ? (focus.id as AtlasId) : (model.entities.outgoing(focus.id as AtlasId, 'representativeOf')[0]?.target as AtlasId | undefined);
  const se = substance ? model.entities.get(substance) : undefined;
  if (!se || !substance) return { marks, lines, parts };
  const { label, status } = substanceLabel(model, substance);
  marks.push(mark(se, s, { x: cx, y: cy }, SUBSTANCE_PX, label, status));
  if (focus.kind === 'Substance') {
    for (const r of model.entities.outgoing(substance, 'composedOf')) {
      const m = model.entities.get(r.target as AtlasId);
      if (!m) continue;
      const formula = m.names.aliases[0];
      marks.push(mark(m, s, { x: cx + 170, y: cy }, SUBSTANCE_PX * 0.7, `${m.names.canonical}${formula ? ` · ${formula}` : ''} · molecule type`, r.status));
    }
  }
  return { marks, lines, parts };
};

const atomGlyph = (r: Renderer, m: ResolvedMark) => {
  r.disc(m.at, m.radiusPx, { fill: 'cream', alpha: m.alpha });
  r.ring(m.at, m.radiusPx, { stroke: 'ink', lineWidth: 1.5, alpha: m.alpha });
  drawMarkDecorations(r, m);
  if (m.label) r.textAnchor({ x: m.at.x, y: m.at.y + 4 }, m.label, { face: 'mono', size: 12, weight: 500, colour: 'ink', align: 'center', priority: m.labelPriority });
};

/** A glyph for the substance and molecule views; an illustrative relationship draws the dashed ring of R11. */
const substanceGlyph = (r: Renderer, m: ResolvedMark) => {
  r.disc(m.at, m.radiusPx, { fill: 'cream', alpha: m.alpha });
  r.ring(m.at, m.radiusPx, m.status === 'illustrative' ? { stroke: 'ink', lineWidth: 1.5, dash: [4, 3] } : { stroke: 'ink', lineWidth: 1.5 });
  drawMarkDecorations(r, m);
  if (m.label) r.textAnchor({ x: m.at.x, y: m.at.y + m.radiusPx + 20 }, m.label, { face: 'mono', size: 12, colour: 'ink', align: 'center', priority: m.labelPriority });
};

export const drawComposition = (r: Renderer, c: { marks: readonly ResolvedMark[]; lines: readonly ResolvedLine[]; parts?: readonly Part[] }, viewport: { width: number; height: number }) => {
  for (const l of c.lines) if (l.visible) r.polyline(l.points, l.style, l.closed);
  for (const m of c.marks) if (m.visible) (m.shape === 'atom' ? atomGlyph : substanceGlyph)(r, m);
  const parts = c.parts ?? [];
  if (c.lines.length) r.textAnchor({ x: viewport.width / 2, y: viewport.height / 2 - viewport.height * 0.25 }, conformerPlane.flattens.words, { face: 'mono', size: 11, colour: 'muted', align: 'center', priority: 60 });
  parts.forEach((p, k) => {
    r.textAnchor({ x: viewport.width / 2, y: viewport.height / 2 + viewport.height * 0.22 + k * 18 }, `${p.symbol ?? ''} ${p.name.toLowerCase()} × ${p.count}`.trim(), { face: 'mono', size: 12, colour: 'ink', align: 'center', priority: 70 });
  });
};

