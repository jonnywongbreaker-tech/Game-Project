/**
 * Skin-independent rig math: pose angles, pose blending, walk cycle, blinking
 * and 2-bone limb solving. Every character skin (the default Character and the
 * style prototypes) reads its joints from here, so animation is defined once.
 */
import {resolveTimed, type Timed, tween, wave} from './time';
import type {Pose} from './vocab';

/** Arm angles in degrees, measured "outward" from hanging straight down. [upper, forearm] */
export type Arms = {l: [number, number]; r: [number, number]};

export const poseArms = (pose: Pose, t: number): Arms => {
  switch (pose) {
    case 'wave':
      return {l: [10, -6], r: [140, 20 + wave(t, 2.2, 28)]};
    case 'point':
      return {l: [10, -6], r: [85, 4]};
    case 'shrug':
      return {l: [35, 95], r: [35, 95]};
    case 'cheer':
      return {l: [150, 15 + wave(t, 2, 12)], r: [150, 15 + wave(t, 2, 12, 0.5)]};
    case 'think':
      return {l: [10, -6], r: [12, -160]};
    case 'hips':
      return {l: [42, -80], r: [42, -80]};
    case 'present':
      return {l: [62, 14], r: [62, 14]};
    case 'idle':
    default:
      return {l: [10 + wave(t, 0.45, 2), -6], r: [10 + wave(t, 0.45, 2, 0.3), -6]};
  }
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpArms = (a: Arms, b: Arms, k: number): Arms => ({
  l: [lerp(a.l[0], b.l[0], k), lerp(a.l[1], b.l[1], k)],
  r: [lerp(a.r[0], b.r[0], k), lerp(a.r[1], b.r[1], k)],
});

/** Current arm angles for a (possibly timed) pose, blended over `blendTime` after each change. */
export function blendedArms(pose: Timed<Pose>, t: number, blendTime = 0.25): Arms {
  const p = resolveTimed(t, pose);
  const k = tween(p.since, [0, blendTime], [0, 1]);
  return lerpArms(poseArms(p.previous, t), poseArms(p.value, t), k);
}

/** Walk cycle from a stride phase (in strides). */
export function walkCycle(walkPhase: number, walking: boolean) {
  const p = walkPhase * Math.PI * 2;
  const swing = walking ? Math.sin(p) : 0;
  return {
    swing,
    /** Vertical body offset (negative = up). */
    bob: walking ? -Math.abs(Math.sin(p)) * 12 : 0,
    /** Thigh angles (deg) for the two legs. */
    thigh: walking ? ([swing * 26, -swing * 26] as [number, number]) : ([0, 0] as [number, number]),
    /** Extra knee bend (deg) — the leg swinging forward bends. */
    knee: walking ? ([Math.max(0, Math.cos(p)) * 30, Math.max(0, -Math.cos(p)) * 30] as [number, number]) : ([0, 0] as [number, number]),
    /** Arm swing to add to the upper arms (deg). */
    arm: swing * 22,
  };
}

/** Eye openness 0..1 with a natural, per-character blink rhythm. */
export function blink(t: number, seed = 0): number {
  const period = 3.1 + (seed % 5) * 0.37;
  const k = (t + seed * 0.71) % period;
  return k < 0.12 ? 0.12 : 1;
}

/**
 * Forward kinematics for a 2-bone limb hanging from `root`.
 * Angles are "outward" degrees from straight down; side = 1 means +x is outward.
 */
export function limb(root: [number, number], angles: [number, number], lengths: [number, number], side: 1 | -1) {
  const a1 = (angles[0] * Math.PI) / 180;
  const a2 = ((angles[0] + angles[1]) * Math.PI) / 180;
  const mid: [number, number] = [root[0] + side * Math.sin(a1) * lengths[0], root[1] + Math.cos(a1) * lengths[0]];
  const end: [number, number] = [mid[0] + side * Math.sin(a2) * lengths[1], mid[1] + Math.cos(a2) * lengths[1]];
  return {mid, end};
}

/**
 * Two-bone inverse kinematics: angles that place the limb end at `target`
 * (clamped to reach). Returns the same "outward" angle convention as limb().
 */
export function solveIK(root: [number, number], target: [number, number], lengths: [number, number], side: 1 | -1, bendDir: 1 | -1 = 1): [number, number] {
  const [l1, l2] = lengths;
  const dx = (target[0] - root[0]) * side;
  const dy = target[1] - root[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.001);
  const base = Math.atan2(dx, dy);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const cosB = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2);
  const b = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosB)));
  const upper = base + bendDir * a;
  return [(upper * 180) / Math.PI, (-bendDir * b * 180) / Math.PI];
}
