/**
 * "The Archivist" — character skin for Cinematic Geometric Editorial.
 * Silhouette first: long A-line coat, high geometric collar, trailing scarf,
 * sharp asymmetric bob, small head on a tall body. Face reduced to an eye,
 * a nose wedge and a brow. Drawn from puppet v2 joints; every colour is
 * multiplied by the light the scene delivers at the character's position.
 *
 * NOT locked: proportions and parts are data (ARCHIVIST_PROPORTIONS, OUTFIT).
 */
import React from 'react';
import type {Joints, Proportions, Vec} from '../../kit/puppet';
import {hex, rgb, type RGB} from '../../kit/space';
import {smoothPath} from '../draw';

export const ARCHIVIST_PROPORTIONS: Proportions = {
  hipY: -255, shoulderY: -400, headY: -462, headR: 38, shoulderW: 26, hipW: 11,
  upperArm: 86, forearm: 80, thigh: 136, shin: 130,
};
/** Puppet units per metre (the character is ~1.7 m). */
export const UNITS_PER_M = 300;

export const OUTFIT = {
  coat: '#D9503A', coatShade: '#9E3426', lining: '#3B1D28', legs: '#1B2030', shoes: '#0F121C',
  skin: '#EBC5A8', skinShade: '#B98A72', hair: '#15151F', scarf: '#F1E6D2', scarfShade: '#C9BBA2',
};

export type ArchivistExpression = 'neutral' | 'wonder' | 'content' | 'concern';

export interface CharacterLight {
  /** Light multiplier at the character (from the scene's lighting model). */
  light: RGB;
  /** Which local side (+1 front, -1 back) faces the key light. */
  keySide: 1 | -1;
  rim?: {color: string; strength: number; side: 1 | -1};
}

const tone = (c: string, L: RGB, k = 1) => {
  const b = rgb(c);
  return hex([b[0] * L[0] * k, b[1] * L[1] * k, b[2] * L[2] * k]);
};

