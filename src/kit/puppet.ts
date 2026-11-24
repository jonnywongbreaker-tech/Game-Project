/**
 * Puppet rig v2: a full skeleton solved per frame. Pure and skin-independent:
 * every visual style draws its character from these joints.
 *
 * Coordinates are LOCAL: origin at the feet, +x = the direction the character
 * faces, y down (SVG). Convert world targets with toLocal().
 */
import {type Arms, solveIK} from '../engine/rig';

export type Vec = [number, number];

/**
 * Which side of the character the camera sees. Profile joints use x = forward;
 * front and back joints use x = lateral (screen right when seen from the front).
 */
export type View = 'profile' | 'front' | 'back';

export interface Proportions {
  hipY: number;
  shoulderY: number;
  headY: number;
  headR: number;
  shoulderW: number;
  hipW: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
}

export const DEFAULT_PROPORTIONS: Proportions = {
  hipY: -205, shoulderY: -365, headY: -452, headR: 64, shoulderW: 46, hipW: 17,
  upperArm: 86, forearm: 80, thigh: 116, shin: 110,
};

export interface HandIK {
  target: Vec;
  /** 0 = follow the pose, 1 = hand exactly on target. */
  weight: number;
}

export interface PuppetInput {
  t: number;
  /** Base arm pose (outward angles), e.g. from blendedArms(). */
  arms: Arms;
  walking: boolean;
  /** Cumulative strides from move(). */
  walkPhase: number;
  /** Forward lean of the torso in degrees (negative = lean back, e.g. anticipation). */
  lean?: number;
  /** 0..1 knee bend (feet stay planted via leg IK). Negative rises onto toes. */
  crouch?: number;
  ik?: {l?: HandIK; r?: HandIK};
  /** Head looks toward this local point. */
  lookAt?: Vec;
  /** Forward speed in units/s — drives secondary motion (hair, clothing). */
  velocity?: number;
  seed?: number;
  /** Camera-relative view. Front/back remap forward motion (reach, stride) onto the picture plane. */
  view?: View;
}

