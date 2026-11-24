/**
 * THEME A — Premium geometric editorial.
 * Flat planes, strict midnight + amber palette, two-tone planar shading,
 * geometric light shafts, concentric-ring glows, Swiss typography. No texture.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {mix, shade} from '../engine/color';
import {FONT} from '../engine/fonts';
import {blink} from '../engine/rig';
import {SHELF_FRAME, shelfBooks, shelfSlots} from '../kit/library';
import {linkPath, linkPoint} from '../kit/network';
import type {Vec} from '../kit/puppet';
import {archPath, poly} from './draw';
import type {CharacterView, Ctx, Theme} from './types';

const C = {
  night: '#141B33', wallFar: '#1B2440', wall: '#223056', wallLit: '#2A3A66', shelf: '#2E3F6E', shelfSide: '#1D2949', shelfIn: '#151D36',
  floor: '#18203C', floorTile: '#1E2848', coral: '#E8604C', amber: '#F2B441', cream: '#F4ECDD', teal: '#3AA6A0', violet: '#7B6CD9',
  blue: '#4F86E0', sky1: '#2A2F6B', sky2: '#3B3A85', wood: '#C98A5B', woodDark: '#9C6640', leaf: '#2F9C7F', leafDark: '#21755F',
  skin: '#F2C1A0', skinShade: '#DDA283', hair: '#2B1E3D',
};
const BOOKS = [C.coral, C.amber, C.teal, C.cream, C.violet, C.blue];
const GROUND = 900;

const Backdrop: Theme['modules']['backdrop'] = () => (
  <g>
    <rect x={-2000} y={-1500} width={6000} height={4000} fill={C.wallFar} />
    {Array.from({length: 30}).map((_, i) => (
      <rect key={i} x={-1600 + i * 180} y={-1500} width={2} height={2600} fill={C.wall} opacity={0.6} />
    ))}
    <rect x={-2000} y={180} width={6000} height={8} fill={C.wall} />
  </g>
);

const Window: Theme['modules']['window'] = ({m, ctx}) => {
  const {x, y, w, h} = m;
  const moon = x === 860;
  return (
    <g>
      <path d={archPath(x - 22, y - 22, w + 44, h + 44)} fill={C.shelf} />
      <path d={archPath(x, y, w, h)} fill={C.sky1} />
      <path d={`M ${x} ${y + h * 0.55} L ${x + w} ${y + h * 0.4} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={C.sky2} />
      {moon && <circle cx={x + w * 0.62} cy={y + 150} r={46} fill={C.cream} />}
      {moon && <circle cx={x + w * 0.62 + 16} cy={y + 140} r={38} fill={C.sky1} opacity={0.0} />}
      {Array.from({length: 7}).map((_, i) => (
        <circle key={i} cx={x + 20 + random(`st${x}${i}`) * (w - 40)} cy={y + 60 + random(`sy${x}${i}`) * (h * 0.5)} r={2 + (i % 2)} fill={C.cream} opacity={0.5 + 0.5 * Math.sin(ctx.t * 2 + i)} />
      ))}
      <rect x={x + w / 2 - 5} y={y + w / 2} width={10} height={h - w / 2} fill={C.shelf} />
      {[0.42, 0.7].map((k) => (
        <rect key={k} x={x} y={y + h * k} width={w} height={10} fill={C.shelf} />
      ))}
      <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + w / 2}`} stroke={C.shelf} strokeWidth={10} />
      <rect x={x - 34} y={y + h + 18} width={w + 68} height={20} fill={C.shelf} />
      {/* geometric moonlight shaft */}
      <path d={`M ${x} ${y + w / 2} L ${x + w} ${y + w / 2} L ${x + w + 520} ${GROUND + 60} L ${x + 240} ${GROUND + 60} Z`} fill={C.cream} opacity={0.045} />
    </g>
  );
};

