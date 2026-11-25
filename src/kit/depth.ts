/**
 * Visibility ordering for the Space renderer (painter's algorithm). Pure: no React.
 *
 * `prepare` projects polygons and sprite footprints; `order` returns the draw order.
 * Several strategies are kept side by side so they can be measured against the
 * ray-cast reference in `occlusion.ts` (see PROJECT.md, ADR 8):
 *  - centroid:  each polygon sorts by the mean camera depth of its clipped vertices,
 *               each sprite by its anchor (the original Space behaviour)
 *  - subdivide: large polygons are split into pieces sized relative to their camera
 *               distance, then sorted as above
 *  - object:    items of one object share the depth of the object's nearest point
 *  - planes:    centroid order, then each large polygon is re-placed by exact plane-side
 *               tests against the items overlapping it on screen (in front of its plane →
 *               drawn after it; behind → before; coplanar → by bias). Conflicting constraints
 *               split the polygon in two and retry, a few levels deep.
 * Another strategy (subdivide plus per-sprite plane tests) was measured and dropped: it
 * gave no improvement over subdivision on any case.
 */
import {centroid, clipNear, dot, length, lerp3, type Poly, scale, sub, toCamera, toScreen, type V3, type View} from './space';

export type DepthMethod = 'centroid' | 'subdivide' | 'object' | 'planes';
export const DEPTH_METHODS: readonly DepthMethod[] = ['centroid', 'subdivide', 'object', 'planes'];
/** The renderer's default (ADR 8). */
export const DEFAULT_DEPTH: DepthMethod = 'planes';
export type Pt = [number, number];

/** What the depth stage needs to know about a screen-space sprite. */
export interface SpriteFootprint {
  /** World anchor (the feet of a character). */
  pos: V3;
  bias?: number;
  /** Billboard size in metres [width, height], standing up from `pos`. Unknown extents are treated as points. */
  extent?: [number, number];
  /** Items with the same object id sort together under the `object` method. */
  object?: string;
}

export type Item =
  /** `band` is the original polygon's depth: depth-of-field bands use it so split pieces blur alike. */
  | {kind: 'poly'; source: number; piece: Poly; scr: Pt[]; holes: Pt[][]; z: number; band: number; near: number; split?: boolean; object?: string}
  | {kind: 'sprite'; source: number; x: number; y: number; z: number; band: number; scale: number; rect: [number, number, number, number] | null; object?: string};

export interface DepthOptions {
  /** A piece may span at most this fraction of its distance from the camera (subdivide, hybrid). */
  pieceRatio?: number;
  /** Deepest recursive split (2^depth pieces at most per polygon). */
  maxSplits?: number;
  /** Polygons whose |bias| is at least this are layered backdrops (floors, sky planes) and keep their bias ordering. */
  layerBias?: number;
  /** Object id per polygon (object method). */
  polyObject?: (i: number) => string | undefined;
}

const DEFAULTS = {pieceRatio: 0.25, maxSplits: 6, layerBias: 50};

// ---------------------------------------------------------------- geometry helpers
/** Split a planar polygon by the plane (point o, normal k); returns [front, back]. Convex-exact. */
function split(pts: V3[], o: V3, k: V3): [V3[], V3[]] {
  const front: V3[] = [];
  const back: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const da = dot(sub(a, o), k);
    const db = dot(sub(b, o), k);
    if (da >= 0) front.push(a);
    if (da <= 0) back.push(a);
    if ((da > 0 && db < 0) || (da < 0 && db > 0)) {
      const p = lerp3(a, b, da / (da - db));
      front.push(p);
      back.push(p);
    }
  }
  return [front, back];
}

function extentAxis(pts: V3[]): {size: number; axis: V3} {
  let best = {size: 0, axis: [1, 0, 0] as V3};
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = sub(pts[j], pts[i]);
      const s = length(d);
      if (s > best.size) best = {size: s, axis: scale(d, 1 / s)};
    }
  }
  return best;
}

/** Split a polygon until every piece spans at most `ratio` × its nearest camera distance. */
export function subdivide(p: Poly, eye: V3, ratio: number, maxSplits: number): Poly[] {
  if (p.holes?.length) return [p];
  const out: Poly[] = [];
  const visit = (pts: V3[], depth: number) => {
    const {size, axis} = extentAxis(pts);
    const nearest = Math.min(...pts.map((q) => length(sub(q, eye))));
    if (depth >= maxSplits || size <= ratio * Math.max(nearest, 0.5) || pts.length < 3) {
      if (pts.length >= 3) out.push({...p, pts});
      return;
    }
    const [a, b] = split(pts, centroid(pts), axis);
    visit(a, depth + 1);
    visit(b, depth + 1);
  };
  visit(p.pts, 0);
  return out;
}

