// Keep this entry self-contained: content scripts cannot import shared ES module chunks.
// Intentional: no `import` anywhere in this file (classic script on Firefox, run in a VM by tests). See docs/context/gotchas.md G-006
const EXTERNAL_API_BASE = 'https://api-aggiesbp.nitheeshk.com';

const REFRESH_ALARM = 'agsbp-session-refresh';
// aggiesbp.com first: the site moved there on 2026-11-24. It is an optional host permission
// granted on connect.html; without it chrome.cookies.get throws and readCookie returns null,
// so the source is skipped. The old address stays for sessions made before the move (D-020).
const SESSION_SOURCES = [
  { web: 'https://aggiesbp.com', api: EXTERNAL_API_BASE },
  { web: 'https://aggieschedulebuilderplus.vercel.app', api: EXTERNAL_API_BASE },
  { web: 'https://aggieschedulebuilderplus-dev.vercel.app', api: EXTERNAL_API_BASE },
  { web: 'http://localhost:3000', api: 'http://localhost:8000' },
];
type SessionSource = typeof SESSION_SOURCES[number];
const refreshes = new Map<string, Promise<boolean>>();

async function readCookie(source: SessionSource, name: string): Promise<chrome.cookies.Cookie | null> {
  try { return await chrome.cookies.get({ url: source.web, name }); }
  catch { return null; }
}

async function getSessionSource(api: string): Promise<SessionSource | null> {
  for (const source of SESSION_SOURCES.filter(source => source.api === api)) {
    if ((await readCookie(source, 'st-access-token'))?.value ||
        (await readCookie(source, 'st-refresh-token'))?.value) return source;
  }
  return null;
}

async function saveCookie(source: SessionSource, name: string, value: string): Promise<void> {
  const previous = await readCookie(source, name);
  if (!value || value === 'remove') {
    await chrome.cookies.remove({ url: source.web, name });
    return;
  }
  await chrome.cookies.set({
    url: source.web, name, value, path: previous?.path || '/',
    ...(previous && !previous.hostOnly ? { domain: previous.domain } : {}),
    secure: previous?.secure ?? source.web.startsWith('https:'),
    httpOnly: previous?.httpOnly ?? false,
    sameSite: previous?.sameSite ?? 'lax',
    expirationDate: previous?.expirationDate ?? (Date.now() / 1000 + 3153600),
    ...(previous?.storeId ? { storeId: previous.storeId } : {}),
  });
}

async function saveResponseTokens(source: SessionSource, response: Response): Promise<void> {
  for (const name of ['st-refresh-token', 'st-access-token']) {
    const value = response.headers.get(name);
    if (value !== null) await saveCookie(source, name, value);
  }
  const frontToken = response.headers.get('front-token');
  if (frontToken !== null) await saveCookie(source, 'sFrontToken', frontToken);
  if (response.headers.has('st-access-token')) {
    await saveCookie(source, 'st-last-access-token-update', String(Date.now()));
  }
}

async function refreshSession(source: SessionSource): Promise<boolean> {
  const existing = refreshes.get(source.web);
  if (existing) return existing;
  const refresh = (async () => {
    const refreshToken = (await readCookie(source, 'st-refresh-token'))?.value;
    if (!refreshToken) return false;
    const response = await fetch(`${source.api}/auth/session/refresh`, {
      method: 'POST', credentials: 'omit',
      headers: { Authorization: `Bearer ${refreshToken}`, rid: 'session', 'st-auth-mode': 'header' },
    });
    // Do not overwrite a website tab's newer session or undo its sign-out.
    if ((await readCookie(source, 'st-refresh-token'))?.value !== refreshToken) {
      return !!(await readCookie(source, 'st-access-token'))?.value;
    }
    if (!response.ok) return false;
    await saveResponseTokens(source, response);
    return !!(await readCookie(source, 'st-access-token'))?.value;
  })();
  refreshes.set(source.web, refresh);
  try { return await refresh; }
  finally { refreshes.delete(source.web); }
}

async function proactiveRefresh(): Promise<void> {
  const source = await getSessionSource(EXTERNAL_API_BASE);
  if (!source) return;
  try { await refreshSession(source); } catch { /* retry on the next request */ }
}

