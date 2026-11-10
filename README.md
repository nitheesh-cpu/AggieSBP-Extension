# AggieSB+ Registration Assistant (browser extension)

A Manifest V3 browser extension for Chrome and Firefox that adds professor grades, ratings and AI review summaries to Texas A&M's College Scheduler, and imports Howdy degree-planner courses into the AggieSB+ schedule builder.

- Live site: https://aggieschedulebuilderplus.vercel.app
- Frontend (Next.js): https://github.com/nitheesh-cpu/AggieSBP-Frontend
- Backend (FastAPI): https://github.com/nitheesh-cpu/AggieSBP-Backend

![Professor panel on a College Scheduler sections page](images/SectionPage-v3.png)

## Features

On `tamu.collegescheduler.com`:

- Professor panel on course sections pages: every professor teaching the course in the selected term, with historical A/B/C/D/F grade distributions, ratings, review statistics and AI-written summaries of student reviews.
- Side-by-side professor comparison that opens on the AggieSB+ site, plus links to each professor's full profile and RateMyProfessor page.
- Seat alerts: watch full sections from the sections, Build Schedule, Shopping Cart and Cart pages. The extension scans the page's section tables for CRNs and seat counts.
- Fit My Schedule: on the Current Schedule page, reads your class meeting blocks and opens the AggieSB+ site to find classes that fit around them.
- Interactive onboarding tour (`onboarding.html`) that opens on first install.
- Light and dark themes, and an in-panel toggle for AI summaries.

On `howdy.tamu.edu` (degree planner):

- An import panel that reads the degree planner's table view and sends your completed, in-progress and planned courses to the AggieSB+ planner for review.

## Engineering highlights

- **Separate, self-contained content-script bundles.** `vite.config.ts` builds `src/content/main.ts` and `src/content/howdy.ts` as standalone `content/*.js` files, since Chrome content scripts cannot load shared ES module chunks. A small Rollup plugin strips trailing `export` statements from those bundles. The service worker (`src/background.ts`) is likewise built with no shared imports.
- **Single-page-app aware injection.** College Scheduler navigates without page loads, so `src/content/main.ts` polls for URL changes, picks a panel by page type (`src/utils/page-detector.ts`) and removes injected UI when you leave a sections page. Courses come from College Scheduler's own `/api/terms/{term}/desiredcourses/` endpoint (`src/services/api.ts`). Results are cached in `localStorage` with a 30 minute TTL (`src/services/cache.ts`).
- **Session sharing with the website.** The service worker reads the AggieSB+ site's SuperTokens session cookies with the `cookies` API and calls the tracking API with a bearer token. It refreshes on a 25 minute alarm and on 401, de-duplicates concurrent refreshes, and will not overwrite a newer session written by a website tab. Requests are restricted to known origins and to the `/users/me` and `/users/tracking` paths (`src/background.ts`).
- **Howdy planner parsing and hand-off.** `src/utils/howdy-planner.ts` reads the planner's table view with DOM-light selectors, maps term labels to term keys (for example `2025 - Fall` to `20253`), derives completed, in-progress or planned status and grades, and base64url-encodes the result into a URL fragment (`/planner#howdy=...`). Fragments are never sent to a server, so the data goes straight from the browser to the site. The panel renders in a shadow root so Howdy's CSS cannot affect it, and a `MutationObserver` re-renders it as Howdy changes views (`src/content/howdy.ts`).
- **Resilient section scanning.** `src/utils/section-scanner.ts` finds CRN, subject, course, section and seat columns from table header labels, falls back to recognising the values themselves when headers are missing, and skips classes you are already registered for.
- **Cross-source professor name matching.** `src/utils/name-matching.ts` matches names between College Scheduler and the AggieSB+ data despite `Last, First` ordering, accents, suffixes, middle initials and surname particles such as "van" or "de".
- **Tests without a browser.** Tests in `tests/*.test.cjs` use Node's built-in test runner. They transpile the TypeScript sources with the `typescript` package and run them in a `vm` context, with a mocked `chrome.cookies` API for the session-refresh tests, so no bundler or browser is needed.

## Permissions and privacy

From `public/manifest.json`:

| Permission | Why |
| --- | --- |
| `storage` | Saves theme, AI-summary and onboarding preferences. |
| `cookies` | Reads and refreshes the AggieSB+ site session so alerts work after you sign in on the website. |
| `alarms` | Schedules the periodic session refresh. |
| `activeTab` | Popup access to the current tab. |

Host access is limited to College Scheduler, Howdy, the AggieSB+ site and its API. The Chrome manifest also lists the preview deployment and `localhost:3000` / `localhost:8000` for development. The Firefox manifest omits the localhost entries. The extension has no remote-hosted code (`script-src 'self'`). The Firefox manifest declares `data_collection_permissions: none`. Courses read from College Scheduler or Howdy are sent only to the AggieSB+ site, and only when you click an import or open button.

## Tech stack

TypeScript, Vite 6, plain DOM and shadow-DOM UI for injected panels and a vanilla JS popup (React 19 is a dependency, but the shipped popup does not use it), Chrome Extension APIs (Manifest V3), Node's test runner, ESLint.

## Development

Requires Node.js and npm.

```bash
npm install
npm run dev            # Vite dev server
npm run build          # type-check (tsc -b) and build into build/ (Chrome)
npm run firefox        # build, then create build-firefox/ with the Firefox manifest
npm run lint
node --test tests/*.cjs
```

Run the tests with the glob. On Windows `node --test tests/` treats the folder as a file and fails.

Load unpacked:

- Chrome: open `chrome://extensions`, enable Developer mode, choose **Load unpacked** and select `build/`.
- Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on** and select `build-firefox/manifest.json`.

Package for the stores:

```bash
npm run build:zip      # build.zip (Chrome)
npm run firefox:zip    # build-firefox.zip (Firefox)
```

## Project layout

```
extension/
├── src/
│   ├── background.ts         # service worker: session refresh, authenticated API proxy
│   ├── content/              # content script entries: main.ts (College Scheduler), howdy.ts
│   ├── components/           # injected UI: professors panel, alerts panel, summaries, account status
│   ├── services/             # API client, professor data, seat tracking, cache
│   ├── utils/                # page detection, section scanner, name matching, Howdy parser
│   ├── onboarding/           # first-run tour
│   ├── state/, config/       # shared store and constants
│   └── App.tsx, main.tsx     # leftover React scaffold (not used by the shipped popup)
├── public/                   # manifest.json, manifest-firefox.json, css/, templates/
├── scripts/                  # build-firefox.mjs, zip.mjs
├── tests/                    # node:test suites (*.test.cjs)
├── popup.js, index.html      # popup UI (copied into the build as-is)
├── onboarding.html
├── icons/, images/
└── vite.config.ts
```

Built by Aggies, for Aggies.
