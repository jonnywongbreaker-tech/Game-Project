/**
 * Memory v3 benchmark — four shots, built entirely from reusable kits:
 * procedural architecture (atrium), lighting model, shot sequencer, puppet rig,
 * 3D memory network and particle bursts. This file is CONTENT: what happens,
 * where and when. No drawing.
 */
import {random} from 'remotion';
import {blendedArms} from '../../engine/rig';
import {NARRATOR, type SpeechLine, wordTimings} from '../../engine/speech';
import {ease, type Keyframe, keyframes, step, tween} from '../../engine/time';
import type {Pose} from '../../engine/vocab';
import {atrium, ladder} from '../../kit/architecture';
import {burst, motes} from '../../kit/particles';
import {type Joints, type PuppetInput, solvePuppet, type Vec} from '../../kit/puppet';
import type {Shot} from '../../kit/shots';
import {add, type Light, length, normalize, scale, sub, type V3} from '../../kit/space';
import {ARCHIVIST_PROPORTIONS, type ArchivistExpression, UNITS_PER_M} from '../../themes/cge/Archivist';

export const SECONDS = 18;

// ---------------------------------------------------------------- set
export const ARCH = atrium({
  sides: 8, apothem: 14, levels: 10, levelHeight: 4.6, baysPerWall: 3, oculus: 5, detailLevels: 3, groundShelf: 1.0, seed: 'mind',
  palette: {
    stone: '#5C7884', stoneDark: '#3C5260', recess: '#1E2A33', ledgeTop: '#93A9AD', ledgeFront: '#6F8A93', floor: '#C8B89C',
    floorInlay: '#9E8B6C', brass: '#D9B26A', ceiling: '#41596A', books: ['#8E4E3C', '#C49A5A', '#4F7A74', '#D9CFB8', '#5E6688', '#7A3434', '#A8B4A2'],
  },
});
const LADDER = ladder([-9.2, 0, 10.6], [-8.4, 26, 12.2], normalize([0.55, 0, -0.83]), normalize([0.83, 0, 0.55]), 0.9, {color: '#B8875A', occlusion: 0.9}, 60);
export const POLYS = [...ARCH.polys, ...LADDER];

// ---------------------------------------------------------------- memories
export const ORB_R = 0.1;
const slotKey = (w: number, l: number, b: number) => ARCH.slots.find((s) => s.wall === w && s.level === l && s.bay === b)!;
const NEW_SLOT = slotKey(0, 0, 1);
export const NEW_POS: V3 = [NEW_SLOT.pos[0], NEW_SLOT.pos[1] + 0.1, NEW_SLOT.pos[2]];
const lonelySlot = slotKey(2, 4, 0);
/** The forgotten memory rests on the edge of a balcony, alone. */
export const LONELY_POS: V3 = add(add(lonelySlot.pos, scale(lonelySlot.normal, 0.75)), [0, -0.32 - 0.35 + ORB_R, 0]);

export interface MemoryNode {
  id: string;
  pos: V3;
}
export const NODES: MemoryNode[] = [
  {id: 'new', pos: NEW_POS},
  ...ARCH.slots
    .filter((s) => s !== NEW_SLOT && s !== lonelySlot && random(`orb-${s.wall}-${s.level}-${s.bay}`) < 0.32)
    .map((s) => ({id: `m${s.wall}-${s.level}-${s.bay}`, pos: [s.pos[0], s.pos[1] + 0.02, s.pos[2]] as V3})),
  {id: 'lonely', pos: LONELY_POS},
];
export const node = (id: string) => NODES.find((n) => n.id === id)!;

/** Links: each memory to its two nearest neighbours, plus a few long associations across the void. */
export const LINKS: [string, string][] = (() => {
  const out = new Set<string>();
  const ids = NODES.filter((n) => n.id !== 'lonely');
  for (const a of ids) {
    const near = ids.filter((b) => b !== a).sort((p, q) => length(sub(p.pos, a.pos)) - length(sub(q.pos, a.pos)));
    const k = a.id === 'new' ? 4 : 2;
    near.slice(0, k).forEach((b) => out.add([a.id, b.id].sort().join('|')));
    if (random(`long-${a.id}`) < 0.18) {
      const b = ids[Math.floor(random(`lt-${a.id}`) * ids.length)];
      if (b !== a) out.add([a.id, b.id].sort().join('|'));
    }
  }
  return [...out].map((s) => s.split('|') as [string, string]);
})();