// ---------------------------------------------------------------------------
// Anonymous usage counts
//
// Sent to the self-hosted Umami instance that also tracks the website, from
// this background script only: content scripts and the popup send a
// USAGE_EVENT message (src/utils/usage.ts, popup.js) and every event passes
// the allowlist and rate limits below.
//
// What is sent: an event name, the extension version, a coarse site/page label
// and small counts. Never names, emails, student ids, grades, course codes,
// course lists or professor names.
//
// Opt-out: `usageStatsEnabled` in chrome.storage.sync (popup Settings, default
// on). Firefox only sends if the user granted the optional
// `technicalAndInteraction` data collection permission, which the Firefox
// manifest does not request yet, so Firefox builds currently send nothing.
//
// No extra permissions: /api/send answers CORS with
// `Access-Control-Allow-Origin: *` and requests go out without credentials.
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://stats.nitheeshk.com/api/send';
const WEBSITE_ID = '7efa90af-63b9-4c90-9287-510bd8e41d2e';
// Distinct from the website's hostname so extension traffic is easy to filter in Umami.
const HOSTNAME = 'extension.aggiesbp';
const DEV_HOSTNAME = 'extension-dev.aggiesbp';
const USAGE_STATS_KEY = 'usageStatsEnabled';

type Value = string | number;
type Data = Record<string, Value>;
/** Per event: allowed data keys, each either an enum of strings or a small count. */
type Schema = Record<string, readonly string[] | 'count'>;

const PAGES = ['sections', 'current-schedule', 'scheduler', 'curriculum', 'planner', 'evaluate', 'other'] as const;

/** Events content scripts and the popup may ask for. Anything else is dropped. */
const MESSAGE_EVENTS: Record<string, Schema> = {
  'ext-page-enhanced': { page: PAGES },
  'ext-panel-open': { page: PAGES },
  'ext-professor-action': { action: ['details', 'rmp', 'expand-summary'] },
  'ext-seat-alert-add': { source: ['scan', 'manual'] },
  'ext-howdy-import': { courses: 'count', completed: 'count', inProgress: 'count', planned: 'count', terms: 'count' },
  'ext-fit-import': { blocks: 'count' },
  'ext-popup-open': {},
};

const MAX_COUNT = 1000;
const SOURCE_LIMIT = 10;              // events per tab (or extension page) ...
const SOURCE_WINDOW_MS = 10 * 60_000; // ... per 10 minutes
const GLOBAL_LIMIT = 60;              // events per hour from the whole extension
const DUPLICATE_MS = 5_000;           // identical event from the same source (double clicks)

const recent = new Map<string, number[]>();
const lastSeen = new Map<string, number>();
const globalSent: number[] = [];
let umamiCache: string | undefined;
let serverDisabled = false;

const isFirefox = (): boolean => chrome.runtime.getURL('').startsWith('moz-extension:');

function sanitize(schema: Schema, data: unknown): Data | null {
  if (data !== undefined && (typeof data !== 'object' || data === null || Array.isArray(data))) return null;
  const input = (data ?? {}) as Record<string, unknown>;
  const out: Data = {};
  for (const [key, value] of Object.entries(input)) {
    const rule = schema[key];
    if (!rule) return null;
    if (rule === 'count') {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null;
      out[key] = Math.min(value, MAX_COUNT);
    } else {
      if (typeof value !== 'string' || !rule.includes(value)) return null;
      out[key] = value;
    }
  }
  return out;
}

function siteOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, hostname, pathname } = new URL(url);
    if (hostname === 'tamu.collegescheduler.com') return 'collegescheduler';
    if (hostname === 'howdy.tamu.edu') return 'howdy';
    if (protocol === 'chrome-extension:' || protocol === 'moz-extension:') {
      return pathname.includes('onboarding') ? 'onboarding' : 'popup';
    }
  } catch { /* fall through */ }
  return null;
}

function allowRate(source: string, key: string): boolean {
  const now = Date.now();
  const last = lastSeen.get(key);
  if (last !== undefined && now - last < DUPLICATE_MS) return false;

  while (globalSent.length && now - globalSent[0] > 60 * 60_000) globalSent.shift();
  if (globalSent.length >= GLOBAL_LIMIT) return false;

  const times = (recent.get(source) ?? []).filter(t => now - t < SOURCE_WINDOW_MS);
  if (times.length >= SOURCE_LIMIT) {
    recent.set(source, times);
    return false;
  }
  times.push(now);
  recent.set(source, times);
  globalSent.push(now);
  lastSeen.set(key, now);
  if (lastSeen.size > 200) lastSeen.clear();
  return true;
}

