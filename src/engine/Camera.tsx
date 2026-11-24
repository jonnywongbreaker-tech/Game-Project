import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useLayout, VERTICAL_ZOOM, WORLD} from './layout';

export interface CameraProps {
  /** World x the camera centres on. Default: middle of the world. */
  focusX?: number;
  /** World y the camera centres on. */
  focusY?: number;
  /** 1 = default framing. >1 zooms in. */
  zoom?: number;
  /** Roll in degrees (for comedic tilts). */
  rotate?: number;
  /** Small offsets, e.g. from shake(). */
  offset?: {x: number; y: number};
  children: React.ReactNode;
}

/**
 * Renders world-space SVG children through a virtual camera. In 16:9 the
 * default shows the whole 1920x1080 world; in 9:16 it shows a vertical slice
 * centred on focusX — so one scene serves both long-form and Shorts.
 */
export const Camera: React.FC<CameraProps> = ({focusX, focusY, zoom = 1, rotate = 0, offset, children}) => {
  const {width, height, vertical} = useLayout();
  const base = vertical ? height / WORLD.h : width / WORLD.w;
  const s = base * zoom * (vertical ? VERTICAL_ZOOM : 1);
  const fx = (focusX ?? WORLD.w / 2) + (offset?.x ?? 0);
  const fy = (focusY ?? (vertical ? 560 : WORLD.h / 2)) + (offset?.y ?? 0);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${width / 2} ${height / 2}) rotate(${rotate}) scale(${s}) translate(${-fx} ${-fy})`}>
          {children}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
