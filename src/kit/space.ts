/**
 * Space: a small, deterministic 3D layer for geometric scenes. Pure math
 * (no React): camera, perspective projection, near-plane clipping, back-face
 * culling and a lighting model (hemisphere ambient, directional, spot and
 * point lights, height fog). Geometry is flat-shaded polygons, which is the
 * "geometric editorial" construction method in real perspective.
 *
 * World units are metres. Y is up.
 */

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const length = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: V3): V3 => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const centroid = (pts: V3[]): V3 => scale(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);

// ---------------------------------------------------------------- camera
export interface Camera3 {
  pos: V3;
  target: V3;
  /** Vertical field of view in degrees. */
  fov: number;
  /** Dutch angle in degrees. */
  roll?: number;
}

export interface View {
  width: number;
  height: number;
  focal: number;
  pos: V3;
  right: V3;
  up: V3;
  forward: V3;
  roll: number;
  near: number;
}

export function makeView(cam: Camera3, width: number, height: number): View {
  const forward = normalize(sub(cam.target, cam.pos));
  let right = cross(forward, [0, 1, 0]);
  if (length(right) < 1e-6) right = [1, 0, 0];
  right = normalize(right);
  const up = cross(right, forward);
  return {width, height, focal: height / 2 / Math.tan(((cam.fov * Math.PI) / 180) / 2), pos: cam.pos, right, up, forward, roll: ((cam.roll ?? 0) * Math.PI) / 180, near: 0.05};
}

/** World point → camera space (x right, y up, z forward). */
export function toCamera(v: View, p: V3): V3 {
  const d = sub(p, v.pos);
  return [dot(d, v.right), dot(d, v.up), dot(d, v.forward)];
}

/** Camera-space point (z > near) → screen pixels. */
export function toScreen(v: View, c: V3): [number, number] {
  let x = (c[0] / c[2]) * v.focal;
  let y = (c[1] / c[2]) * v.focal;
  if (v.roll) {
    const cs = Math.cos(v.roll);
    const sn = Math.sin(v.roll);
    [x, y] = [x * cs - y * sn, x * sn + y * cs];
  }
  return [v.width / 2 + x, v.height / 2 - y];
}

export function projectPoint(v: View, p: V3): {x: number; y: number; z: number; scale: number} | null {
  const c = toCamera(v, p);
  if (c[2] < v.near) return null;
  const [x, y] = toScreen(v, c);
  return {x, y, z: c[2], scale: v.focal / c[2]};
}

/** Sutherland–Hodgman clip of a camera-space polygon against the near plane. */
export function clipNear(pts: V3[], near: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ain = a[2] >= near;
    const bin = b[2] >= near;
    if (ain) out.push(a);
    if (ain !== bin) {
      const k = (near - a[2]) / (b[2] - a[2]);
      out.push(lerp3(a, b, k));
    }
  }
  return out;
}

// ---------------------------------------------------------------- colour
export type RGB = [number, number, number];
export const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
export const hex = (c: RGB) =>
  `#${c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('')}`;
const mixRGB = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ---------------------------------------------------------------- lighting
export type Light =
  | {kind: 'hemisphere'; sky: string; ground: string; intensity: number}
  | {kind: 'directional'; dir: V3; color: string; intensity: number}
  /** Cone of light, e.g. a sunbeam through an oculus. `angle` is the half-angle in degrees. */
  | {kind: 'spot'; pos: V3; dir: V3; angle: number; softness: number; color: string; intensity: number}
  | {kind: 'point'; pos: V3; color: string; intensity: number; range: number};

export interface Atmosphere {
  /** Fog colour near the floor and at the top of the space. */
  low: string;
  high: string;
  /** Height where fog becomes `high`. */
  height: number;
  density: number;
}

export interface Material {
  color: string;
  /** Self-illumination 0..1 (e.g. glowing objects). */
  emissive?: number;
  /** Fraction of light received (0.2 = deep recess). */
  occlusion?: number;
  /** Stylized response. 'flat' ignores lights (used for painted shadows/decals). */
  kind?: 'matte' | 'metal' | 'glass' | 'water' | 'flat';
}

/**
 * The stylized "look": light is quantized into bands, shadows shift toward a
 * cool tint and lights toward a warm tint. This is what makes every scene share
 * one visual identity regardless of subject.
 */
export interface Look {
  /** Number of light bands (0 = smooth). */
  bands: number;
  shadowTint: string;
  lightTint: string;
  /** 0..1: how strongly shadows take on the shadow tint. */
  tintStrength: number;
}

