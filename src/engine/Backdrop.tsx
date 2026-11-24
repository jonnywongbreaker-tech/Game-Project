import React from 'react';
import {random} from 'remotion';
import {GROUND} from './layout';
import {useTime, wave} from './time';

import type {BackdropName} from './vocab';

/** World-space background. Drawn wider/taller than the 1920x1080 world so camera moves never show an edge. */
export const Backdrop: React.FC<{name: BackdropName; tint?: string}> = ({name, tint}) => {
  switch (name) {
    case 'park':
      return <Park />;
    case 'room':
      return <Room />;
    case 'city':
      return <City />;
    case 'studio':
    default:
      return <Studio tint={tint ?? '#ffb36b'} />;
  }
};

const FULL = {x: -1400, y: -1000, width: 4720, height: 3200};

const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
    <ellipse cx={0} cy={0} rx={95} ry={45} />
    <ellipse cx={70} cy={-22} rx={70} ry={52} />
    <ellipse cx={-70} cy={-8} rx={62} ry={42} />
    <ellipse cx={10} cy={14} rx={120} ry={34} />
  </g>
);

const Tree: React.FC<{x: number; s?: number}> = ({x, s = 1}) => (
  <g transform={`translate(${x} ${GROUND - 20}) scale(${s})`}>
    <rect x={-18} y={-190} width={36} height={190} rx={8} fill="#8a5a3b" />
    <circle cx={0} cy={-250} r={100} fill="#4fa64a" />
    <circle cx={-70} cy={-190} r={70} fill="#5cb456" />
    <circle cx={75} cy={-195} r={72} fill="#469c42" />
  </g>
);

const Park: React.FC = () => {
  const {t} = useTime();
  const clouds: [number, number, number, number][] = [
    [-600, 200, 0.9, 9],
    [150, 150, 1, 12],
    [900, 100, 0.8, 7],
    [1450, 260, 0.7, 10],
    [2300, 160, 1, 8],
  ];
  return (
    <g>
      <defs>
        <linearGradient id="bd-park-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fc0f2" />
          <stop offset="0.55" stopColor="#d6f0ff" />
        </linearGradient>
      </defs>
      <rect {...FULL} fill="url(#bd-park-sky)" />
      <circle cx={1560} cy={170} r={130} fill="#fff4c2" opacity={0.45} />
      <circle cx={1560} cy={170} r={82} fill="#ffd45e" />
      {clouds.map(([x, y, s, speed], i) => (
        <Cloud key={i} x={((x + t * speed + 1600) % 4400) - 1600} y={y} s={s} />
      ))}
      <path d="M -1400 760 Q -800 560 -200 720 Q 300 600 800 730 Q 1300 580 1800 720 Q 2400 590 3400 740 L 3400 2200 L -1400 2200 Z" fill="#9bd685" />
      <path d="M -1400 840 Q -700 740 0 820 Q 600 730 1200 830 Q 1800 740 2400 830 Q 2900 760 3400 820 L 3400 2200 L -1400 2200 Z" fill="#7cc76a" />
      <Tree x={-380} s={1.1} />
      <Tree x={160} />
      <Tree x={1780} s={1.15} />
      <Tree x={2350} />
      <rect x={FULL.x} y={GROUND - 22} width={FULL.width} height={2200} fill="#5eb352" />
      <rect x={FULL.x} y={GROUND - 22} width={FULL.width} height={14} fill="#73c766" />
      {Array.from({length: 60}).map((_, i) => (
        <circle
          key={i}
          cx={-1200 + random(`f${i}`) * 4400}
          cy={GROUND + 30 + random(`fy${i}`) * 260}
          r={7}
          fill={['#ffffff', '#ffd84d', '#ff8fb1'][i % 3]}
        />
      ))}
    </g>
  );
};

const Room: React.FC = () => (
  <g>
    <rect {...FULL} fill="#f3e3c8" />
    {Array.from({length: 40}).map((_, i) => (
      <rect key={i} x={-1400 + i * 120} y={-1000} width={50} height={GROUND + 960} fill="#c9a56b" opacity={0.08} />
    ))}
    {/* window */}
    <g transform="translate(1300 200)">
      <rect x={-20} y={-20} width={400} height={380} rx={10} fill="#ffffff" />
      <rect x={0} y={0} width={360} height={340} fill="#9fd8ff" />
      <Cloud x={120} y={110} s={0.5} />
      <rect x={172} y={0} width={16} height={340} fill="#fff" />
      <rect x={0} y={162} width={360} height={16} fill="#fff" />
      <path d="M -60 -40 L 60 -40 Q 30 180 70 400 L -60 400 Z" fill="#e46a6a" />
      <path d="M 420 -40 L 300 -40 Q 330 180 290 400 L 420 400 Z" fill="#e46a6a" />
    </g>
    {/* picture */}
    <g transform="translate(260 260)">
      <rect width={260} height={190} rx={6} fill="#8a5a3b" />
      <rect x={16} y={16} width={228} height={158} fill="#bfe6dc" />
      <path d="M 16 174 L 100 70 L 160 140 L 200 100 L 244 174 Z" fill="#5aa889" />
      <circle cx={196} cy={56} r={18} fill="#ffd45e" />
    </g>
    {/* plant */}
    <g transform={`translate(-60 ${GROUND - 40})`}>
      <path d="M -50 -110 L 50 -110 L 38 0 L -38 0 Z" fill="#d9774a" />
      {[-40, -15, 10, 35].map((a, i) => (
        <ellipse key={i} cx={a * 1.2} cy={-170} rx={22} ry={70} fill="#4fa64a" transform={`rotate(${a} 0 -110)`} />
      ))}
    </g>
    {/* lamp */}
    <g transform={`translate(1980 ${GROUND - 40})`}>
      <rect x={-6} y={-420} width={12} height={420} fill="#4b4b5a" />
      <ellipse cx={0} cy={0} rx={60} ry={14} fill="#4b4b5a" />
      <path d="M -80 -400 L 80 -400 L 50 -520 L -50 -520 Z" fill="#ffe08a" />
    </g>
    <rect x={FULL.x} y={GROUND - 70} width={FULL.width} height={34} fill="#d9bf95" />
    <rect x={FULL.x} y={GROUND - 40} width={FULL.width} height={2200} fill="#b97f50" />
    {[40, 120, 230, 380].map((dy) => (
      <rect key={dy} x={FULL.x} y={GROUND + dy} width={FULL.width} height={5} fill="#9c673e" />
    ))}
  </g>
);

