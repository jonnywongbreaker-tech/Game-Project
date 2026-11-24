import assert from 'node:assert/strict';
import {test} from 'node:test';
import {analyzeEpisode} from '../src/qc/analyze';
import {compileScript} from '../src/script/compile';
import {baseScript} from './helpers';

const qc = (mutate: (s: ReturnType<typeof baseScript>) => void) => {
  const s = baseScript();
  mutate(s);
  return analyzeEpisode(compileScript(s)).issues.map((i) => i.message).join('\n');
};

test('clean script has no QC issues', () => {
  assert.equal(qc(() => {}), '');
});

test('detects overlapping characters', () => {
  assert.match(qc((s) => (s.scenes[0].actors!.leo.x = 650)), /overlap/);
});

test('detects a speaker off-screen in the 16:9 frame', () => {
  assert.match(qc((s) => (s.scenes[0].camera = {zoom: 2.2, focus: 600})), /\[long\] "leo" speaks off-screen/);
});

test('detects head cropping when zoomed in', () => {
  assert.match(qc((s) => (s.scenes[0].camera = {zoom: 2.4, focus: 'speaker', y: 800})), /cropped at the top/);
});

test('detects unreadably fast speech and long Shorts subtitles', () => {
  const text = 'This sentence has far too many words for the tiny amount of time it is given on screen today.';
  const msgs = qc((s) => s.scenes[0].beats.push({say: 'mia', text, dur: 1.5}));
  assert.match(msgs, /Speech is fast/);
  assert.match(msgs, /wraps to 3\+ lines/);
});

test('detects sliding (too-fast walks)', () => {
  assert.match(qc((s) => s.scenes[0].beats.push({do: [{actor: 'mia', walkTo: 1700, speed: 2000}]})), /sliding/);
});

test('detects repeated gestures', () => {
  assert.match(
    qc((s) => {
      for (let i = 0; i < 4; i++) s.scenes[0].beats.push({say: 'leo', text: `Line number ${i}.`, pose: 'point'});
    }),
    /"point" used 4 times/,
  );
});

test('metrics describe pacing', () => {
  const r = analyzeEpisode(compileScript(baseScript()), {beats: 2});
  assert.ok(r.metrics.wordsPerMin > 0);
  assert.ok(r.metrics.speechCoverage > 0 && r.metrics.speechCoverage <= 1);
  assert.ok(r.metrics.beatsPerMin > 0);
});
