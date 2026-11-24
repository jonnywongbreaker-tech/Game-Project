import assert from 'node:assert/strict';
import {test} from 'node:test';
import {poseArms} from '../src/engine/rig';
import {shelfBooks, shelfSlots} from '../src/kit/library';
import {edgePulse, hops, nodePulse} from '../src/kit/network';
import {propPosition} from '../src/kit/props';
import {DEFAULT_PROPORTIONS, solvePuppet} from '../src/kit/puppet';
import {EDGES, heroAt, MAIN_SHELF, node, orbsAt, RECALL} from '../src/prototypes/memory/scene';

const base = {t: 1, arms: poseArms('idle', 1), walking: false, walkPhase: 0};
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('standing feet stay planted on the ground even when crouching or leaning', () => {
  for (const crouch of [0, 0.2]) {
    for (const lean of [-6, 0, 11]) {
      const j = solvePuppet({...base, crouch, lean});
      assert.ok(Math.abs(j.foot.l[1]) < 0.5 && Math.abs(j.foot.r[1]) < 0.5, `crouch ${crouch} lean ${lean}`);
    }
  }
});

test('walking: one foot is planted while the other swings', () => {
  for (const p of [0.1, 0.3, 0.6, 0.85]) {
    const j = solvePuppet({...base, walking: true, walkPhase: p});
    const planted = Math.min(Math.abs(j.foot.l[1]), Math.abs(j.foot.r[1]));
    assert.ok(planted < 0.5, `phase ${p}`);
  }
});

test('hand IK reaches the target at full weight and keeps bone lengths', () => {
  const P = DEFAULT_PROPORTIONS;
  const target: [number, number] = [110, -330];
  const j = solvePuppet({...base, ik: {r: {target, weight: 1}}});
  assert.ok(dist(j.hand.r, target) < 1, `hand at ${j.hand.r}`);
  assert.ok(Math.abs(dist(j.shoulder.r, j.elbow.r) - P.upperArm) < 0.01);
  assert.ok(Math.abs(dist(j.elbow.r, j.hand.r) - P.forearm) < 0.01);
  assert.ok(j.elbow.r[1] > (j.shoulder.r[1] + target[1]) / 2 - 1, 'elbow hangs below the reach line');
});

test('props hand off smoothly (no teleport between frames)', () => {
  const track = [
    [0, {kind: 'world' as const, at: [0, 0] as [number, number]}],
    [1, {kind: 'hand' as const, side: 'r' as const}],
  ] as const;
  const hands = {l: [0, 0] as [number, number], r: [100, 0] as [number, number], carry: [0, 0] as [number, number]};
  let prev = propPosition(0.9, track, hands);
  for (let t = 0.9; t < 1.4; t += 1 / 30) {
    const p = propPosition(t, track, hands);
    assert.ok(dist(p, prev) < 50, `jump at ${t.toFixed(2)}: a 100-unit handoff must take several frames`);
    prev = p;
  }
  assert.deepEqual(propPosition(2, track, hands), [100, 0]);
});

test('memory network: recall spreads only through links; the isolated memory never lights', () => {
  const d = hops(EDGES, RECALL.source, 10);
  assert.equal(d.get('new'), 0);
  assert.equal(d.get('d'), 2);
  assert.equal(d.has('lonely'), false);
  assert.equal(nodePulse(9, RECALL, d.get('lonely')), 0);
  assert.ok(nodePulse(RECALL.start + 0.2, RECALL, 0) > 0.9);
  assert.equal(edgePulse(RECALL.start + 0.2, RECALL, 0, 1)?.from, 'a');
});

test('procedural shelves are deterministic and respect reserved slots', () => {
  assert.deepEqual(shelfBooks(MAIN_SHELF), shelfBooks(MAIN_SHELF));
  const reserved = shelfSlots(MAIN_SHELF).filter((s) => MAIN_SHELF.reserved!.includes(`${s.row},${s.col}`));
  for (const s of reserved) {
    assert.ok(!shelfBooks(MAIN_SHELF).some((b) => b.x >= s.x && b.x < s.x + s.w && b.y === s.y + s.h), `slot ${s.row},${s.col} empty`);
  }
});

test('the orb is carried, placed exactly in its slot, then stays there', () => {
  assert.ok(heroAt(1).carriedOrb, 'carried while walking');
  const n = node('new');
  const at = orbsAt(6).find((o) => o.id === 'new')!;
  assert.deepEqual([at.x, at.y], [n.x, n.y]);
  const placing = heroAt(4.19).carriedOrb!;
  assert.ok(dist(placing, [n.x, n.y]) < 6, 'hand delivers the orb to the slot');
  assert.equal(heroAt(5).carriedOrb, null);
});
