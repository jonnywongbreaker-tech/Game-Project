/** Small geometry helpers shared by theme skins (pure string builders). */
import {random} from 'remotion';
import type {Vec} from '../kit/puppet';

export const poly = (pts: Vec[]) => `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')}`;

/** Path through points with rounded corners (quadratic smoothing). */
export function smoothPath(pts: Vec[], closed = true): string {
  const n = pts.length;
  const mid = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!closed) {
    if (n < 3) return poly(pts);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      d += ` Q ${pts[i][0]} ${pts[i][1]} ${m[0]} ${m[1]}`;
    }
    return d + ` L ${pts[n - 1][0]} ${pts[n - 1][1]}`;
  }
  let d = `M ${mid(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  }
  return d + ' Z';
}

/**
 * Hand-drawn wobble WITHOUT SVG filters: resamples a polygon and jitters it.
 * `boil` changes every few frames so lines shimmer like redrawn animation.
 */
export function wobbly(pts: Vec[], amp: number, seed: string, boil: number, closed = true, density = 22): string {
  const out: Vec[] = [];
  const segs = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.round(len / density));
    for (let s = 0; s < steps; s++) {
      const k = s / steps;
      const j = (q: string) => (random(`${seed}-${boil}-${i}-${s}-${q}`) - 0.5) * 2 * amp;
      out.push([a[0] + (b[0] - a[0]) * k + j('x'), a[1] + (b[1] - a[1]) * k + j('y')]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return smoothPath(out, closed);
}

export const rectPts = (x: number, y: number, w: number, h: number): Vec[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const circlePts = (cx: number, cy: number, r: number, n = 18): Vec[] =>
  Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r] as Vec);

/** Arched window outline (rectangle with a semicircular top). */
export function archPts(x: number, y: number, w: number, h: number, n = 14): Vec[] {
  const r = w / 2;
  const top: Vec[] = Array.from({length: n + 1}, (_, i) => {
    const a = Math.PI + (i / n) * Math.PI;
    return [x + r + Math.cos(a) * r, y + r + Math.sin(a) * r] as Vec;
  });
  return [[x, y + h], ...top, [x + w, y + h]];
}
export const archPath = (x: number, y: number, w: number, h: number) => `M ${x} ${y + h} L ${x} ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L ${x + w} ${y + h} Z`;

export const lerpV = (a: Vec, b: Vec, k: number): Vec => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
