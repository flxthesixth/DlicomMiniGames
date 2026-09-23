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
