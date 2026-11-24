import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera} from '../engine/Camera';
import {FONT} from '../engine/fonts';
import {CHART, GROUND_Y, HERO, TITLE, TREE_X} from './bench';
import {Figure, type FigureLook} from './Figure';
import {FULL, useBench} from './shared';

/** A — Premium geometric editorial: flat shapes, strict palette, Swiss typography, no texture. */
const P = {
  cream: '#F2EBDD', navy: '#1E2A47', coral: '#F25C4A', coralDark: '#C8443A', mustard: '#F2B134',
  teal: '#2E7D78', sage: '#9CC9B4', sage2: '#7FB59D', skin: '#F2C6A0',
};

const look: FigureLook = {
  skin: P.skin, hair: P.navy, top: P.coral, bottom: P.navy, shoes: P.navy, ink: P.navy,
  shadow: P.coralDark, shading: 'flat', eyes: 'dot',
};

export const StyleA: React.FC = () => {
  const b = useBench();
  return (
    <AbsoluteFill style={{background: P.cream}}>
      <Camera focusX={b.cam.x} focusY={b.cam.y} zoom={b.cam.zoom}>
        <rect {...FULL} fill={P.cream} />
        {Array.from({length: 40}).map((_, i) => (
          <circle key={i} cx={140 + (i % 8) * 34} cy={130 + Math.floor(i / 8) * 34} r={4} fill={P.navy} opacity={0.22} />
        ))}
        <circle cx={b.sun[0]} cy={b.sun[1]} r={250} fill="none" stroke={P.navy} strokeWidth={2} opacity={0.12} />
        <circle cx={b.sun[0]} cy={b.sun[1]} r={195} fill="none" stroke={P.navy} strokeWidth={2} opacity={0.12} />
        <circle cx={b.sun[0]} cy={b.sun[1]} r={140} fill={P.mustard} />
        {[[200, 250, 230, 46], [640, 160, 170, 38], [1700, 440, 190, 42]].map(([x, y, w, h], i) => (
          <rect key={i} x={x + b.t * (6 + i * 3)} y={y} width={w} height={h} rx={h / 2} fill="#fff" opacity={0.85} />
        ))}
        <circle cx={300} cy={1520} r={820} fill={P.sage} />
        <circle cx={1560} cy={1640} r={960} fill={P.sage2} />
        <rect x={FULL.x} y={GROUND_Y - 20} width={FULL.width} height={2200} fill={P.teal} />
        <rect x={FULL.x} y={GROUND_Y - 20} width={FULL.width} height={6} fill={P.navy} opacity={0.25} />

        {/* tree */}
        <g>
          {b.tree.sproutLeaves > 0 && (
            <g transform={`translate(${TREE_X} ${GROUND_Y - 20}) scale(${b.tree.sproutLeaves})`}>
              <rect x={-3} y={-46} width={6} height={46} rx={3} fill={P.navy} />
              <ellipse cx={-16} cy={-46} rx={18} ry={8} fill={P.sage2} transform="rotate(-30 -16 -46)" />
              <ellipse cx={16} cy={-52} rx={18} ry={8} fill={P.sage} transform="rotate(30 16 -52)" />
            </g>
          )}
          {b.tree.trunk > 50 && (
            <rect x={TREE_X - b.tree.trunkWidth / 2} y={GROUND_Y - 20 - b.tree.trunk} width={b.tree.trunkWidth} height={b.tree.trunk} rx={b.tree.trunkWidth / 2} fill={P.navy} />
          )}
          {b.tree.canopy.map((c, i) => c.r > 1 && <circle key={`s${i}`} cx={c.x + 12} cy={c.y + 14} r={c.r} fill={P.coralDark} />)}
          {b.tree.canopy.map((c, i) => c.r > 1 && <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={P.coral} />)}
          {b.tree.canopy[0].r > 40 && (
            <path
              d={`M ${TREE_X - b.tree.canopy[0].r * 0.5} ${b.tree.canopy[0].y} A ${b.tree.canopy[0].r * 0.55} ${b.tree.canopy[0].r * 0.55} 0 0 1 ${TREE_X + b.tree.canopy[0].r * 0.2} ${b.tree.canopy[0].y - b.tree.canopy[0].r * 0.5}`}
              stroke={P.cream} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8}
            />
          )}
        </g>

        {/* chart */}
        <g opacity={b.chart.show} transform={`translate(0 ${(1 - b.chart.show) * 30})`}>
          <text x={CHART.x} y={CHART.y + 20} fontFamily={FONT} fontWeight={900} fontSize={40} fill={P.navy}>{CHART.title}</text>
          <rect x={CHART.x} y={CHART.y + 36} width={60} height={8} fill={P.coral} />
          {b.chart.bars.map((bar, i) => {
            const bx = CHART.x + i * 135;
            const base = CHART.y + CHART.h - 40;
            return (
              <g key={i}>
                <rect x={bx} y={base - bar.height} width={95} height={bar.height} rx={10} fill={[P.sage2, P.mustard, P.coral][i]} />
                <text x={bx + 47} y={base - bar.height - 14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={P.navy} opacity={bar.k}>
                  {bar.shown.toFixed(1)}×
                </text>
                <text x={bx + 47} y={base + 34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={P.navy}>{bar.label}</text>
              </g>
            );
          })}
          <rect x={CHART.x - 10} y={CHART.y + CHART.h - 40} width={410} height={4} fill={P.navy} />
        </g>

        <ellipse cx={b.hero.x} cy={GROUND_Y - 16} rx={70} ry={10} fill={P.navy} opacity={0.18} />
        {/* Flat styles use a graphic key light from the front (shadow on the back), not the physical sun direction. */}
        <Figure id="a" look={look} x={b.hero.x} y={GROUND_Y - 18} walking={b.hero.walking} walkPhase={b.hero.walkPhase} pose={HERO.pose} expression={HERO.expression} lightDir={1} />
      </Camera>

      {b.line && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 70px 110px'}}>
          <div
            style={{
              opacity: b.lineIn, transform: `translateY(${(1 - b.lineIn) * 16}px)`,
              background: P.cream, borderLeft: `10px solid ${P.coral}`, padding: '16px 28px',
              fontFamily: FONT, fontWeight: 900, fontSize: 44, color: P.navy, maxWidth: 1100, letterSpacing: -0.5,
            }}
          >
            {b.line.words.map((w, i) => (
              <span key={i} style={{opacity: b.t >= w.start ? 1 : 0.28}}>{w.text} </span>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {b.t >= TITLE.start && (
        <AbsoluteFill style={{padding: '110px 0 0 110px'}}>
          {TITLE.lines.map((l, i) => (
            <div key={i} style={{overflow: 'hidden', height: 128}}>
              <div style={{transform: `translateY(${(1 - b.title(i)) * 130}px)`, fontFamily: FONT, fontWeight: 900, fontSize: 116, color: P.navy, letterSpacing: -3, lineHeight: 1.1}}>
                {l.replace('.', '')}<span style={{color: P.coral}}>.</span>
              </div>
            </div>
          ))}
          <div style={{width: 260 * b.title(2), height: 12, background: P.mustard, marginTop: 18}} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
