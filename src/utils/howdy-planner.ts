/**
 * Read the Howdy degree planner (howdy.tamu.edu/main/home/degree-planner-ui/)
 * in table view and turn it into courses for the AggieSB+ degree planner.
 *
 * The DOM part only uses querySelector/textContent/getAttribute so it works
 * on the live page; the mapping part is plain data so it can be unit tested.
 */

export interface HowdyRow {
  /** Term key: year + season digit (1 spring, 2 summer, 3 fall), e.g. "20263". */
  term: string | null;
  /** True when Howdy marks the term "Evaluated" (graded / in progress). */
  evaluated: boolean;
  code: string;
  title: string;
  credits: number | null;
  /** Badge texts, e.g. ["A"], ["TCR"], ["In Progress"]. */
  badges: string[];
}

export type HowdyStatus = 'completed' | 'in_progress' | 'planned';

export interface HowdyCourse {
  code: string;
  title: string;
  credits: number | null;
  term: string | null;
  status: HowdyStatus;
  /** Letter grade when Howdy shows one (transfer grades like "TA" become "A"). */
  grade: string | null;
  /** Transfer / test credit ("TCR", "TA", ...). */
  transfer: boolean;
}

const SEASONS: Record<string, string> = { spring: '1', summer: '2', fall: '3' };
const GRADES = new Set(['A', 'B', 'C', 'D', 'F', 'S', 'U', 'P', 'Q', 'W', 'I']);
const NOT_PASSED = new Set(['F', 'U', 'Q', 'W', 'I']);
const CODE_RE = /\b([A-Z]{3,4})\s*-\s*(\d{3}[A-Z]?)\b/;

function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** "2024 - Summer" or "Summer 2024" -> "20242". */
export function termKeyFromLabel(label: string): string | null {
  const text = clean(label).toLowerCase();
  const year = /\b(20\d{2})\b/.exec(text)?.[1];
  const season = /\b(spring|summer|fall)\b/.exec(text)?.[1];
  return year && season ? `${year}${SEASONS[season]}` : null;
}

/** Fallback from the drop list's data attributes: data-year "2023-2024", data-semester "summer". */
export function termKeyFromAcademicYear(academicYear: string, semester: string): string | null {
  const years = /(\d{4})\s*-\s*(\d{4})/.exec(academicYear);
  const season = SEASONS[semester.toLowerCase()];
  if (!years || !season) return null;
  // The academic year starts in the fall: fall is in the first year, spring/summer in the second.
  return `${season === '3' ? years[1] : years[2]}${season}`;
}

// ---------------------------------------------------------------------------
// Page state
// ---------------------------------------------------------------------------

export function isDegreePlannerUrl(url: string): boolean {
  return /^https:\/\/howdy\.tamu\.edu\/.*degree-planner/i.test(url);
}

export const CURRICULUM_URL = 'https://howdy.tamu.edu/main/home/degree-planner-ui/curriculum';

/**
 * Which degree planner screen this is. The flow is: curriculum ("Evaluate &
 * Go Plan View") -> planner (Expand All, Table View).
 */
