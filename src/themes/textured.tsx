/**
 * THEME B — Modern textured editorial (risograph + ink).
 * Warm afternoon light, hand-inked outlines that "boil" on threes (geometry
 * jitter, no filters), riso fills printed slightly off-register, halftone and
 * hatch shading, baked paper grain, serif typography.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {mix, shade} from '../engine/color';
import {SERIF} from '../engine/fonts';
import {blink} from '../engine/rig';
import {TextureOverlay} from '../engine/Texture';
import {SHELF_FRAME, shelfBooks, shelfSlots} from '../kit/library';
import {linkPoint} from '../kit/network';
import type {Vec} from '../kit/puppet';
import {archPts, circlePts, lerpV, rectPts, wobbly} from './draw';
import type {CharacterView, Ctx, Theme} from './types';

const P = {
  paper: '#F3EAD7', paperDark: '#E6D8BC', ink: '#2B2330', red: '#E2553F', teal: '#2D7F86', mustard: '#E8B23A', pink: '#F08A9B',
  blue: '#3E6FB0', olive: '#8A9A4B', wall: '#EBD9B4', wallStripe: '#E2C99B', wood: '#C47A4A', woodDark: '#8E5134', slot: '#6E4232',
  sky: '#BFDCE6', skin: '#F1BE9A', hair: '#B5482E',
};
const BOOKS = [P.red, P.teal, P.mustard, P.pink, P.blue, P.olive];
const GROUND = 900;
/** Lines are redrawn every 3 frames, like hand-drawn animation "on threes". */
const boil = (ctx: Ctx) => Math.floor(ctx.frame / 3) % 4;
/** Riso misregistration offset for fills. */
const MIS: Vec = [3, 2];

