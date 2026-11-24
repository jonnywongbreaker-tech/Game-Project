import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {mix} from '../engine/color';
import {Camera, Layer} from '../engine/Camera';
import {FONT} from '../engine/fonts';
import {wave} from '../engine/time';
import {CHART, GROUND_Y, HERO, LIGHT_DIR, TITLE, TREE_X} from './bench';
import {Figure, type FigureLook} from './Figure';
import {FULL, useBench} from './shared';

/** C — Cinematic 2.5D: parallax depth layers, atmospheric haze, time-of-day lighting, rim light, depth of field. */
const look = (k: number): FigureLook => ({
  skin: '#E9B48F', hair: '#2A1E1A', top: '#E2574C', bottom: '#2B3550', shoes: '#1E1E28', ink: '#1E1626',
  shadow: '#9C3A35', shading: 'volumetric', rim: {color: mix('#FFF4D6', '#FFC46B', k), strength: 0.55 + 0.4 * k}, eyes: 'lidded',
});

const ridge = (seed: string, base: number, amp: number, step = 140) => {
  let d = `M -1400 2200 L -1400 ${base}`;
  for (let x = -1400; x <= 3400; x += step) d += ` L ${x} ${base - random(`${seed}${x}`) * amp}`;
  return `${d} L 3400 2200 Z`;
};
const RIDGE_FAR = ridge('far', 640, 230, 120);
const RIDGE_MID = ridge('mid', 700, 150, 180);

