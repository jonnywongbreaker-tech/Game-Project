import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../../engine/fonts';
import {tween} from '../../engine/time';
import {crankSlider, cutawayHousing, gear, gearRadius, halfSleeve, meshedAngle} from '../../kit/mechanics';
import {box, cylinder, extrude, circle, planarShadow} from '../../kit/primitives';
import {cutaway, objectReveal} from '../../kit/shotGrammar';
import {type Light, makeView, type Material, type Poly, projectPoint, type V3} from '../../kit/space';
import {ID} from '../../themes/cge/identity';
import {INK} from '../../themes/cge/type';
import {SceneFrame, type SceneDef} from './SceneFrame';

const BRASS: Material = {color: '#D9A441', kind: 'metal'};
const STEEL: Material = {color: '#A8B6C0', kind: 'metal'};
const DARK: Material = {color: '#3A4150', kind: 'metal'};
const SECTION: Material = {color: ID.vermilion};
const PITCH = 0.18;
const Z = 0.15;
const G1 = {center: [-0.78, 2.15, Z] as V3, teeth: 24, pitch: PITCH, thickness: 0.16, m: BRASS, hub: DARK};
const G2 = {center: [-0.78 + gearRadius({teeth: 24, pitch: PITCH}) + gearRadius({teeth: 13, pitch: PITCH}), 2.15, Z] as V3, teeth: 13, pitch: PITCH, thickness: 0.16, m: STEEL, hub: DARK};
const r2 = gearRadius(G2);
const r3 = gearRadius({teeth: 18, pitch: PITCH});
const G3 = {center: [G2.center[0] + (r2 + r3) * 0.62, 2.15 - (r2 + r3) * 0.785, Z] as V3, teeth: 18, pitch: PITCH, thickness: 0.16, m: BRASS, hub: DARK};
const CRANK = 0.26;
const ROD = 0.95;

const STATIC: Poly[] = (() => {
  const housing = cutawayHousing([0.1, 1.0, 0], [3.6, 2.5, 1.5], 0.1, {color: ID.teal}, {color: '#1E3A40'}, SECTION);
  const plinth = box([0.1, 0, 0], [4.6, 1.0, 2.4], {top: {color: '#E9DFCF'}, side: {color: '#D8CBB6'}, front: {color: '#D8CBB6'}, back: {color: '#D8CBB6'}}, {bias: 4});
  const motor = [...box([-2.55, 1.0, 0], [1.1, 1.0, 0.9], {color: '#3D4E8C', kind: 'metal'}), ...cylinder([-2.55, 2.0, 0], 0.18, 0.12, 8, {color: DARK.color})];
  const shaft = extrude(circle(0.06, 8), 2.2, {origin: [-1.6, 2.15 - 0.0, Z], u: [0, 0, 1], v: [0, 1, 0]}, {cap: STEEL, side: STEEL});
  const sleeve = halfSleeve([G3.center[0], 2.45, -0.05], 0.22, 1.0, 8, {color: '#5F7681', kind: 'metal'}, SECTION);
  const floor: Poly = {pts: [[-30, 0, -30], [30, 0, -30], [30, 0, 30], [-30, 0, 30]], n: [0, 1, 0], m: {color: '#CDBFA9'}, bias: 210};
  const wall: Poly = {pts: [[-30, 0, -6], [30, 0, -6], [30, 20, -6], [-30, 20, -6]], n: [0, 0, 1], m: {color: '#2C4552'}, bias: 205};
  const panels: Poly[] = Array.from({length: 9}).map((_, i) => ({pts: [[-12 + i * 3, 1, -5.98], [-10.6 + i * 3, 1, -5.98], [-10.6 + i * 3, 9, -5.98], [-12 + i * 3, 9, -5.98]] as V3[], n: [0, 0, 1] as V3, m: {color: i % 3 === 1 ? '#335260' : '#294050'}, bias: 204}));
  const shadow = planarShadow([...plinth, ...housing, ...motor], [0.35, -1, -0.45], 0, '#1E2340', 0.35);
  return [floor, wall, ...panels, ...shadow, ...plinth, ...housing, ...motor, ...shaft, ...sleeve];
})();

const LIGHTS: Light[] = [
  {kind: 'hemisphere', sky: '#B9C9D6', ground: '#B59C7E', intensity: 0.6},
  {kind: 'directional', dir: [0.45, -0.75, -0.5], color: '#FFF0DA', intensity: 0.95},
];

const angleAt = (t: number) => t * 1.6;

