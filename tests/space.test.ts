import assert from 'node:assert/strict';
import {test} from 'node:test';
import {atrium} from '../src/kit/architecture';
import {burst} from '../src/kit/particles';
import {cameraAt, shotAt, type Shot} from '../src/kit/shots';
import {clipNear, lightAt, makeView, projectPoint, shade, toCamera} from '../src/kit/space';
import {ARCH, DIST, LINKS, NODES, orbEnergy} from '../src/prototypes/memory3/scene';

const cam = {pos: [0, 0, 0] as [number, number, number], target: [0, 0, 10] as [number, number, number], fov: 60};

test('projection: the look-at target lands in the centre; nearer objects appear larger', () => {
  const v = makeView(cam, 1920, 1080);
  const c = projectPoint(v, [0, 0, 10])!;
  assert.ok(Math.abs(c.x - 960) < 1e-6 && Math.abs(c.y - 540) < 1e-6);
  assert.ok(projectPoint(v, [0, 0, 2])!.scale > projectPoint(v, [0, 0, 20])!.scale);
  assert.equal(projectPoint(v, [0, 0, -5]), null, 'behind the camera is not projected');
  const up = projectPoint(v, [0, 1, 10])!;
  assert.ok(up.y < 540, 'world up is screen up');
});

test('near-plane clipping keeps polygons that cross the camera plane', () => {
  const v = makeView(cam, 1920, 1080);
  const poly = [[-1, -1, -2], [1, -1, -2], [1, -1, 5], [-1, -1, 5]].map((p) => toCamera(v, p as [number, number, number]));
  const clipped = clipNear(poly, v.near);
  assert.equal(clipped.length, 4);
  assert.ok(clipped.every((p) => p[2] >= v.near - 1e-9));
});

test('lighting: surfaces inside the oculus beam are brighter than outside; fog lightens distant surfaces', () => {
  const lights = [
    {kind: 'hemisphere' as const, sky: '#808080', ground: '#404040', intensity: 0.5},
    {kind: 'spot' as const, pos: [0, 40, 0] as [number, number, number], dir: [0, -1, 0] as [number, number, number], angle: 6, softness: 1, color: '#ffffff', intensity: 1.5},
  ];
  const lum = (c: number[]) => c[0] + c[1] + c[2];
  assert.ok(lum(lightAt([0, 0, 0], [0, 1, 0], lights)) > lum(lightAt([10, 0, 0], [0, 1, 0], lights)) * 2);
  const atmo = {low: '#ffffff', high: '#ffffff', height: 10, density: 0.05};
  const near = shade([0, 0, 1], [0, 0, -1], {color: '#000000'}, lights, [0, 0, 0], atmo);
  const far = shade([0, 0, 60], [0, 0, -1], {color: '#000000'}, lights, [0, 0, 0], atmo);
  assert.ok(parseInt(far.slice(1, 3), 16) > parseInt(near.slice(1, 3), 16));
});

test('shots: cuts select the right shot; cameras interpolate between keys', () => {
  const shots: Shot[] = [
    {id: 'a', label: 'A', start: 0, end: 2, keys: [{t: 0, pos: [0, 0, 0], target: [0, 0, 1], fov: 40}, {t: 2, pos: [0, 0, 10], target: [0, 0, 11], fov: 60}]},
    {id: 'b', label: 'B', start: 2, end: 4, keys: [{t: 0, pos: [5, 0, 0], target: [5, 0, 1], fov: 30}]},
  ];
  assert.equal(shotAt(shots, 1.9).shot.id, 'a');
  assert.equal(shotAt(shots, 2).shot.id, 'b');
  const mid = cameraAt(shots[0], 1);
  assert.ok(mid.pos[2] > 0 && mid.pos[2] < 10 && mid.fov > 40 && mid.fov < 60);
  assert.ok(Math.abs(cameraAt(shots[0], 1).focus - 1) < 1e-6, 'focus defaults to the look-at distance');
});

test('architecture is procedural and deterministic', () => {
  const spec = {...ARCH.spec};
  assert.equal(JSON.stringify(atrium(spec).polys.slice(0, 200)), JSON.stringify(atrium(spec).polys.slice(0, 200)));
  const other = atrium({...spec, sides: 6, levels: 4, seed: 'vault'});
  assert.ok(other.polys.length < ARCH.polys.length && other.slots.length === 6 * 4 * spec.baysPerWall);
});

test('memory network: the isolated memory is unreachable and fades; linked memories end lit', () => {
  assert.ok(NODES.length > 40 && LINKS.length > NODES.length);
  assert.equal(DIST.has('lonely'), false);
  assert.ok(orbEnergy('lonely', 16) < 0.15);
  const linked = [...DIST.keys()].filter((id) => id !== 'new');
  assert.ok(linked.every((id) => orbEnergy(id, 17.5) > 0.9), 'connected memories remain illuminated');
});

test('particle bursts are deterministic and finite in time', () => {
  const o = {count: 10, life: 2, spread: 1, drift: [0, 1, 0] as [number, number, number], size: 0.01, seed: 's'};
  assert.deepEqual(burst(1, [0, 0, 0], 0, o), burst(1, [0, 0, 0], 0, o));
  assert.equal(burst(3, [0, 0, 0], 0, o).length, 0);
});