const City: React.FC = () => {
  const {t} = useTime();
  const buildings = Array.from({length: 24}).map((_, i) => {
    const w = 150 + random(`bw${i}`) * 70;
    const h = 260 + random(`bh${i}`) * 420;
    const x = -1300 + i * 190 + random(`bx${i}`) * 30;
    return {x, w, h, color: ['#2a2d5c', '#33366b', '#252852', '#3b3570'][i % 4], i};
  });
  return (
    <g>
      <defs>
        <linearGradient id="bd-city-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151840" />
          <stop offset="0.7" stopColor="#5a3d84" />
        </linearGradient>
      </defs>
      <rect {...FULL} fill="url(#bd-city-sky)" />
      {Array.from({length: 120}).map((_, i) => (
        <circle
          key={i}
          cx={-1300 + random(`sx${i}`) * 4500}
          cy={-900 + random(`sy${i}`) * 1400}
          r={1.5 + random(`sr${i}`) * 2.5}
          fill="#fff"
          opacity={0.5 + wave(t, 0.3 + random(`st${i}`) * 0.6, 0.4, random(`sp${i}`))}
        />
      ))}
      <circle cx={1520} cy={170} r={74} fill="#fdf3c4" />
      <circle cx={1545} cy={150} r={14} fill="#eadfa8" />
      <circle cx={1500} cy={195} r={9} fill="#eadfa8" />
      {buildings.map((b) => (
        <g key={b.i}>
          <rect x={b.x} y={GROUND - 30 - b.h} width={b.w} height={b.h + 30} fill={b.color} />
          {Array.from({length: Math.floor(b.h / 60)}).flatMap((_, r) =>
            Array.from({length: Math.floor(b.w / 45)}).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={b.x + 16 + c * 45}
                y={GROUND - b.h + r * 60}
                width={22}
                height={30}
                fill={random(`w${b.i}-${r}-${c}`) > 0.55 ? '#ffd96a' : '#1d2048'}
              />
            )),
          )}
        </g>
      ))}
      <rect x={FULL.x} y={GROUND - 30} width={FULL.width} height={44} fill="#7a7a8c" />
      <rect x={FULL.x} y={GROUND + 14} width={FULL.width} height={2200} fill="#3a3a4a" />
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-1300 + i * 400} y={GROUND + 140} width={180} height={14} fill="#e8e8a0" opacity={0.6} />
      ))}
      {[-200, 500, 1200, 1900, 2600].map((x) => (
        <g key={x}>
          <circle cx={x} cy={GROUND - 330} r={70} fill="#ffe9a0" opacity={0.15} />
          <rect x={x - 6} y={GROUND - 330} width={12} height={300} fill="#1b1b2b" />
          <circle cx={x} cy={GROUND - 335} r={18} fill="#ffe9a0" />
        </g>
      ))}
    </g>
  );
};

const Studio: React.FC<{tint: string}> = ({tint}) => {
  const {t} = useTime();
  return (
    <g>
      <defs>
        <radialGradient id="bd-studio" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="1" stopColor={tint} />
        </radialGradient>
      </defs>
      <rect x={FULL.x} y={FULL.y} width={FULL.width} height={FULL.height} fill={tint} />
      <rect x={-400} y={-300} width={2720} height={1700} fill="url(#bd-studio)" />
      {Array.from({length: 14}).map((_, i) => (
        <circle
          key={i}
          cx={-200 + random(`cx${i}`) * 2320 + wave(t, 0.05, 30, i * 0.1)}
          cy={-100 + random(`cy${i}`) * 900 + wave(t, 0.07, 25, i * 0.3)}
          r={20 + random(`cr${i}`) * 60}
          fill="none"
          stroke="#fff"
          strokeWidth={8}
          opacity={0.35}
        />
      ))}
      <ellipse cx={960} cy={GROUND + 10} rx={1400} ry={60} fill="#000" opacity={0.08} />
    </g>
  );
};
