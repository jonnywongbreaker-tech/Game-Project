import type {Profile, StyleInput, StyleName} from './scene/style';
import type {Scene} from './scene/types';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const SAMPLE_RATE = 48_000;
export const TEMPLATES = ['card', 'flow', 'urban', 'machine', 'nature', 'abstract', 'scene'] as const;
export type Template = (typeof TEMPLATES)[number];

export type ShotVisual = {
  template: Template;
  headline?: string;
  labels?: string[];
  scene?: Scene;
  profile?: Profile;
};

export interface ShotInput extends ShotVisual {
  id: string;
  voice?: {file: string; text: string; speaker?: string; lead?: number};
  duration?: number;
  tail?: number;
}

export type Narrator = {provider: string; voice: string; pronunciation?: Record<string,string>};
export type AudioClip = {file: string; at?: number; gainDb?: number; loop?: boolean; duration?: number};
export type AudioMix = {music?: AudioClip; effects?: AudioClip[]; loudness?: number; duck?: boolean};

export interface EpisodeInput {
  style?: StyleName | StyleInput;
  narrators?: Record<string, Narrator>;
  audio?: AudioMix;
  id: string;
  title: string;
  shots: ShotInput[];
}

export type RenderProps = ShotVisual & {frames: number};
