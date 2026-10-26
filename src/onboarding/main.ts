import './onboarding.css';

/**
 * Interactive onboarding tour shown after install.
 *
 * Runs on a mock copy of the scheduler with sample data and never calls the
 * AggieSB+ API. Keep this entry self-contained: importing modules shared with
 * the content script would split them into a chunk the content script cannot load.
 * The panel markup mirrors professors-panel.ts and reuses its stylesheet.
 */

const SITE_URL = 'https://aggieschedulebuilderplus.vercel.app';
const LOGIN_URL = `${SITE_URL}/auth?redirectToPath=%2Fprofile%2Falerts`;
const SCHEDULER_URL = 'https://tamu.collegescheduler.com/';
const TOUR_DONE_KEY = 'onboardingCompleted';

const ICONS = {
  users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`,
  graduation: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
};

// ── Sample data (fictional professors) ─────────────────────────────────

type Badge = 'Prerequisites' | 'Honors' | 'Restrictions';
/** [days & times with dates, building/room] */
type Meeting = [string, string];

interface MockSection {
  crn: string;
  section: string;
  instructor: string;
  meetings: Meeting[];
  seats: number;
  badges: Badge[];
}

const TERM_DATES = '01/19/2027 - 05/11/2027';

const SECTIONS: MockSection[] = [
  { crn: '41201', section: '501', instructor: 'Rivera, Jordan', seats: 0, badges: ['Prerequisites', 'Restrictions'],
    meetings: [[`TTh 8:25am - 9:15am ${TERM_DATES}`, 'ZACH 584'], [`MWF 8:00am - 8:50am ${TERM_DATES}`, 'ZACH 244']] },
  { crn: '41202', section: '502', instructor: 'Rivera, Jordan', seats: 7, badges: ['Prerequisites', 'Restrictions'],
    meetings: [[`TTh 11:35am - 12:25pm ${TERM_DATES}`, 'ZACH 596'], [`MWF 9:10am - 10:00am ${TERM_DATES}`, 'ZACH 244']] },
  { crn: '41203', section: '503', instructor: 'Natarajan, Priya', seats: 0, badges: ['Prerequisites', 'Restrictions'],
    meetings: [[`TTh 12:45pm - 1:35pm ${TERM_DATES}`, 'ZACH 596'], [`MWF 10:20am - 11:10am ${TERM_DATES}`, 'ZACH 244']] },
  { crn: '41204', section: '504', instructor: 'Natarajan, Priya', seats: 12, badges: ['Prerequisites', 'Restrictions'],
    meetings: [[`TTh 3:55pm - 5:10pm ${TERM_DATES}`, 'HRBB 126']] },
  { crn: '41205', section: '200', instructor: 'Whitfield, Casey', seats: 3, badges: ['Prerequisites', 'Honors', 'Restrictions'],
    meetings: [[`TTh 9:35am - 10:50am ${TERM_DATES}`, 'HRBB 126']] },
];

interface MockEnrolled {
  color: string;
  crn: string;
  subject: string;
  course: string;
  section: string;
  credits: number;
  instructor: string;
  meeting: Meeting;
  badges: Badge[];
}

const CURRENT_SCHEDULE: MockEnrolled[] = [
  { color: '#a8d5b5', crn: '38114', subject: 'CSCE', course: '312', section: '501', credits: 4, instructor: 'Okafor, Dana',
    meeting: [`MWF 9:10am - 10:00am ${TERM_DATES}`, 'ZACH 350'], badges: ['Prerequisites', 'Restrictions'] },
  { color: '#a9c4f5', crn: '27731', subject: 'MATH', course: '304', section: '505', credits: 3, instructor: 'Lindqvist, Erik',
    meeting: [`TTh 11:10am - 12:25pm ${TERM_DATES}`, 'BLOC 164'], badges: ['Prerequisites'] },
  { color: '#f4a9a0', crn: '30958', subject: 'STAT', course: '211', section: '503', credits: 3, instructor: 'Moreno, Ana',
    meeting: [`MW 1:50pm - 3:05pm ${TERM_DATES}`, 'HELD 105'], badges: [] },
  { color: '#f9d79c', crn: '45520', subject: 'ENGL', course: '210', section: '512', credits: 3, instructor: 'Haddad, Sami',
    meeting: [`TTh 2:20pm - 3:35pm ${TERM_DATES}`, 'LAAH 262'], badges: ['Restrictions'] },
];

interface MockSummary {
  label: string;
  reviewCount: number;
  html: string;
}

interface MockProfessor {
  name: string;
  courseRating: number | null;
  courseReviews: number;
  overallRating: number | null;
  overallReviews: number;
  grades?: Record<'A' | 'B' | 'C' | 'D' | 'F', number>;
  summaries: MockSummary[];
}

const section = (label: string, key: string, text: string, extra = false): string =>
  `<div class="prof-summ-section${extra ? ' prof-summ-extra' : ''}">
     <span class="prof-summ-label prof-summ-label-${key}">${label}</span>
     <p class="prof-summ-text prof-summ-preview">${text}</p>
   </div>`;

const stats = (items: Array<[string, string, number]>): string =>
  `<ul class="prof-stats" aria-label="Review statistics">${items.map(([value, label, n]) =>
    `<li class="prof-stat" title="Based on ${n} reviews"><span class="prof-stat-value">${value}</span> <span class="prof-stat-label">${label}</span> <span class="prof-stat-n">(${n} reviews)</span></li>`
  ).join('')}</ul>`;

const PROFESSORS: MockProfessor[] = [
  {
    name: 'Jordan Rivera',
    courseRating: 4.6, courseReviews: 38, overallRating: 4.4, overallReviews: 91,
    grades: { A: 48, B: 31, C: 14, D: 4, F: 3 },
    summaries: [
      {
        label: 'This Course (CSCE221)', reviewCount: 38,
        html: `<div class="prof-summ-sections">
          ${stats([['89%', 'would take again', 27], ['20%', 'used the textbook', 15]])}
          ${section('Teaching', 'teaching', 'Explains linked structures and trees with clear live-coded examples; lectures are recorded.')}
          ${section('Exams', 'exams', 'Three exams that mirror the practice problems closely. No surprises if you do the review sheets.')}
          ${section('Workload', 'workload', 'Weekly programming assignments take 6–10 hours. Start early on the hash table project.')}
          ${section('Grading', 'grading', 'Fair partial credit and a curve on the final exam.', true)}
          <div class="prof-summ-section prof-summ-extra"><span class="prof-summ-label prof-summ-label-tips">Tips</span><ul class="prof-summ-list"><li>Go to office hours before project deadlines.</li><li>Redo the practice exams.</li></ul></div>
        </div>`,
      },
      {
        label: 'Overall (All Courses)', reviewCount: 91,
        html: `<div class="prof-summ-sections">
          ${section('TL;DR', 'tldr', 'Clear, organized, and approachable. Projects are heavy but grading is fair.')}
          ${section('Overall', 'sentiment', 'Students consistently say they learned a lot and felt prepared for later courses.')}
          <div class="prof-summ-section"><span class="prof-summ-label prof-summ-label-strengths">Strengths</span><ul class="prof-summ-list"><li><span class="prof-summ-preview">Very responsive on the course forum.</span></li><li><span class="prof-summ-preview">Lecture slides are thorough.</span></li></ul></div>
        </div>`,
      },
    ],
  },
  {
    name: 'Priya Natarajan',
    courseRating: 3.9, courseReviews: 24, overallRating: 4.1, overallReviews: 56,
    grades: { A: 35, B: 36, C: 19, D: 6, F: 4 },
    summaries: [
      {
        label: 'This Course (CSCE221)', reviewCount: 24,
        html: `<div class="prof-summ-sections">
          ${stats([['71%', 'would take again', 17], ['54%', 'say attendance is mandatory', 13]])}
          ${section('Teaching', 'teaching', 'Theory-heavy lectures with a strong focus on complexity analysis.')}
          ${section('Exams', 'exams', 'Exams are long and proof-oriented; partial credit is generous.')}
          ${section('Policies', 'policies', 'In-class quizzes count toward attendance.')}
        </div>`,
      },
    ],
  },
  {
    name: 'Casey Whitfield',
    courseRating: null, courseReviews: 0, overallRating: 4.8, overallReviews: 12,
    summaries: [
      {
        label: 'Overall (All Courses)', reviewCount: 12,
        html: `<div class="prof-summ-sections">
          ${section('TL;DR', 'tldr', 'New to this course, but highly rated in CSCE 121. Energetic and easy to approach.')}
        </div>`,
      },
    ],
  },
];

// ── Mock page rendering ────────────────────────────────────────────────

const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);

const INFO_ICON = '<svg class="cs-info" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><circle cx="8" cy="4.6" r="1.2" fill="#fff"/><path d="M6.6 7h2.2v4.6h1v1.2H6.6v-1.2h1V8.2h-1z" fill="#fff"/></svg>';

function badgesHTML(badges: Badge[]): string {
  return badges.map(b => `<span class="cs-badge cs-badge-${b.toLowerCase()}">${b}</span>`).join('');
}

function meetingsHTML(meetings: Meeting[]): string {
  return meetings.map(([times, room]) => `<div>${times}</div><a href="#" class="cs-link" data-demo-link="the campus map">${room}</a>`).join('');
}

/** College Scheduler shows each class as a main row plus a row for badges and the instructor. */
function renderSectionsTable(): void {
  const body = $('#mock-sections-body');
  if (!body) return;
  body.innerHTML = SECTIONS.map((s, i) => `
    <tr class="cs-row${i % 2 ? ' cs-row-alt' : ''}" data-crn="${s.crn}">
      <td><input type="checkbox" checked aria-label="Include section ${s.section}"></td>
      <td>${INFO_ICON}</td>
      <td>${s.crn}</td><td>CSCE</td><td>221</td><td>${s.section}</td><td>4</td>
      <td>${s.seats}</td><td>Traditional Face-to-Face<br>(F2F)</td><td class="cs-meetings">${meetingsHTML(s.meetings)}</td>
    </tr>
    <tr class="cs-row-detail${i % 2 ? ' cs-row-alt' : ''}">
      <td></td><td colspan="9">${badgesHTML(s.badges)}<div class="cs-instructor"><strong>Instructor:</strong> ${s.instructor}</div></td>
    </tr>`).join('');
}

/** Current Schedule page uses color swatches; the same table on Build Schedule uses checkboxes. */
function renderCurrentSchedule(bodyId: string, lead: 'swatch' | 'checkbox'): void {
  const body = $(bodyId);
  if (!body) return;
  body.innerHTML = CURRENT_SCHEDULE.map((c, i) => `
    <tr class="cs-row${i % 2 ? ' cs-row-alt' : ''}">
      <td>${lead === 'swatch'
        ? `<span class="cs-swatch" style="background: ${c.color}"></span>`
        : `<input type="checkbox" checked aria-label="Include ${c.subject} ${c.course}">`}</td>
      <td>${INFO_ICON}</td>
      <td>Enrolled</td><td>${c.crn}</td><td>${c.subject}</td><td>${c.course}</td><td>${c.section}</td><td>${c.credits}</td>
      <td>Traditional Face-to-Face<br>(F2F)</td><td class="cs-meetings">${meetingsHTML([c.meeting])}</td>
    </tr>
    <tr class="cs-row-detail${i % 2 ? ' cs-row-alt' : ''}">
      <td></td><td colspan="9">${badgesHTML(c.badges)}<div class="cs-instructor"><strong>Instructor:</strong> ${c.instructor}</div></td>
    </tr>`).join('');
}

const COURSES: Array<{ code: string; title: string; checked: boolean; badges: Badge[] }> = [
  { code: 'CSCE 221', title: 'Data Structures and Algorithms', checked: true, badges: ['Prerequisites'] },
  { code: 'CSCE 313', title: 'Introduction to Computer Systems', checked: true, badges: ['Prerequisites'] },
  { code: 'MATH 304', title: 'Linear Algebra', checked: true, badges: ['Prerequisites'] },
  { code: 'STAT 211', title: 'Principles of Statistics I', checked: true, badges: [] },
  { code: 'ENGL 210', title: 'Technical & Business Writing', checked: false, badges: [] },
];

const GEAR_ICON = '<svg class="cs-gear" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M9.4 1l.4 1.8 1.2.6 1.7-.8 1.4 1.4-.8 1.7.6 1.2 1.8.4v2l-1.8.4-.6 1.2.8 1.7-1.4 1.4-1.7-.8-1.2.6L9.4 15h-2l-.4-1.8-1.2-.6-1.7.8-1.4-1.4.8-1.7-.6-1.2L1 8.9v-2l1.8-.4.6-1.2-.8-1.7L4 2.2l1.7.8 1.2-.6L7.4 1zM8.4 5.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z"/></svg>';
const LOCK_ICON = '<svg class="cs-lock" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1" fill="currentColor"/><path d="M5.5 7V4.8a2.5 2.5 0 015 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const REMOVE_ICON = '<svg class="cs-remove" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

function renderBuildSchedule(): void {
  const list = $('#mock-course-list');
  if (list) {
    list.innerHTML = COURSES.map(c => `
      <div class="cs-course">
        <input type="checkbox"${c.checked ? ' checked' : ''} aria-label="Include ${c.code}">
        <div class="cs-course-name"><div>${c.code}</div><small>${c.title.replace('&', '&amp;')}</small></div>
        <a href="#" class="cs-course-sections${c.code === 'CSCE 221' ? ' cs-course-row' : ''}"${c.code === 'CSCE 221' ? '' : ' data-demo-link="that course&#39;s sections page"'}>${GEAR_ICON} Sections</a>
        ${INFO_ICON}${LOCK_ICON}${REMOVE_ICON}
        ${c.badges.length ? `<div class="cs-course-badges">${badgesHTML(c.badges)}</div>` : ''}
      </div>`).join('');
  }
  renderCurrentSchedule('#mock-build-current-body', 'checkbox');
  const cart = $('#mock-cart-body');
  const full = SECTIONS[0];
  if (cart) {
    cart.innerHTML = `
      <tr class="cs-row">
        <td><input type="checkbox" checked aria-label="Include CSCE 221-${full.section}"></td><td>${INFO_ICON}</td>
        <td>${full.crn}</td><td>CSCE</td><td>221</td><td>${full.section}</td><td>4</td>
        <td><span class="cs-seats-zero">0</span></td><td>Traditional Face-to-Face<br>(F2F)</td><td class="cs-meetings">${meetingsHTML(full.meetings)}</td>
      </tr>
      <tr class="cs-row-detail">
        <td></td><td colspan="9">${badgesHTML(full.badges)}<div class="cs-instructor"><strong>Instructor:</strong> ${full.instructor}</div></td>
      </tr>`;
  }
}

function formatRating(rating: number | null): string {
  return rating === null ? 'Unavailable' : `${rating.toFixed(1)} / 5`;
}

function ratingScope(label: string, rating: number | null, reviews: number): string {
  return `<div class="prof-rating-scope">
    <span class="prof-rating-label">${label}</span>
    <div class="prof-rating-badge${rating === null ? ' prof-rating-unavailable' : ''}">${rating === null ? '' : ICONS.star}<span>${formatRating(rating)}</span></div>
    <span class="prof-rating-count">${reviews} review${reviews === 1 ? '' : 's'}</span>
  </div>`;
}

function createProfessorCard(prof: MockProfessor): HTMLElement {
  const card = document.createElement('div');
  card.className = 'prof-card';

  let gradesHTML = '';
  if (prof.grades) {
    const entries = Object.entries(prof.grades);
    gradesHTML = `<div class="prof-grades">
      <div class="prof-grades-bar">${entries.map(([g, p]) =>
        `<div class="prof-grade-segment prof-grade-${g.toLowerCase()}" style="width: ${p}%">${p > 5 ? p + '%' : ''}</div>`).join('')}</div>
      <div class="prof-grades-legend">${entries.map(([g, p]) => `<span>${g}: ${p}%</span>`).join('')}</div>
    </div>`;
  }

  const first = prof.summaries[0];
  const dropdown = prof.summaries.length > 1
    ? `<select class="prof-summary-select">${prof.summaries.map((s, i) => `<option value="${i}">${s.label}</option>`).join('')}</select>`
    : '';

  card.innerHTML = `
    <div class="prof-card-header"><h3 class="prof-name">${prof.name}</h3></div>
    <div class="prof-ratings" aria-label="Professor ratings">
      ${ratingScope('CSCE221', prof.courseRating, prof.courseReviews)}
      ${ratingScope('Overall · All courses', prof.overallRating, prof.overallReviews)}
    </div>
    <div class="prof-summary">
      <div class="prof-summary-header">
        ${ICONS.graduation}
        <span class="prof-summary-label">AI Summary based on <span class="prof-review-count">${first.reviewCount}</span> reviews</span>
        ${dropdown}
      </div>
      <div class="prof-summary-content">
        <div class="prof-summ-container prof-summ-compact">${first.html}</div>
        <button type="button" class="prof-summ-toggle" aria-expanded="false">Expand full summary</button>
      </div>
    </div>
    ${gradesHTML}
    <div class="prof-card-actions">
      <a href="#" class="prof-btn prof-btn-primary" data-demo-link="the professor's AggieSB+ page">${ICONS.graduation} Professor</a>
      <a href="#" class="prof-btn prof-btn-primary" data-demo-link="their Rate My Professors page">Rate My Professors ↗</a>
    </div>`;

  const container = $('.prof-summ-container', card)!;
  const toggle = $<HTMLButtonElement>('.prof-summ-toggle', card)!;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    container.classList.toggle('prof-summ-compact', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = expanded ? 'Show compact summary' : 'Expand full summary';
  });
  $<HTMLSelectElement>('.prof-summary-select', card)?.addEventListener('change', event => {
    const chosen = prof.summaries[Number((event.target as HTMLSelectElement).value)];
    container.innerHTML = chosen.html;
    container.classList.add('prof-summ-compact');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Expand full summary';
    $('.prof-review-count', card)!.textContent = String(chosen.reviewCount);
  });
  return card;
}

function accountStatus(): string {
  return `<div class="prof-account-status" data-state="signed_out" id="demo-account">
    <span class="prof-account-label">Not signed in</span>
    <a class="prof-account-link" href="#" data-demo-link="the AggieSB+ sign-in page">Sign in ↗</a>
  </div>`;
}

const watched: string[] = [];

function renderAlerts(container: HTMLElement): void {
  const full = SECTIONS.filter(s => s.seats === 0);
  container.innerHTML = `
    <h2 class="aggiesbp-alerts-title">Seat Alerts</h2>
    <div class="aggiesbp-alerts-discovery-wrapper" style="padding: 0 16px">
      <p class="aggiesbp-alerts-note">Add alerts for sections to be notified when seats open up.</p>
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px">Sections found on this page:</div>
      <div class="aggiesbp-alerts-list aggiesbp-alerts-discovered" id="demo-discovered" style="display: flex; flex-direction: column; gap: 8px">
        ${full.map(s => `<div class="aggiesbp-alerts-row aggiesbp-discovered-row">
          <span class="aggiesbp-alerts-label">CSCE 221-${s.section} (CRN ${s.crn}) · Full</span>
          <button type="button" class="aggiesbp-alerts-add-btn" data-section="${s.section}">+ Add Alert</button>
        </div>`).join('')}
      </div>
    </div>
    <h3 class="aggiesbp-alerts-subtitle">Watched sections</h3>
    <div class="aggiesbp-alerts-list" id="demo-watched"></div>`;
  renderWatched(container);
  container.querySelectorAll<HTMLButtonElement>('.aggiesbp-alerts-add-btn').forEach(btn => {
    if (watched.includes(btn.dataset.section!)) markAdded(btn);
    btn.addEventListener('click', () => {
      if (!watched.includes(btn.dataset.section!)) watched.push(btn.dataset.section!);
      markAdded(btn);
      document.querySelectorAll<HTMLElement>('#prof-sidebar-tab-alerts').forEach(renderWatched);
      tour.emit('alert-added');
    });
  });
}

function markAdded(btn: HTMLButtonElement): void {
  btn.textContent = 'Added ✓';
  btn.classList.add('success');
  btn.disabled = true;
}

function renderWatched(container: HTMLElement): void {
  const list = $('#demo-watched', container);
  if (!list) return;
  list.innerHTML = watched.length
    ? watched.map(sec => {
        const s = SECTIONS.find(x => x.section === sec)!;
        return `<div class="aggiesbp-alerts-row"><span class="aggiesbp-alerts-label">CSCE 221-${sec} (CRN ${s.crn}, 202711)</span><button type="button" class="aggiesbp-alerts-remove-btn" data-remove="${sec}">Remove</button></div>`;
      }).join('')
    : '<p class="aggiesbp-alerts-empty">You are not watching any sections yet.</p>';
  list.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    watched.splice(watched.indexOf(btn.dataset.remove!), 1);
    document.querySelectorAll<HTMLElement>('#prof-sidebar-tab-alerts').forEach(renderAlerts);
  }));
}

/** Mirrors the Fit My Schedule animation in professors-panel.ts: [column (M-F), first row, last row, isNewClass] per block. */
const FIT_DEMO_BLOCKS: Array<[number, number, number, boolean]> = [
  [1, 1, 2, false], [3, 1, 2, false], [5, 1, 2, false],
  [2, 3, 4, false], [4, 3, 4, false],
  [1, 5, 6, false], [3, 5, 6, false],
  [2, 5, 6, true], [4, 5, 6, true],
];

const FIT_DEMO_HTML = `
  <div class="fit-demo" aria-hidden="true">
    <div class="fit-demo-days"><span>M</span><span>T</span><span>W</span><span>R</span><span>F</span></div>
    <div class="fit-demo-grid">
      ${FIT_DEMO_BLOCKS.map(([col, start, end, isNew], i) =>
        `<span class="fit-demo-block ${isNew ? 'fit-demo-new' : 'fit-demo-class'}" style="grid-column: ${col}; grid-row: ${start} / ${end + 1}; --i: ${i}"></span>`).join('')}
      <span class="fit-demo-scan"></span>
    </div>
    <div class="fit-demo-caption">
      <span class="fit-demo-caption-import">Importing your classes…</span>
      <span class="fit-demo-caption-found">✓ Found a class that fits your gaps</span>
    </div>
  </div>`;

type PanelKind = 'sections' | 'build' | 'current';

/** Builds the toggle button and panel the content script shows on each page type. */
function mountPanel(kind: PanelKind): void {
  document.getElementById('professor-compare-panel')?.remove();
  document.getElementById('prof-toggle-btn')?.remove();

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'prof-toggle-btn';
  toggleBtn.className = 'prof-toggle-btn';
  toggleBtn.innerHTML = `${ICONS.users} AggieSB+`;

  const panel = document.createElement('div');
  panel.id = 'professor-compare-panel';
  panel.className = `professor-compare-panel collapsed${darkTheme ? ' dark-theme' : ''}`;
  const title = { sections: 'Course Professors', build: 'Seat Alerts', current: 'Fit My Schedule' }[kind];
  panel.innerHTML = `
    <div class="prof-panel-header">
      <h2 class="prof-panel-title">${ICONS.users}<span>${title}</span></h2>
      <button type="button" class="prof-panel-close" aria-label="Close">${ICONS.close}</button>
    </div>
    ${accountStatus()}`;

  if (kind === 'sections') {
    panel.insertAdjacentHTML('beforeend', `
      <div class="prof-sidebar-tabs">
        <button type="button" class="prof-sidebar-tab active" data-tab="professors">Professors</button>
        <button type="button" class="prof-sidebar-tab" data-tab="alerts">Seat Alerts</button>
      </div>
      <div class="prof-sidebar-tabs-content">
        <div id="prof-sidebar-tab-professors" class="prof-sidebar-tab-pane active"><div class="prof-list-container"></div></div>
        <div id="prof-sidebar-tab-alerts" class="prof-sidebar-tab-pane"></div>
      </div>`);
    const list = $('.prof-list-container', panel)!;
    PROFESSORS.forEach(p => list.appendChild(createProfessorCard(p)));
    renderAlerts($('#prof-sidebar-tab-alerts', panel)!);
    panel.querySelectorAll<HTMLButtonElement>('.prof-sidebar-tab').forEach(tab => tab.addEventListener('click', () => {
      panel.querySelectorAll('.prof-sidebar-tab').forEach(t => t.classList.toggle('active', t === tab));
      panel.querySelectorAll('.prof-sidebar-tab-pane').forEach(pane =>
        pane.classList.toggle('active', pane.id === `prof-sidebar-tab-${tab.dataset.tab}`));
      tour.emit(`tab-${tab.dataset.tab}`);
    }));
  } else if (kind === 'build') {
    const pane = document.createElement('div');
    pane.id = 'prof-sidebar-tab-alerts';
    pane.className = 'prof-sidebar-tab-pane active';
    panel.appendChild(pane);
    renderAlerts(pane);
  } else {
    panel.insertAdjacentHTML('beforeend', `
      <div class="prof-sidebar-tab-pane active">
        <div style="padding: 14px;">
          <p style="font-size: 13px; line-height: 1.5; margin-bottom: 10px;">
            Import your current TAMU schedule into AggieSB+ and discover classes that fit around it.
          </p>
          ${FIT_DEMO_HTML}
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" class="prof-btn prof-btn-primary" id="fit-import-btn">${ICONS.check} Import current schedule</button>
            <button type="button" class="prof-btn" id="fit-open-btn" data-demo-link="Fit My Schedule on the AggieSB+ website">${ICONS.plus} Open Fit My Schedule</button>
          </div>
          <p id="fit-import-status" style="font-size: 12px; margin-top: 10px; opacity: 0.8;"></p>
        </div>
      </div>`);
    $('#fit-import-btn', panel)!.addEventListener('click', () => {
      const count = CURRENT_SCHEDULE.length;
      $('#fit-import-status', panel)!.textContent =
        `Imported ${count} block(s). On the real page this opens Fit My Schedule with your classes blocked out.`;
      tour.emit('fit-imported');
    });
  }

  document.body.append(toggleBtn, panel);
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    if (!panel.classList.contains('collapsed')) tour.emit('panel-opened');
  });
  $('.prof-panel-close', panel)!.addEventListener('click', () => panel.classList.add('collapsed'));
}

function openPanel(open: boolean): void {
  document.getElementById('professor-compare-panel')?.classList.toggle('collapsed', !open);
}

function selectPanelTab(tab: 'professors' | 'alerts'): void {
  const button = document.querySelector<HTMLButtonElement>(`.prof-sidebar-tab[data-tab="${tab}"]`);
  if (button && !button.classList.contains('active')) button.click();
}

let currentScene: PanelKind | null = null;

function showScene(kind: PanelKind): void {
  if (currentScene === kind) return;
  currentScene = kind;
  document.querySelectorAll<HTMLElement>('.mock-scene').forEach(scene => { scene.hidden = scene.id !== `scene-${kind}`; });
  document.querySelectorAll<HTMLElement>('.mock-nav-item').forEach(item =>
    // Course pages sit under the Build Schedule tab on the real site.
    item.classList.toggle('active', item.dataset.scene === (kind === 'sections' ? 'build' : kind)));
  mountPanel(kind);
}

// Links inside the practice page explain where they'd go instead of navigating away.
document.addEventListener('click', event => {
  const link = (event.target as HTMLElement).closest<HTMLElement>('[data-demo-link]');
  if (!link) return;
  event.preventDefault();
  showToast(`On the real page, this opens ${link.dataset.demoLink}.`);
});

let toastTimer: number | undefined;
function showToast(message: string): void {
  let toast = document.getElementById('tour-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tour-toast';
    toast.className = 'tour-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast!.classList.remove('visible'), 2600);
}

let notificationTimer: number | undefined;
function showMockNotification(): void {
  const note = document.getElementById('mock-notification');
  if (!note) return;
  window.clearTimeout(notificationTimer);
  note.hidden = false;
  requestAnimationFrame(() => note.classList.add('visible'));
  notificationTimer = window.setTimeout(() => {
    note.classList.remove('visible');
    window.setTimeout(() => { note.hidden = true; }, 300);
  }, 5000);
}

// ── Tour engine ────────────────────────────────────────────────────────

interface Step {
  scene: PanelKind;
  /** CSS selector of the element to spotlight; omit for a centered tip. */
  target?: string;
  title: string;
  body: string;
  /** Event the user must trigger to continue; Next is hidden until then. */
  waitFor?: string;
  /** True when the waited-for action already happened (e.g. after going Back). */
  alreadyDone?: () => boolean;
  hint?: string;
  /** Puts the panel in the state this step needs, so Back works too. */
  setup?: () => void;
  onEnter?: () => void;
}

const STEPS: Step[] = [
  {
    scene: 'sections', target: '#prof-toggle-btn',
    title: 'Meet the AggieSB+ button',
    body: 'Whenever you open a course on College Scheduler, this maroon tab appears on the right edge of the page. Give it a click.',
    waitFor: 'panel-opened', hint: 'Click the AggieSB+ button',
    setup: () => openPanel(false),
  },
  {
    scene: 'sections', target: '.prof-card',
    title: 'Every professor for this course',
    body: 'You get one card per instructor teaching the course this term, with their rating for this course and across all their courses.',
    setup: () => { openPanel(true); selectPanelTab('professors'); },
  },
  {
    scene: 'sections', target: '.prof-card .prof-summary',
    title: 'AI review summaries',
    body: 'Hundreds of reviews boiled down to teaching style, exams, workload and tips. Try "Expand full summary", or switch to the overall summary with the dropdown.',
    setup: () => { openPanel(true); selectPanelTab('professors'); },
  },
  {
    scene: 'sections', target: '.prof-card .prof-grades',
    title: 'Grade distributions',
    body: 'Historical grades from past semesters, so you know what you\'re signing up for. The buttons below open the full professor page and Rate My Professors.',
    setup: () => { openPanel(true); selectPanelTab('professors'); },
  },
  {
    scene: 'sections', target: '.prof-sidebar-tab[data-tab="alerts"]',
    title: 'Section full? Get an alert',
    body: 'Sections 501 and 503 have 0 seats. Open the Seat Alerts tab.',
    waitFor: 'tab-alerts', hint: 'Click Seat Alerts',
    setup: () => { openPanel(true); selectPanelTab('professors'); },
  },
  {
    scene: 'sections', target: '#demo-discovered',
    title: 'Watch a full section',
    body: 'AggieSB+ scans the page and lists the sections it finds. Click "+ Add Alert" on CSCE 221-501.',
    waitFor: 'alert-added', hint: 'Add an alert', alreadyDone: () => watched.length > 0,
    setup: () => { openPanel(true); selectPanelTab('alerts'); },
  },
  {
    scene: 'sections', target: '#mock-notification',
    title: 'We ping you when a seat opens',
    body: 'When someone drops, you get a notification like this one, even if College Scheduler isn\'t open. Manage your watched sections from this tab or your AggieSB+ account.',
    setup: () => { openPanel(true); selectPanelTab('alerts'); },
    onEnter: showMockNotification,
  },
  {
    scene: 'sections', target: '#demo-account',
    title: 'Sign in once',
    body: 'Seat alerts are tied to a free AggieSB+ account. The panel shows whether you\'re signed in, with a link to sign in if you\'re not. Ratings and summaries work without an account.',
    setup: () => { openPanel(true); selectPanelTab('alerts'); },
  },
  {
    scene: 'build', target: '#prof-toggle-btn',
    title: 'It follows you around',
    body: 'On Build Schedule and Shopping Cart, the same button opens Seat Alerts. Handy when a section in your cart shows 0 seats, like CSCE 221-501 here. Open it.',
    waitFor: 'panel-opened', hint: 'Click the AggieSB+ button',
    setup: () => openPanel(false),
  },
  {
    scene: 'build', target: '#professor-compare-panel',
    title: 'Alerts from anywhere',
    body: 'Your watched sections show up here too, along with the manual entry form when you know the CRN.',
    setup: () => openPanel(true),
  },
  {
    scene: 'current', target: '#prof-toggle-btn',
    title: 'Fit My Schedule',
    body: 'On your Current Schedule page the button changes again: it can import your classes and find courses that fit around them. Open it.',
    waitFor: 'panel-opened', hint: 'Click the AggieSB+ button',
    setup: () => openPanel(false),
  },
  {
    scene: 'current', target: '#fit-import-btn',
    title: 'Import your schedule',
    body: 'Click "Import current schedule". AggieSB+ reads your class times from the page and opens the course finder with those times blocked out.',
    waitFor: 'fit-imported', hint: 'Click Import',
    setup: () => openPanel(true),
  },
];

const tour = (() => {
  const tip = document.getElementById('tour-tip')!;
  const spotlight = document.getElementById('tour-spotlight')!;
  const nextBtn = document.getElementById('tour-next') as HTMLButtonElement;
  const backBtn = document.getElementById('tour-back') as HTMLButtonElement;
  const hint = document.getElementById('tour-tip-hint')!;
  const progress = document.getElementById('tour-progress-fill')!;
  let index = -1;
  let satisfied = false;
  let timer: number | undefined;

  function position(): void {
    const step = STEPS[index];
    const target = step?.target ? document.querySelector<HTMLElement>(step.target) : null;
    const rect = target && !target.hidden ? target.getBoundingClientRect() : null;
    const tipRect = tip.getBoundingClientRect();
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect || rect.width === 0) {
      spotlight.hidden = true;
      tip.style.left = `${(vw - tipRect.width) / 2}px`;
      tip.style.top = `${(vh - tipRect.height) / 2}px`;
    } else {
      spotlight.hidden = false;
      const pad = 6;
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom, vh);
      Object.assign(spotlight.style, {
        left: `${rect.left - pad}px`, top: `${top - pad}px`,
        width: `${rect.width + pad * 2}px`, height: `${Math.max(bottom - top, 0) + pad * 2}px`,
      });
      // Prefer the left side of the target (the panel lives on the right), then below, then above.
      let left = rect.left - tipRect.width - margin * 2;
      let topPos = top + (bottom - top) / 2 - tipRect.height / 2;
      if (left < margin) {
        left = Math.min(Math.max(rect.left + rect.width / 2 - tipRect.width / 2, margin), vw - tipRect.width - margin);
        topPos = bottom + margin * 2 + tipRect.height < vh ? bottom + margin * 2 : top - tipRect.height - margin * 2;
      }
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.min(Math.max(topPos, 56), vh - tipRect.height - margin)}px`;
    }
  }

  function render(): void {
    const step = STEPS[index];
    satisfied = !step.waitFor;
    showScene(step.scene);
    step.setup?.();
    satisfied = !step.waitFor || !!step.alreadyDone?.();
    document.getElementById('tour-tip-step')!.textContent = `Step ${index + 1} of ${STEPS.length}`;
    document.getElementById('tour-tip-title')!.textContent = step.title;
    document.getElementById('tour-tip-body')!.textContent = step.body;
    hint.textContent = satisfied ? '' : step.hint ?? '';
    nextBtn.hidden = !satisfied;
    nextBtn.textContent = index === STEPS.length - 1 ? 'Finish' : 'Next';
    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    progress.style.width = `${((index + 1) / STEPS.length) * 100}%`;
    tip.hidden = false;
    step.onEnter?.();
    // Wait for the panel to slide in, then bring targets below the fold (e.g. grades) into view.
    window.setTimeout(() => {
      if (STEPS[index] === step && step.target) {
        document.querySelector(step.target)?.scrollIntoView({ block: 'nearest' });
      }
    }, 350);
    position();
    // Targets move while the panel slides in or scrolls, so keep tracking them.
    window.clearInterval(timer);
    timer = window.setInterval(position, 50);
  }

  function go(to: number): void {
    if (to >= STEPS.length) { finish(); return; }
    index = Math.max(to, 0);
    render();
  }

  function stop(): void {
    window.clearInterval(timer);
    tip.hidden = true;
    spotlight.hidden = true;
    index = -1;
  }

  function finish(): void {
    stop();
    progress.style.width = '100%';
    markDone();
    showFinish();
  }

  nextBtn.addEventListener('click', () => go(index + 1));
  backBtn.addEventListener('click', () => go(index - 1));
  document.getElementById('tour-skip')!.addEventListener('click', finish);
  document.addEventListener('keydown', event => {
    if (index < 0) return;
    if (event.key === 'ArrowRight' && satisfied) go(index + 1);
    if (event.key === 'ArrowLeft' && index > 0) go(index - 1);
    if (event.key === 'Escape') finish();
  });

  return {
    start: () => go(0),
    active: () => index >= 0,
    /** Called by the mock panel when the user does something the current step may be waiting for. */
    emit(event: string): void {
      const step = STEPS[index];
      if (!step || step.waitFor !== event || satisfied) return;
      // Short pause so the user sees the result of their click before the tip moves on.
      satisfied = true;
      hint.textContent = 'Nice!';
      // The last step waits for Finish so its result stays readable.
      if (index === STEPS.length - 1) { nextBtn.hidden = false; return; }
      window.setTimeout(() => { if (STEPS[index] === step) go(index + 1); }, 700);
    },
  };
})();

