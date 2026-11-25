/**
 * Reproduction test 2 — Café interior at golden hour (docs/ART_DIRECTION.md).
 * Tests: character design, emotional warmth, composition, an everyday environment.
 * One purposeful action (a slow sip); ambient motion limited to steam, a passing
 * tram outside and dust in the light shaft.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {Camera, Layer} from '../../engine/Camera';
import {TextureOverlay} from '../../engine/Texture';
import {ease, keyframes, tween, useTime, wave} from '../../engine/time';
import {blob, Glow, Linear, type P, Radial, smooth} from './look';

// Colour script: "golden hour café" — warm coral interior, cool turquoise city,
// violet and burnt-orange shadows, mustard and indigo on the figure.
const C = {
  wall: '#F28A69', wallLit: '#F9B783', wallShade: '#B65A78', floor: '#B4506A', floorLit: '#D9706E', board: '#7E3A62',
  frame: '#3A2C6C', frameLit: '#5B48A0', sill: '#F6CDA0',
  sky: ['#6FD8D6', '#B5F0DC', '#FFE4B0'], cityFar: '#7CC3D6', cityMid: '#4E9CC4', cityNear: '#3A7AB8', tree: '#3FB08F',
  wood: '#B9643F', woodShade: '#7D3A4C', table: '#F3E3D0', tableShade: '#C99AA0',
  sweater: '#F5B841', sweaterShade: '#D96D3D', trousers: '#2E2A6E', trousersLit: '#4A44A6', shoe: '#3A1E35',
  skin: '#F0AA86', skinShade: '#C9727C', hair: '#2A1D4F', hairLit: '#5D3F96', blush: '#F07F7F',
  mug: '#2BB5A6', mugShade: '#1C7F86', steam: '#FFF3E6',
  plant: '#2E9C7C', plantShade: '#1F6A6E', lamp: '#3A2C6C', light: '#FFE6A0',
  fg: '#16385A', fgRim: '#FF9C6E',
};

const WIN = {x0: 150, x1: 1080, y0: 150, y1: 720, r: 465};
const windowPath = `M${WIN.x0} ${WIN.y1}L${WIN.x0} ${WIN.y0 + WIN.r * 0.55}A${(WIN.x1 - WIN.x0) / 2} ${WIN.r * 0.55} 0 0 1 ${WIN.x1} ${WIN.y0 + WIN.r * 0.55}L${WIN.x1} ${WIN.y1}Z`;

const Defs: React.FC = () => (
  <>
    <Linear id="c-sky" stops={[[0, C.sky[0]], [0.6, C.sky[1]], [1, C.sky[2]]]} x1={0} y1={150} x2={0} y2={720} user />
    <Linear id="c-wall" stops={[[0, C.wall], [0.55, C.wallLit], [1, C.wall]]} x1={0} y1={0} x2={0} y2={1} />
    <Linear id="c-wallSide" stops={[[0, C.wall], [1, C.wallShade]]} x1={0} y1={0} x2={1} y2={0} />
    <Linear id="c-floor" stops={[[0, C.floorLit], [1, C.floor]]} />
    <Linear id="c-shaft" stops={[[0, C.light, 0.55], [1, C.light, 0]]} x1={0} y1={0} x2={1} y2={1} />
    <Linear id="c-haze" stops={[[0, '#FFFFFF', 0], [1, '#FFE9C8', 0.55]]} />
    <Radial id="c-lamp" stops={[[0, '#FFF3C4', 0.95], [0.3, '#FFD27A', 0.45], [1, '#FFB070', 0]]} />
    <Radial id="c-sun" stops={[[0, '#FFF6D8', 0.7], [1, '#FFE3A0', 0]]} />
    <Linear id="c-sweater" stops={[[0, C.sweater], [1, C.sweaterShade]]} x1={0} y1={0} x2={1} y2={0.3} />
    <Linear id="c-mug" stops={[[0, C.mug], [1, C.mugShade]]} x1={0} y1={0} x2={1} y2={0} />
    <Linear id="c-fg" stops={[[0, '#1F5B76'], [1, C.fg]]} />
    <clipPath id="c-window"><path d={windowPath} /></clipPath>
  </>
);

/** Rows of simple building silhouettes with lit windows, for the view outside. */
const Skyline: React.FC<{y: number; color: string; seed: string; count: number; w: number; h: number; x0?: number}> = ({y, color, seed, count, w, h, x0 = -200}) => (
  <g>
    {Array.from({length: count}).map((_, i) => {
      const bw = w * (0.7 + random(`${seed}w${i}`) * 0.6);
      const bh = h * (0.5 + random(`${seed}h${i}`) * 0.8);
      const x = x0 + i * w * 1.05;
      return (
        <g key={i}>
          <rect x={x} y={y - bh} width={bw} height={bh + 400} rx={6} fill={color} />
          {random(`${seed}r${i}`) > 0.6 && <rect x={x + bw * 0.4} y={y - bh - 30} width={6} height={30} fill={color} />}
          {Array.from({length: 6}).map((_, k) => random(`${seed}l${i}-${k}`) > 0.7 && (
            <rect key={k} x={x + 12 + (k % 2) * (bw / 2 - 6)} y={y - bh + 20 + Math.floor(k / 2) * 34} width={10} height={14} rx={2} fill="#FFE9A6" opacity={0.8} />
          ))}
        </g>
      );
    })}
  </g>
);