const Shelf: Theme['modules']['shelf'] = ({m}) => {
  const s = m.spec;
  const far = m.depth < 1;
  const books = shelfBooks(s);
  const front = far ? mix(C.shelf, C.wallFar, 0.35) : C.shelf;
  return (
    <g>
      {/* side plane (planar depth) */}
      <path d={poly([[s.x + s.w, s.y], [s.x + s.w + 26, s.y + 16], [s.x + s.w + 26, s.y + s.h], [s.x + s.w, s.y + s.h]])} fill={C.shelfSide} />
      <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={front} />
      {shelfSlots(s).map((sl, i) => (
        <g key={i}>
          <rect x={sl.x} y={sl.y} width={sl.w} height={sl.h} fill={C.shelfIn} />
          <rect x={sl.x} y={sl.y} width={sl.w} height={14} fill="#000" opacity={0.25} />
        </g>
      ))}
      {books.map((b, i) => {
        const col = far ? mix(BOOKS[b.color], C.wallFar, 0.45) : BOOKS[b.color];
        if (b.flat) return <rect key={i} x={b.x} y={b.y - b.h} width={b.w} height={b.h - 1} rx={1.5} fill={col} />;
        return (
          <g key={i} transform={b.tilt ? `rotate(${b.tilt} ${b.x + b.w} ${b.y})` : undefined}>
            <rect x={b.x} y={b.y - b.h} width={b.w} height={b.h} rx={1.5} fill={col} />
            <rect x={b.x + b.w * 0.55} y={b.y - b.h} width={b.w * 0.45} height={b.h} fill="#000" opacity={0.14} />
            {b.band > 0 && <rect x={b.x} y={b.y - b.h * 0.78} width={b.w} height={b.band === 1 ? 4 : 9} fill={shade(col, -0.35)} />}
          </g>
        );
      })}
      <rect x={s.x - 10} y={s.y - 14} width={s.w + 20} height={SHELF_FRAME + 6} fill={far ? front : shade(C.shelf, 0.12)} />
      <rect x={s.x - 6} y={s.y + s.h - 6} width={s.w + 12} height={far ? 400 : 12} fill={shade(front, -0.15)} />
    </g>
  );
};

const Lamp: Theme['modules']['lamp'] = ({m, ctx}) => {
  const sway = Math.sin(ctx.t * 0.9 + m.x) * 1.2;
  return (
    <g transform={`rotate(${sway} ${m.x} ${m.y - m.cord})`}>
      <path d={`M ${m.x - 260} ${m.y + 40} L ${m.x + 260} ${m.y + 40} L ${m.x + 460} ${GROUND + 80} L ${m.x - 460} ${GROUND + 80} Z`} fill={C.amber} opacity={0.05} />
      <line x1={m.x} y1={m.y - m.cord} x2={m.x} y2={m.y - 40} stroke={C.shelf} strokeWidth={4} />
      <circle cx={m.x} cy={m.y + 30} r={120} fill={C.amber} opacity={0.1} style={{mixBlendMode: 'screen'}} />
      <circle cx={m.x} cy={m.y + 30} r={70} fill={C.amber} opacity={0.14} style={{mixBlendMode: 'screen'}} />
      <path d={`M ${m.x - 18} ${m.y - 42} L ${m.x + 18} ${m.y - 42} L ${m.x + 70} ${m.y + 30} L ${m.x - 70} ${m.y + 30} Z`} fill={C.teal} />
      <path d={`M ${m.x} ${m.y - 42} L ${m.x + 18} ${m.y - 42} L ${m.x + 70} ${m.y + 30} L ${m.x} ${m.y + 30} Z`} fill="#000" opacity={0.18} />
      <ellipse cx={m.x} cy={m.y + 30} rx={70} ry={10} fill={C.amber} />
      <circle cx={m.x} cy={m.y + 34} r={16} fill={C.cream} />
    </g>
  );
};

