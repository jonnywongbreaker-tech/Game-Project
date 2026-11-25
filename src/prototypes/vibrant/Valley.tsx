/**
 * Reproduction test 1 — Mountain valley at dawn (docs/ART_DIRECTION.md).
 * Tests: environmental beauty, organic geometry, colour harmony, atmospheric depth,
 * restrained ambient motion. Reuses Camera/Layer parallax, time helpers and grain.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {Camera, Layer} from '../../engine/Camera';
import {TextureOverlay} from '../../engine/Texture';
import {ease, tween, useTime, wave} from '../../engine/time';
import {blob, Glow, Linear, type P, Radial, ridge, smooth} from './look';

// Colour script: "dawn valley" — indigo sky to apricot horizon, lavender peaks,
// teal hills with violet-blue shadows, a sky-reflecting river.
const C = {
  sky: ['#1E2766', '#5A3A9E', '#E0608E', '#FFAA6B', '#FFE1A0'],
  sun: '#FFF6DC',
  farPeak: '#9C7CE0', farPeakLit: '#E8B4E6', farShadow: '#6E5CC4', snowLit: '#FFEAF2', snowShadow: '#B7B0F2',
  midRidge: '#6A4FBF', midRidgeLit: '#C27BD4',
  hill: '#1F8C8C', hillLit: '#43C29B', hillShadow: '#24577F',
  conifer: '#155C70', coniferLit: '#2FA08F',
  meadow: '#47C78E', meadowLit: '#B5E36E', bank: '#F5C98F',
  riverFar: '#FFE6A8', riverMid: '#7FDDE8', riverNear: '#2E8BD0',
  tree: '#2FAE7E', treeLit: '#9BE27A', treeShadow: '#2B5E86', trunk: '#5B3A6B',
  fg: '#11395A', fgRim: '#FF9A6B',
  rock: '#7B67CF', rockLit: '#C9A4F0',
};

const SUN: P = [1080, 470];

const Defs: React.FC = () => (
  <>
    <Linear id="v-sky" stops={[[0, C.sky[0]], [0.3, C.sky[1]], [0.55, C.sky[2]], [0.75, C.sky[3]], [0.9, C.sky[4]]]} x1={0} y1={-120} x2={0} y2={560} user />
    <Radial id="v-sunglow" stops={[[0, '#FFF3C8', 0.95], [0.18, '#FFD98A', 0.55], [0.5, '#FF9E7A', 0.18], [1, '#FF8A80', 0]]} />
    <Linear id="v-far" stops={[[0, C.farPeakLit], [0.45, C.farPeak], [1, '#F0A6C0']]} />
    <Linear id="v-mid" stops={[[0, C.midRidgeLit], [0.5, C.midRidge], [1, '#B07CC8']]} />
    <Linear id="v-haze" stops={[[0, '#FFB98F', 0], [1, '#FFC9A0', 0.75]]} />
    <Linear id="v-hillL" stops={[[0, C.hillLit], [0.6, C.hill], [1, C.hillShadow]]} x1={1} y1={0} x2={0} y2={1} />
    <Linear id="v-hillR" stops={[[0, C.hillLit], [0.5, C.hill], [1, C.hillShadow]]} x1={0} y1={0} x2={1} y2={1} />
    <Linear id="v-meadow" stops={[[0, C.meadowLit], [0.55, C.meadow], [1, '#2E9C86']]} />
    <Linear id="v-river" stops={[[0, C.riverFar], [0.35, C.riverMid], [1, C.riverNear]]} x1={0} y1={560} x2={0} y2={1150} user />
    <Radial id="v-tree" stops={[[0, C.treeLit], [0.55, C.tree], [1, C.treeShadow]]} cx={0.35} cy={0.3} r={0.75} />
    <Radial id="v-rock" stops={[[0, C.rockLit], [1, C.rock]]} cx={0.3} cy={0.25} r={0.8} />
    <Linear id="v-fg" stops={[[0, '#1C5B7A'], [1, C.fg]]} />
    <Linear id="v-ray" stops={[[0, '#FFF1C4', 0.32], [1, '#FFF1C4', 0]]} />
    <Linear id="v-mist" stops={[[0, '#FFE3D0', 0], [0.5, '#FFE3D0', 0.55], [1, '#FFE3D0', 0]]} x1={0} y1={0} x2={1} y2={0} />
    <Radial id="v-cshadow" stops={[[0, '#22808A', 0.38], [0.6, '#22808A', 0.22], [1, '#22808A', 0]]} />
    <Linear id="v-cloud" stops={[[0, '#FFD8C2'], [1, '#C98ACB']]} />
  </>
);

/** A conifer: stacked soft tiers, shadow body with a sunlit left half. */
const Conifer: React.FC<{x: number; y: number; h: number; body?: string; lit?: string}> = ({x, y, h, body = C.conifer, lit = C.coniferLit}) => {
  const w = h * 0.4;
  const tier = (k: number, half: boolean) => {
    const top = y - h + k * h * 0.26;
    const ww = w * (0.55 + k * 0.24);
    const bottom = top + h * 0.4;
    return half
      ? `M${x} ${top}Q${x - ww * 0.15} ${top + h * 0.16} ${x - ww / 2} ${bottom}Q${x - ww * 0.22} ${bottom - h * 0.05} ${x} ${bottom - h * 0.04}Z`
      : `M${x} ${top}Q${x + ww * 0.15} ${top + h * 0.16} ${x + ww / 2} ${bottom}Q${x} ${bottom - h * 0.06} ${x - ww / 2} ${bottom}Q${x - ww * 0.15} ${top + h * 0.16} ${x} ${top}Z`;
  };
  return (
    <g>
      <rect x={x - h * 0.03} y={y - h * 0.12} width={h * 0.06} height={h * 0.13} rx={h * 0.02} fill={C.trunk} />
      {[0, 1, 2].map((k) => <path key={k} d={tier(k, false)} fill={body} />)}
      {[0, 1, 2].map((k) => <path key={`l${k}`} d={tier(k, true)} fill={lit} />)}
    </g>
  );
};