/** Light arriving at a surface point with normal n, as an RGB multiplier. */
export function lightAt(p: V3, n: V3, lights: Light[]): RGB {
  let L: RGB = [0, 0, 0];
  for (const l of lights) {
    if (l.kind === 'hemisphere') {
      const k = n[1] * 0.5 + 0.5;
      L = add(L, scale(mixRGB(rgb(l.ground), rgb(l.sky), k), l.intensity)) as RGB;
    } else if (l.kind === 'directional') {
      const d = Math.max(0, -dot(n, normalize(l.dir)));
      L = add(L, scale(rgb(l.color), l.intensity * d)) as RGB;
    } else if (l.kind === 'spot') {
      const to = sub(p, l.pos);
      const dist = length(to);
      const cos = dot(normalize(to), normalize(l.dir));
      const ang = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
      const cone = 1 - smoothstep(l.angle - l.softness, l.angle + l.softness, ang);
      if (cone > 0) {
        const facing = Math.max(0, -dot(n, normalize(to)));
        L = add(L, scale(rgb(l.color), l.intensity * cone * (0.35 + 0.65 * facing) * Math.min(1, 40 / Math.max(1, dist)))) as RGB;
      }
    } else {
      const to = sub(l.pos, p);
      const dist = length(to);
      if (dist > l.range * 3) continue;
      const facing = Math.max(0, dot(n, scale(to, 1 / (dist || 1))));
      const att = l.intensity / (1 + (dist / l.range) ** 2);
      L = add(L, scale(rgb(l.color), att * (0.3 + 0.7 * facing))) as RGB;
    }
  }
  return L;
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Stylized colour for an albedo under light L (shared by geometry and characters). */
export function stylize(base: RGB, L: RGB, look: Look, extra = 0): RGB {
  const lum = 0.3 * L[0] + 0.59 * L[1] + 0.11 * L[2] + extra;
  const q = look.bands > 0 ? Math.round(lum * look.bands) / look.bands : lum;
  const k = Math.max(0, Math.min(1, q / 1.1));
  const tint = mixRGB(rgb(look.shadowTint), rgb(look.lightTint), k);
  const lightCol = lum > 0 ? ([L[0] / lum, L[1] / lum, L[2] / lum] as RGB) : ([1, 1, 1] as RGB);
  const t = mixRGB([1, 1, 1], tint, look.tintStrength * (1 - k * 0.5));
  return [base[0] * q * t[0] * (0.75 + 0.25 * lightCol[0]), base[1] * q * t[1] * (0.75 + 0.25 * lightCol[1]), base[2] * q * t[2] * (0.75 + 0.25 * lightCol[2])];
}

/** Final colour of a surface: albedo × light + emission, then height fog by distance. */
export function shade(p: V3, n: V3, m: Material, lights: Light[], eye: V3, atmo: Atmosphere, look?: Look): string {
  const base = rgb(m.color);
  const occ = m.occlusion ?? 1;
  let c: RGB;
  if (m.kind === 'flat') {
    c = base;
  } else {
    const L = scale(lightAt(p, n, lights), occ) as RGB;
    let extra = 0;
    if (m.kind === 'metal' || m.kind === 'glass' || m.kind === 'water') {
      // a single stylized specular band toward the strongest directional light
      const key = lights.find((l) => l.kind === 'directional') as Extract<Light, {kind: 'directional'}> | undefined;
      if (key) {
        const view = normalize(sub(eye, p));
        const h = normalize(sub(view, normalize(key.dir)));
        const spec = Math.max(0, dot(n, h));
        extra = spec > 0.93 ? 0.6 : spec > 0.8 ? 0.2 : 0;
      }
    }
    c = look ? stylize(base, L, look, extra) : [base[0] * L[0], base[1] * L[1], base[2] * L[2]];
    if (m.kind === 'glass') c = mixRGB(c, rgb(atmo.high), 0.25);
  }
  if (m.emissive) c = mixRGB(c, base, m.emissive);
  const fogCol = mixRGB(rgb(atmo.low), rgb(atmo.high), Math.max(0, Math.min(1, p[1] / atmo.height)));
  const f = 1 - Math.exp(-length(sub(p, eye)) * atmo.density);
  return hex(mixRGB(c, fogCol, f));
}

// ---------------------------------------------------------------- geometry
export interface Poly {
  pts: V3[];
  /** Outward normal (the side that is drawn). */
  n: V3;
  m: Material;
  /** Depth bias in metres (negative draws in front of coplanar polygons). */
  bias?: number;
  /** Draw both sides (foliage, cutaway walls, thin panels). */
  doubleSided?: boolean;
  opacity?: number;
}

/** Axis-aligned quad helper from 4 corners (counter-clockwise seen from the normal side). */
export const quad = (a: V3, b: V3, c: V3, d: V3, n: V3, m: Material, bias?: number): Poly => ({pts: [a, b, c, d], n, m, bias});
