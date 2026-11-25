import {defineCodeEpisode} from '../../engine/episode';
import {Cafe} from './Cafe';
import {Valley} from './Valley';

/** Vibrant Illustrated Worlds — visual reproduction test (docs/ART_DIRECTION.md). Not production code. */
export const VIBRANT = [
  defineCodeEpisode({id: 'Vibrant-Cafe', title: 'Vibrant test: café interior', duration: 5, component: Cafe}),
  defineCodeEpisode({id: 'Vibrant-Valley', title: 'Vibrant test: mountain valley', duration: 5, component: Valley}),
];
