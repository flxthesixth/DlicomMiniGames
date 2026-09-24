// DLICOM RUNNER Worker: X OAuth login + static assets.
// Routes: /auth/x (start), /auth/x/callback (token exchange), /api/me, /logout
// Secrets (set via `npx wrangler secret put`): X_CLIENT_ID, X_CLIENT_SECRET, SESSION_SECRET, X_REDIRECT_URI
// Credentials never touch the repo or the client; sessions are signed HMAC cookies.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/auth/x') return startAuth(env, url);
    if (path === '/auth/x/callback') return callback(env, request, url);
    if (path === '/auth/guest' && request.method === 'POST') return guest(env, request);
    if (path === '/api/me') return me(env, request);
    if (path === '/api/referral' && request.method === 'GET') return referral(env, request);
    if (path === '/api/referral/apply' && request.method === 'POST') return applyReferral(env, request);
    if (path === '/api/scores' && request.method === 'GET') return topScores(env, url);
    if (path === '/api/scores/submit' && request.method === 'POST') return submitScore(env, request);
    if (path === '/logout') return logout();
    if (path === '/game.html' && !(await verifySession(request.headers.get('Cookie') || '', env.SESSION_SECRET))) {
      return Response.redirect(`${url.origin}/`, 302);
    }

    const asset = await env.ASSETS.fetch(request);
    if (path === '/' || path === '/index.html' || path === '/game.html') {
      const headers = new Headers(asset.headers);
      headers.set('Cache-Control', 'no-store');
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }
    return asset;
  },
};

function b64url(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(payload, secret) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(sig);
}

