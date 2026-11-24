/**
 * Terrain kit: heightfield landscapes with a carved river, slope/height
 * colouring, flattened stylized water, and scatter helpers for vegetation.
 */
import {random} from 'remotion';
import {cone} from './primitives';
import {type Poly, type V3} from './space';

export interface TerrainSpec {
  x: [number, number];
  z: [number, number];
  cols: number;
  rows: number;
  height: (x: number, z: number) => number;
  water: number;
  colors: {water: string; sand: string; grass: string[]; rock: string};
  seed: string;
}

export function terrain(s: TerrainSpec): Poly[] {
  const out: Poly[] = [];
  const dx = (s.x[1] - s.x[0]) / s.cols;
  const dz = (s.z[1] - s.z[0]) / s.rows;
  const H = (x: number, z: number) => Math.max(s.water, s.height(x, z));
  for (let i = 0; i < s.cols; i++) {
    for (let k = 0; k < s.rows; k++) {
      const x0 = s.x[0] + i * dx;
      const z0 = s.z[0] + k * dz;
      const pts: V3[] = [[x0, H(x0, z0), z0], [x0 + dx, H(x0 + dx, z0), z0], [x0 + dx, H(x0 + dx, z0 + dz), z0 + dz], [x0, H(x0, z0 + dz), z0 + dz]];
      const raw = [s.height(x0, z0), s.height(x0 + dx, z0), s.height(x0 + dx, z0 + dz), s.height(x0, z0 + dz)];
      const avg = raw.reduce((a, b) => a + b, 0) / 4;
      // normal from the two diagonals
      const a = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], pts[2][2] - pts[0][2]];
      const b = [pts[3][0] - pts[1][0], pts[3][1] - pts[1][1], pts[3][2] - pts[1][2]];
      let n: V3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const l = Math.hypot(...n) || 1;
      n = [n[0] / l, n[1] / l, n[2] / l];
      if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
      const under = raw.every((h) => h <= s.water + 0.02);
      const slope = 1 - n[1];
      const r = random(`${s.seed}-${i}-${k}`);
      const color = under ? s.colors.water : avg < s.water + 0.3 ? s.colors.sand : slope > 0.5 || avg > 15 ? s.colors.rock : s.colors.grass[Math.floor(r * s.colors.grass.length)];
      out.push({pts, n: under ? [0, 1, 0] : n, m: {color, kind: under ? 'water' : 'matte'}, bias: under ? 0.4 : 0.5});
    }
  }
  return out;
}

/** Seeded scatter points accepted by a predicate (e.g. "on grass, away from the river"). */
export function scatter(count: number, x: [number, number], z: [number, number], seed: string, accept: (x: number, z: number) => boolean, tries = 6): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < count * tries && out.length < count; i++) {
    const px = x[0] + random(`${seed}-x${i}`) * (x[1] - x[0]);
    const pz = z[0] + random(`${seed}-z${i}`) * (z[1] - z[0]);
    if (accept(px, pz)) out.push([px, pz]);
  }
  return out;
}

/** Low-poly mountain with a snow cap. */
export function mountain(base: V3, r: number, h: number, rockColor: string, snow: string, seed: string): Poly[] {
  const sides = 6 + Math.floor(random(`${seed}-s`) * 3);
  const ph = random(`${seed}-p`) * 3;
  return [...cone(base, r, h, sides, {color: rockColor}, ph), ...cone([base[0], base[1] + h * 0.68, base[2]], r * 0.33, h * 0.33, sides, {color: snow}, ph).map((p) => ({...p, bias: -0.5}))];
}
