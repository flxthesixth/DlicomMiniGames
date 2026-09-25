import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DOM helper selects element IDs with a # prefix', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /const el=id=>document\.querySelector\('#'\+id\)/);
});

test('footer uses centered FLX play-post tagline', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /<footer class="foot">DILI RUN BY FLX · PLAY FIRST, POST THEN\.<\/footer>/);
  assert.match(html, /\.foot\{[^}]*text-align:center/);
});

test('main game page uses the puzzle artwork as a 60 percent background layer', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /body:before\{[^}]*opacity:\.6[^}]*login-puzzle\.png/);
  assert.match(html, /\.shell\{[^}]*position:relative;z-index:1/);
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

test('run-end overlay reveals post and save score actions below run again', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /id="play">START RUN<\/button><div class="endActions" id="endActions" hidden><button[^>]+id="share">POST SCORE<\/button><button[^>]+id="banner">SAVE SCORE<\/button>/);
  assert.match(html, /endActions\.hidden=false/);
  assert.match(html, /endActions\.hidden=true/);
});

test('surge collision bursts obstacle and surge mode intensifies arena visuals', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /if\(game\.destroyed\)\{burst\(e\.position,'surge'\)/);
  assert.match(html, /arena\.classList\.toggle\('super',game\.surge>0\)/);
  assert.match(html, /player\.userData\.sprite\.material\.color\.set\(game\.surge>0\?0x9fd0ff:0xffffff\)/);
  assert.match(html, /\.arena\.super\{/);
});

test('puzzle timer and quiz gate timer are independent', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /lastPuzzle>=3\.5/);
  assert.match(html, /lastQuiz>=10/);
  assert.match(html, /spawnPuzzle\(\)/);
  assert.match(html, /spawnQuizGate\(\)/);
  assert.match(html, /dlicom-puzzle-%d\.png/);
  assert.match(html, /id="puzzleCount">0\/3/);
});

test('quiz gate presents three lanes and a math prompt', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /id="quizPrompt"/);
  assert.match(html, /g\.userData\.type='quiz'/);
  assert.match(html, /g\.userData\.correct=/);
});

test('HUD separates left scores, centered super status, and right resources', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /class="scorebox"><div>BEST<b id="best"[^<]*<\/b><\/div><div>SCORE<b id="score"/);
  assert.match(html, /class="statusbox"><div>LIVES<b id="lives"[^<]*<\/b><\/div><div>PUZZLE<b id="puzzleCount"/);
  assert.match(html, /\.surge\{[^}]*position:absolute;top:58px;left:50%/);
  assert.match(html, /\.quizPrompt\{[^}]*top:100px/);
});

test('impact, wrong-gate, and run-end sounds are distinct', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /kind==='hit'/);
  assert.match(html, /kind==='wrong'/);
  assert.match(html, /kind==='dead'/);
  assert.match(html, /sfx\('wrong'\)/);
  assert.match(html, /sfx\('dead'\)/);
});

test('run-end title taunts and space starts the next run', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /'YOU NOOB!':'SKILL ISSUE!'/);
  assert.match(html, /play\.textContent==='RUN AGAIN'\)reset\(\)/);
});

test('branding is DILI RUN and puzzle count is compact', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /DLICOM RUNNER/);
  assert.match(html, /DILI<i>◆<\/i>RUN/);
  assert.match(html, /id="puzzleCount">0\/3/);
  assert.match(html, /`\$\{game\.puzzlePieces\}\/3`/);
});

test('Retree spawns every fifteen seconds and switches at most three lanes', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /lastRetree>=15/);
  assert.match(html, /spawnRetree\(\)/);
  assert.match(html, /dili-retree-%d\.png/);
  assert.match(html, /type:'retree'/);
  assert.match(html, /laneMoves:0/);
  assert.match(html, /laneMoves<3/);
});

test('premium gem animates, spawns every 22.5 seconds, and collects separately', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /dili-gem-%d\.png/);
  assert.match(html, /lastGem>=22\.5/);
  assert.match(html, /spawnGem\(\)/);
  assert.match(html, /type='gem'|type:'gem'/);
  assert.match(html, /let collect=false,gem=false/);
});

test('flying obstacle uses red hazard accents', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /droneAccent/);
  assert.match(html, /color:0xff416c/);
  assert.match(html, /emissive:0x6b1027/);
});
