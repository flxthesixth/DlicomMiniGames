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
    if (path === '/api/me') return me(env, request);
    if (path === '/logout') return logout();

    return env.ASSETS.fetch(request);
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

  const payload = JSON.stringify({
    id: profile.data.id,
    username: profile.data.username,
    name: profile.data.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const sig = await sign(payload, env.SESSION_SECRET);
  const resp = new Response(null, { status: 302, headers: { Location: '/?login=1' } });
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
  if (!session) return json({ user: null }, 200);
  return json({ user: { id: session.id, username: session.username, name: session.name } });
}

function logout() {
  const resp = new Response(null, { status: 302, headers: { Location: '/' } });
  resp.headers.append('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return resp;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
