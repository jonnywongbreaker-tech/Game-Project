/** Shared vocabulary. Plain data (no React/Remotion) so scripts and checkers can import it. */
export const POSES = ['idle', 'wave', 'point', 'shrug', 'cheer', 'think', 'hips', 'present'] as const;
export type Pose = (typeof POSES)[number];

/** Poses that are one-off gestures: they return to 'idle' when their beat ends. */
export const GESTURES: readonly Pose[] = ['wave', 'point', 'shrug', 'cheer', 'present'];

export const EXPRESSIONS = ['neutral', 'happy', 'laugh', 'sad', 'angry', 'surprised', 'smug'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const BACKDROPS = ['park', 'room', 'city', 'studio'] as const;
export type BackdropName = (typeof BACKDROPS)[number];

export const HAIR_STYLES = ['spiky', 'bob', 'bun', 'curly', 'ponytail', 'bald'] as const;
export const ACCESSORIES = ['glasses', 'cap', 'none'] as const;