function startAuth(env, url) {
  if (!env.X_CLIENT_ID || !env.SESSION_SECRET) {
    return json({ error: 'oauth_not_configured' }, 503);
  }
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then((digest) => {
    const challenge = b64url(new Uint8Array(digest));
    const redirect = env.X_REDIRECT_URI || `${url.origin}/auth/x/callback`;
    const auth = new URL('https://x.com/i/oauth2/authorize');
    auth.searchParams.set('response_type', 'code');
    auth.searchParams.set('client_id', env.X_CLIENT_ID);
    auth.searchParams.set('redirect_uri', redirect);
    auth.searchParams.set('scope', 'users.read tweet.read');
    auth.searchParams.set('state', state);
    auth.searchParams.set('code_challenge', challenge);
    auth.searchParams.set('code_challenge_method', 'S256');
    const resp = new Response(null, { status: 302, headers: { Location: auth.toString() } });
    resp.headers.append(
      'Set-Cookie',
      `x_oauth_${state}=${verifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );
    return resp;
  });
}

async function callback(env, request, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err || !code || !state) return json({ error: err || 'missing_code' }, 400);

  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp(`x_oauth_${state}=([^;]+)`));
  if (!m) return json({ error: 'state_mismatch' }, 400);
  const verifier = m[1];

  const redirect = env.X_REDIRECT_URI || `${url.origin}/auth/x/callback`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect,
    client_id: env.X_CLIENT_ID,
    code_verifier: verifier,
  });
  const basic = btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`);
  const tokenResp = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basic}` },
    body,
  });
  if (!tokenResp.ok) return json({ error: 'token_exchange_failed' }, 502);
  const tokens = await tokenResp.json();

  const meResp = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,username,name', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!meResp.ok) return json({ error: 'profile_failed' }, 502);
  const profile = await meResp.json();
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO x_users (x_id, username, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(x_id) DO UPDATE SET username = excluded.username, updated_at = excluded.updated_at`
    ).bind(profile.data.id, profile.data.username, Date.now()).run();
  }

  const payload = JSON.stringify({
    id: profile.data.id,
    username: profile.data.username,
    name: profile.data.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const sig = await sign(payload, env.SESSION_SECRET);
  const resp = new Response(null, { status: 302, headers: { Location: '/game.html?login=1' } });
  resp.headers.append('Set-Cookie', `session=${b64url(new TextEncoder().encode(payload))}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  resp.headers.append('Set-Cookie', `x_oauth_${state}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  return resp;
}

async function verifySession(cookie, secret) {
  const m = cookie.match(/session=([A-Za-z0-9_\-]+)\.([A-Za-z0-9_\-]+)/);
  if (!m) return null;
  const [, data, sig] = m;
  const payload = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  if ((await sign(payload, secret)) !== sig) return null;
  const session = JSON.parse(payload);
  if (!session.exp || session.exp < Date.now()) return null;
  return session;
}

async function me(env, request) {
  if (!env.SESSION_SECRET) return json({ error: 'oauth_not_configured' }, 503);
  const session = await verifySession(request.headers.get('Cookie') || '', env.SESSION_SECRET);
  if (!session) return json({ user: null, bestScore: 0 }, 200);
  const row = env.DB ? await env.DB.prepare('SELECT score FROM scores WHERE x_id = ?1').bind(session.id).first() : null;
  return json({
    user: { id: session.id, username: session.username, name: session.name, guest: !!session.guest },
    bestScore: row?.score || 0,
  });
}

function logout() {
  const resp = new Response(null, { status: 302, headers: { Location: '/' } });
  resp.headers.append('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return resp;
}

async function guest(env, request) {
  if (!env.SESSION_SECRET) return new Response(null, { status: 302, headers: { Location: '/?error=login' } });
  let form;
  try { form = await request.formData(); } catch {
    return new Response(null, { status: 302, headers: { Location: '/?error=name' } });
  }
  const name = String(form.get('name') || '').trim().replace(/\s+/g, ' ');
  if (!/^[A-Za-z0-9_ .-]{2,24}$/.test(name)) {
    return new Response(null, { status: 302, headers: { Location: '/?error=name' } });
  }
  const payload = JSON.stringify({
    id: `guest_${b64url(new TextEncoder().encode(name))}`,
    username: name,
    name,
    guest: true,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const sig = await sign(payload, env.SESSION_SECRET);
  const resp = new Response(null, { status: 302, headers: { Location: '/game.html?login=1' } });
  resp.headers.append('Set-Cookie', `session=${b64url(new TextEncoder().encode(payload))}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  return resp;
}

async function referral(env, request) {
  const session = await verifySession(request.headers.get('Cookie') || '', env.SESSION_SECRET);
  if (!session || session.guest) return json({ error: 'referral_requires_x' }, 403);
  return json({ code: `@${session.username}` });
}

async function applyReferral(env, request) {
  const session = await verifySession(request.headers.get('Cookie') || '', env.SESSION_SECRET);
  if (!session || session.guest) return json({ error: 'referral_requires_x' }, 403);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const username = String(data.code || '').trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(username)) return json({ error: 'bad_referral' }, 400);
  const inviter = await env.DB.prepare('SELECT x_id FROM x_users WHERE username = ?1 COLLATE NOCASE').bind(username).first();
  if (!inviter || inviter.x_id === session.id) return json({ error: 'bad_referral' }, 400);
  await env.DB.prepare(
    'INSERT OR IGNORE INTO referrals (invitee_x_id, inviter_x_id, created_at) VALUES (?1, ?2, ?3)'
  ).bind(session.id, inviter.x_id, Date.now()).run();
  return json({ ok: true });
}

async function topScores(env, url) {
  if (!env.DB) return json({ error: 'leaderboard_not_configured' }, 503);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
  const { results } = await env.DB.prepare(
    'SELECT username, name, score, combo FROM scores ORDER BY score DESC LIMIT ?1'
  ).bind(limit).all();
  return json({ scores: results });
}

async function submitScore(env, request) {
  if (!env.DB) return json({ error: 'leaderboard_not_configured' }, 503);
  const session = await verifySession(request.headers.get('Cookie') || '', env.SESSION_SECRET);
  if (!session) return json({ error: 'login_required' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const score = Math.floor(Number(body.score));
  const combo = Math.floor(Number(body.combo || 0));
  if (!Number.isFinite(score) || score < 0 || score > 10_000_000) return json({ error: 'bad_score' }, 400);
  await env.DB.prepare(
    `INSERT INTO scores (x_id, username, name, score, combo, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(x_id) DO UPDATE SET
       score = MAX(score, excluded.score),
       combo = MAX(combo, excluded.combo),
       username = excluded.username,
       name = excluded.name,
       updated_at = excluded.updated_at`
  ).bind(session.id, session.username, session.name || null, score, combo, Date.now()).run();
  const rank = await env.DB.prepare(
    'SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?1'
  ).bind(score).first();
  return json({ ok: true, rank: rank.rank });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
