# Decision log (extension)

Each entry: what was decided, why, what was rejected, where it lives. Dates are when the decision was made or last confirmed.
Cross-repo contracts (API shapes, URL handoffs to the website) are also recorded in the parent repo's `docs/context/`.

## Build and bundling

### D-001: Content scripts are built as separate standalone IIFEs  (2026-11-11)
**Decision:** `vite.content.config.ts` builds each content script on its own (`--mode main`, `--mode howdy`) as an IIFE with `inlineDynamicImports`. `npm run build` runs the main vite build, then both content builds.
**Why:** MV3 content scripts are classic scripts. When `content/howdy.ts` started sharing modules with `content/main.ts`, Rollup hoisted them into `assets/constants-*.js` and `content/main.js` began with `import ...`. Result in 3.3.3/3.3.4: "Cannot use import statement outside a module", the sidebar never loaded, the popup still worked. Fixed in 3.3.4.2.
**Rejected:** a `removeExportsFromContentScript()` vite plugin (stripped `export` but not `import`; removed); keeping content entries in `vite.config.ts` `input`; hardcoding the API base in content scripts to avoid imports (the May 2026 workaround, no longer needed).
**Where:** `vite.config.ts`, `vite.content.config.ts`, `package.json` `build`. Commits `d7ce2e6`, `f06a2e2`.
**Status:** active. A new content script needs an entry in `CONTENT_ENTRIES`, a `--mode` call in the `build` script, and a manifest entry in both manifests.

### D-002: `background.ts` stays import-free and self-contained  (2026-11-17)
**Decision:** No `import` in `src/background.ts`. Analytics code is inlined there; the API base is a local constant, not imported from `config/constants.ts`.
**Why:** Firefox loads the background as a classic script (`"scripts": ["background.js"]`). `tests/auth-session.test.cjs` and `tests/usage-stats.test.cjs` run it in a VM without `require`. CI parses the built file as a classic script.
**Rejected:** sharing `constants.ts` / `usage.ts` with the background.
**Where:** `src/background.ts` header comments, `.github/workflows/ci.yml` step "Check background.js is a classic script".
**Status:** active.

### D-003: Firefox build is derived from the Chrome build and cleaned each time  (2026-10-26)
**Decision:** `npm run firefox` runs the full Chrome build, then `scripts/build-firefox.mjs` deletes `build-firefox/`, copies `build/`, and writes `public/manifest-firefox.json` as the manifest.
**Why:** stale hashed assets (old `constants-*.js`, extra css) leaked into `build-firefox.zip`.
**Where:** `scripts/build-firefox.mjs`, `scripts/zip.mjs` (forward-slash paths and `manifest.json` at the zip root, needed by store validators; commits `91ca694`, `5475d6d`).
**Status:** active.

## Release and CI

### D-004: Version lives only in the two manifests; hotfixes use a 4th number  (2026-11-17)
**Decision:** Bump `version` in `public/manifest.json` and `public/manifest-firefox.json` (they must match). `package.json` `version` (2.0.0) and `name` are stale on purpose and not bumped. Hotfixes: 3.3.4 -> 3.3.4.2 -> 3.3.4.3 -> 3.3.4.4. Commit pattern: a `fix:`/`feat:` commit, then a separate `chore: release X` / `chore: bump version to X` commit touching only the manifests.
**Why:** stores reject re-used version numbers. The release workflow checks tag == both manifests. The owner asked to "just bump the fourth number".
**Where:** `public/manifest*.json`, `.github/workflows/release.yml` step "Verify versions".
**Status:** active. Version at time of writing: 3.3.4.4. The GPA-card commit `1f5e21a` came after it and is not released yet.

