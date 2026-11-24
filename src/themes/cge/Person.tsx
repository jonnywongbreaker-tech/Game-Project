/**
 * Person v2 — character skin for Cinematic Geometric Editorial.
 * Built from the same language as the environments: faceted planes, banded
 * lit/shadow tones with cool-shadow / warm-light tints (stylize()), no outlines.
 * One component draws any member of the cast from a PersonSpec, so crowds,
 * protagonists and extras share one design system. Exploratory, not locked.
 */
import React from 'react';
import {random} from 'remotion';
import type {Joints, Proportions, Vec, View} from '../../kit/puppet';
import {hex, type Look, rgb, type RGB, stylize} from '../../kit/space';
import {type Expression, FACES, type FaceParams, TALK_OPEN} from './face';

export type {Expression} from './face';
export {PERSON_EXPRESSIONS} from './face';

export type Outfit = 'coat' | 'jacket' | 'sweater' | 'dress';
export type Hair = 'bob' | 'short' | 'bun' | 'long' | 'beanie';
export type HandPose = 'relaxed' | 'hold' | 'open';

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
  /** Camera-relative view; the joints must be solved for the same view. */
  view?: View;
}

const INK = '#1D1820';
const LIP = '#3A1F22';
const eyeOpen = (f: FaceParams) => Math.max(0.12, f.eye.open * (1 - f.eye.cheek * 0.55));

/** Almond eye with lid line; `cheek` adds the smiling lower lid. Eye frame: centre at 0. */
const Eye: React.FC<{k: number; cheek: number; pupil: Vec; w?: number}> = ({k, cheek, pupil, w = 8}) => (
  <g>
    <g transform={`scale(1 ${k})`}>
      <path d={`M ${-w} 0 Q 0 ${-w * 0.88} ${w} 0 Q 0 ${w * 0.5} ${-w} 0 Z`} fill="#F4EEE6" />
      {k > 0.2 && <circle cx={pupil[0]} cy={pupil[1]} r={w * 0.45} fill={INK} />}
    </g>
    <path d={`M ${-w - 1} ${-0.5} Q 0 ${-w * k - 1} ${w + 1} ${-0.5}`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    {cheek > 0.3 && <path d={`M ${-w * 0.8} ${w * 0.55} Q 0 ${w * 0.1} ${w * 0.8} ${w * 0.55}`} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.45} />}
  </g>
);

/** Mouth from expression data, centred at (cx, cy). */
const Mouth: React.FC<{cx: number; cy: number; m: FaceParams['mouth']}> = ({cx, cy, m}) => {
  const k = m.skew ?? 0;
  const y0 = cy + (m.y ?? 0);
  const L: Vec = [cx - m.width + k * 2, y0 - m.curve + k * 1.6];
  const R: Vec = [cx + m.width + k * 2, y0 - m.curve - k * 1.6];
  const mid = cx + k * 2.5;
  if (m.open < 0.6) return <path d={`M ${L[0]} ${L[1]} Q ${mid} ${y0 + m.curve} ${R[0]} ${R[1]}`} stroke={LIP} strokeWidth={2.5} fill="none" strokeLinecap="round" />;
  const top = y0 + m.curve * 0.4 - m.open * 0.15;
  const bottom = y0 + m.curve + m.open * 1.6;
  return (
    <g>
      <path d={`M ${L[0]} ${L[1]} Q ${mid} ${top} ${R[0]} ${R[1]} Q ${mid} ${bottom} ${L[0]} ${L[1]} Z`} fill={LIP} />
      {m.open > 4 && <ellipse cx={mid} cy={(top + bottom) / 2 + m.open * 0.35} rx={m.width * 0.5} ry={m.open * 0.28} fill="#A8494A" />}
    </g>
  );
};

export const Person: React.FC<PersonProps> = (props) => {
  if (props.view === 'front' || props.view === 'back') return <PersonFrontal {...props} />;
  return <PersonProfile {...props} />;
};

