import {createContext, useContext} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** Pins engine time to a fixed frame (used for thumbnails). */
export const FrozenFrame = createContext<number | null>(null);

/** Everything in the engine is authored in SECONDS, not frames. */
export const useTime = () => {
  const live = useCurrentFrame();
  const frozen = useContext(FrozenFrame);
  const frame = frozen ?? live;
  const {fps, durationInFrames} = useVideoConfig();
  return {frame, fps, t: frame / fps, duration: durationInFrames / fps};
};

export type EasingFn = (n: number) => number;

export const ease = {
  linear: Easing.linear,
  inOut: Easing.inOut(Easing.cubic),
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  back: Easing.out(Easing.back(1.7)),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1.2),
} satisfies Record<string, EasingFn>;

/** Animate a number from `a` to `b` between seconds t0 and t1 (clamped). */
export function tween(
  t: number,
  [t0, t1]: [number, number],
  [a, b]: [number, number],
  easing: EasingFn = ease.inOut,
): number {
  if (t1 <= t0) return t >= t1 ? b : a;
  return interpolate(t, [t0, t1], [a, b], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** [timeInSeconds, value] */
export type Keyframe<T> = readonly [number, T];

/** Smoothly interpolate through numeric keyframes. */
export function keyframes(t: number, keys: readonly Keyframe<number>[], easing: EasingFn = ease.inOut): number {
  if (keys.length === 0) throw new Error('keyframes() needs at least one key');
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    if (t < t1) return tween(t, [t0, t1], [a, b], easing);
  }
  return keys[keys.length - 1][1];
}

/** Hold values: returns the value of the latest key whose time has passed. */
export function step<T>(t: number, keys: readonly Keyframe<T>[]): T {
  return stepInfo(t, keys).value;
}

/** Like step(), but also reports when the value last changed and what it was before. */
export function stepInfo<T>(t: number, keys: readonly Keyframe<T>[]) {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (t >= keys[k][0]) i = k;
  return {
    value: keys[i][1],
    since: Math.max(0, t - keys[i][0]),
    previous: i > 0 ? keys[i - 1][1] : keys[i][1],
  };
}

/** Accept either a fixed value or a timeline of [seconds, value] keys. */
export type Timed<T> = T | readonly Keyframe<T>[];

export function isTimeline<T>(v: Timed<T>): v is readonly Keyframe<T>[] {
  return Array.isArray(v) && (v.length === 0 || Array.isArray(v[0]));
}

export function resolveTimed<T>(t: number, v: Timed<T>) {
  return isTimeline(v) ? stepInfo(t, v) : {value: v, since: Infinity, previous: v};
}

/** Sine oscillation: freq in Hz, amp in units. */
export const wave = (t: number, freq: number, amp: number, phase = 0) =>
  Math.sin((t * freq + phase) * Math.PI * 2) * amp;

/** Decaying camera shake starting at `start` for `dur` seconds. */
export function shake(t: number, start: number, dur: number, amp: number) {
  if (t < start || t > start + dur) return {x: 0, y: 0};
  const k = 1 - (t - start) / dur;
  return {x: Math.sin(t * 93) * amp * k, y: Math.cos(t * 71) * amp * k};
}

/** Pop-in scale (0 → overshoot → 1) over `dur` seconds after `since`. */
export const popIn = (since: number, dur = 0.35) => tween(since, [0, dur], [0, 1], ease.back);

/**
 * Move along x keyframes. Returns x plus `walking`, `facing` and `walkPhase`
 * (cumulative distance in strides) so the Character's legs stay in sync with
 * the distance travelled — no foot sliding.
 */
export function move(t: number, keys: readonly Keyframe<number>[], easing: EasingFn = ease.inOut) {
  const x = keyframes(t, keys, easing);
  let walking = false;
  let facing: 1 | -1 | undefined;
  let distance = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    if (a === b || t < t0) continue;
    facing = b > a ? 1 : -1;
    if (t < t1) {
      walking = true;
      distance += Math.abs(x - a);
    } else {
      distance += Math.abs(b - a);
    }
  }
  return {x, walking, facing, walkPhase: distance / 230};
}
