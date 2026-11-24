# Gotchas (extension)

"Looks wrong, is intentional" and "bugs we already fixed, do not reintroduce". Decision rationale is in `decisions.md` (D-xxx).

## Build and bundling

### G-001: Content scripts must not go back into the main vite build
**Looks like:** two extra vite configs/modes and a long `build` script; tempting to fold `content/main.ts` and `content/howdy.ts` into `vite.config.ts` `input`.
**Actually:** MV3 content scripts are classic scripts. In one build Rollup hoists shared modules into `assets/constants-*.js` and `content/main.js` starts with `import`. Chrome then fails with "Cannot use import statement outside a module" on line 1; the sidebar never appears while the popup still works. This was the 3.3.3/3.3.4 outage.
**If you change it:** build every content script as its own IIFE (`vite.content.config.ts`, `CONTENT_ENTRIES`), add the `--mode` call to `npm run build`, and verify with `node -e "new (require('vm').Script)(require('fs').readFileSync('build/content/main.js','utf8'))"` (same for `howdy.js`). CI does NOT check the content bundles yet (open-items O-001).
**Where:** `vite.config.ts`, `vite.content.config.ts`, `package.json`. **Fixed in:** `d7ce2e6`, bump `f06a2e2`.

### G-002: The onboarding page duplicates the panel markup on purpose
**Looks like:** `src/onboarding/main.ts` (857 lines) re-creates professor cards and the Fit My Schedule animation instead of importing `professors-panel.ts`.
**Actually:** it is built by the main vite config as an HTML page. Importing modules shared with the content script would create a shared chunk. The tour also needs mock data and no API calls.
**If you change it:** when you change professor card markup, classes, or the Fit animation, make the same change in `src/onboarding/main.ts`. Panel CSS is shared (`public/css/professor-panel.css`). Only the panel follows the dark-mode setting. Steps with `waitFor` advance on real clicks; `alreadyDone` handles Back. Use instant `scrollIntoView({block:'nearest'})` (smooth scroll needs rendered frames).
**Where:** `src/onboarding/main.ts` header comment.

### G-008: `build-firefox/` is wiped on every Firefox build, and can be stale
**Looks like:** `rm(firefoxBuildDir, ...)` before copying looks redundant.
**Actually:** without it, assets from older builds (hashed names) ended up in `build-firefox.zip`. Separately, `npm run firefox` runs the Chrome build first, but if you only ran `npm run build`, `build-firefox/` is from an older build (the owner once tested an outdated Firefox build).
**If you change it:** keep the clean step. Always run `npm run firefox` before loading the Firefox build.
**Where:** `scripts/build-firefox.mjs`.

### G-018: Build-time quirks
**Looks like:** `import.meta.env.DEV` for `DEBUG_MODE`; "do not put test files in `build/`".
**Actually:** `DEBUG_MODE = import.meta.env.DEV === true` in `src/config/constants.ts` only exists under Vite (bundling modules with raw esbuild for a harness needs `--define:import.meta.env.DEV=false`). It used to be hardcoded `true`. Chrome refuses "Load unpacked" if any file in the folder starts with `_` (a scratch `build/__scan-test.js` broke it). `vite.config.ts` copies `popup.js`, `public/css/*`, `public/templates/*`, `icons/*` and `manifest.json` with `viteStaticCopy`; the popup (`index.html` + `popup.js`) is vanilla JS, not React.
**If you change it:** keep scratch files out of `build/`. The content config sets `define: { 'process.env.NODE_ENV': '"production"' }` because library mode does not.
**Where:** `src/config/constants.ts`, `vite.config.ts`, `vite.content.config.ts`.

### G-019: Leftover files that look dead
**Looks like:** `OLD_CODE.js`, `src/App.tsx`, `src/main.tsx`, `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`; `package.json` name `aggie-professor-compare` v2.0.0.
**Actually (verified):** `OLD_CODE.js` is tracked and unreferenced: the pre-overhaul single-file vanilla content script ("AGGIE REGISTRATION BEAUTIFIER", `DEBUG_MODE = true`), last touched in `df9b458`; nothing imports or builds it. `src/App.tsx`/`main.tsx` are leftover Vite React scaffolding; `index.html` loads `popup.js`, not `main.tsx`. `popup.js`, `index.html`, `styles.css` are the live popup. `package.json` name/version are stale (see D-004). `build/`, `build-firefox/`, `build.zip`, `build-firefox.zip`, `playwright-report/`, `test-results/` are git-ignored local artifacts, not source.
**If you change it:** deleting the leftovers is probably safe but nobody has done it; ask the owner first. Do not delete `popup.js`, `index.html`, `onboarding.html`.

