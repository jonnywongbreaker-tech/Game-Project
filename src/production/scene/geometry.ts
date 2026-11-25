import {car} from '../../kit/city';
import {box, cone, cylinder, extrude, lowSphere, rock, transform, tree} from '../../kit/primitives';
import {mountain} from '../../kit/terrain';
import {normalize, quad, type Material, type Poly, type V3} from '../../kit/space';
import type {Asset, Entity, State} from './types';

const zero: V3 = [0, 0, 0];
/** A square panel in XY with an open, rounded rectangular cutout. */
function aperture([width, height, radius]: NonNullable<Entity['opening']>, material: Material): Poly[] {
  const samples = 48;
  const outer: V3[] = [];
  const inner: V3[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = i * 2 * Math.PI / samples;
    const x = Math.cos(angle), y = Math.sin(angle);
    const edge = .5 / Math.max(Math.abs(x), Math.abs(y));
    let lower = 0, upper = edge;
    for (let step = 0; step < 16; step++) {
      const t = (lower + upper) / 2;
      const dx = Math.abs(x * t) - width / 2 + radius;
      const dy = Math.abs(y * t) - height / 2 + radius;
      const signedDistance = Math.hypot(Math.max(0, dx), Math.max(0, dy)) + Math.min(Math.max(dx, dy), 0) - radius;
      if (signedDistance <= 0) lower = t;
      else upper = t;
    }
    outer.push([x * edge, .5 + y * edge, .05]);
    inner.push([x * lower, .5 + y * lower, .05]);
  }
  const back = ([x, y]: V3): V3 => [x, y, -.05];
  const edges: V3[] = [[-.5, 0, .05], [.5, 0, .05], [.5, 1, .05], [-.5, 1, .05]];
  const polys: Poly[] = [
    {pts: edges, holes: [inner], n: [0, 0, 1], m: material},
    {pts: edges.map(back), holes: [inner.map(back)], n: [0, 0, -1], m: material},
  ];
  for (let i = 0; i < samples; i++) {
    const j = (i + 1) % samples;
    const a = outer[i], b = outer[j], c = inner[j], d = inner[i];
    polys.push(quad(d, c, back(c), back(d), normalize([c[1] - d[1], d[0] - c[0], 0]).map(v => -v) as V3, material));
    polys.push(quad(a, b, back(b), back(a), normalize([b[1] - a[1], a[0] - b[0], 0]), material));
  }
  return polys;
}

export const geometry = (asset: Exclude<Asset, 'person'>, entity: Entity): Poly[] => {
  const m: Material = {color: '#FFFFFF'};
  const seed = entity.seed ?? entity.id;
  switch (asset) {
    case 'aperture': return aperture(entity.opening!, m);
    case 'outline': return extrude(entity.outline!, .1, {origin: zero, u: [1, 0, 0], v: [0, 1, 0]}, {cap: m, side: m});
    case 'box': return box(zero, [1, 1, 1], m, {bottom: true});
    case 'platform': return box(zero, [6, .3, 6], m);
    case 'cylinder': return cylinder(zero, .5, 1, 20, m);
    case 'cone': return cone(zero, .5, 1, 20, m);
    case 'sphere': return lowSphere([0, .5, 0], .5, 8, 14, m);
    case 'rock': return rock(zero, .8, '#FFFFFF', seed);
    case 'car': return car(zero, 1, '#FFFFFF', '#8BA4B0', seed);
    case 'tree':
    case 'conifer':
      return tree(zero, 3, {trunk: '#6D5039', leaves: ['#FFFFFF', '#F5F5F5', '#DFDFDF']},
        seed, asset === 'tree' ? 'broadleaf' : 'conifer');
    case 'mountain': return mountain(zero, 5, 5, '#FFFFFF', '#F3EFE8', seed);
    case 'ground': return [quad([-12, 0, -12], [12, 0, -12], [12, 0, 12], [-12, 0, 12], [0, 1, 0], m, 80)];
  }
};

export function placeGeometry(base: Poly[], entity: Entity, state: State): Poly[] {
  const size = (entity.size ?? [1, 1, 1]).map(n => n * state.scale) as V3;
  return transform(base, {scale: size, translate: state.position,
    rotate: {axis: [0, 1, 0], angle: state.rotation * Math.PI / 180}}).map(poly => ({
    ...poly, opacity: (poly.opacity ?? 1) * state.opacity,
    m: {...poly.m, color: ['#FFFFFF', '#F5F5F5', '#DFDFDF'].includes(poly.m.color) ? state.color : poly.m.color,
      kind: entity.material ?? poly.m.kind, emissive: state.highlight},
  }));
}