/** A mountain: curved flanks, shadowed right face, jagged two-tone snow cap. */
const Mountain: React.FC<{x: number; y: number; w: number; base: number; face: string; shade: string; snow?: boolean}> = ({x, y, w, base, face, shade, snow}) => {
  const h = base - y;
  const L = `M${x - w} ${base}Q${x - w * 0.42} ${y + h * 0.38} ${x} ${y}`;
  const R = `Q${x + w * 0.45} ${y + h * 0.34} ${x + w} ${base}Z`;
  const shadow = `M${x} ${y}Q${x + w * 0.45} ${y + h * 0.34} ${x + w} ${base}L${x + w * 0.16} ${base}Q${x + w * 0.05} ${y + h * 0.5} ${x} ${y}Z`;
  const cap = (side: -1 | 1) => {
    const pts: P[] = side < 0
      ? [[x, y], [x - w * 0.2, y + h * 0.27], [x - w * 0.13, y + h * 0.22], [x - w * 0.07, y + h * 0.31], [x, y + h * 0.24]]
      : [[x, y], [x, y + h * 0.24], [x + w * 0.06, y + h * 0.33], [x + w * 0.12, y + h * 0.25], [x + w * 0.21, y + h * 0.3]];
    return `M${pts.map((p) => p.join(' ')).join('L')}Z`;
  };
  return (
    <g>
      <path d={L + R} fill={face} />
      <path d={shadow} fill={shade} />
      {snow && <path d={cap(-1)} fill={C.snowLit} />}
      {snow && <path d={cap(1)} fill={C.snowShadow} />}
    </g>
  );
};

/** An angular rock with lit top and coloured-shadow side. */
const Rock: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g>
    <path d={`M${x - 60 * s} ${y}L${x - 44 * s} ${y - 40 * s}L${x - 6 * s} ${y - 58 * s}L${x + 40 * s} ${y - 36 * s}L${x + 62 * s} ${y}Z`} fill={C.rock} />
    <path d={`M${x - 44 * s} ${y - 40 * s}L${x - 6 * s} ${y - 58 * s}L${x + 40 * s} ${y - 36 * s}L${x + 4 * s} ${y - 26 * s}Z`} fill={C.rockLit} />
  </g>
);

