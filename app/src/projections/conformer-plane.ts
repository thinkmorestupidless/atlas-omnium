// The molecular projection: a conformer's atoms onto their own best-fit plane, orthographic, in
// ångström scaled to pixels. The out-of-plane axis is declared even when nothing lies off the plane
// (water is planar): the frame is the conformer's, never a celestial one (research R7).
import { conformerFrame, type MolecularPosition } from '../model/molecules';
import type { Conformer } from '../model/schema';
import { quantity, type Quantity } from '../model/units';
import type { ScreenPoint } from '../renderers/renderer';

type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V): V => { const n = Math.hypot(...a); return [a[0] / n, a[1] / n, a[2] / n]; };

/** Eigenvectors of a symmetric 3×3 matrix by Jacobi rotation, sorted by eigenvalue, largest first. */
const eigen = (m: number[][]): { values: number[]; vectors: V[] } => {
  const a = m.map((r) => [...r]);
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) off += (a[p]![q]!) ** 2;
    if (off < 1e-30) break;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) {
      const apq = a[p]![q]!;
      if (Math.abs(apq) < 1e-300) continue;
      const theta = (a[q]![q]! - a[p]![p]!) / (2 * apq);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k]![p]!, akq = a[k]![q]!;
        a[k]![p] = c * akp - s * akq; a[k]![q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p]![k]!, aqk = a[q]![k]!;
        a[p]![k] = c * apk - s * aqk; a[q]![k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k]![p]!, vkq = v[k]![q]!;
        v[k]![p] = c * vkp - s * vkq; v[k]![q] = s * vkp + c * vkq;
      }
    }
  }
  const order = [0, 1, 2].sort((i, j) => a[j]![j]! - a[i]![i]!);
  return { values: order.map((i) => a[i]![i]!), vectors: order.map((i) => [v[0]![i]!, v[1]![i]!, v[2]![i]!] as V) };
};

export interface Plane { readonly centre: V; readonly u: V; readonly v: V; readonly normal: V }

/** The best-fit plane of the atoms: through their centroid, normal along the least spread. */
export const bestFitPlane = (atoms: readonly { position: readonly [number, number, number] }[]): Plane => {
  const n = atoms.length;
  const centre = atoms.reduce<V>((s, a) => [s[0] + a.position[0] / n, s[1] + a.position[1] / n, s[2] + a.position[2] / n], [0, 0, 0]);
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const a of atoms) {
    const d = sub(a.position as V, centre);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i]![j]! += d[i]! * d[j]!;
  }
  const { vectors } = eigen(cov);
  const u = unit(vectors[0] as V);
  const normal = unit(cross(u, vectors[1] as V));
  return { centre, u, v: cross(normal, u), normal };
};

/** How far each atom lies off the plane, in ångström. */
export const offPlane = (c: Conformer, plane = bestFitPlane(c.atoms)): Quantity<'angstrom'>[] =>
  c.atoms.map((a) => quantity(Math.abs(dot(sub(a.position as V, plane.centre), plane.normal)), 'angstrom'));

export interface MolecularView { readonly pxPerAngstrom: number; readonly width: number; readonly height: number }

export const conformerPlane = {
  name: 'conformer-plane' as const,
  flattens: { dimension: 'conformer-normal' as const, declared: true as const, words: "seen face-on to the molecule's best-fit plane: distance from it is flattened" },
  /** A view that fits the molecule into a fraction of the viewport's shorter side. */
  fit(c: Conformer, viewport: { width: number; height: number }, fraction = 0.35): MolecularView {
    const plane = bestFitPlane(c.atoms);
    const extent = Math.max(...c.atoms.map((a) => { const d = sub(a.position as V, plane.centre); return Math.hypot(dot(d, plane.u), dot(d, plane.v)); }), 0.5);
    return { pxPerAngstrom: (fraction * Math.min(viewport.width, viewport.height)) / (2 * extent), ...viewport };
  },
  project(p: MolecularPosition, plane: Plane, view: MolecularView): ScreenPoint & { offPlane: Quantity<'angstrom'> } {
    if (p.frame.kind !== 'molecular-conformer') throw new Error(`the conformer plane takes positions in a molecular frame, not ${p.frame.kind}`);
    const d = sub(p.r as V, plane.centre);
    return { x: view.width / 2 + dot(d, plane.u) * view.pxPerAngstrom, y: view.height / 2 - dot(d, plane.v) * view.pxPerAngstrom, offPlane: quantity(dot(d, plane.normal), 'angstrom') };
  },
  frameOf: conformerFrame,
};
