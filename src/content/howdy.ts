/**
 * Howdy degree planner helper: walks the student through "Expand All" and
 * "Table View", reads the courses, and opens the AggieSB+ degree planner with
 * them so they can review and import.
 *
 * Kept free of shared imports (other than the parser) so the bundle stays a
 * single self-contained content script.
 */
import { withUtm } from '../config/constants';
import {
  CURRICULUM_URL,
  encodePayload,
  extractRows,
  isDegreePlannerUrl,
  plannerPage,
  readViewState,
  rowsToCourses,
  summarize,
  type HowdyCourse,
} from '../utils/howdy-planner';

const SITE_URL = 'https://aggieschedulebuilderplus.vercel.app';
const HOST_ID = 'aggiesbp-howdy-import';
const DISMISS_KEY = 'aggiesbp-howdy-import-dismissed';

const STYLES = `
  :host { all: initial; }
  .panel {
    position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
    width: 320px; box-sizing: border-box;
    font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1f1f1f; background: #fff; border: 1px solid #d9d4cf; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.18); overflow: hidden;
  }
  .head {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 14px; background: #500000; color: #fff; font-weight: 600;
  }
  .head button { all: unset; cursor: pointer; padding: 2px 6px; border-radius: 6px; font-size: 16px; line-height: 1; }
  .head button:hover { background: rgba(255,255,255,.15); }
  .body { padding: 12px 14px 14px; }
  p { margin: 0 0 10px; }
  ol { margin: 0 0 12px; padding: 0; list-style: none; }
  li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-top: 1px solid #eee; }
  li:first-child { border-top: 0; }
  .mark {
    flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
    font-size: 12px; font-weight: 700; background: #eee; color: #555;
  }
  .done .mark { background: #1f7a3d; color: #fff; }
  .label { flex: 1; }
  .done .label { color: #555; }
  .small {
    all: unset; cursor: pointer; font-size: 12px; font-weight: 600; color: #500000;
    padding: 4px 8px; border: 1px solid #500000; border-radius: 6px; white-space: nowrap;
  }
  .small:hover { background: #f6eeee; }
  .primary {
    all: unset; box-sizing: border-box; display: block; width: 100%; text-align: center; cursor: pointer;
    padding: 9px 12px; border-radius: 8px; background: #500000; color: #fff; font-weight: 600;
  }
  .primary:hover { background: #3d0000; }
  .primary[aria-disabled="true"] { background: #b9b0aa; cursor: default; }
  .muted { color: #666; font-size: 12px; margin: 8px 0 0; }
  .section { margin: 14px 0 4px; padding-top: 10px; border-top: 1px solid #eee; font-weight: 600; }
  .pill {
    position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
    font: 600 13px system-ui, sans-serif; color: #fff; background: #500000; border: 0;
    padding: 9px 14px; border-radius: 999px; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.2);
  }
`;

let host: HTMLElement | null = null;
let shadow: ShadowRoot | null = null;
let observer: MutationObserver | null = null;
let renderTimer: number | undefined;
let minimized = sessionStorage.getItem(DISMISS_KEY) === '1';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function step(done: boolean, label: string, action?: { text: string; run: () => void }) {
  const li = el('li', done ? { class: 'done' } : {});
  li.append(el('span', { class: 'mark' }, done ? '✓' : '•'), el('span', { class: 'label' }, label));
  if (!done && action) {
    const button = el('button', { class: 'small', type: 'button' }, action.text);
    button.addEventListener('click', () => {
      action.run();
      scheduleRender(400);
    });
    li.append(button);
  }
  return li;
}

function sendToSite(data: { courses: HowdyCourse[] }) {
  const url = withUtm(`${SITE_URL}/planner#howdy=${encodePayload(data)}`, 'howdy-import');
  window.open(url, '_blank', 'noopener');
}

