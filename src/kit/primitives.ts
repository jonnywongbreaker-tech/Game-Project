/**
 * Geometric primitives and transforms for Space scenes. Everything returns
 * plain Poly arrays so generators compose freely. Deterministic.
 */
import {random} from 'remotion';
import {add, cross, type Material, normalize, type Poly, scale, sub, type V3} from './space';

export type Vec2 = [number, number];

// ---------------------------------------------------------------- transforms
/** Rotate v around a unit axis by angle (radians) — Rodrigues. */
export function rotateAxis(v: V3, axis: V3, angle: number): V3 {
  const k = normalize(axis);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const kv = cross(k, v);
  const kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}

export interface Xform {
  rotate?: {axis: V3; angle: number; origin?: V3};
  scale?: number | V3;
  translate?: V3;
}

export function transform(polys: Poly[], x: Xform): Poly[] {
  const sc: V3 = typeof x.scale === 'number' ? [x.scale, x.scale, x.scale] : x.scale ?? [1, 1, 1];
  const o = x.rotate?.origin ?? [0, 0, 0];
  const pt = (p: V3): V3 => {
    let q: V3 = [p[0] * sc[0], p[1] * sc[1], p[2] * sc[2]];
    if (x.rotate) q = add(rotateAxis(sub(q, o), x.rotate.axis, x.rotate.angle), o);
    return x.translate ? add(q, x.translate) : q;
  };
  const nrm = (n: V3): V3 => normalize(x.rotate ? rotateAxis([n[0] / sc[0], n[1] / sc[1], n[2] / sc[2]], x.rotate.axis, x.rotate.angle) : [n[0] / sc[0], n[1] / sc[1], n[2] / sc[2]]);
  return polys.map((p) => ({...p, pts: p.pts.map(pt), n: nrm(p.n)}));
}

const faceNormal = (pts: V3[]): V3 => normalize(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));

// ---------------------------------------------------------------- solids
export type FaceMats = Material | {top?: Material; bottom?: Material; side?: Material; front?: Material; back?: Material};
const pick = (m: FaceMats, f: 'top' | 'bottom' | 'side' | 'front' | 'back'): Material =>
  'color' in m ? (m as Material) : (m as Record<string, Material>)[f] ?? (m as Record<string, Material>).side!;

/** Axis-aligned box from its base centre. */
export function box(base: V3, size: V3, m: FaceMats, opts: {bottom?: boolean; bias?: number} = {}): Poly[] {
  const [w, h, d] = size;
  const x0 = base[0] - w / 2, x1 = base[0] + w / 2, y0 = base[1], y1 = base[1] + h, z0 = base[2] - d / 2, z1 = base[2] + d / 2;
  const P = (pts: V3[], n: V3, f: 'top' | 'bottom' | 'side' | 'front' | 'back'): Poly => ({pts, n, m: pick(m, f), bias: opts.bias});
  const out: Poly[] = [
    P([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], 'top'),
    P([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], 'front'),
    P([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], 'back'),
    P([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], 'side'),
    P([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], 'side'),
  ];
  if (opts.bottom) out.push(P([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], 'bottom'));
  return out;
}

/**
 * Extrude a 2D outline (CCW) along a frame: outline lives in the (u, v) plane at
 * `origin`, extruded `depth` along w = u × v. Caps + side walls.
 */
