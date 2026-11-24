import React, {useContext} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Backdrop} from '../engine/Backdrop';
import {Camera} from '../engine/Camera';
import {Character} from '../engine/Character';
import {GROUND, useLayout} from '../engine/layout';
import {Caption, SceneFades, Subtitles} from '../engine/overlays';
import {isTalking, lastSpeaker, NARRATOR} from '../engine/speech';
import {FrozenFrame, keyframes, move, step, stepInfo, tween, useTime} from '../engine/time';
import type {CompiledEpisode, CompiledScene} from './compile';
import type {FocusSpec} from './types';

/** Plays a compiled ToonScript. Works at any size: 16:9, 9:16 or a thumbnail. */
export const ScriptEpisode: React.FC<{episode: CompiledEpisode}> = ({episode}) => {
  const {t, fps} = useTime();
  const {vertical} = useLayout();
  const isThumbnail = useContext(FrozenFrame) !== null;
  const scene = episode.scenes.find((s) => t >= s.start && t < s.end) ?? episode.scenes[episode.scenes.length - 1];
  const showSubs =
    !isThumbnail &&
    (episode.subtitles === 'both' || (episode.subtitles === 'short' && vertical) || (episode.subtitles === 'long' && !vertical));

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scene && <SceneView episode={episode} scene={scene} />}
      {!isThumbnail && episode.captions.map((c, i) => (
        <Caption key={i} text={c.text} style={c.style} start={c.start} end={c.end} accent={episode.accent} />
      ))}
      {showSubs && <Subtitles lines={episode.lines} speakers={episode.speakers} />}
      <SceneFades cuts={episode.scenes.slice(1).map((s) => s.start)} total={episode.duration} />

      {episode.music && <Audio src={staticFile(episode.music.src)} volume={episode.music.volume} loop />}
      {episode.lines.map((l, i) =>
        l.audio ? (
          <Sequence key={`vo${i}`} from={Math.round(l.start * fps)} layout="none">
            <Audio src={staticFile(l.audio)} />
          </Sequence>
        ) : null,
      )}
      {episode.sfx.map((s, i) => (
        <Sequence key={`sfx${i}`} from={Math.round(s.start * fps)} layout="none">
          <Audio src={staticFile(s.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{episode: CompiledEpisode; scene: CompiledScene}> = ({episode, scene}) => {
  const {t} = useTime();
  const {vertical} = useLayout();

  const xOf = (id: string) => {
    const a = scene.actors.find((x) => x.id === id);
    return a ? move(t, a.x).x : undefined;
  };
  const sceneLines = episode.lines.filter((l) => l.start >= scene.start && l.start < scene.end);

  const evalFocus = (f: FocusSpec): number => {
    if (typeof f === 'number') return f;
    if (f === 'center' || (f === 'auto' && !vertical)) return 960;
    if (f === 'speaker' || f === 'auto') {
      const onStage = sceneLines.filter((l) => l.who === NARRATOR || xOf(l.who) !== undefined);
      const sp = lastSpeaker(onStage, t);
      const fallback = scene.actors.length ? xOf(scene.actors[0].id)! : 960;
      if (!sp) return fallback;
      const cur = xOf(sp.who) ?? fallback;
      const prev = sp.previous ? xOf(sp.previous) ?? cur : cur;
      return tween(sp.since, [-0.1, 0.6], [prev, cur]);
    }
    return xOf(f) ?? 960;
  };

  const focus = stepInfo(t, scene.camera.focus);
  const focusX =
    focus.since === Infinity || focus.previous === focus.value
      ? evalFocus(focus.value)
      : tween(focus.since, [0, 0.8], [evalFocus(focus.previous), evalFocus(focus.value)]);
  const camY = step(t, scene.camera.y);

  return (
    <Camera focusX={focusX} focusY={camY ?? undefined} zoom={keyframes(t, scene.camera.zoom)}>
      <Backdrop name={scene.backdrop} tint={scene.tint} />
      {scene.actors.map((a) => {
        const m = move(t, a.x);
        return (
          <Character
            key={a.id}
            design={a.design}
            x={m.x}
            y={GROUND + a.y}
            scale={a.scale}
            facing={step(t, a.facing)}
            walking={m.walking}
            walkPhase={m.walkPhase}
            pose={a.pose}
            expression={a.expression}
            emote={a.emote}
            look={step(t, a.look)}
            talking={isTalking(sceneLines, a.id, t)}
          />
        );
      })}
    </Camera>
  );
};