// ---------------------------------------------------------------- edit
export const SHOTS: Shot[] = [
  {
    id: 'archive', label: 'The archive', start: 0, end: 4.6, focus: 'target', blur: {far: 0, near: 0}, handheld: 0.04,
    keys: [
      {t: 0, pos: [-1.4, 0.8, -11.6], target: [0.4, 6, 6], fov: 74, roll: -3},
      {t: 4.6, pos: [-0.6, 2.2, -10.6], target: [0.4, 11, 8], fov: 70, roll: 0},
    ],
  },
  {
    id: 'handle', label: 'A new memory', start: 4.6, end: 9.2, focus: 'target', blur: {far: 9, near: 0}, handheld: 0.006,
    keys: [
      {t: 0, pos: [1.45, 1.5, 12.15], target: [-0.32, 1.42, 13.15], fov: 26},
      {t: 4.6, pos: [1.15, 1.48, 12.42], target: [-0.3, 1.46, 13.22], fov: 21},
    ],
  },
  {
    id: 'reveal', label: 'Connections', start: 9.2, end: 13.8, focus: 'target', blur: {far: 0, near: 0}, easing: ease.inOut,
    keys: [
      {t: 0, pos: [0.05, 1.5, 13.25], target: [NEW_POS[0], NEW_POS[1], NEW_POS[2]], fov: 34},
      {t: 1.7, pos: [0.2, 2.2, 8.0], target: [NEW_POS[0], NEW_POS[1] + 0.4, NEW_POS[2]], fov: 52},
      {t: 4.4, pos: [0, 21, -9.5], target: [0, 15, 8], fov: 80, roll: 2},
    ],
  },
  {
    id: 'forget', label: 'Forgetting', start: 13.8, end: 18, focus: 2, blur: {far: 6, near: 0}, handheld: 0.01,
    keys: [
      {t: 0, pos: add(LONELY_POS, [0.15, 0.35, 1.45]), target: add(LONELY_POS, [-3.2, -0.55, -4.0]), fov: 46},
      {t: 4.2, pos: add(LONELY_POS, [0.05, 0.3, 1.2]), target: add(LONELY_POS, [-3.0, -0.4, -4.0]), fov: 43},
    ],
  },
];

// ---------------------------------------------------------------- the archivist
const U = UNITS_PER_M;
const S1_A: V3 = [-3.8, 0, -0.6];
const S1_B: V3 = [2.4, 0, 1.6];
const STAND: V3 = [-0.42, 0, 12.85];

export interface HeroState {
  visible: boolean;
  pos: V3;
  heading: V3;
  joints: Joints;
  expression: ArchivistExpression;
  velocity: number;
  /** Orb held, in puppet-local units (or null). */
  held: Vec | null;
}

const POSE_S3: Keyframe<Pose>[] = [[0, 'idle'], [1.6, 'present'], [4.2, 'present']];

export function heroAt(t: number): HeroState {
  const carryBase: Vec = [62, -300];
  if (t < 4.6) {
    // shot 1: a tiny figure crossing the floor through the beam of light
    const k = tween(t, [0, 4.6], [0, 1], ease.linear);
    const pos = add(S1_A, scale(sub(S1_B, S1_A), k));
    const dist = length(sub(S1_B, S1_A)) * k;
    const j = solvePuppet({t, arms: blendedArms('idle', t), walking: true, walkPhase: (dist * U) / 230, ik: carry(carryBase), lean: 3, velocity: (length(sub(S1_B, S1_A)) / 4.6) * U, seed: 2}, ARCHIVIST_PROPORTIONS);
    return {visible: true, pos, heading: normalize(sub(S1_B, S1_A)), joints: j, expression: 'neutral', velocity: (length(sub(S1_B, S1_A)) / 4.6) * U, held: carryBase};
  }
  if (t < 9.2) {
    // shot 2: lift the orb into the light, look at it, offer it to the shelf
    const l = t - 4.6;
    const at: Vec = [
      keyframes(l, [[0, carryBase[0]], [1.8, 82], [3.3, 86], [4.4, 140]]),
      keyframes(l, [[0, carryBase[1]], [1.8, -392], [3.3, -398], [4.4, -380]]),
    ];
    const j = solvePuppet({
      t, arms: blendedArms('idle', t), walking: false, walkPhase: 0, ik: carry(at),
      lean: keyframes(l, [[0, 0], [1.8, -3], [3.3, -3], [4.4, 9]]),
      crouch: keyframes(l, [[0, 0.05], [1.8, -0.04], [3.5, -0.04], [4.4, 0.06]]),
      lookAt: [at[0], at[1]], seed: 2,
    }, ARCHIVIST_PROPORTIONS);
    return {visible: true, pos: STAND, heading: [0, 0, 1], joints: j, expression: step(l, [[0, 'neutral'], [1.2, 'wonder'], [3.4, 'content']] as Keyframe<ArchivistExpression>[]), velocity: 0, held: at};
  }
  // shot 3/4: the orb is filed; she steps back and watches the network wake
  const l = t - 9.2;
  const j = solvePuppet({t, arms: blendedArms(POSE_S3, l), walking: false, walkPhase: 0, lookAt: [200, -900], lean: -4, seed: 2}, ARCHIVIST_PROPORTIONS);
  return {visible: t < 13.8, pos: [-0.75, 0, 12.6], heading: [0.25, 0, 1], joints: j, expression: 'wonder', velocity: 0, held: null};
}

