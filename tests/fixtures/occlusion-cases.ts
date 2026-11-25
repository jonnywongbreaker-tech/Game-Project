/**
 * Representative occlusion cases (Phase 4.1, A1). Each case is a list of frames:
 * a camera plus world polygons and sprite footprints, with an object id per polygon.
 * Used by tests/depth.test.ts and scripts/occlusion-study.ts.
 */
import {car, tram} from '../../src/kit/city';
import {cutawayHousing, gear, gearRadius} from '../../src/kit/mechanics';
import {box, transform} from '../../src/kit/primitives';
import {makeView, type Camera3, type Poly, type V3, type View} from '../../src/kit/space';
import type {SpriteFootprint} from '../../src/kit/depth';
import {def as urban} from '../../src/prototypes/versatility/Urban';
import {def as machine} from '../../src/prototypes/versatility/Machine';
import {cameraAt, shotAt} from '../../src/kit/shots';

export interface Frame {
  view: View;
  polys: Poly[];
  sprites: SpriteFootprint[];
  objects: (string | undefined)[];
}
export interface Case {
  name: string;
  frames: Frame[];
}

const W = 1920, H = 1080;
const person = (pos: V3, object: string): SpriteFootprint => ({pos, bias: -0.05, extent: [0.62, 1.72], object});

class World {
  polys: Poly[] = [];
  objects: (string | undefined)[] = [];
  sprites: SpriteFootprint[] = [];
  add(object: string | undefined, polys: Poly[]) {
    for (const p of polys) {
      this.polys.push(p);
      this.objects.push(object);
    }
    return this;
  }
  frame(cam: Camera3): Frame {
    return {view: makeView(cam, W, H), polys: this.polys, sprites: this.sprites, objects: this.objects};
  }
}
const ground = (): Poly => ({pts: [[-60, 0, -60], [60, 0, -60], [60, 0, 60], [-60, 0, 60]], n: [0, 1, 0], m: {color: '#C8C0B0'}, bias: 210});
const orbit = (center: V3, radius: number, height: number, n: number, fov = 45): Camera3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {pos: [center[0] + Math.sin(a) * radius, height, center[2] + Math.cos(a) * radius], target: center, fov};
  });

/** 1. Long surfaces: a 16 m tram with pedestrians on both sidewalks, chase-style cameras. */
function longSurfaces(): Case {
  const w = new World().add('ground', [ground()]).add('tram', tram([0, 0, -2], '#D9503A', '#F3E9D8', '#3A5068'));
  for (let i = 0; i < 8; i++) {
    w.sprites.push(person([-9 + i * 2.6, 0.15, -5.4], `far${i}`));
    w.sprites.push(person([-8 + i * 2.6, 0.15, 3.6], `near${i}`));
  }
  const cams: Camera3[] = [-10, -4, 2, 8, 14].map((x) => ({pos: [x - 14, 5.5, 7], target: [x, 1.6, -2], fov: 52}));
  return {name: 'long surfaces (tram and walkers)', frames: cams.map((c) => w.frame(c))};
}

/** 2. Characters partially hidden by a vehicle, seen from low and high cameras. */
function behindVehicle(): Case {
  const w = new World().add('ground', [ground()]).add('car', car([0, 0, 0], 1, '#2E7C7A', '#36495E', 'occl'));
  w.sprites.push(person([0.4, 0, -1.7], 'behind'), person([-1.2, 0, 1.8], 'front'), person([2.6, 0, -1.2], 'side'));
  const cams: Camera3[] = [0.6, 1.4, 2.5, 4].map((y, i) => ({pos: [i - 1.5, y, 8], target: [0, 0.9, 0], fov: 40}));
  return {name: 'characters partially behind a vehicle', frames: cams.map((c) => w.frame(c))};
}

/** 3. Intersecting objects: crossed beams and a slab through a pillar. */
function intersecting(): Case {
  const m = {color: '#A1AABA'};
  const w = new World().add('ground', [ground()])
    .add('beamX', box([0, 0, 0], [6, 0.8, 0.8], m))
    .add('beamZ', box([0, 0.2, 0], [0.8, 0.8, 6], {color: '#D9A441'}))
    .add('pillar', box([4, 0, 3], [0.8, 4, 0.8], {color: '#5D8BB0'}))
    .add('slab', box([4, 1.5, 3], [3.2, 0.3, 3.2], {color: '#E3B04B'}));
  return {name: 'intersecting objects', frames: orbit([2, 1, 1.5], 12, 5, 8).map((c) => w.frame(c))};
}

/** 4. Moving camera: one street block orbited at 16 azimuths. */
function movingCamera(): Case {
  const w = new World().add('ground', [ground()])
    .add('tram', tram([0, 0, -2], '#D9503A', '#F3E9D8', '#3A5068'))
    .add('car', car([3, 0, 2.5], -1, '#E3B04B', '#36495E', 'mc'))
    .add('kiosk', box([-6, 0, 3], [2, 2.6, 2], {color: '#9CB8A8'}));
  for (let i = 0; i < 6; i++) w.sprites.push(person([-7 + i * 2.8, 0, i % 2 ? -5 : 5], `p${i}`));
  return {name: 'moving camera (orbit)', frames: orbit([0, 1.2, 0], 18, 4, 16, 50).map((c) => w.frame(c))};
}