async function isEnabled(): Promise<boolean> {
  if (serverDisabled) return false;
  try {
    const stored = await chrome.storage.sync.get({ [USAGE_STATS_KEY]: true });
    if (stored[USAGE_STATS_KEY] === false) return false;
  } catch {
    return false;
  }
  if (isFirefox()) {
    // Firefox's built-in consent: only send if the user granted interaction-data collection.
    try {
      const permissions = chrome.permissions as unknown as {
        contains(p: { data_collection: string[] }): Promise<boolean>;
      };
      return await permissions.contains({ data_collection: ['technicalAndInteraction'] });
    } catch {
      return false;
    }
  }
  return true;
}

async function send(name: string, url: string, data: Data, screen?: string): Promise<void> {
  if (!(await isEnabled())) return;
  const manifest = chrome.runtime.getManifest() as chrome.runtime.Manifest & { update_url?: string };
  // Store installs have an update_url; unpacked (developer) builds don't, so keep them separate.
  const hostname = isFirefox() || manifest.update_url ? HOSTNAME : DEV_HOSTNAME;
  const payload = {
    website: WEBSITE_ID,
    hostname,
    url,
    title: 'AggieSB+ extension',
    language: navigator.language,
    ...(screen ? { screen } : {}),
    name,
    data: { ...data, version: manifest.version },
  };
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(umamiCache ? { 'x-umami-cache': umamiCache } : {}),
      },
      body: JSON.stringify({ type: 'event', payload }),
    });
    const result = await response.json().catch(() => null) as { cache?: string; disabled?: boolean } | null;
    if (result?.disabled) serverDisabled = true;
    if (typeof result?.cache === 'string') umamiCache = result.cache;
  } catch {
    /* stats are best effort */
  }
}

/** ext-installed / ext-updated, from runtime.onInstalled. */
function reportInstall(details: chrome.runtime.InstalledDetails): void {
  const browser = isFirefox() ? 'firefox' : 'chrome';
  if (details.reason === 'install') {
    void send('ext-installed', '/extension/background', { browser });
  } else if (details.reason === 'update' && details.previousVersion !== chrome.runtime.getManifest().version) {
    void send('ext-updated', '/extension/background', { browser, previousVersion: String(details.previousVersion ?? 'unknown').slice(0, 20) });
  }
}

/**
 * Handles a USAGE_EVENT message from a content script or extension page.
 * Unknown events, unexpected data and anything over the rate limits are dropped.
 */
function handleUsageMessage(message: { name?: unknown; data?: unknown; screen?: unknown }, sender: chrome.runtime.MessageSender): void {
  const name = typeof message.name === 'string' ? message.name : '';
  const schema = Object.prototype.hasOwnProperty.call(MESSAGE_EVENTS, name) ? MESSAGE_EVENTS[name] : null;
  if (!schema) return;
  const data = sanitize(schema, message.data);
  if (!data) return;

  // The site comes from the sender, not the message.
  const site = siteOf(sender.url ?? sender.tab?.url);
  if (!site) return;
  const page = typeof data.page === 'string' ? data.page : '';
  const url = `/extension/${site}${page ? `/${page}` : ''}`;
  const screen = typeof message.screen === 'string' && /^\d{2,5}x\d{2,5}$/.test(message.screen) ? message.screen : undefined;

  const source = sender.tab?.id !== undefined ? `tab:${sender.tab.id}` : site;
  if (!allowRate(source, `${source}|${name}|${JSON.stringify(data)}`)) return;
  void send(name, url, { ...data, site }, screen);
}

