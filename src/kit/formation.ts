/**
 * Formation morph: many instances travel from a source (e.g. one object in a
 * hand) to target positions in a structure, with staggered timing, growth and
 * spin. The reusable engine for "one thing becomes many / becomes something
 * else" metaphors.
 */
import {ease, tween} from '../engine/time';
import {add, lerp3, scale, type V3} from './space';

export interface MorphState {
  pos: V3;
  scale: number;
  spin: number;
  /** 0..1 progress of this instance. */
  k: number;
}

export function morph(t: number, i: number, opts: {from: V3; to: V3; start: number; stagger: number; duration: number; fromScale: number; arc: number; spin?: number}): MorphState {
  const t0 = opts.start + i * opts.stagger;
  const k = tween(t, [t0, t0 + opts.duration], [0, 1], ease.inOut);
  const p = lerp3(opts.from, opts.to, k);
  const lift = Math.sin(k * Math.PI) * opts.arc;
  // grow with distance travelled, so instances stay small while near their source
  return {pos: add(p, [0, lift, 0]), scale: opts.fromScale + (1 - opts.fromScale) * Math.pow(k, 1.6), spin: (1 - k) * (opts.spin ?? Math.PI), k};
}

/** Spiral staircase layout: step i around a central axis. */
export function spiral(i: number, center: V3, radius: number, rise: number, turn: number): {pos: V3; angle: number} {
  const a = i * turn;
  return {pos: add(center, [Math.sin(a) * radius, i * rise, Math.cos(a) * radius]), angle: a};
}

export const midpoint = (a: V3, b: V3): V3 => scale(add(a, b), 0.5);
