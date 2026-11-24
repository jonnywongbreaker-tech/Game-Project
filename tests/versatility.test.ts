import assert from 'node:assert/strict';
import {test} from 'node:test';
import {building} from '../src/kit/city';
import {morph} from '../src/kit/formation';
import {crankSlider, gearRadius, meshedAngle} from '../src/kit/mechanics';
import {box, convexHull, planarShadow} from '../src/kit/primitives';
import {closeUp, establishing, frameDistance, scaleTransition, tracking} from '../src/kit/shotGrammar';
import {cameraAt} from '../src/kit/shots';
import {length, rgb, stylize, sub} from '../src/kit/space';
import {scatter} from '../src/kit/terrain';
import {LOOK} from '../src/themes/cge/identity';
import {blendedArms} from '../src/engine/rig';
import {chooseView, solvePuppet} from '../src/kit/puppet';
import {FACES} from '../src/themes/cge/face';
import {PERSON_EXPRESSIONS, PERSON_PROPORTIONS, randomPerson} from '../src/themes/cge/Person';

test('stylized shading: light is banded and shadows lean cool', () => {
  const grey = rgb('#808080');
  const a = stylize(grey, [0.51, 0.51, 0.51], LOOK);
  const b = stylize(grey, [0.54, 0.54, 0.54], LOOK);
  assert.deepEqual(a, b, 'nearby light levels fall in the same band');
  const dark = stylize(grey, [0.3, 0.3, 0.3], LOOK);
  assert.ok(dark[2] > dark[0], 'shadows shift toward blue');
});

test('planar shadow is a single hull polygon on the ground', () => {
  const s = planarShadow(box([0, 0, 0], [2, 10, 2], {color: '#fff'}), [0.5, -1, 0], 0, '#000');
  assert.equal(s.length, 1);
  assert.ok(s[0].pts.every((p) => Math.abs(p[1] - 0.01) < 1e-9));
  const xs = s[0].pts.map((p) => p[0]);
  assert.ok(Math.max(...xs) > 4, 'a tall object casts a long shadow away from the light');
  assert.equal(convexHull([[0, 0], [1, 0], [0.5, 0.2], [1, 1], [0, 1]]).length, 4);
});

test('shot grammar frames subjects by size and never keys coordinates by hand', () => {
  const s = closeUp({label: 'c', start: 0, end: 2, subject: {pos: [0, 1, 0], size: 0.5, facing: [0, 0, 1]}});
  const cam = cameraAt(s, 1);
  const d = length(sub(cam.pos, [0, 1, 0]));
  assert.ok(Math.abs(d - frameDistance(0.5, 28, 0.55)) < 0.3, 'distance follows subject size');
  const e = establishing({label: 'e', start: 0, end: 3, stage: {pos: [0, 5, 0], size: 50}});
  assert.ok(length(sub(cameraAt(e, 0).pos, [0, 5, 0])) > length(sub(cameraAt(e, 3).pos, [0, 5, 0])), 'establishing pushes in');
  const tr = tracking({label: 't', start: 0, end: 2, follow: (t) => [t * 10, 0, 0], size: 4, mode: 'chase', distance: 10});
  assert.ok(cameraAt(tr, 1).pos[0] < 10, 'chase camera stays behind the subject');
  const st = scaleTransition({label: 's', start: 0, end: 4, from: {pos: [0, 1, 0], size: 1}, to: {pos: [0, 30, 0], size: 60}});
  assert.ok(length(sub(cameraAt(st, 4).pos, [0, 30, 0])) > 10 * length(sub(cameraAt(st, 0).pos, [0, 1, 0])));
});

test('gears mesh at correct ratios; crank-slider stays within its stroke', () => {
  assert.ok(Math.abs(meshedAngle(24, 1, 12, 1) + 2) < 1e-9, 'small gear turns twice as fast, opposite way');
  assert.ok(Math.abs(gearRadius({teeth: 24, pitch: 0.2}) / gearRadius({teeth: 12, pitch: 0.2}) - 2) < 1e-9);
  for (let a = 0; a < 7; a += 0.3) {
    const h = crankSlider(a, 0.3, 1).piston;
    assert.ok(h >= 0.7 - 1e-9 && h <= 1.3 + 1e-9);
  }
});