const carry = (at: Vec) => ({l: {target: [at[0] - 30, at[1] + 14] as Vec, weight: 1}, r: {target: [at[0] + 6, at[1] + 30] as Vec, weight: 1}});

// ---------------------------------------------------------------- memory state
const RECALL_START = 10.1;
const HOP = 0.2;

/** Hop distance from the new memory through the link graph. */
export const DIST: Map<string, number> = (() => {
  const d = new Map<string, number>([['new', 0]]);
  const q = ['new'];
  while (q.length) {
    const n = q.shift()!;
    for (const [a, b] of LINKS) {
      const o = a === n ? b : b === n ? a : null;
      if (o && !d.has(o)) {
        d.set(o, d.get(n)! + 1);
        q.push(o);
      }
    }
  }
  return d;
})();

/** How lit a memory is: base glow, plus a recall wave that leaves connected memories illuminated. */
export function orbEnergy(id: string, t: number): number {
  if (id === 'lonely') return 0.55 * tween(t, [14.4, 15.9], [1, 0.1]) * (0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7));
  if (id === 'new' && t < 9.2) return 0.9;
  const d = DIST.get(id);
  if (d === undefined) return 0.35;
  const at = RECALL_START + d * HOP;
  return 0.35 + tween(t, [at, at + 0.2], [0, 1.2], ease.out) - tween(t, [at + 0.2, at + 1.4], [0, 0.45]);
}

export function linkEnergy(a: string, b: string, t: number): number {
  const da = DIST.get(a);
  const db = DIST.get(b);
  if (da === undefined || db === undefined) return 0;
  const at = RECALL_START + Math.max(da, db) * HOP;
  return tween(t, [at - HOP, at], [0, 1], ease.out);
}

export const lonelyDissolve = (t: number) => tween(t, [15.9, 17.2], [0, 1], ease.in);
export const lonelyParticles = (t: number) => burst(t, LONELY_POS, 15.9, {count: 90, life: 2.6, spread: 0.7, drift: [-0.08, 0.4, -0.12], size: 0.007, seed: 'lonely'});
export const shaftMotes = (t: number) => motes(t, [0, 0, 0], 4.2, 30, 90, 'shaft');

// ---------------------------------------------------------------- light
export const SKY = {top: '#F3F1EA', mid: '#C9D7DB'};
export function lightsAt(t: number, carriedOrb: V3 | null): Light[] {
  const lights: Light[] = [
    {kind: 'hemisphere', sky: '#C7D8DF', ground: '#7A6855', intensity: 0.74},
    {kind: 'directional', dir: [0.25, -1, 0.35], color: '#FFF3E0', intensity: 0.32},
    {kind: 'spot', pos: [0, ARCH.height + 2, 0], dir: [0, -1, 0], angle: 5.8, softness: 1.6, color: '#FFF0D2', intensity: 1.6},
  ];
  for (const n of NODES) {
    if (n.id === 'new' && t < 9.2) continue;
    const e = orbEnergy(n.id, t);
    if (e > 0.05) lights.push({kind: 'point', pos: n.pos, color: '#FFC56B', intensity: 0.22 * e, range: 1.6});
  }
  if (carriedOrb) lights.push({kind: 'point', pos: carriedOrb, color: '#FFC56B', intensity: 0.5, range: 1.8});
  return lights;
}
export const ATMOSPHERE = {low: '#33475A', high: '#D3DEE0', height: 40, density: 0.022};

// ---------------------------------------------------------------- words
const line = (text: string, start: number, end: number): SpeechLine => ({who: NARRATOR, text, start, end, words: wordTimings(text, start, end)});
export const NARRATION: SpeechLine[] = [
  line('Every experience becomes a memory: handled once, then filed away.', 5.0, 8.8),
  line('Each one is linked to everything you already know.', 9.7, 13.4),
  line('A memory with no connections slowly fades.', 14.3, 16.3),
];
export const TITLE_1 = {kicker: 'How memory works', lines: ['Your mind', 'is a library.'], start: 0.7, end: 4.4};
export const TITLE_END = {lines: ['Connect it.', 'Keep it.'], start: 16.4, end: 18};
