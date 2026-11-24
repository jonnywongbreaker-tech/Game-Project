/**
 * Semantic shot grammar. A director (human or AI) asks for "an establishing
 * shot of the city" or "a close-up on the gear"; these functions turn that into
 * camera keyframes using only subject positions and sizes. No hand-keyed
 * coordinates in scene content.
 */
import {ease} from '../engine/time';
import type {CamKey, Shot} from './shots';
import {add, normalize, scale, sub, type V3} from './space';

/** Something the camera can frame. */
export interface Subject {
  /** Point of interest (centre of what should be framed). */
  pos: V3;
  /** Characteristic size in metres (height of a person, diameter of an object, width of a city). */
  size: number;
  /** Direction the subject faces (used to pick a flattering angle). */
  facing?: V3;
}

interface Base {
  id?: string;
  label: string;
  start: number;
  end: number;
}

const DEG = Math.PI / 180;
/** Distance at which an object of `size` fills `fraction` of the frame height. */
export const frameDistance = (size: number, fov: number, fraction: number) => size / fraction / (2 * Math.tan((fov * DEG) / 2));

/** Camera position around `pos`: azimuth (deg, 0 = along +z), elevation (deg), distance. */
export function orbitPoint(pos: V3, azimuth: number, elevation: number, dist: number): V3 {
  const a = azimuth * DEG;
  const e = elevation * DEG;
  return add(pos, [Math.sin(a) * Math.cos(e) * dist, Math.sin(e) * dist, Math.cos(a) * Math.cos(e) * dist]);
}

const azimuthOf = (v: V3) => Math.atan2(v[0], v[2]) / DEG;

const shot = (b: Base, keys: CamKey[], extra: Partial<Shot> = {}): Shot => ({id: b.id ?? b.label.toLowerCase().replace(/\W+/g, '-'), label: b.label, start: b.start, end: b.end, keys, ...extra});

/** Wide view of a whole place, slowly pushing in (or craning) to orient the viewer. */
export function establishing(b: Base & {stage: Subject; azimuth?: number; elevation?: number; fov?: number; push?: number}): Shot {
  const fov = b.fov ?? 50;
  const d = frameDistance(b.stage.size, fov, 0.9) * 0.6;
  const az = b.azimuth ?? 25;
  const el = b.elevation ?? 22;
  const dur = b.end - b.start;
  return shot(b, [
    {t: 0, pos: orbitPoint(b.stage.pos, az, el, d), target: b.stage.pos, fov},
    {t: dur, pos: orbitPoint(b.stage.pos, az - 6, el - 3, d * (1 - (b.push ?? 0.12))), target: b.stage.pos, fov},
  ], {easing: ease.inOut, handheld: 0.02});
}

/** Tight framing on a subject from a three-quarter angle, with a slow push. */
export function closeUp(b: Base & {subject: Subject; fraction?: number; angle?: number; elevation?: number; fov?: number; blur?: number}): Shot {
  const fov = b.fov ?? 28;
  const d = frameDistance(b.subject.size, fov, b.fraction ?? 0.55);
  const base = b.subject.facing ? azimuthOf(b.subject.facing) : 0;
  const az = base + (b.angle ?? 35);
  const el = b.elevation ?? 6;
  const dur = b.end - b.start;
  return shot(b, [
    {t: 0, pos: orbitPoint(b.subject.pos, az, el, d * 1.12), target: b.subject.pos, fov},
    {t: dur, pos: orbitPoint(b.subject.pos, az - 4, el, d * 0.96), target: b.subject.pos, fov},
  ], {focus: 'target', blur: {far: b.blur ?? 7, near: 0}, handheld: 0.004 * b.subject.size});
}