test('formation morph: instances start small at the source and land full size', () => {
  const o = {from: [0, 1, 0] as [number, number, number], to: [10, 5, 0] as [number, number, number], start: 1, stagger: 0.1, duration: 1, fromScale: 0.01, arc: 3};
  assert.ok(morph(1, 0, o).scale < 0.05);
  const end = morph(5, 0, o);
  assert.equal(end.scale, 1);
  assert.deepEqual(end.pos, [10, 5, 0]);
  assert.ok(morph(1.5, 3, o).k < morph(1.5, 0, o).k, 'staggered');
});

test('procedural variety: buildings and people differ by seed, deterministically', () => {
  const st = {walls: ['#E8C9A0', '#9CB8A8'], trims: ['#ffffff', '#3F4A5C'], awnings: ['#ff0000'], glass: '#5D8BB0', glassLit: '#FFD58A'};
  const sig = (seed: string) => JSON.stringify(building(0, 8, -1, 10, seed, st).polys);
  assert.equal(sig('a'), sig('a'), 'same seed → same building');
  const variants = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(sig));
  assert.ok(variants.size >= 5, 'different seeds → different buildings');
  assert.deepEqual(randomPerson('p1'), randomPerson('p1'));
  const specs = Array.from({length: 12}, (_, i) => randomPerson(`p${i}`));
  assert.ok(new Set(specs.map((s) => `${s.outfit}-${s.hair}-${s.top}`)).size >= 8, 'a crowd is varied');
  assert.equal(scatter(20, [0, 10], [0, 10], 's', (x) => x > 5).every(([x]) => x > 5), true);
});

test('view choice: front within the camera cone, back when facing away, profile otherwise', () => {
  assert.equal(chooseView([0, 1], [0, 5]), 'front');
  assert.equal(chooseView([0, 1], [0.3, -5]), 'back');
  assert.equal(chooseView([1, 0], [0, 5]), 'profile');
  assert.equal(chooseView([0.5, 1], [0, 5]), 'front', '~27° off axis still reads as front');
});

test('frontal rig: feet side by side, forward reach stays inside the shoulders, no lean roll', () => {
  const base = {t: 1, arms: blendedArms('idle', 1), walking: false, walkPhase: 0, lean: 8};
  const f = solvePuppet({...base, view: 'front'}, PERSON_PROPORTIONS);
  assert.ok(f.foot.l[0] < 0 && f.foot.r[0] > 0, 'feet on either side of the centre line');
  assert.equal(f.torsoAngle, 0, 'a forward lean is toward the camera, not a roll');
  const reach = solvePuppet({...base, view: 'front', ik: {r: {target: [90, -300], weight: 1}}}, PERSON_PROPORTIONS);
  assert.ok(Math.abs(reach.hand.r[0]) < PERSON_PROPORTIONS.shoulderW + 1, 'forward target maps inside the shoulder line');
  const p = solvePuppet({...base, view: 'profile'}, PERSON_PROPORTIONS);
  assert.ok(p.torsoAngle > 0);
});

test('every expression has face data with sane ranges', () => {
  assert.ok(PERSON_EXPRESSIONS.length >= 10);
  for (const e of PERSON_EXPRESSIONS) {
    const f = FACES[e];
    assert.ok(f.eye.open > 0 && f.eye.open <= 1.4, e);
    assert.ok(f.eye.cheek >= 0 && f.eye.cheek <= 1, e);
    assert.ok(f.mouth.width > 0 && f.mouth.open >= 0, e);
  }
  assert.ok(FACES.smile.mouth.curve > 0 && FACES.sad.mouth.curve < 0, 'smile up, sad down');
  assert.ok(FACES.angry.brow.inner > 0 && FACES.concern.brow.inner < 0, 'anger drops the inner brow, worry raises it');
});
