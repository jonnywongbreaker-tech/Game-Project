import assert from 'node:assert/strict';
import {test} from 'node:test';
import {limb, poseArms, solveIK, walkCycle} from '../src/engine/rig';
import {isTalking, wordTimings} from '../src/engine/speech';
import {keyframes, move} from '../src/engine/time';
import {POSES} from '../src/engine/vocab';

test('word timings are ordered, inside the line, and leave gaps after punctuation', () => {
  const w = wordTimings('Hello, world. How are you?', 1, 4);
  for (let i = 0; i < w.length; i++) {
    assert.ok(w[i].start >= 1 && w[i].end <= 4 + 1e-9 && w[i].end > w[i].start);
    if (i) assert.ok(w[i].start >= w[i - 1].end - 1e-9);
  }
  const gap = w[1].start - w[0].end;
  const line = {who: 'a', text: '', start: 1, end: 4, words: w};
  assert.ok(gap > 0);
  assert.equal(isTalking([line], 'a', w[0].end + gap / 2), false, 'mouth closes at the comma');
  assert.equal(isTalking([line], 'a', (w[0].start + w[0].end) / 2), true);
});

test('every pose resolves to finite arm angles', () => {
  for (const p of POSES) {
    const a = poseArms(p, 1.234);
    for (const v of [...a.l, ...a.r]) assert.ok(Number.isFinite(v), p);
  }
});

test('IK places the hand on reachable targets', () => {
  const root: [number, number] = [40, -370];
  for (const target of [[120, -300], [60, -250], [150, -420], [10, -300]] as [number, number][]) {
    for (const side of [1, -1] as const) {
      const angles = solveIK(root, target, [86, 80], side);
      const {end} = limb(root, angles, [86, 80], side);
      assert.ok(Math.hypot(end[0] - target[0], end[1] - target[1]) < 0.5, `${target} side ${side}`);
    }
  }
});

test('walk cycle is neutral when standing', () => {
  const w = walkCycle(0.37, false);
  assert.deepEqual([w.swing, w.bob, w.arm, ...w.thigh, ...w.knee], [0, 0, 0, 0, 0, 0, 0]);
});

test('move() tracks cumulative stride distance and direction', () => {
  const keys: [number, number][] = [[0, 0], [1, 460], [2, 0]];
  assert.equal(move(0.5, keys).facing, 1);
  assert.equal(move(1.5, keys).facing, -1);
  assert.ok(Math.abs(move(2, keys).walkPhase - 4) < 1e-9, 'two strides there, two back');
  assert.equal(keyframes(5, keys), 0);
});
