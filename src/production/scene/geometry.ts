import {car} from '../../kit/city';
import {box, cone, cylinder, lowSphere, rock, transform, tree} from '../../kit/primitives';
import {mountain} from '../../kit/terrain';
import {quad, type Material, type Poly, type V3} from '../../kit/space';
import type {Asset, Entity, State} from './types';

const zero: V3 = [0, 0, 0];
export const geometry = (asset: Exclude<Asset, 'person'>, entity: Entity): Poly[] => {
  const m: Material = {color: '#FFFFFF'};
  const seed = entity.seed ?? entity.id;
  switch (asset) {
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
