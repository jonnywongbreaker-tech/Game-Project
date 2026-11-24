/** Crowd motion: walkers following straight or looping paths at their own pace. Pure. */
import {add, length, normalize, scale, sub, type V3} from './space';

export interface Walk {
  pos: V3;
  heading: V3;
  /** Metres walked (drive the puppet walk cycle with this). */
  distance: number;
}

/** Walk from `a` toward `b` at `speed` m/s, wrapping back to `a` (endless pavement traffic). */
export function walkLoop(a: V3, b: V3, speed: number, t: number, offset = 0): Walk {
  const len = length(sub(b, a));
  const d = (((t * speed + offset) % len) + len) % len;
  const dir = normalize(sub(b, a));
  return {pos: add(a, scale(dir, d)), heading: dir, distance: t * speed + offset};
}
