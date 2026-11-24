import type {CharacterDesign} from '../engine/designs';
import type {BackdropName, Expression, Pose} from '../engine/vocab';

/**
 * ToonScript — the JSON format an episode is written in.
 * See docs/SCRIPT_FORMAT.md for the full guide with examples.
 */
export interface ToonScript {
  id: string;
  title: string;
  fps?: number;
  /** Actor id → preset name (see CAST_PRESETS) or a full inline design. */
  cast: Record<string, string | CharacterDesign>;
  /** Where to burn in subtitles. Default: "both". */
  subtitles?: 'both' | 'long' | 'short' | 'none';
  /** Background music from public/, e.g. "music/theme.mp3". */
  music?: {src: string; volume?: number};
  /** Thumbnail frame (seconds) and optional big text. */
  thumbnail?: {at: number; text?: string};
  /** Speaking speed used to estimate timing when there is no audio yet. */
  cps?: number;
  /** Default silence after each spoken line (seconds). */
  pause?: number;
  /** Accent colour for titles/notes. */
  accent?: string;
  scenes: ScriptScene[];
}

export interface ScriptScene {
  backdrop: BackdropName;
  /** Studio backdrop colour. */
  tint?: string;
  /** Chapter title card shown at the start of the scene. */
  title?: string;
  /** Who is in this scene and where they start. */
  actors?: Record<string, ScriptActorState>;
  camera?: ScriptCamera;
  beats: ScriptBeat[];
}

export type Facing = 'left' | 'right';

export interface ScriptActorState {
  /** World x (0–1920; 960 is centre). */
  x?: number;
  /** Offset from the ground (negative = up). */
  y?: number;
  facing?: Facing;
  pose?: Pose;
  expression?: Expression;
  /** Bubble above the head: "!", "?", "...", "♥". null clears it. */
  emote?: string | null;
  /** Pupil direction -1 (back) … 1 (forward). */
  look?: number;
  scale?: number;
}

export interface ScriptAction extends ScriptActorState {
  actor: string;
  /** Walk to this x. */
  walkTo?: number;
  /** Walking speed in world units per second (default 400). */
  speed?: number;
  /** Start off-screen on this side and walk to `walkTo` (or the actor's starting x). */
  enter?: Facing;
  /** Walk off-screen on this side. */
  exit?: Facing;
}

/** "auto" = whole stage in 16:9, follow the speaker in 9:16. */
export type FocusSpec = 'auto' | 'center' | 'speaker' | number | string;

export interface ScriptCamera {
  zoom?: number;
  /** "auto", "center", "speaker", an actor id, or a world x. */
  focus?: FocusSpec;
  /** World y to centre on. */
  y?: number;
}

export interface ScriptBeat {
  /** Actor id (or "narrator") who speaks `text`. */
  say?: string;
  text?: string;
  /** Shorthand for {say: "narrator", text}. */
  narrate?: string;
  /** Voice-over clip in public/, e.g. "vo/ep001/003.mp3". Its length sets the beat's timing. */
  audio?: string;
  /** Force the beat length in seconds. */
  dur?: number;
  /** Silence after this beat (seconds). */
  pause?: number;
  /** Applied to the speaker for this line. */
  pose?: Pose;
  expression?: Expression;
  emote?: string | null;
  /** Things actors do when this beat starts. */
  do?: ScriptAction[];
  camera?: ScriptCamera;
  /** On-screen text for this beat. */
  caption?: string | {text: string; style?: 'big' | 'title' | 'note'; hold?: number};
  /** Sound effect in public/, e.g. "sfx/pop.mp3". */
  sfx?: string;
}