export function extrude(shape: Vec2[], depth: number, frame: {origin: V3; u: V3; v: V3}, m: {cap: Material; side: Material; backCap?: Material}, opts: {caps?: boolean} = {}): Poly[] {
  const w = normalize(cross(frame.u, frame.v));
  const at = (p: Vec2, z: number): V3 => add(add(frame.origin, add(scale(frame.u, p[0]), scale(frame.v, p[1]))), scale(w, z));
  const front = shape.map((p) => at(p, depth / 2));
  const back = shape.map((p) => at(p, -depth / 2));
  const out: Poly[] = [];
  if (opts.caps !== false) {
    out.push({pts: front, n: w, m: m.cap});
    out.push({pts: [...back].reverse(), n: scale(w, -1), m: m.backCap ?? m.cap});
  }
  for (let i = 0; i < shape.length; i++) {
    const j = (i + 1) % shape.length;
    const pts = [front[i], back[i], back[j], front[j]];
    let n = faceNormal(pts);
    const mid = scale(add(front[i], front[j]), 0.5);
    const c = add(frame.origin, scale(w, depth / 2));
    if ((mid[0] - c[0]) * n[0] + (mid[1] - c[1]) * n[1] + (mid[2] - c[2]) * n[2] < 0) n = scale(n, -1);
    out.push({pts, n, m: m.side});
  }
  return out;
}

export const circle = (r: number, n: number, phase = 0): Vec2[] => Array.from({length: n}, (_, i) => [Math.cos(phase + (i / n) * Math.PI * 2) * r, Math.sin(phase + (i / n) * Math.PI * 2) * r] as Vec2);

/** Gear outline: `teeth` trapezoid teeth between root and tip radius. */
export function gearShape(teeth: number, root: number, tip: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const s = (Math.PI * 2) / teeth;
    for (const [da, r] of [[0, root], [s * 0.18, tip], [s * 0.46, tip], [s * 0.64, root]] as [number, number][]) pts.push([Math.cos(a + da) * r, Math.sin(a + da) * r]);
  }
  return pts;
}

/** Vertical cylinder (n-sided prism) from its base centre. */
export function cylinder(base: V3, r: number, h: number, n: number, m: FaceMats): Poly[] {
  return extrude(circle(r, n), h, {origin: add(base, [0, h / 2, 0]), u: [1, 0, 0], v: [0, 0, -1]}, {cap: pick(m, 'top'), side: pick(m, 'side')});
}

export function cone(base: V3, r: number, h: number, n: number, m: Material, phase = 0): Poly[] {
  const apex = add(base, [0, h, 0]);
  return circle(r, n, phase).map((p, i, arr) => {
    const q = arr[(i + 1) % n];
    const pts: V3[] = [add(base, [p[0], 0, p[1]]), apex, add(base, [q[0], 0, q[1]])];
    const nn = faceNormal(pts);
    return {pts, n: nn[1] < 0 ? scale(nn, -1) : nn, m};
  });
}

/** Low-poly sphere (lat-long), good for faceted foliage and stones. */
export function lowSphere(c: V3, r: V3 | number, rings: number, segs: number, m: Material | ((i: number) => Material), jitter = 0, seed = 's'): Poly[] {
  const R: V3 = typeof r === 'number' ? [r, r, r] : r;
  const pt = (i: number, j: number): V3 => {
    const th = (i / rings) * Math.PI;
    const ph = (j / segs) * Math.PI * 2;
    const k = 1 + (i > 0 && i < rings ? (random(`${seed}-${i}-${j % segs}`) - 0.5) * jitter : 0);
    return [c[0] + Math.sin(th) * Math.cos(ph) * R[0] * k, c[1] + Math.cos(th) * R[1] * k, c[2] + Math.sin(th) * Math.sin(ph) * R[2] * k];
  };
  const out: Poly[] = [];
  let f = 0;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const pts = [pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j)].filter((p, k, a) => k === 0 || Math.hypot(...(sub(p, a[k - 1]) as [number, number, number])) > 1e-6);
      if (pts.length < 3) continue;
      let n = faceNormal(pts);
      const mid = scale(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);
      if ((mid[0] - c[0]) * n[0] + (mid[1] - c[1]) * n[1] + (mid[2] - c[2]) * n[2] < 0) n = scale(n, -1);
      out.push({pts, n, m: typeof m === 'function' ? m(f++) : m});
    }
  }
  return out;
}