function render() {
  if (!shadow) return;
  shadow.replaceChildren(el('style', {}, STYLES));

  if (minimized) {
    const pill = el('button', { class: 'pill', type: 'button' }, 'AggieSB+ import');
    pill.addEventListener('click', () => {
      minimized = false;
      sessionStorage.removeItem(DISMISS_KEY);
      render();
    });
    shadow.append(pill);
    return;
  }

  const state = readViewState(document);
  const courses = state.expanded && state.tableView ? rowsToCourses(extractRows(document)) : [];
  const summary = summarize(courses);

  const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': 'Import to AggieSB+' });
  const head = el('div', { class: 'head' });
  const close = el('button', { type: 'button', 'aria-label': 'Minimize', title: 'Minimize' }, '–');
  close.addEventListener('click', () => {
    minimized = true;
    sessionStorage.setItem(DISMISS_KEY, '1');
    render();
  });
  head.append(el('span', {}, 'Import to AggieSB+'), close);

  const body = el('div', { class: 'body' });
  {
    // The plan view has rendered once its year accordions are on the page.
    const onPlanView = plannerPage(location.href) === 'planner' || state.ready;
    body.append(
      el('p', {}, 'Bring your courses into the AggieSB+ degree planner so it can check prerequisites for you.'),
    );
    const list = el('ol');
    list.append(
      step(onPlanView, 'Click "Evaluate & Go Plan View"', state.evaluateButton
        ? { text: 'Do it', run: () => state.evaluateButton?.click() }
        : { text: 'Open', run: () => { location.href = CURRICULUM_URL; } }),
      step(onPlanView && state.expanded, 'Expand all years', onPlanView && state.expandButton
        ? { text: 'Expand all', run: () => state.expandButton?.click() }
        : undefined),
      step(onPlanView && state.tableView, 'Switch to table view', onPlanView && state.tableViewButton
        ? { text: 'Table view', run: () => state.tableViewButton?.click() }
        : undefined),
    );
    body.append(list);

    const ready = onPlanView && state.expanded && state.tableView && courses.length > 0;
    if (ready) {
      const parts = [
        summary.completed && `${summary.completed} completed`,
        summary.inProgress && `${summary.inProgress} in progress`,
        summary.planned && `${summary.planned} planned`,
      ].filter(Boolean);
      body.append(el('p', {}, `Found ${summary.total} courses: ${parts.join(', ')}.`));
    } else if (plannerPage(location.href) === 'planner' && !state.ready) {
      body.append(el('p', {}, 'Waiting for your plan to load…'));
    } else if (onPlanView && state.expanded && state.tableView) {
      body.append(el('p', {}, 'No courses found yet. Add terms to your plan in Howdy, then try again.'));
    }
    const send = el('button', {
      class: 'primary',
      type: 'button',
      'aria-disabled': ready ? 'false' : 'true',
    }, 'Send to AggieSB+');
    send.addEventListener('click', () => {
      if (ready) sendToSite({ courses });
    });
    body.append(send);
  }

  body.append(
    el('p', { class: 'muted' }, 'Opens AggieSB+ in a new tab. Sign in there, review the list, and nothing is saved until you confirm.'),
  );
  panel.append(head, body);
  shadow.append(panel);
}

function scheduleRender(delay = 250) {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, delay);
}

function mount() {
  if (host) return;
  host = el('div', { id: HOST_ID });
  shadow = host.attachShadow({ mode: 'open' });
  document.documentElement.append(host);
  observer = new MutationObserver((mutations) => {
    // Ignore our own panel re-rendering.
    if (mutations.every((m) => host?.contains(m.target as Node))) return;
    scheduleRender();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded', 'class'],
  });
  render();
}

function unmount() {
  observer?.disconnect();
  observer = null;
  host?.remove();
  host = null;
  shadow = null;
}

// Howdy is a single-page app: follow URL changes.
let lastUrl = '';
function checkUrl() {
  const key = location.href;
  if (key === lastUrl) return;
  lastUrl = key;
  if (isDegreePlannerUrl(location.href)) {
    mount();
    scheduleRender(); // curriculum -> planner keeps the panel; refresh its steps
  } else unmount();
}
checkUrl();
window.setInterval(checkUrl, 1000);
