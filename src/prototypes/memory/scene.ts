/**
 * "How memory works" — benchmark content. Layout, choreography, camera and
 * narration as data + pure functions of time. Contains NO drawing: each
 * visual theme renders this same state.
 */
import {random} from 'remotion';
import {type Keyframe, ease, keyframes, move, step, stepInfo, tween} from '../../engine/time';
import {blendedArms} from '../../engine/rig';
import {NARRATOR, type SpeechLine, wordTimings} from '../../engine/speech';
import type {Expression, Pose} from '../../engine/vocab';
import {type Module, type ShelfSpec, slotOf} from '../../kit/library';
import {type Activation, type GraphEdge, type GraphNode, hops} from '../../kit/network';
import {type Anchor, propPosition} from '../../kit/props';
import {type Joints, type PuppetInput, solvePuppet, toLocal, toWorld, type Vec} from '../../kit/puppet';

export const SECONDS = 15;
export const GROUND = 900;
export const ORB_R = 26;

export const MAIN_SHELF: ShelfSpec = {
  x: 1080, y: 300, w: 580, h: 600, rows: 4, cols: 5, seed: 'main',
  reserved: ['0,0', '1,1', '1,3', '2,0', '3,2', '2,4', '0,4'],
};

const orbAt = (row: number, col: number): [number, number] => {
  const s = slotOf(MAIN_SHELF, row, col);
  return [s.rest[0], s.rest[1] - ORB_R];
};

export const NODES: GraphNode[] = [
  {id: 'new', ...xy(orbAt(1, 1))},
  {id: 'a', ...xy(orbAt(0, 0))},
  {id: 'b', ...xy(orbAt(1, 3))},
  {id: 'c', ...xy(orbAt(2, 0))},
  {id: 'd', ...xy(orbAt(3, 2))},
  {id: 'e', ...xy(orbAt(2, 4))},
  {id: 'lonely', ...xy(orbAt(0, 4))},
];
function xy([x, y]: [number, number]) {
  return {x, y};
}
export const node = (id: string) => NODES.find((n) => n.id === id)!;

export const EDGES: GraphEdge[] = [
  {a: 'a', b: 'c', grow: [-2, -1]},
  {a: 'b', b: 'd', grow: [-2, -1]},
  {a: 'c', b: 'd', grow: [-2, -1]},
  {a: 'b', b: 'e', grow: [-2, -1]},
  {a: 'new', b: 'a', grow: [4.7, 5.5]},
  {a: 'new', b: 'b', grow: [5.0, 5.9]},
  {a: 'new', b: 'c', grow: [5.3, 6.2]},
];
export const RECALL: Activation = {source: 'new', start: 7.5, hop: 0.45};

/** Scene layout: modules at parallax depths. */
export const LAYOUT: Module[] = [
  {type: 'backdrop', depth: 0.15},
  {type: 'window', depth: 0.3, x: 160, y: 60, w: 230, h: 580},
  {type: 'window', depth: 0.3, x: 860, y: 60, w: 230, h: 580},
  {type: 'window', depth: 0.3, x: 1560, y: 60, w: 230, h: 580},
  {type: 'shelf', depth: 0.45, spec: {x: -420, y: 250, w: 460, h: 760, rows: 5, cols: 4, seed: 'far1'}},
  {type: 'shelf', depth: 0.45, spec: {x: 440, y: 250, w: 360, h: 760, rows: 5, cols: 3, seed: 'far2'}},
  {type: 'shelf', depth: 0.45, spec: {x: 1150, y: 250, w: 360, h: 760, rows: 5, cols: 3, seed: 'far3'}},
  {type: 'shelf', depth: 0.45, spec: {x: 1850, y: 250, w: 460, h: 760, rows: 5, cols: 4, seed: 'far4'}},
  {type: 'lamp', depth: 0.75, x: 560, y: 250, cord: 500},
  {type: 'lamp', depth: 0.75, x: 1560, y: 170, cord: 420},
  {type: 'floor', depth: 1},
  {type: 'rug', depth: 1, x: 600, w: 1000},
  {type: 'table', depth: 1, x: 300, w: 240, seed: 't1'},
  {type: 'plant', depth: 1, x: 70, scale: 1.1},
  {type: 'shelf', depth: 1, spec: MAIN_SHELF},
  {type: 'ladder', depth: 1, x: 1720, topY: 290, lean: 14},
  {type: 'column', depth: 1.55, x: -170, w: 230},
  {type: 'bookstack', depth: 1.45, x: 1780, y: 1030, seed: 'fg', count: 7},
];