export const StyleC: React.FC = () => {
  const b = useBench();
  const k = b.light;
  const skyTop = mix('#4E9BDB', '#2A2F5E', k);
  const skyMid = mix('#9CCBEA', '#E0784C', k);
  const horizon = mix('#F4E6C4', '#FFC978', k);
  const haze = (c: string, amt: number) => mix(c, horizon, amt);
  const shadowLen = 40 + k * 210;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera
        layered
        focusX={b.cam.x}
        focusY={b.cam.y}
        zoom={b.cam.zoom}
        defs={
          <>
            <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={skyTop} />
              <stop offset="0.45" stopColor={skyMid} />
              <stop offset="0.62" stopColor={horizon} />
            </linearGradient>
            <radialGradient id="c-sun">
              <stop offset="0" stopColor="#FFFDF2" />
              <stop offset="0.12" stopColor="#FFF3C9" />
              <stop offset="0.35" stopColor={mix('#FFF0B8', '#FFB45E', k)} stopOpacity={0.55} />
              <stop offset="1" stopColor={horizon} stopOpacity={0} />
            </radialGradient>
            <linearGradient id="c-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFF6DA" stopOpacity={0.9} />
              <stop offset="1" stopColor="#FFF6DA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="c-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={haze('#6BA84E', 0.25 + 0.15 * k)} />
              <stop offset="0.25" stopColor={mix('#3E7134', '#4A5A2A', k)} />
            </linearGradient>
            <radialGradient id="c-leaf" cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor={mix('#8BCB62', '#E3C25A', k * 0.7)} />
              <stop offset="0.6" stopColor="#3F8A3C" />
              <stop offset="1" stopColor="#1F4F26" />
            </radialGradient>
            <linearGradient id="c-trunk" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="#3B2418" />
              <stop offset="1" stopColor={mix('#8A5A3B', '#C27A45', k)} />
            </linearGradient>
            <linearGradient id="c-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE2A0" />
              <stop offset="1" stopColor="#E6784A" />
            </linearGradient>
            <filter id="c-dof" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={9} />
            </filter>
            <filter id="c-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={6} />
            </filter>
            <filter id="c-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={8} result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        }
      >
        {/* sky + sun + light rays: nearly fixed */}
        <Layer depth={0.05}>
          <rect {...FULL} fill="url(#c-sky)" />
          <circle cx={b.sun[0]} cy={b.sun[1]} r={520} fill="url(#c-sun)" />
          <g style={{mixBlendMode: 'screen'}} opacity={0.12 + 0.1 * k}>
            {[-62, -48, -35, -22, -10].map((a, i) => (
              <path
                key={i}
                d={`M ${b.sun[0]} ${b.sun[1]} L ${b.sun[0] + 1900} ${b.sun[1] + 1500} L ${b.sun[0] + 1700} ${b.sun[1] + 1700} Z`}
                fill="url(#c-ray)"
                transform={`rotate(${-(a + 40) + wave(b.t, 0.05, 2, i * 0.2)} ${b.sun[0]} ${b.sun[1]})`}
              />
            ))}
          </g>
        </Layer>
        <Layer depth={0.2}>
          <path d={RIDGE_FAR} fill={haze('#5A7FA6', 0.5)} />
        </Layer>
        <Layer depth={0.38}>
          <path d={RIDGE_MID} fill={haze('#3E5E6E', 0.4)} />
          {Array.from({length: 60}).map((_, i) => (
            <circle key={i} cx={-1300 + i * 80 + random(`mt${i}`) * 50} cy={700 - random(`mh${i}`) * 60} r={50 + random(`mr${i}`) * 45} fill={haze('#25503A', 0.3)} />
          ))}
          <rect x={-1400} y={690} width={4800} height={400} fill={haze('#25503A', 0.3)} />
        </Layer>
        <Layer depth={0.65}>
          <path d="M -1400 820 Q -600 700 200 790 Q 900 690 1600 790 Q 2300 710 3400 800 L 3400 2200 L -1400 2200 Z" fill={haze('#4C8248', 0.22)} />
        </Layer>

        {/* stage */}
        <Layer depth={1}>
          <rect x={FULL.x} y={GROUND_Y - 22} width={FULL.width} height={2200} fill="url(#c-ground)" />
          {/* cast shadows, stretched away from the sun as it lowers */}
          <ellipse cx={b.hero.x + shadowLen - 40} cy={GROUND_Y - 14} rx={shadowLen} ry={12} fill="#0F1A10" opacity={0.34} filter="url(#c-soft)" />
          <ellipse cx={b.hero.x + 6} cy={GROUND_Y - 16} rx={62} ry={9} fill="#0F1A10" opacity={0.5} filter="url(#c-soft)" />
          {b.tree.trunk > 50 && <ellipse cx={TREE_X + shadowLen * 1.4} cy={GROUND_Y - 10} rx={shadowLen * 1.6 + b.tree.canopy[0].r * 0.6} ry={22} fill="#0F1A10" opacity={0.3} filter="url(#c-soft)" />}
          {Array.from({length: 90}).map((_, i) => {
            const x = -1300 + random(`gt${i}`) * 4400;
            const y = GROUND_Y - 10 + random(`gty${i}`) * 260;
            const h = 14 + random(`gth${i}`) * 18;
            return <path key={`gt${i}`} d={`M ${x} ${y} l -5 ${-h} l 6 ${h * 0.6} l 4 ${-h * 1.1} l 3 ${h * 1.1} Z`} fill={mix('#2E5A27', '#4A5A22', k)} opacity={0.7} />;
          })}

          {b.tree.sproutLeaves > 0 && (
            <g transform={`translate(${TREE_X} ${GROUND_Y - 20}) scale(${b.tree.sproutLeaves})`}>
              <path d="M 0 0 Q -4 -24 0 -48" stroke="#2F5A2A" strokeWidth={5} fill="none" />
              <path d="M 0 -44 Q -30 -64 -38 -40 Q -18 -32 0 -44 Z" fill="url(#c-leaf)" />
              <path d="M 0 -48 Q 28 -74 40 -50 Q 20 -40 0 -48 Z" fill="url(#c-leaf)" />
            </g>
          )}
          {b.tree.trunk > 50 && (
            <path
              d={`M ${TREE_X - b.tree.trunkWidth / 2} ${GROUND_Y - 18} Q ${TREE_X - b.tree.trunkWidth * 0.3} ${GROUND_Y - b.tree.trunk / 2} ${TREE_X - b.tree.trunkWidth * 0.3} ${GROUND_Y - 20 - b.tree.trunk} L ${TREE_X + b.tree.trunkWidth * 0.3} ${GROUND_Y - 20 - b.tree.trunk} Q ${TREE_X + b.tree.trunkWidth * 0.35} ${GROUND_Y - b.tree.trunk / 2} ${TREE_X + b.tree.trunkWidth / 2} ${GROUND_Y - 18} Z`}
              fill="url(#c-trunk)"
            />
          )}
          {b.tree.canopy.map((c, i) => c.r > 1 && <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="url(#c-leaf)" />)}
          {b.tree.canopy.map(
            (c, i) =>
              c.r > 20 && (
                <path key={`r${i}`} d={`M ${c.x - c.r * 0.2} ${c.y - c.r * 0.97} A ${c.r} ${c.r} 0 0 0 ${c.x - c.r * 0.95} ${c.y + c.r * 0.3}`} stroke={mix('#FFF4D6', '#FFC46B', k)} strokeWidth={4} fill="none" opacity={0.2 + 0.25 * k} strokeLinecap="round" />
              ),
          )}

          {/* holographic chart */}
          <g opacity={b.chart.show} transform={`translate(0 ${(1 - b.chart.show) * 30})`}>
            <rect x={CHART.x - 34} y={CHART.y - 46} width={470} height={CHART.h + 70} rx={26} fill="#FFFFFF" fillOpacity={0.12} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2} />
            <text x={CHART.x} y={CHART.y + 4} fontFamily={FONT} fontWeight={700} fontSize={26} letterSpacing={6} fill="#fff">{CHART.title.toUpperCase()}</text>
            {b.chart.bars.map((bar, i) => {
              const bx = CHART.x + i * 135;
              const base = CHART.y + CHART.h - 50;
              return (
                <g key={i}>
                  <rect x={bx} y={base - bar.height} width={95} height={bar.height} rx={8} fill="url(#c-bar)" filter="url(#c-glow)" />
                  <text x={bx + 47} y={base - bar.height - 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill="#fff" opacity={bar.k}>{bar.shown.toFixed(1)}×</text>
                  <text x={bx + 47} y={base + 34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill="#fff" opacity={0.8}>{bar.label}</text>
                </g>
              );
            })}
          </g>

          <Figure id="c" look={look(k)} x={b.hero.x} y={GROUND_Y - 18} walking={b.hero.walking} walkPhase={b.hero.walkPhase} pose={HERO.pose} expression={HERO.expression} lightDir={LIGHT_DIR} />
        </Layer>

        {/* foreground, out of focus */}
        <Layer depth={1.6} filter="url(#c-dof)">
          {Array.from({length: 34}).map((_, i) => {
            const x = -900 + i * 120 + random(`fg${i}`) * 80;
            const h = 120 + random(`fh${i}`) * 160;
            const sway = wave(b.t, 0.3, 8, i * 0.13);
            return <path key={i} d={`M ${x - 26} 1140 Q ${x + sway} ${1140 - h} ${x + sway * 2} ${1140 - h - 20} Q ${x + 10} ${1140 - h * 0.5} ${x + 26} 1140 Z`} fill="#16281A" />;
          })}
          <path d={`M 2350 -300 Q 2050 40 1700 ${150 + wave(b.t, 0.2, 10)}`} stroke="#16281A" strokeWidth={22} fill="none" />
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={2300 - i * 70} cy={-220 + i * 44 + wave(b.t, 0.25, 6, i * 0.1)} rx={46} ry={20} fill="#1C3420" transform={`rotate(${-30 + i * 6} ${2300 - i * 70} ${-220 + i * 44})`} />
          ))}
        </Layer>
      </Camera>

      {/* floating dust, catching the light */}
      <AbsoluteFill>
        <svg width="100%" height="100%">
          {Array.from({length: 48}).map((_, i) => {
            const x = (random(`dx${i}`) * 2100 + b.t * (8 + random(`dv${i}`) * 18)) % 2000 - 40;
            const y = random(`dy${i}`) * 1080 + wave(b.t, 0.1 + random(`df${i}`) * 0.2, 18, i * 0.37);
            return <circle key={i} cx={x} cy={y} r={1.2 + random(`dr${i}`) * 2.8} fill="#FFF1C9" opacity={(0.18 + 0.45 * k) * (0.6 + 0.4 * Math.sin(b.t * 2 + i))} />;
          })}
        </svg>
      </AbsoluteFill>
      {/* grade + vignette */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(40,60,140,${0.1 + 0.1 * k}) 0%, rgba(255,150,60,${0.06 + 0.2 * k}) 100%)`, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(10,6,24,0.55) 100%)'}} />

      {b.line && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80}}>
          <div style={{opacity: b.lineIn, fontFamily: FONT, fontWeight: 700, fontSize: 44, color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,0.65)', letterSpacing: 0.3}}>
            {b.line.words.map((w, i) => (
              <span key={i} style={{opacity: b.t >= w.start ? 1 : 0.4}}>{w.text} </span>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {b.t >= TITLE.start && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 90}}>
          {TITLE.lines.map((l, i) => (
            <div
              key={i}
              style={{
                opacity: b.title(i), filter: `blur(${(1 - b.title(i)) * 14}px)`, letterSpacing: 14 + (1 - b.title(i)) * 20,
                fontFamily: FONT, fontWeight: 900, fontSize: 92, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.45)', lineHeight: 1.15,
              }}
            >
              {l.toUpperCase()}
            </div>
          ))}
          <div style={{width: 420 * b.title(2), height: 3, background: 'rgba(255,255,255,0.8)', marginTop: 18}} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
