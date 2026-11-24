export type HairStyle = 'spiky' | 'bob' | 'bun' | 'curly' | 'ponytail' | 'bald';
export type Accessory = 'glasses' | 'cap' | 'none';

/** Everything that makes a character look like themselves. */
export interface CharacterDesign {
  /** Shown in subtitles. */
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  /** Optional stripe across the shirt. */
  shirtAccent?: string;
  pants: string;
  shoes: string;
  /** Subtitle / UI color for this character. */
  color: string;
  accessory?: Accessory;
  /** Height multiplier (1 = ~470 world units tall). */
  size?: number;
  /** Changes blink/idle timing so characters don't move in lockstep. */
  seed?: number;
}

export const defineCast = <T extends Record<string, CharacterDesign>>(cast: T) => cast;
