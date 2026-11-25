import React from 'react';
import {AbsoluteFill} from 'remotion';
import {morph, spiral} from '../../kit/formation';
import {box, lowSphere, planarShadow, transform} from '../../kit/primitives';
import {toWorld} from '../../kit/puppet';
import {closeUp, scaleTransition} from '../../kit/shotGrammar';
import {type Light, type Poly, type V3} from '../../kit/space';
import {ID} from '../../themes/cge/identity';
import {ARCHIVIST, UNITS_PER_M} from '../../themes/cge/Person';
import {personShadow, personSprite} from '../../themes/cge/personSprite';
import {SceneFrame, type SceneDef} from './SceneFrame';

const SUN: V3 = [-0.62, -0.36, 0.7];
const HERO: V3 = [0, 0, 0];
const HAND_LOCAL: [number, number] = [86, -350];
const HAND: V3 = toWorld([HAND_LOCAL[0] / UNITS_PER_M, HAND_LOCAL[1] / UNITS_PER_M], 0, 0, 1).length ? [HAND_LOCAL[0] / UNITS_PER_M, -HAND_LOCAL[1] / UNITS_PER_M, 0.05] : [0, 1, 0];
const N = 140;
const CENTER: V3 = [4, 0, 12];
const COLORS = [ID.amber, ID.vermilion, ID.cream, '#F2A65A'];
const RELEASE = 1.35;

const STATIC: Poly[] = [
  {pts: [[-400, 0, -400], [400, 0, -400], [400, 0, 400], [-400, 0, 400]], n: [0, 1, 0], m: {color: '#EED6BC'}, bias: 210},
  ...Array.from({length: 24}).map((_, i): Poly => ({pts: [[-200, 0.005, -40 + i * 12], [200, 0.005, -40 + i * 12], [200, 0.005, -39.85 + i * 12], [-200, 0.005, -39.85 + i * 12]], n: [0, 1, 0], m: {color: '#E2C7AC', kind: 'flat'}, bias: 205})),
  ...lowSphere([-140, 70, 260], 38, 5, 9, {color: '#C9B3DA'}, 0.1, 'f1'),
  ...lowSphere([180, 110, 320], 26, 5, 9, {color: '#E9B9A2'}, 0.1, 'f2'),
  ...transform(box([0, -12, 0], [30, 24, 30], {color: '#B9A6D4'}), {rotate: {axis: [1, 1, 0], angle: 0.7}, translate: [60, 60, 380]}),
];

const LIGHTS: Light[] = [
  {kind: 'hemisphere', sky: '#C9BCE6', ground: '#F0CFAE', intensity: 0.62},
  {kind: 'directional', dir: SUN, color: '#FFE2C0', intensity: 1.0},
];

function steps(t: number): Poly[] {
  const out: Poly[] = [];
  const placed: Poly[] = [];
  for (let i = 0; i < N; i++) {
    const s = spiral(i, CENTER, 8.5, 0.62, 0.27);
    const m = morph(t, i, {from: HAND, to: s.pos, start: RELEASE, stagger: 0.012, duration: 1.6, fromScale: 0.01, arc: 10, spin: Math.PI * 1.5});
    if (t < RELEASE) break;
    const step = box([0, 0, 0], [5.2, 0.62, 2.4], {top: {color: COLORS[i % COLORS.length]}, side: {color: COLORS[(i + 1) % COLORS.length]}, front: {color: COLORS[i % COLORS.length]}, back: {color: COLORS[i % COLORS.length]}}, {bottom: true});
    const p = transform(step, {scale: m.scale, rotate: {axis: [1, 0.6, 0.3], angle: m.spin}});
    const q = transform(p, {rotate: {axis: [0, 1, 0], angle: s.angle * m.k + Math.PI / 2}, translate: m.pos});
    out.push(...q);
    if (m.k > 0.85) placed.push(...q);
  }
  // the column the stairs wind around
  // the column rises with the stairs, never ahead of them
  const placedSteps = placed.length / 6;
  const h = placedSteps * 0.62;
  if (h > 0.5 && t > 3.1) out.push(...box(CENTER, [2.8, h * tween01(t, 3.1, 3.8), 2.8], {top: {color: '#E6DCF0'}, side: {color: '#CDBFE0'}}));
  return [...out, ...planarShadow(placed, SUN, 0, '#5A4E8E', 0.35)];
}
const tween01 = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

export const def: SceneDef = {
  duration: 5,
  shots: [
    closeUp({label: 'One small thing', start: 0, end: RELEASE + 0.15, subject: {pos: [HAND[0] + 0.05, HAND[1] + 0.15, HAND[2]], size: 0.9, facing: [0, 0, 1]}, angle: 62, elevation: 4, fov: 30, blur: 4}),
    scaleTransition({label: 'Compounding', start: RELEASE + 0.15, end: 5, from: {pos: HAND, size: 1.4}, to: {pos: [CENTER[0], 24, CENTER[2]], size: 58}, azimuth: -158, fromFov: 32, toFov: 58, elevation: -14}),
  ],
  build: (t) => {
    const held = t < RELEASE;
    const hero = personSprite(
      {
        spec: ARCHIVIST, pos: HERO, heading: [0, 0, 1], t,
        input: {ik: {r: {target: HAND_LOCAL, weight: 1}}, lookAt: held ? HAND_LOCAL : [400, -2000], lean: held ? 2 : -4},
        hands: {r: held ? 'hold' : 'open'}, expression: held ? 'content' : 'wonder', seed: 4,
        held: held
          ? {at: HAND_LOCAL, render: () => (
              <g transform={`translate(${HAND_LOCAL[0] + 10} ${HAND_LOCAL[1] - 22})`}>
                <path d="M 0 -16 L 15 -8 L 15 10 L 0 18 L -15 10 L -15 -8 Z" fill={ID.amber} />
                <path d="M 0 2 L 15 -8 L 15 10 L 0 18 Z" fill="#D9862F" />
                <path d="M 0 -16 L 15 -8 L 0 2 L -15 -8 Z" fill="#FFE1A3" />
              </g>
            )}
          : undefined,
      },
      LIGHTS,
    );
    return {polys: [...STATIC, personShadow({pos: HERO, spec: ARCHIVIST}, SUN, '#5A4E8E'), ...steps(t)], sprites: [hero], lights: LIGHTS};
  },
  atmosphere: {low: '#F0D2B5', high: '#C9B8DC', height: 120, density: 0.0028},
  background: <AbsoluteFill style={{background: 'linear-gradient(180deg, #8C8BC9 0%, #C2B3DA 45%, #F3CBA6 80%, #F6D9BA 100%)'}} />,
  title: {kicker: 'Versatility · Abstract', lines: ['Small habits.', 'Monumental results.'], start: 3.0, end: 5.2, top: 140, size: 84},
};

export const Abstract: React.FC<{production?: boolean}> = ({production}) => <SceneFrame def={def} production={production} />;
