import React from 'react';
import {shade} from '../engine/color';
import {blendedArms, blink, limb, walkCycle} from '../engine/rig';
import {resolveTimed, type Timed, useTime, wave} from '../engine/time';
import type {Expression, Pose} from '../engine/vocab';

/** How a figure is drawn. Same rig, different look: this is the "skin" half of rig/skin. */
export interface FigureLook {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
  ink: string;
  /** Two-tone shadow colour (flat shading). */
  shadow: string;
  shading: 'flat' | 'hatch' | 'volumetric';
  /** Ink outline drawn around every part. */
  outline?: {color: string; width: number};
  /** SVG filter applied to the whole figure, e.g. "url(#rough)". */
  filter?: string;
  /** Pattern id for hatched shading. */
  hatchId?: string;
  /** Rim light on the lit edge (volumetric). */
  rim?: {color: string; strength: number};
  eyes: 'dot' | 'lidded';
}

export interface FigureProps {
  id: string;
  look: FigureLook;
  x: number;
  y: number;
  facing?: 1 | -1;
  scale?: number;
  walking?: boolean;
  walkPhase?: number;
  pose?: Timed<Pose>;
  expression?: Timed<Expression>;
  /** World light direction: +1 = light from the right, -1 = from the left. */
  lightDir?: number;
  seed?: number;
}

const HIP_Y = -205;
const SHOULDER_Y = -365;
const HEAD_Y = -452;
const HEAD_R = 64;
export const FIGURE_HEIGHT = -HEAD_Y + HEAD_R + 20;

const BROWS: Record<Expression, {dy: number; rot: number}> = {
  neutral: {dy: 0, rot: 0},
  happy: {dy: -4, rot: -5},
  laugh: {dy: -5, rot: -8},
  sad: {dy: -1, rot: -16},
  angry: {dy: 4, rot: 18},
  surprised: {dy: -12, rot: -4},
  smug: {dy: 0, rot: 10},
};

const TORSO = `M -50 ${SHOULDER_Y + 4} Q -50 ${SHOULDER_Y - 18} -24 ${SHOULDER_Y - 20} L 24 ${SHOULDER_Y - 20} Q 50 ${SHOULDER_Y - 18} 50 ${SHOULDER_Y + 4} L 43 ${HIP_Y + 4} Q 0 ${HIP_Y + 12} -43 ${HIP_Y + 4} Z`;
const HAIR = `M -64 ${HEAD_Y + 26} Q -74 ${HEAD_Y - 72} 0 ${HEAD_Y - 68} Q 56 ${HEAD_Y - 66} 62 ${HEAD_Y - 18} Q 30 ${HEAD_Y - 44} 4 ${HEAD_Y - 34} Q -22 ${HEAD_Y - 18} -30 ${HEAD_Y + 30} Z`;

