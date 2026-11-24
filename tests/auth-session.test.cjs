const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const WEB = 'https://aggieschedulebuilderplus.vercel.app';
const API = 'https://api-aggiesbp.nitheeshk.com';
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', ...headers },
});

function setup(fetch, tokens = { 'st-access-token': 'old-access', 'st-refresh-token': 'refresh' }) {
  const jar = new Map(Object.entries(tokens).map(([name, value]) => [`${WEB}:${name}`, {
    name, value, path: '/', hostOnly: true, secure: true, httpOnly: false,
    sameSite: 'lax', expirationDate: Date.now() / 1000 + 36000,
  }]));
  const listener = { addListener() {} };
  const context = {
    URL, Headers, Response, Date, fetch, exports: {},
    chrome: {
      runtime: { id: 'test', getURL: path => `chrome-extension://test/${path}`, onMessage: { addListener(fn) { context.onMessageListener = fn; } }, onStartup: listener, onInstalled: listener },
      alarms: { onAlarm: listener, create() {} },
      cookies: {
        get: async ({ url, name }) => jar.get(`${url}:${name}`) || null,
        set: async cookie => { jar.set(`${cookie.url}:${cookie.name}`, { ...cookie, hostOnly: !cookie.domain }); return cookie; },
        remove: async ({ url, name }) => jar.delete(`${url}:${name}`),
      },
    },
  };
  vm.createContext(context);
  const code = ts.transpileModule(fs.readFileSync('src/background.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInContext(code, context);
  return { context, jar };
}

test('expired access token refreshes and retries using rotated header tokens', async () => {
  let refreshCount = 0;
  const { context, jar } = setup(async (url, init) => {
    if (url.endsWith('/auth/session/refresh')) {
      refreshCount++;
      assert.equal(init.headers.Authorization, 'Bearer refresh');
      assert.equal(init.headers['st-auth-mode'], 'header');
      return json({}, 200, { 'st-access-token': 'new-access', 'st-refresh-token': 'new-refresh', 'front-token': 'new-front' });
    }
    return new Headers(init.headers).get('Authorization') === 'Bearer new-access'
      ? json({ primary_email: 'student@example.test' }) : json({}, 401);
  });
  const result = await context.getAuthStatus();
  assert.equal(result.state, 'signed_in');
  assert.equal(result.email, 'student@example.test');
  assert.equal(refreshCount, 1);
  assert.equal(jar.get(`${WEB}:st-refresh-token`).value, 'new-refresh');
  assert.equal(jar.get(`${WEB}:sFrontToken`).value, 'new-front');
});

test('parallel expired requests share one refresh', async () => {
  let refreshCount = 0;
  const { context } = setup(async (url, init) => {
    if (url.endsWith('/auth/session/refresh')) {
      refreshCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return json({}, 200, { 'st-access-token': 'new-access', 'st-refresh-token': 'new-refresh' });
    }
    return new Headers(init.headers).get('Authorization') === 'Bearer new-access' ? json([]) : json({}, 401);
  });
  const results = await Promise.all([context.fetchWithAuth(`${API}/users/tracking`), context.fetchWithAuth(`${API}/users/tracking`)]);
  assert(results.every(result => result.ok));
  assert.equal(refreshCount, 1);
});

test('sign-out during refresh is not undone by a late response', async () => {
  let jar;
  const setupResult = setup(async () => {
    jar.clear();
    return json({}, 200, { 'st-access-token': 'late-access', 'st-refresh-token': 'late-refresh' });
  });
  jar = setupResult.jar;
  const result = await setupResult.context.refreshSession({ web: WEB, api: API });
  assert.equal(result, false);
  assert.equal(jar.size, 0);
});

test('network failure is not reported as signed out', async () => {
  const { context } = setup(async () => { throw new Error('offline'); });
  assert.equal((await context.getAuthStatus()).state, 'unavailable');
});

test('signed-out users do not attempt refresh without a refresh token', async () => {
  const urls = [];
  const { context } = setup(async url => { urls.push(url); return json({}, 401); }, {});
  assert.equal((await context.getAuthStatus()).state, 'signed_out');
  assert.equal(urls.length, 1);
});

test('legacy API without account endpoint still confirms signed-in status', async () => {
  const { context } = setup(async url => url.endsWith('/users/me') ? json({}, 404) : json([]));
  assert.equal((await context.getAuthStatus()).state, 'signed_in');
});

test('credentials are never sent to an unrelated origin or endpoint', async () => {
  let requests = 0;
  const { context } = setup(async () => { requests++; return json({}); });
  assert.equal((await context.fetchWithAuth('https://other.example/users/me')).status, 403);
  assert.equal((await context.fetchWithAuth(`${API}/unexpected`)).status, 403);
  assert.equal(requests, 0);
});

test('localhost session is never used against production', async () => {
  const { context, jar } = setup(async (_url, init) => {
    assert.equal(new Headers(init.headers).get('Authorization'), null);
    return json({}, 401);
  }, {});
  jar.set('http://localhost:3000:st-access-token', { value: 'local-access' });
  assert.equal((await context.getAuthStatus()).state, 'signed_out');
});

const NEW_WEB = 'https://aggiesbp.com';

test('session on the new domain is used and preferred over the old one (D-020)', async () => {
  const { context, jar } = setup(async (_url, init) => (
    new Headers(init.headers).get('Authorization') === 'Bearer new-domain-access'
      ? json({ primary_email: 'student@example.test' }) : json({}, 401)
  ));
  jar.set(`${NEW_WEB}:st-access-token`, { name: 'st-access-token', value: 'new-domain-access' });
  const result = await context.getAuthStatus();
  assert.equal(result.state, 'signed_in');
});

test('without access to the new domain the old session still works (D-020)', async () => {
  const { context } = setup(async (_url, init) => (
    new Headers(init.headers).get('Authorization') === 'Bearer old-access'
      ? json({ primary_email: 'student@example.test' }) : json({}, 401)
  ));
  const get = context.chrome.cookies.get;
  context.chrome.cookies.get = async details => {
    if (details.url === NEW_WEB) throw new Error('No host permissions for cookies at url');
    return get(details);
  };
  assert.equal((await context.getAuthStatus()).state, 'signed_in');
});

test('sign out revokes the session and clears sign-in cookies on both domains (D-021)', async () => {
  const calls = [];
  const { context, jar } = setup(async (url, init) => { calls.push([url, new Headers(init.headers).get('Authorization')]); return json({}); });
  jar.set(`${NEW_WEB}:st-refresh-token`, { name: 'st-refresh-token', value: 'new-refresh' });
  jar.set(`${NEW_WEB}:sFrontToken`, { name: 'sFrontToken', value: 'front' });
  const result = await context.signOut();
  assert.equal(result.ok, true);
  assert.deepEqual(calls.map(([url]) => url), [`${API}/auth/signout`, `${API}/auth/signout`]);
  assert.equal(calls[1][1], 'Bearer old-access');
  assert.equal([...jar.keys()].filter(key => key.startsWith(NEW_WEB) || key.startsWith(WEB)).length, 0);
});

test('sign out still clears cookies when the API is unreachable (D-021)', async () => {
  const { context, jar } = setup(async () => { throw new Error('offline'); });
  const result = await context.signOut();
  assert.equal(result.ok, false);
  assert.equal(jar.size, 0);
});

test('sign out refreshes an expired token before revoking (D-021)', async () => {
  const { context } = setup(async (url, init) => {
    if (url.endsWith('/auth/session/refresh')) return json({}, 200, { 'st-access-token': 'new-access', 'st-refresh-token': 'new-refresh' });
    return new Headers(init.headers).get('Authorization') === 'Bearer new-access' ? json({}) : json({}, 401);
  });
  assert.equal((await context.signOut()).ok, true);
});

test('sign out works without access to the new domain (D-021)', async () => {
  const { context, jar } = setup(async () => json({}));
  const { get, remove } = context.chrome.cookies;
  context.chrome.cookies.get = async details => { if (details.url === NEW_WEB) throw new Error('No host permissions'); return get(details); };
  context.chrome.cookies.remove = async details => { if (details.url === NEW_WEB) throw new Error('No host permissions'); return remove(details); };
  assert.equal((await context.signOut()).ok, true);
  assert.equal(jar.size, 0);
});

test('content scripts cannot sign the user out (D-021)', async () => {
  let fetched = false;
  const { context, jar } = setup(async () => { fetched = true; return json({}); });
  const response = await new Promise(resolve => {
    const kept = context.onMessageListener({ type: 'SIGN_OUT' }, { id: 'test', tab: { id: 1 }, url: 'https://tamu.collegescheduler.com/' }, resolve);
    if (kept !== true) setTimeout(() => resolve('no response'), 50);
  });
  assert.equal(response.ok, false);
  assert.equal(fetched, false);
  assert.equal(jar.size, 2);
});

test('the popup can sign out, also when opened in a tab (D-021)', async () => {
  const { context, jar } = setup(async () => json({}));
  const response = await new Promise(resolve => {
    context.onMessageListener({ type: 'SIGN_OUT' }, { id: 'test', tab: { id: 2 }, url: 'chrome-extension://test/index.html' }, resolve);
  });
  assert.equal(response.ok, true);
  assert.equal(jar.size, 0);
});