## Release and versions

### G-011: `package.json` version is not the extension version
**Looks like:** version 2.0.0 is out of date.
**Actually:** the real version is in `public/manifest.json` and `public/manifest-firefox.json`; they must be equal, and the release tag `v<version>` must equal both. Four-part versions are used for hotfixes. Stores reject re-used versions.
**If you change it:** bump both manifests in one commit; run `npm run build:zip` and `npm run firefox:zip` and check the zip manifest version if you build zips by hand. Do not push a `v*` tag unasked: it publishes to both stores (D-005).
**Where:** `public/manifest*.json`, `.github/workflows/release.yml`.

### G-012: The two manifests differ on purpose
**Looks like:** `manifest-firefox.json` is missing things the Chrome manifest has.
**Actually:** Firefox uses `"background": {"scripts": [...]}` (no service worker, no `type: module`), has no localhost host permissions, and carries `data_collection_permissions: {required: ["none"]}` both at the top level and under `browser_specific_settings.gecko`. Commits `ee1a6dc`, `bf4b380`, `416a34c` fought AMO validation over this field's shape. It also lacks `https://howdy.tamu.edu/*` in `host_permissions` while still listing the Howdy content script (O-007). `build-firefox.mjs` also rewrites `content/main.ts` to `content/main.js` if it finds the `.ts` name in the content script list.
**If you change it:** after any manifest edit run `npm run firefox` and, when possible, validate with `web-ext lint` / AMO. Do not "dedupe" the two `data_collection_permissions` blocks without testing AMO validation. Adding `technicalAndInteraction` as an optional data collection permission is what would turn Firefox usage stats on (D-008); that is an owner decision.
**Where:** `public/manifest-firefox.json`, `scripts/build-firefox.mjs`.

### G-013: Chrome manifest still lists localhost and `activeTab`
**Looks like:** `http://localhost:8000/*` and `http://localhost:3000/*` in `host_permissions` of a store build.
**Actually:** the owner tests locally by pointing the unpacked extension at a local API and site; `SESSION_SOURCES` in `background.ts` has the matching localhost pair. Store reviewers often flag localhost. Removal was recommended and not done (O-002). `activeTab` may be unneeded (code only uses `chrome.tabs` to open onboarding) but the popup/README list it.
**If you change it:** removing the localhost host permissions breaks local testing for the owner; do it only for release builds or ask. Do not add new host permissions casually: they trigger a re-approval prompt for every user on update.
**Where:** `public/manifest.json`, `src/background.ts` `SESSION_SOURCES`.

## Sidebar and panels

### G-003: `syncPanel()` runs on a 1 s interval and a generation counter
**Looks like:** `setInterval(syncPanel, 1000)` plus `popstate`, a `generation` counter, `isStale()` callbacks, a panel created in a `loading` state. Looks like polling that should be an observer.
**Actually:** College Scheduler is an SPA that re-renders and sometimes drops `#prof-toggle-btn`. The poll rebuilds when the URL changed or the button is missing. `isStale()` is passed to `initializeProfessorPanel` so a slow lookup after navigation cannot overwrite the new page's panel (it used to show no button or the previous course's panel). The professors panel is created immediately with a spinner and is always left in the page, with an error message if the API fails. `isPanelOpen()`/`wasOpen` keeps it open across the loading->loaded rebuild.
**If you change it:** removing the interval or the stale check brings back "the button sometimes does not show, I have to refresh".
**Where:** `src/content/main.ts`, `src/components/professors-panel.ts`. **Fixed in:** `d7ce2e6`.

### G-004: `setupSettingsListener` registers only once
**Looks like:** a module-level `settingsListenerRegistered` flag.
**Actually:** panels are rebuilt on every navigation; each rebuild used to add another `chrome.runtime.onMessage` listener (a leak). The one listener handles `themeChanged` and `aiSummariesChanged` against the live DOM.
**If you change it:** keep a single registration.
**Where:** `src/components/professors-panel.ts`.

