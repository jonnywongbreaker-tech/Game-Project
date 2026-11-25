import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {audioDigest} from '../scripts/lib/production-alignment';
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

test('word alignment changes SRT boundaries and rejects stale or invalid sidecars', () => {
  const dir = mkdtempSync(join(tmpdir(), 'toon-alignment-test-'));
  try {
    const audio = join(dir, 'voice.wav');
    const episodePath = join(dir, 'episode.json');
    writeFileSync(audio, 'audio version one');
    const text = 'A river shapes the valley where people live. Erosion removes material from the outside bank, while sediment accumulates on the inside.';
    const episode = parseEpisode({...input, shots: [{
      ...input.shots[0], voice: {file: 'voice.wav', text},
    }]});
    const tokens = text.split(/\s+/);
    const timing = {
      version: 1, source: 'test', audioSha256: audioDigest(audio), transcript: text,
      words: tokens.map((word, index) => ({text: word, start: (index + 1) / 4, end: (index + 1) / 4 + 0.125})),
    };
    const meta = audio + '.timing.json';
    writeFileSync(meta, JSON.stringify(timing));
    const plan = planEpisode(episodePath, episode, () => 8);
    assert.equal(plan.shots[0].voice?.alignment?.source, 'test');
    const cues = subtitles(plan).trim().split('\n\n');
    assert.equal(cues.length, 2);
    assert.match(cues[0], /00:00:00,250 --> /);
    const secondWord = cues[1].split('\n')[2].split(' ')[0];
    const startMs = timing.words.find(word => word.text === secondWord)!.start * 1000;
    const start = new Date(startMs).toISOString().slice(11, 23).replace('.', ',');
    assert.ok(cues[1].includes(start + ' --> '));
    assert.doesNotMatch(cues[1], / --> 00:00:08,000/);
    const invalid = {...timing, words: [{text: tokens[0], start: 0, end: 0}, ...timing.words.slice(1)]};
    writeFileSync(meta, JSON.stringify(invalid));
    assert.throws(() => planEpisode(episodePath, episode, () => 8), /invalid timing for word 1/);
    writeFileSync(meta, JSON.stringify(timing));
    writeFileSync(audio, 'audio version two');
    assert.throws(() => planEpisode(episodePath, episode, () => 8), /audio or transcript has changed/);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});
