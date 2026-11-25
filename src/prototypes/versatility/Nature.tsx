import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {rock, tree} from '../../kit/primitives';
import {tracking} from '../../kit/shotGrammar';
import {type Light, type Poly, type V3} from '../../kit/space';
import {mountain, scatter, terrain} from '../../kit/terrain';
import type {Sprite} from '../../engine/Space';
import {ARCHIVIST} from '../../themes/cge/Person';
import {personSprite} from '../../themes/cge/personSprite';
import {SceneFrame, type SceneDef} from './SceneFrame';

const riverX = (z: number) => Math.sin(z / 22) * 7 + Math.sin(z / 9) * 1.5;
const noise = (x: number, z: number) => Math.sin(x * 0.11 + z * 0.07) * 1.6 + Math.sin(x * 0.23 - z * 0.13) * 0.9 + Math.sin(z * 0.05 + 1.3) * 2.2;
const height = (x: number, z: number) => {
  const d = Math.abs(x - riverX(z));
  const valley = d < 6 ? -0.9 + d * 0.12 : -0.18 + Math.min(16, Math.pow(Math.max(0, d - 6), 1.3) * 0.17);
  return valley + Math.max(0, d - 5) * 0.06 * noise(x, z) + noise(x, z) * 0.25;
};
const WATER = 0.05;
const SUN: V3 = [0.75, -0.5, 0.35];
const LEAVES = [
  {trunk: '#6B4A35', leaves: ['#4E8A4A', '#3F7A45', '#5E9A55']},
  {trunk: '#5E3F2E', leaves: ['#2F6A4E', '#3B7A57', '#28604A']},
  {trunk: '#6B4A35', leaves: ['#D89A3B', '#C97A35', '#E2B04A']},
];

const STATIC: Poly[] = (() => {
  const out: Poly[] = terrain({
    x: [-55, 55], z: [-5, 175], cols: 44, rows: 60, height, water: WATER,
    colors: {water: '#3E8FB4', sand: '#DCC79C', grass: ['#7FB05A', '#6FA251', '#8DBB62', '#76A85A'], rock: '#9A8F84'},
    seed: 'valley',
  });
  for (const [i, [x, z]] of scatter(130, [-52, 52], [10, 165], 'forest', (x, z) => Math.abs(x - riverX(z)) > 11 && height(x, z) > 0.8).entries()) {
    const kind = random(`k${i}`) < 0.55 ? 'conifer' : 'broadleaf';
    const style = kind === 'conifer' ? LEAVES[1] : LEAVES[random(`a${i}`) < 0.25 ? 2 : 0];
    out.push(...tree([x, height(x, z) - 0.2, z], 5 + random(`h${i}`) * 5, style, `t${i}`, kind));
  }
  for (const [i, [x, z]] of scatter(16, [-30, 30], [0, 120], 'rocks', (x, z) => Math.abs(x - riverX(z)) > 3 && Math.abs(x - riverX(z)) < 7).entries()) out.push(...rock([x, height(x, z) - 0.2, z], 0.6 + random(`r${i}`) * 1.2, '#A39A90', `rk${i}`));
  const ranges: [number, number, number, number][] = [[-120, 230, 70, 48], [-40, 260, 90, 62], [60, 240, 80, 55], [150, 220, 70, 44], [10, 300, 110, 80]];
  ranges.forEach(([x, z, r, h], i) => out.push(...mountain([x, 0, z], r, h, i % 2 ? '#7E8FA6' : '#8E9BB0', '#F3EFE8', `m${i}`)));
  return out;
})();

const LIGHTS: Light[] = [
  {kind: 'hemisphere', sky: '#A8CBE0', ground: '#8FA36A', intensity: 0.6},
  {kind: 'directional', dir: SUN, color: '#FFE6C2', intensity: 0.95},
];

const glide = (t: number): V3 => {
  const z = 18 + t * 5;
  return [riverX(z), 3, z];
};
const STAND: V3 = [riverX(52) - 9, height(riverX(52) - 9, 52), 52];

export const def: SceneDef = {
  duration: 5,
  shots: [tracking({label: 'The valley', start: 0, end: 5, follow: glide, size: 14, side: -1, elevation: 30, fov: 54, mode: 'chase', distance: 24, lead: 1.4})],
  build: (t) => {
    const sprites: Sprite[] = [];
    // ripples drifting downstream: stylized light streaks on the water
    for (let i = 0; i < 70; i++) {
      const z = ((random(`rz${i}`) * 140 - t * 2.2) % 140 + 140) % 140;
      const x = riverX(z) + (random(`rx${i}`) - 0.5) * 8;
      sprites.push({pos: [x, WATER + 0.02, z], bias: -0.2, render: ({x: sx, y: sy, scale: s}) => <rect x={sx - s * 0.6} y={sy - 1} width={s * 1.2} height={Math.max(1.2, s * 0.05)} fill="#DDF1F7" opacity={0.75} />});
    }
    // birds
    for (let i = 0; i < 7; i++) {
      const p: V3 = [-10 + i * 2.2 + t * 3 + Math.sin(t * 2 + i) * 0.5, 22 + (i % 3) * 1.2 + Math.sin(t * 3 + i) * 0.3, 70 + (i % 2) * 2];
      const flap = Math.sin(t * 9 + i * 1.7) * 0.6;
      sprites.push({pos: p, render: ({x, y, scale: s}) => <path d={`M ${x - s * 0.5} ${y - s * flap * 0.3} L ${x} ${y} L ${x + s * 0.5} ${y - s * flap * 0.3}`} stroke="#2B3245" strokeWidth={Math.max(1.5, s * 0.07)} fill="none" strokeLinecap="round" />});
    }
    sprites.push(personSprite({spec: ARCHIVIST, pos: STAND, heading: [0.4, 0, 1], t, input: {lookAt: [400, -700]}, expression: 'content', seed: 3}, LIGHTS));
    return {polys: STATIC, sprites, lights: LIGHTS};
  },
  atmosphere: {low: '#B8D3DE', high: '#EBDCC0', height: 60, density: 0.0055},
  background: <AbsoluteFill style={{background: 'radial-gradient(ellipse at 85% 30%, #FFF1D6 0%, rgba(255,241,214,0) 25%), linear-gradient(180deg, #6EA6D4 0%, #A9CBE2 40%, #F2D8AE 75%, #E9C99A 100%)'}} />,
  title: {kicker: 'Versatility · Natural', lines: ['Everything flows', 'downhill.'], start: 0.4, end: 3.6, top: 150},
};

export const Nature: React.FC<{production?: boolean}> = ({production}) => <SceneFrame def={def} production={production} />;
