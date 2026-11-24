import fs from 'node:fs';
import path from 'node:path';
import { expect, type BrowserContext, type Route } from '@playwright/test';
import { FIXTURE_DIR } from '../paths';
import { API, COLLEGE_SCHEDULER, DESIRED_COURSES, HOWDY, PROFESSORS, REVIEWS, SITE, STATS, TERMS, TERM_CODE } from './data';

/** One usage event the extension tried to send to the stats server. */
export interface StatsEvent {
  name: string;
  url: string;
  hostname: string;
  data: Record<string, unknown>;
  /** The raw request body, for privacy checks. */
  raw: string;
}

export interface Mocks {
  /** Usage events (POST bodies) that reached stats.nitheeshk.com. The real server is never contacted. */
  stats: StatsEvent[];
  /** "METHOD url" of every request that was answered with a mock, for assertions on what the extension asked for. */
  requests: string[];
  /** Requests nothing mocked. They are aborted, so a test can prove nothing leaked to the real network. */
  unmocked: string[];
  /** Wait until a usage event with this name was sent. */
  waitForStat(name: string, match?: (event: StatsEvent) => boolean): Promise<StatsEvent>;
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });

const html = (route: Route, file: string) =>
  route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8') });

/**
 * Serves College Scheduler and Howdy pages from fixtures at their real URLs (so the manifest's
 * content script matches apply), answers the AggieSB+ API with small JSON responses, and
 * swallows analytics. Everything else on the network is aborted.
 *
 * This is a context-level route, so it also covers requests made by the extension's service
 * worker (the background script).
 */
export const E2E_ACCESS_TOKEN = 'e2e-access';

export async function installMocks(context: BrowserContext): Promise<Mocks> {
  const mocks: Mocks = {
    stats: [],
    requests: [],
    unmocked: [],
    async waitForStat(name, match = () => true) {
      await expect.poll(() => mocks.stats.some(event => event.name === name && match(event)), {
        message: `usage event "${name}" was sent`,
      }).toBe(true);
      return mocks.stats.find(event => event.name === name && match(event)) as StatsEvent;
    },
  };

  // Lowest priority (registered first): refuse any other web request.
  await context.route(url => /^https?:$/.test(url.protocol), route => {
    const request = route.request();
    mocks.unmocked.push(`${request.method()} ${request.url()}`);
    return route.abort('blockedbyclient');
  });

  // Web fonts requested by the extension's stylesheets and pages; the look is irrelevant here.
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

  await context.route(`${COLLEGE_SCHEDULER}/**`, route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    mocks.requests.push(`${request.method()} ${request.url()}`);
    if (pathname.startsWith('/api/')) {
      if (/^\/api\/terms\/[^/]+\/desiredcourses\/?$/.test(pathname)) return json(route, DESIRED_COURSES);
      return json(route, { message: 'not mocked' }, 404);
    }
    if (/\/currentschedule$/.test(pathname)) return html(route, 'collegescheduler-currentschedule.html');
    if (/\/courses\/\d+$/.test(pathname)) return html(route, 'collegescheduler-sections.html');
    return html(route, 'collegescheduler-cart.html');
  });

  await context.route(`${HOWDY}/**`, route => {
    const request = route.request();
    mocks.requests.push(`${request.method()} ${request.url()}`);
    return html(route, new URL(request.url()).pathname.endsWith('/planner') ? 'howdy-planner.html' : 'howdy-curriculum.html');
  });

  // Pages the extension opens in new tabs (planner import, fit import). Their content is irrelevant.
  await context.route(`${SITE}/**`, route => {
    mocks.requests.push(`${route.request().method()} ${route.request().url()}`);
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>AggieSB+ (mock)</title><h1>AggieSB+ (mock site)</h1>' });
  });

  await context.route(`${API}/**`, route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    mocks.requests.push(`${request.method()} ${request.url()}`);

    if (pathname === '/terms') return json(route, TERMS);
    if (pathname === `/sections/${TERM_CODE}/course/CSCE121/professors/details`) return json(route, { professors: PROFESSORS });
    if (/^\/professor\/[^/]+\/reviews$/.test(pathname)) return json(route, REVIEWS);
    if (pathname === '/professor/find') return json(route, { matches: [] });
    // A test can sign in by setting the st-access-token cookie to E2E_ACCESS_TOKEN.
    const signedIn = request.headers()['authorization'] === `Bearer ${E2E_ACCESS_TOKEN}`;
    if (pathname === '/users/me' && signedIn) return json(route, { primary_email: 'student@example.test' });
    if (pathname === '/auth/signout') return json(route, { status: 'OK' });
    // Signed out: the extension shows "Not signed in" and a sign-in link.
    if (pathname === '/users/me' || pathname.startsWith('/users/tracking')) return json(route, { detail: 'Unauthorized' }, 401);
    return json(route, { detail: 'not mocked' }, 404);
  });

  await context.route(`${STATS}/**`, route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const raw = request.postData() ?? '';
    try {
      const payload = (JSON.parse(raw) as { payload: { name: string; url: string; hostname: string; data?: Record<string, unknown> } }).payload;
      mocks.stats.push({ name: payload.name, url: payload.url, hostname: payload.hostname, data: payload.data ?? {}, raw });
    } catch {
      mocks.stats.push({ name: '(unparseable)', url: '', hostname: '', data: {}, raw });
    }
    return route.fulfill({ status: 204, headers: CORS });
  });

  return mocks;
}