// ── Welcome / finish dialogs ───────────────────────────────────────────

interface ModalAction {
  label: string;
  primary?: boolean;
  href?: string;
  onClick?: () => void;
}

function showModal(title: string, bodyHTML: string, actions: ModalAction[]): void {
  const modal = document.getElementById('tour-modal')!;
  document.getElementById('tour-modal-title')!.textContent = title;
  document.getElementById('tour-modal-body')!.innerHTML = bodyHTML;
  const actionsEl = document.getElementById('tour-modal-actions')!;
  actionsEl.innerHTML = '';
  actions.forEach(action => {
    const el = document.createElement(action.href ? 'a' : 'button');
    el.className = `tour-btn${action.primary ? '' : ' tour-btn-ghost'}`;
    el.textContent = action.label;
    if (el instanceof HTMLAnchorElement) {
      el.href = action.href!;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    } else {
      el.type = 'button';
    }
    el.addEventListener('click', () => {
      if (action.onClick) { modal.hidden = true; action.onClick(); }
    });
    actionsEl.appendChild(el);
  });
  modal.hidden = false;
  actionsEl.querySelector<HTMLElement>('.tour-btn:not(.tour-btn-ghost)')?.focus();
}

function showWelcome(): void {
  showScene('sections');
  showModal('Welcome to AggieSB+',
    `<p>AggieSB+ adds one button to College Scheduler that does a lot: professor ratings, AI review summaries,
     grade distributions, seat alerts, and schedule-fit search.</p>
     <p>Take a two-minute tour on a practice page. Nothing here touches your real registration.</p>`,
    [
      { label: 'Skip for now', onClick: showFinish },
      { label: 'Start the tour', primary: true, onClick: tour.start },
    ]);
}

