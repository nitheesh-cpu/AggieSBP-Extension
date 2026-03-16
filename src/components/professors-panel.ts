import { getProfessorDetailsUrl, fetchCourseDataForTerm, getTermCodeFromDescription, fetchCourseData, fetchProfessorDetails, type ProfessorDetails, type CourseSummary, type OverallSummary } from '../services/professor-service';
import { getSelectedCourseData } from '../services/api';
import { renderAlertsTab } from './alerts-panel';
import { extractCourseIdFromUrl, extractTermFromUrl, isRegistrationPage } from '../utils/page-detector';
import { debugLog, errorLog } from '../utils/debug';
import { COURSE_DETAILS_BASE } from '../config/constants';

// Track selected professors for comparison
const selectedProfessors = new Map<string, { name: string; rating: number | null }>();

// Track current course ID
let currentPanelCourseId: string | null = null;

// SVG Icons
const ICONS = {
  users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`,
  graduation: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
  noData: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>`,
};

/**
 * Load the professor panel CSS
 */
function loadProfessorPanelStyles(): void {
  const existingStyle = document.getElementById('professor-panel-styles');
  if (existingStyle) return;

  const link = document.createElement('link');
  link.id = 'professor-panel-styles';
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('css/professor-panel.css');
  document.head.appendChild(link);
}

/**
 * Load theme preference and apply to panel
 */
async function loadAndApplyTheme(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get({ theme: 'light' });
    applyTheme(result.theme);
  } catch (e) {
    debugLog('Could not load theme preference:', e);
  }
}

/**
 * Apply theme to the professor panel
 */
function applyTheme(theme: string): void {
  const panel = document.getElementById('professor-compare-panel');
  if (panel) {
    panel.classList.toggle('dark-theme', theme === 'dark');
    debugLog('Applied theme to panel:', theme);
  }
}

/**
 * Listen for theme change messages from popup
 */
function setupThemeListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'themeChanged') {
      applyTheme(message.theme);
      sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
  });
}

/**
 * Format a course-specific summary into readable text
 */
function formatCourseSummary(summary: CourseSummary): string {
  const parts = [];
  if (summary.teaching) parts.push(summary.teaching);
  if (summary.exams) parts.push(summary.exams);
  if (summary.grading) parts.push(summary.grading);
  if (summary.workload) parts.push(summary.workload);
  if (summary.personality) parts.push(summary.personality);
  if (summary.policies) parts.push(summary.policies);
  if (summary.other) parts.push(summary.other);
  return parts.length > 0 ? parts.join(' ') : '';
}

/**
 * Format an overall summary into readable text
 */
function formatOverallSummary(summary: OverallSummary): string {
  const parts = [];

  if (summary.sentiment) {
    parts.push(`Overall sentiment: ${summary.sentiment}.`);
  }

  if (summary.strengths && summary.strengths.length > 0) {
    parts.push(`Strengths: ${summary.strengths.join(', ')}.`);
  }

  if (summary.complaints && summary.complaints.length > 0) {
    parts.push(`Common complaints: ${summary.complaints.join(', ')}.`);
  }

  if (summary.consistency) {
    parts.push(summary.consistency);
  }

  return parts.length > 0 ? parts.join(' ') : '';
}

/**
 * Create a professor card HTML with summary dropdown
 */
