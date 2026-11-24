/**
 * Person v2 — character skin for Cinematic Geometric Editorial.
 * Built from the same language as the environments: faceted planes, banded
 * lit/shadow tones with cool-shadow / warm-light tints (stylize()), no outlines.
 * One component draws any member of the cast from a PersonSpec, so crowds,
 * protagonists and extras share one design system. Exploratory, not locked.
 */
import React from 'react';
import {random} from 'remotion';
import type {Joints, Proportions, Vec} from '../../kit/puppet';
import {hex, type Look, rgb, type RGB, stylize} from '../../kit/space';

export type Outfit = 'coat' | 'jacket' | 'sweater' | 'dress';
export type Hair = 'bob' | 'short' | 'bun' | 'long' | 'beanie';
export type HandPose = 'relaxed' | 'hold' | 'open';
export type Expression = 'neutral' | 'wonder' | 'content' | 'concern' | 'smile';

export interface PersonSpec {
  outfit: Outfit;
  hair: Hair;
  /** Height multiplier around 1 (≈1.7 m). */
  height: number;
  /** Shoulder/hip width multiplier. */
  build: number;
  skin: string;
  hairColor: string;
  top: string;
  /** Inner shirt / lapel colour. */
  inner: string;
  legs: string;
  shoes: string;
  scarf?: string;
  bag?: string;
}

export const PERSON_PROPORTIONS: Proportions = {
  hipY: -250, shoulderY: -398, headY: -470, headR: 44, shoulderW: 30, hipW: 12, upperArm: 90, forearm: 84, thigh: 132, shin: 128,
};
export const UNITS_PER_M = 300;

export const proportionsFor = (s: PersonSpec): Proportions => {
  const h = s.height;
  const P = PERSON_PROPORTIONS;
  return {...P, hipY: P.hipY * h, shoulderY: P.shoulderY * h, headY: P.headY * h - (1 - h) * 14, upperArm: P.upperArm * h, forearm: P.forearm * h, thigh: P.thigh * h, shin: P.shin * h, shoulderW: P.shoulderW * s.build, hipW: P.hipW * s.build};
};

export const ARCHIVIST: PersonSpec = {
  outfit: 'coat', hair: 'bob', height: 1.04, build: 0.95, skin: '#E8B996', hairColor: '#1C1A26', top: '#D9503A', inner: '#F1E4CF', legs: '#232838', shoes: '#14151F', scarf: '#F1C15E',
};

const SKINS = ['#F1C8A8', '#E0AC86', '#C68863', '#9A6446', '#6F452F'];
const HAIRS = ['#1C1A26', '#3B2A22', '#6B4429', '#B9874C', '#D9D2C6', '#7A2E25'];
const TOPS = ['#2F6F73', '#E2B04A', '#3D4E8C', '#8A4F7D', '#C9673E', '#5F7F4F', '#E6DCCB', '#2C3448'];
const LEGS = ['#232838', '#3B4256', '#5A4A3E', '#2F3A30', '#6E6A72'];

/** Procedural cast member: same design system, different person. */
export function randomPerson(seed: string): PersonSpec {
  const r = (q: string) => random(`${seed}-${q}`);
  const pick = <T,>(a: T[], q: string) => a[Math.floor(r(q) * a.length)];
  return {
    outfit: pick(['coat', 'jacket', 'sweater', 'dress', 'jacket'] as Outfit[], 'o'),
    hair: pick(['bob', 'short', 'bun', 'long', 'beanie', 'short'] as Hair[], 'h'),
    height: 0.9 + r('ht') * 0.2,
    build: 0.9 + r('b') * 0.3,
    skin: pick(SKINS, 's'),
    hairColor: pick(HAIRS, 'hc'),
    top: pick(TOPS, 't'),
    inner: pick(['#F1E4CF', '#E6E1D8', '#2B2E3A', '#D9C29A'], 'i'),
    legs: pick(LEGS, 'l'),
    shoes: pick(['#14151F', '#3A2A22', '#E9E4DA'], 'sh'),
    bag: r('bag') < 0.3 ? pick(['#7A4A2A', '#2B2E3A', '#C9673E'], 'bc') : undefined,
  };
}

