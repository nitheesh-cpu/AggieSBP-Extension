// Keep this entry self-contained: content scripts cannot import shared ES module chunks.
const EXTERNAL_API_BASE = 'https://api-aggiesbp.nitheeshk.com';

const REFRESH_ALARM = 'agsbp-session-refresh';
const SESSION_SOURCES = [
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

chrome.runtime.onInstalled.addListener(details => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 25 });
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message.type === 'AUTH_STATUS') {
    getAuthStatus().then(sendResponse);
    return true;
  }
  if (message.type === 'API_TRACKING_FETCH') {
    fetchWithAuth(message.payload.url, message.payload.options ?? {})
      .then(sendResponse).catch(() => sendResponse({ ok: false, status: 0, data: null }));
    return true;
  }
});