/** Orbit around an object from tight to medium so it reveals its form. */
export function objectReveal(b: Base & {subject: Subject; orbit?: number; startAzimuth?: number; elevation?: number; fov?: number}): Shot {
  const fov = b.fov ?? 38;
  const d = frameDistance(b.subject.size, fov, 0.7);
  const a0 = b.startAzimuth ?? -40;
  const el = b.elevation ?? 18;
  const dur = b.end - b.start;
  const steps = 6;
  const keys: CamKey[] = Array.from({length: steps + 1}, (_, i) => {
    const k = i / steps;
    return {t: dur * k, pos: orbitPoint(b.subject.pos, a0 + (b.orbit ?? 70) * k, el + 6 * k, d * (0.85 + 0.25 * k)), target: b.subject.pos, fov};
  });
  return shot(b, keys, {easing: ease.linear});
}

/** Camera travels alongside a moving subject, keeping it framed with lead room. */
export function tracking(b: Base & {follow: (t: number) => V3; size: number; side?: number; elevation?: number; fov?: number; lead?: number; mode?: 'side' | 'chase'; distance?: number}): Shot {
  const fov = b.fov ?? 40;
  const d = b.distance ?? frameDistance(b.size, fov, 0.35);
  const dur = b.end - b.start;
  const steps = 8;
  const keys: CamKey[] = Array.from({length: steps + 1}, (_, i) => {
    const tl = (dur * i) / steps;
    const p = b.follow(b.start + tl);
    const ahead = b.follow(b.start + tl + 0.5);
    const dir = normalize(sub(ahead, p));
    const side = normalize([dir[2] * (b.side ?? 1), 0, -dir[0] * (b.side ?? 1)]);
    const up: V3 = [0, d * Math.tan((b.elevation ?? 10) * DEG), 0];
    const pos = b.mode === 'chase' ? add(add(add(p, scale(dir, -d * 0.85)), scale(side, d * 0.35)), up) : add(add(p, scale(side, d)), up);
    return {t: tl, pos, target: add(p, scale(dir, b.size * (b.lead ?? 0.6))), fov};
  });
  return shot(b, keys, {easing: ease.linear, handheld: 0.01 * b.size});
}

/** Insert shot that cuts away to a detail (e.g. inside a machine): straight-on, slow lateral slide. */
export function cutaway(b: Base & {subject: Subject; normal: V3; fov?: number; slide?: number}): Shot {
  const fov = b.fov ?? 34;
  const d = frameDistance(b.subject.size, fov, 0.75);
  const n = normalize(b.normal);
  const side = normalize([n[2], 0, -n[0]]);
  const s = (b.slide ?? 0.15) * b.subject.size;
  const dur = b.end - b.start;
  return shot(b, [
    {t: 0, pos: add(add(b.subject.pos, scale(n, d)), scale(side, -s)), target: add(b.subject.pos, scale(side, -s * 0.5)), fov},
    {t: dur, pos: add(add(b.subject.pos, scale(n, d * 0.94)), scale(side, s)), target: add(b.subject.pos, scale(side, s * 0.5)), fov},
  ], {easing: ease.inOut});
}

/** Dramatic change of scale: from tight on something small to a wide view of something vast. */
export function scaleTransition(b: Base & {from: Subject; to: Subject; azimuth?: number; fromFov?: number; toFov?: number; elevation?: number}): Shot {
  const f0 = b.fromFov ?? 30;
  const f1 = b.toFov ?? 60;
  const az = b.azimuth ?? 20;
  const d0 = frameDistance(b.from.size, f0, 0.6);
  const d1 = frameDistance(b.to.size, f1, 0.85);
  const dur = b.end - b.start;
  const steps = 5;
  const keys: CamKey[] = Array.from({length: steps + 1}, (_, i) => {
    const k = i / steps;
    const e = k * k * (3 - 2 * k);
    const target = add(scale(b.from.pos, 1 - e), scale(b.to.pos, e));
    const dist = d0 * Math.pow(d1 / d0, e);
    return {t: dur * k, pos: orbitPoint(target, az + 10 * e, 5 * (1 - e) + (b.elevation ?? 25) * e, dist), target, fov: f0 + (f1 - f0) * e};
  });
  return shot(b, keys, {easing: ease.linear});
}