### D-005: Tag `v<version>` publishes to both stores; tests gate it  (2026-11-18)
**Decision:** Pushing tag `v*` runs `release.yml`: verify versions, unit tests, build both targets, classic-script check on `background.js`, Playwright e2e, zips, GitHub Release, then Chrome Web Store upload and publish (only if all five `CWS_*` secrets exist) and Firefox Add-ons submit via `web-ext sign --channel listed` with a `git archive` source zip (only if `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` exist; it does not wait for AMO review, `--approval-timeout 0`). `ci.yml` and `e2e.yml` run on every push. `workflow_dispatch` on release uploads to the Chrome Web Store only; input `submit_for_review=false` makes a draft.
**Why:** the owner wanted store submission automated. 3.3.4.4 was a version-only bump used to prove it; both stores accepted it (Chrome `PENDING_REVIEW`).
**Rejected:** the old `manual.yml`; Chrome Web Store API v1.1 (an agent wrote it from memory; replaced after checking Google's discovery doc).
**Where:** `.github/workflows/release.yml`. Chrome Web Store v2 specifics: `chromewebstore.googleapis.com/upload/v2/publishers/<pub>/items/<id>:upload`, poll `:fetchStatus` `lastAsyncUploadState`, the success value is `SUCCEEDED` (not `SUCCESS`), publish with `publishType: DEFAULT_PUBLISH`, `PENDING_REVIEW` is the normal answer.
**Status:** active. Never push a `v*` tag unless the owner asks: it publishes.

### D-006: Playwright e2e loads the real `build/` with everything else mocked  (2026-11-17)
**Decision:** `e2e/**` (`npm run test:e2e`) loads the built extension in Chromium (`channel: 'chromium'`, new headless). Fixtures in `e2e/fixtures/` are served at the real College Scheduler and Howdy URLs through `context.route()`. The AggieSB+ API is mocked (signed out, 401), Umami POSTs are captured (204), every other request is aborted and recorded. `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost` is a safety net.
**Why:** the 3.3.4 outage was a build-output bug that unit tests could not see.
**Rejected:** reusing the older `server.cjs` harness (it stubs `chrome.*`, so it does not test the real extension).
**Where:** `e2e/`, `playwright.config.ts`, `.github/workflows/e2e.yml`.
**Status:** active.

## Network, auth and privacy

### D-007: All authenticated API calls go through the background service worker  (2026-05-20, re-checked 2026-10-30)
**Decision:** Content scripts send `chrome.runtime.sendMessage` (`AUTH_STATUS`, `API_TRACKING_FETCH`). The background reads the SuperTokens `st-access-token` / `st-refresh-token` cookies of the paired website origin (`SESSION_SOURCES`) with `chrome.cookies`, sends `Authorization: Bearer`, refreshes on 401 against the API origin, and also refreshes proactively every 25 min (`agsbp-session-refresh` alarm, needs the `alarms` permission).
**Why:** the extension cannot rely on website cookies being sent; MV3 background fetches to `host_permissions` URLs skip CORS.
**Where:** `src/background.ts` (`fetchWithAuth`, `refreshSession`, `SESSION_SOURCES`), `tests/auth-session.test.cjs`. Invariants: G-007. Since 2026-11-24 the first source is `aggiesbp.com`, an optional host permission (D-020).
**Status:** active.

### D-008: Anonymous usage counts come from the background only, allowlisted, opt-out  (2026-11-16)
**Decision:** Events `ext-installed`, `ext-updated`, `ext-page-enhanced`, `ext-panel-open`, `ext-professor-action`, `ext-seat-alert-add`, `ext-howdy-import` (counts only), `ext-fit-import` (a count), `ext-popup-open` go to the owner's self-hosted Umami (`ENDPOINT` in `background.ts`). Each event has a schema: enum strings or integer counts capped at 1000; anything else drops the whole event. The site/page label comes from `sender.url`, not from the message. Rate limits (in memory): 5 s duplicate, 10 per tab per 10 min, 60 per hour. Opt-out is `usageStatsEnabled` in `chrome.storage.sync` (default on; popup Settings "Privacy" card). Hostname `extension.aggiesbp` for store installs, `extension-dev.aggiesbp` for unpacked builds (no `update_url`). Requests use `credentials: 'omit'`; sending stops if the server replies `disabled`. Firefox sends only if the user granted the `technicalAndInteraction` data-collection permission, which the Firefox manifest does not request, so Firefox sends nothing today.
**Why:** the owner wanted usage numbers (UTM tags only show clicks into the site) without names, course codes, grades or professor names. No new permissions, so no re-approval prompt. The store listing no longer claims "No tracking or data collection".
**Rejected:** sending from content scripts or the popup directly; free-text fields; per-user ids.
**Where:** `src/background.ts` (`MESSAGE_EVENTS`, `sanitize`, `allowRate`, `isEnabled`), `src/utils/usage.ts` (`reportUsage`), `popup.js` toggle, `tests/usage-stats.test.cjs`, `e2e/usage-stats.spec.ts`. Event meaning: parent repo `docs/umami-analytics-plan.md`.
**Status:** active. To add an event: add it to `MESSAGE_EVENTS` and the `UsageEvent` type, update `DATA_KEYS` in the e2e spec, the privacy page in the frontend, and the plan doc.

### D-009: Course data stays in the browser; the website gets only what the user opens  (2026-10-28)
**Decision:** Fit My Schedule import scrapes the Current Schedule page into blocks `{days, start, end}` only (no course codes or CRNs) and opens `/discover/fit?importSchedule=<encoded JSON>` in a new tab. Howdy import reads the planner table from the DOM and opens `/planner#howdy=<base64url payload>`; it is a URL fragment, so it never reaches a server. Neither flow calls the API from the extension.
**Why:** a public Reddit reply said the backend "only ever sees time blocks". That is true only for Fit import; seat alerts and professor lookups do send section and course ids. Do not extend Fit import to send course lists without revisiting that public claim and the privacy page.
**Where:** `src/components/professors-panel.ts` (`initializeScheduleFitPanel`, `extractScheduleBlocksFromCurrentSchedulePage`), `src/content/howdy.ts` (`sendToSite`), `src/utils/howdy-planner.ts` (`encodePayload`, `rowsToCourses`).
**Status:** active. Frontend consumers: `/discover/fit` and `/planner`.

### D-010: Links into the website carry UTM tags via `withUtm`  (2026-11-10)
**Decision:** `withUtm(url, medium)` in `src/config/constants.ts` sets `utm_source=extension` and `utm_medium` to one of `course-link`, `professor-link`, `fit-import`, `fit-open`, `howdy-import`, `onboarding`, `account-status`.
**Why:** Umami can then split extension traffic. Tags only show up after a store release reaches users.
**Where:** `constants.ts`; used by `professor-service.ts`, `professors-panel.ts`, `howdy.ts`, `onboarding/main.ts`, `account-status.ts`. Commit `9eebc11`.
**Status:** active. See G-010.

### D-011: Store listing wording avoids false claims  (2026-10-19)
**Decision:** No "No tracking or data collection" (accounts and watched sections are stored); no "the moment a seat opens" / "first to know" (the backend polls); no "works exclusively with tamu.collegescheduler.com" (Howdy is supported too). Say ratings come from RateMyProfessors, grades from public TAMU grade reports, and "Not affiliated with Texas A&M University". The manifest `description` is the store summary (<= 132 chars).
**Where:** `STORE_LISTING.md`, `public/manifest*.json`. `STORE_LISTING.md` still has some of the old wording (open-items O-004).
**Status:** active guidance; listing text not fully updated.

### D-012: Repo is public and MIT, the manifest advertises it  (2026-11-17)
**Decision:** MIT `LICENSE`, `homepage_url` in both manifests points to the GitHub repo, `"license": "MIT"` in `package.json`.
**Why:** the owner shows the repos to recruiters and wants the store page to show the extension is open source.
**Status:** active. Commits carry no AI attribution (see AGENTS.md).

## Sidebar and panels

### D-013: Every College Scheduler page gets a sidebar; the mode depends on the page  (2026-11-11)
**Decision:** `panelModeForCurrentPage()` in `src/content/main.ts`: a sections page (URL regex `courses/\d+`) gets the professors panel; `/currentschedule` gets Fit My Schedule; every other page gets the seat-alerts-only panel.
**Why:** owner requirement "default to show seat alerts". Before this, pages not on a short list had no button.
**Where:** `src/content/main.ts`, `src/utils/page-detector.ts` (`isMainCoursesPage` and `isSchedulerAlertsPage` there are no longer used for routing).
**Status:** active.

### D-014: Howdy import reads the DOM through a guided flow  (2026-11-10)
**Decision:** `src/content/howdy.ts` shows a shadow-root panel (`#aggiesbp-howdy-import`, bottom right, minimizable) that walks the student through "Evaluate & Go Plan View", then "Expand All" and "Table View" (it clicks Howdy's own buttons by text), reads the table rows via `src/utils/howdy-planner.ts`, and opens the website planner. Row mapping: grades A-F/S = completed with grade; TCR, TA/TB = transfer or test credit (completed, no term); "In Progress" = in progress; Planned, or no "Evaluated" toggle = planned; duplicate rows (retakes, 1- and 3-credit variants) merge, and the completed passing entry wins. Requirement parsing from the "Areas" view exists in code but is parked.
**Why:** the May 2026 version intercepted Howdy's own `degree/plan` API with an injected page-context fetch hook plus a `postMessage` relay. It was fragile (timing against Angular's first request, a wrong `reqNo` fallback). The DOM approach needs no API call and no extra permission.
**Rejected:** the fetch interceptor; sending the import to the backend.
**Where:** `src/content/howdy.ts`, `src/utils/howdy-planner.ts`, `tests/howdy-planner.test.cjs`, `e2e/howdy.spec.ts`.
**Status:** active.

### D-015: AI summaries default ON, with a toggle; "Recent reviews" is the off state  (2026-10-28)
**Decision:** `chrome.storage.sync` key `aiSummariesEnabled` (default true). A popup Settings toggle (`#ai-summaries-toggle`; the popup sends `aiSummariesChanged` to the tab) and an in-panel "AI summary | Recent reviews" switch stay in sync. Off adds class `hide-ai-summaries` and lazily loads up to `RECENT_REVIEW_LIMIT = 20` reviews per professor with `fetchRecentReviews()` (this course first, then "All courses").
**Why:** Reddit feature request; a public reply promised the toggle. The owner first looked for the switch inside the panel, so it lives there too.
**Rejected:** opt-in summaries.
**Where:** `src/components/professors-panel.ts`, `src/services/professor-service.ts`, `popup.js`. Uses the backend `/professor/{id}/reviews` (newest first). Summaries are still downloaded when hidden.
**Status:** active.

### D-016: Remove UI that repeats visible info  (2026-10-26)
**Decision:** `summary-insights.ts` no longer emits the "reported grades", "avg rating, last 2 years", "avg rating, earlier" chips; only would-take-again, attendance mandatory and used textbook remain (row hidden if none). `buildSummaryItem` strips the `Teaching:|Exams:|...` prefix of overall-summary items and renders no topic label. The backend still sends the data.
**Why:** owner: they duplicate the grade bar and rating badges and add no information.
**Where:** `src/components/summary-insights.ts`, `src/components/professors-panel.ts`.
**Status:** active.

### D-017: Official GPA shows on every professor card that has grades, even without an RMP profile  (2026-11-18)
**Decision:** The grade bar and the caption `Official grades · X.XX GPA · N students` stay visible next to "No ratings yet". With no profile id the primary button links to the course page ("Course grades"), never to `/professor/null`. A card is `prof-card-empty` only if it has no ratings, no summary, no reviews AND no grade bar.
**Why:** instructors with no review profile still have grade reports; the old card hid them and linked to a broken page.
**Where:** `src/components/professors-panel.ts` (`gradeCaptionHTML`, `isEmpty`, card actions). Commit `1f5e21a`.
**Status:** active, not released until the next version bump.

### D-018: Onboarding tour runs on a mock page and never calls the API  (2026-10-26)
**Decision:** `onboarding.html` + `src/onboarding/main.ts` (12 steps) mimic College Scheduler (white page, maroon nav). It opens from `chrome.runtime.onInstalled` only for `reason === 'install'`; the popup Help tab has "Take the interactive tour". Professor names are made up; the A&M logo and the UIN line are omitted.
**Why:** no fake reviews on real faculty, no trademark, no PII. Mock fidelity was based on real screenshots the owner supplied.
**Where:** `onboarding.html`, `src/onboarding/`, vite `input.onboarding`, `background.ts` `onInstalled`.
**Status:** active. See G-002 for the duplication cost.

### D-019: Section scanner is a pure module  (2026-10-26)
**Decision:** `src/utils/section-scanner.ts` finds the CRN/Subject/Course/Section/Seats/Status columns from table headers and returns rows; the parsing is separate from DOM access so tests run without jsdom. Full sections are listed first ("· Full"); Enrolled/Registered rows, hidden rows, the extension's own panel and invalid rows are skipped.
**Where:** `src/utils/section-scanner.ts`, `src/components/alerts-panel.ts`, `tests/section-scanner.test.cjs`.
**Status:** active. See G-016.

### D-020: The site moved to aggiesbp.com; the extension asks for access to it on a click  (2026-11-24)
**Decision:** all website links, the Howdy hand-off and onboarding use `https://aggiesbp.com` (`SITE_ORIGIN` in `src/config/constants.ts`; `src/content/howdy.ts` keeps its own copy, G-009). The sign-in bridge (D-007) lists `aggiesbp.com` first in `SESSION_SOURCES` and keeps the old Vercel address, so sessions made before the move keep working. `https://aggiesbp.com/*` is in `optional_host_permissions` in both manifests, not `host_permissions`. Every "Sign in" link (popup, sidebar account status, onboarding) opens `connect.html`, which explains the move and calls `chrome.permissions.request` from a button click; if access is already granted it goes straight to the sign-in page. The sidebar cannot ask or open extension pages itself, so it sends `OPEN_CONNECT` to the background, which opens the tab (`from` allowlisted for `utm_medium`); its link keeps the sign-in URL as `href` for middle-click and as a fallback.
**Why:** the website moved off Vercel (parent D-023). Reading the site's SuperTokens cookies needs host access to the site. A new required host permission makes Chrome disable the extension after the update until each user re-approves it. Without access, `chrome.cookies.get` throws, `readCookie` returns null, and the user just looks signed out, so nothing breaks.
**Rejected:** a required host permission (disables the extension for existing users); asking from the popup (the popup can close when the browser's prompt opens, losing the result); asking from the sidebar (content scripts cannot request permissions).
**Where:** `connect.html`, `src/connect/main.ts`, `src/background.ts` (`SESSION_SOURCES`, `OPEN_CONNECT`), `src/components/account-status.ts`, `popup.js`, `src/onboarding/main.ts`, `public/manifest*.json`, `vite.config.ts` (`connect` input), `tests/auth-session.test.cjs`, `e2e/college-scheduler.spec.ts`.
**Status:** active. `optional_host_permissions` needs Firefox 128+; on older Firefox the request fails and the page says so (`strict_min_version` is still 109). The grant itself (clicking Allow in the browser prompt) cannot be automated in e2e; check it by hand on a real install.
