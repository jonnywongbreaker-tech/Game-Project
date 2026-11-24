import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useLayout} from './layout';

/**
 * Tiles a baked texture PNG over the frame. Uses <Img> so the render waits
 * for it to load (no flicker), and is far cheaper than per-frame SVG noise.
 */
export const TextureOverlay: React.FC<{src: string; opacity?: number; blend?: React.CSSProperties['mixBlendMode']; tile?: number}> = ({
  src,
  opacity = 1,
  blend = 'multiply',
  tile = 512,
}) => {
  const {width, height} = useLayout();
  const cols = Math.ceil(width / tile);
  const rows = Math.ceil(height / tile);
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: blend, pointerEvents: 'none'}}>
      {Array.from({length: rows * cols}).map((_, i) => (
        <Img
          key={i}
          src={staticFile(src)}
          style={{position: 'absolute', left: (i % cols) * tile, top: Math.floor(i / cols) * tile, width: tile, height: tile}}
        />
      ))}
    </AbsoluteFill>
  );
};
