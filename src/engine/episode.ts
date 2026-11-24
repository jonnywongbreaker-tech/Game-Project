import type React from 'react';

/**
 * An episode written directly in React (the escape hatch for shots the
 * script format can't express). Most episodes should be JSON scripts.
 */
export interface CodeEpisode {
  id: string;
  title: string;
  /** Seconds. */
  duration: number;
  fps?: number;
  component: React.FC;
  thumbnail?: {at: number; text?: string};
}

export const defineCodeEpisode = (e: CodeEpisode) => e;
