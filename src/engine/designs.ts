import type {ACCESSORIES, HAIR_STYLES} from './vocab';

export type HairStyle = (typeof HAIR_STYLES)[number];
export type Accessory = (typeof ACCESSORIES)[number];

/** Everything that makes a character look like themselves. */
export interface CharacterDesign {
  /** Shown in subtitles. */
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  /** Optional stripe across the shirt (also the cap colour). */
  shirtAccent?: string;
  pants: string;
  shoes: string;
  /** Subtitle / UI colour for this character. */
  color: string;
  accessory?: Accessory;
  /** Height multiplier (1 = ~480 world units tall). */
  size?: number;
  /** Changes blink/idle timing so characters don't move in lockstep. */
  seed?: number;
}

/**
 * The channel's recurring cast. Scripts refer to these by key
 * ("cast": {"mia": "mia"}) or define a full design inline.
 */
export const CAST_PRESETS: Record<string, CharacterDesign> = {
  mia: {
    name: 'Mia', skin: '#f2c29b', hair: '#3b2418', hairStyle: 'bob',
    shirt: '#ff8a3d', shirtAccent: '#ffd166', pants: '#3d5a80', shoes: '#2b2233', color: '#ffa25e', seed: 1,
  },
  leo: {
    name: 'Leo', skin: '#c98b5e', hair: '#1f1a17', hairStyle: 'spiky',
    shirt: '#2ec4b6', pants: '#33415c', shoes: '#f4f1de', color: '#4fe0d2', accessory: 'glasses', size: 1.05, seed: 2,
  },
  ada: {
    name: 'Ada', skin: '#8d5a3b', hair: '#2a1b14', hairStyle: 'curly',
    shirt: '#9b5de5', shirtAccent: '#f15bb5', pants: '#22223b', shoes: '#f15bb5', color: '#c79bff', size: 0.98, seed: 3,
  },
  ben: {
    name: 'Ben', skin: '#ffd9b8', hair: '#c47a3a', hairStyle: 'bald',
    shirt: '#43aa8b', shirtAccent: '#f94144', pants: '#4a4e69', shoes: '#22223b', color: '#6fd6b4', accessory: 'cap', size: 1.1, seed: 4,
  },
  zoe: {
    name: 'Zoe', skin: '#f6d1b5', hair: '#e8b04b', hairStyle: 'ponytail',
    shirt: '#ef476f', pants: '#118ab2', shoes: '#073b4c', color: '#ff7a98', size: 0.95, seed: 5,
  },
};
