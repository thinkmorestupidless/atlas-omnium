// The scale rail: a logarithmic physical scale (metres per pixel) beside the scene, the regime bands
// from the resolver's table, where the view is, and the dimension the projection flattens (FR-010).
import { BAND } from '../navigation/resolver';
import type { NavigationState } from '../navigation/state';
import type { Projection } from '../projections/projection';
import type { Action } from '../input/actions';
import { quantity, readableDistance } from '../model/units';
import { fmt, h, replace } from './dom';

export const RAIL = { min: 1e2, max: 1e17 } as const;
const pos = (scale: number) => (Math.log10(scale) - Math.log10(RAIL.min)) / (Math.log10(RAIL.max) - Math.log10(RAIL.min));

export const perPixel = (scale: number): string => {
  const d = readableDistance(quantity(scale, 'm'));
  return `1 px = ${fmt(d.value, 2)} ${d.unit}`;
};

export const scaleRail = (dispatch: (a: Action) => void) => {
  const marker = h('div', { class: 'rail-marker' });
  const readout = h('p', { class: 'mono rail-readout' });
  const note = h('p', { class: 'mono rail-note' });
  const track = h('div', { class: 'rail-track' });
  const bands: [string, number, number, string][] = [
    ['the Solar System', RAIL.min, BAND.inner, 'band-planetary'],
    ['transition', BAND.inner, BAND.outer, 'band-transition'],
    ['nearby stars', BAND.outer, RAIL.max, 'band-stellar'],
  ];
  for (const [name, from, to, cls] of bands) {
    track.append(h('div', { class: `rail-band ${cls}`, style: `bottom:${pos(from) * 100}%;height:${(pos(to) - pos(from)) * 100}%`, title: name },
      cls === 'band-transition' ? null : h('span', { class: 'mono rail-band-name' }, name)));
  }
  for (let e = 3; e <= 16; e += 3) track.append(h('div', { class: 'rail-tick', style: `bottom:${pos(10 ** e) * 100}%` }, h('span', { class: 'mono' }, perPixel(10 ** e))));
  track.append(marker);
  const el = h('section', { class: 'scale-rail', 'aria-label': 'scale rail' },
    h('div', { class: 'rail-slider', role: 'slider', tabindex: 0, 'aria-label': 'scale', 'aria-orientation': 'vertical', 'aria-valuemin': Math.log10(RAIL.min), 'aria-valuemax': Math.log10(RAIL.max) }, track),
    readout, note);
  const slider = el.querySelector('.rail-slider') as HTMLElement;
  slider.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowUp') { dispatch({ kind: 'scale', factor: 2 }); ev.preventDefault(); ev.stopPropagation(); }
    if (ev.key === 'ArrowDown') { dispatch({ kind: 'scale', factor: 0.5 }); ev.preventDefault(); ev.stopPropagation(); }
  });
  return {
    el,
    update(s: NavigationState, projection: Projection) {
      el.hidden = s.mode !== 'spatial';
      marker.style.bottom = `${Math.min(1, Math.max(0, pos(s.scale))) * 100}%`;
      slider.setAttribute('aria-valuenow', Math.log10(s.scale).toFixed(2));
      slider.setAttribute('aria-valuetext', perPixel(s.scale));
      readout.textContent = perPixel(s.scale);
      replace(note, projection.flattens ? (s.regime === 'nearby-stellar'
        ? 'a dimension is flattened: height above the ecliptic shown as a tick'
        : projection.flattens.words) : '');
      note.dataset.flattens = projection.flattens?.dimension ?? '';
    },
  };
};
