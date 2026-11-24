export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const SAMPLE_RATE = 48_000;
export const TEMPLATES = ['card', 'flow', 'urban', 'machine', 'nature', 'abstract'] as const;
export type Template = (typeof TEMPLATES)[number];

export type ShotVisual = {
  template: Template;
  headline?: string;
  labels?: string[];
};

export interface ShotInput extends ShotVisual {
  id: string;
  voice?: {file: string; text: string};
  duration?: number;
  tail?: number;
}

export interface EpisodeInput {
  id: string;
  title: string;
  shots: ShotInput[];
}

export type RenderProps = ShotVisual & {frames: number};