export const Valley: React.FC = () => {
  const {t} = useTime();
  // One slow, purposeful camera move: a push-in drifting toward the sunlit valley.
  const zoom = tween(t, [0, 5], [1, 1.075], ease.inOut);
  const focusX = tween(t, [0, 5], [940, 1010], ease.inOut);
  const focusY = tween(t, [0, 5], [560, 548], ease.inOut);
  const drift = (speed: number) => t * speed;

  // River: a winding centreline from the horizon to the bottom edge.
  const riverLine: P[] = [[1120, 672], [1070, 700], [1170, 735], [1020, 800], [1160, 890], [920, 1000], [1010, 1180]];
  const riverEdge = (w0: number, w1: number, side: 1 | -1): P[] => riverLine.map(([x, y], i) => [x + side * (w0 + (w1 - w0) * (i / (riverLine.length - 1))), y]);
  const riverShape = smooth([...riverEdge(4, 140, -1), ...riverEdge(4, 140, 1).reverse()], true, 0.8);

  return (
    <AbsoluteFill style={{background: C.sky[0]}}>
      <Camera layered focusX={focusX} focusY={focusY} zoom={zoom} defs={<Defs />}>
        {/* Sky, sun, rays and clouds */}
        <Layer depth={0.05}>
          <rect x={-400} y={-300} width={2720} height={1700} fill="url(#v-sky)" />
          <Glow x={SUN[0]} y={SUN[1]} r={520} id="v-sunglow" />
          {[-34, -18, -4, 10, 26].map((a, i) => (
            <path key={i} d={`M${SUN[0]} ${SUN[1]}L${SUN[0] + Math.sin(((a - 4) * Math.PI) / 180) * 1400} ${SUN[1] - Math.cos(((a - 4) * Math.PI) / 180) * 1400}L${SUN[0] + Math.sin(((a + 4) * Math.PI) / 180) * 1400} ${SUN[1] - Math.cos(((a + 4) * Math.PI) / 180) * 1400}Z`}
              fill="url(#v-ray)" opacity={0.35 + 0.15 * Math.sin(t * 0.6 + i)} />
          ))}
          <circle cx={SUN[0]} cy={SUN[1]} r={62} fill={C.sun} />
          <circle cx={SUN[0]} cy={SUN[1]} r={84} fill="#FFE9B0" opacity={0.35} />
          {[[300, 170, 1.1, 'c1'], [760, 110, 0.8, 'c2'], [1620, 190, 1.25, 'c3'], [1980, 120, 0.9, 'c4']].map(([x, y, s, id]) => {
            const cx = (x as number) + drift(9 * (s as number));
            return (
              <g key={id as string} opacity={0.9}>
                <path d={blob(cx, y as number, 70 * (s as number), `${id}a`, 0.1, 8, 0.45)} fill="url(#v-cloud)" />
                <path d={blob(cx + 70 * (s as number), (y as number) + 8, 52 * (s as number), `${id}b`, 0.1, 8, 0.5)} fill="url(#v-cloud)" />
                <path d={blob(cx - 60 * (s as number), (y as number) + 12, 44 * (s as number), `${id}c`, 0.1, 8, 0.5)} fill="url(#v-cloud)" />
              </g>
            );
          })}
        </Layer>

        {/* Far snow peaks: drawn back to front, hazed at their feet */}
        <Layer depth={0.18}>
          <Mountain x={250} y={300} w={360} base={720} face={C.farPeak} shade={C.farShadow} snow />
          <Mountain x={720} y={250} w={420} base={720} face={C.farPeak} shade={C.farShadow} snow />
          <Mountain x={1520} y={230} w={430} base={720} face={C.farPeak} shade={C.farShadow} snow />
          <Mountain x={1960} y={320} w={380} base={720} face={C.farPeak} shade={C.farShadow} snow />
          <Mountain x={470} y={390} w={300} base={720} face={'#B58ADF'} shade={'#7D66C9'} />
          <Mountain x={1760} y={400} w={300} base={720} face={'#B58ADF'} shade={'#7D66C9'} />
          <rect x={-400} y={430} width={2720} height={330} fill="url(#v-haze)" />
        </Layer>

        {/* Mid ridges, cooler and closer, with mist between */}
        <Layer depth={0.34}>
          <path d={ridge(-400, 2320, 820, [[-250, 600], [120, 520], [430, 590], [760, 545], [1010, 615], [1300, 600], [1560, 530], [1900, 500], [2260, 580]])} fill="url(#v-mid)" />
          <rect x={-400} y={560} width={2720} height={280} fill="url(#v-haze)" opacity={0.75} />
          <ellipse cx={300 + drift(14)} cy={612} rx={520} ry={14} fill="url(#v-mist)" opacity={0.5} />
          <ellipse cx={1650 - drift(10)} cy={630} rx={460} ry={11} fill="url(#v-mist)" opacity={0.4} />
        </Layer>

        {/* Forested hills sloping into the valley */}
        <Layer depth={0.5}>
          <path d={ridge(-400, 1120, 900, [[-300, 600], [80, 585], [420, 630], [800, 665], [1100, 690]])} fill="url(#v-hillL)" />
          <path d={ridge(1180, 2320, 900, [[1180, 690], [1450, 655], [1800, 600], [2150, 615], [2300, 640]])} fill="url(#v-hillR)" />
          {Array.from({length: 34}).map((_, i) => {
            const left = i < 18;
            const k = left ? i / 17 : (i - 18) / 15;
            const x = left ? -260 + k * 1300 + random(`cf${i}`) * 40 : 1220 + k * 1080 + random(`cf${i}`) * 40;
            const base = left ? 605 + k * 95 : 700 - k * 85;
            const h = (left ? 95 - k * 40 : 55 + k * 40) * (0.8 + random(`ch${i}`) * 0.4);
            return <Conifer key={i} x={x} y={base + 28} h={h} />;
          })}
        </Layer>

        {/* Valley floor: rolling meadow bands, the river and its forested banks */}
        <Layer depth={0.72}>
          <path d={smooth([[-400, 760], [250, 720], [700, 690], [1110, 655], [1500, 690], [2000, 730], [2320, 770], [2320, 1250], [-400, 1250]], true, 0.6)} fill={'#2F9E86'} />
          <path d={smooth([[-400, 820], [300, 770], [800, 745], [1150, 700], [1600, 760], [2320, 820], [2320, 1250], [-400, 1250]], true, 0.6)} fill="url(#v-meadow)" />
          <path d={riverShape} fill={C.bank} transform="scale(1.05 1) translate(-55 0)" opacity={0.85} />
          <path d={riverShape} fill="url(#v-river)" />
          {/* Sun glints on the water: a few soft highlights that slide with the current */}
          {[0, 1, 2, 3, 4].map((i) => {
            const k = ((t * 0.07 + i / 5) % 1);
            const n = riverLine.length - 1;
            const j = Math.min(n - 1, Math.floor(k * n));
            const f = k * n - j;
            const x = riverLine[j][0] + (riverLine[j + 1][0] - riverLine[j][0]) * f;
            const y = riverLine[j][1] + (riverLine[j + 1][1] - riverLine[j][1]) * f;
            const w = 10 + k * 46;
            return <rect key={i} x={x - w / 2} y={y} width={w} height={3 + k * 4} rx={3} fill="#FFF8DC" opacity={0.5 * Math.sin(k * Math.PI)} />;
          })}
          {[[660, 760, 52], [760, 770, 44], [830, 790, 60], [1330, 735, 48], [1410, 760, 58], [1500, 772, 42], [1600, 790, 54]].map(([x, y, h], i) => (
            <Conifer key={i} x={x} y={y} h={h} />
          ))}
          {/* Cloud shadows drifting across the meadow (coloured, not grey) */}
          <ellipse cx={420 + drift(18)} cy={900} rx={380} ry={70} fill="url(#v-cshadow)" />
          <ellipse cx={1600 + drift(18)} cy={1000} rx={440} ry={80} fill="url(#v-cshadow)" />
          {/* A cabin by the river: warm window, smoke rising — the scene's point of interest */}
          <g>
            <ellipse cx={1325} cy={792} rx={52} ry={8} fill="#2B6E7E" opacity={0.45} />
            <rect x={1290} y={752} width={62} height={38} rx={3} fill="#F2B07A" />
            <rect x={1321} y={752} width={31} height={38} rx={3} fill="#C9796E" />
            <path d="M1282 756L1321 724L1360 756Z" fill="#7A3E6B" />
            <path d="M1321 724L1360 756L1321 756Z" fill="#5B2E5E" />
            <rect x={1300} y={764} width={13} height={12} rx={2} fill="#FFE08A" />
            <Glow x={1306} y={770} r={26} id="v-sunglow" opacity={0.55} />
            <rect x={1338} y={716} width={8} height={20} fill="#5B2E5E" />
            {[0, 1, 2].map((i) => {
              const k = (t * 0.25 + i / 3) % 1;
              return <circle key={i} cx={1342 + k * 26 + Math.sin(k * 6) * 4} cy={712 - k * 70} r={5 + k * 9} fill="#F6E0EC" opacity={0.55 * (1 - k)} />;
            })}
          </g>
          <Rock x={560} y={930} s={1.1} />
          <Rock x={1480} y={900} s={0.8} />
        </Layer>

        {/* Midground pines along the near bank */}
        <Layer depth={1}>
          {[[300, 1000, 210], [400, 1030, 160], [1640, 990, 190], [1730, 1020, 150]].map(([x, y, h], i) => (
            <g key={i}><ellipse cx={x} cy={y} rx={h * 0.28} ry={h * 0.05} fill="#1F6E7A" opacity={0.4} /><g transform={`rotate(${wave(t, 0.16, 0.5, i * 0.3)} ${x} ${y})`}><Conifer x={x} y={y} h={h} body={'#13506A'} lit={'#2C9488'} /></g></g>
          ))}
        </Layer>

        {/* Foreground: the viewer's rocky ledge (left) and a framing pine (right), rim-lit by the dawn */}
        <Layer depth={1.35}>
          <path d={smooth([[-300, 960], [0, 930], [250, 960], [430, 1010], [560, 1090], [600, 1200], [-300, 1200]], true, 0.7)} fill={C.fgRim} transform="translate(0 -8)" />
          <path d={smooth([[-300, 960], [0, 930], [250, 960], [430, 1010], [560, 1090], [600, 1200], [-300, 1200]], true, 0.7)} fill="url(#v-fg)" />
          {[[120, 960], [220, 975], [330, 1005]].map(([x, y], i) => (
            <path key={i} d={`M${x - 14} ${y}Q${x - 6} ${y - 34} ${x - 2} ${y - 46 - i * 6}Q${x + 2} ${y - 30} ${x + 4} ${y}Z`} fill="#1E6A7A" transform={`rotate(${wave(t, 0.3, 2.5, i * 0.2)} ${x} ${y})`} />
          ))}
          <g transform={`rotate(${wave(t, 0.14, 0.7)} 1840 1200)`}>
            <Conifer x={1840} y={1220} h={760} body={C.fg} lit={'#1E5476'} />
            <path d="M1840 460Q1875 600 2000 760L1980 770Q1870 640 1840 470Z" fill={C.fgRim} opacity={0.5} />
          </g>
        </Layer>
      </Camera>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 55% 45%, transparent 60%, rgba(20,16,60,0.35) 100%)'}} />
      <TextureOverlay src={`textures/grain-${Math.floor(t * 15) % 4}.png`} opacity={0.06} blend="overlay" />
    </AbsoluteFill>
  );
};