const Floor: Theme['modules']['floor'] = () => (
  <g>
    <rect x={-2000} y={GROUND - 20} width={6000} height={1400} fill={C.floor} />
    {Array.from({length: 46}).map((_, i) => (
      <path key={i} d={`M ${-1600 + i * 120} ${GROUND - 20} L ${-1600 + i * 120 + 60} ${GROUND + 20} L ${-1600 + i * 120} ${GROUND + 60} L ${-1600 + i * 120 - 60} ${GROUND + 20} Z`} fill={C.floorTile} />
    ))}
    <rect x={-2000} y={GROUND - 26} width={6000} height={8} fill={C.shelfSide} />
  </g>
);

const Rug: Theme['modules']['rug'] = ({m}) => (
  <g>
    <path d={poly([[m.x + 40, GROUND - 4], [m.x + m.w - 40, GROUND - 4], [m.x + m.w, GROUND + 70], [m.x, GROUND + 70]])} fill={C.coral} />
    <path d={poly([[m.x + 70, GROUND + 6], [m.x + m.w - 70, GROUND + 6], [m.x + m.w - 40, GROUND + 58], [m.x + 40, GROUND + 58]])} fill="none" stroke={C.amber} strokeWidth={5} />
    {Array.from({length: 9}).map((_, i) => (
      <path key={i} d={`M ${m.x + 120 + i * ((m.w - 240) / 8)} ${GROUND + 18} l 14 14 l -14 14 l -14 -14 Z`} fill={C.cream} />
    ))}
  </g>
);

const Table: Theme['modules']['table'] = ({m}) => (
  <g>
    <rect x={m.x + 30} y={GROUND - 190} width={14} height={180} fill={C.woodDark} />
    <rect x={m.x + m.w - 44} y={GROUND - 190} width={14} height={180} fill={C.woodDark} />
    <rect x={m.x} y={GROUND - 206} width={m.w} height={22} rx={4} fill={C.wood} />
    {[0, 1, 2].map((k) => (
      <rect key={k} x={m.x + 30 + k * 8} y={GROUND - 236 - k * 26} width={120 - k * 14} height={24} rx={2} fill={BOOKS[(k * 2 + 1) % 6]} />
    ))}
    <g transform={`translate(${m.x + 190} ${GROUND - 206})`}>
      <path d="M -22 0 L 22 0 L 16 -40 L -16 -40 Z" fill={C.coral} />
      {[-30, 0, 30].map((a) => (
        <ellipse key={a} cx={0} cy={-70} rx={10} ry={30} fill={C.leaf} transform={`rotate(${a} 0 -40)`} />
      ))}
    </g>
  </g>
);

const Plant: Theme['modules']['plant'] = ({m, ctx}) => (
  <g transform={`translate(${m.x} ${GROUND}) scale(${m.scale})`}>
    {[-55, -30, -8, 14, 36, 60].map((a, i) => (
      <g key={i} transform={`rotate(${a + Math.sin(ctx.t * 0.8 + i) * 2} 0 -120)`}>
        <ellipse cx={0} cy={-250} rx={34} ry={110} fill={i % 2 ? C.leaf : C.leafDark} />
        <line x1={0} y1={-140} x2={0} y2={-340} stroke={C.leafDark} strokeWidth={3} />
      </g>
    ))}
    <path d="M -70 -130 L 70 -130 L 54 0 L -54 0 Z" fill={C.coral} />
    <path d="M 0 -130 L 70 -130 L 54 0 L 0 0 Z" fill="#000" opacity={0.15} />
  </g>
);

const Ladder: Theme['modules']['ladder'] = ({m}) => {
  const bottom = GROUND;
  const dx = Math.tan((m.lean * Math.PI) / 180) * (bottom - m.topY);
  const rails = [0, 70];
  return (
    <g>
      {rails.map((o) => (
        <line key={o} x1={m.x + o} y1={m.topY} x2={m.x + o + dx} y2={bottom} stroke={C.wood} strokeWidth={12} strokeLinecap="round" />
      ))}
      {Array.from({length: 8}).map((_, i) => {
        const k = (i + 0.6) / 8.5;
        const y = m.topY + (bottom - m.topY) * k;
        return <line key={i} x1={m.x + dx * k} y1={y} x2={m.x + 70 + dx * k} y2={y} stroke={C.woodDark} strokeWidth={8} />;
      })}
    </g>
  );
};

