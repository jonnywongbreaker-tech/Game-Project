import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import type {CodeEpisode} from './engine/episode';
import {FONT} from './engine/fonts';
import {FrozenFrame} from './engine/time';
import {rigTest} from './episodes/RigTest';
import {MEMORY_BENCHMARKS} from './prototypes/memory';
import {VERSATILITY} from './prototypes/versatility';
import {VIBRANT} from './prototypes/vibrant';
import {SCRIPTS} from './episodes/scripts';
import audioDurations from './generated/audio-durations.json';
import {compileScript} from './script/compile';
import {ScriptEpisode} from './script/ScriptEpisode';

/** Code-written episodes (escape hatch). JSON episodes live in episodes/scripts.ts. */
const CODE_EPISODES: CodeEpisode[] = [rigTest, ...MEMORY_BENCHMARKS, ...VERSATILITY, ...VIBRANT];

interface Registered {
  id: string;
  fps: number;
  duration: number;
  component: React.FC;
  thumbnail: {at: number; text?: string};
}

const registered: Registered[] = [
  ...SCRIPTS.map((s) => {
    const ep = compileScript(s, audioDurations);
    for (const i of ep.issues) console[i.level === 'error' ? 'error' : 'warn'](`[${ep.id}] ${i.where}: ${i.message}`);
    const Component: React.FC = () => <ScriptEpisode episode={ep} />;
    return {id: ep.id, fps: ep.fps, duration: ep.duration, component: Component, thumbnail: ep.thumbnail};
  }),
  ...CODE_EPISODES.map((e) => ({
    id: e.id, fps: e.fps ?? 30, duration: e.duration, component: e.component, thumbnail: e.thumbnail ?? {at: e.duration / 2},
  })),
];

const makeThumb = (ep: Registered): React.FC => () => (
  <AbsoluteFill>
    <FrozenFrame.Provider value={Math.round(ep.thumbnail.at * ep.fps)}>
      <ep.component />
    </FrozenFrame.Provider>
    {ep.thumbnail.text && (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 40}}>
        <div
          style={{
            fontFamily: FONT, fontWeight: 900, fontSize: 120, color: '#ffd84d', lineHeight: 1,
            WebkitTextStroke: '8px #1b1424', paintOrder: 'stroke fill', textShadow: '0 10px 0 #1b1424',
            transform: 'rotate(-3deg)', textAlign: 'center', maxWidth: '92%',
          }}
        >
          {ep.thumbnail.text}
        </div>
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);

/**
 * Each episode is registered three ways:
 *   <id>-Long  1920x1080 for regular uploads
 *   <id>-Short 1080x1920 for Shorts (same scenes, camera follows the action)
 *   <id>-Thumb 1280x720 still for the YouTube thumbnail
 */
export const RemotionRoot: React.FC = () => (
  <>
    {registered.map((ep) => {
      const frames = Math.ceil(ep.duration * ep.fps);
      return (
        <React.Fragment key={ep.id}>
          <Composition id={`${ep.id}-Long`} component={ep.component} durationInFrames={frames} fps={ep.fps} width={1920} height={1080} />
          <Composition id={`${ep.id}-Short`} component={ep.component} durationInFrames={frames} fps={ep.fps} width={1080} height={1920} />
          <Composition id={`${ep.id}-Thumb`} component={makeThumb(ep)} durationInFrames={1} fps={ep.fps} width={1280} height={720} />
        </React.Fragment>
      );
    })}
  </>
);
