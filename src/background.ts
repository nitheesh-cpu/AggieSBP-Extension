const REFRESH_ALARM = 'agsbp-session-refresh';
const REFRESH_PERIOD_MINUTES = 25; // refresh before typical 30-min token expiry

const API_ORIGINS = [
  'https://api-aggiesbp.nitheeshk.com',
  'http://localhost:8000',
];

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed');
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MINUTES });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MINUTES });
  // Refresh immediately on browser start so the first request succeeds
  void proactiveRefresh();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) void proactiveRefresh();
});

async function proactiveRefresh(): Promise<void> {
  for (const origin of API_ORIGINS) {
    try {
      const ok = await refreshSession(origin);
      if (ok) return; // one success is enough
    } catch { /* ignore */ }
  }
}

const WEB_DOMAINS = [
  'https://aggieschedulebuilderplus.vercel.app',
  'https://aggieschedulebuilderplus-dev.vercel.app',
  'http://localhost:3000',
  'http://localhost:8000',
];

async function getAuthHeader(): Promise<string | null> {
  for (const domain of WEB_DOMAINS) {
    try {
      const cookie = await chrome.cookies.get({ url: domain, name: 'st-access-token' });
      if (cookie?.value) return `Bearer ${cookie.value}`;
    } catch { /* ignore */ }
  }
  return null;
}

// Extract origin (scheme + host + port) from a full URL
function getOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ''; }
}

// Call the SuperTokens refresh endpoint and return whether it succeeded
async function refreshSession(apiOrigin: string): Promise<boolean> {
  try {
    const resp = await fetch(`${apiOrigin}/auth/session/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function fetchWithAuth(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
  const authHeader = await getAuthHeader();
  const init: RequestInit = { ...options, credentials: 'include' };
  init.headers = { ...(options.headers ?? {}), ...(authHeader ? { Authorization: authHeader } : {}) };

  const response = await fetch(url, init);

  // SuperTokens signals token expiry with 401 + "try refresh token"
  if (response.status === 401) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (typeof body.message === 'string' && body.message.toLowerCase().includes('refresh')) {
      const refreshed = await refreshSession(getOrigin(url));
      if (refreshed) {
        // Re-read the new access token and retry once
        const newAuth = await getAuthHeader();
        const retryHeaders: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) };
        if (newAuth) retryHeaders['Authorization'] = newAuth;
        const retry = await fetch(url, { ...options, credentials: 'include', headers: retryHeaders });
        const ct = retry.headers.get('content-type') ?? '';
        const data = ct.includes('application/json') ? await retry.json() : null;
        return { ok: retry.ok, status: retry.status, data };
      }
    }
    return { ok: false, status: 401, data: body };
  }

  const ct = response.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? await response.json() : null;
  return { ok: response.ok, status: response.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'API_TRACKING_FETCH') {
    const { url, options } = message.payload;
    fetchWithAuth(url, options ?? {})
      .then(sendResponse)
      .catch((err) => {
        console.error('Fetch error in background:', err);
        sendResponse({ ok: false, status: 0, data: null });
      });
    return true; // keep message channel open for async response
  }
});