export const Figure: React.FC<FigureProps> = (p) => {
  const {t} = useTime();
  const L = p.look;
  const facing = p.facing ?? 1;
  const localLight = (p.lightDir ?? 1) * facing;
  const walk = walkCycle(p.walkPhase ?? 0, !!p.walking);
  const bob = p.walking ? walk.bob : wave(t, 0.45, 2.5, (p.seed ?? 0) * 0.2);
  const arms = blendedArms(p.pose ?? 'idle', t);
  const expression = resolveTimed(t, p.expression ?? 'neutral').value;
  const eyeOpen = expression === 'laugh' ? 0.3 : blink(t, p.seed ?? 0);
  const brow = BROWS[expression];
  const ow = L.outline?.width ?? 0;
  const stroke = L.outline ? {stroke: L.outline.color, strokeWidth: ow, strokeLinejoin: 'round' as const} : {};

  const legRoots: [number, number][] = [[-18, HIP_Y], [18, HIP_Y]];
  const legs = legRoots.map((root, i) => limb(root, [walk.thigh[i], -walk.knee[i]], [104, 98], 1));
  const armL = limb([-46, SHOULDER_Y + 8], [arms.l[0] - walk.arm, arms.l[1]], [86, 80], -1);
  const armR = limb([46, SHOULDER_Y + 8], [arms.r[0] + walk.arm, arms.r[1]], [86, 80], 1);

  const limbPath = (root: [number, number], mid: [number, number], end: [number, number]) =>
    `M ${root[0]} ${root[1]} L ${mid[0]} ${mid[1]} L ${end[0]} ${end[1]}`;

  const drawArm = (root: [number, number], a: {mid: [number, number]; end: [number, number]}) => (
    <g>
      {L.outline && (
        <path d={limbPath(root, a.mid, a.end)} stroke={L.outline.color} strokeWidth={30 + ow * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      <path d={`M ${a.mid[0]} ${a.mid[1]} L ${a.end[0]} ${a.end[1]}`} stroke={L.skin} strokeWidth={24} strokeLinecap="round" fill="none" />
      <path d={`M ${root[0]} ${root[1]} L ${a.mid[0]} ${a.mid[1]}`} stroke={L.top} strokeWidth={30} strokeLinecap="round" fill="none" />
      <circle cx={a.end[0]} cy={a.end[1]} r={15} fill={L.skin} {...stroke} />
    </g>
  );

  const shadeOverlay = (clip: string, kind: 'torso' | 'head') => {
    const dark = localLight >= 0 ? -1 : 1; // which side is in shadow (local x sign)
    if (L.shading === 'flat') {
      return kind === 'torso' ? (
        <rect clipPath={`url(#${clip})`} x={dark < 0 ? -80 : 6} y={SHOULDER_Y - 40} width={74} height={200} fill={L.shadow} opacity={0.9} />
      ) : (
        <circle clipPath={`url(#${clip})`} cx={-dark * 26} cy={HEAD_Y - 8} r={HEAD_R + 6} fill="none" stroke={L.shadow} strokeWidth={22} opacity={0.55} />
      );
    }
    if (L.shading === 'hatch' && L.hatchId) {
      return kind === 'torso' ? (
        <rect clipPath={`url(#${clip})`} x={dark < 0 ? -80 : 0} y={SHOULDER_Y - 40} width={80} height={200} fill={`url(#${L.hatchId})`} opacity={0.55} />
      ) : (
        <rect clipPath={`url(#${clip})`} x={dark < 0 ? -80 : 18} y={HEAD_Y - 70} width={62} height={140} fill={`url(#${L.hatchId})`} opacity={0.4} />
      );
    }
    // volumetric: soft gradient across the form
    return <rect clipPath={`url(#${clip})`} x={-90} y={kind === 'torso' ? SHOULDER_Y - 40 : HEAD_Y - 80} width={180} height={kind === 'torso' ? 200 : 170} fill={`url(#${p.id}-vol)`} />;
  };

  const rim = (path: string) => (L.rim ? <path d={path} fill="none" stroke={L.rim.color} strokeWidth={5} strokeLinecap="round" opacity={L.rim.strength} /> : null);
  const sx = localLight >= 0 ? 1 : -1;
  const arc = (r: number, a0: number, a1: number, cx: number, cy: number) => {
    const p0 = [cx + sx * Math.cos(a0) * r, cy + Math.sin(a0) * r];
    const p1 = [cx + sx * Math.cos(a1) * r, cy + Math.sin(a1) * r];
    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 ${sx > 0 ? 1 : 0} ${p1[0]} ${p1[1]}`;
  };

  const mouth = (() => {
    const s = {fill: 'none', stroke: L.ink, strokeWidth: 4.5, strokeLinecap: 'round' as const};
    const my = HEAD_Y + 28;
    switch (expression) {
      case 'happy':
        return <path d={`M 21 ${my - 3} Q 34 ${my + 10} 48 ${my - 4}`} {...s} />;
      case 'laugh':
        return <path d={`M 19 ${my - 5} Q 35 ${my + 22} 51 ${my - 6} Z`} fill={L.ink} />;
      case 'sad':
        return <path d={`M 23 ${my + 5} Q 34 ${my - 4} 45 ${my + 5}`} {...s} />;
      case 'surprised':
        return <ellipse cx={34} cy={my + 2} rx={6} ry={8} fill={L.ink} />;
      case 'angry':
        return <path d={`M 23 ${my + 2} L 45 ${my}`} {...s} />;
      default:
        return <path d={`M 25 ${my} Q 34 ${my + 5} 43 ${my}`} {...s} />;
    }
  })();

  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${(p.scale ?? 1) * facing} ${p.scale ?? 1})`} filter={L.filter}>
      <defs>
        <clipPath id={`${p.id}-torso`}>
          <path d={TORSO} />
        </clipPath>
        <clipPath id={`${p.id}-head`}>
          <circle cx={0} cy={HEAD_Y} r={HEAD_R} />
        </clipPath>
        <linearGradient id={`${p.id}-vol`} gradientUnits="userSpaceOnUse" x1={localLight >= 0 ? 60 : -60} y1={0} x2={localLight >= 0 ? -60 : 60} y2={0}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="0.55" stopColor="#1a1030" stopOpacity={0.12} />
          <stop offset="1" stopColor="#1a1030" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${bob})`}>
        {/* back arm, legs */}
        {drawArm([-46, SHOULDER_Y + 8], armL)}
        {legs.map((leg, i) => (
          <g key={i}>
            {L.outline && <path d={limbPath(legRoots[i], leg.mid, leg.end)} stroke={L.outline.color} strokeWidth={38 + ow * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
            <path d={limbPath(legRoots[i], leg.mid, leg.end)} stroke={i === 0 ? shade(L.bottom, -0.12) : L.bottom} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d={`M ${leg.end[0] - 20} ${leg.end[1] + 12} Q ${leg.end[0] - 22} ${leg.end[1] - 12} ${leg.end[0]} ${leg.end[1] - 12} Q ${leg.end[0] + 40} ${leg.end[1] - 10} ${leg.end[0] + 40} ${leg.end[1] + 12} Z`} fill={L.shoes} {...stroke} />
          </g>
        ))}
        {/* torso */}
        <rect x={-10} y={HEAD_Y + 40} width={20} height={SHOULDER_Y - HEAD_Y - 30} fill={shade(L.skin, -0.12)} />
        <path d={TORSO} fill={L.top} {...stroke} />
        {shadeOverlay(`${p.id}-torso`, 'torso')}
        <path d={`M -44 ${HIP_Y - 10} L 44 ${HIP_Y - 10} L 46 ${HIP_Y + 18} L -46 ${HIP_Y + 18} Z`} fill={L.bottom} {...stroke} />
        {rim(`M ${sx * 50} ${SHOULDER_Y + 2} L ${sx * 43} ${HIP_Y}`)}
        {/* head */}
        <circle cx={-54} cy={HEAD_Y - 40} r={25} fill={L.hair} {...stroke} />
        <circle cx={0} cy={HEAD_Y} r={HEAD_R} fill={L.skin} {...stroke} />
        {shadeOverlay(`${p.id}-head`, 'head')}
        <path d={`M 61 ${HEAD_Y - 6} Q 75 ${HEAD_Y + 7} 60 ${HEAD_Y + 13}`} fill={L.skin} {...stroke} />
        <circle cx={-18} cy={HEAD_Y + 6} r={12} fill={shade(L.skin, -0.08)} {...stroke} />
        <circle cx={46} cy={HEAD_Y + 16} r={10} fill="#ff7f8a" opacity={expression === 'happy' || expression === 'laugh' ? 0.45 : 0.2} />
        {[16, 45].map((ex) => (
          <g key={ex} transform={`translate(${ex} ${HEAD_Y - 2}) scale(1 ${eyeOpen})`}>
            {L.eyes === 'lidded' ? (
              <>
                <ellipse rx={9} ry={expression === 'surprised' ? 12 : 10} fill="#fff" />
                <circle cx={3} cy={1} r={5.5} fill={L.ink} />
                <circle cx={5} cy={-2} r={1.8} fill="#fff" />
                <path d="M -10 -6 Q 0 -13 10 -6" stroke={L.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
              </>
            ) : (
              <circle r={6.5} fill={L.ink} />
            )}
          </g>
        ))}
        {[16, 45].map((ex, i) => (
          <rect
            key={`b${ex}`}
            x={ex - 9}
            y={HEAD_Y - 22 + brow.dy}
            width={18}
            height={4.5}
            rx={2.2}
            fill={L.ink}
            transform={`rotate(${i === 0 ? brow.rot : -brow.rot} ${ex} ${HEAD_Y - 20 + brow.dy})`}
          />
        ))}
        {mouth}
        <path d={HAIR} fill={L.hair} {...stroke} transform={`translate(0 ${HEAD_Y}) scale(1.1) translate(0 ${-HEAD_Y})`} />
        {rim(arc(HEAD_R - 1, -1.25, 0.7, 0, HEAD_Y))}
        {/* front arm */}
        {drawArm([46, SHOULDER_Y + 8], armR)}
      </g>
    </g>
  );
};
