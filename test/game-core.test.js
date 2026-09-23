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

test('hit consumes shield before ending run', () => {
  const state = { ...newGame(7), shields: 1 };
  const next = advance(state, { hit: true, dt: 1 });
  assert.equal(next.shields, 0);
  assert.equal(next.over, false);
});

test('hit without shield ends run', () => {
  const next = advance(newGame(7), { hit: true, dt: 1 });
  assert.equal(next.over, true);
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
  assert.ok(next.jump > 0);
});

test('slide clears a flying obstacle on the same collision frame', () => {
  const next = advance(newGame(7), { slide: true, hit: true, hitType: 'flying', dt: 0 });
  assert.equal(next.over, false);
  assert.ok(next.slide > 0);
});

test('wrong dodge never clears obstacle type', () => {
  assert.equal(advance(newGame(7), { slide: true, hit: true, hitType: 'ground', dt: 0 }).over, true);
  assert.equal(advance(newGame(7), { jump: true, hit: true, hitType: 'flying', dt: 0 }).over, true);
});
