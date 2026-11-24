import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseEpisode, planEpisode, subtitles} from '../scripts/lib/production-plan';

const input = {
  id: 'episode',
  title: 'Test episode',
  shots: [
    {id: 'intro', template: 'urban', voice: {file: 'voice.wav', text: 'One < two.'}, tail: 0.2},
    {id: 'body', template: 'flow', headline: 'How it works', labels: ['Start', 'End'], duration: 1.5},
  ],
};

test('production input is strict and errors identify bad shots', () => {
  for (const [value, message] of [
    [{...input, shots: null}, /episode.shots/],
    [{...input, shots: [input.shots[0], {...input.shots[0], id: 'INTRO'}]}, /Duplicate shot ID/],
    [{...input, shots: [{...input.shots[0], duration: 1}]}, /intro.*duration.*conflicts/],
    [{...input, shots: [{...input.shots[1], duration: -1}]}, /body.*duration/],
    [{...input, shots: [{...input.shots[1], labels: ['Start']}]}, /body.*labels/],
    [{...input, shots: [{...input.shots[0], voice: {file: 'https://example.org/voice.wav', text: 'Hello'}}]}, /intro.*local relative path/],
    [{...input, shots: [{...input.shots[0], unknown: 'typo'}]}, /shots\[0\].unknown/],
  ] as const) {
    assert.throws(() => parseEpisode(value), message);
  }
});

test('audio determines integer shot boundaries and SRT excludes the hold', () => {
  const plan = planEpisode('/tmp/test/episode.json', parseEpisode(input), path => {
    assert.equal(path, '/tmp/test/voice.wav');
    return 1.111;
  });
  assert.equal(plan.totalFrames, 85);
  assert.deepEqual(plan.shots.map(shot => [shot.startFrame, shot.endFrame]), [[0, 40], [40, 85]]);
  assert.equal(subtitles(plan), '1\n00:00:00,000 --> 00:00:01,111\nOne &lt; two.\n\n');
  assert.throws(() => planEpisode('/tmp/episode.json', parseEpisode(input), () => Number.NaN), /intro.*voice.wav/);
});

test('SRT wraps long narration into consecutive cues of at most two lines', () => {
  const phrase = 'An engine needs clear input and reliable timing. For the next part of the test, the viewer should be able to follow this second sentence.';
  const plan = planEpisode('/tmp/episode.json', parseEpisode({
    ...input, shots: [{...input.shots[0], voice: {file: 'voice.wav', text: phrase}}],
  }), () => 8);
  const cues = subtitles(plan).trim().split('\n\n');
  assert.equal(cues.length, 2);
  assert.ok(cues.every(cue => cue.split('\n').length <= 4));
  assert.equal(cues.map(cue => cue.split('\n').slice(2).join(' ')).join(' '), phrase);
  assert.match(cues[1], /--> 00:00:08,000/);
});
