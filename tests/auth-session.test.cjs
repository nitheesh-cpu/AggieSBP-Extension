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
      runtime: { id: 'test', onMessage: listener, onStartup: listener, onInstalled: listener },
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
