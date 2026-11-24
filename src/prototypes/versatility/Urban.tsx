import React from 'react';
import {AbsoluteFill} from 'remotion';
import {building, car, street, streetLamp, tram, type BuildingStyle} from '../../kit/city';
import {walkLoop} from '../../kit/crowd';
import {planarShadow, tree} from '../../kit/primitives';
import {establishing, tracking} from '../../kit/shotGrammar';
import type {Light, Poly, V3} from '../../kit/space';
import {ID, SUN_DIR} from '../../themes/cge/identity';
import {randomPerson} from '../../themes/cge/Person';
import {personShadow, personSprite} from '../../themes/cge/personSprite';
import {SceneFrame, type SceneDef} from './SceneFrame';

const STYLE: BuildingStyle = {
  walls: ['#E8C9A0', '#D98E5C', '#F0E3CC', '#9CB8A8', '#E3B04B', '#86A8BE', '#C46A55'],
  trims: ['#F4EBDD', '#3F4A5C', '#E8DCC8', '#6B5B4E'],
  awnings: [ID.vermilion, ID.teal, '#F2B13E', '#5A6FB0'],
  glass: '#5D8BB0',
  glassLit: '#FFD58A',
};
const SHADOW = '#2C3166';
const LEAVES = {trunk: '#6B4A35', leaves: ['#5E9A55', '#4F8A4C', '#77A85C', '#8BB662']};

// ---- static set, generated once
const STATIC: Poly[] = (() => {
  const out: Poly[] = [];
  const shadows: Poly[] = [];
  for (const side of [1, -1] as const) {
    let x = -80;
    let i = 0;
    while (x < 90) {
      const w = 7 + ((i * 37 + (side > 0 ? 11 : 3)) % 8);
      const b = building(x + w / 2, side * 8, (side > 0 ? -1 : 1) as 1 | -1, w - 0.3, `b${side}${i}`, STYLE);
      out.push(...b.polys);
      shadows.push(...planarShadow(b.mass, SUN_DIR, 0, SHADOW, 0.32));
      x += w;
      i++;
    }
  }
  out.push(...street(-90, 100, 4, 8, {road: '#545A66', sidewalk: '#D9D0C1', curb: '#BDB3A3', marking: '#F2E6C4'}, [12]));
  out.push({pts: [[-300, -0.02, -300], [300, -0.02, -300], [300, -0.02, 300], [-300, -0.02, 300]], n: [0, 1, 0], m: {color: '#CFC6B6'}, bias: 210});
  for (let x = -60; x < 80; x += 13) {
    for (const z of [6.6, -6.6]) {
      const tr = tree([x, 0.15, z], 6 + ((x * 7) % 3), LEAVES, `tr${x}${z}`);
      out.push(...tr);
      shadows.push(...planarShadow(tr, SUN_DIR, 0.15, SHADOW, 0.3));
      out.push(...streetLamp([x + 6.5, 0.15, z * 1.12], '#3F4A5C', '#FFE3A6'));
    }
  }
  return [...out, ...shadows];
})();

const tramAt = (t: number): V3 => [-34 + t * 7.5, 0, -2];
const CARS = [
  {x0: 40, lane: 2, dir: -1 as const, speed: 9, color: '#2E7C7A'},
  {x0: 62, lane: 2, dir: -1 as const, speed: 9, color: '#E3B04B'},
  {x0: 18, lane: 2, dir: -1 as const, speed: 8.5, color: '#F0E8DC'},
  {x0: -58, lane: -2, dir: 1 as const, speed: 7.5, color: '#3D4E8C'},
];
const WALKERS = Array.from({length: 22}).map((_, i) => ({
  spec: randomPerson(`walker-${i}`),
  z: (i % 2 ? 1 : -1) * (4.9 + ((i * 3) % 5) * 0.55),
  dir: (i % 3 === 0 ? -1 : 1) as 1 | -1,
  speed: 1.1 + ((i * 7) % 5) * 0.1,
  offset: i * 6.3,
}));

const LIGHTS: Light[] = [
  {kind: 'hemisphere', sky: '#A9D2EA', ground: '#D3C1A0', intensity: 0.58},
  {kind: 'directional', dir: SUN_DIR, color: '#FFF0D8', intensity: 0.95},
];

const def: SceneDef = {
  duration: 5,
  shots: [
    establishing({label: 'The city', start: 0, end: 2.6, stage: {pos: [8, 5, 0], size: 52}, azimuth: -90, elevation: 21, fov: 52}),
    tracking({label: 'On the move', start: 2.6, end: 5, follow: (t) => [tramAt(t)[0] + 5, 1.6, -2], size: 8, side: -1, elevation: 12, fov: 52, mode: 'chase', distance: 16}),
  ],
  build: (t) => {
    const polys: Poly[] = [...STATIC];
    const tp = tramAt(t);
    const tr = tram(tp, ID.vermilion, '#F3E9D8', '#3A5068');
    polys.push(...tr, ...planarShadow(tr, SUN_DIR, 0, SHADOW, 0.32));
    for (const [i, c] of CARS.entries()) {
      const x = c.x0 + c.dir * c.speed * t;
      const p = car([x, 0, c.lane], c.dir, c.color, '#36495E', `car${i}`);
      polys.push(...p, ...planarShadow(p, SUN_DIR, 0, SHADOW, 0.32));
    }
    const sprites = WALKERS.map((w) => {
      const a: V3 = [w.dir > 0 ? -45 : 55, 0.15, w.z];
      const b: V3 = [w.dir > 0 ? 55 : -45, 0.15, w.z];
      const wk = walkLoop(a, b, w.speed, t, w.offset);
      polys.push(personShadow({pos: wk.pos, spec: w.spec}, SUN_DIR, SHADOW));
      polys[polys.length - 1].opacity = 0.32;
      return personSprite({spec: w.spec, pos: wk.pos, heading: wk.heading, t, walked: wk.distance, walking: true, seed: w.offset}, LIGHTS);
    });
    return {polys, sprites, lights: LIGHTS};
  },
  atmosphere: {low: '#C8DCE6', high: '#DDEAF1', height: 60, density: 0.0045},
  background: <AbsoluteFill style={{background: 'radial-gradient(ellipse at 18% 8%, #FFF4DC 0%, rgba(255,244,220,0) 28%), linear-gradient(180deg, #74B1DA 0%, #A9D0E6 48%, #EAE3D2 100%)'}} />,
  title: {kicker: 'Versatility · Urban', lines: ['Cities move', 'in rhythm.'], start: 0.4, end: 2.5, top: 150},
};

export const Urban: React.FC<{production?: boolean}> = ({production}) => <SceneFrame def={def} production={production} />;
