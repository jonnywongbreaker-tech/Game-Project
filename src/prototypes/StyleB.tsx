import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {SERIF} from '../engine/fonts';
import {Camera} from '../engine/Camera';
import {TextureOverlay} from '../engine/Texture';
import {CHART, GROUND_Y, HERO, TITLE, TREE_X} from './bench';
import {Figure, type FigureLook} from './Figure';
import {FULL, useBench} from './shared';

/** B — Textured editorial: muted palette, ink outlines that "boil" on threes, hatching, paper grain. */
const P = {
  paper: '#EDE4D3', paperLight: '#F6F0E4', ink: '#2B2620', terracotta: '#C4673F', ochre: '#D6A23E',
  sage: '#9AA77A', olive: '#6F7A4F', dusty: '#7C93A6', wash: '#B9C6CC', ground: '#8E9563', skin: '#E8B994',
};

const look: FigureLook = {
  skin: P.skin, hair: P.ink, top: P.terracotta, bottom: '#4F6577', shoes: P.ink, ink: P.ink,
  shadow: P.terracotta, shading: 'hatch', hatchId: 'hatch', outline: {color: P.ink, width: 3.5}, filter: 'url(#rough)', eyes: 'dot',
};

const ink = {stroke: P.ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const};

export const StyleB: React.FC = () => {
  const b = useBench();
  const boil = Math.floor(b.frame / 3) % 6; // hand-drawn line "boil", animated on threes
  return (
    <AbsoluteFill style={{background: P.paper}}>
      <Camera
        focusX={b.cam.x}
        focusY={b.cam.y}
        zoom={b.cam.zoom}
        defs={
          <>
            <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={boil} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={6} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <pattern id="hatch" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
              <line x1={0} y1={0} x2={0} y2={9} stroke={P.ink} strokeWidth={2.2} />
            </pattern>
            <linearGradient id="b-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={P.wash} />
              <stop offset="0.75" stopColor={P.paper} />
            </linearGradient>
          </>
        }
      >
        <rect {...FULL} fill="url(#b-sky)" />
        <g filter="url(#rough)">
          <circle cx={b.sun[0]} cy={b.sun[1]} r={115} fill={P.ochre} {...ink} />
          {[[220, 240, 1], [700, 150, 0.8], [1720, 430, 0.9]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x + b.t * (6 + i * 3)} ${y}) scale(${s})`} fill={P.paperLight} {...ink}>
              <path d="M -110 20 Q -120 -20 -70 -25 Q -50 -70 0 -55 Q 50 -80 80 -30 Q 130 -25 115 20 Z" />
            </g>
          ))}
          <path d="M -1400 760 Q -700 560 -100 700 Q 400 560 900 690 Q 1500 540 2100 700 Q 2700 600 3300 720 L 3300 2200 L -1400 2200 Z" fill={P.sage} {...ink} />
          <path d="M -1400 760 Q -700 560 -100 700 Q 400 560 900 690 Q 1500 540 2100 700 Q 2700 600 3300 720 L 3300 2200 L -1400 2200 Z" fill="url(#hatch)" opacity={0.16} />
          <path d="M -1400 830 Q -600 730 200 810 Q 900 720 1600 815 Q 2300 740 3300 820 L 3300 2200 L -1400 2200 Z" fill={P.olive} {...ink} />
          <rect x={FULL.x} y={GROUND_Y - 20} width={FULL.width} height={2200} fill={P.ground} {...ink} />
          {Array.from({length: 70}).map((_, i) => {
            const x = -1200 + random(`g${i}`) * 4300;
            const y = GROUND_Y + 10 + random(`gy${i}`) * 200;
            return <path key={i} d={`M ${x} ${y} l -6 -16 M ${x + 6} ${y} l 2 -18 M ${x + 12} ${y} l 8 -14`} stroke={P.ink} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />;
          })}

          {/* tree */}
          {b.tree.sproutLeaves > 0 && (
            <g transform={`translate(${TREE_X} ${GROUND_Y - 20}) scale(${b.tree.sproutLeaves})`} {...ink}>
              <path d="M 0 0 Q -4 -24 0 -48" fill="none" />
              <path d="M 0 -44 Q -30 -64 -38 -40 Q -18 -32 0 -44 Z" fill={P.sage} />
              <path d="M 0 -48 Q 28 -74 40 -50 Q 20 -40 0 -48 Z" fill={P.olive} />
            </g>
          )}
          {b.tree.trunk > 50 && (
            <path
              d={`M ${TREE_X - b.tree.trunkWidth / 2} ${GROUND_Y - 20} Q ${TREE_X - b.tree.trunkWidth * 0.3} ${GROUND_Y - b.tree.trunk / 2} ${TREE_X - b.tree.trunkWidth * 0.3} ${GROUND_Y - 20 - b.tree.trunk} L ${TREE_X + b.tree.trunkWidth * 0.3} ${GROUND_Y - 20 - b.tree.trunk} Q ${TREE_X + b.tree.trunkWidth * 0.35} ${GROUND_Y - b.tree.trunk / 2} ${TREE_X + b.tree.trunkWidth / 2} ${GROUND_Y - 20} Z`}
              fill="#7A4E36" {...ink}
            />
          )}
          {b.tree.canopy.map((c, i) => c.r > 1 && <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={i % 2 ? P.olive : P.sage} {...ink} />)}
          {b.tree.canopy.map((c, i) => c.r > 1 && <circle key={`h${i}`} cx={c.x - c.r * 0.25} cy={c.y + c.r * 0.25} r={c.r * 0.7} fill="url(#hatch)" opacity={0.3} />)}

          {/* chart */}
          <g opacity={b.chart.show} transform={`rotate(-1.5 ${CHART.x} ${CHART.y}) translate(0 ${(1 - b.chart.show) * 30})`}>
            <rect x={CHART.x - 30} y={CHART.y - 40} width={460} height={CHART.h + 60} fill={P.paperLight} {...ink} />
            <text x={CHART.x} y={CHART.y + 10} fontFamily={SERIF} fontWeight={700} fontStyle="italic" fontSize={40} fill={P.ink} stroke="none">{CHART.title}</text>
            {b.chart.bars.map((bar, i) => {
              const bx = CHART.x + i * 135;
              const base = CHART.y + CHART.h - 50;
              return (
                <g key={i}>
                  <rect x={bx} y={base - bar.height} width={95} height={bar.height} fill={[P.dusty, P.ochre, P.terracotta][i]} {...ink} />
                  <rect x={bx} y={base - bar.height} width={95} height={bar.height} fill="url(#hatch)" opacity={0.25} />
                  <text x={bx + 47} y={base - bar.height - 12} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={P.ink} stroke="none" opacity={bar.k}>
                    {bar.shown.toFixed(1)}×
                  </text>
                  <text x={bx + 47} y={base + 34} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={24} fill={P.ink} stroke="none">{bar.label}</text>
                </g>
              );
            })}
          </g>
        </g>
        <ellipse cx={b.hero.x} cy={GROUND_Y - 14} rx={72} ry={11} fill="url(#hatch)" opacity={0.5} />
        {/* Flat styles use a graphic key light from the front (shadow on the back), not the physical sun direction. */}
        <Figure id="b" look={look} x={b.hero.x} y={GROUND_Y - 18} walking={b.hero.walking} walkPhase={b.hero.walkPhase} pose={HERO.pose} expression={HERO.expression} lightDir={1} />
      </Camera>

      {/* paper grain + fibres: baked textures (npm run bake-textures), grain cycles every other frame */}
      <TextureOverlay src="textures/fibre.png" opacity={0.6} />
      <TextureOverlay src={`textures/grain-${Math.floor(b.frame / 2) % 4}.png`} opacity={0.55} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(80,55,30,0.28) 100%)'}} />

      {b.line && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70}}>
          <div style={{opacity: b.lineIn, fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 54, color: P.ink, background: 'rgba(246,240,228,0.88)', padding: '8px 30px', transform: 'rotate(-0.6deg)'}}>
            {b.line.words.map((w, i) => {
              const on = b.t >= w.start && b.t <= w.end + 0.08;
              return (
                <span key={i} style={{opacity: b.t >= w.start ? 1 : 0.35, background: on ? 'rgba(214,162,62,0.45)' : 'transparent'}}>
                  {w.text}{' '}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
      {b.t >= TITLE.start && (
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 120}}>
          {TITLE.lines.map((l, i) => (
            <div
              key={i}
              style={{
                opacity: b.title(i), transform: `translateY(${(1 - b.title(i)) * 20}px)`,
                fontFamily: SERIF, fontWeight: 700, fontStyle: i ? 'italic' : 'normal', fontSize: 124, lineHeight: 1.05,
                color: i ? P.terracotta : P.ink,
              }}
            >
              {l}
            </div>
          ))}
          <svg width={520} height={40} style={{marginTop: 6}}>
            <path d="M 10 24 Q 140 8 260 22 T 510 18" stroke={P.ochre} strokeWidth={12} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - b.title(2)} />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
