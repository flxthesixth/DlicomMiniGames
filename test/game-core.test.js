import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, difficultyLevel, newGame } from '../public/game-core.js';

test('lane input stays inside three runner lanes', () => {
  let state = newGame(7);
  state = advance(state, { lane: 1, dt: 0 });
  assert.equal(state.lane, 2);
  state = advance(state, { lane: 1, dt: 0 });
  assert.equal(state.lane, 2);
  state = advance(state, { lane: -1, dt: 0 });
  assert.equal(state.lane, 1);
});

test('collecting signal adds score and combo', () => {
  const state = newGame(7);
  const next = advance(state, { collect: true, dt: 1 });
  assert.equal(next.combo, 1);
  assert.ok(next.score > state.score);
});

test('three signals activate surge and double multiplier', () => {
  let state = newGame(7);
  state = advance(state, { collect: true, dt: 1 });
  state = advance(state, { collect: true, dt: 1 });
  state = advance(state, { collect: true, dt: 1 });
  assert.ok(state.surge > 0);
  assert.equal(state.multiplier, 2);
});

test('each run starts with three lives', () => {
  assert.equal(newGame(7).lives, 3);
});

test('hit consumes one life and grants two seconds of invulnerability', () => {
  const next = advance(newGame(7), { hit: true, dt: 0 });
  assert.equal(next.lives, 2);
  assert.equal(next.invulnerable, 2);
  assert.equal(next.over, false);
});

test('hits during recovery do not consume another life', () => {
  const hit = advance(newGame(7), { hit: true, dt: 0 });
  const protectedState = advance(hit, { hit: true, dt: 1 });
  assert.equal(protectedState.lives, 2);
  assert.equal(protectedState.over, false);
  assert.equal(protectedState.dodged, true);
});

test('third unprotected hit ends the run', () => {
  let state = advance(newGame(7), { hit: true, dt: 0 });
  state = advance(state, { dt: 2 });
  state = advance(state, { hit: true, dt: 0 });
  state = advance(state, { dt: 2 });
  state = advance(state, { hit: true, dt: 0 });
  assert.equal(state.lives, 0);
  assert.equal(state.over, true);
});

test('jump starts once and expires after its short duration', () => {
  let state = advance(newGame(7), { jump: true, dt: 0 });
  assert.ok(state.jump > 0);
  state = advance(state, { jump: true, dt: .1 });
  assert.ok(state.jump < .7);
  state = advance(state, { dt: 1 });
  assert.equal(state.jump, 0);
});

test('difficulty level rises at score milestones', () => {
  assert.equal(difficultyLevel(0), 1);
  assert.equal(difficultyLevel(499), 1);
  assert.equal(difficultyLevel(500), 2);
  assert.equal(difficultyLevel(1500), 4);
  assert.equal(difficultyLevel(99999), 6);
});

test('slide starts once and expires, and cannot overlap jump', () => {
  let state = advance(newGame(7), { slide: true, dt: 0 });
  assert.ok(state.slide > 0);
  state = advance(state, { slide: true, dt: .1 });
  assert.ok(state.slide < .55);
  state = advance(state, { dt: 1 });
  assert.equal(state.slide, 0);
  const midJump = advance(newGame(7), { jump: true, dt: .1 });
  const blocked = advance(midJump, { slide: true, dt: 0 });
  assert.equal(blocked.slide, 0);
  const midSlide = advance(newGame(7), { slide: true, dt: .1 });
  const noJump = advance(midSlide, { jump: true, dt: 0 });
  assert.equal(noJump.jump, 0);
});

test('jump clears a ground obstacle on the same collision frame', () => {
  const next = advance(newGame(7), { jump: true, hit: true, hitType: 'ground', dt: 0 });
  assert.equal(next.over, false);
  assert.equal(next.dodged, true);
  assert.ok(next.jump > 0);
});

test('slide clears a flying obstacle on the same collision frame', () => {
  const next = advance(newGame(7), { slide: true, hit: true, hitType: 'flying', dt: 0 });
  assert.equal(next.over, false);
  assert.equal(next.dodged, true);
  assert.ok(next.slide > 0);
});

test('collision result resets outside the collision frame', () => {
  const dodged = advance(newGame(7), { jump: true, hit: true, hitType: 'ground', dt: 0 });
  assert.equal(advance(dodged, { dt: .1 }).dodged, false);
});

test('wrong dodge consumes a life for each obstacle type', () => {
  assert.equal(advance(newGame(7), { slide: true, hit: true, hitType: 'ground', dt: 0 }).lives, 2);
  assert.equal(advance(newGame(7), { jump: true, hit: true, hitType: 'flying', dt: 0 }).lives, 2);
});
