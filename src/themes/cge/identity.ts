/**
 * Cinematic Geometric Editorial — shared visual identity.
 * Every scene derives its palette from these anchors and renders with LOOK, so
 * a city, a machine, a forest and an abstract space read as one channel.
 */
import type {Look} from '../../kit/space';

/** Banded light, cool blue-violet shadows, warm highlights. */
export const LOOK: Look = {bands: 4, shadowTint: '#5A5FA6', lightTint: '#FFE5C4', tintStrength: 0.55};

/** Anchor colours used across all scenes. */
export const ID = {
  ink: '#1B2433',
  vermilion: '#E0553A',
  amber: '#FFC15E',
  cream: '#F3E9D8',
  teal: '#2E7C7A',
  slate: '#5C7884',
  sky: '#8EC3DA',
  leaf: '#5E9A55',
};

/** Typical key light direction (late morning, from the left and slightly behind the camera). */
export const SUN_DIR: [number, number, number] = [0.55, -0.8, 0.35];
