/**
 * City kit: procedural buildings, streets and vehicles. Every building varies
 * (height, massing, window rhythm, cornice, balconies, shopfront, awning,
 * rooftop) from its seed, so streets never look copy-pasted.
 */
import {random} from 'remotion';
import {box, cylinder, extrude, circle} from './primitives';
import {type Material, type Poly, quad, type V3} from './space';

export interface BuildingStyle {
  walls: string[];
  trims: string[];
  awnings: string[];
  glass: string;
  glassLit: string;
}

/** A building whose street facade sits on the plane z = front, facing `facing` (+1 = +z). */
export function building(x: number, front: number, facing: 1 | -1, width: number, seed: string, st: BuildingStyle): {polys: Poly[]; mass: Poly[]} {
  const r = (q: string) => random(`${seed}-${q}`);
  const pick = <T,>(a: T[], q: string) => a[Math.floor(r(q) * a.length)];
  const floors = 3 + Math.floor(r('f') * 6);
  const fh = 3.1;
  const h = 4 + floors * fh;
  const depth = 12;
  const wall = pick(st.walls, 'w');
  const trim = pick(st.trims, 't');
  const zc = front - (facing * depth) / 2;
  const n: V3 = [0, 0, facing];
  const zf = front + facing * 0.04;
  const mass = box([x, 0, zc], [width, h, depth], {top: {color: trim}, side: {color: wall}, front: {color: wall}, back: {color: wall}});
  const polys: Poly[] = [...mass];
  const at = (sx: number, y: number, dz = 0): V3 => [x + sx, y, zf + facing * dz];
  const q = (x0: number, y0: number, x1: number, y1: number, m: Material, dz = 0, bias = -0.1) =>
    facing > 0 ? quad(at(x0, y0, dz), at(x1, y0, dz), at(x1, y1, dz), at(x0, y1, dz), n, m, bias) : quad(at(x1, y0, dz), at(x0, y0, dz), at(x0, y1, dz), at(x1, y1, dz), n, m, bias);

  // window rhythm varies per building
  const style = Math.floor(r('ws') * 3); // 0 tall, 1 wide, 2 ribbon
  const cols = Math.max(2, Math.floor(width / (style === 1 ? 3.2 : 2.3)));
  const ww = style === 1 ? 2.0 : 1.1;
  const wh = style === 0 ? 1.9 : 1.4;
  for (let f = 0; f < floors; f++) {
    const y0 = 4.2 + f * fh + 0.5;
    if (style === 2) {
      polys.push(q(-width / 2 + 0.7, y0, width / 2 - 0.7, y0 + 1.3, {color: st.glass, kind: 'glass'}));
      continue;
    }
    for (let c = 0; c < cols; c++) {
      const cx = -width / 2 + ((c + 0.5) * width) / cols;
      const lit = r(`l${f}-${c}`) < 0.12;
      polys.push(q(cx - ww / 2 - 0.12, y0 - 0.12, cx + ww / 2 + 0.12, y0 + wh + 0.12, {color: trim}, 0, -0.08));
      polys.push(q(cx - ww / 2, y0, cx + ww / 2, y0 + wh, lit ? {color: st.glassLit, emissive: 0.5} : {color: st.glass, kind: 'glass'}, 0.01, -0.12));
    }
    if (r('balc') < 0.35 && f > 0) polys.push(...box([x, y0 - 0.55, front + facing * 0.5], [width * 0.8, 0.18, 1.0], {color: trim}));
  }
  // cornice and parapet
  polys.push(...box([x, h - 0.6, front + facing * 0.25], [width + 0.4, 0.6, 0.5], {color: trim}));
  // shopfront: glass band, door, awning
  polys.push(q(-width / 2 + 0.6, 0.35, width / 2 - 0.6, 3.3, {color: st.glass, kind: 'glass'}, 0, -0.1));
  polys.push(q(-0.7, 0.05, 0.7, 2.6, {color: trim}, 0.02, -0.14));
  if (r('awn') < 0.7) {
    const ac = pick(st.awnings, 'ac');
    const zA = front + facing * 1.6;
    const p0: V3 = [x - width / 2 + 0.5, 3.6, front + facing * 0.05];
    const p1: V3 = [x + width / 2 - 0.5, 3.6, front + facing * 0.05];
    polys.push({pts: [p0, p1, [p1[0], 3.0, zA], [p0[0], 3.0, zA]], n: [0, 0.94, facing * 0.34], m: {color: ac}, doubleSided: true, bias: -0.3});
  }
  // rooftop
  if (r('tank') < 0.5) polys.push(...cylinder([x + (r('tx') - 0.5) * width * 0.5, h, zc], 1.1, 2.2, 8, {top: {color: trim}, side: {color: '#8E6E52'}}));
  else polys.push(...box([x + (r('bx') - 0.5) * width * 0.4, h, zc], [2.4, 1.2, 2.2], {color: trim}));
  return {polys, mass};
}