function createProfessorCard(professor: ProfessorDetails, currentCourseCode?: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'prof-card';
  card.dataset.professorId = professor.id;

  // Calculate grade distribution percentages
  let gradeDistHTML = '';
  let gradeLegendHTML = '';
  if (professor.grades?.distribution) {
    const grades = professor.grades.distribution;
    const total = Object.values(grades).reduce((sum: number, count: unknown) =>
      sum + (typeof count === 'number' ? count : 0), 0) as number;

    if (total > 0) {
      const gradeColors: Record<string, string> = { A: 'a', B: 'b', C: 'c', D: 'd', F: 'f' };
      const segments = Object.entries(grades)
        .filter(([grade]) => ['A', 'B', 'C', 'D', 'F'].includes(grade))
        .map(([grade, count]) => {
          const percentage = Math.round(((count as number) / total) * 100);
          return { grade, percentage };
        })
        .filter(({ percentage }) => percentage > 0);

      gradeDistHTML = segments.map(({ grade, percentage }) =>
        `<div class="prof-grade-segment prof-grade-${gradeColors[grade]}" style="width: ${percentage}%">${percentage > 5 ? percentage + '%' : ''}</div>`
      ).join('');

      gradeLegendHTML = segments.map(({ grade, percentage }) =>
        `<span>${grade}: ${percentage}%</span>`
      ).join('');
    }
  }

  // Get review count - use totalReviews from API
  const reviewCount = professor.totalReviews || 0;

  // Build summary options for dropdown
  interface SummaryOption {
    value: string;
    label: string;
    content: string;
    reviewCount: number;
  }

  const summaryOptions: SummaryOption[] = [];

  // Track which course codes we've already added (to avoid duplicates)
  const addedCourseCodes = new Set<string>();

  // First, try to add the current course summary
  let currentCourseSummaryAdded = false;

  // Check if courseSummary is provided
  if (professor.courseSummary) {
    const content = formatCourseSummary(professor.courseSummary);
    if (content) {
      const code = professor.courseSummary.courseCode || currentCourseCode || '';
      summaryOptions.push({
        value: 'course',
        label: `This Course (${code || 'Current'})`,
        content,
        reviewCount: professor.courseSummary.reviewCount || 0,
      });
      if (code) addedCourseCodes.add(code.toUpperCase());
      currentCourseSummaryAdded = true;
    }
  }

  // If no courseSummary, look for current course in otherCourseSummaries
  if (!currentCourseSummaryAdded && currentCourseCode && professor.otherCourseSummaries) {
    const normalizedCurrentCode = currentCourseCode.toUpperCase().replace(/\s+/g, '');
    const currentCourseFromOthers = professor.otherCourseSummaries.find(cs => {
      const code = (cs.courseCode || '').toUpperCase().replace(/\s+/g, '');
      return code === normalizedCurrentCode;
    });

    if (currentCourseFromOthers) {
      const content = formatCourseSummary(currentCourseFromOthers);
      if (content) {
        summaryOptions.push({
          value: 'course',
          label: `This Course (${currentCourseFromOthers.courseCode || currentCourseCode})`,
          content,
          reviewCount: currentCourseFromOthers.reviewCount || 0,
        });
        addedCourseCodes.add(normalizedCurrentCode);
        currentCourseSummaryAdded = true;
      }
    }
  }

  // Add overall summary
  if (professor.overallSummary) {
    const content = formatOverallSummary(professor.overallSummary);
    if (content) {
      summaryOptions.push({
        value: 'overall',
        label: 'Overall (All Courses)',
        content,
        reviewCount: professor.overallSummary.reviewCount || reviewCount,
      });
    }
  }

  // Add other course summaries (excluding ones we've already added)
  if (professor.otherCourseSummaries && professor.otherCourseSummaries.length > 0) {
    professor.otherCourseSummaries.forEach((cs, index) => {
      const code = (cs.courseCode || '').toUpperCase().replace(/\s+/g, '');
      // Skip if we already added this course
      if (code && addedCourseCodes.has(code)) {
        return;
      }

      const content = formatCourseSummary(cs);
      if (content) {
        summaryOptions.push({
          value: `other-${index}`,
          label: cs.courseCode || `Other Course ${index + 1}`,
          content,
          reviewCount: cs.reviewCount || 0,
        });
        if (code) addedCourseCodes.add(code);
      }
    });
  }

  // Determine initial summary content
  let initialSummaryContent = '';
  let initialReviewCount = reviewCount;
  let hasSummary = false;

  if (summaryOptions.length > 0) {
    initialSummaryContent = summaryOptions[0].content;
    initialReviewCount = summaryOptions[0].reviewCount;
    hasSummary = true;
  }

  // Set appropriate message if no summary available
  if (!hasSummary) {
    if (reviewCount > 0) {
      initialSummaryContent = 'Not enough reviews for an AI summary yet.';
    } else {
      initialSummaryContent = 'No reviews available for this professor.';
    }
  }

  // Check if selected
  const isSelected = selectedProfessors.has(professor.id);

  // Build dropdown HTML if multiple options available
  const hasDropdown = summaryOptions.length > 1;
  const dropdownHTML = hasDropdown ? `
    <select class="prof-summary-select" data-professor-id="${professor.id}">
      ${summaryOptions.map((opt, i) =>
    `<option value="${opt.value}" data-content="${encodeURIComponent(opt.content)}" data-review-count="${opt.reviewCount}"${i === 0 ? ' selected' : ''}>${opt.label}</option>`
  ).join('')}
    </select>
  ` : '';

  card.innerHTML = `
    <div class="prof-card-header">
      <h3 class="prof-name">${professor.name}</h3>
      <div class="prof-rating-badge">
        ${ICONS.star}
        <span>${professor.rating ? professor.rating.toFixed(1) : 'N/A'}</span>
      </div>
    </div>
    
    <div class="prof-summary">
      <div class="prof-summary-header">
        ${ICONS.graduation}
        <span class="prof-summary-label">AI Summary based on <span class="prof-review-count">${initialReviewCount}</span> reviews</span>
        ${dropdownHTML}
      </div>
      <div class="prof-summary-content">
        <div class="prof-summary-item">
          ${ICONS.briefcase}
          <p class="prof-summary-text">${initialSummaryContent}</p>
        </div>
      </div>
    </div>

    ${gradeDistHTML ? `
    <div class="prof-grades">
      <div class="prof-grades-bar">${gradeDistHTML}</div>
      <div class="prof-grades-legend">${gradeLegendHTML}</div>
    </div>
    ` : ''}

    <div class="prof-card-actions">
      <a href="${getProfessorDetailsUrl(professor.id)}" target="_blank" class="prof-btn prof-btn-primary">
        ${ICONS.graduation}
        Professor
      </a>
      <button class="prof-btn prof-btn-compare ${isSelected ? 'selected' : ''}" data-professor-id="${professor.id}" data-professor-name="${professor.name}" data-professor-rating="${professor.rating || ''}">
        ${isSelected ? ICONS.check : ICONS.plus}
        ${isSelected ? 'Added' : 'Compare'}
      </button>
    </div>
  `;

  // Add dropdown change event listener
  if (hasDropdown) {
    const select = card.querySelector('.prof-summary-select') as HTMLSelectElement;
    select?.addEventListener('change', () => {
      const selectedOption = select.options[select.selectedIndex];
      const content = decodeURIComponent(selectedOption.dataset.content || '');
      const revCount = selectedOption.dataset.reviewCount || '0';

      const summaryText = card.querySelector('.prof-summary-text');
      const reviewCountSpan = card.querySelector('.prof-review-count');

      if (summaryText) summaryText.textContent = content;
      if (reviewCountSpan) reviewCountSpan.textContent = revCount;
    });
  }

  // Add compare button event listener
  const compareBtn = card.querySelector('.prof-btn-compare') as HTMLButtonElement;
  compareBtn?.addEventListener('click', () => {
    toggleProfessorSelection(professor.id, professor.name, professor.rating || null);
    updateCompareButtonState(card, professor.id);
    updateCompareBar();
  });

  return card;
}

