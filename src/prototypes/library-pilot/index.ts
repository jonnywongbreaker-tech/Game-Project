import {defineCodeEpisode} from '../../engine/episode';
import {Cafe} from './Cafe';
import {Reuse} from './Reuse';
import {Valley} from './Valley';

/** Asset-library pilot (docs/ASSET_STRATEGY.md): scenes assembled from library assets. Not production code. */
export const LIBRARY_PILOT = [
  defineCodeEpisode({id: 'Pilot-Valley', title: 'Library pilot: valley', duration: 5, component: Valley}),
  defineCodeEpisode({id: 'Pilot-Reuse', title: 'Library pilot: reuse at dusk', duration: 5, component: Reuse}),
  defineCodeEpisode({id: 'Pilot-Cafe', title: 'Library pilot: café', duration: 5, component: Cafe}),
];
