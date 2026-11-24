import {activeLine} from '../engine/speech';
import {ease, move, tween, useTime} from '../engine/time';
import {camera, chartState, growth, HERO, light, NARRATION, sunPos, TITLE, treeGeometry} from './bench';

/** Everything a style needs for the current frame, computed once from the shared choreography. */
export function useBench() {
  const {t, frame} = useTime();
  const hero = move(t, HERO.x);
  const line = activeLine(NARRATION, t, 0.25);
  return {
    t,
    frame,
    cam: camera(t),
    hero,
    tree: treeGeometry(growth(t)),
    chart: chartState(t),
    sun: sunPos(t),
    light: light(t),
    line,
    lineIn: line ? tween(t - line.start, [0, 0.25], [0, 1], ease.out) * tween(t, [line.end + 0.05, line.end + 0.25], [1, 0]) : 0,
    title: (i: number) => tween(t, [TITLE.start + i * 0.25, TITLE.start + 0.7 + i * 0.25], [0, 1], ease.out),
  };
}

export const FULL = {x: -1400, y: -1000, width: 4720, height: 3200};