/**
 * Toggle professor selection for comparison
 */
function toggleProfessorSelection(id: string, name: string, rating: number | null): void {
  if (selectedProfessors.has(id)) {
    selectedProfessors.delete(id);
  } else {
    selectedProfessors.set(id, { name, rating });
  }
}

/**
 * Update compare button state
 */
function updateCompareButtonState(card: HTMLElement, professorId: string): void {
  const btn = card.querySelector('.prof-btn-compare') as HTMLButtonElement;
  if (!btn) return;

  const isSelected = selectedProfessors.has(professorId);
  btn.classList.toggle('selected', isSelected);
  btn.innerHTML = `${isSelected ? ICONS.check : ICONS.plus} ${isSelected ? 'Added' : 'Compare'}`;
}

/**
 * Create and update the comparison bar
 */
function updateCompareBar(): void {
  let bar = document.getElementById('prof-compare-bar');

  if (selectedProfessors.size === 0) {
    bar?.classList.remove('visible');
    return;
  }

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'prof-compare-bar';
    bar.className = 'prof-compare-bar';
    document.body.appendChild(bar);
  }

  const avatarsHTML = Array.from(selectedProfessors.entries())
    .slice(0, 5)
    .map(([_id, { name, rating }]) => {
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
      return `<div class="prof-compare-avatar" title="${name}${rating ? ` (${rating.toFixed(1)})` : ''}">${initials}</div>`;
    })
    .join('');

  bar.innerHTML = `
    <div class="prof-compare-info">
      ${ICONS.users}
      <span>Comparing ${selectedProfessors.size} Professor${selectedProfessors.size > 1 ? 's' : ''}</span>
    </div>
    <div class="prof-compare-avatars">${avatarsHTML}</div>
    <div class="prof-compare-actions">
      <button class="prof-btn-clear">Clear All</button>
      <button class="prof-btn-compare-now">Compare Now</button>
    </div>
  `;

  // Add event listeners
  bar.querySelector('.prof-btn-clear')?.addEventListener('click', () => {
    selectedProfessors.clear();
    document.querySelectorAll('.prof-btn-compare.selected').forEach(btn => {
      btn.classList.remove('selected');
      btn.innerHTML = `${ICONS.plus} Compare`;
    });
    updateCompareBar();
  });

  bar.querySelector('.prof-btn-compare-now')?.addEventListener('click', () => {
    const professorIds = Array.from(selectedProfessors.keys());
    const compareUrl = `${COURSE_DETAILS_BASE}/compare?professors=${professorIds.join(',')}`;
    window.open(compareUrl, '_blank');
  });

  bar.classList.add('visible');
}

