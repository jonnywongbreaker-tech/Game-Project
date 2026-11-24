import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SCRIPTS} from '../src/episodes/scripts';
import {compileScript} from '../src/script/compile';
import {step} from '../src/engine/time';
import {baseScript} from './helpers';

test('all shipped episodes compile without errors', () => {
  for (const s of SCRIPTS) {
    const ep = compileScript(s);
    assert.deepEqual(ep.issues.filter((i) => i.level === 'error'), [], s.id);
    assert.ok(ep.duration > 5, `${s.id} has a real duration`);
  }
});

test('compilation is deterministic', () => {
  for (const s of SCRIPTS) assert.equal(JSON.stringify(compileScript(s)), JSON.stringify(compileScript(s)));
});

test('reports unknown vocabulary and cast with readable errors', () => {
  const s = baseScript();
  s.cast.bob = 'bobby';
  (s.scenes[0] as any).backdrop = 'beach';
  (s.scenes[0].beats[0] as any).pose = 'dance';
  s.scenes[0].beats.push({do: [{actor: 'zed', walkTo: 5}]});
  const msgs = compileScript(s).issues.map((i) => i.message).join('\n');
  assert.match(msgs, /Unknown preset "bobby"/);
  assert.match(msgs, /Unknown backdrop "beach"/);
  assert.match(msgs, /Unknown pose "dance"/);
  assert.match(msgs, /"zed" is not in this scene's actors/);
});

test('lines run in order with the default pause and estimated length', () => {
  const ep = compileScript(baseScript());
  const [a, b] = ep.lines;
  assert.ok(a.end > a.start);
  assert.ok(Math.abs(b.start - (a.end + 0.35)) < 1e-9);
});

test('audio durations override estimates', () => {
  const s = baseScript();
  s.scenes[0].beats[0].audio = 'vo/1.mp3';
  const ep = compileScript(s, {'vo/1.mp3': 4.25});
  assert.equal(+(ep.lines[0].end - ep.lines[0].start).toFixed(3), 4.25);
});

test('gestures return to idle after their line; emotes auto-hide', () => {
  const s = baseScript();
  s.scenes[0].beats[1].emote = '!';
  const ep = compileScript(s);
  const leo = ep.scenes[0].actors.find((a) => a.id === 'leo')!;
  const line = ep.lines[1];
  assert.equal(step(line.start + 0.1, leo.pose), 'wave');
  assert.equal(step(line.end + 0.9, leo.pose), 'idle');
  assert.equal(step(line.start + 0.5, leo.emote), '!');
  assert.equal(step(line.start + 2.5, leo.emote), null);
});

test('"enter" starts the actor off-stage and walks to their mark', () => {
  const s = baseScript();
  s.scenes[0].beats.unshift({do: [{actor: 'leo', enter: 'right'}]});
  const ep = compileScript(s);
  const leo = ep.scenes[0].actors.find((a) => a.id === 'leo')!;
  assert.ok(leo.x[0][1] > 1920, 'starts off-screen right');
  assert.equal(leo.x[leo.x.length - 1][1], 1300);
  assert.equal(step(leo.x[1][0] + 0.01, leo.facing), -1, 'faces the way it walks');
});

test('actors face each other by default', () => {
  const ep = compileScript(baseScript());
  const [mia, leo] = ep.scenes[0].actors;
  assert.equal(mia.facing[0][1], 1);
  assert.equal(leo.facing[0][1], -1);
});

test('measured audio cannot be overridden by a conflicting beat duration', () => {
  const script = baseScript();
  Object.assign(script.scenes[0].beats[0], {audio: 'voice.wav', dur: 1});
  const episode = compileScript(script, {'voice.wav': 4});
  assert.match(episode.issues[0].message, /conflicts with the measured audio duration/);
  assert.equal(episode.lines[0].end - episode.lines[0].start, 4);
  assert.ok(episode.lines[1].start >= episode.lines[0].end);
});

test('malformed input, invalid timing and unsupported action fields produce diagnostics', () => {
  const malformed = {...baseScript(), scenes: null} as unknown as ReturnType<typeof baseScript>;
  assert.match(compileScript(malformed).issues[0].where, /scenes/);
  const script = baseScript();
  Object.assign(script.scenes[0].beats[0], {dur: -2, do: [{actor: 'leo', y: -150, scale: 2}]});
  const issues = compileScript(script).issues.map(issue => issue.where);
  assert.ok(issues.some(where => where.endsWith('.dur')));
  assert.ok(issues.some(where => where.endsWith('.y')));
  assert.ok(issues.some(where => where.endsWith('.scale')));
  assert.match(compileScript(null as unknown as typeof script).issues[0].message, /object/);
});
