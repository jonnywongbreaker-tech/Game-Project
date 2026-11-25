/**
 * Ray-cast visibility reference for the painter's ordering in `depth.ts`. Pure.
 *
 * For a grid of screen samples, finds the truly nearest surface along the camera ray
 * (polygons as planar faces with holes, sprites as camera-facing rectangles at their
 * anchor depth) and compares it with the item a draw order leaves on top. Coplanar
 * ties within `tieEpsilon` are not errors. When the nearest surface is translucent,
 * the surface behind it must also match.
 */
import {centroid, dot, normalize, type Poly, scale, sub, add, type V3, type View} from './space';
import type {Item, Prepared, Pt} from './depth';

export interface Sample {
  x: number;
  y: number;
}

export interface OcclusionReport {
  /** Samples where anything is visible. */
  covered: number;
  /** Samples where the draw order shows the wrong surface. */
  errors: number;
  rate: number;
  /** Error samples per pair "a|b" (expected|shown), for diagnosis. */
  pairs: Map<string, number>;
}

type Hit = {key: string; z: number; opacity: number};

function rayAt(view: View, px: number, py: number): V3 {
  let x = px - view.width / 2;
  let y = view.height / 2 - py;
  if (view.roll) {
    const c = Math.cos(-view.roll), s = Math.sin(-view.roll);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return normalize(add(add(scale(view.right, x / view.focal), scale(view.up, y / view.focal)), view.forward));
}

function inside2(pt: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Ray–polygon hit (camera depth) or null. Uses the same back-face rule as the renderer. */
function hitPoly(view: View, dir: V3, p: Poly): number | null {
  const n = p.n;
  const denom = dot(n, dir);
  if (Math.abs(denom) < 1e-9) return null;
  const t = dot(n, sub(p.pts[0], view.pos)) / denom;
  if (t <= 0) return null;
  const q = add(view.pos, scale(dir, t));
  const z = dot(sub(q, view.pos), view.forward);
  if (z < view.near) return null;
  // Drop the dominant axis of the normal to test containment in 2D.
  const a = Math.abs(n[0]), b = Math.abs(n[1]), c = Math.abs(n[2]);
  const drop = a >= b && a >= c ? 0 : b >= c ? 1 : 2;
  const to2 = (v: V3): Pt => (drop === 0 ? [v[1], v[2]] : drop === 1 ? [v[0], v[2]] : [v[0], v[1]]);
  const pt = to2(q);
  if (!inside2(pt, p.pts.map(to2))) return null;
  if (p.holes?.some((h) => inside2(pt, h.map(to2)))) return null;
  return z;
}

const facesCamera = (view: View, p: Poly) => p.doubleSided || dot(p.n, sub(view.pos, centroid(p.pts))) > 0;

/** Every surface along the ray, nearest first. */
export function truthAt(view: View, prepared: Prepared, px: number, py: number): Hit[] {
  const dir = rayAt(view, px, py);
  const hits: Hit[] = [];
  prepared.polys.forEach((p, i) => {
    if (!facesCamera(view, p)) return;
    const z = hitPoly(view, dir, p);
    if (z !== null) hits.push({key: `p${i}`, z, opacity: p.opacity ?? 1});
  });
  for (const it of prepared.items) {
    if (it.kind !== 'sprite' || !it.rect) continue;
    const [x0, y0, x1, y1] = it.rect;
    if (px >= x0 && px <= x1 && py >= y0 && py <= y1) hits.push({key: `s${it.source}`, z: it.z - (prepared.sprites[it.source].bias ?? 0), opacity: 1});
  }
  return hits.sort((a, b) => a.z - b.z);
}

const keyOf = (it: Item) => (it.kind === 'poly' ? `p${it.source}` : `s${it.source}`);
function covers(it: Item, px: number, py: number) {
  if (it.kind === 'sprite') {
    if (!it.rect) return false;
    const [x0, y0, x1, y1] = it.rect;
    return px >= x0 && px <= x1 && py >= y0 && py <= y1;
  }
  return inside2([px, py], it.scr) && !it.holes.some((h) => inside2([px, py], h));
}

/** The items a draw order leaves visible at a pixel, topmost first. */
export function shownAt(ordered: Item[], px: number, py: number, count = 2): string[] {
  const out: string[] = [];
  for (let i = ordered.length - 1; i >= 0 && out.length < count; i--) {
    const it = ordered[i];
    if (!covers(it, px, py)) continue;
    const key = keyOf(it);
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

export function sampleGrid(view: View, columns = 96, rows = 54): Sample[] {
  const out: Sample[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
    out.push({x: ((i + 0.5) / columns) * view.width, y: ((j + 0.5) / rows) * view.height});
  }
  return out;
}

const LAYER_BIAS = 50;
const layered = (prepared: Prepared, key: string | undefined) =>
  key?.[0] === 'p' && Math.abs(prepared.polys[Number(key.slice(1))].bias ?? 0) >= LAYER_BIAS;

export function compareOrder(view: View, prepared: Prepared, ordered: Item[], samples = sampleGrid(view), tieEpsilon = 0.02): OcclusionReport {
  let covered = 0;
  let errors = 0;
  const pairs = new Map<string, number>();
  for (const {x, y} of samples) {
    const truth = truthAt(view, prepared, x, y);
    if (!truth.length) continue;
    covered++;
    const shown = shownAt(ordered, x, y);
    const depthOf = (key: string | undefined) => truth.find((h) => h.key === key)?.z;
    const layers = truth[0].opacity < 1 ? 2 : 1;
    let wrong = false;
    for (let k = 0; k < layers && k < truth.length; k++) {
      if (shown[k] === truth[k].key) continue;
      // Layered backdrops (floors, decal shadows) are ordered by authored bias, not by geometry.
      if (layered(prepared, truth[k].key) && layered(prepared, shown[k])) continue;
      const z = depthOf(shown[k]);
      // A tie: the shown surface is at (nearly) the same depth as the true one.
      if (z !== undefined && Math.abs(z - truth[k].z) <= tieEpsilon * Math.max(1, truth[k].z)) continue;
      wrong = true;
      const pair = `${truth[k].key}|${shown[k] ?? '-'}`;
      pairs.set(pair, (pairs.get(pair) ?? 0) + 1);
    }
    if (wrong) errors++;
  }
  return {covered, errors, rate: covered ? errors / covered : 0, pairs};
}
