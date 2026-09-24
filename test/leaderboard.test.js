import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('leaderboard endpoints exist and require login to submit', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  assert.match(worker, /\/api\/scores\/submit/);
  assert.match(worker, /login_required/);
  assert.match(worker, /ON CONFLICT\(x_id\) DO UPDATE SET/);
  assert.match(worker, /ORDER BY score DESC/);
});

test('game page shows leaderboard after account panels and posts score after run', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /GLOBAL LEADERBOARD/);
  assert.match(html, /refreshBoard/);
  assert.match(html, /\/api\/scores\/submit/);
  assert.ok(html.indexOf('<section class="board"') > html.indexOf('<section class="below"'));
});

test('best run comes from current account and referrals require X login', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(worker, /bestScore/);
  assert.match(worker, /guest: !!session\.guest/);
  assert.match(html, /high=Number\(d\.bestScore\|\|0\)/);
  assert.match(html, /if\(!d\.user\.guest\)/);
  assert.match(html, /X LOGIN REQUIRED FOR REFERRALS/);
  assert.match(worker, /path === '\/api\/referral'/);
  assert.match(worker, /referral_requires_x/);
  assert.match(worker, /INSERT OR IGNORE INTO referrals/);
  assert.match(worker, /code: `@\$\{session\.username\}`/);
  assert.match(worker, /SELECT x_id FROM x_users WHERE username = \?1/);
  assert.match(html, /fetch\('\/api\/referral'/);
  assert.match(html, /fetch\('\/api\/referral\/apply'/);
  assert.match(html, /\/game\?ref=\$\{x\.code\}/);
});

test('score banner uses supplied image template and draws account best score', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /score-banner-template\.png/);
  assert.match(html, /x\.drawImage\(img,0,0,b\.width,b\.height\)/);
  assert.match(html, /x\.fillText\(String\(high\),1175,1168\)/);
});

test('referral panel posts a Super Dili invitation instead of showing a raw link', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /id="refPost"[^>]*>POST ON X<\/button>/);
  assert.doesNotMatch(html, /INVITE LINK:/);
  assert.match(html, /My best score as Super Dili: \$\{high\}\. Let's run faster with me and save the Dili World!/);
});

test('post score uses current score and the account referral URL', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /I scored \$\{game\.score\} in DILI-RUN\. Be faster and catch me if you can!/);
  assert.match(html, /referralUrl/);
});

test('d1 schema has unique x_id and descending score index', () => {
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /x_id TEXT NOT NULL UNIQUE/);
  assert.match(schema, /idx_scores_score ON scores\(score DESC\)/);
});