export interface Joints {
  pelvis: Vec;
  chest: Vec;
  neck: Vec;
  head: Vec;
  headTilt: number;
  torsoAngle: number;
  pupil: Vec;
  shoulder: {l: Vec; r: Vec};
  elbow: {l: Vec; r: Vec};
  hand: {l: Vec; r: Vec};
  hip: {l: Vec; r: Vec};
  knee: {l: Vec; r: Vec};
  foot: {l: Vec; r: Vec};
  /** Toe lift 0..1 per foot (for shoe rotation during swing). */
  footLift: {l: number; r: number};
  /** Secondary motion angle for hair/scarves (degrees). */
  hairSwing: number;
  breath: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const rot = (v: Vec, deg: number): Vec => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

/** Half-stride length: one walk cycle (two steps) covers 2 * STRIDE = 230 units, matching move(). */
const STRIDE = 115;

/** Foot position for a walk-cycle phase q in [0,1): planted stance, then a lifted, eased swing. */
function walkFoot(q: number): {pos: Vec; lift: number} {
  q = ((q % 1) + 1) % 1;
  if (q < 0.5) return {pos: [STRIDE / 2 - (q / 0.5) * STRIDE, 0], lift: 0};
  const u = (q - 0.5) / 0.5;
  const lift = Math.sin(Math.PI * u);
  return {pos: [-STRIDE / 2 + smooth(u) * STRIDE, -lift * 30], lift};
}

/** Convert a world point to a character's local frame. */
export const toLocal = (world: Vec, x: number, groundY: number, facing: 1 | -1): Vec => [(world[0] - x) * facing, world[1] - groundY];
/** Convert a local point back to world space. */
export const toWorld = (local: Vec, x: number, groundY: number, facing: 1 | -1): Vec => [x + local[0] * facing, groundY + local[1]];

export function solvePuppet(i: PuppetInput, P: Proportions = DEFAULT_PROPORTIONS): Joints {
  const frontal = i.view === 'front' || i.view === 'back';
  // Seen from the front, a forward lean points at the camera: no visible roll.
  const lean = frontal ? 0 : i.lean ?? 0;
  const crouch = i.crouch ?? 0;
  const p = i.walkPhase;
  const seed = i.seed ?? 0;

  // ---- Pelvis: walk bob (low at foot contact), idle weight shift, crouch.
  const bob = i.walking ? -((1 - Math.cos(4 * Math.PI * p)) / 2) * 10 : 0;
  const sway = i.walking ? Math.sin(2 * Math.PI * p) * 4 : Math.sin(i.t * 1.4 + seed) * 2.5;
  const breath = Math.sin(i.t * 2.2 + seed) * 0.5 + 0.5;
  const pelvis: Vec = [sway + lean * 0.6, P.hipY + bob + crouch * 42];

  // ---- Torso & head (rotate around the pelvis by lean).
  const torso = P.shoulderY - P.hipY;
  const chest = add(pelvis, rot([0, torso - breath * 2], lean));
  const neck = add(pelvis, rot([0, torso - 22], lean));
  const headBase = add(pelvis, rot([0, P.headY - P.hipY], lean));
  let headTilt = lean * 0.4;
  let pupil: Vec = [3, 0];
  if (i.lookAt) {
    const d: Vec = [i.lookAt[0] - headBase[0], i.lookAt[1] - headBase[1]];
    const len = Math.hypot(d[0], d[1]) || 1;
    headTilt += frontal ? clamp(d[0] * 0.02, -6, 6) : clamp((Math.atan2(d[1], Math.max(20, d[0])) * 180) / Math.PI * 0.35, -16, 16);
    pupil = [(d[0] / len) * 5, (d[1] / len) * 4];
  }
  const head = headBase;

  // ---- Arms: base pose (relative to the torso) blended with IK.
  const shoulder = {l: add(chest, rot([-P.shoulderW, 12], lean)), r: add(chest, rot([P.shoulderW, 12], lean))};
  const swing = i.walking ? Math.sin(2 * Math.PI * p) * (frontal ? 4 : 20) : 0;
  const base = {
    l: [i.arms.l[0] + lean + swing, i.arms.l[1]] as [number, number],
    r: [i.arms.r[0] - lean + swing, i.arms.r[1]] as [number, number],
  };
  const lengths: [number, number] = [P.upperArm, P.forearm];
  const arm = (side: 'l' | 'r') => {
    const s: 1 | -1 = side === 'r' ? 1 : -1;
    const root = shoulder[side];
    let angles = base[side];
    const ik = i.ik?.[side];
    if (ik && ik.weight > 0) {
      // Front/back: a target in front of the body sits just inside the shoulder line.
      const target: Vec = frontal ? [s * P.shoulderW * 0.45, ik.target[1]] : ik.target;
      const outward = (target[0] - root[0]) * s;
      const solved = solveIK(root, target, lengths, s, outward >= 0 ? -1 : 1);
      angles = [lerp(angles[0], solved[0], ik.weight), lerp(angles[1], solved[1], ik.weight)];
    }
    const a1 = rad(angles[0]);
    const a2 = rad(angles[0] + angles[1]);
    const elbow: Vec = [root[0] + s * Math.sin(a1) * lengths[0], root[1] + Math.cos(a1) * lengths[0]];
    const hand: Vec = [elbow[0] + s * Math.sin(a2) * lengths[1], elbow[1] + Math.cos(a2) * lengths[1]];
    return {elbow, hand};
  };
  const L = arm('l');
  const R = arm('r');

  // ---- Legs: feet are planted targets; IK bends the knees forward.
  const hip = {l: add(pelvis, [-P.hipW, 0]), r: add(pelvis, [P.hipW, 0])};
  const stand = {l: [-14, 0] as Vec, r: [18, 0] as Vec};
  const fl = i.walking ? walkFoot(p) : {pos: stand.l, lift: 0};
  const fr = i.walking ? walkFoot(p + 0.5) : {pos: stand.r, lift: 0};
  const leg = (h: Vec, f: Vec) => {
    const [a, b] = solveIK(h, f, [P.thigh, P.shin], 1, 1);
    const knee: Vec = [h[0] + Math.sin(rad(a)) * P.thigh, h[1] + Math.cos(rad(a)) * P.thigh];
    const foot: Vec = [knee[0] + Math.sin(rad(a + b)) * P.shin, knee[1] + Math.cos(rad(a + b)) * P.shin];
    return {knee, foot};
  };
  // Front/back: feet sit side by side; stride depth shows as a small height shift and the lift.
  const frontLeg = (h: Vec, f: {pos: Vec}, side: 1 | -1) => {
    const foot: Vec = [side * (P.hipW + 6), f.pos[1] * 0.8 + f.pos[0] * 0.05 * (i.view === 'back' ? -1 : 1)];
    const u = P.thigh / (P.thigh + P.shin);
    const knee: Vec = [h[0] + (foot[0] - h[0]) * u + side * 2, h[1] + (foot[1] - h[1]) * u];
    return {knee, foot};
  };
  if (frontal) {
    hip.l = add(pelvis, [-(P.hipW + 4), 0]);
    hip.r = add(pelvis, [P.hipW + 4, 0]);
  }
  const LL = frontal ? frontLeg(hip.l, fl, -1) : leg(hip.l, fl.pos);
  const RL = frontal ? frontLeg(hip.r, fr, 1) : leg(hip.r, fr.pos);

  const hairSwing = clamp(-(i.velocity ?? 0) * 0.035, -28, 28) + Math.sin(i.t * 1.7 + seed) * 3 + (i.walking ? Math.sin(4 * Math.PI * p) * 4 : 0);

  return {
    pelvis, chest, neck, head, headTilt, torsoAngle: lean, pupil,
    shoulder, elbow: {l: L.elbow, r: R.elbow}, hand: {l: L.hand, r: R.hand},
    hip, knee: {l: LL.knee, r: RL.knee}, foot: {l: LL.foot, r: RL.foot},
    footLift: {l: fl.lift, r: fr.lift}, hairSwing, breath,
  };
}

/**
 * Pick the view a camera should see. `heading` is the character's facing and
 * `toCamera` the direction from the character to the camera, both on the ground
 * plane ([x, z]). Within ~40° of the camera axis the front or back is shown.
 */
export function chooseView(heading: Vec, toCamera: Vec, cone = 0.76): View {
  const n = (v: Vec) => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  const [hx, hz] = n(heading);
  const [cx, cz] = n(toCamera);
  const d = hx * cx + hz * cz;
  return d > cone ? 'front' : d < -cone ? 'back' : 'profile';
}
