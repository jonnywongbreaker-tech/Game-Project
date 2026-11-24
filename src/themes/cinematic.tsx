/**
 * THEME C — Cinematic 2.5D.
 * Physically-motivated light: warm lamps, cool volumetric moonlight, every
 * memory orb is a light source that illuminates its surroundings. Gradient
 * shading, rim light, ambient occlusion, cast shadows, depth of field,
 * atmospheric haze, bloom and colour grading.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {mix, shade} from '../engine/color';
import {FONT} from '../engine/fonts';
import {blink} from '../engine/rig';
import {TextureOverlay} from '../engine/Texture';
import {SHELF_FRAME, shelfBooks, shelfSlots} from '../kit/library';
import {linkPath, linkPoint} from '../kit/network';
import type {Vec} from '../kit/puppet';
import {archPath, poly} from './draw';
import type {CharacterView, Theme} from './types';

const K = {
  wallTop: '#1A1420', wallBottom: '#3A2A2A', woodLight: '#7A4B2E', wood: '#5A3420', woodDark: '#2E1A12', slot: '#140C0A',
  floor: '#2A1C16', moon: '#A9C4FF', warm: '#FFB866', amber: '#FFC46B', orbCore: '#FFF4D6',
  skin: '#E7AE8C', skinShadow: '#9C5E4A', hair: '#3A1F1A', coat: '#7A2E3B', shirt: '#E9DCC6', trousers: '#2A2D36', boots: '#4A2F22',
};
const BOOKS = ['#7A2E2E', '#2E4A5A', '#6B5A2A', '#3D5A3A', '#5A3A5E', '#8A6A3A'];
const GROUND = 900;

const Defs: Theme['Defs'] = () => (
  <>
    <linearGradient id="c-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={K.wallTop} />
      <stop offset="1" stopColor={K.wallBottom} />
    </linearGradient>
    <linearGradient id="c-wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={K.woodDark} />
      <stop offset="0.5" stopColor={K.wood} />
      <stop offset="1" stopColor={K.woodLight} />
    </linearGradient>
    <linearGradient id="c-slot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" />
      <stop offset="0.35" stopColor={K.slot} />
      <stop offset="1" stopColor="#24140F" />
    </linearGradient>
    <linearGradient id="c-book" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
      <stop offset="0.35" stopColor="#fff" stopOpacity={0.05} />
      <stop offset="1" stopColor="#000" stopOpacity={0.45} />
    </linearGradient>
    <linearGradient id="c-beam" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor={K.moon} stopOpacity={0.5} />
      <stop offset="1" stopColor={K.moon} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0B1430" />
      <stop offset="1" stopColor="#2A3E6E" />
    </linearGradient>
    <radialGradient id="c-glow">
      <stop offset="0" stopColor={K.amber} stopOpacity={0.9} />
      <stop offset="0.25" stopColor={K.amber} stopOpacity={0.35} />
      <stop offset="1" stopColor={K.amber} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="c-lampglow">
      <stop offset="0" stopColor={K.warm} stopOpacity={0.55} />
      <stop offset="1" stopColor={K.warm} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="c-orb" cx="0.36" cy="0.32" r="0.75">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.3" stopColor={K.orbCore} />
      <stop offset="0.7" stopColor={K.amber} />
      <stop offset="1" stopColor="#C2621E" />
    </radialGradient>
    <radialGradient id="c-orbdead" cx="0.36" cy="0.32" r="0.75">
      <stop offset="0" stopColor="#C9CED8" />
      <stop offset="1" stopColor="#3C4250" />
    </radialGradient>
    <radialGradient id="c-skin" cx="0.7" cy="0.3" r="0.9">
      <stop offset="0" stopColor={shade(K.skin, 0.15)} />
      <stop offset="0.55" stopColor={K.skin} />
      <stop offset="1" stopColor={K.skinShadow} />
    </radialGradient>
    <linearGradient id="c-coat" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stopColor={shade(K.coat, 0.25)} />
      <stop offset="0.5" stopColor={K.coat} />
      <stop offset="1" stopColor={shade(K.coat, -0.45)} />
    </linearGradient>
    <linearGradient id="c-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3A271D" />
      <stop offset="1" stopColor="#120B08" />
    </linearGradient>
    <filter id="c-blur-fg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9} /></filter>
    <filter id="c-blur-far" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={1.8} /></filter>
    <filter id="c-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10} /></filter>
    <filter id="c-bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
  </>
);

const Backdrop: Theme['modules']['backdrop'] = () => (
  <g>
    <rect x={-2000} y={-1500} width={6000} height={4000} fill="url(#c-wall)" />
    {Array.from({length: 24}).map((_, i) => (
      <rect key={i} x={-1700 + i * 260} y={-1500} width={40} height={2600} fill="#000" opacity={0.12} />
    ))}
  </g>
);

const Window: Theme['modules']['window'] = ({m, ctx}) => {
  const {x, y, w, h} = m;
  return (
    <g>
      <path d={archPath(x - 26, y - 26, w + 52, h + 52)} fill={K.woodDark} />
      <path d={archPath(x, y, w, h)} fill="url(#c-sky)" />
      {x === 860 && (
        <g>
          <circle cx={x + w * 0.6} cy={y + 160} r={90} fill={K.moon} opacity={0.18} filter="url(#c-soft)" />
          <circle cx={x + w * 0.6} cy={y + 160} r={40} fill="#EAF0FF" />
        </g>
      )}
      {Array.from({length: 10}).map((_, i) => (
        <circle key={i} cx={x + 14 + random(`cs${x}${i}`) * (w - 28)} cy={y + 50 + random(`cy${x}${i}`) * h * 0.55} r={1.4} fill="#fff" opacity={0.4 + 0.5 * Math.sin(ctx.t * 1.7 + i)} />
      ))}
      <rect x={x + w / 2 - 6} y={y} width={12} height={h} fill={K.woodDark} />
      {[0.42, 0.7].map((k) => (
        <rect key={k} x={x} y={y + h * k} width={w} height={12} fill={K.woodDark} />
      ))}
      <rect x={x - 40} y={y + h + 20} width={w + 80} height={24} fill={K.wood} />
      {/* volumetric moonbeam */}
      <path
        d={`M ${x} ${y + w / 2} L ${x + w} ${y + w / 2} L ${x + w + 640} ${GROUND + 120} L ${x + 300} ${GROUND + 120} Z`}
        fill="url(#c-beam)"
        opacity={0.85 + 0.15 * Math.sin(ctx.t * 0.7 + x)}
        style={{mixBlendMode: 'screen'}}
        filter="url(#c-soft)"
      />
    </g>
  );
};

