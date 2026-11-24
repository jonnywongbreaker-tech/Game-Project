import {defineCodeEpisode} from '../../engine/episode';
import {Abstract} from './Abstract';
import {CharacterSheet} from './CharacterSheet';
import {CharacterTurnaround} from './CharacterTurnaround';
import {Machine} from './Machine';
import {Nature} from './Nature';
import {Urban} from './Urban';
import {ThreeAtrium} from '../../spikes/ThreeAtrium';

export const VERSATILITY = [
  defineCodeEpisode({id: 'Character-Sheet', title: 'Person v2 design sheet', duration: 3, component: CharacterSheet}),
  defineCodeEpisode({id: 'Character-Turnaround', title: 'Person v2 views and expressions', duration: 3, component: CharacterTurnaround}),
  defineCodeEpisode({id: 'V-Urban', title: 'Versatility: urban', duration: 5, component: Urban}),
  defineCodeEpisode({id: 'V-Machine', title: 'Versatility: mechanical', duration: 5, component: Machine}),
  defineCodeEpisode({id: 'V-Nature', title: 'Versatility: natural', duration: 5, component: Nature}),
  defineCodeEpisode({id: 'V-Abstract', title: 'Versatility: abstract', duration: 5, component: Abstract}),
  // Evaluation spike (see docs/RENDERER_ASSESSMENT.md) — not part of the engine.
  defineCodeEpisode({id: 'Spike-ThreeAtrium', title: 'Spike: atrium in Three.js', duration: 4.6, component: ThreeAtrium}),
];
