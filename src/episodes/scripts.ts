/**
 * Every JSON episode. Add new ones here.
 * Kept free of React imports so `npm run check` can load it in Node.
 */
import type {ToonScript} from '../script/types';
import ep001 from './ep001-big-idea.json';
import ep002 from './ep002-fast-learners.json';

export const SCRIPTS = [ep001, ep002] as unknown as ToonScript[];
