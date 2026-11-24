/** Mechanical kit: gears that mesh at correct ratios, crank-slider kinematics, cutaway housings. */
import {box, circle, extrude, gearShape, transform} from './primitives';
import {type Material, type Poly, quad, type V3} from './space';

export interface GearSpec {
  center: V3;
  teeth: number;
  /** Module-like size: radius = teeth * pitch / (2π). */
  pitch: number;
  thickness: number;
  m: Material;
  hub: Material;
}

export const gearRadius = (g: Pick<GearSpec, 'teeth' | 'pitch'>) => (g.teeth * g.pitch) / (2 * Math.PI);

/** A gear lying in the XY plane, axis along z, rotated by `angle`. */
export function gear(g: GearSpec, angle: number): Poly[] {
  const r = gearRadius(g);
  const shape = gearShape(g.teeth, r - g.pitch * 0.35, r + g.pitch * 0.3);
  const body = extrude(shape, g.thickness, {origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0]}, {cap: g.m, side: g.m});
  const hub = extrude(circle(r * 0.28, 10), g.thickness * 1.6, {origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0]}, {cap: g.hub, side: g.hub});
  const spokes = [0, 1, 2].flatMap((k) => {
    const a = (k / 3) * Math.PI * 2;
    return transform(box([0, -0.03, 0], [r * 1.4, 0.06, g.thickness * 1.15], g.hub), {rotate: {axis: [0, 0, 1], angle: a}});
  });
  return transform([...body, ...hub.map((p) => ({...p, bias: -0.02})), ...spokes.map((p) => ({...p, bias: -0.01}))], {rotate: {axis: [0, 0, 1], angle}, translate: g.center});
}

/** Angle of a gear driven by `driver` turning at `driverAngle` through a chain of meshes (sign alternates). */
export const meshedAngle = (driverTeeth: number, driverAngle: number, teeth: number, steps: number, phase = 0) =>
  ((steps % 2 ? -1 : 1) * driverAngle * driverTeeth) / teeth + phase;

/** Crank-slider: piston height above the crank centre for crank angle θ. */
export function crankSlider(theta: number, crank: number, rod: number) {
  const px = crank * Math.sin(theta);
  const py = crank * Math.cos(theta);
  const h = py + Math.sqrt(Math.max(0, rod * rod - px * px));
  return {pin: [px, py] as [number, number], piston: h};
}

/**
 * Box housing cut open on its +z face. Interior faces are darker; the cut
 * section rims are painted in `section` (the cutaway convention).
 */
export function cutawayHousing(base: V3, size: V3, wall: number, outer: Material, inner: Material, section: Material): Poly[] {
  const [w, h, d] = size;
  const x0 = base[0] - w / 2, x1 = base[0] + w / 2, y0 = base[1], y1 = base[1] + h, z0 = base[2] - d / 2, z1 = base[2] + d / 2;
  const out: Poly[] = [
    // outer shell (no front)
    quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], outer),
    quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], outer),
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], outer),
    quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], outer),
    // interior (facing inward)
    quad([x0 + wall, y0 + wall, z0 + wall], [x1 - wall, y0 + wall, z0 + wall], [x1 - wall, y1 - wall, z0 + wall], [x0 + wall, y1 - wall, z0 + wall], [0, 0, 1], inner, 0.3),
    quad([x0 + wall, y0 + wall, z0 + wall], [x1 - wall, y0 + wall, z0 + wall], [x1 - wall, y0 + wall, z1], [x0 + wall, y0 + wall, z1], [0, 1, 0], inner, 0.3),
    quad([x0 + wall, y1 - wall, z0 + wall], [x1 - wall, y1 - wall, z0 + wall], [x1 - wall, y1 - wall, z1], [x0 + wall, y1 - wall, z1], [0, -1, 0], inner, 0.3),
    quad([x0 + wall, y0 + wall, z0 + wall], [x0 + wall, y0 + wall, z1], [x0 + wall, y1 - wall, z1], [x0 + wall, y1 - wall, z0 + wall], [1, 0, 0], inner, 0.3),
    quad([x1 - wall, y0 + wall, z0 + wall], [x1 - wall, y0 + wall, z1], [x1 - wall, y1 - wall, z1], [x1 - wall, y1 - wall, z0 + wall], [-1, 0, 0], inner, 0.3),
  ];
  // section rims on the cut plane
  const zc = z1 + 0.002;
  const rim = (a: V3, b: V3, c: V3, e: V3) => out.push(quad(a, b, c, e, [0, 0, 1], section, -0.05));
  rim([x0, y0, zc], [x1, y0, zc], [x1, y0 + wall, zc], [x0, y0 + wall, zc]);
  rim([x0, y1 - wall, zc], [x1, y1 - wall, zc], [x1, y1, zc], [x0, y1, zc]);
  rim([x0, y0, zc], [x0 + wall, y0, zc], [x0 + wall, y1, zc], [x0, y1, zc]);
  rim([x1 - wall, y0, zc], [x1, y0, zc], [x1, y1, zc], [x1 - wall, y1, zc]);
  return out;
}

/** Half of a vertical cylinder sleeve (front half removed), double-sided so the inside shows. */
export function halfSleeve(base: V3, r: number, h: number, n: number, m: Material, section: Material): Poly[] {
  const out: Poly[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI;
    const p = (a: number, y: number): V3 => [base[0] + Math.cos(a) * r, base[1] + y, base[2] + Math.sin(a) * r];
    const mid = (a0 + a1) / 2;
    out.push({pts: [p(a0, 0), p(a1, 0), p(a1, h), p(a0, h)], n: [Math.cos(mid), 0, Math.sin(mid)], m, doubleSided: true});
  }
  for (const a of [Math.PI, 0]) {
    const x = base[0] + Math.cos(a) * r;
    out.push(quad([x - 0.04, base[1], base[2] + 0.001], [x + 0.04, base[1], base[2] + 0.001], [x + 0.04, base[1] + h, base[2] + 0.001], [x - 0.04, base[1] + h, base[2] + 0.001], [0, 0, 1], section, -0.1));
  }
  return out;
}
