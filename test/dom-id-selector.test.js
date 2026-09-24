import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DOM helper selects element IDs with a # prefix', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /const el=id=>document\.querySelector\('#'\+id\)/);
});

test('footer uses centered FLX play-post tagline', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /<footer class="foot">DLICOM RUNNER BY FLX · PLAY FIRST, POST THEN\.<\/footer>/);
  assert.match(html, /\.foot\{[^}]*text-align:center/);
});

test('flying obstacle flies above sliding head with grounded shadow', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /g\.userData\.type='drone'/);
  assert.match(html, /hull\.position\.y=2\.4/);
  assert.match(html, /new THREE\.CircleGeometry/);
  assert.match(html, /color:0xa855f7/);
});

test('runner cycle runs at original 10fps pace', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /runnerTextures\[Math\.floor\(runClock\*10\)%8\]/);
});

test('slide control is swipe-only and gameplay box has fullscreen', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('slideBtn'), 'on-screen slide button must be gone');
  assert.match(html, /id="fsBtn"/);
  assert.match(html, /requestFullscreen/);
  assert.match(html, /fullscreenchange/);
  assert.match(html, /ArrowDown/);
  assert.match(html, /SLIDE or down\/S/);
  assert.match(html, /pointerY=e\.clientY/);
  assert.match(html, /Math\.abs\(dy\)>Math\.abs\(dx\)/);
  assert.match(html, /dy<0\?jumpRequested=true:slideRequested=true/);
});

test('player collision window uses compact hitbox constants', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /PLAYER_LANE_HITBOX=\.44/);
  assert.match(html, /PLAYER_DEPTH_MIN=1\.05/);
  assert.match(html, /PLAYER_DEPTH_MAX=1\.55/);
});

test('game core owns height-aware dodge rules', () => {
  const core = readFileSync(new URL('../public/game-core.js', import.meta.url), 'utf8');
  assert.match(core, /hitType === 'ground' \? airborne : hitType === 'flying' \? sliding/);
});

test('successful dodge keeps obstacle moving without burst or removal', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /if\(game\.dodged\)\{e\.userData\.hit=true;continue\}/);
  assert.match(html, /burst\(e\.position,e\.userData\.type\);e\.userData\.hit=true;e\.userData\.dead=true/);
});

test('HUD shows three lives and renderer blinks during recovery', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /id="lives">◆◆◆/);
  assert.match(html, /livesEl\.textContent='◆'\.repeat\(game\.lives\)/);
  assert.match(html, /player\.visible=game\.invulnerable>0\?Math\.floor\(game\.invulnerable\*10\)%2===0:true/);
});

test('fullscreen control is anchored at the bottom right', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /\.fsbtn\{[^}]*bottom:10px;right:10px/);
  assert.doesNotMatch(html, /\.fsbtn\{[^}]*top:10px/);
});
