/**
 * The visual-direction benchmark: ONE choreography rendered by three styles.
 * Everything that moves is defined here; the style files only decide how it looks.
 */
import {NARRATOR, type SpeechLine, wordTimings} from '../engine/speech';
import {ease, type Keyframe, keyframes, tween} from '../engine/time';
import type {Expression, Pose} from '../engine/vocab';

export const BENCH_SECONDS = 15;
export const GROUND_Y = 900;
export const TREE_X = 1180;
/** World light direction for shading: -1 = light from the left. */
export const LIGHT_DIR = -1;

export const HERO = {
  x: [[0.3, -150], [3.0, 760]] as Keyframe<number>[],
  pose: [[0, 'idle'], [3.3, 'point'], [6.4, 'idle'], [8.0, 'cheer'], [10.3, 'idle'], [12.0, 'wave'], [14.6, 'idle']] as Keyframe<Pose>[],
  expression: [[0, 'neutral'], [3.3, 'happy'], [8.0, 'laugh'], [10.3, 'happy']] as Keyframe<Expression>[],
};

export const camera = (t: number) => ({
  x: keyframes(t, [[0, 900], [3.0, 900], [5.6, 960], [7.0, 960], [9.0, 1150], [11, 1150], [13.5, 960]]),
  y: keyframes(t, [[0, 540], [3.0, 540], [5.6, 650], [7.0, 650], [9.0, 560], [11, 560], [13.5, 520]]),
  zoom: keyframes(t, [[0, 1], [3.0, 1], [5.6, 1.55], [7.0, 1.55], [9.0, 1.15], [11, 1.15], [13.5, 0.92]]),
});

/** 0 = midday, 1 = golden hour. The sun sits upper-left, so light comes from the left. */
export const light = (t: number) => tween(t, [10.5, 14.5], [0, 1]);

export const sunPos = (t: number): [number, number] => {
  const k = light(t);
  return [430 - k * 160, 180 + k * 360];
};

/** Plant growth 0 (seed) → ~0.22 (sprout) → 1 (full tree). */
export const growth = (t: number) => tween(t, [3.6, 6.2], [0, 0.22], ease.out) + tween(t, [6.6, 10.2], [0, 0.78], ease.inOut);

/** Shared tree geometry so every style grows the same tree. */
export function treeGeometry(g: number) {
  const trunk = Math.max(0, g) * 430;
  const c = Math.max(0, (g - 0.18) / 0.82);
  const top = GROUND_Y - trunk;
  return {
    trunk,
    trunkWidth: 8 + c * 30,
    sproutLeaves: g > 0.02 && c < 0.35 ? Math.min(1, g / 0.12) * (1 - c / 0.35) : 0,
    canopy: [
      {x: TREE_X, y: top - 40 * c, r: 170 * c},
      {x: TREE_X - 120 * c, y: top + 40 * c, r: 115 * c},
      {x: TREE_X + 125 * c, y: top + 30 * c, r: 120 * c},
      {x: TREE_X + 10 * c, y: top + 90 * c, r: 110 * c},
    ],
  };
}

/** Data-driven chart that sits in the world beside the tree. */
export const CHART = {
  x: 1430,
  y: 330,
  w: 400,
  h: 380,
  title: 'Growth',
  appear: 7.2,
  hide: 11.4,
  data: [
    {label: 'Week 1', value: 1},
    {label: 'Week 4', value: 2.6},
    {label: 'Week 12', value: 7.4},
  ],
};

export function chartState(t: number) {
  const show = tween(t, [CHART.appear, CHART.appear + 0.5], [0, 1], ease.out) * tween(t, [CHART.hide - 0.4, CHART.hide], [1, 0]);
  const max = Math.max(...CHART.data.map((d) => d.value));
  const bars = CHART.data.map((d, i) => {
    const k = tween(t, [CHART.appear + 0.4 + i * 0.45, CHART.appear + 1.4 + i * 0.45], [0, 1], ease.out);
    return {...d, k, height: (d.value / max) * (CHART.h - 110) * k, shown: d.value * k};
  });
  return {show, bars};
}

const line = (text: string, start: number, end: number): SpeechLine => ({
  who: NARRATOR, text, start, end, words: wordTimings(text, start, end),
});

export const NARRATION: SpeechLine[] = [
  line('Every big idea starts small.', 0.5, 2.9),
  line('Give it time, and a little attention,', 3.4, 6.3),
  line('and it grows faster than you expect.', 6.7, 10.2),
];

export const TITLE = {lines: ['Small habits.', 'Big results.'], start: 11.4, end: 15};