// ---------------------------------------------------------------- projection
export interface Prepared {
  items: Item[];
  /** Original polygon per item source (for shading and identity). */
  polys: Poly[];
  sprites: SpriteFootprint[];
}

/** Cull, clip and project; subdivide when the method asks for it. */
export function prepare(view: View, polys: Poly[], sprites: SpriteFootprint[], method: DepthMethod, opts: DepthOptions = {}): Prepared {
  const o = {...DEFAULTS, ...opts};
  const items: Item[] = [];
  const pad = 50;
  polys.forEach((p, source) => {
    const c = centroid(p.pts);
    const facing = dot(p.n, sub(view.pos, c));
    if (facing <= 0 && !p.doubleSided) return;
    // Layered backdrops keep their authored bias; translucent faces stay whole (no seams).
    const big = Math.abs(p.bias ?? 0) < o.layerBias && (p.opacity ?? 1) >= 1;
    const pieces = method === 'subdivide' && big ? subdivide(p, view.pos, o.pieceRatio, o.maxSplits) : [p];
    const whole = clipNear(p.pts.map((q) => toCamera(view, q)), view.near);
    const band = (whole.length ? whole.reduce((a, q) => a + q[2], 0) / whole.length : view.near) + (p.bias ?? 0);
    for (const piece of pieces) {
      const cam = clipNear(piece.pts.map((q) => toCamera(view, q)), view.near);
      if (cam.length < 3) continue;
      const scr = cam.map((q) => toScreen(view, q));
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of scr) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      if (maxX < -pad || minX > view.width + pad || maxY < -pad || minY > view.height + pad) continue;
      const holes = (piece.holes ?? []).map((h) => clipNear(h.map((q) => toCamera(view, q)), view.near))
        .filter((h) => h.length >= 3).map((h) => h.map((q) => toScreen(view, q)));
      const z = cam.reduce((s, q) => s + q[2], 0) / cam.length + (p.bias ?? 0);
      const near = Math.min(...cam.map((q) => q[2]));
      items.push({kind: 'poly', source, piece, scr, holes, z, band, near, split: pieces.length > 1, object: o.polyObject?.(source)});
    }
  });
  sprites.forEach((s, source) => {
    const c = toCamera(view, s.pos);
    if (c[2] < view.near) return;
    const [x, y] = toScreen(view, c);
    const k = view.focal / c[2];
    const rect = s.extent ? [x - (s.extent[0] / 2) * k, y - s.extent[1] * k, x + (s.extent[0] / 2) * k, y] as [number, number, number, number] : null;
    items.push({kind: 'sprite', source, x, y, z: c[2] + (s.bias ?? 0), band: c[2] + (s.bias ?? 0), scale: k, rect, object: s.object});
  });
  if (method === 'subdivide') liftSurfaceDetail(items, polys);
  return {items, polys, sprites};
}

/**
 * Details authored on a surface (windows, trims, signs: parallel, facing the same way, on or
 * just in front of it, with a lower bias) relied on the bias against the whole surface. Once the
 * surface is split, keep each detail in front of the pieces it overlaps on screen.
 */
function liftSurfaceDetail(items: Item[], polys: Poly[]) {
  const pieces = items.filter((it): it is Extract<Item, {kind: 'poly'}> => it.kind === 'poly' && !!it.split);
  if (!pieces.length) return;
  const planeKey = (p: Poly) => `${p.n.map((v) => Math.round(v * 200)).join(',')}`;
  const offset = (p: Poly, q: V3) => dot(p.n, sub(q, p.pts[0]));
  const byNormal = new Map<string, Extract<Item, {kind: 'poly'}>[]>();
  for (const it of pieces) {
    const key = planeKey(polys[it.source]);
    const list = byNormal.get(key) ?? [];
    list.push(it);
    byNormal.set(key, list);
  }
  for (const it of items) {
    if (it.kind !== 'poly' || it.split) continue;
    const detail = polys[it.source];
    const candidates = byNormal.get(planeKey(detail));
    if (!candidates) continue;
    const box = screenBox(it.scr);
    for (const base of candidates) {
      const surface = polys[base.source];
      if ((detail.bias ?? 0) >= (surface.bias ?? 0)) continue;
      const d = offset(surface, centroid(detail.pts));
      if (d < -1e-3 || d > 0.15) continue;
      if (!boxesOverlap(box, screenBox(base.scr))) continue;
      it.z = Math.min(it.z, base.z - 1e-3);
    }
  }
}

const screenBox = (pts: Pt[]) => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of pts) {
    a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y);
  }
  return [a, b, c, d] as const;
};
const boxesOverlap = (p: readonly number[], q: readonly number[]) => p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3];

// ---------------------------------------------------------------- ordering
/** Draw order, back to front. */
type PolyItem = Extract<Item, {kind: 'poly'}>;
type Box = readonly [number, number, number, number];
const boxOf = (pts: Pt[]): Box => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of pts) {
    a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y);
  }
  return [a, b, c, d];
};
const overlap = (p: Box, q: Box) => p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3];