/** Polygon around a polyline with a width tapering from w0 to w1 (rounded ends via circles). */
function taper(pts: Vec[], w0: number, w1: number): string {
  const n = pts.length;
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    left.push([pts[i][0] - (dy / len) * w, pts[i][1] + (dx / len) * w]);
    right.push([pts[i][0] + (dy / len) * w, pts[i][1] - (dx / len) * w]);
  }
  return `M${[...left, ...right.reverse()].map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
}

/** Mitten hand oriented along the forearm (elbow → wrist), with a thumb. */
function hand(elbow: Vec, wrist: Vec, fill: string, thumbFill: string) {
  const a = (Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]) * 180) / Math.PI;
  return (
    <g transform={`translate(${wrist[0]} ${wrist[1]}) rotate(${a})`}>
      <rect x={-2} y={-9} width={24} height={18} rx={9} fill={fill} />
      <ellipse cx={6} cy={-9} rx={8} ry={4.5} fill={thumbFill} transform="rotate(-25 6 -9)" />
    </g>
  );
}

const HEAD: Vec[] = [[0, -39], [24, -32], [36, -14], [38, 4], [35, 20], [24, 33], [6, 39], [-16, 35], [-32, 22], [-38, 2], [-34, -20], [-20, -34]];
const HAIR: Vec[] = [[-42, -18], [-32, -40], [-6, -50], [22, -45], [38, -30], [44, -14], [30, -20], [16, -24], [2, -20], [-12, -10], [-18, 10], [-22, 30], [-46, 32], [-48, 6]];

const P = (pts: Vec[]) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;

export interface ArchivistProps {
  j: Joints;
  facing: 1 | -1;
  /** Screen scale (px per puppet unit). */
  scale: number;
  x: number;
  y: number;
  expression: ArchivistExpression;
  light: CharacterLight;
  /** Forward speed (units/s) for coat-hem and scarf follow-through. */
  velocity: number;
  t: number;
  /** Something held between the hands, drawn between the back and front arm. */
  held?: {at: Vec; render: (x: number, y: number, s: number) => React.ReactNode};
}

export const Archivist: React.FC<ArchivistProps> = ({j, facing, scale, x, y, expression, light, velocity, t, held}) => {
  const L = light.light;
  const lit = (c: string) => tone(c, L);
  const dark = (c: string) => tone(c, L, 0.58);
  const back = light.keySide === 1 ? -1 : 1; // local x sign of the shadow side
  const hem = Math.max(-28, Math.min(28, -velocity * 0.05)) + Math.sin(t * 2.1) * 2;
  const T = j.torsoAngle;
  const blinkOn = (t + 0.7) % 3.7 < 0.11;

  const shoe = (f: Vec, lift: number, c: string) => <path d={P([[f[0] - 8, f[1] + 2], [f[0] - 6, f[1] - 8], [f[0] + 30, f[1] - 2], [f[0] + 32, f[1] + 2]])} fill={c} transform={`rotate(${-lift * 16} ${f[0]} ${f[1]})`} />;

  const coat: Vec[] = [[-24, -150], [24, -150], [34, -126], [42, 30], [64 + hem, 104], [-58 + hem, 104], [-40, 30], [-34, -126]];
  const coatShadow: Vec[] = back < 0 ? [[-24, -150], [-4, -150], [-2, 104], [-58 + hem, 104], [-40, 30], [-34, -126]] : [[4, -150], [24, -150], [34, -126], [42, 30], [64 + hem, 104], [2, 104]];

  const eyeOpen = blinkOn ? 0.12 : expression === 'content' ? 0.15 : 1;
  const eyeR = expression === 'wonder' ? 5.2 : 4.2;
  const browY = expression === 'wonder' ? -20 : expression === 'concern' ? -14 : -16;
  const browRot = expression === 'concern' ? 14 : expression === 'wonder' ? -6 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      {/* back leg + back arm (in shadow) */}
      <path d={taper([j.hip.l, j.knee.l, j.foot.l], 17, 12)} fill={dark(OUTFIT.legs)} />
      {shoe(j.foot.l, j.footLift.l, dark(OUTFIT.shoes))}
      <path d={taper([j.shoulder.l, j.elbow.l, j.hand.l], 30, 22)} fill={dark(OUTFIT.coatShade)} />
      {hand(j.elbow.l, j.hand.l, dark(OUTFIT.skin), dark(OUTFIT.skinShade))}
      <path d={taper([j.hip.r, j.knee.r, j.foot.r], 17, 12)} fill={lit(OUTFIT.legs)} />
      {shoe(j.foot.r, j.footLift.r, lit(OUTFIT.shoes))}

      {/* scarf tail behind the body, trailing with motion */}
      <g transform={`translate(${j.neck[0]} ${j.neck[1] + 6}) rotate(${18 + j.hairSwing * 1.3 + Math.max(-20, Math.min(20, velocity * 0.03))})`}>
        <path d={P([[-6, 0], [6, 0], [2, 150], [-14, 146]])} fill={dark(OUTFIT.scarfShade)} />
      </g>

      {/* coat in the torso frame */}
      <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${T})`}>
        <path d={P(coat)} fill={lit(OUTFIT.coat)} />
        <path d={P(coatShadow)} fill={dark(OUTFIT.coat)} />
        <path d={P([[9, -150], [13, 104], [17, 104], [13, -150]])} fill={dark(OUTFIT.coatShade)} />
        <path d={P([[-40, 22], [42, 22], [43, 32], [-41, 32]])} fill={dark(OUTFIT.coatShade)} />
        {/* funnel collar: the silhouette signature */}
        <path d={P([[-24, -146], [-36, -178], [32, -180], [24, -146]])} fill={lit(OUTFIT.coat)} />
        <path d={P(back < 0 ? [[-24, -146], [-36, -178], [-4, -179], [-2, -146]] : [[2, -146], [4, -179], [32, -180], [24, -146]])} fill={dark(OUTFIT.coat)} />
        <path d={P([[-36, -178], [32, -180], [29, -173], [-33, -172]])} fill={dark(OUTFIT.lining)} />
      </g>

      <path d={taper([j.neck, [j.head[0], j.head[1] + 30]], 14, 13)} fill={dark(OUTFIT.skin)} />

      {/* head */}
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        <path d={smoothPath(HEAD)} fill={lit(OUTFIT.skin)} />
        <path d={back < 0 ? 'M -38 0 Q -36 28 -6 38 Q -26 14 -20 -26 Z' : 'M 38 0 Q 36 28 6 38 Q 26 14 20 -26 Z'} fill={dark(OUTFIT.skin)} opacity={0.6} />
        {/* nose wedge + eye + brow */}
        <path d={P([[35, -6], [46, 9], [35, 11]])} fill={lit(OUTFIT.skin)} />
        <g transform={`translate(${22 + j.pupil[0] * 0.5} ${-2 + j.pupil[1] * 0.4}) scale(1 ${eyeOpen})`}>
          <ellipse rx={eyeR * 0.8} ry={eyeR} fill="#14121A" />
          {expression === 'wonder' && <circle cx={1.2} cy={-1.6} r={1.4} fill="#fff" />}
        </g>
        {expression === 'content' && <path d="M 16 -2 Q 22 4 28 -2" stroke="#14121A" strokeWidth={2.4} fill="none" strokeLinecap="round" />}
        <rect x={14} y={browY} width={16} height={3} rx={1.5} fill="#14121A" transform={`rotate(${browRot} 22 ${browY})`} />
        {(expression === 'wonder' || expression === 'content') && <path d="M 24 20 Q 29 22 33 19" stroke={dark(OUTFIT.skinShade)} strokeWidth={2.4} fill="none" strokeLinecap="round" />}
        {/* sharp asymmetric bob */}
        <path d={smoothPath(HAIR)} fill={lit(OUTFIT.hair)} />
        <path d={P([[-46, 32], [-22, 30], [-20, 12], [-36, 6]])} fill={dark(OUTFIT.hair)} />
        <path d="M -20 -40 Q 8 -48 30 -36" stroke={tone(OUTFIT.hair, L, 2.2)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
        {light.rim && light.rim.strength > 0.02 && (
          <path
            d={light.rim.side > 0 ? 'M 37 -2 Q 39 12 34 22 Q 28 32 18 36' : 'M -38 -4 Q -38 16 -26 30'}
            stroke={light.rim.color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={Math.min(0.7, light.rim.strength)}
          />
        )}
      </g>

      {held && held.render(held.at[0], held.at[1], 1)}

      {/* front arm on top */}
      <path d={taper([j.shoulder.r, j.elbow.r, j.hand.r], 30, 22)} fill={lit(OUTFIT.coat)} />
      {hand(j.elbow.r, j.hand.r, lit(OUTFIT.skin), dark(OUTFIT.skin))}
    </g>
  );
};