### G-005: Escape everything that comes from the API or the page before `innerHTML`
**Looks like:** `escapeSummaryText(...)` around labels and ids that seem harmless.
**Actually:** the summary dropdown label comes from API course codes, which can carry free text from a RateMyProfessors review's class field. Cards are inserted with `innerHTML` into collegescheduler's page, so a crafted value could break out of `<select>` and inject markup or script on `tamu.collegescheduler.com`. Verified with a crafted payload against old and new code. `escapeSummaryText` (in `src/components/summary-insights.ts`) escapes `& < > " '`.
**If you change it:** every new `innerHTML` template that interpolates API, RMP or page text must use it (or `textContent`). Known remaining unescaped sinks that were flagged as hardening: other `innerHTML` templates in `professors-panel.ts`, `alerts-panel.ts` and `popup.js` (O-005). The backend can also reject non-course-code strings at the source (O-006).
**Where:** `src/components/professors-panel.ts` (`buildSummaryItem`, summary dropdown, review list), `src/components/summary-insights.ts`. **Fixed in:** `b1dbd70`, released as 3.3.2.

### G-014: The Howdy content script matches all of `howdy.tamu.edu/*`
**Looks like:** an over-broad match pattern.
**Actually:** Howdy is an SPA (pushState navigation); a narrow pattern never fires. The script watches the URL itself (polling `checkUrl`) and shows UI only on the degree planner routes (`plannerPage()` returns curriculum, planner, evaluate or other). The UI lives in a shadow root, dismiss state is in `sessionStorage`.
**If you change it:** do not narrow the match pattern.
**Where:** `public/manifest*.json`, `src/content/howdy.ts`.

### G-009: Howdy `SITE_URL` must be production in a release
**Looks like:** a hardcoded site URL in `howdy.ts` (and `constants.ts` `COURSE_DETAILS_BASE`, `onboarding/main.ts`).
**Actually:** during development `SITE_URL` was once set to `http://localhost:3101` with a TEMP comment; it was switched back before 3.3.3. The handoff is `/planner#howdy=<base64url payload>` through `withUtm(..., 'howdy-import')`.
**If you change it:** check this constant before every release. Local testing is done by the owner with a temporary edit; do not commit it.
**Where:** `src/content/howdy.ts`, `src/config/constants.ts`.

### G-010: Build website URLs with `withUtm`, not string concatenation
**Looks like:** `new URL` + `searchParams.set` for something that could be `?utm_source=extension` appended.
**Actually:** some links already contain `?` (Fit `importSchedule=...`) or `#` (Howdy `#howdy=...`). The URL API puts the query before the fragment, and `URLSearchParams` re-encodes the Fit `importSchedule` param; the Fit page does `JSON.parse(decodeURIComponent(raw))` after `params.get`, and the double decode was checked to still work.
**If you change it:** do not "simplify" by concatenating `?utm...`. Re-test the Fit import and the Howdy import end to end if you touch the encoding.
**Where:** `src/config/constants.ts`, `src/components/professors-panel.ts` (`openFitWithBlocks`), `src/content/howdy.ts` (`sendToSite`).

### G-015: A professor card can have grades but no ratings or profile
**Looks like:** "No ratings yet" next to a GPA and grade bar; a "Course grades" button instead of "Professor".
**Actually:** official grade data and RateMyProfessors data are separate. With no profile id the old code linked to `/professor/null`. Now the primary button goes to the course page. The empty-card style only applies when there is also no grade bar. The rating box still says "Unavailable" with "0 reviews" when a professor has no reviews for this course (O-003).
**If you change it:** keep the `professor.id` checks before building profile links.
**Where:** `src/components/professors-panel.ts`. **Fixed in:** `1f5e21a`.

### G-016: Section scanner details
**Looks like:** header regexes without `\b`, and an odd `main` lookup in `alerts-panel.ts`.
**Actually:** `textContent` drops the `<br>` in "CRN<br>#" and "Seats<br>Open", giving "CRN#" and "SeatsOpen", so the patterns are `/^crn/` and `/^seats/`. Columns are found by header text because Build Schedule has an extra Status column (fixed column positions produced rows like "64995 CSCE-421"). A `\D` typo once stripped literal text so "Secti"/"Enrol" passed as CRNs; rows are validated (5-digit CRN, real subject/course). Hidden elements are skipped with `getClientRects().length > 0`.
**If you change it:** keep `tests/section-scanner.test.cjs` passing. The scanner searches `document.querySelector('main') || document.body`; whether the live site has a `<main>` was never confirmed (O-008).
**Where:** `src/utils/section-scanner.ts`, `src/components/alerts-panel.ts`.

### G-021: "Account status unavailable - Retry" in the panel
**Looks like:** a bug in sign-in status.
**Actually:** the content script cannot reach the background after the extension was reloaded or updated with the tab still open. Refresh the page. It is not a backend problem.
**Where:** `src/components/account-status.ts`.

