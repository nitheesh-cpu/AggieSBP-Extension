# Open items (extension)

Known issues, deferred ideas and unverified things. Format: ID, status, source/date. Close or update an item in the same commit that resolves it.
Status at 2026-11-19 unless stated. "Unverified" means it came from a past chat and was not re-checked against code or the live stores.

## Build, CI and release

### O-001: CI does not check the content script bundles  (open, verified 2026-11-19)
`ci.yml` and `release.yml` parse only `build/background.js` and `build-firefox/background.js` as classic scripts. Add `build/content/main.js`, `build/content/howdy.js` (and the Firefox copies) to that loop to prevent a repeat of the 3.3.4 "import outside a module" outage (G-001). The Playwright e2e does exercise the built content scripts, which is the current safety net.

### O-002: Localhost host permissions in the store manifest  (open, verified 2026-11-19)
`public/manifest.json` still lists `http://localhost:8000/*` and `http://localhost:3000/*`, and `background.ts` `SESSION_SOURCES` has the localhost pair. Reviewers often flag it. Options: strip them in release builds only, or accept. Also check whether `activeTab` is needed. Source: May and Nov 2026 chats.

### O-007: Firefox: no usage stats, and Howdy host permission is unclear  (open, unverified)
The Firefox manifest declares data collection "none" and does not request `technicalAndInteraction`, so Firefox sends no `ext-*` events (owner decision pending, D-008). It lists the Howdy content script but not `https://howdy.tamu.edu/*` in `host_permissions` (the Chrome manifest has both); whether Firefox prompts or silently needs the user to grant it was not tested. An earlier agent claimed the Howdy import was Chrome-only; that was wrong (the Firefox build contains it).

### O-011: Chrome Web Store dashboard answers  (open, unverified)
Recommended in Nov 2026 and never confirmed as submitted: single purpose describing ratings/grades/seat alerts/schedule fit on College Scheduler and Howdy; host-permission justification naming the real API domain and `howdy.tamu.edu`; storage justification mentioning the usage-stats setting; tick "User activity" data usage; privacy policy mentions anonymous counts and the opt-out. Release 3.3.4.4 was accepted into review with the existing answers.

### O-010: Unreleased GPA-on-card change  (open, 2026-11-18)
Commit `1f5e21a` (D-017) ships only with the next manifest version bump (next would be 3.3.4.5). Not tested on the real site by the agent that wrote it; e2e covers the mocked page.

### O-004: `STORE_LISTING.md` still has old claims  (open, verified 2026-11-19)
Short description says "real-time seat alerts"; the detailed text says "the moment a seat opens" and "you're the first to know", and uses emoji headings. D-011 says to avoid those promises. The live store text is edited in the dashboards; this file is a copy.

### O-012: New workflows and stores  (partly verified)
`release.yml` ran for 3.3.4.4 and both stores accepted the upload (Chrome `PENDING_REVIEW`, AMO awaiting approval at the time). The AMO step does not wait for signing, so a rejection shows up only in the AMO dashboard. Workflow secrets (`CWS_*`, `WEB_EXT_*`) are repository settings; do not store them in files.

### O-013: Store IDs and slugs  (unverified)
Two Chrome Web Store URL forms were in use on the website/README; unifying them was suggested and not done. Firefox AMO slug `aggie-schedule-builder-plus`, gecko id `aggie-schedule-builder-plus@tamu.edu` (in the manifest).

## Security hardening

### O-005: Remaining `innerHTML` sinks  (open, 2026-11-09)
The summary dropdown XSS was fixed (G-005). The security audit flagged many other `innerHTML` templates in `professors-panel.ts`, `alerts-panel.ts` and `popup.js` as hardening candidates: check that every interpolated value is escaped or a number. Another audit lead: the panel lives in the page's light DOM, so page scripts could read the signed-in email shown in the panel and click alert buttons (a shadow-root panel would remove that). Not fixed.

### O-006: Backend could reject non-course-code strings  (open, backend repo)
`pipelines/professors/hierarchical_summarization/course_normalizer.py` keeps raw RateMyProfessors class text as a course code when it cannot parse one. The extension now escapes it; rejecting non-`ABCD123` codes in the pipeline was proposed as a second layer.

### O-018: `build.pem` exists in git history  (open, 2026-10-30)
A packaging key was committed once (commits `e53628d`, removed in `298dd52`). It derives an extension id that does not match the store id, so it cannot sign store updates. It is not in `.gitignore` (add `*.pem` if the file ever returns). Rewriting history was not requested.

## Product and UX

### O-003: "Unavailable - 0 reviews" course rating box  (open, verified 2026-11-19)
When a professor has no reviews for the current course, the course-rating badge shows "Unavailable" (see `formatRating` / `prof-rating-unavailable` in `professors-panel.ts`). Suggested: hide the box or show a muted "No CSCE 221 reviews yet". Needs a release.

### O-009: Professor shown twice on a course panel  (open, unverified, 2026-10-19)
Fall 2026 CSCE 221 once showed one professor as two cards (one blank, one with data). Likely a backend name-matching duplicate (see parent repo docs on professor duplicates and `/admin/merges`). Not investigated.

### O-014: More recent-reviews paging  (idea)
The Recent reviews view loads up to 20 per professor; the backend supports skip/limit, so an infinite scroll or "load more" is possible.

### O-015: Ideas from May 2026 never built  (idea, unverified status)
Conflict-aware seat alerts (skip the notification if the section conflicts with the saved schedule); inline professor ratings in College Scheduler rows instead of a side panel; sending a built schedule to College Scheduler through the extension.

### O-019: Howdy import in real use  (unverified)
Shipped in 3.3.3 after testing on mock pages built from pasted HTML. Real-world completion was low in early analytics (about half of started imports finished, small numbers). Button-text detection for "Evaluate & Go Plan View" depends on Howdy's wording. The website planner cannot build schedules from completed-only imports (frontend repo item).

### O-008: Section scanner relies on the first `<main>`  (open, unverified)
`alerts-panel.ts` scans `document.querySelector('main') || document.body`. It was never confirmed that the live College Scheduler has a `<main>`; the fallback is the body. See G-016.

## Tests and tooling

### O-016: Real-site verification  (process note)
Past releases (3.3.4.2 and others) were verified in a local harness or Playwright fixtures only, not on the real Schedule Builder. State that plainly in reports, and ask the owner to load `build/` unpacked on a real sections page before a store upload.

### O-017: Lint, scaffolding and stale package metadata  (open, verified 2026-11-19)
`npm run lint` fails (ESLint 9, no flat config; `.eslintrc.cjs` is ignored). `package.json` name/version are stale. `OLD_CODE.js`, `src/App.tsx`, `src/main.tsx` are unused (G-019). The tour duplicates panel markup (G-002); onboarding's install trigger and the popup "Take the interactive tour" button were originally tested only as mocks. The parent repo's `.claude/launch.json` may contain stale entries pointing into old scratch directories (parent-repo concern; preview config for the extension is `extension-preview` at the parent root, not in this repo).