// ---------------------------------------------------------------------------
// Choreography
// ---------------------------------------------------------------------------

const HERO_X: Keyframe<number>[] = [[0, -240], [3.0, 1150], [4.9, 1150], [5.7, 1030]];
/** Constant walking pace (feet stay in sync at any speed); the anticipation lean absorbs the stop. */
const walk = (t: number) => move(t, HERO_X, t < 3.5 ? ease.linear : ease.inOut);
const POSE: Keyframe<Pose>[] = [[0, 'idle'], [11.4, 'cheer'], [13.2, 'idle']];
export const EXPRESSION: Keyframe<Expression>[] = [[0, 'neutral'], [1.2, 'happy'], [3.1, 'neutral'], [4.3, 'happy'], [9.4, 'surprised'], [10.2, 'sad'], [11.2, 'happy'], [11.6, 'laugh'], [13.4, 'happy']];

/** Where the orb is placed and where the hand must be to put it there. */
const SLOT_CENTER: Vec = [node('new').x, node('new').y];
const HAND_OFFSET: Vec = [6, 24];
const CARRY_LOCAL: Vec = [62, -298];

const ORB_TRACK: Keyframe<Anchor>[] = [
  [0, {kind: 'carry'}],
  [3.25, {kind: 'hand', side: 'r', offset: [-HAND_OFFSET[0], -HAND_OFFSET[1]]}],
  [4.2, {kind: 'world', at: SLOT_CENTER}],
];

export interface HeroState {
  x: number;
  facing: 1 | -1;
  walking: boolean;
  joints: Joints;
  expression: Expression;
  /** Where the carried orb is (world), or null once placed. */
  carriedOrb: Vec | null;
  velocity: number;
}

export function heroAt(t: number): HeroState {
  const m = walk(t);
  const facing: 1 | -1 = 1; // the step back at 4.9s is a backwards step, still facing the shelf
  const vel = ((walk(t + 0.05).x - walk(t - 0.05).x) / 0.1) * facing;
  const local = (w: Vec) => toLocal(w, m.x, GROUND, facing);

  // carry → reach → place → release → point → cheer
  const carry = CARRY_LOCAL;
  const carryW = toWorld(carry, m.x, GROUND, facing);
  const reachTarget = local([SLOT_CENTER[0] + HAND_OFFSET[0], SLOT_CENTER[1] + HAND_OFFSET[1]]);
  const reachK = tween(t, [3.3, 4.2], [0, 1], ease.inOut);
  const rTarget: Vec = [
    carry[0] + 22 + (reachTarget[0] - carry[0] - 22) * reachK,
    carry[1] + 6 + (reachTarget[1] - carry[1] - 6) * reachK,
  ];
  const pointTarget = local([node('new').x - 40, node('new').y - 30]);
  const pointK = tween(t, [7.15, 7.55], [0, 1], ease.out) * tween(t, [8.6, 9.1], [1, 0], ease.inOut);
  const rWeight = Math.max(tween(t, [4.4, 4.9], [1, 0], ease.inOut), pointK);
  const finalR: Vec = pointK > 0 && t > 6 ? pointTarget : rTarget;

  const lookTargets: Keyframe<Vec | null>[] = [
    [0, null],
    [2.6, local(SLOT_CENTER)],
    [4.6, local([1330, 470])],
    [7.1, local([node('new').x, node('new').y])],
    [9.2, local([node('lonely').x, node('lonely').y])],
    [11.0, local([1330, 470])],
  ];

  const input: PuppetInput = {
    t,
    arms: blendedArms(POSE, t),
    walking: m.walking,
    walkPhase: m.walkPhase,
    lean: keyframes(t, [[0, 2], [2.9, 2], [3.25, -6], [3.9, 11], [4.3, 10], [5.0, 0], [7.2, 0], [7.5, 4], [9.0, 0], [11.4, -4], [12, 0]]),
    crouch: keyframes(t, [[0, 0], [2.95, 0], [3.25, 0.18], [3.9, -0.06], [4.3, -0.06], [4.8, 0], [11.3, 0], [11.45, 0.2], [11.7, -0.05], [12.2, 0]]),
    ik: {
      l: {target: [carry[0] - 22, carry[1] + 6], weight: tween(t, [3.25, 3.7], [1, 0], ease.inOut)},
      r: {target: finalR, weight: rWeight},
    },
    lookAt: step(t, lookTargets) ?? undefined,
    velocity: vel,
    seed: 3,
  };
  const joints = solvePuppet(input);
  const handW = (side: 'l' | 'r') => toWorld(joints.hand[side], m.x, GROUND, facing);
  const orb = propPosition(t, ORB_TRACK, {l: handW('l'), r: handW('r'), carry: carryW});
  const placed = stepInfo(t, ORB_TRACK).value.kind === 'world' && t >= 4.4;
  return {
    x: m.x, facing, walking: m.walking, joints, velocity: vel,
    expression: step(t, EXPRESSION),
    carriedOrb: placed ? null : orb,
  };
}