const Column: Theme['modules']['column'] = ({m}) => (
  <g>
    <rect x={m.x} y={-800} width={m.w} height={2400} fill={C.night} />
    <rect x={m.x + m.w - 10} y={-800} width={10} height={2400} fill={C.wallLit} />
  </g>
);

const BookStack: Theme['modules']['bookstack'] = ({m}) => (
  <g>
    {Array.from({length: m.count}).map((_, i) => {
      const w = 260 - i * 14 + random(`${m.seed}${i}`) * 30;
      const x = m.x + (random(`${m.seed}x${i}`) - 0.5) * 30;
      return (
        <g key={i}>
          <rect x={x} y={m.y - (i + 1) * 34} width={w} height={32} rx={3} fill={shade(BOOKS[i % 6], -0.55)} />
          <rect x={x} y={m.y - (i + 1) * 34} width={w} height={6} fill={shade(BOOKS[i % 6], -0.3)} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- character
const OUTFIT = {top: C.teal, topShade: shade(C.teal, -0.22), shirt: C.cream, bottom: '#2A2140', bottomShade: '#1E1730', shoes: C.coral};

const Character: React.FC<CharacterView> = ({joints: j, x, groundY, facing, expression, ctx}) => {
  const lp = (a: Vec, b: Vec, c: Vec) => poly([a, b, c]);
  const eye = blink(ctx.t, 3);
  const limb = (pts: Vec[], color: string, w: number) => <path d={poly(pts)} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  const shoe = (f: Vec, lift: number, color: string) => (
    <g transform={`translate(${f[0]} ${f[1]}) rotate(${-lift * 18})`}>
      <path d="M -16 6 Q -18 -12 0 -12 Q 34 -12 38 6 Z" fill={color} />
    </g>
  );
  const mouth = {
    neutral: <path d="M 22 30 Q 32 35 42 30" stroke={C.night} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
    happy: <path d="M 18 26 Q 32 42 46 25" stroke={C.night} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
    laugh: <path d="M 16 24 Q 33 50 50 23 Z" fill={C.night} />,
    sad: <path d="M 22 36 Q 32 28 42 36" stroke={C.night} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
    surprised: <ellipse cx={33} cy={32} rx={7} ry={9} fill={C.night} />,
    angry: <path d="M 22 32 L 44 30" stroke={C.night} strokeWidth={4.5} strokeLinecap="round" />,
    smug: <path d="M 20 30 Q 34 34 46 24" stroke={C.night} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
  }[expression];
  const browLift = expression === 'surprised' ? -8 : expression === 'sad' ? -2 : 0;
  const browRot = expression === 'sad' ? -14 : expression === 'angry' ? 14 : expression === 'happy' || expression === 'laugh' ? -6 : 0;
  const T = j.torsoAngle;
  return (
    <g transform={`translate(${x} ${groundY}) scale(${facing} 1)`}>
      <ellipse cx={8} cy={2} rx={78} ry={10} fill="#000" opacity={0.3} />
      {/* back leg + arm */}
      {limb([j.hip.l, j.knee.l, j.foot.l], OUTFIT.bottomShade, 36)}
      {shoe(j.foot.l, j.footLift.l, shade(OUTFIT.shoes, -0.25))}
      {limb([j.shoulder.l, j.elbow.l, j.hand.l], OUTFIT.topShade, 28)}
      <circle cx={j.hand.l[0]} cy={j.hand.l[1]} r={14} fill={C.skinShade} />
      {limb([j.hip.r, j.knee.r, j.foot.r], OUTFIT.bottom, 36)}
      {shoe(j.foot.r, j.footLift.r, OUTFIT.shoes)}
      {/* torso in its own rotated frame */}
      <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${T})`}>
        <rect x={-46} y={-14} width={92} height={30} rx={8} fill={OUTFIT.bottom} />
        <path d="M -50 -138 Q -52 -164 -26 -166 L 26 -166 Q 52 -164 50 -138 L 46 4 Q 0 12 -46 4 Z" fill={OUTFIT.top} />
        <path d="M -50 -138 Q -52 -164 -26 -166 L -6 -166 L -10 8 Q -30 8 -46 4 Z" fill={OUTFIT.topShade} />
        <path d="M -8 -166 L 22 -166 L 10 -96 Z" fill={OUTFIT.shirt} />
        <path d="M 10 -96 L 12 2" stroke={OUTFIT.topShade} strokeWidth={4} />
        {[-70, -40, -12].map((y) => (
          <circle key={y} cx={20} cy={y} r={4} fill={C.amber} />
        ))}
      </g>
      <path d={poly([j.neck, [j.head[0], j.head[1] + 50]])} stroke={C.skinShade} strokeWidth={22} />
      {/* head */}
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        <g transform={`rotate(${j.hairSwing} -56 -44)`}>
          <path d="M -50 -52 Q -104 -40 -100 30 Q -98 78 -78 96 Q -74 50 -60 20 Q -48 -10 -30 -40 Z" fill={C.hair} />
          <path d="M -86 20 Q -84 60 -78 90" stroke={shade(C.hair, 0.25)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
        <circle r={64} fill={C.skin} />
        <path d="M -64 0 A 64 64 0 0 0 -14 62 Q -40 20 -36 -30 Z" fill={C.skinShade} />
        <circle cx={-20} cy={6} r={12} fill={C.skinShade} />
        <path d="M 62 -4 Q 76 8 61 15 Z" fill={C.skin} />
        <circle cx={46} cy={18} r={10} fill={C.coral} opacity={expression === 'happy' || expression === 'laugh' ? 0.5 : 0.25} />
        {[18, 46].map((ex) => (
          <g key={ex} transform={`translate(${ex + j.pupil[0] * 0.6} ${-4 + j.pupil[1] * 0.6}) scale(1 ${expression === 'laugh' ? 0.3 : eye})`}>
            <circle r={6.5} fill={C.night} />
          </g>
        ))}
        {[18, 46].map((ex, i) => (
          <rect key={`b${ex}`} x={ex - 10} y={-26 + browLift} width={20} height={5} rx={2.5} fill={C.hair} transform={`rotate(${i ? -browRot : browRot} ${ex} ${-24 + browLift})`} />
        ))}
        {mouth}
        <path d="M -70 10 Q -78 -74 4 -72 Q 60 -70 68 -22 Q 34 -48 6 -38 Q -26 -22 -36 18 Z" fill={C.hair} />
        <circle cx={-46} cy={-58} r={24} fill={C.hair} />
        <g fill="none" stroke={C.night} strokeWidth={3.5}>
          <circle cx={18} cy={-4} r={15} />
          <circle cx={48} cy={-4} r={15} />
          <path d="M 33 -6 L 33 -6" />
        </g>
      </g>
      {/* front arm on top */}
      {limb([j.shoulder.r, j.elbow.r, j.hand.r], OUTFIT.top, 28)}
      <path d={lp(j.elbow.r, j.elbow.r, j.elbow.r)} />
      <circle cx={j.hand.r[0]} cy={j.hand.r[1]} r={14} fill={C.skin} />
    </g>
  );
};

// ---------------------------------------------------------------- concept
const Orb: Theme['Orb'] = ({x, y, r, glow, pulse, fade, dissolve, squash, carried}) => {
  const core = mix(mix(C.amber, C.cream, pulse * 0.6), '#56607F', fade);
  const a = (1 - dissolve) * (1 - fade * 0.4);
  const rings = carried ? 2 : 3;
  return (
    <g opacity={a} transform={`translate(${x} ${y}) scale(${1 + squash} ${1 - squash})`}>
      {Array.from({length: rings}).map((_, i) => (
        <circle key={i} r={r * (1.5 + i * 0.55) * (1 + pulse * 0.4)} fill="none" stroke={mix(C.amber, '#56607F', fade)} strokeWidth={2} opacity={(0.45 - i * 0.12) * (glow + pulse) * (1 - fade)} />
      ))}
      <circle r={r * 1.25} fill={C.amber} opacity={0.18 * (glow + pulse) * (1 - fade)} />
      <circle r={r} fill={core} />
      <path d={`M ${-r} 0 A ${r} ${r} 0 0 0 ${r} 0 Z`} fill="#000" opacity={0.12} />
      <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#fff" opacity={0.85 * (1 - fade)} />
    </g>
  );
};

const Link: Theme['Link'] = ({a, b, growth, energy, pulse}) => {
  const w = 2.5 + energy * 3;
  const color = mix(C.cream, C.amber, energy);
  const p = pulse ? linkPoint(pulse.from === 'a' ? a : b, pulse.from === 'a' ? b : a, pulse.k) : null;
  return (
    <g>
      <path d={linkPath(a, b, growth)} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" opacity={0.55 + energy * 0.45} strokeDasharray={energy > 0.05 ? undefined : '1 9'} />
      {growth < 1 && <circle cx={linkPoint(a, b, growth)[0]} cy={linkPoint(a, b, growth)[1]} r={6} fill={C.cream} />}
      {p && <circle cx={p[0]} cy={p[1]} r={10} fill={C.cream} />}
    </g>
  );
};

const Particle: Theme['Particle'] = ({x, y, r, a}) => <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={C.amber} opacity={a} transform={`rotate(45 ${x} ${y})`} />;

const Post: Theme['Post'] = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 65%, rgba(8,10,25,0.35) 100%)'}} />;

const Subtitle: Theme['Subtitle'] = ({line, t, inK}) => (
  <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 64px 104px'}}>
    <div style={{opacity: inK, transform: `translateY(${(1 - inK) * 14}px)`, background: C.cream, borderLeft: `10px solid ${C.coral}`, padding: '14px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 42, color: C.night, letterSpacing: -0.5, maxWidth: 1150}}>
      {line.words.map((w, i) => (
        <span key={i} style={{opacity: t >= w.start ? 1 : 0.25}}>
          {w.text}{' '}
        </span>
      ))}
    </div>
  </AbsoluteFill>
);

const Title: Theme['Title'] = ({lines, k}) => (
  <AbsoluteFill style={{padding: '96px 0 0 104px'}}>
    {lines.map((l, i) => (
      <div key={i} style={{overflow: 'hidden', height: 132}}>
        <div style={{transform: `translateY(${(1 - k(i)) * 134}px)`, fontFamily: FONT, fontWeight: 900, fontSize: 120, color: i ? C.amber : C.cream, letterSpacing: -3, lineHeight: 1.1}}>{l}</div>
      </div>
    ))}
    <div style={{width: 280 * k(2), height: 12, background: C.coral, marginTop: 20}} />
  </AbsoluteFill>
);

export const geometricTheme: Theme = {
  id: 'geometric',
  name: 'A · Geometric editorial',
  background: C.night,
  Defs: () => null,
  modules: {backdrop: Backdrop, window: Window, shelf: Shelf, lamp: Lamp, floor: Floor, rug: Rug, table: Table, plant: Plant, ladder: Ladder, column: Column, bookstack: BookStack},
  Character,
  Orb,
  Link,
  Particle,
  layerOverlay: ({depth}) => (depth > 0.3 && depth < 0.7 ? <rect x={-3000} y={-2000} width={8000} height={5000} fill={C.wallFar} opacity={0.0} /> : null),
  Post,
  Subtitle,
  Title,
};

export const _ctxType = (c: Ctx) => c;
