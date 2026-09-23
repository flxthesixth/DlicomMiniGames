import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, newGame } from '../public/game-core.js';

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
