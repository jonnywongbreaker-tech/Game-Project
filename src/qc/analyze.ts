/**
 * Quality control for compiled episodes. Separate from the compiler: the compiler
 * answers "can this render?", QC answers "will this look and read well?".
 * Pure functions; runs in Node via `npm run check` and in unit tests.
 */
import {actorX, cameraAt, visibleWindow} from '../script/cameraPath';
import type {CompiledEpisode, CompiledScene, Issue} from '../script/compile';
import {CHARACTER_HALF_WIDTH, CHARACTER_HEIGHT} from '../engine/proportions';
import {isTalking} from '../engine/speech';
import {move} from '../engine/time';
import {GESTURES} from '../engine/vocab';

export interface QcMetrics {
  duration: number;
  scenes: number;
  /** Camera changes + captions + scene cuts per minute ("visual events"). */
  visualEventsPerMin: number;
  /** Longest stretch without a visual event, seconds. */
  longestStaticShot: number;
  wordsPerMin: number;
  /** Share of runtime with someone speaking (0..1). */
  speechCoverage: number;
  distinctPoses: number;
  /** Authored beats per minute of output: a proxy for manual effort. */
  beatsPerMin: number;
}

export interface QcReport {
  issues: Issue[];
  metrics: QcMetrics;
}

const SAMPLE = 0.2;
const MIN_GAP = 160;
const MAX_WALK_SPEED = 650;

export function analyzeEpisode(ep: CompiledEpisode, opts: {beats?: number} = {}): QcReport {
  const issues: Issue[] = [];
  const warn = (where: string, message: string) => issues.push({level: 'warning', where, message});
  const err = (where: string, message: string) => issues.push({level: 'error', where, message});
  const at = (t: number) => `${t.toFixed(1)}s`;

  for (const scene of ep.scenes) {
    const sw = `scene ${scene.index + 1}`;
    checkOverlap(scene, sw, warn);
    checkFraming(ep, scene, sw, warn);
    checkMovement(scene, sw, warn);
  }

  // ---- Text readability -----------------------------------------------------
  ep.lines.forEach((l, i) => {
    const dur = l.end - l.start;
    const wps = l.words.length / dur;
    if (wps > 4.2) warn(`line ${i + 1} @${at(l.start)}`, `Speech is fast (${wps.toFixed(1)} words/s); viewers can't read subtitles above ~4.`);
    if (l.text.length > 90) warn(`line ${i + 1} @${at(l.start)}`, `${l.text.length} characters wraps to 3+ lines in Shorts; split it.`);
  });
  ep.captions.forEach((c, i) => {
    const dur = c.end - c.start;
    const needed = 0.6 + c.text.split(/\s+/).length * 0.25;
    if (dur < needed) warn(`caption ${i + 1} @${at(c.start)}`, `"${c.text}" is on screen ${dur.toFixed(1)}s; needs ~${needed.toFixed(1)}s to read.`);
  });

  // ---- Sync -------------------------------------------------------------------
  const frame = 1 / ep.fps;
  for (let i = 1; i < ep.lines.length; i++) {
    const a = ep.lines[i - 1];
    const b = ep.lines[i];
    if (b.start < a.end - frame) warn(`line ${i + 1} @${at(b.start)}`, `Overlaps the previous line by ${(a.end - b.start).toFixed(2)}s.`);
  }
  for (const s of ep.sfx) {
    if (s.start > ep.duration) err('sfx', `"${s.src}" starts after the episode ends.`);
  }

  // ---- Repetition -------------------------------------------------------------
  for (const scene of ep.scenes) {
    for (const a of scene.actors) {
      const gestures = a.pose.filter(([, p]) => GESTURES.includes(p));
      for (let i = 0; i + 3 < gestures.length; i++) {
        const window = gestures.slice(i, i + 4);
        if (window.every(([, p]) => p === window[0][1]) && window[3][0] - window[0][0] < 25) {
          warn(`scene ${scene.index + 1} ${a.id}`, `"${window[0][1]}" used 4 times within 25s from ${at(window[0][0])}; vary the gesture.`);
          break;
        }
      }
    }
  }
  for (let i = 1; i < ep.scenes.length; i++) {
    if (ep.scenes[i].backdrop === ep.scenes[i - 1].backdrop && ep.scenes[i].backdrop !== 'studio') {
      warn(`scene ${i + 1}`, `Same backdrop as the previous scene ("${ep.scenes[i].backdrop}"); a cut usually wants a new look.`);
    }
  }

  // ---- Metrics ------------------------------------------------------------------
  const events = [
    ...ep.scenes.map((s) => s.start),
    ...ep.scenes.flatMap((s) => [...s.camera.zoom.map((k) => k[0]), ...s.camera.focus.map((k) => k[0])]),
    ...ep.captions.map((c) => c.start),
    ...ep.lines.map((l) => l.start),
  ].sort((a, b) => a - b);
  let longest = 0;
  for (let i = 1; i < events.length; i++) longest = Math.max(longest, events[i] - events[i - 1]);
  longest = Math.max(longest, ep.duration - (events[events.length - 1] ?? 0));
  const visualEvents = new Set(
    [...ep.scenes.flatMap((s) => [...s.camera.zoom.map((k) => k[0]), ...s.camera.focus.map((k) => k[0])]), ...ep.captions.map((c) => c.start)].map((t) => t.toFixed(2)),
  ).size;
  const words = ep.lines.reduce((n, l) => n + l.words.length, 0);
  const talk = ep.lines.reduce((n, l) => n + (l.end - l.start), 0);
  const poses = new Set(ep.scenes.flatMap((s) => s.actors.flatMap((a) => a.pose.map(([, p]) => p))));
  const minutes = ep.duration / 60;

  return {
    issues,
    metrics: {
      duration: ep.duration,
      scenes: ep.scenes.length,
      visualEventsPerMin: visualEvents / minutes,
      longestStaticShot: longest,
      wordsPerMin: words / minutes,
      speechCoverage: talk / ep.duration,
      distinctPoses: poses.size,
      beatsPerMin: (opts.beats ?? 0) / minutes,
    },
  };
}