export interface StreetStyle {
  road: string;
  sidewalk: string;
  curb: string;
  marking: string;
}

/** Straight street along x: road |z| < roadHalf, sidewalks to |z| < walkHalf. */
export function street(x0: number, x1: number, roadHalf: number, walkHalf: number, st: StreetStyle, crossings: number[] = []): Poly[] {
  const out: Poly[] = [];
  const flat = (a: number, b: number, z0: number, z1: number, y: number, m: Material, bias: number) => out.push(quad([a, y, z0], [b, y, z0], [b, y, z1], [a, y, z1], [0, 1, 0], m, bias));
  flat(x0, x1, -roadHalf, roadHalf, 0, {color: st.road}, 190);
  for (const s of [-1, 1]) {
    const zA = s * roadHalf;
    const zB = s * walkHalf;
    flat(x0, x1, Math.min(zA, zB), Math.max(zA, zB), 0.15, {color: st.sidewalk}, 185);
    out.push(quad([x0, 0, zA], [x1, 0, zA], [x1, 0.15, zA], [x0, 0.15, zA], [0, 0, -s], {color: st.curb}, 0));
  }
  for (let x = x0; x < x1; x += 6) flat(x, x + 3, -0.08, 0.08, 0.01, {color: st.marking}, 180);
  for (const cx of crossings) for (let z = -roadHalf + 0.4; z < roadHalf - 0.4; z += 1.1) flat(cx - 2, cx + 2, z, z + 0.55, 0.012, {color: '#EDE7DA'}, 179);
  return out;
}

export function streetLamp(base: V3, color: string, glow: string): Poly[] {
  return [...cylinder(base, 0.07, 5, 6, {color}), ...box([base[0], 5, base[2]], [0.9, 0.18, 0.3], {color}), ...box([base[0] + 0.25, 4.85, base[2]], [0.4, 0.12, 0.25], {color: glow, emissive: 0.7})];
}

/** A car facing +x (dir = 1) or -x (dir = -1), from the centre of its footprint. */
export function car(pos: V3, dir: 1 | -1, body: string, glass: string, seed: string): Poly[] {
  const len = 4.2 + random(`${seed}-l`) * 0.6;
  const wheel = (dx: number, dz: number) => extrude(circle(0.34, 8), 0.22, {origin: [pos[0] + dx, 0.34, pos[2] + dz], u: [1, 0, 0], v: [0, 1, 0]}, {cap: {color: '#1A1C22'}, side: {color: '#24262E'}});
  return [
    ...box([pos[0], 0.3, pos[2]], [len, 0.75, 1.8], {color: body, kind: 'metal'}),
    ...box([pos[0] - dir * 0.25, 1.05, pos[2]], [len * 0.55, 0.62, 1.62], {top: {color: body, kind: 'metal'}, side: {color: glass, kind: 'glass'}, front: {color: glass, kind: 'glass'}, back: {color: glass, kind: 'glass'}}),
    ...wheel(len * 0.32, 0.92), ...wheel(-len * 0.32, 0.92), ...wheel(len * 0.32, -0.92), ...wheel(-len * 0.32, -0.92),
  ];
}

export function tram(pos: V3, body: string, band: string, glass: string): Poly[] {
  const L = 16;
  const out: Poly[] = [
    ...box([pos[0], 0.35, pos[2]], [L, 1.2, 2.5], {color: body, kind: 'metal'}),
    ...box([pos[0], 1.55, pos[2]], [L, 1.25, 2.5], {top: {color: band}, side: {color: band}, front: {color: band}, back: {color: band}}),
    ...box([pos[0], 2.8, pos[2]], [L - 1, 0.3, 2.3], {color: band}),
    ...box([pos[0], 3.1, pos[2]], [3, 0.35, 1.2], {color: '#3A3F4C'}),
  ];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = pos[0] - L / 2 + 1.4 + i * 2.5;
      const z = pos[2] + s * 1.27;
      out.push(quad([x, 1.75, z], [x + 2.0, 1.75, z], [x + 2.0, 2.6, z], [x, 2.6, z], [0, 0, s], {color: glass, kind: 'glass'}, -0.1));
    }
  }
  return out;
}