const Tram: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x} y={y - 70} width={300} height={62} rx={16} fill="#F2665A" />
    <rect x={x} y={y - 70} width={300} height={16} rx={8} fill="#FFD27A" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={x + 18 + i * 56} y={y - 50} width={42} height={24} rx={5} fill="#8FE3E6" />)}
    <path d={`M${x + 140} ${y - 70}L${x + 160} ${y - 98}L${x + 180} ${y - 70}`} stroke="#3A2C6C" strokeWidth={3} fill="none" />
  </g>
);

const Leaves: React.FC<{pts: P[]; seed: string; color: string}> = ({pts, seed, color}) => (
  <g>{pts.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={13} ry={8} fill={color} transform={`rotate(${(random(`${seed}${i}`) - 0.5) * 120} ${x} ${y})`} />)}</g>
);

export const Cafe: React.FC = () => {
  const {t} = useTime();
  // A slow push-in toward the figure.
  const zoom = tween(t, [0, 5], [1, 1.06], ease.inOut);
  const focusX = tween(t, [0, 5], [900, 1010], ease.inOut);

  // The one action: a slow sip (raise, hold, lower).
  const sip = keyframes(t, [[0, 0], [1.3, 0], [2.3, 1], [3.3, 1], [4.3, 0], [5, 0]]);
  const breathe = wave(t, 0.25, 1);
  const tilt = sip * 5;

  // Figure joints (world coordinates).
  const hip: P = [1445, 742];
  const shoulder: P = [1452, 562 + breathe];
  const hand: P = [1372 + sip * 22, 640 - sip * 80];
  const elbow: P = [1450 - sip * 4, 668 - sip * 40];
  const farHand: P = [1384 + sip * 18, 650 - sip * 76];
  const head: P = [1432, 476 + breathe];
  const cup: P = [hand[0] - 12, hand[1] - 30];

  const arm = (a: P, b: P, c: P) => `M${a[0]} ${a[1]}Q${b[0]} ${b[1]} ${c[0]} ${c[1]}`;

  return (
    <AbsoluteFill style={{background: C.wall}}>
      <Camera layered focusX={focusX} zoom={zoom} defs={<Defs />}>
        {/* Outside: sky, sun, city and a passing tram, seen through the window */}
        <Layer depth={0.2}>
          <g>
            <rect x={-400} y={0} width={2400} height={900} fill="url(#c-sky)" />
            <Glow x={300} y={560} r={420} id="c-sun" />
            <Skyline y={560} color={C.cityFar} seed="far" count={20} w={120} h={170} />
            <rect x={-400} y={380} width={2400} height={220} fill="url(#c-haze)" />
          </g>
        </Layer>
        <Layer depth={0.45}>
          <g>
            <Skyline y={640} color={C.cityMid} seed="mid" count={14} w={150} h={210} x0={-150} />
            {[60, 330, 820, 1010].map((x, i) => <path key={i} d={blob(x, 610, 46, `ot${i}`, 0.15, 9, 0.85)} fill={C.tree} />)}
            <rect x={-400} y={655} width={2400} height={90} fill={C.cityNear} />
            <Tram x={-380 + t * 230} y={700} />
          </g>
        </Layer>

        {/* The room */}
        <Layer depth={1}>
          {/* Back wall with the window cut out, and a darker side wall on the right */}
          <path d={`M-300 -100H2300V900H-300Z${windowPath}`} fillRule="evenodd" fill="url(#c-wall)" />
          <path d="M1600 -100L2300 -100L2300 900L1600 860Z" fill="url(#c-wallSide)" opacity={0.85} />
          <path d="M-300 860L2300 860L2300 1300L-300 1300Z" fill="url(#c-floor)" />
          <rect x={-300} y={846} width={2600} height={16} fill={C.board} />
          {[-100, 200, 500, 800, 1100, 1400, 1700, 2000].map((x, i) => <path key={i} d={`M${x} 862L${x - 160} 1300`} stroke={C.board} strokeWidth={3} opacity={0.35} />)}

          {/* Window frame, mullions and sill */}
          <path d={windowPath} fill="none" stroke={C.frame} strokeWidth={26} />
          <path d={windowPath} fill="none" stroke={C.frameLit} strokeWidth={6} transform="translate(-6 -4)" opacity={0.7} />
          <path d={`M${(WIN.x0 + WIN.x1) / 2} ${WIN.y0 + 2}V${WIN.y1}M${WIN.x0} 470H${WIN.x1}`} stroke={C.frame} strokeWidth={14} />
          <rect x={WIN.x0 - 40} y={WIN.y1 - 4} width={WIN.x1 - WIN.x0 + 80} height={24} rx={8} fill={C.sill} />

          {/* Sunlight through the window: warm shafts on the floor and table, a little dust */}
          <path d={`M${WIN.x0 + 40} ${WIN.y1 + 20}L${WIN.x1} ${WIN.y1 + 20}L1380 1300L520 1300Z`} fill="url(#c-shaft)" opacity={0.55} />
          {Array.from({length: 9}).map((_, i) => {
            const x = 520 + random(`dx${i}`) * 700 + wave(t, 0.1, 18, i * 0.3) + t * 6;
            const y = 760 + random(`dy${i}`) * 280 - t * 8;
            return <circle key={i} cx={x} cy={y} r={2 + random(`dr${i}`) * 2.5} fill="#FFF4D0" opacity={0.35 + 0.3 * Math.sin(t * 0.8 + i)} />;
          })}

          {/* Pendant lamp */}
          <path d="M1210 -100V250" stroke={C.lamp} strokeWidth={4} />
          <Glow x={1210} y={300} r={210} id="c-lamp" opacity={0.65} />
          <path d="M1150 300Q1150 240 1210 240Q1270 240 1270 300Z" fill={C.lamp} />
          <ellipse cx={1210} cy={302} rx={36} ry={8} fill="#FFE8A8" />

          {/* Shelf with jars and a trailing plant on the side wall */}
          <rect x={1660} y={430} width={300} height={16} rx={4} fill={C.woodShade} />
          {[[1690, '#F2665A', 70], [1745, '#2BB5A6', 54], [1795, '#F5B841', 84], [1855, '#7A5CC8', 60]].map(([x, c, h], i) => (
            <rect key={i} x={x as number} y={430 - (h as number)} width={42} height={h as number} rx={12} fill={c as string} />
          ))}
          <path d={blob(1920, 400, 50, 'pot', 0.1, 8, 0.7)} fill={C.plant} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path d={smooth([[1900 + i * 14, 410], [1890 + i * 10 + wave(t, 0.2, 4, i), 480], [1905 + i * 6, 560 - i * 20]], false)} stroke={C.plantShade} strokeWidth={4} fill="none" strokeLinecap="round" />
              <Leaves seed={`sp${i}`} color={i % 2 ? C.plant : '#3FB58C'} pts={[0.3, 0.6, 0.9].map((k) => [1895 + i * 10 + wave(t, 0.2, 4 * k, i), 410 + k * (150 - i * 20)] as P)} />
            </g>
          ))}

          {/* Hanging plant at the window */}
          <path d="M240 -100V120" stroke={C.lamp} strokeWidth={3} />
          <path d="M200 120Q240 165 280 120Z" fill="#E86F5A" />
          {[-1, 1, 0].map((s, i) => (
            <g key={i}>
              <path d={smooth([[240 + s * 20, 135], [240 + s * 40 + wave(t, 0.18, 5, i), 210], [240 + s * 28, 280 + i * 30]], false)} stroke={C.plantShade} strokeWidth={5} fill="none" strokeLinecap="round" />
              <Leaves seed={`hp${i}`} color={i % 2 ? C.plant : '#3FB58C'} pts={[0.15, 0.35, 0.55, 0.75, 0.95].map((k) => [240 + s * (20 + 20 * Math.sin(k * 3)) + wave(t, 0.18, 5 * k, i), 135 + k * (145 + i * 30)] as P)} />
            </g>
          ))}

          <g transform="translate(1330 866) scale(1.45) translate(-1330 -866)">
          {/* Table */}
          <ellipse cx={1210} cy={866} rx={110} ry={14} fill={C.board} opacity={0.45} />
          <rect x={1200} y={716} width={20} height={146} fill={C.woodShade} />
          <path d="M1150 862Q1210 836 1270 862Z" fill={C.woodShade} />
          <ellipse cx={1210} cy={716} rx={150} ry={26} fill={C.tableShade} />
          <ellipse cx={1210} cy={708} rx={150} ry={24} fill={C.table} />
          <ellipse cx={1150} cy={700} rx={34} ry={8} fill="#FFFFFF" opacity={0.85} />

          {/* Chair (behind the figure) */}
          <ellipse cx={1460} cy={866} rx={90} ry={12} fill={C.board} opacity={0.5} />
          <path d="M1505 750L1520 560" stroke={C.woodShade} strokeWidth={16} strokeLinecap="round" />
          <path d="M1400 760L1395 860M1500 760L1505 860" stroke={C.woodShade} strokeWidth={12} strokeLinecap="round" />
          <rect x={1385} y={738} width={135} height={22} rx={10} fill={C.wood} />

          {/* Figure: far leg, near leg, shoes */}
          <path d="M1440 744Q1360 742 1338 728Q1350 800 1362 884" stroke="#221E58" strokeWidth={40} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1446 748Q1370 750 1318 740Q1318 812 1330 892" stroke={C.trousers} strokeWidth={44} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1446 726Q1380 724 1322 718" stroke={C.trousersLit} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8} />
          <path d="M1306 900Q1308 884 1330 884L1346 887L1346 902Z" fill={C.shoe} />
          <path d="M1342 894Q1344 880 1364 880L1378 883L1378 897Z" fill={C.shoe} opacity={0.85} />

          {/* Far arm (behind the torso) */}
          <path d={arm([1418, 572], [1398, 660], farHand)} stroke={C.sweaterShade} strokeWidth={30} fill="none" strokeLinecap="round" />

          {/* Torso with breathing, coloured shadow on the side away from the window */}
          <g transform={`translate(0 ${breathe * 0.6})`}>
            <path d={`M1404 748Q1392 660 1400 600Q1408 556 1440 548Q1480 546 1490 580Q1500 660 1488 750Z`} fill="url(#c-sweater)" />
            <path d="M1404 736Q1446 746 1488 738L1488 752Q1446 760 1404 750Z" fill={C.sweaterShade} />
            <path d="M1420 552Q1440 560 1462 551" stroke={C.sweaterShade} strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>

          {/* Head: neck, face, glasses, hair — tilts gently into the sip */}
          <g transform={`rotate(${-tilt} ${head[0] + 10} ${head[1] + 50})`}>
            <path d={`M1426 ${head[1] + 30}L1428 ${head[1] + 78}L1452 ${head[1] + 78}L1450 ${head[1] + 30}Z`} fill={C.skinShade} />
            <path d={smooth([[head[0] - 38, head[1] - 6], [head[0] - 30, head[1] - 40], [head[0] + 8, head[1] - 50], [head[0] + 40, head[1] - 20], [head[0] + 36, head[1] + 30], [head[0] + 4, head[1] + 52], [head[0] - 28, head[1] + 40], [head[0] - 40, head[1] + 14]], true)} fill={C.skin} />
            <path d={smooth([[head[0] + 10, head[1] - 48], [head[0] + 40, head[1] - 20], [head[0] + 36, head[1] + 30], [head[0] + 6, head[1] + 52], [head[0] + 18, head[1] + 10]], true)} fill={C.skinShade} opacity={0.55} />
            {/* nose, mouth, blush */}
            <path d={`M${head[0] - 38} ${head[1] - 2}Q${head[0] - 50} ${head[1] + 12} ${head[0] - 38} ${head[1] + 16}`} fill={C.skin} stroke={C.skinShade} strokeWidth={2.5} />
            <path d={`M${head[0] - 30} ${head[1] + 30}Q${head[0] - 22} ${head[1] + 35} ${head[0] - 14} ${head[1] + 30}`} stroke="#8E3B55" strokeWidth={3} fill="none" strokeLinecap="round" />
            <ellipse cx={head[0] - 10} cy={head[1] + 18} rx={12} ry={7} fill={C.blush} opacity={0.45} />
            {/* eye: open, closing during the sip */}
            {sip > 0.6
              ? <path d={`M${head[0] - 28} ${head[1] - 4}Q${head[0] - 21} ${head[1] + 1} ${head[0] - 14} ${head[1] - 4}`} stroke="#2A1D4F" strokeWidth={3} fill="none" strokeLinecap="round" />
              : <ellipse cx={head[0] - 21} cy={head[1] - 5} rx={4} ry={5.5} fill="#2A1D4F" />}
            <path d={`M${head[0] - 32} ${head[1] - 18}Q${head[0] - 22} ${head[1] - 23} ${head[0] - 12} ${head[1] - 18}`} stroke={C.hair} strokeWidth={4} fill="none" strokeLinecap="round" />
            {/* glasses */}
            <circle cx={head[0] - 21} cy={head[1] - 4} r={14} fill="#FFFFFF" fillOpacity={0.12} stroke="#3A2C6C" strokeWidth={3} />
            <path d={`M${head[0] - 7} ${head[1] - 6}L${head[0] + 14} ${head[1] - 10}`} stroke="#3A2C6C" strokeWidth={3} />
            {/* hair: short and wavy, lit along the top by the window */}
            <path d={smooth([[head[0] - 34, head[1] - 22], [head[0] - 30, head[1] - 52], [head[0] + 4, head[1] - 64], [head[0] + 42, head[1] - 44], [head[0] + 48, head[1] - 4], [head[0] + 38, head[1] + 30], [head[0] + 22, head[1] + 12], [head[0] + 14, head[1] - 22], [head[0] - 10, head[1] - 34]], true)} fill={C.hair} />
            <path d={smooth([[head[0] - 28, head[1] - 50], [head[0] + 2, head[1] - 62], [head[0] + 24, head[1] - 58], [head[0] + 2, head[1] - 52]], true)} fill={C.hairLit} />
            <ellipse cx={head[0] + 22} cy={head[1] + 4} rx={7} ry={11} fill={C.skinShade} />
          </g>

          {/* Steam from the mug */}
          {[0, 1, 2].map((i) => {
            const k = (t * 0.32 + i / 3) % 1;
            const x = cup[0] + 10 + Math.sin(k * 7 + i) * 9;
            return <path key={i} d={smooth([[x - 4, cup[1] - 8 - k * 20], [x + 6, cup[1] - 30 - k * 50], [x - 4, cup[1] - 52 - k * 80]], false)} stroke={C.steam} strokeWidth={6 - k * 3} fill="none" strokeLinecap="round" opacity={0.6 * Math.sin(k * Math.PI)} />;
          })}

          {/* Mug, then the near arm wrapping it */}
          <rect x={cup[0] - 22} y={cup[1] - 4} width={44} height={50} rx={9} fill="url(#c-mug)" />
          <ellipse cx={cup[0]} cy={cup[1] - 4} rx={22} ry={6} fill="#5E3A2E" />
          <path d={arm(shoulder, elbow, hand)} stroke={C.sweater} strokeWidth={34} fill="none" strokeLinecap="round" />
          <path d={arm([shoulder[0] + 10, shoulder[1] + 6], [elbow[0] + 12, elbow[1]], [hand[0] + 16, hand[1] + 10])} stroke={C.sweaterShade} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6} />
          <ellipse cx={hand[0] - 4} cy={hand[1] + 2} rx={17} ry={14} fill={C.skin} />
          <ellipse cx={farHand[0] - 26} cy={farHand[1] - 4} rx={13} ry={12} fill={C.skinShade} />
          </g>
        </Layer>

        {/* Foreground: dark leaves of a large plant, rim-lit by the window */}
        <Layer depth={1.3}>
          {[[-10, 960, 230, 'l1'], [190, 1100, 190, 'l2'], [-70, 780, 170, 'l3']].map(([x, y, r, id], i) => (
            <g key={id as string} transform={`rotate(${wave(t, 0.14, 1.2, i * 0.3)} ${x} ${(y as number) + (r as number)})`}>
              <path d={blob((x as number) + 10, (y as number) - 8, (r as number) * 1.02, id as string, 0.1, 9, 0.62)} fill={C.fgRim} opacity={0.85} />
              <path d={blob(x as number, y as number, r as number, id as string, 0.1, 9, 0.62)} fill="url(#c-fg)" />
            </g>
          ))}
        </Layer>
      </Camera>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(60,20,60,0.32) 100%)'}} />
      <TextureOverlay src={`textures/grain-${Math.floor(t * 15) % 4}.png`} opacity={0.06} blend="overlay" />
    </AbsoluteFill>
  );
};