/**
 * Create the floating professor panel
 */
function createProfessorPanel(courseData: { professors?: ProfessorDetails[] }, courseCode?: string): void {
  // Remove existing panel
  const existingPanel = document.getElementById('professor-compare-panel');
  const existingToggle = document.getElementById('prof-toggle-btn');
  if (existingPanel) existingPanel.remove();
  if (existingToggle) existingToggle.remove();

  // Load styles
  loadProfessorPanelStyles();

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'prof-toggle-btn';
  toggleBtn.className = 'prof-toggle-btn';
  toggleBtn.innerHTML = `${ICONS.users} AggieSB+`;

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'professor-compare-panel';
  panel.className = 'professor-compare-panel collapsed';

  // Panel header
  const header = document.createElement('div');
  header.className = 'prof-panel-header';
  header.innerHTML = `
    <h2 class="prof-panel-title">
      ${ICONS.users}
      <span>Course Professors</span>
    </h2>
    <button class="prof-panel-close">${ICONS.close}</button>
  `;

  // Tabs container
  const tabsHeader = document.createElement('div');
  tabsHeader.className = 'prof-sidebar-tabs';
  tabsHeader.innerHTML = `
    <button class="prof-sidebar-tab active" data-tab="professors">Professors</button>
    <button class="prof-sidebar-tab" data-tab="alerts">Seat Alerts</button>
  `;

  const tabsContent = document.createElement('div');
  tabsContent.className = 'prof-sidebar-tabs-content';

  const professorsContent = document.createElement('div');
  professorsContent.id = 'prof-sidebar-tab-professors';
  professorsContent.className = 'prof-sidebar-tab-pane active';

  const alertsContent = document.createElement('div');
  alertsContent.id = 'prof-sidebar-tab-alerts';
  alertsContent.className = 'prof-sidebar-tab-pane';

  // Panel content for professors
  const listContainer = document.createElement('div');
  listContainer.className = 'prof-list-container';

  if (!courseData.professors || courseData.professors.length === 0) {
    listContainer.innerHTML = `
      <div class="prof-no-data">
        ${ICONS.noData}
        <p>No professor information available for this course.</p>
      </div>
    `;
  } else {
    courseData.professors.forEach((professor: ProfessorDetails) => {
      listContainer.appendChild(createProfessorCard(professor, courseCode));
    });
  }

  professorsContent.appendChild(listContainer);
  tabsContent.appendChild(professorsContent);
  tabsContent.appendChild(alertsContent);

  panel.appendChild(header);
  panel.appendChild(tabsHeader);
  panel.appendChild(tabsContent);

  // Add to DOM
  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  // Wire up tab switching
  tabsHeader.querySelectorAll<HTMLButtonElement>('.prof-sidebar-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (!target) return;
      tabsHeader.querySelectorAll('.prof-sidebar-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      tabsContent.querySelectorAll('.prof-sidebar-tab-pane').forEach((pane) => {
        pane.classList.toggle('active', pane.id === `prof-sidebar-tab-${target}`);
      });
    });
  });

  // Render alerts tab content
  void renderAlertsTab(alertsContent);

  // Apply saved theme
  loadAndApplyTheme();

  // Setup theme change listener
  setupThemeListener();

  // Event listeners
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });

  header.querySelector('.prof-panel-close')?.addEventListener('click', () => {
    panel.classList.add('collapsed');
  });

  debugLog('Professor comparison panel created with', courseData.professors?.length || 0, 'professors');
}

/**
 * Initialize professor panel
 */
