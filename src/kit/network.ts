/**
 * Concept kit: a graph of "memory" nodes with links that grow, strengthen,
 * carry activation pulses, and nodes that fade (forgetting). Reusable for any
 * "things connect / spread / decay" explanation (ideas, neurons, networks).
 */
import {ease, tween} from '../engine/time';

export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  a: string;
  b: string;
  /** Link draws itself between these seconds. */
  grow: [number, number];
}

export interface Activation {
  source: string;
  start: number;
  /** Seconds per hop. */
  hop: number;
}

/** Breadth-first hop distance from `source` through edges that exist at time t. */
export function hops(edges: GraphEdge[], source: string, t: number): Map<string, number> {
  const d = new Map<string, number>([[source, 0]]);
  const q = [source];
  while (q.length) {
    const n = q.shift()!;
    for (const e of edges) {
      if (t < e.grow[1]) continue;
      const other = e.a === n ? e.b : e.b === n ? e.a : null;
      if (other && !d.has(other)) {
        d.set(other, d.get(n)! + 1);
        q.push(other);
      }
    }
  }
  return d;
}

/** 0..1 brightness boost of a node from an activation wave (fast attack, slow decay). */
export function nodePulse(t: number, a: Activation, distance: number | undefined): number {
  if (distance === undefined) return 0;
  const at = a.start + distance * a.hop;
  if (t < at) return 0;
  return tween(t, [at, at + 0.15], [0, 1], ease.out) * tween(t, [at + 0.4, at + 2.2], [1, 0.35]);
}

/** Position (0..1) of the pulse travelling along an edge, or null if none is on it. */
export function edgePulse(t: number, a: Activation, da: number | undefined, db: number | undefined): {from: 'a' | 'b'; k: number} | null {
  if (da === undefined || db === undefined || Math.abs(da - db) !== 1) return null;
  const from = da < db ? 'a' : 'b';
  const start = a.start + Math.min(da, db) * a.hop;
  if (t < start || t > start + a.hop) return null;
  return {from, k: (t - start) / a.hop};
}

/** Link growth 0..1. */
export const edgeGrowth = (t: number, e: GraphEdge) => tween(t, e.grow, [0, 1], ease.inOut);

/** A point on a gently curved link (quadratic, bowed upward), for drawing and pulses. */
export function linkPoint(a: GraphNode, b: GraphNode, k: number, bow = 0.18): [number, number] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * bow;
  const u = 1 - k;
  return [u * u * a.x + 2 * u * k * mx + k * k * b.x, u * u * a.y + 2 * u * k * my + k * k * b.y];
}

export function linkPath(a: GraphNode, b: GraphNode, upTo = 1, bow = 0.18, steps = 24): string {
  let d = '';
  const n = Math.max(2, Math.round(steps * upTo));
  for (let i = 0; i <= n; i++) {
    const [x, y] = linkPoint(a, b, (i / n) * upTo, bow);
    d += `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}
