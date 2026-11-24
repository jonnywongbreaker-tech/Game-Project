import React from 'react';
import type {Sprite} from '../../engine/Space';
import {blendedArms} from '../../engine/rig';
import type {Timed} from '../../engine/time';
import type {Pose} from '../../engine/vocab';
import {figureShadow} from '../../kit/primitives';
import {type PuppetInput, solvePuppet, type Vec} from '../../kit/puppet';
import {add, type Light, lightAt, normalize, type Poly, projectPoint, scale, sub, type V3} from '../../kit/space';
import {LOOK} from './identity';
import {type Expression, type HandPose, Person, type PersonSpec, proportionsFor, UNITS_PER_M} from './Person';

export interface PersonPlacement {
  spec: PersonSpec;
  pos: V3;
  heading: V3;
  t: number;
  /** Metres walked (if walking). */
  walked?: number;
  walking?: boolean;
  pose?: Timed<Pose>;
  input?: Partial<PuppetInput>;
  expression?: Expression;
  hands?: {l?: HandPose; r?: HandPose};
  held?: {at: Vec; render: () => React.ReactNode};
  seed?: number;
}

/** A Person standing in a Space scene: lit by the scene, facing decided by the camera. */
export function personSprite(p: PersonPlacement, lights: Light[]): Sprite {
  const props = proportionsFor(p.spec);
  const j = solvePuppet(
    {t: p.t, arms: blendedArms(p.pose ?? 'idle', p.t), walking: !!p.walking, walkPhase: ((p.walked ?? 0) * UNITS_PER_M) / 230, velocity: p.walking ? 1.3 * UNITS_PER_M : 0, seed: p.seed, ...p.input},
    props,
  );
  return {
    pos: p.pos,
    bias: -0.05,
    render: ({x, y, scale: s, view}) => {
      const ahead = projectPoint(view, add(p.pos, scale(p.heading, 0.6)));
      const here = projectPoint(view, p.pos);
      const facing: 1 | -1 = ahead && here && ahead.x < here.x ? -1 : 1;
      if (s / UNITS_PER_M < 0.02) return <rect x={x - 1} y={y - 4} width={2} height={4} fill={p.spec.top} />;
      const chest: V3 = add(p.pos, [0, 1.25, 0]);
      const L = lightAt(chest, normalize(sub(view.pos, chest)), lights).map((v) => Math.min(1.4, v)) as [number, number, number];
      return <Person spec={p.spec} j={j} facing={facing} scale={s / UNITS_PER_M} x={x} y={y} light={L} look={LOOK} t={p.t} expression={p.expression} hands={p.hands} held={p.held} velocity={p.walking ? 390 : 0} />;
    },
  };
}

/** Stylized cast shadow for a placed person. */
export const personShadow = (p: {pos: V3; spec: PersonSpec}, sunDir: V3, color: string): Poly => figureShadow(p.pos, 1.7 * p.spec.height, 0.42, sunDir, p.pos[1], color);
