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
  assert.match(html, /fetch\('\/api\/referral'/);
  assert.match(html, /fetch\('\/api\/referral\/apply'/);
});

test('d1 schema has unique x_id and descending score index', () => {
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /x_id TEXT NOT NULL UNIQUE/);
  assert.match(schema, /idx_scores_score ON scores\(score DESC\)/);
});