chrome.runtime.onInstalled.addListener(details => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 25 });
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
  reportInstall(details);
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 25 });
  void proactiveRefresh();
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === REFRESH_ALARM) void proactiveRefresh();
});

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: unknown }> {
  const target = new URL(url);
  if (!SESSION_SOURCES.some(source => source.api === target.origin) ||
      !/^\/users\/(tracking(?:\/[^/]+)?|me)$/.test(target.pathname)) {
    return { ok: false, status: 403, data: null };
  }
  const source = await getSessionSource(target.origin);
  const request = async (): Promise<Response> => {
    const headers = new Headers(options.headers);
    headers.delete('Authorization');
    headers.set('rid', 'session');
    headers.set('st-auth-mode', 'header');
    const token = source ? (await readCookie(source, 'st-access-token'))?.value : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, credentials: 'omit', headers });
  };
  let response = await request();
  if (response.status === 401 && source && await refreshSession(source)) response = await request();
  if (source) await saveResponseTokens(source, response);
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  return { ok: response.ok, status: response.status, data };
}

async function getAuthStatus(): Promise<{ state: 'signed_in' | 'signed_out' | 'unavailable'; email?: string }> {
  try {
    const response = await fetchWithAuth(`${EXTERNAL_API_BASE}/users/me`);
    if (response.ok) {
      const account = response.data as { primary_email?: string; emails?: string[] };
      return { state: 'signed_in', email: account?.primary_email || account?.emails?.[0] };
    }
    if (response.status === 404) {
      const tracking = await fetchWithAuth(`${EXTERNAL_API_BASE}/users/tracking`);
      if (tracking.ok) return { state: 'signed_in' };
      if (tracking.status === 401) return { state: 'signed_out' };
    }
    return { state: response.status === 401 ? 'signed_out' : 'unavailable' };
  } catch { return { state: 'unavailable' }; }
}

const SESSION_COOKIES = ['st-access-token', 'st-refresh-token', 'sFrontToken', 'st-last-access-token-update'];

/** Asks the API to revoke this source's session. Best effort: the caller clears cookies either way. */
async function revokeSession(source: SessionSource): Promise<boolean> {
  const call = async (): Promise<Response> => {
    const token = (await readCookie(source, 'st-access-token'))?.value;
    return fetch(`${source.api}/auth/signout`, {
      method: 'POST', credentials: 'omit',
      headers: { rid: 'session', 'st-auth-mode': 'header', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  };
  try {
    let response = await call();
    if (response.status === 401 && await refreshSession(source)) response = await call();
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Signs out of AggieSB+ in this browser: revokes each session on the API, then
 * deletes the site's sign-in cookies for every production source (the website
 * shares them, so it is signed out too). A source we lack host access to throws
 * on read and remove; it had no session we could use anyway. D-021.
 */
async function signOut(): Promise<{ ok: boolean }> {
  let ok = true;
  for (const source of SESSION_SOURCES.filter(source => source.api === EXTERNAL_API_BASE)) {
    const hasSession = !!((await readCookie(source, 'st-access-token'))?.value ||
                          (await readCookie(source, 'st-refresh-token'))?.value);
    if (hasSession && !(await revokeSession(source))) ok = false;
    for (const name of SESSION_COOKIES) {
      try { await chrome.cookies.remove({ url: source.web, name }); } catch { /* no host access */ }
    }
  }
  return { ok };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message.type === 'SIGN_OUT') {
    // Extension pages only (the popup, also when opened in a tab). Content scripts report the website's URL.
    if (!sender.url?.startsWith(chrome.runtime.getURL(''))) { sendResponse({ ok: false }); return; }
    signOut().then(sendResponse).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === 'AUTH_STATUS') {
    getAuthStatus().then(sendResponse);
    return true;
  }
  if (message.type === 'OPEN_CONNECT') {
    // Content scripts cannot ask for permissions or open extension pages themselves.
    const from = ['account-status', 'popup', 'onboarding'].includes(message.from) ? message.from : 'connect';
    void chrome.tabs.create({ url: chrome.runtime.getURL(`connect.html?from=${from}`) });
    sendResponse({ ok: true });
    return;
  }
  if (message.type === 'USAGE_EVENT') {
    handleUsageMessage(message, sender);
    sendResponse({ ok: true });
    return;
  }
  if (message.type === 'API_TRACKING_FETCH') {
    fetchWithAuth(message.payload.url, message.payload.options ?? {})
      .then(sendResponse).catch(() => sendResponse({ ok: false, status: 0, data: null }));
    return true;
  }
});