/** Tapered polygon around a polyline. */
export function taper(pts: Vec[], w0: number, w1: number): string {
  const n = pts.length;
  const L: Vec[] = [];
  const R: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([pts[i][0] - (dy / len) * w, pts[i][1] + (dx / len) * w]);
    R.push([pts[i][0] + (dy / len) * w, pts[i][1] - (dx / len) * w]);
  }
  return P([...L, ...R.reverse()]);
}
const P = (pts: Vec[]) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
const S = (pts: Vec[], k: number) => pts.map(([x, y]) => [x * k, y * k] as Vec);

// ---------------------------------------------------------------- parts (local, facing +x)
const HEAD: Vec[] = [[-8, -50], [20, -46], [38, -30], [44, -12], [46, -4], [55, 10], [45, 14], [46, 22], [42, 31], [32, 40], [14, 44], [-8, 40], [-30, 28], [-44, 6], [-44, -24], [-30, -44]];
const HEAD_SHADOW: Vec[] = [[-8, 40], [10, 44], [4, 34], [-12, 22], [-26, 4], [-44, -6], [-44, 6], [-30, 28]];
const HAIR_SHAPES: Record<Hair, {front: Vec[]; back?: Vec[]; shade: Vec[]; ear?: boolean}> = {
  bob: {
    front: [[-50, 34], [-53, -10], [-40, -46], [-14, -60], [16, -58], [40, -42], [50, -20], [46, -12], [32, -24], [14, -28], [-2, -22], [-14, -6], [-18, 18], [-24, 36]],
    shade: [[-50, 34], [-24, 36], [-20, 14], [-38, 6]],
  },
  short: {
    front: [[-46, 4], [-46, -32], [-26, -55], [8, -58], [34, -48], [47, -30], [44, -22], [26, -33], [4, -35], [-14, -29], [-26, -12], [-30, 6]],
    shade: [[-46, 4], [-30, 6], [-28, -8], [-44, -12]],
    ear: true,
  },
  bun: {
    front: [[-46, -2], [-44, -36], [-24, -56], [8, -58], [34, -48], [47, -30], [44, -22], [26, -33], [4, -35], [-14, -29], [-26, -12], [-30, 4]],
    back: [[-58, -50], [-46, -70], [-26, -70], [-18, -54], [-30, -40], [-50, -38]],
    shade: [[-46, -2], [-30, 4], [-28, -10], [-44, -14]],
    ear: true,
  },
  long: {
    front: [[-50, 30], [-53, -10], [-40, -46], [-14, -60], [16, -58], [40, -42], [50, -20], [46, -12], [32, -24], [14, -28], [-2, -22], [-14, -6], [-20, 20], [-26, 36]],
    back: [[-54, 20], [-50, 110], [-30, 118], [-12, 60], [-20, 30]],
    shade: [[-50, 30], [-26, 36], [-22, 16], [-38, 8]],
  },
  beanie: {
    front: [[-47, -6], [-42, -46], [-10, -64], [26, -58], [44, -38], [49, -16], [-46, -12]],
    shade: [[-47, -6], [-46, -12], [49, -16], [48, -8]],
    ear: true,
  },
};

const BROW: Vec[] = [[20, -18], [35, -21], [37, -17], [22, -14]];
const NOSE_SHADE: Vec[] = [[45, 14], [55, 10], [50, 14]];

/** Geometric hand: palm, four finger strips and a thumb, in the wrist frame (+x toward the fingertips). */
export function handShape(pose: HandPose): {palm: Vec[]; fingers: Vec[][]; thumb: Vec[]} {
  const palm: Vec[] = [[-2, -10], [18, -12], [26, -10], [27, 9], [16, 12], [-2, 9]];
  const spec: Record<HandPose, {len: number[]; ang: number[]; thumb: Vec[]}> = {
    relaxed: {len: [15, 17, 16, 13], ang: [14, 16, 18, 22], thumb: [[10, -10], [21, -16], [27, -13], [19, -7]]},
    hold: {len: [11, 12, 12, 10], ang: [46, 50, 54, 58], thumb: [[10, -10], [24, -21], [31, -18], [20, -7]]},
    open: {len: [20, 23, 22, 17], ang: [-12, -3, 6, 15], thumb: [[8, -10], [15, -27], [21, -27], [19, -9]]},
  };
  const f = spec[pose];
  const ys = [-8, -3, 2, 7];
  const fingers = ys.map((y, i) => {
    const a = (f.ang[i] * Math.PI) / 180;
    const dx = Math.cos(a) * f.len[i];
    const dy = Math.sin(a) * f.len[i];
    const w = i === 3 ? 2 : 2.4;
    return [[25, y - w], [25 + dx, y - w + dy], [25 + dx + 1.5, y + dy], [25 + dx, y + w + dy], [25, y + w]] as Vec[];
  });
  return {palm, fingers, thumb: f.thumb};
}