const Shelf: Theme['modules']['shelf'] = ({m}) => {
  const s = m.spec;
  const far = m.depth < 1;
  return (
    <g>
      <rect x={s.x - 8} y={s.y - 6} width={s.w + 16} height={s.h + (far ? 400 : 12)} fill="url(#c-wood)" />
      {shelfSlots(s).map((sl, i) => (
        <rect key={i} x={sl.x} y={sl.y} width={sl.w} height={sl.h} fill="url(#c-slot)" />
      ))}
      {shelfBooks(s).map((b, i) => {
        const col = BOOKS[b.color];
        const body = (
          <g>
            <rect x={b.x} y={b.y - b.h} width={b.w} height={b.h} rx={2} fill={col} />
            <rect x={b.x} y={b.y - b.h} width={b.w} height={b.h} rx={2} fill="url(#c-book)" />
            {!b.flat && b.band > 0 && (
              <>
                <rect x={b.x} y={b.y - b.h * 0.82} width={b.w} height={3} fill="#D9B56A" opacity={0.8} />
                <rect x={b.x} y={b.y - b.h * 0.2} width={b.w} height={3} fill="#D9B56A" opacity={0.6} />
              </>
            )}
            <rect x={b.x} y={b.y - b.h * 0.55} width={b.w} height={b.h * 0.55} fill="#000" opacity={0.18} />
          </g>
        );
        return b.tilt ? <g key={i} transform={`rotate(${b.tilt} ${b.x + b.w} ${b.y})`}>{body}</g> : <g key={i}>{body}</g>;
      })}
      {/* shelf lips catch the light */}
      {Array.from({length: s.rows + 1}).map((_, r) => (
        <rect key={r} x={s.x + 4} y={s.y + SHELF_FRAME + r * ((s.h - SHELF_FRAME * 2) / s.rows) - 12} width={s.w - 8} height={6} fill={K.woodLight} opacity={0.55} />
      ))}
      <rect x={s.x - 14} y={s.y - 20} width={s.w + 28} height={24} fill={K.woodLight} />
      <rect x={s.x - 14} y={s.y + 2} width={s.w + 28} height={14} fill="#000" opacity={0.35} />
      {!far && <ellipse cx={s.x + s.w / 2} cy={GROUND + 4} rx={s.w * 0.62} ry={18} fill="#000" opacity={0.55} filter="url(#c-soft)" />}
    </g>
  );
};

