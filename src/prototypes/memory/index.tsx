import React from 'react';
import {defineCodeEpisode} from '../../engine/episode';
import {geometricTheme} from '../../themes/geometric';
import {texturedTheme} from '../../themes/textured';
import {cinematicTheme} from '../../themes/cinematic';
import {MemoryScene} from './MemoryScene';
import {SECONDS} from './scene';

const A: React.FC = () => <MemoryScene theme={geometricTheme} />;
const B: React.FC = () => <MemoryScene theme={texturedTheme} />;
const C: React.FC = () => <MemoryScene theme={cinematicTheme} />;

/** Visual-direction benchmark v2: identical scene + choreography, rendered by different themes. */
export const MEMORY_BENCHMARKS = [
  defineCodeEpisode({id: 'Memory-A-Geometric', title: geometricTheme.name, duration: SECONDS, component: A, thumbnail: {at: 8.2}}),
  defineCodeEpisode({id: 'Memory-B-Textured', title: texturedTheme.name, duration: SECONDS, component: B, thumbnail: {at: 8.2}}),
  defineCodeEpisode({id: 'Memory-C-Cinematic', title: cinematicTheme.name, duration: SECONDS, component: C, thumbnail: {at: 8.2}}),
];
