import React, {useContext} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Backdrop} from '../engine/Backdrop';
import {Camera} from '../engine/Camera';
import {Character} from '../engine/Character';
import {GROUND, useLayout} from '../engine/layout';
import {Caption, SceneFades, Subtitles} from '../engine/overlays';
import {isTalking} from '../engine/speech';
import {FrozenFrame, move, step, useTime} from '../engine/time';
import {cameraAt} from './cameraPath';
import type {CompiledEpisode, CompiledScene} from './compile';

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
  const cam = cameraAt(episode, scene, t, vertical);
  const sceneLines = episode.lines.filter((l) => l.start >= scene.start && l.start < scene.end);

  return (
    <Camera focusX={cam.focusX} focusY={cam.focusY} zoom={cam.zoom}>
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