const Lamp: Theme['modules']['lamp'] = ({m, ctx}) => {
  const sway = Math.sin(ctx.t * 0.9 + m.x) * 1.2;
  const flicker = 0.92 + 0.08 * Math.sin(ctx.t * 13 + m.x) * Math.sin(ctx.t * 7.3);
  return (
    <g transform={`rotate(${sway} ${m.x} ${m.y - m.cord})`}>
      <circle cx={m.x} cy={m.y + 40} r={420} fill="url(#c-lampglow)" opacity={flicker} style={{mixBlendMode: 'screen'}} />
      <line x1={m.x} y1={m.y - m.cord} x2={m.x} y2={m.y - 40} stroke="#0A0605" strokeWidth={4} />
      <path d={`M ${m.x - 22} ${m.y - 44} L ${m.x + 22} ${m.y - 44} L ${m.x + 76} ${m.y + 30} L ${m.x - 76} ${m.y + 30} Z`} fill="#2B3A33" />
      <path d={`M ${m.x - 22} ${m.y - 44} L ${m.x - 4} ${m.y - 44} L ${m.x - 30} ${m.y + 30} L ${m.x - 76} ${m.y + 30} Z`} fill="#000" opacity={0.35} />
      <ellipse cx={m.x} cy={m.y + 30} rx={76} ry={12} fill={K.warm} />
      <circle cx={m.x} cy={m.y + 32} r={22} fill="#FFF3DA" filter="url(#c-bloom)" />
      <circle cx={m.x} cy={m.y + 32} r={11} fill="#fff" />
    </g>
  );
};

const Floor: Theme['modules']['floor'] = () => (
  <g>
    <rect x={-2000} y={GROUND - 20} width={6000} height={1400} fill="url(#c-floor)" />
    {Array.from({length: 40}).map((_, i) => (
      <rect key={i} x={-1600 + i * 130} y={GROUND - 20} width={2} height={500} fill="#000" opacity={0.25} transform={`skewX(${(-1600 + i * 130 - 960) * -0.02})`} />
    ))}
    {/* warm reflections of the lamps on the polished floor */}
    {[560, 1560].map((x) => (
      <ellipse key={x} cx={x} cy={GROUND + 60} rx={260} ry={40} fill={K.warm} opacity={0.14} filter="url(#c-soft)" />
    ))}
    <rect x={-2000} y={GROUND - 22} width={6000} height={4} fill={K.woodLight} opacity={0.4} />
  </g>
);

const Rug: Theme['modules']['rug'] = ({m}) => (
  <g>
    <path d={poly([[m.x + 40, GROUND - 4], [m.x + m.w - 40, GROUND - 4], [m.x + m.w, GROUND + 76], [m.x, GROUND + 76]])} fill="#5A1E24" />
    <path d={poly([[m.x + 70, GROUND + 6], [m.x + m.w - 70, GROUND + 6], [m.x + m.w - 42, GROUND + 64], [m.x + 42, GROUND + 64]])} fill="none" stroke="#B88A4A" strokeWidth={4} opacity={0.8} />
    <path d={poly([[m.x + 40, GROUND - 4], [m.x + m.w - 40, GROUND - 4], [m.x + m.w, GROUND + 76], [m.x, GROUND + 76]])} fill="#000" opacity={0.25} />
  </g>
);