function mechanism(t: number): Poly[] {
  const a1 = angleAt(t);
  const a2 = meshedAngle(G1.teeth, a1, G2.teeth, 1, Math.PI / G2.teeth);
  const a3 = meshedAngle(G1.teeth, a1, G3.teeth, 2, 0.1);
  const cs = crankSlider(-a3, CRANK, ROD);
  const pin: V3 = [G3.center[0] + cs.pin[0], G3.center[1] + cs.pin[1], Z + 0.16];
  const pistonY = G3.center[1] + cs.piston;
  const piston = cylinder([G3.center[0], pistonY, -0.05], 0.19, 0.32, 10, {top: STEEL, side: STEEL});
  const rodDir = [G3.center[0] - pin[0], pistonY - pin[1]];
  const rodLen = Math.hypot(rodDir[0], rodDir[1]);
  const rodAng = Math.atan2(rodDir[1], rodDir[0]);
  const rod = extrude([[0, -0.045], [rodLen, -0.04], [rodLen, 0.04], [0, 0.045]], 0.06, {origin: pin, u: [Math.cos(rodAng), Math.sin(rodAng), 0], v: [-Math.sin(rodAng), Math.cos(rodAng), 0]}, {cap: DARK, side: DARK});
  return [...gear(G1, a1), ...gear(G2, a2), ...gear(G3, a3), ...piston, ...rod.map((p) => ({...p, bias: -0.2})), ...cylinder([pin[0], pin[1] - 0.05, pin[2]], 0.05, 0.1, 6, STEEL)];
}

const CALLOUTS: {label: string; at: V3; dx: number; dy: number}[] = [
  {label: 'Drive gear · 24 teeth', at: [G1.center[0] - 0.3, G1.center[1] + 0.45, Z + 0.1], dx: -170, dy: -110},
  {label: 'Idler · 13 teeth', at: [G2.center[0], G2.center[1] + 0.3, Z + 0.1], dx: 40, dy: -150},
  {label: 'Crank', at: [G3.center[0] - 0.2, G3.center[1] - 0.2, Z + 0.1], dx: -230, dy: 40},
  {label: 'Piston', at: [G3.center[0], 2.9, 0.1], dx: 150, dy: -90},
];

const def: SceneDef = {
  duration: 5,
  shots: [
    objectReveal({label: 'The machine', start: 0, end: 3.0, subject: {pos: [0.1, 2.15, 0], size: 4.6}, startAzimuth: -42, orbit: 46, elevation: 14, fov: 40}),
    cutaway({label: 'Inside', start: 3.0, end: 5, subject: {pos: [-0.15, 2.1, 0.2], size: 2.2}, normal: [0.15, 0.1, 1], fov: 34}),
  ],
  build: (t) => ({polys: [...STATIC, ...mechanism(t)], sprites: [], lights: LIGHTS}),
  atmosphere: {low: '#C7C0B3', high: '#C7C0B3', height: 30, density: 0.002},
  background: <AbsoluteFill style={{background: 'linear-gradient(180deg, #2C4552 0%, #355767 100%)'}} />,
  title: {kicker: 'Versatility · Mechanical', lines: ['Motion,', 'translated.'], start: 0.4, end: 2.8, top: 150},
  overlay: (t, {cam}) => {
    const k = tween(t, [3.3, 3.9], [0, 1]);
    if (k <= 0) return null;
    const view = makeView(cam, 1920, 1080);
    return (
      <AbsoluteFill>
        <svg width={1920} height={1080}>
          {CALLOUTS.map((c, i) => {
            const p = projectPoint(view, c.at);
            if (!p) return null;
            const kk = tween(t, [3.3 + i * 0.15, 3.8 + i * 0.15], [0, 1]);
            const ex = p.x + c.dx * kk;
            const ey = p.y + c.dy * kk;
            return (
              <g key={i} opacity={kk}>
                <circle cx={p.x} cy={p.y} r={7} fill={INK} stroke={ID.ink} strokeWidth={3} />
                <path d={`M ${p.x} ${p.y} L ${ex} ${ey} L ${ex + (c.dx > 0 ? 30 : -30)} ${ey}`} stroke={INK} strokeWidth={2.5} fill="none" />
                <text x={ex + (c.dx > 0 ? 40 : -40)} y={ey + 8} textAnchor={c.dx > 0 ? 'start' : 'end'} fontFamily={FONT} fontWeight={700} fontSize={26} fill={INK} style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  },
};

export const Machine: React.FC = () => <SceneFrame def={def} />;
