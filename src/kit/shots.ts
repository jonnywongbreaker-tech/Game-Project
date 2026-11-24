/**
 * Shot sequencer: an edit as data. Each shot owns a time range, camera
 * keyframes (in shot-local seconds), lens focus and an optional handheld drift.
 * Reusable for any 3D (Space) scene.
 */
import {ease, type EasingFn, tween} from '../engine/time';
import {type Camera3, length, lerp3, sub, type V3} from './space';

export interface CamKey {
  t: number;
  pos: V3;
  target: V3;
  fov: number;
  roll?: number;
}

export interface Shot {
  id: string;
  /** Editorial label, e.g. "01 · The archive". */
  label: string;
  start: number;
  end: number;
  keys: CamKey[];
  easing?: EasingFn;
  /** Focus distance (m) or 'target' (focus on what the camera looks at). */
  focus?: number | 'target';
  /** Depth-of-field strength: blur radius in px for the far and near bands. */
  blur?: {far: number; near: number};
  /** Subtle handheld drift in metres. */
  handheld?: number;
}

export function shotAt(shots: Shot[], t: number) {
  let i = shots.findIndex((s) => t >= s.start && t < s.end);
  if (i < 0) i = t < shots[0].start ? 0 : shots.length - 1;
  return {shot: shots[i], index: i, local: t - shots[i].start};
}

export function cameraAt(shot: Shot, local: number): Camera3 & {focus: number} {
  const keys = shot.keys;
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (local >= keys[i].t && local <= keys[i + 1].t) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const k = local <= keys[0].t ? 0 : local >= keys[keys.length - 1].t ? 1 : tween(local, [a.t, b.t], [0, 1], shot.easing ?? ease.inOut);
  const A = local <= keys[0].t ? keys[0] : local >= keys[keys.length - 1].t ? b : a;
  const Bk = local <= keys[0].t ? keys[0] : b;
  const h = shot.handheld ?? 0;
  const drift: V3 = [Math.sin(local * 0.9) * h, Math.sin(local * 1.3 + 1) * h * 0.6, Math.cos(local * 0.7) * h * 0.5];
  const pos = lerp3(A.pos, Bk.pos, k);
  const target: V3 = lerp3(A.target, Bk.target, k).map((v, i) => v + drift[i]) as V3;
  const focus = shot.focus === undefined || shot.focus === 'target' ? length(sub(target, pos)) : shot.focus;
  return {pos, target, fov: A.fov + (Bk.fov - A.fov) * k, roll: (A.roll ?? 0) + ((Bk.roll ?? 0) - (A.roll ?? 0)) * k, focus};
}