const Table: Theme['modules']['table'] = ({m}) => (
  <g>
    <ellipse cx={m.x + m.w / 2} cy={GROUND} rx={m.w * 0.6} ry={12} fill="#000" opacity={0.5} filter="url(#c-soft)" />
    {[m.x + 30, m.x + m.w - 44].map((x) => (
      <rect key={x} x={x} y={GROUND - 190} width={14} height={186} fill="url(#c-wood)" />
    ))}
    <rect x={m.x} y={GROUND - 208} width={m.w} height={22} rx={3} fill="url(#c-wood)" />
    <rect x={m.x} y={GROUND - 208} width={m.w} height={4} fill={K.woodLight} />
    {[0, 1, 2].map((k) => (
      <g key={k}>
        <rect x={m.x + 28 + k * 8} y={GROUND - 236 - k * 26} width={120 - k * 14} height={24} rx={2} fill={BOOKS[(k * 2 + 1) % 6]} />
        <rect x={m.x + 28 + k * 8} y={GROUND - 236 - k * 26} width={120 - k * 14} height={8} fill="#fff" opacity={0.12} />
      </g>
    ))}
    {/* candle */}
    <rect x={m.x + 180} y={GROUND - 270} width={18} height={62} fill="#EFE3C8" />
    <circle cx={m.x + 189} cy={GROUND - 290} r={60} fill="url(#c-lampglow)" style={{mixBlendMode: 'screen'}} />
    <ellipse cx={m.x + 189} cy={GROUND - 284} rx={6} ry={12} fill="#FFE2A0" />
  </g>
);

const Plant: Theme['modules']['plant'] = ({m, ctx}) => (
  <g transform={`translate(${m.x} ${GROUND}) scale(${m.scale})`}>
    {[-55, -30, -8, 14, 36, 60].map((a, i) => (
      <g key={i} transform={`rotate(${a + Math.sin(ctx.t * 0.8 + i) * 2} 0 -120)`}>
        <ellipse cx={0} cy={-250} rx={34} ry={110} fill={i % 2 ? '#1F3A2A' : '#2A4A34'} />
        <ellipse cx={8} cy={-270} rx={14} ry={80} fill="#fff" opacity={0.05} />
      </g>
    ))}
    <path d="M -70 -130 L 70 -130 L 54 0 L -54 0 Z" fill="#5A3A2A" />
    <path d="M -70 -130 L 70 -130 L 54 0 L -54 0 Z" fill="url(#c-book)" />
  </g>
);

const Ladder: Theme['modules']['ladder'] = ({m}) => {
  const dx = Math.tan((m.lean * Math.PI) / 180) * (GROUND - m.topY);
  return (
    <g>
      {[0, 70].map((o) => (
        <line key={o} x1={m.x + o} y1={m.topY} x2={m.x + o + dx} y2={GROUND} stroke={K.wood} strokeWidth={12} strokeLinecap="round" />
      ))}
      {[0, 70].map((o) => (
        <line key={`h${o}`} x1={m.x + o + 3} y1={m.topY} x2={m.x + o + dx + 3} y2={GROUND} stroke={K.woodLight} strokeWidth={3} opacity={0.7} />
      ))}
      {Array.from({length: 8}).map((_, i) => {
        const k = (i + 0.6) / 8.5;
        const y = m.topY + (GROUND - m.topY) * k;
        return <line key={i} x1={m.x + dx * k} y1={y} x2={m.x + 70 + dx * k} y2={y} stroke={K.woodDark} strokeWidth={8} />;
      })}
    </g>
  );
};

const Column: Theme['modules']['column'] = ({m}) => (
  <g>
    <rect x={m.x} y={-800} width={m.w} height={2400} fill="#0D0807" />
    <rect x={m.x + m.w - 18} y={-800} width={18} height={2400} fill={K.warm} opacity={0.18} />
  </g>
);

