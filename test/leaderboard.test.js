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

test('game page shows leaderboard and posts score after run', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /GLOBAL LEADERBOARD/);
  assert.match(html, /refreshBoard/);
  assert.match(html, /\/api\/scores\/submit/);
});

test('d1 schema has unique x_id and descending score index', () => {
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /x_id TEXT NOT NULL UNIQUE/);
  assert.match(schema, /idx_scores_score ON scores\(score DESC\)/);
});
