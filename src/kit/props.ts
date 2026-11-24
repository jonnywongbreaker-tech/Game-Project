/**
 * Props that can be parented to the world or to a character's hands, with
 * smooth hand-offs. Pure: the caller supplies where hands are at time t.
 */
import {ease, type Keyframe, stepInfo, tween} from '../engine/time';
import type {Vec} from './puppet';

export type Anchor =
  | {kind: 'world'; at: Vec}
  /** Held by one hand, offset in world units. */
  | {kind: 'hand'; side: 'l' | 'r'; offset?: Vec}
  /** Carried between both hands at a body-relative carry point (resolved by the caller). */
  | {kind: 'carry'};

export interface Hands {
  l: Vec;
  r: Vec;
  /** World position of the two-hand carry point. */
  carry: Vec;
}

const resolve = (a: Anchor, h: Hands): Vec => {
  if (a.kind === 'world') return a.at;
  if (a.kind === 'carry') return h.carry;
  const o = a.offset ?? [0, 0];
  return [h[a.side][0] + o[0], h[a.side][1] + o[1]];
};

/** Position of a prop at t. Parent changes blend over `handoff` seconds so objects never pop. */
export function propPosition(t: number, track: readonly Keyframe<Anchor>[], hands: Hands, handoff = 0.2): Vec {
  const s = stepInfo(t, track);
  const cur = resolve(s.value, hands);
  if (s.previous === s.value || s.since >= handoff) return cur;
  const prev = resolve(s.previous, hands);
  const k = tween(s.since, [0, handoff], [0, 1], ease.inOut);
  return [prev[0] + (cur[0] - prev[0]) * k, prev[1] + (cur[1] - prev[1]) * k];
}