const BookStack: Theme['modules']['bookstack'] = ({m}) => (
  <g>
    {Array.from({length: m.count}).map((_, i) => {
      const w = 260 - i * 14 + random(`${m.seed}${i}`) * 30;
      const x = m.x + (random(`${m.seed}x${i}`) - 0.5) * 30;
      return (
        <g key={i}>
          <rect x={x} y={m.y - (i + 1) * 34} width={w} height={32} rx={3} fill={shade(BOOKS[i % 6], -0.5)} />
          <rect x={x} y={m.y - (i + 1) * 34} width={w} height={5} fill={K.warm} opacity={0.25} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- character
/** Cylinder shading for a limb: base stroke, shadow side, lit side (light from the shelf/orbs at +x). */
const Limb: React.FC<{pts: Vec[]; color: string; w: number}> = ({pts, color, w}) => {
  const d = poly(pts);
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={shade(color, -0.45)} strokeWidth={w} />
      <path d={d} stroke={color} strokeWidth={w * 0.72} transform="translate(3 -1)" />
      <path d={d} stroke={shade(color, 0.35)} strokeWidth={w * 0.18} transform={`translate(${w * 0.32} -2)`} opacity={0.8} />
    </g>
  );
};

const Character: React.FC<CharacterView> = ({joints: j, x, groundY, facing, expression, ctx}) => {
  const eye = blink(ctx.t, 3);
  const T = j.torsoAngle;
  const shoe = (f: Vec, lift: number, c: string) => (
    <g transform={`translate(${f[0]} ${f[1]}) rotate(${-lift * 18})`}>
      <path d="M -16 6 Q -18 -14 2 -14 Q 36 -12 40 6 Z" fill={c} />
      <path d="M 2 -14 Q 30 -12 36 -4" stroke="#fff" strokeWidth={2} opacity={0.25} fill="none" />
    </g>
  );
  const mouth: Record<string, React.ReactNode> = {
    neutral: <path d="M 24 30 Q 33 34 42 30" stroke="#5A2A22" strokeWidth={4} fill="none" strokeLinecap="round" />,
    happy: <path d="M 20 26 Q 33 40 46 25" stroke="#5A2A22" strokeWidth={4} fill="none" strokeLinecap="round" />,
    laugh: (
      <g>
        <path d="M 18 24 Q 34 50 50 23 Z" fill="#3A1410" />
        <path d="M 24 27 Q 34 31 44 27" stroke="#fff" strokeWidth={4} />
      </g>
    ),
    sad: <path d="M 23 36 Q 33 29 43 36" stroke="#5A2A22" strokeWidth={4} fill="none" strokeLinecap="round" />,
    surprised: <ellipse cx={34} cy={33} rx={6.5} ry={8.5} fill="#3A1410" />,
  };
  const brow = expression === 'surprised' ? -8 : 0;
  const browRot = expression === 'sad' ? -14 : expression === 'happy' || expression === 'laugh' ? -6 : 0;
  return (
    <g transform={`translate(${x} ${groundY}) scale(${facing} 1)`}>
      {/* contact shadow + lamp cast shadow falling away from the light */}
      <ellipse cx={6} cy={0} rx={70} ry={10} fill="#000" opacity={0.6} filter="url(#c-bloom)" />
      <path d="M -10 0 L -230 -6 L -250 12 L 20 8 Z" fill="#000" opacity={0.28} filter="url(#c-soft)" />
      <Limb pts={[j.hip.l, j.knee.l, j.foot.l]} color={shade(K.trousers, -0.2)} w={36} />
      {shoe(j.foot.l, j.footLift.l, shade(K.boots, -0.3))}
      <Limb pts={[j.shoulder.l, j.elbow.l, j.hand.l]} color={shade(K.coat, -0.3)} w={30} />
      <circle cx={j.hand.l[0]} cy={j.hand.l[1]} r={14} fill={K.skinShadow} />
      <Limb pts={[j.hip.r, j.knee.r, j.foot.r]} color={K.trousers} w={36} />
      {shoe(j.foot.r, j.footLift.r, K.boots)}
      <g transform={`translate(${j.pelvis[0]} ${j.pelvis[1]}) rotate(${T})`}>
        <path d="M -54 -136 Q -56 -166 -28 -168 L 28 -168 Q 56 -166 54 -136 L 58 30 Q 0 40 -58 30 Z" fill="url(#c-coat)" />
        <path d="M -6 -168 L 22 -168 L 12 -90 Z" fill={K.shirt} />
        <path d="M 12 -90 L 14 30" stroke="#000" strokeWidth={3} opacity={0.35} />
        <path d="M 54 -136 L 58 30" stroke={K.amber} strokeWidth={4} opacity={0.45} />
        {[-60, -26].map((y) => (
          <circle key={y} cx={26} cy={y} r={4} fill="#D9B56A" />
        ))}
      </g>
      <path d={poly([j.neck, [j.head[0], j.head[1] + 50]])} stroke={K.skinShadow} strokeWidth={22} />
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${j.headTilt})`}>
        <g transform={`rotate(${j.hairSwing} -56 -40)`}>
          <path d="M -50 -52 Q -108 -40 -104 40 Q -100 100 -80 128 Q -76 60 -60 20 Q -48 -10 -30 -40 Z" fill={K.hair} />
          <path d="M -92 10 Q -90 70 -82 110" stroke="#8A4A3A" strokeWidth={3} opacity={0.5} fill="none" />
        </g>
        <circle r={64} fill="url(#c-skin)" />
        <path d="M -64 0 A 64 64 0 0 0 -8 64 Q -44 24 -38 -30 Z" fill="#000" opacity={0.18} />
        <circle cx={-20} cy={6} r={12} fill={K.skinShadow} />
        <path d="M 62 -4 Q 77 8 61 15 Z" fill={K.skin} />
        <ellipse cx={46} cy={20} rx={11} ry={7} fill="#E0665A" opacity={expression === 'happy' || expression === 'laugh' ? 0.45 : 0.22} />
        {[18, 46].map((ex) => (
          <g key={ex} transform={`translate(${ex} -4) scale(1 ${expression === 'laugh' ? 0.25 : eye})`}>
            <ellipse rx={10} ry={expression === 'surprised' ? 12 : 10.5} fill="#F6EEE6" />
            <circle cx={j.pupil[0] * 0.9 + 2} cy={j.pupil[1] * 0.8} r={6.5} fill="#4A2E1E" />
            <circle cx={j.pupil[0] * 0.9 + 2} cy={j.pupil[1] * 0.8} r={3.2} fill="#120806" />
            <circle cx={j.pupil[0] * 0.9 + 4.5} cy={j.pupil[1] * 0.8 - 2.5} r={2} fill="#fff" />
            <path d="M -11 -4 Q 0 -13 11 -4" stroke="#2A140E" strokeWidth={3} fill="none" />
          </g>
        ))}
        {[18, 46].map((ex, i) => (
          <rect key={`b${ex}`} x={ex - 11} y={-28 + brow} width={22} height={5} rx={2.5} fill={K.hair} transform={`rotate(${i ? -browRot : browRot} ${ex} ${-26 + brow})`} />
        ))}
        {mouth[expression] ?? mouth.neutral}
        <path d="M -70 12 Q -80 -76 4 -74 Q 62 -72 70 -20 Q 36 -50 6 -40 Q -26 -24 -36 18 Z" fill={K.hair} />
        <path d="M -40 -60 Q 0 -76 44 -58" stroke="#9A5A44" strokeWidth={4} opacity={0.5} fill="none" strokeLinecap="round" />
        {/* rim light from the orbs */}
        <path d="M 30 -56 A 64 64 0 0 1 64 6" stroke={K.amber} strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />
      </g>
      <Limb pts={[j.shoulder.r, j.elbow.r, j.hand.r]} color={K.coat} w={30} />
      <circle cx={j.hand.r[0]} cy={j.hand.r[1]} r={14} fill={K.skin} />
      <circle cx={j.hand.r[0] + 4} cy={j.hand.r[1] - 3} r={6} fill="#fff" opacity={0.2} />
    </g>
  );
};

// ---------------------------------------------------------------- concept
const Orb: Theme['Orb'] = ({x, y, r, glow, pulse, fade, dissolve, squash}) => {
  const e = (glow + pulse * 0.9) * (1 - fade);
  const a = 1 - dissolve;
  return (
    <g opacity={a}>
      {/* the orb lights its surroundings */}
      <circle cx={x} cy={y} r={170 + pulse * 90} fill="url(#c-glow)" opacity={0.55 * e} style={{mixBlendMode: 'screen'}} />
      <g transform={`translate(${x} ${y}) scale(${1 + squash} ${1 - squash})`}>
        <circle r={r} fill={fade > 0.5 ? 'url(#c-orbdead)' : 'url(#c-orb)'} />
        <circle r={r} fill="url(#c-orbdead)" opacity={fade} />
        <circle r={r * 1.1} fill={K.amber} opacity={0.6 * e} filter="url(#c-bloom)" style={{mixBlendMode: 'screen'}} />
        <ellipse cx={-r * 0.3} cy={-r * 0.42} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity={0.9} />
      </g>
    </g>
  );
};

const Link: Theme['Link'] = ({a, b, growth, energy, pulse}) => {
  const d = linkPath(a, b, growth);
  const p = pulse ? linkPoint(pulse.from === 'a' ? a : b, pulse.from === 'a' ? b : a, pulse.k) : null;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <path d={d} stroke={K.amber} strokeWidth={10 + energy * 14} fill="none" opacity={0.18 + energy * 0.35} filter="url(#c-bloom)" />
      <path d={d} stroke={mix('#FFE3B0', '#FFFFFF', energy)} strokeWidth={2 + energy * 2.5} fill="none" opacity={0.55 + energy * 0.45} strokeLinecap="round" />
      {growth < 1 && <circle cx={linkPoint(a, b, growth)[0]} cy={linkPoint(a, b, growth)[1]} r={14} fill="#FFF4D6" filter="url(#c-bloom)" />}
      {p && <circle cx={p[0]} cy={p[1]} r={18} fill="#FFFFFF" filter="url(#c-bloom)" />}
      {p && <circle cx={p[0]} cy={p[1]} r={6} fill="#FFFFFF" />}
    </g>
  );
};

const Particle: Theme['Particle'] = ({x, y, r, a}) => <circle cx={x} cy={y} r={r * 1.4} fill={K.orbCore} opacity={a} filter="url(#c-bloom)" />;

const Post: Theme['Post'] = ({ctx}) => (
  <>
    {/* floating dust lit by the light */}
    <AbsoluteFill>
      <svg width="100%" height="100%">
        {Array.from({length: 60}).map((_, i) => {
          const x = (random(`dx${i}`) * 2100 + ctx.t * (6 + random(`dv${i}`) * 14)) % 2000 - 40;
          const y = random(`dy${i}`) * 1080 + Math.sin(ctx.t * 0.4 + i) * 20;
          return <circle key={i} cx={x} cy={y} r={0.8 + random(`dr${i}`) * 2.4} fill="#FFE9C4" opacity={0.25 + 0.3 * Math.sin(ctx.t * 1.5 + i * 1.3)} />;
        })}
      </svg>
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,70,140,0.22) 0%, rgba(255,150,70,0.18) 100%)', mixBlendMode: 'soft-light'}} />
    <TextureOverlay src={`textures/grain-${Math.floor(ctx.frame / 2) % 4}.png`} opacity={0.18} blend="overlay" />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 55% 45%, transparent 45%, rgba(5,3,10,0.7) 100%)'}} />
  </>
);

const Subtitle: Theme['Subtitle'] = ({line, t, inK}) => (
  <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 72}}>
    <div style={{opacity: inK, fontFamily: FONT, fontWeight: 700, fontSize: 42, color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.85)', letterSpacing: 0.4}}>
      {line.words.map((w, i) => (
        <span key={i} style={{opacity: t >= w.start ? 1 : 0.35}}>
          {w.text}{' '}
        </span>
      ))}
    </div>
  </AbsoluteFill>
);

const Title: Theme['Title'] = ({lines, k}) => (
  <AbsoluteFill style={{alignItems: 'center', paddingTop: 96}}>
    {lines.map((l, i) => (
      <div key={i} style={{opacity: k(i), filter: `blur(${(1 - k(i)) * 14}px)`, letterSpacing: 16 + (1 - k(i)) * 24, fontFamily: FONT, fontWeight: 900, fontSize: 88, color: i ? K.amber : '#fff', textShadow: `0 0 40px ${i ? 'rgba(255,196,107,0.6)' : 'rgba(255,255,255,0.35)'}`, lineHeight: 1.2}}>
        {l.toUpperCase()}
      </div>
    ))}
    <div style={{width: 420 * k(2), height: 2, background: 'rgba(255,255,255,0.7)', marginTop: 20}} />
  </AbsoluteFill>
);

export const cinematicTheme: Theme = {
  id: 'cinematic',
  name: 'C · Cinematic 2.5D',
  background: '#000',
  Defs,
  modules: {backdrop: Backdrop, window: Window, shelf: Shelf, lamp: Lamp, floor: Floor, rug: Rug, table: Table, plant: Plant, ladder: Ladder, column: Column, bookstack: BookStack},
  Character,
  Orb,
  Link,
  Particle,
  layerFilter: (d) => (d > 1.2 ? 'url(#c-blur-fg)' : d < 0.5 && d > 0.2 ? 'url(#c-blur-far)' : undefined),
  layerOverlay: ({depth}) => (depth > 0.4 && depth < 0.5 ? <rect x={-3000} y={-2000} width={8000} height={5000} fill="#0E0A16" opacity={0.42} /> : null),
  Post,
  Subtitle,
  Title,
};
