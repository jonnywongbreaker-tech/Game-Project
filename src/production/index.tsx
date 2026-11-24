import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {FONT, SERIF} from '../engine/fonts';
import {FrozenFrame} from '../engine/time';
import {Abstract} from '../prototypes/versatility/Abstract';
import {Machine} from '../prototypes/versatility/Machine';
import {Nature} from '../prototypes/versatility/Nature';
import {Urban} from '../prototypes/versatility/Urban';
import {ACCENT, INK} from '../themes/cge/type';
import {FPS, HEIGHT, WIDTH, type RenderProps} from './types';

const scenes = {urban: Urban, machine: Machine, nature: Nature, abstract: Abstract};

const ProductionShot: React.FC<RenderProps> = ({template, headline, labels, frames}) => {
  const frame = useCurrentFrame();
  if (template === 'card' || template === 'flow') {
    return (
      <AbsoluteFill style={{background: '#141E2B', color: INK, justifyContent: 'center', padding: 112}}>
        <div style={{width: 88, height: 5, background: ACCENT, marginBottom: 38}} />
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.08}}>{headline}</div>
        {labels && (
          <div style={{display: 'flex', gap: 20, alignItems: 'stretch', marginTop: 78}}>
            {labels.map((label, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div style={{alignSelf: 'center', fontSize: 46, color: ACCENT}}>→</div>}
                <div style={{
                  flex: 1, minWidth: 0, padding: '26px 18px', border: '1px solid #637180', fontFamily: FONT,
                  fontWeight: 700, fontSize: 38, textAlign: 'center', overflowWrap: 'anywhere',
                  color: frame >= Math.floor(index * frames / (labels.length * 1.35)) ? ACCENT : INK,
                }}>{label}</div>
              </React.Fragment>
            ))}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  const Scene = scenes[template];
  // The source compositions contain five seconds of motion. Retiming samples
  // their animation curves continuously while keeping textures frame-addressable.
  const sourceFrame = frames === 1 ? 0 : frame * (5 * FPS - 1) / (frames - 1);
  return (
    <AbsoluteFill>
      <FrozenFrame.Provider value={sourceFrame}>
        <Scene production />
      </FrozenFrame.Provider>
      {headline && (
        <div style={{
          position: 'absolute', left: 112, right: 112, bottom: 82, width: 'fit-content', maxWidth: '88%',
          color: INK, background: '#141E2B', padding: '18px 30px', fontFamily: SERIF, fontWeight: 700, fontSize: 68,
        }}>{headline}</div>
      )}
    </AbsoluteFill>
  );
};

const Root = () => (
  <Composition id="ProductionShot" component={ProductionShot} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={1}
    defaultProps={{template: 'card', frames: 1, headline: 'Production shot'} as RenderProps}
    calculateMetadata={({props}) => ({durationInFrames: props.frames})} />
);

registerRoot(Root);
