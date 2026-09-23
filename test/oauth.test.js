import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('worker exposes X OAuth routes and never leaks client secret to client', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  assert.match(worker, /\/auth\/x/);
  assert.match(worker, /\/auth\/x\/callback/);
  assert.match(worker, /\/api\/me/);
  assert.match(worker, /code_challenge_method/);
  assert.match(worker, /api\.x\.com\/2\/oauth2\/token/);
  assert.match(worker, /HttpOnly/);
  assert.ok(!/zyARsy/.test(worker)); // real secret must never be in source
});

test('login UI present and driven by /api/me', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="xLogin"/);
  assert.match(html, /href="\/auth\/x"/);
  assert.match(html, /fetch\('\/api\/me'\)/);
});

test('wrangler config serves worker with assets binding', () => {
  const cfg = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(cfg, /"main":\s*"worker\/index\.js"/);
  assert.match(cfg, /"binding":\s*"ASSETS"/);
});
