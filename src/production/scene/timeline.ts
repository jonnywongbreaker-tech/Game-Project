import {add, hex, length, lerp3, rgb, scale, sub, type Camera3, type V3} from '../../kit/space';
import {rotateAxis} from '../../kit/primitives';
import {TIME_EPSILON, type Aim, type Easing, type Entity, type Scene, type State, type Window} from './types';

type Change<T> = {at: number; duration: number; ease: Easing; from: T; to: T};
type Tracks = {[K in keyof State]?: Change<State[K]>[]};
type Sample = State & {id: string; walking: boolean; walked: number};
const axes: V3 = [0, 1, 0];
const radians = (degrees: number) => degrees * Math.PI / 180;
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export function progress(x: number, ease: Easing = 'linear') {
  const k = clamp(x);
  if (ease === 'in') return k ** 3;
  if (ease === 'out') return 1 - (1 - k) ** 3;
  if (ease === 'inOut') return k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
  return k;
}

const defaults = (entity: Entity): State => ({
  position: [0, 0, 0], scale: 1, rotation: 0, color: entity.asset === 'person' ? '#D9503A' : '#A1AABA',
  opacity: 1, visible: true, highlight: 0, pose: 'idle', expression: 'neutral', attach: null,
  ...entity,
});
function blend<T extends State[keyof State]>(a: T, b: T, k: number): T {
  if (typeof a === 'number' && typeof b === 'number') return mix(a, b, k) as T;
  if (Array.isArray(a) && Array.isArray(b)) return lerp3(a, b, k) as T;
  if (typeof a === 'string' && a.startsWith('#') && typeof b === 'string') return hex(lerp3(rgb(a), rgb(b), k)) as T;
  return b;
}

export function compileScene(scene: Scene) {
  const subjects = new Map(scene.entities.map(entity => [entity.id, {base: defaults(entity), tracks: {} as Tracks}]));
  for (const action of [...(scene.actions ?? [])].sort((a, b) => a.at - b.at)) {
    const {base, tracks} = subjects.get(action.target)!;
    const track = <K extends keyof State>(key: K) => {
      const changes = (tracks[key] ??= []) as Change<State[K]>[];
      changes.push({
        at: action.at, duration: action.duration ?? 0, ease: action.ease ?? 'linear',
        from: changes.at(-1)?.to ?? base[key], to: action.set[key]!,
      });
    };
    for (const key of Object.keys(action.set) as (keyof State)[]) track(key);
  }

  function sample(id: string, time: number): Sample {
    const {base, tracks} = subjects.get(id)!;
    const state = {...base};
    const evaluate = <K extends keyof State>(key: K) => {
      for (const change of (tracks[key] ?? []) as Change<State[K]>[]) {
        if (change.at > time + TIME_EPSILON) break;
        if (!change.duration || change.at + change.duration <= time + TIME_EPSILON) {
          state[key] = change.to;
        } else {
          state[key] = blend(change.from, change.to, progress((time - change.at) / change.duration, change.ease));
          break;
        }
      }
    };
    for (const key of Object.keys(tracks) as (keyof State)[]) evaluate(key);
    const motion = tracks.position ?? [];
    const walked = motion.reduce((total, change) => {
      if (!change.duration || change.at > time) return total;
      return total + Math.hypot(change.to[0] - change.from[0], change.to[2] - change.from[2]) * progress((time - change.at) / change.duration, change.ease);
    }, 0);
    const walking = motion.some(change => time >= change.at && time < change.at + change.duration
      && Math.hypot(change.to[0] - change.from[0], change.to[2] - change.from[2]) > 1e-8);
    if (state.attach !== null) {
      const parent = sample(state.attach, time); // Validation permits props attached to people only.
      state.position = add(parent.position, rotateAxis(scale(state.position, parent.scale), axes, radians(parent.rotation)));
      state.rotation += parent.rotation;
      state.visible &&= parent.visible;
      state.opacity *= parent.opacity;
    }
    return {...state, id, walking, walked};
  }

  const keys = [{at: 0, position: scene.camera.position, target: scene.camera.target,
    fov: scene.camera.fov ?? 42, roll: scene.camera.roll ?? 0, ease: 'linear' as Easing}];
  for (const key of scene.camera.keys ?? []) keys.push({...keys.at(-1)!, ...key, ease: key.ease ?? 'linear'});
  const aim = (target: Aim, time: number) =>
    Array.isArray(target) ? target : add(sample(target.subject, time).position, target.offset ?? [0, 0, 0]);
  function camera(time: number): Camera3 {
    const index = keys.findIndex(key => key.at > time);
    const a = index < 0 ? keys.at(-1)! : keys[index - 1];
    const b = index < 0 ? a : keys[index];
    const k = index < 0 ? 0 : progress((time - a.at) / (b.at - a.at), b.ease);
    const pos = lerp3(a.position, b.position, k);
    const target = lerp3(aim(a.target, time), aim(b.target, time), k);
    if (length(sub(pos, target)) < 1e-6) throw new Error(`Camera coincides with its target at ${time.toFixed(3)}s`);
    return {pos, target, fov: mix(a.fov, b.fov, k), roll: mix(a.roll, b.roll, k)};
  }
  return {sample, camera};
}

export function overlayProgress(overlay: Window, time: number) {
  const at = overlay.at ?? 0;
  if (time < at || (overlay.until !== undefined && time >= overlay.until)) return 0;
  return overlay.reveal ? progress((time - at) / overlay.reveal) : 1;
}
