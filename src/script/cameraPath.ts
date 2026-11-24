/**
 * Where the camera is at time t, and what it can see. Pure functions shared by
 * the renderer (ScriptEpisode) and quality control (src/qc), so QC judges the
 * exact framing that gets rendered.
 */
import {VERTICAL_ZOOM, WORLD} from '../engine/layout';
import {lastSpeaker, NARRATOR} from '../engine/speech';
import {keyframes, move, step, stepInfo, tween} from '../engine/time';
import type {CompiledEpisode, CompiledScene} from './compile';
import type {FocusSpec} from './types';

export const actorX = (scene: CompiledScene, id: string, t: number): number | undefined => {
  const a = scene.actors.find((x) => x.id === id);
  return a ? move(t, a.x).x : undefined;
};

/** The camera starts moving to a new speaker this many seconds before they talk (editors lead the cut). */
export const SPEAKER_LEAD = 0.5;

export function cameraAt(ep: CompiledEpisode, scene: CompiledScene, t: number, vertical: boolean) {
  const sceneLines = ep.lines.filter((l) => l.start >= scene.start && l.start < scene.end);
  const evalFocus = (f: FocusSpec): number => {
    if (typeof f === 'number') return f;
    if (f === 'center' || (f === 'auto' && !vertical)) return WORLD.w / 2;
    if (f === 'speaker' || f === 'auto') {
      const onStage = sceneLines.filter((l) => l.who === NARRATOR || actorX(scene, l.who, t) !== undefined);
      const sp = lastSpeaker(onStage, t + SPEAKER_LEAD);
      const fallback = scene.actors.length ? actorX(scene, scene.actors[0].id, t)! : WORLD.w / 2;
      if (!sp) return fallback;
      const cur = actorX(scene, sp.who, t) ?? fallback;
      const prev = sp.previous ? actorX(scene, sp.previous, t) ?? cur : cur;
      return tween(sp.since, [0, 0.6], [prev, cur]);
    }
    return actorX(scene, f, t) ?? WORLD.w / 2;
  };
  const focus = stepInfo(t, scene.camera.focus);
  const focusX =
    focus.since === Infinity || focus.previous === focus.value
      ? evalFocus(focus.value)
      : tween(focus.since, [0, 0.8], [evalFocus(focus.previous), evalFocus(focus.value)]);
  const y = step(t, scene.camera.y);
  return {focusX, focusY: y ?? (vertical ? 560 : WORLD.h / 2), zoom: keyframes(t, scene.camera.zoom)};
}

/** World-space rectangle visible on screen. */
export function visibleWindow(cam: {focusX: number; focusY: number; zoom: number}, vertical: boolean) {
  // 16:9 shows WORLD.w / zoom units across; 9:16 shows 1080 px at (1920/1080 * VERTICAL_ZOOM * zoom) px per unit.
  const scale = vertical ? (1920 / WORLD.h) * VERTICAL_ZOOM * cam.zoom : cam.zoom;
  const halfW = (vertical ? 1080 : WORLD.w) / 2 / scale;
  const halfH = (vertical ? 1920 : WORLD.h) / 2 / scale;
  return {left: cam.focusX - halfW, right: cam.focusX + halfW, top: cam.focusY - halfH, bottom: cam.focusY + halfH};
}