/** 5. Transparent objects: a glass panel in front of a box and a character. */
function transparent(): Case {
  const glass: Poly = {pts: [[-2, 0, 2], [2, 0, 2], [2, 2.4, 2], [-2, 2.4, 2]], n: [0, 0, 1], m: {color: '#9FC4D8', kind: 'glass'}, opacity: 0.45, doubleSided: true};
  const w = new World().add('ground', [ground()]).add('glass', [glass]).add('box', box([-0.8, 0, 0], [1.2, 1.2, 1.2], {color: '#C46A55'}));
  w.sprites.push(person([0.9, 0, 0.2], 'behindGlass'), person([2.8, 0, 3.4], 'beforeGlass'));
  const cams: Camera3[] = [-3, -1, 1, 3].map((x) => ({pos: [x, 1.6, 9], target: [0, 1, 0], fov: 42}));
  return {name: 'transparent objects', frames: cams.map((c) => w.frame(c))};
}

/** 6. Nested groups: gears inside a cutaway housing on a plinth, a motor beside it. */
function nested(): Case {
  const brass = {color: '#D9A441', kind: 'metal' as const};
  const g1 = {center: [-0.5, 1.6, 0.1] as V3, teeth: 20, pitch: 0.18, thickness: 0.16, m: brass, hub: {color: '#3A4150'}};
  const g2 = {...g1, center: [-0.5 + gearRadius(g1) + gearRadius({teeth: 12, pitch: 0.18}), 1.6, 0.1] as V3, teeth: 12, m: {color: '#A8B6C0', kind: 'metal' as const}};
  const w = new World().add('ground', [ground()])
    .add('plinth', box([0, 0, 0], [3.4, 0.6, 2], {color: '#D8CBB6'}))
    .add('housing', cutawayHousing([0, 0.6, 0], [2.8, 2.2, 1.3], 0.1, {color: '#3A7C7A'}, {color: '#1E3A40'}, {color: '#D9503A'}))
    .add('gear1', gear(g1, 0.3)).add('gear2', gear(g2, 0.1))
    .add('motor', transform(box([0, 0, 0], [0.9, 0.9, 0.8], {color: '#3D4E8C', kind: 'metal'}), {translate: [-2.3, 0.6, 0]}));
  const cams = orbit([0, 1.5, 0], 6.5, 2.4, 6, 40).filter((_, i) => i !== 3);
  return {name: 'nested groups (cutaway)', frames: cams.map((c) => w.frame(c))};
}

/** 7. Foreground/background transition: a car drives between two walkers and the camera. */
function transition(): Case {
  const frames: Frame[] = [];
  for (let k = 0; k <= 8; k++) {
    const w = new World().add('ground', [ground()]).add('car', car([-9 + k * 2.25, 0, 0], 1, '#F0E8DC', '#36495E', 'tr'));
    w.sprites.push(person([0, 0, -2.4], 'behind'), person([1.5, 0, 2.6], 'front'));
    frames.push(w.frame({pos: [0.5, 2.2, 12], target: [0.5, 1, 0], fov: 45}));
  }
  return {name: 'foreground/background transition', frames};
}

/** 8. Characters standing on raised surfaces (platform, steps) and close to a wall. */
function standing(): Case {
  const m = {color: '#D9D4C8'};
  const w = new World().add('ground', [ground()])
    .add('platform', box([0, 0, 0], [6, 0.3, 6], m))
    .add('step1', box([4.5, 0, 0], [3, 0.6, 3], {color: '#C9BFAE'}))
    .add('step2', box([4.5, 0.6, -0.4], [3, 0.6, 2.2], {color: '#BDB3A3'}))
    .add('wall', box([-1, 0.3, -2.6], [7, 3, 0.3], {color: '#86A8BE'}));
  w.sprites.push(person([0, 0.3, 0], 'onPlatform'), person([-2, 0.3, -2.1], 'byWall'), person([4.5, 1.2, -0.5], 'onStep'), person([2.4, 0.3, 2.4], 'edge'));
  const cams = orbit([1, 1, 0], 11, 3.2, 8, 42);
  return {name: 'characters on raised surfaces and by walls', frames: cams.map((c) => w.frame(c))};
}

/** Real scene: the Urban prototype's chase shot, where the defect was reported. */
function urbanChase(): Case {
  const frames: Frame[] = [];
  for (const t of [2.7, 3.2, 3.7, 4.2, 4.7]) {
    const {shot, local} = shotAt(urban.shots, t);
    const world = urban.build(t);
    frames.push({view: makeView(cameraAt(shot, local), W, H), polys: world.polys, objects: world.polys.map(() => undefined),
      sprites: world.sprites.map((s) => ({pos: s.pos, bias: s.bias, extent: s.extent}))});
  }
  return {name: 'Urban prototype chase shot', frames};
}

/** Real scene: the Machine prototype, reveal and cutaway. */
function machineShots(): Case {
  const frames: Frame[] = [];
  for (const t of [0.5, 1.5, 2.5, 3.5, 4.5]) {
    const {shot, local} = shotAt(machine.shots, t);
    const world = machine.build(t);
    frames.push({view: makeView(cameraAt(shot, local), W, H), polys: world.polys, objects: world.polys.map(() => undefined), sprites: []});
  }
  return {name: 'Machine prototype', frames};
}

export const CASES: (() => Case)[] = [longSurfaces, behindVehicle, intersecting, movingCamera, transparent, nested, transition, standing, urbanChase, machineShots];
