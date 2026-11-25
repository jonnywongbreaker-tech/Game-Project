import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseEpisode, planEpisode} from '../scripts/lib/production-plan';
import {readScene} from '../src/production/scene/schema';
import {compileScene} from '../src/production/scene/timeline';

const base = () => ({
  entities: [
    {id: 'guide', asset: 'person', rotation: 90},
    {id: 'object', asset: 'box', position: [0, 1, 1], attach: 'guide', color: '#000000'},
  ],
  camera: {position: [4, 2, 5], target: {subject: 'object'}},
});
const withScene = (scene: unknown) => ({id: 'sequence', title: 'Sequence', shots: [
  {id: 'first', template: 'scene', duration: 4, scene},
]});

test('composed scene channels interpolate independently and can be sampled out of order', () => {
  const scene = readScene({...base(), actions: [
    {target: 'guide', at: 0, duration: 2, set: {position: [2, 0, 0]}},
    {target: 'object', at: 0, duration: 2, set: {scale: 3, color: '#FFFFFF'}},
    {target: 'object', at: 2.5, set: {attach: null, position: [7, 1, 1], asset: 'cone'}},
  ]}, 'scene');
  const timeline = compileScene(scene);
  assert.deepEqual(timeline.sample('object', 2.6).position, [7, 1, 1]);
  assert.equal(timeline.sample('object', 2.6).asset, 'cone');
  const midpoint = timeline.sample('object', 1);
  assert.equal(midpoint.scale, 2);
  assert.equal(midpoint.color, '#808080');
  assert.ok(Math.abs(midpoint.position[0] - 2) < 1e-8);
  assert.deepEqual(timeline.camera(1).target, midpoint.position);
  assert.equal(timeline.sample('guide', 1).walking, true);
  assert.equal(timeline.sample('guide', 1).walked, 1);
  assert.deepEqual(timeline.sample('object', 1), midpoint);
});

test('adjacent decimal action times meet at a single frame boundary', () => {
  const scene = readScene({...base(), actions: [
    {target: 'object', at: .1, duration: .2, set: {scale: 2}},
    {target: 'object', at: .3, set: {scale: 4}},
  ]}, 'scene');
  assert.equal(compileScene(scene).sample('object', .3).scale, 4);
});

test('camera keys inherit fields and follow animated named subjects', () => {
  const scene = readScene({...base(), camera: {...base().camera, fov: 40,
    keys: [{at: 2, position: [6, 4, 7], roll: 12}, {at: 3, fov: 30}],
  }}, 'scene');
  const timeline = compileScene(scene);
  assert.deepEqual(timeline.camera(1).pos, [5, 3, 6]);
  assert.equal(timeline.camera(1).roll, 6);
  assert.equal(timeline.camera(2.5).fov, 35);
  assert.deepEqual(timeline.camera(4).pos, [6, 4, 7]);
});

test('composed shots reject missing references, conflicts and invalid duration before rendering', () => {
  const b = base();
  for (const [scene, message] of [
    [{...b, actions: [{target: 'missing', at: 0, set: {scale: 2}}]}, /unknown action subject/],
    [{...b, actions: [{target: 'object', at: 0, duration: 2, set: {scale: 2}}, {target: 'object', at: 1, set: {scale: 3}}]}, /overlapping/],
    [{...b, actions: [{target: 'object', at: 0, set: {attach: null}}]}, /attachment changes require a position/],
    [{...b, actions: [{target: 'object', at: 0, set: {asset: 'tree'}}]}, /swap assets/],
    [{...b, camera: {...b.camera, target: {subject: 'unknown'}}}, /unknown subject/],
    [{...b, annotations: [{text: 'Broken anchor'}]}, /exactly one/],
  ] as const) assert.throws(() => parseEpisode(withScene(scene)), message);
  const late = {...b, actions: [{target: 'object', at: 3, duration: 2, set: {scale: 2}}]};
  assert.throws(() => planEpisode('test.json', parseEpisode(withScene(late))), /exceeds the shot duration/);
  const coincident = {...b, camera: {position: [0, 0, 0], target: [0, 0, 0]}};
  assert.throws(() => planEpisode('test.json', parseEpisode(withScene(coincident))), /coincides with its target/);
});

test('aperture meshes keep the opening through placement', async () => {
  const {geometry, placeGeometry} = await import('../src/production/scene/geometry');
  const scene = readScene({
    entities: [{id: 'panel', asset: 'aperture', opening: [.5, .75, .24], position: [2, 1, 0], size: [4, 2, 1]}],
    camera: {position: [0, 1, 4], target: [0, 1, 0]},
  }, 'scene');
  const panel = scene.entities[0];
  const mesh = geometry('aperture', panel);
  assert.equal(mesh[0].holes?.[0].length, 48);
  const placed = placeGeometry(mesh, panel, compileScene(scene).sample('panel', 0));
  const [left, right] = [
    Math.min(...placed[0].holes![0].map(p => p[0])),
    Math.max(...placed[0].holes![0].map(p => p[0])),
  ];
  assert.ok(Math.abs(left - 1) < .001 && Math.abs(right - 3) < .001);
  assert.throws(() => readScene({...scene, entities: [{...panel, opening: [.5, .75, .26]}]}, 'scene'), /opening radius/);
});

test('outline geometry extrudes custom silhouettes and path times stay within the shot', async () => {
  const {geometry} = await import('../src/production/scene/geometry');
  const scene = readScene({
    entities: [{id: 'profile', asset: 'outline', outline: [[0, 0], [1, 0], [0, 1]]}],
    paths: [{points: [[0, 0, 0], [0, 1, 0], [1, 1, 0]], at: 3, reveal: 2}],
    camera: {position: [0, 1, 4], target: [0, 1, 0]},
  }, 'scene');
  assert.equal(geometry('outline', scene.entities[0]).length, 5);
  assert.throws(() => planEpisode('test.json', parseEpisode(withScene(scene))), /exceeds the shot duration/);
});
