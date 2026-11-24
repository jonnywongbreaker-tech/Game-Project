import React from 'react';
import {random} from 'remotion';
import {shade} from './color';
import type {CharacterDesign} from './designs';
import {popIn, resolveTimed, Timed, tween, useTime, wave} from './time';

export type Pose = 'idle' | 'wave' | 'point' | 'shrug' | 'cheer' | 'think' | 'hips' | 'present';
export type Expression = 'neutral' | 'happy' | 'laugh' | 'sad' | 'angry' | 'surprised' | 'smug';

export interface CharacterProps {
  design: CharacterDesign;
  /** World position of the feet. */
  x: number;
  y: number;
  scale?: number;
  /** 1 = facing right, -1 = facing left. */
  facing?: 1 | -1;
  pose?: Timed<Pose>;
  expression?: Timed<Expression>;
  /** Mouth flaps while true (use dialogue.isTalking()). */
  talking?: boolean;
  walking?: boolean;
  /** Distance-based leg phase from move(); keeps feet planted. */
  walkPhase?: number;
  /** Where the pupils point: -1 (back) … 1 (forward). */
  look?: number;
  /** Speech-free reaction above the head, e.g. '!', '?', '...', '♥'. null hides it. */
  emote?: Timed<string | null>;
  /** Extra head tilt in degrees. */
  tilt?: number;
}

/** Arm angles in degrees, measured "outward" from hanging straight down. [upper, forearm] */
type Arms = {l: [number, number]; r: [number, number]};

