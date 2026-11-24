/** Deterministic particle bursts (dissolves, sparks, dust) in 3D. */
import {random} from 'remotion';
import type {V3} from './space';

export interface Particle {
  pos: V3;
  size: number;
  alpha: number;
}

/**
 * Particles released from `origin` at `start`, drifting with `drift` (m/s) plus
 * random spread, fading over `life` seconds.
 */
export function burst(t: number, origin: V3, start: number, opts: {count: number; life: number; spread: number; drift: V3; size: number; seed: string}): Particle[] {
  const k = (t - start) / opts.life;
  if (k <= 0 || k >= 1) return [];
  const e = 1 - (1 - k) * (1 - k);
  return Array.from({length: opts.count}).map((_, i) => {
    const r = (q: string) => random(`${opts.seed}-${i}-${q}`) - 0.5;
    const delay = (random(`${opts.seed}-${i}-d`) * 0.35);
    const kk = Math.max(0, (k - delay) / (1 - delay));
    const ee = 1 - (1 - kk) * (1 - kk);
    const age = (t - start);
    return {
      pos: [
        origin[0] + r('x') * opts.spread * ee + opts.drift[0] * age + Math.sin(age * 2 + i) * 0.05,
        origin[1] + r('y') * opts.spread * 0.6 * ee + opts.drift[1] * age * (0.6 + random(`${opts.seed}-${i}-v`)),
        origin[2] + r('z') * opts.spread * ee + opts.drift[2] * age,
      ],
      size: opts.size * (0.4 + random(`${opts.seed}-${i}-s`)) * (1 - kk * 0.5),
      alpha: kk <= 0 ? 0 : (1 - kk) * Math.min(1, kk * 6) * (0.6 + 0.4 * random(`${opts.seed}-${i}-a`)) * (e > 0 ? 1 : 0),
    };
  });
}

/** Ambient floating motes inside a vertical cylinder (e.g. a light shaft). */
export function motes(t: number, center: V3, radius: number, height: number, count: number, seed: string): Particle[] {
  return Array.from({length: count}).map((_, i) => {
    const r = (q: string) => random(`${seed}-${i}-${q}`);
    const a = r('a') * Math.PI * 2 + t * 0.05 * (r('s') - 0.5);
    const rad = Math.sqrt(r('r')) * radius;
    const y = (r('y') * height + t * (0.15 + r('v') * 0.25)) % height;
    return {
      pos: [center[0] + Math.sin(a) * rad, center[1] + y, center[2] + Math.cos(a) * rad],
      size: 0.012 + r('z') * 0.025,
      alpha: (0.35 + 0.65 * r('o')) * (0.6 + 0.4 * Math.sin(t * 1.5 + i)),
    };
  });
}