/** Where an item lies relative to a polygon's plane, as seen from the eye. */
function side(view: View, plane: Poly, it: Item, prepared: Prepared): 'front' | 'behind' | 'mixed' {
  const s0 = dot(plane.n, sub(view.pos, plane.pts[0])) >= 0 ? 1 : -1;
  const eps = 0.005;
  let front = false, behind = false;
  const points: V3[] = it.kind === 'poly' ? it.piece.pts : (() => {
    const fp = prepared.sprites[it.source];
    const h = fp.extent?.[1] ?? 0;
    return [fp.pos, [fp.pos[0], fp.pos[1] + h / 2, fp.pos[2]], [fp.pos[0], fp.pos[1] + h, fp.pos[2]]];
  })();
  for (const q of points) {
    const d = dot(plane.n, sub(q, plane.pts[0])) * s0;
    if (d > eps) front = true;
    else if (d < -eps) behind = true;
  }
  if (front && behind) return 'mixed';
  if (front) return 'front';
  if (behind) return 'behind';
  // Coplanar: authored bias decides (negative bias = detail drawn over its surface).
  const bi = it.kind === 'poly' ? prepared.polys[it.source].bias ?? 0 : -Infinity;
  const bp = plane.bias ?? 0;
  return bi < bp ? 'front' : bi > bp ? 'behind' : 'mixed';
}

function placeLarge(view: View, prepared: Prepared, list: Item[], boxes: Map<Item, Box>, L: PolyItem, layerBias: number, depth: number): void {
  const at = list.indexOf(L);
  list.splice(at, 1);
  const box = boxes.get(L)!;
  let lower = -1, upper = list.length;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (it.kind === 'poly' && Math.abs(prepared.polys[it.source].bias ?? 0) >= layerBias) continue;
    if (!overlap(box, boxes.get(it)!)) continue;
    const where = side(view, L.piece, it, prepared);
    if (where === 'front') upper = Math.min(upper, i);
    else if (where === 'behind') lower = Math.max(lower, i);
  }
  if (lower < upper) {
    list.splice(Math.min(Math.max(at, lower + 1), upper), 0, L);
    return;
  }
  // Conflicting constraints (the polygon is both in front of and behind overlapping things):
  // halve it and place each half, a few levels deep, else keep the depth position.
  if (depth < 3 && !L.piece.holes?.length) {
    const halves = subdivide(L.piece, view.pos, 0, 1);
    if (halves.length === 2) {
      const parts: PolyItem[] = [];
      for (const piece of halves) {
        const cam = clipNear(piece.pts.map((q) => toCamera(view, q)), view.near);
        if (cam.length < 3) continue;
        const scr = cam.map((q) => toScreen(view, q));
        const z = cam.reduce((a, q) => a + q[2], 0) / cam.length + (prepared.polys[L.source].bias ?? 0);
        const part: PolyItem = {...L, piece, scr, holes: [], z, near: Math.min(...cam.map((q) => q[2]))};
        boxes.set(part, boxOf(scr));
        parts.push(part);
      }
      for (const part of parts) list.splice(at, 0, part);
      for (const part of parts) placeLarge(view, prepared, list, boxes, part, layerBias, depth + 1);
      return;
    }
  }
  list.splice(at, 0, L);
}

export function order(prepared: Prepared, method: DepthMethod, view?: View, opts: DepthOptions = {}): Item[] {
  const items = [...prepared.items];
  if (method === 'object') {
    const nearest = new Map<string, number>();
    for (const it of items) {
      if (!it.object) continue;
      const d = it.kind === 'poly' ? it.near : it.z;
      nearest.set(it.object, Math.min(nearest.get(it.object) ?? Infinity, d));
    }
    const key = (it: Item) => (it.object ? nearest.get(it.object)! : it.z);
    return items.sort((a, b) => key(b) - key(a) || b.z - a.z);
  }
  const sorted = items.sort((a, b) => b.z - a.z);
  if (method !== 'planes') return sorted;
  if (!view) throw new Error('The planes method needs the view');
  const o = {...DEFAULTS, ...opts};
  const boxes = new Map<Item, Box>(sorted.map((it) => [it, it.kind === 'poly' ? boxOf(it.scr) : (it.rect ?? [it.x - 1, it.y - 1, it.x + 1, it.y])]));
  const large = sorted.filter((it): it is PolyItem => {
    if (it.kind !== 'poly' || Math.abs(prepared.polys[it.source].bias ?? 0) >= o.layerBias) return false;
    return extentAxis(it.piece.pts).size > o.pieceRatio * Math.max(it.near, 0.5);
  });
  for (const L of large) placeLarge(view, prepared, sorted, boxes, L, o.layerBias, 0);
  return sorted;
}
