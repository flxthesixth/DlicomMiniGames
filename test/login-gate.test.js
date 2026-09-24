import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const login = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');

test('root is a login gate with X and named guest paths', () => {
  assert.match(login, /LOG IN WITH X/);
  assert.match(login, /id="guestName"/);
  assert.match(login, /placeholder="retree the pro"/);
  assert.match(login, /RUN<br>WITH <span>DILI\.<\/span>/);
  assert.match(login, /DILI<i>◆<\/i>RUN/);
  assert.doesNotMatch(login, /DLICOM RUNNER/);
  assert.ok(!login.includes('IDENTITY CHECK / 01'));
  assert.match(login, /background:rgba\(5,7,13,\.78\)/);
  assert.match(login, /\/auth\/guest/);
  assert.match(login, /login-hero\.jpg/);
  assert.doesNotMatch(login, /login-silhouette\.png/);
  assert.doesNotMatch(login, /filter:brightness\(0\)/);
  assert.ok(existsSync(new URL('../public/game.html', import.meta.url)));
});

test('login gate supports desktop, mobile, short screens, and iOS safe areas', () => {
  assert.match(login, /overflow-x:hidden;overflow-y:auto/);
  assert.match(login, /min-height:100svh/);
  assert.match(login, /env\(safe-area-inset-top\)/);
  assert.match(login, /env\(safe-area-inset-bottom\)/);
  assert.match(login, /\.foot\{position:static/);
  assert.match(login, /\.foot\{[^}]*font:900 12px monospace/);
  assert.match(login, /background:rgba\(5,7,13,\.72\)/);
  assert.match(login, /font:700 16px Arial/);
});

test('worker creates a signed guest session and routes OAuth back to game', () => {
  assert.match(worker, /path === '\/auth\/guest' && request\.method === 'POST'/);
  assert.match(worker, /async function guest/);
  assert.match(worker, /new Response\(null, \{ status: 302, headers: \{ Location: '\/game\.html\?login=1' \} \}\)/);
  assert.match(worker, /guest_/);
  assert.match(worker, /try \{ form = await request\.formData\(\); \} catch/);
  assert.match(worker, /Cache-Control', 'no-store'/);
});

test('Cloudflare routes auth and API requests through the Worker first', () => {
  const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(config, /"run_worker_first":\s*\[\s*"\/auth\/\*",\s*"\/api\/\*",\s*"\/logout"\s*\]/);
});
