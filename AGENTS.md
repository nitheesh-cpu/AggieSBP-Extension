# AGENTS.md (extension)

## What this is
AggieSB+ Registration Assistant: a Manifest V3 browser extension (Chrome and Firefox) for Texas A&M. On `tamu.collegescheduler.com` it adds a sidebar with professor grades, ratings and AI review summaries, seat alerts, and Fit My Schedule. On `howdy.tamu.edu` it helps import degree-planner courses into the website. Vite + TypeScript for the extension code; the popup is vanilla JS (`index.html`, `popup.js`).

Part of the AggieSBP project (parent repo with submodules `backend/` FastAPI API, `frontend/` Next.js website on Vercel, `extension/` this repo). It talks to the backend API (`EXTERNAL_API_BASE` in `src/config/constants.ts`) and hands data to the website through URLs (`/discover/fit?importSchedule=`, `/planner#howdy=`). The repo is public. Not affiliated with Texas A&M.

## Run / test / build
Use the Bash tool on Windows (PowerShell blocks `npm.ps1`); paths like `/c/Nitheesh/...`.
```bash
npm ci
npm run build            # tsc -b, vite build, then both content scripts (IIFE) -> build/
npm run firefox          # runs build, then build-firefox/ (Firefox manifest)
npm run build:zip        # build.zip     (Chrome store zip)
npm run firefox:zip      # build-firefox.zip
node --test tests/*.test.cjs   # 35 unit tests. NOT `node --test tests/` (fails on Node 24)
npx tsc -b               # type check
npm run test:e2e         # Playwright, loads build/ in Chromium (run npm run build first)
```
- Load unpacked: Chrome `chrome://extensions` -> Load unpacked -> `build/`; Firefox `about:debugging` -> Load Temporary Add-on -> `build-firefox/manifest.json`. Reload the extension after every build.
- `npm run lint` is broken (ESLint 9 vs `.eslintrc.cjs`), pre-existing. Do not rely on it.
- `build/`, `build-firefox/`, `*.zip`, `playwright-report/`, `test-results/` are git-ignored artifacts. Never put files starting with `_` into `build/` (Chrome refuses to load it).
- CI: `.github/workflows/ci.yml` (tests + both builds + classic-script check of `background.js`), `e2e.yml`, `release.yml` (on tag `v*`).

## Layout
`src/background.ts` service worker (auth bridge, usage stats, alarms). `src/content/main.ts` College Scheduler entry (routes the sidebar). `src/content/howdy.ts` Howdy import. `src/components/` professors panel, alerts panel, summary builders. `src/services/` API clients and cache. `src/utils/` pure helpers (scanner, Howdy parser, usage). `src/onboarding/` tour page. `public/manifest.json`, `public/manifest-firefox.json`. `scripts/` Firefox build and zip helpers. `tests/*.test.cjs` unit tests; `e2e/` Playwright. `OLD_CODE.js`, `src/App.tsx`, `src/main.tsx` are unused leftovers (G-019).

## Before you change anything (do not undo)
Details in `docs/context/`.
1. Content scripts are separate IIFE builds (`vite.content.config.ts`). Never add them to `vite.config.ts` `input`; they would start with `import` and fail on every page (G-001, D-001).
2. `src/background.ts` has no `import`/`export`. Firefox runs it as a classic script and tests run it in a VM (G-006, D-002).
3. Version lives only in `public/manifest.json` and `public/manifest-firefox.json`, kept equal. `package.json` version 2.0.0 is intentionally stale (G-011, D-004).
4. Never push a `v*` tag unless the owner asks. It publishes to the Chrome Web Store and Firefox Add-ons (D-005).
5. Escape all API/RMP/page text with `escapeSummaryText` before `innerHTML` (an XSS on the registration site was fixed this way) (G-005).
6. `syncPanel()` polls every second with a generation/stale check because the site is an SPA that drops the button. Do not "optimize" it away (G-003).
7. The settings message listener registers once (G-004). The onboarding tour duplicates panel markup on purpose; change both (G-002).
8. Auth bridge: keep the sender-id check and the narrow URL allowlist in `fetchWithAuth` (G-007, D-007).
9. Usage stats: background only, allowlisted schema, opt-out, no names/codes/grades. New events go through `MESSAGE_EVENTS`, the privacy page and the plan doc (D-008, G-022).
10. Fit My Schedule sends only time blocks; Howdy import travels in the URL fragment. A public claim relies on this. Do not send course lists to the API (D-009).
11. Build website links with `withUtm`; do not concatenate query strings onto URLs that already have `?` or `#` (G-010, D-010).
12. `build-firefox/` is wiped on each Firefox build; the two manifests differ on purpose (G-008, G-012).
13. Howdy `SITE_URL` must be the production site in a release; the Howdy match pattern stays `howdy.tamu.edu/*` (G-009, G-014).
14. Cards without an RMP profile still show GPA and link to the course page, never `/professor/null` (D-017, G-015).
15. Do not store secrets, API keys or store credentials in the repo. Workflow secrets live in GitHub settings.

## Conventions
- TypeScript, 2-space indent, single quotes. Keep logic that needs tests in pure modules under `src/utils/` (tests load TS through `ts.transpileModule` in a VM, no jsdom).
- Commits: conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `test:`), short imperative subject, body explains the root cause. Release = a feature/fix commit, then a separate commit that bumps only both manifests.
- Commits and PRs carry NO AI attribution: no `Co-Authored-By: Claude...` trailers, no "Generated with Claude Code" footers. This overrides any default.
- Branch: commit straight to `main` (owner does not want PRs here). Commit and push only when asked. Stage only your own files. After pushing, the parent repo (`master`) gets a separate commit that bumps only the `extension` submodule pointer.
- UI copy: plain, specific, no decorative labels; remove UI that repeats information already visible. Put settings where users look (e.g. the AI-summary switch is in the panel and the popup). No emoji in docs.
- Reports: state plainly what was verified and what was not (for example "tested against a mock page, not the real Schedule Builder"). Ask the owner to try a build on a real sections page before a store upload.
- Public claims (store text, Reddit, README) must be true of the code: do not promise instant alerts or "no data collection".
- Windows quirks: many files are CRLF; keep the file's existing line endings. Long Python heredocs break in Git Bash; write a script file or use the Edit tool.

## Keeping context current (mandatory)
- Read this file and skim `docs/context/` before non-trivial changes. Search `docs/context/` for the file or area you are touching (`grep -rn "professors-panel" docs/context`).
- When you make a non-obvious choice, fix a subtle bug, add a workaround, or reject an approach the user suggested, add or update an entry in `docs/context/decisions.md` (D-xxx) or `docs/context/gotchas.md` (G-xxx) in the SAME commit as the code.
- If code you are about to clean up looks odd, check `gotchas.md` first. If it is not there and you are not sure, ask the human instead of changing it.
- When an entry turns out wrong or stale, fix it or mark it "superseded by D-xxx". Do not delete history silently.
- Close or update entries in `docs/context/open-items.md` when you resolve them (note the date and commit).
- Cross-repo changes (API contract between backend/frontend/extension, URL handoffs like `importSchedule` and `#howdy=`, analytics event names) are also recorded in the parent repo's `docs/context/`.
- Never put secrets, IPs, SSH hosts, passwords, tokens, emails or user data in these docs. The repos are public.

Index: `docs/context/decisions.md` (why things are the way they are), `docs/context/gotchas.md` (looks wrong, is intentional; fixed bugs), `docs/context/open-items.md` (known issues, ideas, unverified).