export interface PersonProps {
  spec: PersonSpec;
  j: Joints;
  facing: 1 | -1;
  /** px per puppet unit */
  scale: number;
  x: number;
  y: number;
  /** Light arriving at the character (scene lighting model). */
  light: RGB;
  look: Look;
  /** Which local side faces the key light: 1 = front, -1 = back. */
  keySide?: 1 | -1;
  rim?: {color: string; strength: number};
  expression?: Expression;
  hands?: {l?: HandPose; r?: HandPose};
  velocity?: number;
  t: number;
  talking?: boolean;
  held?: {at: Vec; render: () => React.ReactNode};
}

export const Person: React.FC<PersonProps> = ({spec, j, facing, scale, x, y, light, look, keySide = 1, rim, expression = 'neutral', hands, velocity = 0, t, talking, held}) => {
  const lit = (c: string) => hex(stylize(rgb(c), light, look));
  const shd = (c: string) => hex(stylize(rgb(c), [light[0] * 0.5, light[1] * 0.5, light[2] * 0.52], look));
  const back = keySide === 1 ? -1 : 1;
  const hb = spec.build;
  const hem = Math.max(-24, Math.min(24, -velocity * 0.05)) + Math.sin(t * 2.3) * 1.5;
  const blinkOn = (t * 1.0 + spec.height * 7) % 3.9 < 0.1;
  const hair = HAIR_SHAPES[spec.hair];

  const hand = (elbow: Vec, wrist: Vec, pose: HandPose, front: boolean) => {
    const a = (Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]) * 180) / Math.PI;
    const h = handShape(pose);
    const tone = front ? lit : shd;
    return (
      <g transform={`translate(${wrist[0]} ${wrist[1]}) rotate(${a}) scale(0.95)`}>
        {h.fingers.map((fg, i) => (
          <g key={i}>
            <path d={P(fg)} fill={tone(spec.skin)} />
            {i % 2 === 1 && <path d={P(fg)} fill={shd(spec.skin)} opacity={0.4} />}
          </g>
        ))}
        <path d={P(h.palm)} fill={tone(spec.skin)} />
        <path d={P([[-2, 3], [27, 3], [27, 9], [16, 12], [-2, 9]])} fill={shd(spec.skin)} opacity={0.45} />
        <path d={P(h.thumb)} fill={tone(spec.skin)} />
      </g>
    );
  };
  const shoe = (f: Vec, lift: number, front: boolean) => (
    <g transform={`rotate(${-lift * 14} ${f[0]} ${f[1]})`}>
      <path d={P([[f[0] - 12, f[1] + 3], [f[0] - 11, f[1] - 13], [f[0] + 10, f[1] - 13], [f[0] + 34, f[1] - 5], [f[0] + 36, f[1] + 3]])} fill={front ? lit(spec.shoes) : shd(spec.shoes)} />
      <path d={P([[f[0] - 12, f[1] + 3], [f[0] + 36, f[1] + 3], [f[0] + 35, f[1] - 1], [f[0] - 12, f[1] - 1]])} fill={shd(spec.shoes)} />
    </g>
  );

  // torso outlines in the torso frame (pelvis origin; shoulders at y≈-148)
  const sh = 30 * hb;
  const outfitShape: Record<Outfit, Vec[]> = {
    coat: [[-sh, -150], [sh, -150], [sh + 9, -126], [sh + 14, 30], [sh + 30 + hem, 104], [-sh - 26 + hem, 104], [-sh - 12, 30], [-sh - 8, -126]],
    dress: [[-sh + 2, -150], [sh - 2, -150], [sh + 6, -126], [sh + 2, -40], [sh + 26 + hem, 70], [-sh - 22 + hem, 70], [-sh - 2, -40], [-sh - 6, -126]],
    jacket: [[-sh, -150], [sh, -150], [sh + 10, -124], [sh + 12, 22], [-sh - 10, 22], [-sh - 9, -124]],
    sweater: [[-sh + 2, -150], [sh - 2, -150], [sh + 9, -124], [sh + 8, 14], [-sh - 8, 14], [-sh - 8, -124]],
  };
  const body = outfitShape[spec.outfit];
  const half = (pts: Vec[]) => pts.map(([px, py]) => [back < 0 ? Math.min(px, -2) : Math.max(px, 2), py] as Vec);
  const longLegs = spec.outfit === 'dress' ? false : true;

  const mouth =
    talking && Math.floor(t * 8) % 2 === 0 ? <path d={P([[36, 22], [44, 21], [43, 27], [37, 27]])} fill="#3A1F22" />
    : expression === 'smile' || expression === 'content' ? <path d="M 34 22 Q 40 27 45 21" stroke="#3A1F22" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    : expression === 'wonder' ? <ellipse cx={40} cy={24} rx={3} ry={3.6} fill="#3A1F22" />
    : <path d="M 35 24 L 44 23" stroke="#3A1F22" strokeWidth={2.4} strokeLinecap="round" />;
  const browRot = expression === 'concern' ? 10 : expression === 'wonder' ? -8 : 0;
  const browLift = expression === 'wonder' ? -4 : 0;
  const eyeK = blinkOn ? 0.12 : expression === 'content' ? 0.2 : 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      {/* back leg, back arm */}
      {longLegs || true ? <path d={taper([j.hip.l, j.knee.l, j.foot.l], 30 * hb, 18)} fill={shd(spec.legs)} /> : null}
      {shoe(j.foot.l, j.footLift.l, false)}
      <path d={taper([j.shoulder.l, j.elbow.l, j.hand.l], 27 * hb, 19)} fill={shd(spec.outfit === 'dress' ? spec.skin : spec.top)} />
      {hand(j.elbow.l, j.hand.l, hands?.l ?? 'relaxed', false)}
      {spec.hair === 'long' && hair.back && (
        <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt + j.hairSwing * 0.5})`}>
          <path d={P(hair.back)} fill={shd(spec.hairColor)} />
        </g>
      )}
      <path d={taper([j.hip.r, j.knee.r, j.foot.r], 30 * hb, 18)} fill={lit(spec.legs)} />
      <path d={taper([j.knee.r, j.foot.r], 20, 18)} fill={shd(spec.legs)} opacity={0.35} />
      {shoe(j.foot.r, j.footLift.r, true)}

      {spec.scarf && (
        <g transform={`translate(${j.neck[0]} ${j.neck[1] + 8}) rotate(${16 + j.hairSwing * 1.3 + Math.max(-20, Math.min(20, velocity * 0.03))})`}>
          <path d={P([[-7, 0], [7, 0], [4, 130], [-12, 126]])} fill={shd(spec.scarf)} />
        </g>
      )}

      {/* torso */}
      <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${j.torsoAngle})`}>
        {spec.bag && <path d={P([[-sh - 20, -40], [-sh + 6, -40], [-sh + 8, 10], [-sh - 22, 10]])} fill={shd(spec.bag)} />}
        <path d={P(body)} fill={lit(spec.top)} />
        <path d={P(half(body))} fill={shd(spec.top)} />
        {(spec.outfit === 'coat' || spec.outfit === 'jacket') && (
          <>
            <path d={P([[-4, -150], [16, -150], [6, -96]])} fill={lit(spec.inner)} />
            <path d={P([[16, -150], [24, -150], [10, -88], [6, -96]])} fill={shd(spec.top)} />
            <path d={P([[8, -96], [11, spec.outfit === 'coat' ? 104 : 22], [14, spec.outfit === 'coat' ? 104 : 22], [11, -96]])} fill={shd(spec.top)} />
          </>
        )}
        {spec.outfit === 'coat' && <path d={P([[-sh - 12, 18], [sh + 13, 18], [sh + 13, 27], [-sh - 12, 27]])} fill={shd(spec.top)} />}
        {spec.outfit === 'sweater' && <path d={P([[-sh - 8, 4], [sh + 8, 4], [sh + 8, 14], [-sh - 8, 14]])} fill={shd(spec.top)} />}
        {spec.outfit === 'sweater' && <path d={P([[-14, -150], [16, -150], [12, -140], [-10, -140]])} fill={shd(spec.top)} />}
        {spec.outfit === 'coat' && (
          <>
            <path d={P([[-sh + 4, -146], [-sh - 4, -176], [sh + 4, -178], [sh - 2, -146]])} fill={lit(spec.top)} />
            <path d={P(back < 0 ? [[-sh + 4, -146], [-sh - 4, -176], [-2, -177], [-1, -146]] : [[1, -146], [2, -177], [sh + 4, -178], [sh - 2, -146]])} fill={shd(spec.top)} />
          </>
        )}
      </g>

      <path d={taper([j.neck, [j.head[0] - 6, j.head[1] + 34]], 22, 20)} fill={shd(spec.skin)} />

      {/* head */}
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        {hair.back && spec.hair === 'bun' && <path d={P(hair.back)} fill={lit(spec.hairColor)} />}
        <path d={P(HEAD)} fill={lit(spec.skin)} />
        <path d={P(back < 0 ? HEAD_SHADOW : S(HEAD_SHADOW, 1).map(([a, b]) => [-a * 0.2 + 30, b] as Vec))} fill={shd(spec.skin)} opacity={0.6} />
        <path d={P(NOSE_SHADE)} fill={shd(spec.skin)} />
        {hair.ear && <path d={P([[-8, -6], [2, -8], [5, 8], [-4, 12], [-10, 4]])} fill={shd(spec.skin)} />}
        <g transform={`translate(0 ${browLift})`}>
          <path d={P(BROW)} fill={hex(stylize(rgb(spec.hairColor), light, look))} transform={`rotate(${browRot} 28 -17)`} />
        </g>
        <g transform={`translate(28 -5) scale(1 ${eyeK})`}>
          <path d="M -8 0 Q 0 -7 8 0 Q 0 4 -8 0 Z" fill="#F4EEE6" />
          <circle cx={1.5 + j.pupil[0] * 0.5} cy={j.pupil[1] * 0.4} r={3.6} fill="#1D1820" />
          <path d="M -9 -0.5 Q 0 -8 9 -0.5" stroke="#1D1820" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </g>
        {mouth}
        <path d={P(hair.front)} fill={lit(spec.hairColor)} />
        <path d={P(hair.shade)} fill={shd(spec.hairColor)} />
        {rim && rim.strength > 0.02 && <path d="M 46 -4 L 55 10 L 46 14 L 46 22 L 42 31" stroke={rim.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" opacity={Math.min(0.8, rim.strength)} />}
      </g>

      {held && held.render()}

      {/* front arm */}
      <path d={taper([j.shoulder.r, j.elbow.r, j.hand.r], 27 * hb, 19)} fill={lit(spec.outfit === 'dress' ? spec.skin : spec.top)} />
      <path d={taper([j.elbow.r, j.hand.r], 16, 12)} fill={shd(spec.outfit === 'dress' ? spec.skin : spec.top)} opacity={0.4} />
      {hand(j.elbow.r, j.hand.r, hands?.r ?? 'relaxed', true)}
    </g>
  );
};

/** A single hand (for close-up inserts and design sheets), same drawing as on the body. */
export const PersonHand: React.FC<{x: number; y: number; angle: number; scale: number; pose: HandPose; skin: string; light: RGB; look: Look}> = ({x, y, angle, scale, pose, skin, light, look}) => {
  const lit = hex(stylize(rgb(skin), light, look));
  const shd = hex(stylize(rgb(skin), [light[0] * 0.5, light[1] * 0.5, light[2] * 0.52], look));
  const h = handShape(pose);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path d={P([[-30, -9], [-2, -11], [-2, 10], [-30, 8]])} fill={shd} />
      {h.fingers.map((fg, i) => (
        <g key={i}>
          <path d={P(fg)} fill={lit} />
          {i % 2 === 1 && <path d={P(fg)} fill={shd} opacity={0.4} />}
        </g>
      ))}
      <path d={P(h.palm)} fill={lit} />
      <path d={P([[-2, 3], [27, 3], [27, 9], [16, 12], [-2, 9]])} fill={shd} opacity={0.45} />
      <path d={P(h.thumb)} fill={lit} />
    </g>
  );
};
