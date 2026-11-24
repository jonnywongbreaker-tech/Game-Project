import type React from 'react';
import type {Expression} from '../engine/vocab';
import type {Module, ModuleType} from '../kit/library';
import type {GraphNode} from '../kit/network';
import type {Joints, Vec} from '../kit/puppet';
import type {SpeechLine} from '../engine/speech';

/** Per-frame context every theme component receives. */
export interface Ctx {
  t: number;
  frame: number;
  /** Seconds since the scene started (same as t for single-scene pieces). */
  zoom: number;
}

export interface CharacterView {
  joints: Joints;
  x: number;
  groundY: number;
  facing: 1 | -1;
  expression: Expression;
  ctx: Ctx;
}

export interface OrbView {
  x: number;
  y: number;
  r: number;
  glow: number;
  pulse: number;
  fade: number;
  dissolve: number;
  squash: number;
  carried?: boolean;
  ctx: Ctx;
}

export interface LinkView {
  a: GraphNode;
  b: GraphNode;
  growth: number;
  /** 0..1 brightness from recall activity. */
  energy: number;
  pulse: {from: 'a' | 'b'; k: number} | null;
  ctx: Ctx;
}

type ModuleComponents = {[K in ModuleType]?: React.FC<{m: Extract<Module, {type: K}>; ctx: Ctx}>};

/**
 * A visual theme: everything about LOOK, nothing about content or timing.
 * The same scene data rendered with a different theme gives a different art style.
 */
export interface Theme {
  id: string;
  name: string;
  background: string;
  /** Shared SVG <defs> (gradients, patterns, filters). */
  Defs: React.FC<{ctx: Ctx}>;
  modules: ModuleComponents;
  Character: React.FC<CharacterView>;
  Orb: React.FC<OrbView>;
  Link: React.FC<LinkView>;
  Particle: React.FC<{x: number; y: number; r: number; a: number; ctx: Ctx}>;
  /** Optional per-depth SVG filter (e.g. depth of field) and atmospheric tint. */
  layerFilter?: (depth: number) => string | undefined;
  layerOverlay?: React.FC<{depth: number; ctx: Ctx}>;
  /** Screen-space finishing: grain, grade, vignette, light. */
  Post: React.FC<{ctx: Ctx}>;
  Subtitle: React.FC<{line: SpeechLine; t: number; inK: number}>;
  Title: React.FC<{lines: string[]; k: (i: number) => number; t: number}>;
}

export type {Vec};