/** Fill printed off-register + wobbly ink outline on top. */
const Inked: React.FC<{pts: Vec[]; fill?: string; seed: string; ctx: Ctx; amp?: number; width?: number; closed?: boolean; shadeFill?: string}> = ({pts, fill, seed, ctx, amp = 1.6, width = 3, closed = true, shadeFill}) => {
  const b = boil(ctx);
  return (
    <g>
      {fill && <path d={wobbly(pts, amp * 0.6, `${seed}f`, 0, closed)} fill={fill} transform={`translate(${MIS[0]} ${MIS[1]})`} />}
      {shadeFill && <path d={wobbly(pts, amp * 0.6, `${seed}f`, 0, closed)} fill={shadeFill} transform={`translate(${MIS[0]} ${MIS[1]})`} />}
      <path d={wobbly(pts, amp, seed, b, closed)} fill="none" stroke={P.ink} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

const Defs: Theme['Defs'] = () => (
  <>
    <pattern id="b-dots" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx={4.5} cy={4.5} r={2.1} fill={P.ink} />
    </pattern>
    <pattern id="b-dots-fine" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx={3} cy={3} r={1.1} fill={P.ink} />
    </pattern>
    <pattern id="b-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
      <line x1={0} y1={0} x2={0} y2={8} stroke={P.ink} strokeWidth={1.8} />
    </pattern>
    <pattern id="b-paperdots" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx={7} cy={7} r={2.6} fill={P.pink} />
    </pattern>
    <radialGradient id="b-sunpool" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFF4D0" stopOpacity={0.9} />
      <stop offset="1" stopColor="#FFF4D0" stopOpacity={0} />
    </radialGradient>
  </>
);

const Backdrop: Theme['modules']['backdrop'] = () => (
  <g>
    <rect x={-2000} y={-1500} width={6000} height={4000} fill={P.wall} />
    {Array.from({length: 70}).map((_, i) => (
      <rect key={i} x={-1600 + i * 80} y={-1500} width={26} height={2600} fill={P.wallStripe} />
    ))}
    <rect x={-2000} y={-1500} width={6000} height={4000} fill="url(#b-paperdots)" opacity={0.18} />
  </g>
);

const Window: Theme['modules']['window'] = ({m, ctx}) => {
  const {x, y, w, h} = m;
  const pts = archPts(x, y, w, h);
  return (
    <g>
      <Inked pts={archPts(x - 24, y - 24, w + 48, h + 48)} fill={P.paper} seed={`wf${x}`} ctx={ctx} />
      <Inked pts={pts} fill={P.sky} seed={`w${x}`} ctx={ctx} />
      {[[0.3, 0.25, 1], [0.65, 0.45, 0.7]].map(([cx, cy, s], i) => (
        <Inked key={i} pts={circlePts(x + w * cx, y + h * cy, 30 * s, 10).map(([px, py], k) => [px + (k % 2) * 10, py] as Vec)} fill="#FFFFFF" seed={`cl${x}${i}`} ctx={ctx} amp={2.5} width={2} />
      ))}
      <Inked pts={[[x + w / 2, y + 4], [x + w / 2, y + h]]} seed={`mv${x}`} ctx={ctx} closed={false} width={7} />
      {[0.42, 0.7].map((k) => (
        <Inked key={k} pts={[[x, y + h * k], [x + w, y + h * k]]} seed={`mh${x}${k}`} ctx={ctx} closed={false} width={7} />
      ))}
      <Inked pts={rectPts(x - 40, y + h + 16, w + 80, 22)} fill={P.paper} seed={`sill${x}`} ctx={ctx} />
      {/* sunbeam: hatched light falling into the room */}
      <path d={`M ${x} ${y + w / 2} L ${x + w} ${y + w / 2} L ${x + w + 560} ${GROUND + 80} L ${x + 260} ${GROUND + 80} Z`} fill="#FFF4D0" opacity={0.35} />
      <path d={`M ${x} ${y + w / 2} L ${x + w} ${y + w / 2} L ${x + w + 560} ${GROUND + 80} L ${x + 260} ${GROUND + 80} Z`} fill="url(#b-dots-fine)" opacity={0.08} />
    </g>
  );
};

const Shelf: Theme['modules']['shelf'] = ({m, ctx}) => {
  const s = m.spec;
  const far = m.depth < 1;
  const k = far ? 0.35 : 0;
  const tone = (c: string) => mix(c, P.wall, k);
  return (
    <g>
      <Inked pts={rectPts(s.x, s.y, s.w, s.h + (far ? 300 : 0))} fill={tone(P.wood)} seed={`sh${s.seed}`} ctx={ctx} width={far ? 2.5 : 3.5} />
      {shelfSlots(s).map((sl, i) => (
        <g key={i}>
          <rect x={sl.x + MIS[0]} y={sl.y + MIS[1]} width={sl.w} height={sl.h} fill={tone(P.slot)} />
          <rect x={sl.x} y={sl.y} width={sl.w} height={sl.h} fill="url(#b-hatch)" opacity={far ? 0.12 : 0.22} />
        </g>
      ))}
      {shelfBooks(s).map((b, i) => {
        const col = tone(BOOKS[b.color]);
        const pts = rectPts(b.x, b.y - b.h, b.w, b.h);
        const body = (
          <g>
            <Inked pts={pts} fill={col} seed={`bk${s.seed}${i}`} ctx={ctx} amp={far ? 0.8 : 1.1} width={far ? 1.6 : 2.2} />
            {!b.flat && b.band > 0 && <rect x={b.x + 2} y={b.y - b.h * 0.8} width={b.w - 2} height={b.band * 4} fill={P.ink} opacity={0.7} />}
            {!b.flat && <rect x={b.x + b.w * 0.6} y={b.y - b.h} width={b.w * 0.4} height={b.h} fill="url(#b-dots-fine)" opacity={0.35} />}
          </g>
        );
        return b.tilt ? <g key={i} transform={`rotate(${b.tilt} ${b.x + b.w} ${b.y})`}>{body}</g> : <g key={i}>{body}</g>;
      })}
      <Inked pts={rectPts(s.x - 12, s.y - 16, s.w + 24, SHELF_FRAME + 6)} fill={tone(shade(P.wood, 0.1))} seed={`top${s.seed}`} ctx={ctx} />
    </g>
  );
};

const Lamp: Theme['modules']['lamp'] = ({m, ctx}) => {
  const sway = Math.sin(ctx.t * 0.9 + m.x) * 1.2;
  return (
    <g transform={`rotate(${sway} ${m.x} ${m.y - m.cord})`}>
      <Inked pts={[[m.x, m.y - m.cord], [m.x, m.y - 40]]} seed={`cord${m.x}`} ctx={ctx} closed={false} width={2.5} />
      <Inked pts={[[m.x - 20, m.y - 44], [m.x + 20, m.y - 44], [m.x + 72, m.y + 28], [m.x - 72, m.y + 28]]} fill={P.mustard} seed={`lamp${m.x}`} ctx={ctx} />
      <path d={`M ${m.x} ${m.y - 44} L ${m.x + 20} ${m.y - 44} L ${m.x + 72} ${m.y + 28} L ${m.x} ${m.y + 28} Z`} fill="url(#b-dots)" opacity={0.3} />
    </g>
  );
};

const Floor: Theme['modules']['floor'] = ({ctx}) => (
  <g>
    <rect x={-2000} y={GROUND - 20} width={6000} height={1400} fill={P.woodDark} />
    {Array.from({length: 24}).map((_, i) => (
      <Inked key={i} pts={[[-1600 + i * 220, GROUND - 20], [-1600 + i * 220 - 160, GROUND + 400]]} seed={`fl${i}`} ctx={ctx} closed={false} width={2} />
    ))}
    <rect x={-2000} y={GROUND - 20} width={6000} height={1400} fill="url(#b-hatch)" opacity={0.15} />
    <Inked pts={[[-2000, GROUND - 20], [4000, GROUND - 20]]} seed="floorline" ctx={ctx} closed={false} width={3.5} />
  </g>
);

const Rug: Theme['modules']['rug'] = ({m, ctx}) => (
  <g>
    <Inked pts={[[m.x + 40, GROUND - 4], [m.x + m.w - 40, GROUND - 4], [m.x + m.w, GROUND + 74], [m.x, GROUND + 74]]} fill={P.teal} seed="rug" ctx={ctx} />
    {Array.from({length: 7}).map((_, i) => (
      <Inked key={i} pts={circlePts(m.x + 130 + i * ((m.w - 260) / 6), GROUND + 34, 14, 8)} fill={P.mustard} seed={`rg${i}`} ctx={ctx} width={2} />
    ))}
  </g>
);

const Table: Theme['modules']['table'] = ({m, ctx}) => (
  <g>
    <Inked pts={rectPts(m.x + 28, GROUND - 190, 16, 180)} fill={P.woodDark} seed="tl1" ctx={ctx} />
    <Inked pts={rectPts(m.x + m.w - 44, GROUND - 190, 16, 180)} fill={P.woodDark} seed="tl2" ctx={ctx} />
    <Inked pts={rectPts(m.x, GROUND - 210, m.w, 22)} fill={P.wood} seed="tt" ctx={ctx} />
    {[0, 1, 2].map((k) => (
      <Inked key={k} pts={rectPts(m.x + 26 + k * 8, GROUND - 238 - k * 26, 120 - k * 14, 24)} fill={BOOKS[(k * 2 + 1) % 6]} seed={`ts${k}`} ctx={ctx} width={2} />
    ))}
    <Inked pts={[[m.x + 168, GROUND - 210], [m.x + 212, GROUND - 210], [m.x + 206, GROUND - 260], [m.x + 174, GROUND - 260]]} fill={P.red} seed="pot" ctx={ctx} />
    {[-30, 0, 30].map((a, i) => (
      <g key={a} transform={`rotate(${a} ${m.x + 190} ${GROUND - 260})`}>
        <Inked pts={circlePts(m.x + 190, GROUND - 300, 12, 8).map(([px, py]) => [px, (py - (GROUND - 300)) * 2.6 + GROUND - 300] as Vec)} fill={P.olive} seed={`tp${i}`} ctx={ctx} width={2} />
      </g>
    ))}
  </g>
);

const Plant: Theme['modules']['plant'] = ({m, ctx}) => (
  <g transform={`translate(${m.x} ${GROUND}) scale(${m.scale})`}>
    {[-55, -30, -8, 14, 36, 60].map((a, i) => (
      <g key={i} transform={`rotate(${a + Math.sin(ctx.t * 0.8 + i) * 2} 0 -120)`}>
        <Inked pts={circlePts(0, -250, 34, 12).map(([px, py]) => [px, (py + 250) * 3.1 - 250] as Vec)} fill={i % 2 ? P.olive : P.teal} seed={`pl${i}`} ctx={ctx} width={2.5} />
        <Inked pts={[[0, -150], [0, -340]]} seed={`pv${i}`} ctx={ctx} closed={false} width={2} />
      </g>
    ))}
    <Inked pts={[[-70, -130], [70, -130], [54, 0], [-54, 0]]} fill={P.pink} seed="pp" ctx={ctx} />
    <path d="M 0 -130 L 70 -130 L 54 0 L 0 0 Z" fill="url(#b-dots)" opacity={0.3} />
  </g>
);

const Ladder: Theme['modules']['ladder'] = ({m, ctx}) => {
  const dx = Math.tan((m.lean * Math.PI) / 180) * (GROUND - m.topY);
  return (
    <g>
      {[0, 70].map((o) => (
        <Inked key={o} pts={[[m.x + o, m.topY], [m.x + o + dx, GROUND]]} seed={`lr${o}`} ctx={ctx} closed={false} width={9} />
      ))}
      {Array.from({length: 8}).map((_, i) => {
        const k = (i + 0.6) / 8.5;
        const y = m.topY + (GROUND - m.topY) * k;
        return <Inked key={i} pts={[[m.x + dx * k, y], [m.x + 70 + dx * k, y]]} seed={`lu${i}`} ctx={ctx} closed={false} width={6} />;
      })}
    </g>
  );
};

const Column: Theme['modules']['column'] = ({m, ctx}) => (
  <g>
    <Inked pts={rectPts(m.x, -800, m.w, 2400)} fill={P.woodDark} seed="col" ctx={ctx} width={5} />
    <rect x={m.x} y={-800} width={m.w} height={2400} fill="url(#b-hatch)" opacity={0.45} />
  </g>
);

const BookStack: Theme['modules']['bookstack'] = ({m, ctx}) => (
  <g>
    {Array.from({length: m.count}).map((_, i) => {
      const w = 260 - i * 14 + random(`${m.seed}${i}`) * 30;
      const x = m.x + (random(`${m.seed}x${i}`) - 0.5) * 30;
      return (
        <g key={i}>
          <Inked pts={rectPts(x, m.y - (i + 1) * 34, w, 32)} fill={BOOKS[i % 6]} seed={`fs${i}`} ctx={ctx} width={4} />
          <rect x={x} y={m.y - (i + 1) * 34} width={w} height={32} fill="url(#b-dots)" opacity={0.25} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- character
const OUT = {top: P.red, shirt: P.paper, bottom: P.blue, shoes: P.ink, scarf: P.mustard};

const Character: React.FC<CharacterView> = ({joints: j, x, groundY, facing, expression, ctx}) => {
  const b = boil(ctx);
  const eye = blink(ctx.t, 3);
  const limb = (pts: Vec[], color: string, w: number, seed: string) => (
    <g>
      <path d={wobbly(pts, 1.2, seed, b, false, 30)} stroke={P.ink} strokeWidth={w + 6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wobbly(pts, 0.5, `${seed}f`, 0, false, 30)} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(${MIS[0] * 0.5} ${MIS[1] * 0.5})`} />
    </g>
  );
  const shoe = (f: Vec, lift: number, seed: string) => (
    <g transform={`translate(${f[0]} ${f[1]}) rotate(${-lift * 18})`}>
      <Inked pts={[[-16, 6], [-16, -10], [8, -12], [36, -4], [38, 6]]} fill={OUT.shoes} seed={seed} ctx={ctx} />
    </g>
  );
  const mouthPts: Record<string, Vec[]> = {
    neutral: [[22, 30], [32, 34], [42, 30]],
    happy: [[18, 26], [32, 40], [46, 25]],
    sad: [[22, 36], [32, 29], [42, 36]],
    smug: [[20, 30], [34, 33], [46, 24]],
    angry: [[22, 32], [44, 30]],
  };
  const T = j.torsoAngle;
  const hand = (p: Vec, s: string) => <Inked pts={circlePts(p[0], p[1], 14, 9)} fill={P.skin} seed={s} ctx={ctx} width={2.5} />;
  return (
    <g transform={`translate(${x} ${groundY}) scale(${facing} 1)`}>
      <ellipse cx={8} cy={2} rx={82} ry={11} fill="url(#b-dots)" opacity={0.55} />
      {limb([j.hip.l, j.knee.l, j.foot.l], shade(OUT.bottom, -0.15), 32, 'll')}
      {shoe(j.foot.l, j.footLift.l, 'sl')}
      {limb([j.shoulder.l, j.elbow.l, j.hand.l], shade(OUT.top, -0.15), 26, 'al')}
      {hand(j.hand.l, 'hl')}
      {limb([j.hip.r, j.knee.r, j.foot.r], OUT.bottom, 32, 'lr')}
      {shoe(j.foot.r, j.footLift.r, 'sr')}
      <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${T})`}>
        <Inked pts={rectPts(-46, -14, 92, 30)} fill={OUT.bottom} seed="belt" ctx={ctx} />
        <Inked pts={[[-50, -136], [-40, -164], [40, -164], [50, -136], [46, 4], [-46, 4]]} fill={OUT.top} seed="torso" ctx={ctx} />
        <path d="M -50 -136 L -40 -164 L -8 -164 L -12 6 L -46 4 Z" fill="url(#b-dots)" opacity={0.35} />
        <Inked pts={[[-14, -164], [22, -164], [6, -110]]} fill={OUT.shirt} seed="shirt" ctx={ctx} width={2.5} />
        {/* scarf: secondary motion follows hair swing */}
        <Inked pts={[[-34, -172], [34, -172], [36, -152], [-36, -152]]} fill={OUT.scarf} seed="scarfwrap" ctx={ctx} />
        <g transform={`rotate(${j.hairSwing * 0.8} -18 -156)`}>
          <Inked pts={[[-28, -156], [-8, -156], [-10, -90], [-14, -84], [-20, -90], [-30, -88]]} fill={OUT.scarf} seed="scarftail" ctx={ctx} />
          {[-108, -100].map((y) => <line key={y} x1={-28} y1={y} x2={-12} y2={y} stroke={P.ink} strokeWidth={2} />)}
        </g>
      </g>
      <path d={`M ${j.neck[0]} ${j.neck[1]} L ${j.head[0]} ${j.head[1] + 50}`} stroke={P.ink} strokeWidth={24} />
      <path d={`M ${j.neck[0]} ${j.neck[1]} L ${j.head[0]} ${j.head[1] + 50}`} stroke={P.skin} strokeWidth={18} />
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        {/* curly bob, hatched, swings */}
        <g transform={`rotate(${j.hairSwing * 0.4} -20 -40)`}>
          <Inked pts={[[-80, 30], [-92, -20], [-74, -70], [-20, -92], [40, -86], [74, -52], [70, -20], [-40, 50]]} fill={P.hair} seed="hairB" ctx={ctx} amp={2.5} />
        </g>
        <Inked pts={circlePts(0, 0, 64, 20)} fill={P.skin} seed="head" ctx={ctx} />
        <path d="M -64 0 A 64 64 0 0 0 -10 63 Q -40 20 -34 -30 Z" fill="url(#b-dots)" opacity={0.3} />
        <Inked pts={[[62, -4], [76, 8], [61, 15]]} fill={P.skin} seed="nose" ctx={ctx} closed={false} width={2.5} />
        {[[40, 16], [50, 22], [44, 26], [56, 16]].map(([fx, fy], i) => (
          <circle key={i} cx={fx} cy={fy} r={2} fill={P.hair} opacity={0.8} />
        ))}
        {[18, 46].map((ex) => (
          <g key={ex} transform={`translate(${ex + j.pupil[0] * 0.6} ${-4 + j.pupil[1] * 0.6}) scale(1 ${expression === 'laugh' ? 0.3 : eye})`}>
            <ellipse rx={5.5} ry={7.5} fill={P.ink} />
          </g>
        ))}
        {[18, 46].map((ex, i) => {
          const lift = expression === 'surprised' ? -9 : 0;
          const r = expression === 'sad' ? (i ? -12 : 12) : expression === 'happy' || expression === 'laugh' ? (i ? -5 : 5) : 0;
          return <Inked key={ex} pts={[[ex - 10, -24 + lift + r * 0.3], [ex + 10, -24 + lift - r * 0.3]]} seed={`br${i}`} ctx={ctx} closed={false} width={4} />;
        })}
        {expression === 'laugh' || expression === 'surprised' ? (
          <Inked pts={expression === 'laugh' ? [[16, 24], [33, 48], [50, 23]] : circlePts(33, 32, 8, 8)} fill={P.ink} seed="mo" ctx={ctx} />
        ) : (
          <Inked pts={mouthPts[expression] ?? mouthPts.neutral} seed="mouth" ctx={ctx} closed={false} width={3.5} />
        )}
        <Inked pts={[[-70, 14], [-76, -50], [-30, -84], [30, -82], [68, -40], [60, -24], [30, -48], [-10, -46], [-36, -20], [-40, 20]]} fill={P.hair} seed="hairF" ctx={ctx} amp={2.2} />
        <path d="M -60 -40 Q -20 -70 30 -64" stroke={P.ink} strokeWidth={2} fill="none" opacity={0.6} />
        <path d="M -54 -10 Q -40 -50 0 -56" stroke={P.ink} strokeWidth={2} fill="none" opacity={0.6} />
      </g>
      {limb([j.shoulder.r, j.elbow.r, j.hand.r], OUT.top, 26, 'ar')}
      {hand(j.hand.r, 'hr')}
    </g>
  );
};

// ---------------------------------------------------------------- concept
const Orb: Theme['Orb'] = ({x, y, r, glow, pulse, fade, dissolve, squash, carried, ctx}) => {
  const a = (1 - dissolve) * (1 - fade * 0.3);
  const col = mix(mix(P.mustard, '#FFF1B8', pulse * 0.6), '#B7A99A', fade);
  const rays = 10;
  const len = (16 + pulse * 26) * (glow + pulse * 0.6) * (1 - fade);
  return (
    <g opacity={a} transform={`translate(${x} ${y}) scale(${1 + squash} ${1 - squash})`}>
      <circle r={r * 2.4} fill="url(#b-dots-fine)" opacity={0.18 * (glow + pulse) * (1 - fade)} />
      {!carried &&
        Array.from({length: rays}).map((_, i) => {
          const ang = (i / rays) * Math.PI * 2 + ctx.t * 0.3;
          const p0: Vec = [Math.cos(ang) * (r + 8), Math.sin(ang) * (r + 8)];
          const p1: Vec = [Math.cos(ang) * (r + 8 + len), Math.sin(ang) * (r + 8 + len)];
          return <Inked key={i} pts={[p0, p1]} seed={`ray${x}${i}`} ctx={ctx} closed={false} width={2.5} />;
        })}
      <Inked pts={circlePts(0, 0, r, 14)} fill={col} seed={`orb${x}${y}`} ctx={ctx} />
      <path d={`M ${-r} 2 A ${r} ${r} 0 0 0 ${r} 2 Z`} fill="url(#b-dots)" opacity={0.35} />
      <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.2} fill="#fff" />
    </g>
  );
};

const Link: Theme['Link'] = ({a, b, growth, energy, pulse, ctx}) => {
  const n = 14;
  const pts: Vec[] = Array.from({length: n + 1}, (_, i) => linkPoint(a, b, (i / n) * growth) as Vec);
  const p = pulse ? linkPoint(pulse.from === 'a' ? a : b, pulse.from === 'a' ? b : a, pulse.k) : null;
  return (
    <g>
      {energy > 0.05 && <path d={wobbly(pts, 0.8, `le${a.id}${b.id}`, 0, false, 40)} stroke={P.red} strokeWidth={8 * energy} fill="none" strokeLinecap="round" transform={`translate(${MIS[0]} ${MIS[1]})`} />}
      <path d={wobbly(pts, 1.4, `l${a.id}${b.id}`, boil(ctx), false, 40)} stroke={P.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={energy > 0.05 ? undefined : '10 8'} />
      {p && <Inked pts={circlePts(p[0], p[1], 9, 8)} fill={P.mustard} seed="pulse" ctx={ctx} />}
      {growth < 1 && <Inked pts={circlePts(lerpV(pts[n], pts[n], 0)[0], pts[n][1], 5, 6)} fill={P.ink} seed="tip" ctx={ctx} />}
    </g>
  );
};

const Particle: Theme['Particle'] = ({x, y, r, a, ctx}) => (
  <g opacity={a}>
    <Inked pts={circlePts(x, y, r + 1, 6)} fill={P.mustard} seed={`p${Math.round(x)}`} ctx={ctx} width={1.5} />
  </g>
);

const Post: Theme['Post'] = ({ctx}) => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(120deg, rgba(255,236,190,0.25) 0%, transparent 45%)', mixBlendMode: 'soft-light'}} />
    <TextureOverlay src="textures/fibre.png" opacity={0.55} />
    <TextureOverlay src={`textures/grain-${Math.floor(ctx.frame / 2) % 4}.png`} opacity={0.5} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 58%, rgba(90,55,30,0.3) 100%)'}} />
  </>
);

const Subtitle: Theme['Subtitle'] = ({line, t, inK}) => (
  <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64}}>
    <div style={{opacity: inK, fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 52, color: P.ink, background: 'rgba(243,234,215,0.92)', padding: '6px 28px', transform: 'rotate(-0.6deg)', boxShadow: `4px 4px 0 ${P.ink}`}}>
      {line.words.map((w, i) => {
        const on = t >= w.start && t <= w.end + 0.08;
        return (
          <span key={i} style={{opacity: t >= w.start ? 1 : 0.35, background: on ? 'rgba(232,178,58,0.55)' : 'transparent'}}>
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  </AbsoluteFill>
);

const Title: Theme['Title'] = ({lines, k}) => (
  <AbsoluteFill style={{alignItems: 'center', paddingTop: 90}}>
    <div style={{background: 'rgba(243,234,215,0.94)', padding: '18px 64px 26px', transform: `rotate(-1.5deg) scale(${0.9 + 0.1 * k(0)})`, opacity: k(0), boxShadow: `8px 8px 0 ${P.ink}`, textAlign: 'center'}}>
      {lines.map((l, i) => (
        <div key={i} style={{opacity: k(i), fontFamily: SERIF, fontWeight: 700, fontStyle: i ? 'italic' : 'normal', fontSize: 118, lineHeight: 1.05, color: i ? P.red : P.ink}}>
          {l}
        </div>
      ))}
      <svg width={460} height={30}>
        <path d="M 10 18 Q 120 4 230 16 T 450 12" stroke={P.mustard} strokeWidth={12} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k(2)} />
      </svg>
    </div>
  </AbsoluteFill>
);

export const texturedTheme: Theme = {
  id: 'textured',
  name: 'B · Textured editorial (riso + ink)',
  background: P.wall,
  Defs,
  modules: {backdrop: Backdrop, window: Window, shelf: Shelf, lamp: Lamp, floor: Floor, rug: Rug, table: Table, plant: Plant, ladder: Ladder, column: Column, bookstack: BookStack},
  Character,
  Orb,
  Link,
  Particle,
  Post,
  Subtitle,
  Title,
};
