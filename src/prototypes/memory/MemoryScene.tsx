import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Layer} from '../../engine/Camera';
import {activeLine} from '../../engine/speech';
import {ease, tween, useTime} from '../../engine/time';
import type {Module} from '../../kit/library';
import {edgeGrowth, edgePulse, hops, nodePulse} from '../../kit/network';
import type {Ctx, Theme} from '../../themes/types';
import {camera, dissolveParticles, EDGES, GROUND, heroAt, LAYOUT, NARRATION, node, ORB_R, orbsAt, RECALL, TITLE} from './scene';

/**
 * Generic renderer: one scene description, any theme. This file knows WHAT is
 * on screen and WHERE; the theme decides how it looks.
 */
export const MemoryScene: React.FC<{theme: Theme}> = ({theme}) => {
  const {t, frame} = useTime();
  const cam = camera(t);
  const ctx: Ctx = {t, frame, zoom: cam.zoom};
  const hero = heroAt(t);
  const orbs = orbsAt(t);
  const dist = hops(EDGES, RECALL.source, t);
  const depths = [...new Set(LAYOUT.map((m) => m.depth))].sort((a, b) => a - b);

  const renderModule = (m: Module, i: number) => {
    const C = theme.modules[m.type] as React.FC<{m: Module; ctx: Ctx}> | undefined;
    return C ? <C key={i} m={m} ctx={ctx} /> : null;
  };

  const stage = (
    <>
      {EDGES.map((e, i) => {
        const g = edgeGrowth(t, e);
        if (g <= 0) return null;
        const da = dist.get(e.a);
        const db = dist.get(e.b);
        const energy = Math.max(nodePulse(t, RECALL, da), nodePulse(t, RECALL, db)) * (da !== undefined && db !== undefined ? 1 : 0);
        return <theme.Link key={i} a={node(e.a)} b={node(e.b)} growth={g} energy={energy} pulse={edgePulse(t, RECALL, da, db)} ctx={ctx} />;
      })}
      {orbs.map((o) => (o.dissolve < 1 ? <theme.Orb key={o.id} {...o} r={ORB_R} ctx={ctx} /> : null))}
      {dissolveParticles(t).map((p, i) => (
        <theme.Particle key={i} {...p} ctx={ctx} />
      ))}
      <theme.Character joints={hero.joints} x={hero.x} groundY={GROUND} facing={hero.facing} expression={hero.expression} ctx={ctx} />
      {hero.carriedOrb && <theme.Orb x={hero.carriedOrb[0]} y={hero.carriedOrb[1]} r={ORB_R} glow={0.75} pulse={0} fade={0} dissolve={0} squash={0} carried ctx={ctx} />}
    </>
  );

  const line = activeLine(NARRATION, t, 0.25);
  const inK = line ? tween(t - line.start, [0, 0.3], [0, 1], ease.out) * tween(t, [line.end + 0.05, line.end + 0.25], [1, 0]) : 0;

  return (
    <AbsoluteFill style={{background: theme.background}}>
      <Camera layered focusX={cam.x} focusY={cam.y} zoom={cam.zoom} defs={<theme.Defs ctx={ctx} />}>
        {depths.map((d) => (
          <Layer key={d} depth={d} filter={theme.layerFilter?.(d)}>
            {LAYOUT.filter((m) => m.depth === d).map(renderModule)}
            {d === 1 && stage}
            {theme.layerOverlay && <theme.layerOverlay depth={d} ctx={ctx} />}
          </Layer>
        ))}
      </Camera>
      <theme.Post ctx={ctx} />
      {line && <theme.Subtitle line={line} t={t} inK={inK} />}
      {t >= TITLE.start && <theme.Title lines={TITLE.lines} t={t} k={(i) => tween(t, [TITLE.start + i * 0.3, TITLE.start + 0.8 + i * 0.3], [0, 1], ease.out)} />}
    </AbsoluteFill>
  );
};