export function plannerPage(url: string): 'curriculum' | 'planner' | 'evaluate' | 'other' {
  const path = url.replace(/[?#].*$/, '').replace(/\/+$/, '');
  if (/\/degree-planner-ui\/planner$/i.test(path)) return 'planner';
  if (/\/degree-planner-ui\/curriculum$/i.test(path)) return 'curriculum';
  if (/\/degree-planner-ui\/evaluate$/i.test(path)) return 'evaluate';
  return 'other';
}

export const EVALUATE_URL = 'https://howdy.tamu.edu/main/home/degree-planner-ui/evaluate';

function findButton(root: ParentNode, label: RegExp): HTMLElement | null {
  for (const el of Array.from(root.querySelectorAll('ion-button, button'))) {
    if (label.test(clean(el.textContent))) return el as HTMLElement;
  }
  return null;
}

export interface PlannerViewState {
  /** "Evaluate & Go Plan View" on the curriculum screen. */
  evaluateButton: HTMLElement | null;
  /** The planner's "Academic Terms" card has rendered. */
  ready: boolean;
  /** "Expand All" button while any year is collapsed. */
  expandButton: HTMLElement | null;
  /** "Table View" button while the planner is in card view. */
  tableViewButton: HTMLElement | null;
  expanded: boolean;
  tableView: boolean;
}

export function readViewState(root: ParentNode): PlannerViewState {
  const items = Array.from(root.querySelectorAll('cdk-accordion-item'));
  const expandButton = findButton(root, /^expand all$/i);
  const tableViewButton = findButton(root, /^table view$/i);
  const expanded =
    items.length > 0 && items.every((i) => i.getAttribute('aria-expanded') === 'true');
  const tableView =
    !tableViewButton &&
    (root.querySelector('.table-view-mode, course-table-view') !== null ||
      findButton(root, /^card view$/i) !== null);
  return {
    evaluateButton: findButton(root, /evaluate.*plan view/i),
    ready: items.length > 0,
    expandButton: expanded ? null : expandButton,
    tableViewButton,
    expanded,
    tableView,
  };
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

/** Every course row in table view, with its term. */
export function extractRows(root: ParentNode): HowdyRow[] {
  const rows: HowdyRow[] = [];
  for (const list of Array.from(root.querySelectorAll('.semester-content'))) {
    const card = list.closest('ion-card');
    const label = clean(card?.querySelector('.term-title')?.textContent);
    const dropList = list.querySelector('[data-semester]');
    const term =
      termKeyFromLabel(label) ??
      (dropList
        ? termKeyFromAcademicYear(
            dropList.getAttribute('data-year') ?? '',
            dropList.getAttribute('data-semester') ?? '',
          )
        : null);
    const toggle = card?.querySelector('ion-toggle');
    const evaluated = toggle?.getAttribute('aria-checked') === 'true';

    for (const view of Array.from(list.querySelectorAll('course-table-view'))) {
      const info = view.querySelector('.course-info');
      const match = CODE_RE.exec(clean(info?.textContent).toUpperCase());
      if (!match) continue;
      const creditText =
        /\((\d+(?:\.\d+)?)\)/.exec(clean(info?.textContent))?.[1] ??
        info?.querySelector('input[type="hidden"]')?.getAttribute('value') ??
        null;
      const credits = creditText != null && creditText !== '' ? Number(creditText) : null;
      rows.push({
        term,
        evaluated,
        code: `${match[1]} ${match[2]}`,
        title: clean(view.querySelector('.course-title')?.textContent),
        credits: credits != null && Number.isFinite(credits) ? credits : null,
        badges: Array.from(view.querySelectorAll('ion-badge'))
          .map((b) => clean(b.textContent))
          .filter(Boolean),
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Rows -> courses
// ---------------------------------------------------------------------------

export function rowToCourse(row: HowdyRow): HowdyCourse {
  const badges = row.badges.map((b) => b.toUpperCase());
  const inProgress = badges.some((b) => b === 'IN PROGRESS');
  let grade: string | null = null;
  let transfer = false;
  for (const b of badges) {
    if (GRADES.has(b)) grade = b;
    else if (b === 'TCR' || b === 'CR') transfer = true;
    else if (/^T[A-F]$/.test(b)) {
      transfer = true;
      grade = b[1];
    }
  }
  let status: HowdyStatus;
  if (grade || transfer) status = 'completed';
  else if (inProgress) status = 'in_progress';
  else status = row.evaluated ? 'in_progress' : 'planned';
  return {
    code: row.code,
    title: row.title,
    credits: row.credits,
    // Transfer credit isn't tied to a real term at A&M.
    term: transfer ? null : row.term,
    status,
    grade,
    transfer,
  };
}

/** Higher wins when a course shows up more than once (retakes, variable credit rows). */
function rank(c: HowdyCourse): number {
  if (c.status === 'completed') return c.grade && NOT_PASSED.has(c.grade) ? 0 : 3;
  return c.status === 'in_progress' ? 2 : 1;
}

/** One entry per course code, keeping the most settled one (latest term breaks ties). */
export function rowsToCourses(rows: HowdyRow[]): HowdyCourse[] {
  const byCode = new Map<string, HowdyCourse>();
  for (const row of rows) {
    const course = rowToCourse(row);
    const prev = byCode.get(course.code);
    if (
      !prev ||
      rank(course) > rank(prev) ||
      (rank(course) === rank(prev) && (course.term ?? '') > (prev.term ?? ''))
    ) {
      byCode.set(course.code, course);
    }
  }
  return [...byCode.values()];
}

export interface HowdySummary {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  terms: number;
}

export function summarize(courses: HowdyCourse[]): HowdySummary {
  return {
    total: courses.length,
    completed: courses.filter((c) => c.status === 'completed').length,
    inProgress: courses.filter((c) => c.status === 'in_progress').length,
    planned: courses.filter((c) => c.status === 'planned').length,
    terms: new Set(courses.map((c) => c.term).filter(Boolean)).size,
  };
}

// ---------------------------------------------------------------------------
// Hand-off to the site
// ---------------------------------------------------------------------------

export interface HowdyPayload {
  v: 1;
  source: 'howdy-degree-planner';
  exportedAt: string;
  courses: HowdyCourse[];
  requirements?: HowdyRequirement[];
}

/** base64url of the JSON, for the URL fragment (fragments never reach the server). */
export function encodePayload(
  data: { courses?: HowdyCourse[]; requirements?: HowdyRequirement[] },
  now: Date = new Date(),
): string {
  const payload: HowdyPayload = {
    v: 1,
    source: 'howdy-degree-planner',
    exportedAt: now.toISOString(),
    courses: data.courses ?? [],
    ...(data.requirements?.length ? { requirements: data.requirements } : {}),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Degree evaluation ("Areas"): requirements -> requirement groups
// ---------------------------------------------------------------------------

/** One rule row of an area table, plus the courses Howdy applied to it. */
export interface HowdyRuleRow {
  area: string;
  /** Area hours from the card title, e.g. 30 for "Major Coursework (30)". */
  areaHours: number | null;
  areaMet: boolean;
  /** Requirement text without the hours, e.g. "ENGL 103 or ENGL 104". */
  text: string;
  hours: number | null;
  /** Red note under the requirement ("Select from STAT 315, 335, ..."). */
  note: string;
  met: boolean;
  /** Courses Howdy used for this rule (taken, registered or planned). */
  applied: string[];
}

export type RequirementKind = 'fixed' | 'choice' | 'elective';

export interface HowdyRequirement {
  /** The rule, e.g. "Elective (9 hrs)"; unique within its area. */
  name: string;
  /** Howdy's area, e.g. "Statistics Minor". */
  area: string;
  /**
   * fixed: specific courses, all required. choice: pick from a known list.
   * elective: Howdy doesn't say which courses count; the student fills it in.
   */
  kind: RequirementKind;
  pick: number;
  options: string[][];
  /** Courses Howdy says can count ("Select from ..."), when it lists them. */
  allowed?: string[];
  hours: number | null;
  met: boolean;
}

const RULE_CODE_RE = /\b([A-Z]{3,4})\s+(\d{3}[A-Z]?)\b/g;
/** Areas that aren't course lists (or are only course attributes, shown as "(0)"). */
const SKIP_AREA_RE = /work not applied|residence|\bgpa\b/i;

/** Find the evaluation's area cards (present once Howdy has evaluated the plan). */
export function hasEvaluation(root: ParentNode): boolean {
  return root.querySelector('program-areas area-table, area-table .hdy-table') !== null;
}

function cellText(cell: Element | undefined): string {
  return clean(cell?.textContent);
}

/** Read every rule row from the desktop tables (the mobile list repeats them). */
export function extractRuleRows(root: ParentNode): HowdyRuleRow[] {
  const rules: HowdyRuleRow[] = [];
  for (const card of Array.from(root.querySelectorAll('area-table ion-card'))) {
    const title = clean(card.querySelector('ion-card-title span')?.textContent);
    const titleMatch = /^(.*?)\s*\((\d+)\)\s*$/.exec(title);
    const area = titleMatch ? titleMatch[1] : title;
    const areaHours = titleMatch ? Number(titleMatch[2]) : null;
    const areaMet =
      card.classList.contains('hdy-status-card--success') ||
      /^met$/i.test(clean(card.querySelector('ion-card-title span:last-child')?.textContent));
    const table = card.querySelector('.ion-hide-md-down table.hdy-table') ?? card.querySelector('table.hdy-table');
    if (!area || !table) continue;

    let current: HowdyRuleRow | null = null;
    for (const tr of Array.from(table.querySelectorAll('tbody tr.hdy-table-row'))) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length < 6) continue;
      const rule = cellText(cells[2]);
      const course = cellText(cells[5]).toUpperCase();
      const courseMatch = /^([A-Z]{3,4})\s+(\d{3}[A-Z]?)$/.exec(course);
      if (rule) {
        const reqCell = cells[3];
        const note = clean(reqCell.querySelector('div')?.textContent);
        let full = cellText(reqCell);
        if (note) full = clean(full.replace(note, ''));
        const hoursMatch = /(\d+)\+?\s*hrs?\b/i.exec(full);
        const icon = cells[0].querySelector('ion-icon')?.getAttribute('name') ?? '';
        current = {
          area,
          areaHours,
          areaMet,
          text: clean(full.replace(/(\d+)\+?\s*hrs?\b/i, '')),
          hours: hoursMatch ? Number(hoursMatch[1]) : null,
          note,
          met: /checkmark/i.test(icon),
          applied: [],
        };
        rules.push(current);
      }
      if (current && courseMatch) {
        const code = `${courseMatch[1]} ${courseMatch[2]}`;
        if (!current.applied.includes(code)) current.applied.push(code);
      }
    }
  }
  return rules;
}

/** Codes in a "Select from STAT 315, 335, 404 ..." note; bare numbers reuse the last subject. */
export function codesFromList(text: string): string[] {
  const codes: string[] = [];
  let subject: string | null = null;
  const re = /\b([A-Z]{3,4})\s+(\d{3}[A-Z]?)\b|\b(\d{3}[A-Z]?)\b/g;
  for (const m of text.toUpperCase().matchAll(re)) {
    if (m[1]) subject = m[1];
    const number = m[2] ?? m[3];
    if (!subject || !number) continue;
    const code = `${subject} ${number}`;
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

/** "CSCE 120", "ENGL 103 or ENGL 104", "PHYS 206 and PHYS 216" -> codes and joiner; null if not just codes. */
export function staticRule(text: string): { codes: string[]; any: boolean } | null {
  const upper = text.toUpperCase();
  const codes = Array.from(upper.matchAll(RULE_CODE_RE), (m) => `${m[1]} ${m[2]}`);
  if (codes.length === 0) return null;
  const rest = upper.replace(RULE_CODE_RE, ' ').replace(/\b(OR|AND)\b|[,&/]/g, ' ').trim();
  if (rest) return null; // words left over: a named requirement, not a course list
  return { codes: [...new Set(codes)], any: /\bOR\b|\//.test(upper) };
}

const coursesFromHours = (hours: number | null) => (hours ? Math.max(1, Math.round(hours / 3)) : 1);

/**
 * Turn rule rows into requirement groups. Fixed single-course rules of an
 * area become one "required courses" group; choices and electives get their
 * own group. Elective options start as the courses Howdy applied.
 */
export function rulesToRequirements(rules: HowdyRuleRow[]): HowdyRequirement[] {
  const out: HowdyRequirement[] = [];
  const fixedByArea = new Map<string, HowdyRequirement>();
  for (const rule of rules) {
    if (SKIP_AREA_RE.test(rule.area) || rule.areaHours === 0) continue;
    const base = { area: rule.area, hours: rule.hours, met: rule.met };
    const parsed = staticRule(rule.text);
    if (parsed && !parsed.any) {
      let group = fixedByArea.get(rule.area);
      if (!group) {
        group = { ...base, name: 'Required courses', kind: 'fixed', pick: 0, options: [], hours: null, met: true };
        fixedByArea.set(rule.area, group);
        out.push(group);
      }
      group.options.push(parsed.codes);
      group.pick = group.options.length;
      group.met = group.met && rule.met;
      continue;
    }
    if (parsed) {
      out.push({ ...base, name: rule.text, kind: 'choice', pick: 1, options: parsed.codes.map((c) => [c]) });
      continue;
    }
    const hoursLabel = rule.hours ? ` (${rule.hours} hrs)` : '';
    const listed = /select from|choose from|chosen from/i.test(rule.note) ? codesFromList(rule.note) : [];
    // Options are what the student actually has (taken, registered or planned);
    // Howdy's list is only what's allowed to count.
    out.push({
      ...base,
      name: `${rule.text}${hoursLabel}`,
      kind: listed.length > 0 ? 'choice' : 'elective',
      pick: coursesFromHours(rule.hours),
      options: rule.applied.map((c) => [c]),
      ...(listed.length > 0 ? { allowed: listed } : {}),
    });
  }
  return out;
}