export interface OrbState {
  id: string;
  x: number;
  y: number;
  /** 0..1 base glow. */
  glow: number;
  /** Extra brightness from recall. */
  pulse: number;
  /** 0..1 how faded (forgotten). */
  fade: number;
  /** 0..1 dissolving into particles. */
  dissolve: number;
  /** Squash for the "settle" when placed. */
  squash: number;
}

export function orbsAt(t: number): OrbState[] {
  const dist = hops(EDGES, RECALL.source, t);
  return NODES.filter((n) => n.id !== 'new' || t >= 4.2).map((n) => {
    const d = dist.get(n.id);
    const at = d === undefined ? Infinity : RECALL.start + d * RECALL.hop;
    const pulse = t < at ? 0 : tween(t, [at, at + 0.15], [0, 1], ease.out) * tween(t, [at + 0.4, at + 2.2], [1, 0.35]);
    const fade = n.id === 'lonely' ? tween(t, [8.6, 11], [0, 0.85]) : 0;
    const dissolve = n.id === 'lonely' ? tween(t, [11, 13], [0, 1], ease.in) : 0;
    const settle = n.id === 'new' ? Math.sin(Math.min(1, (t - 4.2) / 0.5) * Math.PI) * 0.18 * (t < 4.7 ? 1 : 0) : 0;
    const glow = n.id === 'new' ? tween(t, [4.2, 4.8], [0.7, 1]) : 0.6;
    return {id: n.id, x: n.x, y: n.y, glow, pulse, fade, dissolve, squash: settle};
  });
}

/** Particles released when the lonely orb dissolves. */
export function dissolveParticles(t: number) {
  const o = node('lonely');
  const k = tween(t, [11, 14.5], [0, 1], ease.out);
  if (k <= 0) return [];
  return Array.from({length: 28}).map((_, i) => {
    const ang = -Math.PI / 2 + (random(`pa${i}`) - 0.5) * 2.2;
    const dist = (40 + random(`pd${i}`) * 200) * k;
    return {
      x: o.x + Math.cos(ang) * dist + Math.sin(t * 2 + i) * 6,
      y: o.y + Math.sin(ang) * dist - k * 60,
      r: (2 + random(`pr${i}`) * 4) * (1 - k * 0.6),
      a: (1 - k) * (0.6 + random(`po${i}`) * 0.4),
    };
  });
}

export const camera = (t: number) => ({
  x: keyframes(t, [[0, 700], [3.0, 980], [4.5, 1150], [7.0, 1270], [11, 1270], [13.5, 980]]),
  y: keyframes(t, [[0, 540], [3, 540], [4.5, 520], [7, 520], [11, 520], [13.5, 520]]),
  zoom: keyframes(t, [[0, 1.05], [3, 1.05], [4.5, 1.3], [7, 1.55], [11, 1.55], [13.5, 1.0]]),
});

const line = (text: string, start: number, end: number): SpeechLine => ({who: NARRATOR, text, start, end, words: wordTimings(text, start, end)});
export const NARRATION: SpeechLine[] = [
  line('Every memory you make gets filed away...', 0.4, 2.9),
  line('...and linked to the things you already know.', 3.4, 6.6),
  line('The more links it has, the easier it is to find.', 7.0, 10.8),
];
export const TITLE = {lines: ['Connect it.', 'Keep it.'], start: 11.4, end: 15};

/** Lights shared by all themes: positions and colours; each theme decides how to render them. */
export const LIGHTS = {
  moon: {dir: [0.35, 1] as Vec, color: '#9FB8FF'},
  lamps: [{x: 560, y: 250}, {x: 1560, y: 170}],
};
