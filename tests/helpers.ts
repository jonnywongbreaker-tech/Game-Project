import type {ToonScript} from '../src/script/types';

/** Small valid script to mutate in tests. */
export const baseScript = (): ToonScript => ({
  id: 'T',
  title: 'Test',
  cast: {mia: 'mia', leo: 'leo'},
  scenes: [
    {
      backdrop: 'park',
      actors: {mia: {x: 600}, leo: {x: 1300}},
      beats: [
        {say: 'mia', text: 'Hello there, friend.'},
        {say: 'leo', text: 'Hi Mia!', pose: 'wave'},
      ],
    },
  ],
});
