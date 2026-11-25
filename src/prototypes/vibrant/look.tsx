/**
 * Vibrant Illustrated Worlds — visual reproduction test (docs/ART_DIRECTION.md).
 * The only new drawing helpers the two test scenes need: smooth organic paths and
 * gradient definitions. Everything else reuses Camera/Layer, time helpers and grain.
 */
import React from 'react';
import {random} from 'remotion';

export type P = [number, number];

/** Smooth path through points (Catmull–Rom converted to cubic Béziers). */
export function smooth(points: P[], closed = true, tension = 1): string {
  const n = points.length;
  const at = (i: number) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: P = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: P = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}

/** A soft ridge line across [x0, x1] closed down to `bottom`; peaks are [x, y] control points. */
export function ridge(x0: number, x1: number, bottom: number, peaks: P[]): string {
  const top = smooth([[x0, peaks[0][1]], ...peaks, [x1, peaks[peaks.length - 1][1]]], false, 0.9);
  return `${top}L${x1} ${bottom}L${x0} ${bottom}Z`;
}

/** Organic blob around a centre: radius varies smoothly by seed. */
export function blob(cx: number, cy: number, r: number, seed: string, wobble = 0.12, points = 9, squash = 1): string {
  const pts: P[] = Array.from({length: points}, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + (random(`${seed}-${i}`) - 0.5) * 2 * wobble;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * squash];
  });
  return smooth(pts, true);
}

type Stop = [number, string, number?];
export const Linear: React.FC<{id: string; stops: Stop[]; x1?: number; y1?: number; x2?: number; y2?: number; user?: boolean}> = ({id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, user}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits={user ? 'userSpaceOnUse' : 'objectBoundingBox'}>
    {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
  </linearGradient>
);
export const Radial: React.FC<{id: string; stops: Stop[]; cx?: number; cy?: number; r?: number; fx?: number; fy?: number; user?: boolean}> = ({id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy, user}) => (
  <radialGradient id={id} cx={cx} cy={cy} r={r} fx={fx ?? cx} fy={fy ?? cy} gradientUnits={user ? 'userSpaceOnUse' : 'objectBoundingBox'}>
    {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
  </radialGradient>
);

/** Soft light glow: a radial gradient disc, never a blur filter (render cost rule). */
export const Glow: React.FC<{x: number; y: number; r: number; id: string; opacity?: number}> = ({x, y, r, id, opacity = 1}) => (
  <circle cx={x} cy={y} r={r} fill={`url(#${id})`} opacity={opacity} />
);
