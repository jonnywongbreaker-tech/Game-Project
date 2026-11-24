import React, {createContext, useContext} from 'react';
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
  /**
   * 2.5D mode: children are <Layer depth=…> elements, each with its own
   * parallax. Off by default (everything sits on the depth-1 world plane).
   */
  layered?: boolean;
  /** Extra <defs> (gradients, filters) placed in the camera's SVG. */
  defs?: React.ReactNode;
  children: React.ReactNode;
}

interface CameraState {
  width: number;
  height: number;
  base: number;
  zoom: number;
  fx: number;
  fy: number;
  rotate: number;
}

const CameraContext = createContext<CameraState | null>(null);

/** Read the current camera (e.g. to position screen-space elements over world objects). */
export const useCamera = () => {
  const c = useContext(CameraContext);
  if (!c) throw new Error('useCamera() must be used inside <Camera>');
  return c;
};

/** SVG transform for a plane at `depth` (1 = world plane, <1 farther, >1 nearer). */
export function depthTransform(c: CameraState, depth: number): string {
  const s = c.base * (1 + (c.zoom - 1) * depth);
  const cx = WORLD.w / 2 + (c.fx - WORLD.w / 2) * depth;
  const cy = WORLD.h / 2 + (c.fy - WORLD.h / 2) * depth;
  return `translate(${c.width / 2} ${c.height / 2}) rotate(${c.rotate}) scale(${s}) translate(${-cx} ${-cy})`;
}

/**
 * Renders world-space SVG children through a virtual camera. In 16:9 the
 * default shows the whole 1920x1080 world; in 9:16 it shows a vertical slice
 * centred on focusX — so one scene serves both long-form and Shorts.
 */
export const Camera: React.FC<CameraProps> = ({focusX, focusY, zoom = 1, rotate = 0, offset, layered, defs, children}) => {
  const {width, height, vertical} = useLayout();
  const state: CameraState = {
    width,
    height,
    base: (vertical ? height / WORLD.h : width / WORLD.w) * (vertical ? VERTICAL_ZOOM : 1),
    zoom,
    fx: (focusX ?? WORLD.w / 2) + (offset?.x ?? 0),
    fy: (focusY ?? (vertical ? 560 : WORLD.h / 2)) + (offset?.y ?? 0),
    rotate,
  };
  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {defs && <defs>{defs}</defs>}
        <CameraContext.Provider value={state}>
          {layered ? children : <g transform={depthTransform(state, 1)}>{children}</g>}
        </CameraContext.Provider>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * A parallax plane inside a layered <Camera>. depth 0 = fixed sky,
 * 0.3 = distant mountains, 1 = the stage, 1.4 = foreground foliage.
 */
export const Layer: React.FC<{depth: number; filter?: string; opacity?: number; children: React.ReactNode}> = ({depth, filter, opacity, children}) => {
  const c = useCamera();
  return (
    <g transform={depthTransform(c, depth)} filter={filter} opacity={opacity}>
      {children}
    </g>
  );
};