### G-023: AI summaries off still downloads them
**Looks like:** the toggle should skip the summary request.
**Actually:** summaries are fetched with the professor details either way; the toggle only hides them (`hide-ai-summaries`) and loads recent reviews lazily. Do not rely on it to save bandwidth.
**Where:** `src/components/professors-panel.ts`.

## Auth and network

### G-006: `background.ts` has no imports, and the Chrome manifest says `type: module`
**Looks like:** a long file with duplicated constants (the API base is defined again at the top) and inlined analytics; the Chrome manifest declares the service worker as a module.
**Actually:** see D-002. Firefox runs it as a classic script and the tests execute it in a VM without `require`. The Chrome `"type": "module"` does not make imports safe for the shared file.
**If you change it:** do not add `import` or `export`. CI parses `build/background.js` and `build-firefox/background.js` as classic scripts; grep does not work on the minified output.
**Where:** `src/background.ts`, `.github/workflows/ci.yml`.

### G-007: Background auth bridge invariants (security)
**Looks like:** strict allowlists and a `403` path in `fetchWithAuth`.
**Actually:** `onMessage` ignores any message with `sender.id !== chrome.runtime.id`; there is no `externally_connectable`. `fetchWithAuth` only allows origins in `SESSION_SOURCES` and paths matching `^/users/(tracking(/x)?|me)$`; it strips any caller `Authorization`, sets `rid: session` and `st-auth-mode: header`, uses `credentials: 'omit'`, and takes the bearer from the `st-access-token` cookie of the paired web origin. Refresh goes to the API origin (not the web domain; that was an earlier bug) and does not overwrite a newer session written by a website tab or undo a sign-out. A localhost session is never sent to production. Token lifetime is set by SuperTokens core, not by the extension. `/auth/signout` is deliberately NOT in the `fetchWithAuth` allowlist: sign-out has its own `SIGN_OUT` message, accepted only when `sender.url` is an extension page, so a content script cannot sign the user out (D-021).
**If you change it:** keep the allowlist narrow, keep the sender check, and keep `tests/auth-session.test.cjs` green (it covers the allowlist, localhost vs prod, refresh rotation and the sign-out race; the sender-id check is not tested).
**Where:** `src/background.ts`, `tests/auth-session.test.cjs`.

### G-022: Usage-stat details that look strict or odd
**Looks like:** events silently dropped; `site` derived from `sender.url`; dev hostname; counts capped at 1000; a whole event dropped for one unexpected key.
**Actually:** by design (D-008), so a bug or a hostile page cannot push free text or identifiers into analytics. `ext-popup-open` has an empty schema. `reportUsage(..., {oncePerLoad: true})` de-dupes per page load in the content script on top of the background rate limits.
**If you change it:** add events to the schema allowlist in `background.ts`, not around it. Update the privacy page and `docs/umami-analytics-plan.md` in the parent repo.
**Where:** `src/background.ts`, `src/utils/usage.ts`.

## Tests and tooling

### G-017: How to run tests and what is broken
**Looks like:** `node --test tests/` should work; `npm run lint` should work.
**Actually:** use `node --test tests/*.test.cjs` (35 tests, all passing at time of writing). A bare `node --test tests/` treats the folder as a file on Node 24 and fails. `npm run lint` is broken: ESLint 9 cannot read `.eslintrc.cjs` and there is no flat config. Type check with `npx tsc -b`. Unit tests load TS via `ts.transpileModule` into a `vm` context (no jsdom), so put logic in pure modules to test it.
**If you change it:** do not "fix" the test command in CI to a directory form. Fixing lint means adding `eslint.config.js` (not done).
**Where:** `package.json`, `tests/`.

### G-020: Playwright e2e quirks
**Looks like:** tests assert a `collapsed` class instead of visibility.
**Actually:** the closed sidebar is `opacity:0` plus an off-screen transform, not `display:none`, so `toBeVisible()` is wrong; tests use the `collapsed` class and `toBeInViewport()`. The opt-out negative test was verified to fail when the opt-out check is broken. Extensions need a persistent context, hence no browser projects in `playwright.config.ts`. Fixtures are saved copies of real pages; the API is mocked.
**If you change it:** keep the "any other request is aborted and recorded" safety net so tests never hit real sites or the real API.
**Where:** `e2e/fixtures.ts`, `e2e/helpers/`, `playwright.config.ts`.
