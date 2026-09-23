import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DOM helper selects element IDs with a # prefix', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /const el=id=>document\.querySelector\('#'\+id\)/);
});

test('footer uses centered FLX play-post tagline', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /<footer class="foot">DLICOM RUNNER BY FLX · PLAY FIRST, POST THEN\.<\/footer>/);
  assert.match(html, /\.foot\{[^}]*text-align:center/);
});

test('flying obstacle flies above sliding head with grounded shadow', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /g\.userData\.type='drone'/);
  assert.match(html, /hull\.position\.y=2\.4/);
  assert.match(html, /new THREE\.CircleGeometry/);
  assert.match(html, /color:0xa855f7/);
});

test('runner cycle runs at original 10fps pace', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /runnerTextures\[Math\.floor\(runClock\*10\)%8\]/);
});

test('collision delegates dodge outcome to game core in the same frame', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /hitType:type,jump:jumpRequested,slide:slideRequested/);
});

test('player collision window uses compact hitbox constants', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /PLAYER_LANE_HITBOX=\.44/);
  assert.match(html, /PLAYER_DEPTH_MIN=1\.05/);
  assert.match(html, /PLAYER_DEPTH_MAX=1\.55/);
});

test('game core owns height-aware dodge rules', () => {
  const core = readFileSync(new URL('../public/game-core.js', import.meta.url), 'utf8');
  assert.match(core, /hitType === 'ground' \? airborne : hitType === 'flying' \? sliding/);
});