export async function initializeProfessorPanel(): Promise<void> {
  // Only run on sections pages
  if (!isRegistrationPage()) {
    debugLog('Not on a sections page, skipping professor panel');
    return;
  }

  // Extract course ID from URL
  const courseId = extractCourseIdFromUrl();
  if (!courseId) {
    debugLog('Could not extract course ID from URL');
    return;
  }

  // Check if panel already exists for this course
  if (currentPanelCourseId === courseId) {
    const existingPanel = document.getElementById('professor-compare-panel');
    if (existingPanel) {
      debugLog('Professor panel already exists for this course');
      return;
    }
  }

  currentPanelCourseId = courseId;

  // Get course data from API
  let apiCourseId: string | null = null;

  try {
    const courseData = await getSelectedCourseData(courseId);

    if (courseData && courseData.subjectLong && courseData.number) {
      const subjectMatch = courseData.subjectLong.match(/- ([A-Z]+)$/);
      const subject = subjectMatch ? subjectMatch[1] : courseData.subjectId;
      apiCourseId = `${subject}${courseData.number}`;
      debugLog('Extracted course ID:', apiCourseId);
    }
  } catch (error) {
    debugLog('Could not fetch course data from API:', error);

    // Fallback: Try to extract from page DOM
    const pageTitle = document.querySelector('h1, h2, .course-title');
    if (pageTitle) {
      const titleText = pageTitle.textContent || '';
      const courseMatch = titleText.match(/([A-Z]+)\s*(\d+)/);
      if (courseMatch) {
        apiCourseId = `${courseMatch[1]}${courseMatch[2]}`;
      }
    }
  }

  if (!apiCourseId) {
    debugLog('Could not determine course ID for professor panel');
    return;
  }

  // Get the term code from the URL to filter professors by semester
  const termDesc = extractTermFromUrl();
  let termCode: string | null = null;

  if (termDesc) {
    termCode = await getTermCodeFromDescription(termDesc);
    debugLog('Term code for current page:', termCode);
  }

  // Fetch professor data filtered by semester and create panel
  try {
    // First try the new detailed API with all summaries
    if (termCode) {
      const detailedProfessors = await fetchProfessorDetails(termCode, apiCourseId);

      if (detailedProfessors && detailedProfessors.length > 0) {
        debugLog('Using detailed professor data with summaries for:', apiCourseId);
        createProfessorPanel({ professors: detailedProfessors }, apiCourseId);
        debugLog('Professor panel initialized for:', apiCourseId);
        return;
      }
    }

    // Fallback to the old API if detailed API returns nothing
    let courseApiData;

    if (termCode) {
      // Fetch only professors teaching this semester
      courseApiData = await fetchCourseDataForTerm(apiCourseId, termCode);
      debugLog('Fetched term-specific course data for:', apiCourseId, 'term:', termCode);
    } else {
      // Fallback to all professors if term code not available
      courseApiData = await fetchCourseData(apiCourseId);
      debugLog('Fetched all course data (no term filter) for:', apiCourseId);
    }

    if (courseApiData) {
      createProfessorPanel(courseApiData, apiCourseId);
      debugLog('Professor panel initialized for:', apiCourseId);
    } else {
      debugLog('No course API data found for:', apiCourseId);
    }
  } catch (error) {
    errorLog('Error fetching course data:', error);
  }
}

/**
 * Initialize a button + panel that shows ONLY the Seat Alerts tab.
 * Used on /options and /cart pages where professor data isn't relevant.
 */
export function initializeAlertsOnlyPanel(): void {
  // Remove any existing panel/button to avoid duplication
  document.getElementById('professor-compare-panel')?.remove();
  document.getElementById('prof-toggle-btn')?.remove();

  loadProfessorPanelStyles();

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'prof-toggle-btn';
  toggleBtn.className = 'prof-toggle-btn';
  toggleBtn.innerHTML = `${ICONS.users} AggieSB+`;

  // Panel
  const panel = document.createElement('div');
  panel.id = 'professor-compare-panel';
  panel.className = 'professor-compare-panel collapsed';

  // Header
  const header = document.createElement('div');
  header.className = 'prof-panel-header';
  header.innerHTML = `
    <h2 class="prof-panel-title">
      ${ICONS.users}
      <span>Seat Alerts</span>
    </h2>
    <button class="prof-panel-close">${ICONS.close}</button>
  `;

  // Single content pane (alerts only — no tabs)
  const alertsContent = document.createElement('div');
  alertsContent.id = 'prof-sidebar-tab-alerts';
  alertsContent.className = 'prof-sidebar-tab-pane active';

  panel.appendChild(header);
  panel.appendChild(alertsContent);

  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  // Wire up toggle
  toggleBtn.addEventListener('click', () => panel.classList.toggle('collapsed'));
  header.querySelector('.prof-panel-close')?.addEventListener('click', () =>
    panel.classList.add('collapsed')
  );

  // Render seat alerts — skip the isRegistrationPage() guard since we're on /options or /cart
  void renderAlertsTab(alertsContent, true);

  loadAndApplyTheme();
  setupThemeListener();

  debugLog('Alerts-only panel initialized (options/cart page)');
}