const poseArms = (pose: Pose, t: number): Arms => {
  switch (pose) {
    case 'wave':
      return {l: [10, -6], r: [140, 20 + wave(t, 2.2, 28)]};
    case 'point':
      return {l: [10, -6], r: [85, 4]};
    case 'shrug':
      return {l: [35, 95], r: [35, 95]};
    case 'cheer':
      return {l: [150, 15 + wave(t, 2, 12)], r: [150, 15 + wave(t, 2, 12, 0.5)]};
    case 'think':
      return {l: [10, -6], r: [12, -160]};
    case 'hips':
      return {l: [42, -80], r: [42, -80]};
    case 'present':
      return {l: [62, 14], r: [62, 14]};
    case 'idle':
    default:
      return {l: [10 + wave(t, 0.45, 2), -6], r: [10 + wave(t, 0.45, 2, 0.3), -6]};
  }
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpArms = (a: Arms, b: Arms, k: number): Arms => ({
  l: [lerp(a.l[0], b.l[0], k), lerp(a.l[1], b.l[1], k)],
  r: [lerp(a.r[0], b.r[0], k), lerp(a.r[1], b.r[1], k)],
});

const INK = '#2b2233';
const HEAD_Y = -385;
const HEAD_R = 88;
/** Height of the top of the head above the feet, at scale 1. */
export const CHARACTER_HEIGHT = -HEAD_Y + HEAD_R + 10;

export const Character: React.FC<CharacterProps> = (p) => {
  const {t, frame} = useTime();
  const d = p.design;
  const seed = d.seed ?? 0;
  const facing = p.facing ?? 1;
  const scale = (p.scale ?? 1) * (d.size ?? 1);

  // --- Body motion ---------------------------------------------------------
  const walking = !!p.walking;
  const phase = (p.walkPhase ?? t * 1.6) * Math.PI * 2;
  const swing = walking ? Math.sin(phase) : 0;
  const bob = walking ? -Math.abs(Math.sin(phase)) * 12 : wave(t, 0.45, 3, seed * 0.17);

  // --- Pose (blended over 0.25s when it changes) -----------------------------
  const pose = resolveTimed(t, p.pose ?? 'idle');
  const blend = tween(pose.since, [0, 0.25], [0, 1]);
  const arms = lerpArms(poseArms(pose.previous, t), poseArms(pose.value, t), blend);
  const armSwing = walking ? swing * 24 : 0;

  // --- Face ------------------------------------------------------------------
  const expression = resolveTimed(t, p.expression ?? 'neutral').value;
  const blinkPeriod = 3.1 + (seed % 5) * 0.37;
  const blinkT = (t + seed * 0.71) % blinkPeriod;
  const eyeOpen = expression === 'laugh' ? 0.25 : blinkT < 0.12 ? 0.12 : 1;
  const look = (p.look ?? 0.4) * 6;
  const tilt = (p.tilt ?? 0) + (p.talking ? wave(t, 0.9, 3, seed * 0.3) : 0) + (expression === 'smug' ? -6 : 0);

  const mouthShape = p.talking
    ? (['A', 'E', 'O', 'M', 'A', 'E'] as const)[Math.floor(random(`${seed}-${Math.floor(frame / 3)}`) * 6)]
    : null;

  // --- Emote -----------------------------------------------------------------
  const emote = resolveTimed<string | null>(t, p.emote ?? null);

  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx={0} cy={0} rx={85 * scale} ry={13 * scale} fill="#000" opacity={0.18} />
      <g transform={`scale(${scale * facing} ${scale})`}>
        <g transform={`translate(0 ${bob})`}>
          <Leg x={-24} angle={swing * 28} pants={d.pants} shoes={d.shoes} />
          <Leg x={24} angle={-swing * 28} pants={d.pants} shoes={d.shoes} />
          {/* neck + torso */}
          <rect x={-15} y={-312} width={30} height={26} fill={shade(d.skin, -0.12)} />
          <path d="M -62 -150 L -67 -268 Q -67 -298 -38 -298 L 38 -298 Q 67 -298 67 -268 L 62 -150 Z" fill={d.shirt} />
          {d.shirtAccent && <rect x={-65} y={-238} width={130} height={22} fill={d.shirtAccent} />}
          <path d="M -18 -298 L 0 -276 L 18 -298 Z" fill={shade(d.shirt, -0.2)} />
          <rect x={-65} y={-176} width={130} height={36} rx={8} fill={d.pants} />
          <Head d={d} expression={expression} eyeOpen={eyeOpen} look={look} tilt={tilt} mouth={mouthShape} />
          <Arm side={-1} angles={[arms.l[0] - armSwing, arms.l[1]]} d={d} />
          <Arm side={1} angles={[arms.r[0] + armSwing, arms.r[1]]} d={d} />
        </g>
      </g>
      {emote.value && (
        <g transform={`translate(${70 * scale * facing} ${(-CHARACTER_HEIGHT - 40) * scale}) scale(${popIn(emote.since) * scale})`}>
          <circle r={44} fill="#fff" stroke={INK} strokeWidth={5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={emote.value.length > 1 ? 34 : 54}
            fontWeight={900}
            fill={INK}
            fontFamily="Verdana, sans-serif"
          >
            {emote.value}
          </text>
        </g>
      )}
    </g>
  );
};

const Leg: React.FC<{x: number; angle: number; pants: string; shoes: string}> = ({x, angle, pants, shoes}) => (
  <g transform={`translate(${x} -152) rotate(${angle})`}>
    <rect x={-14} y={-6} width={28} height={142} rx={13} fill={pants} />
    <ellipse cx={10} cy={140} rx={24} ry={12} fill={shoes} />
  </g>
);

const Arm: React.FC<{side: 1 | -1; angles: [number, number]; d: CharacterDesign}> = ({side, angles, d}) => {
  // side -1 = viewer's left arm. Outward rotation is +deg for left, -deg for right.
  const s = side === -1 ? 1 : -1;
  return (
    <g transform={`translate(${side * 60} -272) rotate(${angles[0] * s})`}>
      <rect x={-12} y={-10} width={24} height={80} rx={12} fill={d.shirt} />
      <g transform={`translate(0 68) rotate(${angles[1] * s})`}>
        <rect x={-10} y={-4} width={20} height={64} rx={10} fill={d.skin} />
        <circle cx={0} cy={64} r={15} fill={d.skin} />
      </g>
    </g>
  );
};

const BROWS: Record<Expression, {y: number; rot: number}> = {
  neutral: {y: 0, rot: 0},
  happy: {y: -5, rot: -4},
  laugh: {y: -6, rot: -6},
  sad: {y: -2, rot: -16},
  angry: {y: 6, rot: 20},
  surprised: {y: -16, rot: -4},
  smug: {y: 0, rot: 8},
};

const Head: React.FC<{
  d: CharacterDesign;
  expression: Expression;
  eyeOpen: number;
  look: number;
  tilt: number;
  mouth: 'A' | 'E' | 'O' | 'M' | null;
}> = ({d, expression, eyeOpen, look, tilt, mouth}) => {
  const brow = BROWS[expression];
  return (
    <g transform={`translate(0 ${HEAD_Y}) rotate(${tilt})`}>
      <HairBack d={d} />
      <circle cx={-HEAD_R + 2} cy={6} r={17} fill={d.skin} />
      <circle cx={HEAD_R - 2} cy={6} r={17} fill={d.skin} />
      <circle r={HEAD_R} fill={d.skin} />
      {/* cheeks */}
      <circle cx={-52} cy={24} r={15} fill="#ff7a8a" opacity={expression === 'happy' || expression === 'laugh' ? 0.45 : 0.18} />
      <circle cx={52} cy={24} r={15} fill="#ff7a8a" opacity={expression === 'happy' || expression === 'laugh' ? 0.45 : 0.18} />
      {/* eyes */}
      {[-30, 30].map((ex) => (
        <g key={ex} transform={`translate(${ex} -8) scale(1 ${eyeOpen})`}>
          <ellipse rx={18} ry={expression === 'surprised' ? 23 : 20} fill="#fff" />
          <circle cx={look} cy={2} r={expression === 'surprised' ? 8 : 10} fill={INK} />
          <circle cx={look + 3} cy={-3} r={3} fill="#fff" />
        </g>
      ))}
      {/* brows */}
      <rect x={-30 - 15} y={-40 + brow.y} width={30} height={7} rx={3.5} fill={shade(d.hair, -0.15)} transform={`rotate(${brow.rot} -30 ${-37 + brow.y})`} />
      <rect x={30 - 15} y={-40 + brow.y} width={30} height={7} rx={3.5} fill={shade(d.hair, -0.15)} transform={`rotate(${-brow.rot} 30 ${-37 + brow.y})`} />
      {/* nose */}
      <ellipse cx={4} cy={14} rx={9} ry={7} fill={shade(d.skin, -0.15)} />
      <g transform="translate(0 42)">
        <Mouth expression={expression} shape={mouth} />
      </g>
      <HairFront d={d} />
      {d.accessory === 'glasses' && (
        <g fill="none" stroke={INK} strokeWidth={5}>
          <circle cx={-30} cy={-8} r={25} />
          <circle cx={30} cy={-8} r={25} />
          <path d="M -5 -10 Q 0 -15 5 -10" />
        </g>
      )}
      {d.accessory === 'cap' && (
        <g>
          <path d="M -86 -30 Q -86 -100 0 -100 Q 86 -100 86 -30 Z" fill={d.shirtAccent ?? d.shirt} />
          <path d="M 40 -36 Q 120 -40 130 -22 L 60 -24 Z" fill={shade(d.shirtAccent ?? d.shirt, -0.2)} />
        </g>
      )}
    </g>
  );
};

const Mouth: React.FC<{expression: Expression; shape: 'A' | 'E' | 'O' | 'M' | null}> = ({expression, shape}) => {
  if (shape) {
    const wide = expression === 'happy' || expression === 'laugh' ? 1.2 : 1;
    const dims = {A: [17, 15], E: [23, 9], O: [11, 13], M: [16, 2.5]}[shape];
    return (
      <g>
        <ellipse rx={dims[0] * wide} ry={dims[1]} fill={INK} />
        {shape === 'A' && <ellipse cy={7} rx={9} ry={5} fill="#ff6f7d" />}
      </g>
    );
  }
  const stroke = {fill: 'none', stroke: INK, strokeWidth: 6, strokeLinecap: 'round' as const};
  switch (expression) {
    case 'happy':
      return <path d="M -24 -4 Q 0 20 24 -4" {...stroke} />;
    case 'laugh':
      return (
        <g>
          <path d="M -28 -6 Q 0 40 28 -6 Z" fill={INK} />
          <ellipse cy={14} rx={11} ry={6} fill="#ff6f7d" />
        </g>
      );
    case 'sad':
      return <path d="M -20 8 Q 0 -8 20 8" {...stroke} />;
    case 'angry':
      return <path d="M -18 4 L 18 0" {...stroke} />;
    case 'surprised':
      return <ellipse rx={12} ry={16} fill={INK} />;
    case 'smug':
      return <path d="M -16 4 Q 6 6 22 -8" {...stroke} />;
    case 'neutral':
    default:
      return <path d="M -16 0 Q 0 8 16 0" {...stroke} />;
  }
};

const HairBack: React.FC<{d: CharacterDesign}> = ({d}) => {
  switch (d.hairStyle) {
    case 'bob':
      return <path d="M -102 60 Q -116 -108 0 -108 Q 116 -108 102 60 Z" fill={d.hair} />;
    case 'bun':
      return <circle cx={0} cy={-98} r={36} fill={d.hair} />;
    case 'ponytail':
      return <path d="M -70 -60 Q -150 -40 -130 60 Q -110 20 -80 -10 Z" fill={d.hair} />;
    default:
      return null;
  }
};

const HairFront: React.FC<{d: CharacterDesign}> = ({d}) => {
  switch (d.hairStyle) {
    case 'spiky':
      return (
        <path
          d="M -92 -6 L -84 -72 L -56 -62 L -50 -112 L -20 -82 L 0 -126 L 20 -84 L 52 -112 L 56 -62 L 86 -74 L 92 -6 Q 60 -52 0 -56 Q -60 -52 -92 -6 Z"
          fill={d.hair}
        />
      );
    case 'bob':
    case 'bun':
    case 'ponytail':
      return <path d="M -90 -4 Q -94 -98 0 -98 Q 94 -98 90 -4 Q 56 -52 14 -44 Q -40 -60 -90 -4 Z" fill={d.hair} />;
    case 'curly':
      return (
        <g fill={d.hair}>
          {Array.from({length: 9}).map((_, i) => {
            const a = Math.PI * (1.05 + (i / 8) * 0.9);
            return <circle key={i} cx={Math.cos(a) * 80} cy={Math.sin(a) * 76 - 8} r={30} />;
          })}
        </g>
      );
    case 'bald':
      return <ellipse cx={-30} cy={-62} rx={22} ry={10} fill="#fff" opacity={0.25} />;
    default:
      return null;
  }
};
