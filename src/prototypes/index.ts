import {defineCodeEpisode} from '../engine/episode';
import {BENCH_SECONDS} from './bench';
import {StyleA} from './StyleA';
import {StyleB} from './StyleB';
import {StyleC} from './StyleC';

/** Visual-direction benchmark: identical choreography, three looks. */
export const STYLE_BENCHMARKS = [
  defineCodeEpisode({id: 'StyleA-Geometric', title: 'A: Geometric editorial', duration: BENCH_SECONDS, component: StyleA, thumbnail: {at: 8.6}}),
  defineCodeEpisode({id: 'StyleB-Textured', title: 'B: Textured editorial', duration: BENCH_SECONDS, component: StyleB, thumbnail: {at: 8.6}}),
  defineCodeEpisode({id: 'StyleC-Cinematic', title: 'C: Cinematic 2.5D', duration: BENCH_SECONDS, component: StyleC, thumbnail: {at: 8.6}}),
];