/** Characters standing inside each other. */
function checkOverlap(scene: CompiledScene, sw: string, warn: (w: string, m: string) => void) {
  const reported = new Set<string>();
  for (let t = scene.start; t < scene.end; t += SAMPLE) {
    for (let i = 0; i < scene.actors.length; i++) {
      for (let j = i + 1; j < scene.actors.length; j++) {
        const a = scene.actors[i];
        const b = scene.actors[j];
        const gap = Math.abs(move(t, a.x).x - move(t, b.x).x);
        const key = `${a.id}-${b.id}`;
        if (gap < MIN_GAP && !reported.has(key)) {
          reported.add(key);
          warn(sw, `"${a.id}" and "${b.id}" overlap at ${t.toFixed(1)}s (${Math.round(gap)} apart; keep 300+).`);
        }
      }
    }
  }
}

/** Speakers must be on screen and not cropped, in both formats. */
function checkFraming(ep: CompiledEpisode, scene: CompiledScene, sw: string, warn: (w: string, m: string) => void) {
  const reported = new Set<string>();
  for (const vertical of [false, true]) {
    const fmt = vertical ? 'Short' : 'long';
    for (let t = scene.start; t < scene.end; t += SAMPLE) {
      const win = visibleWindow(cameraAt(ep, scene, t, vertical), vertical);
      for (const a of scene.actors) {
        if (!isTalking(ep.lines, a.id, t)) continue;
        const x = actorX(scene, a.id, t)!;
        const size = a.scale * (a.design.size ?? 1);
        const halfW = CHARACTER_HALF_WIDTH * size;
        const headTop = 900 + a.y - CHARACTER_HEIGHT * size;
        const key = `${fmt}-${a.id}`;
        if (reported.has(key)) continue;
        if (x + halfW < win.left || x - halfW > win.right) {
          reported.add(key);
          warn(sw, `[${fmt}] "${a.id}" speaks off-screen at ${t.toFixed(1)}s.`);
        } else if (x - halfW < win.left - 1 || x + halfW > win.right + 1) {
          reported.add(key);
          warn(sw, `[${fmt}] "${a.id}" is cut by the frame edge while speaking at ${t.toFixed(1)}s.`);
        } else if (headTop < win.top) {
          reported.add(key);
          warn(sw, `[${fmt}] "${a.id}"'s head is cropped at the top at ${t.toFixed(1)}s (zoom ${cameraAt(ep, scene, t, vertical).zoom.toFixed(2)}).`);
        }
      }
    }
  }
}

/** Walks that are implausibly fast, or poses that flicker. */
function checkMovement(scene: CompiledScene, sw: string, warn: (w: string, m: string) => void) {
  for (const a of scene.actors) {
    for (let i = 1; i < a.x.length; i++) {
      const [t0, x0] = a.x[i - 1];
      const [t1, x1] = a.x[i];
      if (t1 > t0 && Math.abs(x1 - x0) / (t1 - t0) > MAX_WALK_SPEED) {
        warn(sw, `"${a.id}" moves ${Math.round(Math.abs(x1 - x0) / (t1 - t0))} units/s at ${t0.toFixed(1)}s; looks like sliding (max ~${MAX_WALK_SPEED}).`);
      }
    }
    for (let i = 1; i < a.pose.length; i++) {
      const dt = a.pose[i][0] - a.pose[i - 1][0];
      if (dt > 0 && dt < 0.3 && a.pose[i][1] !== a.pose[i - 1][1]) {
        warn(sw, `"${a.id}" changes pose twice within ${dt.toFixed(2)}s at ${a.pose[i][0].toFixed(1)}s; it will flicker.`);
      }
    }
  }
}