// ---------------------------------------------------------------- nature
export interface TreeStyle {
  trunk: string;
  leaves: string[];
}

/** Procedural low-poly tree: broadleaf (clustered blobs) or conifer (stacked cones). Varies per seed. */
export function tree(base: V3, height: number, style: TreeStyle, seed: string, kind: 'broadleaf' | 'conifer' = 'broadleaf'): Poly[] {
  const r = (q: string) => random(`${seed}-${q}`);
  const out: Poly[] = [];
  const trunkH = height * (kind === 'conifer' ? 0.25 : 0.42);
  out.push(...cylinder(base, height * 0.035, trunkH + height * 0.1, 5, {top: {color: style.trunk}, side: {color: style.trunk}}));
  if (kind === 'conifer') {
    for (let k = 0; k < 3; k++) {
      const y = trunkH + k * height * 0.22;
      out.push(...cone(add(base, [0, y, 0]), height * (0.32 - k * 0.08), height * 0.38, 7, {color: style.leaves[(k + Math.floor(r('c') * 3)) % style.leaves.length]}, r(`p${k}`) * 3));
    }
    return out;
  }
  const blobs = 2 + Math.floor(r('n') * 3);
  for (let k = 0; k < blobs; k++) {
    const rr = height * (0.22 + r(`r${k}`) * 0.12);
    const c: V3 = add(base, [(r(`x${k}`) - 0.5) * height * 0.35, trunkH + rr * 0.8 + r(`y${k}`) * height * 0.2, (r(`z${k}`) - 0.5) * height * 0.35]);
    out.push(...lowSphere(c, [rr, rr * 0.85, rr], 4, 7, {color: style.leaves[Math.floor(r(`l${k}`) * style.leaves.length)]}, 0.25, `${seed}${k}`));
  }
  return out;
}

export function rock(base: V3, size: number, color: string, seed: string): Poly[] {
  return lowSphere(add(base, [0, size * 0.35, 0]), [size, size * 0.6, size * 0.8], 3, 6, {color}, 0.45, seed);
}

// ---------------------------------------------------------------- shadows
/**
 * Stylized planar cast shadow: projects geometry onto the ground plane along a
 * light direction. Painted as flat colour polygons just above the ground.
 */
export function planarShadow(polys: Poly[], lightDir: V3, groundY: number, color: string, opacity = 1): Poly[] {
  const d = normalize(lightDir);
  if (d[1] >= -0.05 || polys.length === 0) return [];
  const pts: Vec2[] = [];
  for (const p of polys) {
    for (const q of p.pts) {
      const t = (q[1] - groundY) / -d[1];
      pts.push([q[0] + d[0] * t, q[2] + d[2] * t]);
    }
  }
  const hull = convexHull(pts);
  if (hull.length < 3) return [];
  return [{pts: hull.map(([x, z]) => [x, groundY + 0.01, z] as V3), n: [0, 1, 0], m: {color, kind: 'flat'}, bias: 150, opacity}];
}

/** Monotone-chain convex hull (2D). */
export function convexHull(points: Vec2[]): Vec2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Vec2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Vec2[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Shadow of a standing figure of `height` at `feet` (a thin quad on the ground). */
export function figureShadow(feet: V3, height: number, width: number, lightDir: V3, groundY: number, color: string): Poly {
  const d = normalize(lightDir);
  const t = height / Math.max(0.05, -d[1]);
  const tip: V3 = [feet[0] + d[0] * t, groundY + 0.012, feet[2] + d[2] * t];
  const side = normalize(cross([d[0], 0, d[2]], [0, 1, 0]));
  const s = scale(side, width / 2);
  return {pts: [add([feet[0], groundY + 0.012, feet[2]], s), add(tip, scale(s, 0.6)), sub(tip, scale(s, 0.6)), sub([feet[0], groundY + 0.012, feet[2]], s)], n: [0, 1, 0], m: {color, kind: 'flat'}, bias: 140};
}
