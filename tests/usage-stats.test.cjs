const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const TAB = { id: 7 };
const SCHEDULER = 'https://tamu.collegescheduler.com/terms/Spring%202027/courses/123';

function setup({ enabled = true, firefox = false, granted = false, updateUrl = 'https://clients2.google.com/service/update2/crx' } = {}) {
  const sent = [];
  const listener = { addListener() {} };
  const context = {
    URL, Headers, Response, Date, JSON, Object, Number, Math, String, Promise, exports: {},
    navigator: { language: 'en-US' },
    fetch: async (url, init) => {
      sent.push({ url, init, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ cache: 'tok' }), { headers: { 'content-type': 'application/json' } });
    },
    chrome: {
      runtime: {
        id: 'test', onMessage: listener, onStartup: listener, onInstalled: listener,
        getURL: () => (firefox ? 'moz-extension://abc/' : 'chrome-extension://abc/'),
        getManifest: () => ({ version: '9.9.9', ...(updateUrl ? { update_url: updateUrl } : {}) }),
      },
      alarms: { onAlarm: listener, create() {} },
      cookies: { get: async () => null },
      storage: { sync: { get: async defaults => ({ ...defaults, ...(enabled ? {} : { usageStatsEnabled: false }) }) } },
      permissions: { contains: async () => granted },
    },
  };
  vm.createContext(context);
  const code = ts.transpileModule(fs.readFileSync('src/background.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInContext(code, context);
  return { context, sent };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 10));

test('sends an allowlisted event with the site taken from the sender', async () => {
  const { context, sent } = setup();
  context.handleUsageMessage(
    { name: 'ext-page-enhanced', data: { page: 'sections' }, screen: '1920x1080' },
    { tab: TAB, url: SCHEDULER },
  );
  await flush();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, 'https://stats.nitheeshk.com/api/send');
  assert.equal(sent[0].init.credentials, 'omit');
  const { type, payload } = sent[0].body;
  assert.equal(type, 'event');
  assert.equal(payload.website, '7efa90af-63b9-4c90-9287-510bd8e41d2e');
  assert.equal(payload.hostname, 'extension.aggiesbp');
  assert.equal(payload.url, '/extension/collegescheduler/sections');
  assert.equal(payload.screen, '1920x1080');
  assert.deepEqual({ ...payload.data }, { page: 'sections', site: 'collegescheduler', version: '9.9.9' });
});

test('drops unknown events, unknown keys and free text', async () => {
  const { context, sent } = setup();
  const sender = { tab: TAB, url: SCHEDULER };
  context.handleUsageMessage({ name: 'ext-anything', data: {} }, sender);
  context.handleUsageMessage({ name: 'ext-panel-open', data: { page: 'sections', professor: 'Jane Doe' } }, sender);
  context.handleUsageMessage({ name: 'ext-panel-open', data: { page: 'CSCE 121' } }, sender);
  context.handleUsageMessage({ name: 'ext-fit-import', data: { blocks: 'many' } }, sender);
  context.handleUsageMessage({ name: 'ext-popup-open' }, { url: 'https://evil.example/' });
  await flush();
  assert.equal(sent.length, 0);
});

test('honours the opt-out and Firefox data collection consent', async () => {
  for (const options of [{ enabled: false }, { firefox: true, granted: false }]) {
    const { context, sent } = setup(options);
    context.handleUsageMessage({ name: 'ext-popup-open' }, { url: 'chrome-extension://abc/index.html' });
    await flush();
    assert.equal(sent.length, 0, JSON.stringify(options));
  }
  const { context, sent } = setup({ firefox: true, granted: true });
  context.handleUsageMessage({ name: 'ext-popup-open' }, { url: 'moz-extension://abc/index.html' });
  await flush();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].body.payload.url, '/extension/popup');
});

test('rate limits a single tab and drops quick duplicates', async () => {
  const { context, sent } = setup();
  const sender = { tab: TAB, url: SCHEDULER };
  context.handleUsageMessage({ name: 'ext-seat-alert-add', data: { source: 'scan' } }, sender);
  context.handleUsageMessage({ name: 'ext-seat-alert-add', data: { source: 'scan' } }, sender);
  for (let i = 0; i < 20; i++) context.handleUsageMessage({ name: 'ext-fit-import', data: { blocks: i } }, sender);
  await flush();
  assert.equal(sent.length, 10);
});

test('unpacked builds report under a separate hostname; counts are capped', async () => {
  const { context, sent } = setup({ updateUrl: null });
  context.handleUsageMessage({ name: 'ext-howdy-import', data: { courses: 99999 } }, { tab: TAB, url: 'https://howdy.tamu.edu/main/home/degree-planner-ui/planner' });
  await flush();
  assert.equal(sent[0].body.payload.hostname, 'extension-dev.aggiesbp');
  assert.equal(sent[0].body.payload.url, '/extension/howdy');
  assert.equal(sent[0].body.payload.data.courses, 1000);
});

test('install and update events', async () => {
  const { context, sent } = setup();
  context.reportInstall({ reason: 'install' });
  context.reportInstall({ reason: 'update', previousVersion: '9.9.8' });
  context.reportInstall({ reason: 'chrome_update', previousVersion: '9.9.9' });
  await flush();
  assert.deepEqual(sent.map(s => s.body.payload.name), ['ext-installed', 'ext-updated']);
  assert.equal(sent[1].body.payload.data.previousVersion, '9.9.8');
  assert.equal(sent[0].body.payload.data.browser, 'chrome');
});

test('page-enhanced accepts only weight 5; access prompt accepts only known results', async () => {
  const { context, sent } = setup();
  const src = { tab: TAB, url: SCHEDULER };
  context.handleUsageMessage({ name: 'ext-page-enhanced', data: { page: 'sections', weight: 5 } }, src);
  context.handleUsageMessage({ name: 'ext-page-enhanced', data: { page: 'planner', weight: 6 } }, src);
  context.handleUsageMessage({ name: 'ext-page-enhanced', data: { page: 'evaluate', weight: '5' } }, src);
  context.handleUsageMessage({ name: 'ext-access-prompt', data: { result: 'maybe' } }, { url: 'chrome-extension://abc/connect.html' });
  context.handleUsageMessage({ name: 'ext-access-prompt', data: { result: 'shown' } }, { url: 'chrome-extension://abc/connect.html' });
  await flush();
  assert.equal(sent.length, 2);
  assert.equal(sent[0].body.payload.data.weight, 5);
  assert.equal(sent[1].body.payload.name, 'ext-access-prompt');
  assert.equal(sent[1].body.payload.data.result, 'shown');
});

test('sampling helper: 1 in 5, loads are sent at most once with weight 5', () => {
  const sentMsgs = [];
  const context = {
    exports: {}, JSON, Math, Set, screen: { width: 1, height: 2 },
    chrome: { runtime: { sendMessage: (m) => sentMsgs.push(m), lastError: null } },
  };
  vm.createContext(context);
  const code = ts.transpileModule(fs.readFileSync('src/utils/usage.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInContext(code, context);
  const u = context.exports;
  assert.equal(u.shouldSample(0.19), true);
  assert.equal(u.shouldSample(0.2), false);
  assert.equal(u.shouldSample(0.99), false);
  context.Math = { random: () => 0.1 };
  vm.runInContext('Math.random = () => 0.1', context);
  u.reportSampled('ext-page-enhanced', { page: 'sections' });
  u.reportSampled('ext-page-enhanced', { page: 'sections' });
  assert.equal(sentMsgs.length, 1);
  assert.deepEqual({ ...sentMsgs[0].data }, { page: 'sections', weight: 5 });
});