function showFinish(): void {
  openPanel(false);
  showModal('You\'re all set',
    `<ol class="tour-checklist">
       <li><strong>Pin AggieSB+.</strong> Click the puzzle-piece icon in your toolbar, then the pin next to AggieSB+, so settings and help are one click away.</li>
       <li><strong>Create a free account</strong> to turn on seat alerts, and allow notifications when asked.</li>
       <li><strong>Open College Scheduler.</strong> The AggieSB+ button appears on course, Build Schedule, Cart and Current Schedule pages.</li>
     </ol>
     <p class="tour-muted">You can replay this tour any time from the extension's Help tab.</p>`,
    [
      { label: 'Replay tour', onClick: () => { watched.length = 0; currentScene = null; tour.start(); } },
      { label: 'Create account', href: LOGIN_URL },
      { label: 'Open College Scheduler', primary: true, href: SCHEDULER_URL },
    ]);
}

// ── Extension integration (no-ops when previewed outside the extension) ──

const hasStorage = typeof chrome !== 'undefined' && !!chrome.storage?.sync;
let darkTheme = false;

function markDone(): void {
  if (hasStorage) void chrome.storage.sync.set({ [TOUR_DONE_KEY]: true });
}

async function init(): Promise<void> {
  if (hasStorage) {
    try {
      const { theme } = await chrome.storage.sync.get({ theme: 'light' });
      darkTheme = theme === 'dark';
    } catch { /* default to light */ }
  }
  // The tour picks the page while it runs; afterwards the nav lets users explore freely.
  document.querySelectorAll<HTMLElement>('.mock-nav-item').forEach(item => item.addEventListener('click', () => {
    if (tour.active()) { showToast('Finish or skip the tour to explore the other pages.'); return; }
    showScene(item.dataset.scene as PanelKind);
  }));
  renderSectionsTable();
  renderCurrentSchedule('#mock-current-body', 'swatch');
  renderBuildSchedule();
  document.querySelector('.cs-course-row')?.addEventListener('click', event => {
    event.preventDefault();
    if (tour.active()) { showToast('Finish or skip the tour to explore the other pages.'); return; }
    showScene('sections');
  });
  showWelcome();
}

void init();
