import {useVideoConfig} from 'remotion';

/**
 * The "world" every scene is drawn in. 16:9 shows all of it; 9:16 (Shorts)
 * shows a vertical slice that the Camera points at.
 */
export const WORLD = {w: 1920, h: 1080} as const;
/** y coordinate of the floor/ground line in world space. */
export const GROUND = 900;
/** Extra zoom used in vertical mode so characters read well on phones. */
export const VERTICAL_ZOOM = 0.9;

export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  return {
    width,
    height,
    vertical,
    /** Scale factor for HTML overlays: 1 at 1080p. */
    u: Math.min(width, height) / 1080,
  };
};