const PersonProfile: React.FC<PersonProps> = ({spec, j, facing, scale, x, y, light, look, keySide = 1, rim, expression = 'neutral', hands, velocity = 0, t, talking, held}) => {
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

  const face = FACES[expression];
  const mouthP = talking && Math.floor(t * 8) % 2 === 0 ? TALK_OPEN : face.mouth;
  const eyeK = blinkOn ? 0.1 : eyeOpen(face);
  const gaze = face.eye.gaze ?? [0, 0];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      {/* back leg, back arm */}
      <path d={taper([j.hip.l, j.knee.l, j.foot.l], 30 * hb, 18)} fill={shd(spec.legs)} />
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
        <g transform={`translate(0 ${face.brow.lift})`}>
          <path d={P(BROW)} fill={hex(stylize(rgb(spec.hairColor), light, look))} transform={`rotate(${face.brow.inner} 28 -17)`} />
        </g>
        <g transform="translate(28 -5)">
          <Eye k={eyeK} cheek={face.eye.cheek} pupil={[1.5 + j.pupil[0] * 0.5 + gaze[0] * 3, j.pupil[1] * 0.4 + gaze[1] * 2.5]} />
        </g>
        <Mouth cx={40} cy={24} m={{...mouthP, width: mouthP.width * 0.85}} />
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

// ---------------------------------------------------------------- front and back views (x = screen right)
const HEAD_F: Vec[] = [[-22, -48], [0, -52], [22, -48], [38, -32], [43, -8], [41, 12], [34, 29], [19, 41], [0, 46], [-19, 41], [-34, 29], [-41, 12], [-43, -8], [-38, -32]];
/** Jaw/cheek facet on the shadow side (drawn for x < 0, mirrored for the other side). */
const HEAD_F_SHADE: Vec[] = [[-43, -8], [-41, 12], [-34, 29], [-19, 41], [0, 46], [-5, 37], [-19, 27], [-29, 10], [-33, -9]];
const NOSE_F: Vec[] = [[0, -6], [6, 15], [0, 18], [-3, 15]];
const EAR_F: Vec[] = [[40, -6], [48, -5], [49, 9], [41, 14]];
const m = (pts: Vec[]): Vec[] => pts.map(([a, b]) => [-a, b] as Vec);
const HAIR_FRONT: Record<Hair, {front: Vec[]; behind?: Vec[]; back: Vec[]; ear: boolean}> = {
  bob: {
    front: [[-50, 34], [-54, -10], [-42, -44], [-18, -59], [12, -59], [38, -46], [52, -14], [51, 34], [39, 34], [40, -2], [33, -26], [12, -33], [-12, -25], [-32, -15], [-39, 4], [-39, 34]],
    back: [[-51, 30], [-54, -10], [-42, -44], [-18, -59], [18, -59], [42, -44], [54, -10], [51, 30], [34, 38], [0, 41], [-34, 38]],
    ear: false,
  },
  short: {
    front: [[-44, -2], [-46, -30], [-30, -52], [0, -58], [30, -52], [46, -30], [44, -2], [40, -22], [22, -35], [0, -38], [-22, -35], [-40, -22]],
    back: [[-46, 8], [-46, -30], [-30, -52], [0, -58], [30, -52], [46, -30], [46, 8], [30, 20], [-30, 20]],
    ear: true,
  },
  bun: {
    front: [[-44, -2], [-46, -30], [-30, -52], [0, -58], [30, -52], [46, -30], [44, -2], [40, -22], [18, -36], [0, -32], [-18, -36], [-40, -22]],
    behind: [[-17, -54], [-15, -76], [0, -82], [15, -76], [17, -54]],
    back: [[-46, 4], [-46, -30], [-30, -52], [0, -58], [30, -52], [46, -30], [46, 4], [24, 16], [-24, 16]],
    ear: true,
  },
  long: {
    front: [[-50, 34], [-54, -10], [-42, -44], [-18, -59], [12, -59], [38, -46], [52, -14], [51, 34], [39, 34], [40, -2], [33, -26], [12, -33], [-12, -25], [-32, -15], [-39, 4], [-39, 34]],
    behind: [[-52, -10], [-60, 100], [-34, 106], [34, 106], [60, 100], [52, -10]],
    back: [[-52, -10], [-54, -30], [-40, -50], [0, -59], [40, -50], [54, -30], [52, -10], [60, 100], [34, 106], [-34, 106], [-60, 100]],
    ear: false,
  },
  beanie: {
    front: [[-48, -6], [-45, -44], [-22, -64], [22, -64], [45, -44], [48, -6], [44, -14], [-44, -14]],
    back: [[-48, 6], [-45, -44], [-22, -64], [22, -64], [45, -44], [48, 6], [28, 16], [-28, 16]],
    ear: true,
  },
};

const PersonFrontal: React.FC<PersonProps> = ({spec, j, facing, scale, x, y, light, look, keySide = 1, expression = 'neutral', hands, t, talking, held, view}) => {
  const lit = (c: string) => hex(stylize(rgb(c), light, look));
  const shd = (c: string) => hex(stylize(rgb(c), [light[0] * 0.5, light[1] * 0.5, light[2] * 0.52], look));
  const isBack = view === 'back';
  /** Local side in shadow (-1 = local left); keySide 1 lights local +x. */
  const dark = -keySide as 1 | -1;
  const tone = (side: number) => (side === dark ? shd : lit);
  const hb = spec.build;
  const sh = 30 * hb;
  const hem = Math.sin(t * 2.3) * 1.5;
  const hair = HAIR_FRONT[spec.hair];
  const face = FACES[expression];
  const mouthP = talking && Math.floor(t * 8) % 2 === 0 ? TALK_OPEN : face.mouth;
  const blinkOn = (t * 1.0 + spec.height * 7) % 3.9 < 0.1;
  const eyeK = blinkOn ? 0.1 : eyeOpen(face);
  const gaze = face.eye.gaze ?? [0, 0];
  const clip = dark < 0 ? 'url(#pv2-left)' : 'url(#pv2-right)';
  const shadeHalf = (d: string, c: string) => <path d={d} fill={shd(c)} clipPath={clip} />;
  const outfit: Record<Outfit, Vec[]> = {
    coat: [[-sh, -150], [sh, -150], [sh + 9, -126], [sh + 13, 30], [sh + 22 + hem, 104], [-sh - 22 + hem, 104], [-sh - 13, 30], [-sh - 9, -126]],
    dress: [[-sh + 2, -150], [sh - 2, -150], [sh + 6, -126], [sh + 1, -40], [sh + 20 + hem, 70], [-sh - 20 + hem, 70], [-sh - 1, -40], [-sh - 6, -126]],
    jacket: [[-sh, -150], [sh, -150], [sh + 10, -124], [sh + 11, 22], [-sh - 11, 22], [-sh - 10, -124]],
    sweater: [[-sh + 2, -150], [sh - 2, -150], [sh + 9, -124], [sh + 8, 14], [-sh - 8, 14], [-sh - 9, -124]],
  };
  const hemY = {coat: 104, dress: 70, jacket: 22, sweater: 14}[spec.outfit];
  const sleeve = spec.outfit === 'dress' ? spec.skin : spec.top;

  const arm = (side: 'l' | 'r') => {
    const sx = j.hand[side][0] >= j.shoulder[side][0] ? 1 : -1;
    const sideSign = side === 'r' ? 1 : -1;
    const tn = tone(sideSign);
    const a = (Math.atan2(j.hand[side][1] - j.elbow[side][1], j.hand[side][0] - j.elbow[side][0]) * 180) / Math.PI;
    const h = handShape(hands?.[side] ?? 'relaxed');
    // Thumb toward the body's centre line from the front, away from it from the back.
    const flip = (sx * (isBack ? -1 : 1)) as 1 | -1;
    return (
      <g key={side}>
        <path d={taper([j.shoulder[side], j.elbow[side], j.hand[side]], 27 * hb, 19)} fill={tn(sleeve)} />
        <path d={taper([j.elbow[side], j.hand[side]], 14, 11)} fill={shd(sleeve)} opacity={0.3} />
        <g transform={`translate(${j.hand[side][0]} ${j.hand[side][1]}) rotate(${a}) scale(0.95 ${0.95 * flip})`}>
          {h.fingers.map((fg, i) => <path key={i} d={P(fg)} fill={i % 2 ? shd(spec.skin) : tn(spec.skin)} />)}
          <path d={P(h.palm)} fill={tn(spec.skin)} />
          <path d={P(h.thumb)} fill={isBack ? shd(spec.skin) : tn(spec.skin)} />
        </g>
      </g>
    );
  };
  const leg = (side: 'l' | 'r') => {
    const sg = side === 'r' ? 1 : -1;
    const f = j.foot[side];
    const tn = tone(sg);
    return (
      <g key={side}>
        <path d={taper([j.hip[side], j.knee[side], f], 30 * hb, 17)} fill={tn(spec.legs)} />
        <path d={taper([j.knee[side], f], 7, 6)} fill={shd(spec.legs)} opacity={0.3} transform={`translate(${sg * 5} 0)`} />
        <path d={P([[f[0] - 12, f[1] + 3], [f[0] - 10, f[1] - 11], [f[0] + 10, f[1] - 11], [f[0] + 12, f[1] + 3]])} fill={tn(spec.shoes)} />
        <path d={P(isBack ? [[f[0] - 11, f[1] - 4], [f[0] + 11, f[1] - 4], [f[0] + 12, f[1] + 3], [f[0] - 12, f[1] + 3]] : [[f[0] - 12, f[1] + 3], [f[0] - 13, f[1] - 2], [f[0] + 13, f[1] - 2], [f[0] + 12, f[1] + 3]])} fill={shd(spec.shoes)} />
      </g>
    );
  };

  const torso = (
    <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${j.torsoAngle})`}>
      <path d={P(outfit[spec.outfit])} fill={lit(spec.top)} />
      {shadeHalf(P(outfit[spec.outfit]), spec.top)}
      {!isBack && (spec.outfit === 'coat' || spec.outfit === 'jacket') && (
        <>
          <path d={P([[-13, -150], [13, -150], [0, -100]])} fill={lit(spec.inner)} />
          <path d={P([[-13, -150], [-21, -150], [-2, -90], [0, -100]])} fill={shd(spec.top)} />
          <path d={P([[13, -150], [21, -150], [2, -90], [0, -100]])} fill={shd(spec.top)} opacity={0.7} />
          <path d={P([[-1.5, -96], [1.5, -96], [1.5, hemY], [-1.5, hemY]])} fill={shd(spec.top)} />
        </>
      )}
      {isBack && spec.outfit === 'coat' && <path d={P([[-1.5, 30], [1.5, 30], [1.5, 104], [-1.5, 104]])} fill={shd(spec.top)} />}
      {isBack && spec.outfit !== 'sweater' && <path d={P([[-1, -150], [1, -150], [1, -40], [-1, -40]])} fill={shd(spec.top)} opacity={0.35} />}
      {spec.outfit === 'coat' && <path d={P([[-sh - 13, 18], [sh + 13, 18], [sh + 13, 27], [-sh - 13, 27]])} fill={shd(spec.top)} />}
      {spec.outfit === 'sweater' && <path d={P([[-sh - 8, 4], [sh + 8, 4], [sh + 8, 14], [-sh - 8, 14]])} fill={shd(spec.top)} />}
      {spec.outfit === 'sweater' && !isBack && <path d={P([[-15, -150], [15, -150], [10, -139], [-10, -139]])} fill={shd(spec.top)} />}
      {spec.outfit === 'dress' && !isBack && <path d={P([[-14, -150], [14, -150], [0, -128]])} fill={lit(spec.skin)} />}
      {spec.outfit === 'dress' && <path d={P([[-sh - 1, -46], [sh + 1, -46], [sh + 1, -38], [-sh - 1, -38]])} fill={shd(spec.top)} />}
      {spec.outfit === 'coat' && (
        isBack ? (
          <path d={P([[-sh + 4, -146], [-sh - 3, -176], [sh + 3, -176], [sh - 4, -146]])} fill={tone(dark)(spec.top)} />
        ) : (
          <>
            <path d={P([[-sh + 4, -146], [-sh - 3, -177], [-13, -171], [-12, -146]])} fill={tone(-1)(spec.top)} />
            <path d={P([[sh - 4, -146], [sh + 3, -177], [13, -171], [12, -146]])} fill={tone(1)(spec.top)} />
          </>
        )
      )}
      {spec.bag && <path d={P(isBack ? [[sh - 4, -150], [sh - 12, -150], [-sh - 4, 0], [-sh + 4, 0]] : [[-sh + 4, -150], [-sh + 12, -150], [sh + 4, 0], [sh - 4, 0]])} fill={shd(spec.bag)} />}
      {spec.bag && <path d={P([[(isBack ? -1 : 1) * (sh - 4), -22], [(isBack ? -1 : 1) * (sh + 22), -22], [(isBack ? -1 : 1) * (sh + 24), 18], [(isBack ? -1 : 1) * (sh - 6), 18]])} fill={lit(spec.bag)} />}
      {spec.scarf && (
        <>
          <path d={P([[-19, -162], [19, -162], [17, -144], [-17, -144]])} fill={lit(spec.scarf)} />
          {!isBack && <path d={P([[-15, -150], [-4, -150], [-7, -54], [-18, -58]])} fill={shd(spec.scarf)} />}
        </>
      )}
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      <defs>
        <clipPath id="pv2-left"><rect x={-400} y={-400} width={400} height={800} /></clipPath>
        <clipPath id="pv2-right"><rect x={0} y={-400} width={400} height={800} /></clipPath>
      </defs>
      {isBack && held && held.render()}
      {!isBack && hair.behind && spec.hair === 'long' && (
        <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
          <path d={P(hair.behind)} fill={shd(spec.hairColor)} />
        </g>
      )}
      {leg('l')}
      {leg('r')}
      {torso}
      <path d={taper([j.neck, [j.head[0], j.head[1] + 34]], 22, 20)} fill={shd(spec.skin)} />
      {!isBack && held && held.render()}
      {arm('l')}
      {arm('r')}
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        {hair.behind && spec.hair === 'bun' && <path d={P(hair.behind)} fill={lit(spec.hairColor)} />}
        {hair.ear && (
          <>
            <path d={P(EAR_F)} fill={tone(1)(spec.skin)} />
            <path d={P(m(EAR_F))} fill={tone(-1)(spec.skin)} />
          </>
        )}
        <path d={P(HEAD_F)} fill={lit(spec.skin)} />
        {isBack ? (
          <>
            <path d={P(hair.back)} fill={lit(spec.hairColor)} />
            {shadeHalf(P(hair.back), spec.hairColor)}
            {hair.behind && spec.hair === 'bun' && <path d={P(hair.behind)} fill={lit(spec.hairColor)} />}
            {spec.hair === 'beanie' && <path d={P([[-48, -4], [48, -4], [48, 6], [-48, 6]])} fill={shd(spec.hairColor)} />}
          </>
        ) : (
          <>
            <path d={P(dark < 0 ? HEAD_F_SHADE : m(HEAD_F_SHADE))} fill={shd(spec.skin)} opacity={0.6} />
            <path d={P(NOSE_F)} fill={lit(spec.skin)} />
            <path d={P(dark < 0 ? [[0, -6], [-3, 15], [0, 18]] : [[0, -6], [6, 15], [0, 18]])} fill={shd(spec.skin)} />
            {([-1, 1] as const).map((sd) => (
              <g key={sd}>
                <g transform={`translate(${sd * 16} ${-17 + face.brow.lift}) scale(${sd} 1) rotate(${-face.brow.inner})`}>
                  <path d={P([[-8, 1], [8, -2], [8.5, 2.5], [-8, 5]])} fill={lit(spec.hairColor)} />
                </g>
                <g transform={`translate(${sd * 16} -2)`}>
                  <Eye k={eyeK} cheek={face.eye.cheek} w={7} pupil={[j.pupil[0] * 0.25 + gaze[0] * 3, j.pupil[1] * 0.3 + gaze[1] * 2.5]} />
                </g>
              </g>
            ))}
            <Mouth cx={0} cy={28} m={{...mouthP, width: mouthP.width * 1.25, open: mouthP.open * 1.2}} />
            <path d={P(hair.front)} fill={lit(spec.hairColor)} />
            {shadeHalf(P(hair.front), spec.hairColor)}
            {spec.hair === 'beanie' && <path d={P([[-48, -16], [48, -16], [48, -6], [-48, -6]])} fill={shd(spec.hairColor)} />}
          </>
        )}
      </g>
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
