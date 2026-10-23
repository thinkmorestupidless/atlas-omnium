// The lock-up: the product's name and its promise, with their full stops.
import { h } from './dom';

export const lockup = (): HTMLElement =>
  h('header', { class: 'lockup' },
    h('h1', { class: 'display' }, 'Atlas Omnium', h('span', { class: 'stop' }, '.')),
    h('p', { class: 'mono promise' }, 'Every place. Every scale. Everything we know.'));
