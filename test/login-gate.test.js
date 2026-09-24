import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const login = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');

test('root is a login gate with X and named guest paths', () => {
  assert.match(login, /LOG IN WITH X/);
  assert.match(login, /id="guestName"/);
  assert.match(login, /\/auth\/guest/);
  assert.match(login, /login-silhouette\.png/);
  assert.ok(existsSync(new URL('../public/game.html', import.meta.url)));
});

test('worker creates a signed guest session and routes OAuth back to game', () => {
  assert.match(worker, /path === '\/auth\/guest' && request\.method === 'POST'/);
  assert.match(worker, /async function guest/);
  assert.match(worker, /Location: '\/game\.html\?login=1'/);
  assert.match(worker, /guest_/);
});
