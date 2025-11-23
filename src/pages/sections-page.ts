import { showLoadingScreen, hideLoadingScreen } from '../components/loading-screen';
import { createSectionTableRow } from '../components/section-table-row';
import { createFloatingProfessorsPanel, createProfessorsSection } from '../components/professors-panel';
import { addFilterControls } from '../components/filter-controls';
import { getSelectedCourseData } from '../services/api';
import { getSections } from '../services/api';
import { extractAndSortSections } from '../services/course-service';
import { fetchCourseData } from '../services/professor-service';
import { getCourseDetailsUrl } from '../services/professor-service';
import { CacheUtils } from '../services/cache';
import { store } from '../state/store';
import { findTableContainer } from '../utils/dom';
import { extractCourseIdFromUrl } from '../utils/page-detector';
import { debugLog, errorLog } from '../utils/debug';
import { setupCardEventHandlers, setupTabEventHandlers } from '../handlers/card-handlers';
import { redistributeSections } from '../handlers/filter-handlers';
import { addSaveAndCloseButton } from '../components/save-button';
import { applySettings } from '../utils/settings';

/**
 * Set up observer for sections page
 */
let sectionsObserver: MutationObserver | null = null;
let isBeautifyingSections = false; // Flag to prevent double beautification

export async function setupObserver(): Promise<void> {
  // Prevent double initialization
  if (isBeautifyingSections) {
    debugLog('Sections beautification already in progress, skipping...');
    return;
  }

  // Disconnect existing observer if any
  if (sectionsObserver) {
    sectionsObserver.disconnect();
    sectionsObserver = null;
  }

  const targetNode = document.querySelector('#enabled_panel');

  if (targetNode) {
    // Check if already beautified
    if (document.querySelector('#beautified-registration-container')) {
      debugLog('Sections already beautified, skipping...');
      return;
    }
    isBeautifyingSections = true;
    showLoadingScreen();
    await enableBeautifier();
    isBeautifyingSections = false;
  } else {
    sectionsObserver = new MutationObserver((_mutations) => {
      const targetNode = document.querySelector('#enabled_panel');
      if (targetNode && !isBeautifyingSections) {
        // Check if already beautified
        if (document.querySelector('#beautified-registration-container')) {
          return;
        }
        isBeautifyingSections = true;
        showLoadingScreen();
        enableBeautifier().finally(() => {
          isBeautifyingSections = false;
        });
        // Don't disconnect - keep observing for navigation changes
      }
    });

    sectionsObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Enable beautifier for sections page
 */
export async function enableBeautifier(): Promise<void> {
  if (!store.get('originalContent')) {
    store.set('originalContent', document.body.cloneNode(true));
  }

  // Get course ID from URL
  const courseId = extractCourseIdFromUrl();
  if (!courseId) {
    errorLog('Could not extract course ID from URL');
    hideLoadingScreen();
    return;
  }

  const courseKey = `course_${courseId}`;
  const sectionsKey = `sections_${courseId}`;

  // Fast path: Check localStorage first for immediate rendering
  const fastCourse = CacheUtils.getCachedDataSync(courseKey);
  const fastSections = CacheUtils.getCachedDataSync(sectionsKey);

  if (fastCourse && fastSections) {
    debugLog('Using fast localStorage cache - immediate render');
    await createSectionCards(fastCourse, fastSections);
    applySettings();
    hideLoadingScreen();
    return;
  }

  let course = fastCourse;
  let formattedData = fastSections;

  // Otherwise, fetch what we need
  if (!course) {
    try {
      course = await getSelectedCourseData(courseId);
      if (course) {
        // Cache asynchronously (non-blocking)
        CacheUtils.store(courseKey, course).catch((error: unknown) => {
          errorLog('Error caching course data:', error);
        });
        debugLog('Fetched course data:', course);
      } else {
        errorLog('Failed to fetch course data');
        hideLoadingScreen();
        return;
      }
    } catch (error) {
      errorLog('Error fetching course data:', error);
      hideLoadingScreen();
      return;
    }
  } else {
    debugLog('Using cached course data');
  }

  if (!formattedData) {
    try {
      const sections = await getSections(course.subjectId, course.number);
      if (sections) {
        formattedData = extractAndSortSections(sections);
        // Cache asynchronously (non-blocking)
        CacheUtils.store(sectionsKey, formattedData).catch((error: unknown) => {
          errorLog('Error caching sections data:', error);
        });
        debugLog('Fetched and processed sections data');
      } else {
        errorLog('Failed to fetch sections data');
        hideLoadingScreen();
        return;
      }
    } catch (error) {
      errorLog('Error fetching sections data:', error);
      hideLoadingScreen();
      return;
    }
  } else {
    debugLog('Using cached sections data');
  }

  await createSectionCards(course, formattedData);
  applySettings();
  hideLoadingScreen();
}

/**
 * Disable beautifier and restore original content
 */
export function disableBeautifier(): void {
  const originalContent = store.get('originalContent');
  if (originalContent) {
    document.body.innerHTML = (originalContent as HTMLElement).innerHTML;
  }
}

/**
 * Create section cards for the page
 * @param {Object} course - Course data
 * @param {Array} sections - Sections data
 */
async function createSectionCards(course: any, sections: any[]): Promise<void> {
  // Store course data and sections globally for filter functions
  store.set('currentCourse', course);
  store.set('currentFilterRules', course.filterRules || []);
  store.set('allSectionsData', sections.slice());

  // Initialize selectedCRNs with currently selected sections
  const selectedCRNs = new Set<string>();
  sections.forEach((section: any) => {
    if (section.isSelected) {
      selectedCRNs.add(section.crn);
    }
  });
  store.set('selectedCRNs', selectedCRNs);
  debugLog('Initial selected CRNs:', Array.from(selectedCRNs));

  // Create a container for our beautified content
  const beautifiedContainer = document.createElement('div');
  beautifiedContainer.id = 'beautified-registration-container';
  beautifiedContainer.className = 'course-cards-container';

  const courseName = document.createElement('h1');
  courseName.textContent = course.subjectLong + ' ' + course.number;
  const courseNameContainer = document.createElement('div');
  courseNameContainer.className = 'course-name-container';
  courseNameContainer.appendChild(courseName);

  // Add a title to the container with course details button
  const titleContainer = document.createElement('div');
  titleContainer.className = 'course-title-header-container';

  const title = document.createElement('h2');
  title.textContent = course.title;
  title.className = 'course-list-title';

  // Create course ID for course details button
  const courseId = `${course.subjectLong.split(' - ')[0]}${course.number}`;
  const courseDetailsUrl = getCourseDetailsUrl(courseId);

  const courseDetailsBtn = document.createElement('a');
  courseDetailsBtn.href = courseDetailsUrl;
  courseDetailsBtn.target = '_blank';
  courseDetailsBtn.className = 'course-details-btn-header';
  courseDetailsBtn.title = 'View Course Details';
  courseDetailsBtn.innerHTML = '📚 View Course Details';

  titleContainer.appendChild(title);
  titleContainer.appendChild(courseDetailsBtn);

  // Initially, separate sections into enabled and disabled based on isEnabled property
  const enabledSections = sections.filter((section: any) => section.isEnabled);
  const disabledSections = sections.filter((section: any) => !section.isEnabled);

  // Create tab navigation
  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';

  const tabNav = document.createElement('div');
  tabNav.className = 'tab-nav';

  const enabledTab = document.createElement('button');
  enabledTab.className = 'tab-button active';
  enabledTab.id = 'enabled-tab';
  enabledTab.textContent = `Available Sections (${enabledSections.length})`;
  enabledTab.dataset.tab = 'enabled';

  const disabledTab = document.createElement('button');
  disabledTab.className = 'tab-button';
  disabledTab.id = 'disabled-tab';
  disabledTab.textContent = `Unavailable Sections (${disabledSections.length})`;
  disabledTab.dataset.tab = 'disabled';

  tabNav.appendChild(enabledTab);
  tabNav.appendChild(disabledTab);
  tabContainer.appendChild(tabNav);

  // Create content containers for each tab
  const enabledContent = document.createElement('div');
  enabledContent.className = 'tab-content active';
  enabledContent.id = 'enabled-sections';

  const disabledContent = document.createElement('div');
  disabledContent.className = 'tab-content';
  disabledContent.id = 'disabled-sections';

  // Create table structure for enabled sections
  if (enabledSections.length > 0) {
    const enabledTableContainer = document.createElement('div');
    enabledTableContainer.className = 'beautified-sections-table-container';
    const enabledTable = document.createElement('table');
    enabledTable.className = 'sections-table-wrapper';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th></th>
        <th>Section</th>
        <th>Title</th>
        <th>Instructor</th>
        <th>Meeting Times</th>
        <th>Status</th>
        <th>Info</th>
      </tr>
    `;
    enabledTable.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    for (let index = 0; index < enabledSections.length; index++) {
      const section = enabledSections[index];
      const tableRow = await createSectionTableRow(section, index);
      tbody.appendChild(tableRow);
    }
    enabledTable.appendChild(tbody);
    enabledTableContainer.appendChild(enabledTable);
    enabledContent.appendChild(enabledTableContainer);
  } else {
    const noSectionsMsg = document.createElement('div');
    noSectionsMsg.className = 'no-sections-message';
    noSectionsMsg.textContent = 'No available sections found.';
    enabledContent.appendChild(noSectionsMsg);
  }

  // Create table structure for disabled sections
  if (disabledSections.length > 0) {
    const disabledTableContainer = document.createElement('div');
    disabledTableContainer.className = 'beautified-sections-table-container';
    const disabledTable = document.createElement('table');
    disabledTable.className = 'sections-table-wrapper';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th></th>
        <th>Section</th>
        <th>Title</th>
        <th>Instructor</th>
        <th>Meeting Times</th>
        <th>Status</th>
        <th>Info</th>
      </tr>
    `;
    disabledTable.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    for (let index = 0; index < disabledSections.length; index++) {
      const section = disabledSections[index];
      const tableRow = await createSectionTableRow(section, index);
      tableRow.classList.add('disabled-section');
      tbody.appendChild(tableRow);
    }
    disabledTable.appendChild(tbody);
    disabledTableContainer.appendChild(disabledTable);
    disabledContent.appendChild(disabledTableContainer);
  } else {
    const noSectionsMsg = document.createElement('div');
    noSectionsMsg.className = 'no-sections-message';
    noSectionsMsg.textContent = 'No unavailable sections.';
    disabledContent.appendChild(noSectionsMsg);
  }

  tabContainer.appendChild(enabledContent);
  tabContainer.appendChild(disabledContent);

  // Create main content area for sections
  const sectionsContainer = document.createElement('div');
  sectionsContainer.className = 'sections-container';
  sectionsContainer.appendChild(tabContainer);

  // Fetch course data and create professors section
  const apiCourseId = `${course.subjectLong.split(' - ')[0]}${course.number}`;
  let professorsSection = null;

  try {
    const courseApiData = await fetchCourseData(apiCourseId);
    if (courseApiData) {
      professorsSection = createProfessorsSection(courseApiData);
      debugLog('Created professors section for course:', apiCourseId);
    } else {
      debugLog('No course API data found for:', apiCourseId);
    }
  } catch (error) {
    errorLog('Error fetching course data for professors section:', error);
  }

  // Add sections to the main container
  beautifiedContainer.appendChild(sectionsContainer);

  // Create floating professors panel if we have professor data
  if (professorsSection) {
    createFloatingProfessorsPanel(professorsSection);
  }

  // Find the table container and replace it
  const tableContainer = findTableContainer(document.querySelector('tbody') as HTMLElement);
  if (tableContainer) {
    tableContainer.innerHTML = '';
    tableContainer.appendChild(beautifiedContainer);
  } else {
    // Fallback: replace the first section's parent
    const tbody = document.querySelector('tbody');
    if (tbody && tbody.parentElement) {
      tbody.parentElement.innerHTML = '';
      tbody.parentElement.appendChild(beautifiedContainer);
    } else {
      // Last resort: append to body
      document.body.appendChild(beautifiedContainer);
    }
  }

  // Hide the original #enabled_panel and all its contents to prevent old text from showing
  const enabledPanel = document.querySelector('#enabled_panel');
  if (enabledPanel) {
    (enabledPanel as HTMLElement).style.display = 'none';
  }

  // Hide the parent container that holds the original table
  const originalTableContainer = findTableContainer(document.querySelector('tbody') as HTMLElement);
  if (originalTableContainer && originalTableContainer !== beautifiedContainer.parentElement) {
    // Find the parent that might contain old content
    let parent = originalTableContainer.parentElement;
    while (parent && parent !== document.body) {
      // Check if this parent contains the original table structure
      const originalTable = parent.querySelector('table:not(#beautified-registration-container table)');
      if (originalTable && !parent.contains(beautifiedContainer)) {
        // Hide any siblings that might contain old content
        Array.from(parent.children).forEach((child) => {
          if (child !== beautifiedContainer && child !== beautifiedContainer.parentElement) {
            const childTable = child.querySelector('table');
            if (childTable && childTable.querySelector('tbody tr')) {
              (child as HTMLElement).style.display = 'none';
            }
          }
        });
      }
      parent = parent.parentElement;
    }
  }

  // Hide any remaining original table elements that might be visible
  const originalTables = document.querySelectorAll('table:not(#beautified-registration-container table)');
  originalTables.forEach((table) => {
    const tbody = table.querySelector('tbody');
    if (tbody && tbody.querySelector('tr')) {
      // Check if this table contains course data (not our beautified content)
      const parent = table.closest('#enabled_panel, .table-container, [class*="table"]');
      if (parent && !parent.contains(beautifiedContainer)) {
        (table as HTMLElement).style.display = 'none';
        // Also hide the parent if it's not our container
        if (parent !== beautifiedContainer && !parent.contains(beautifiedContainer)) {
          (parent as HTMLElement).style.display = 'none';
        }
      }
    }
  });

  // Hide any tbody elements that are not part of our beautified content
  const originalTbodies = document.querySelectorAll('tbody:not(#beautified-registration-container tbody)');
  originalTbodies.forEach((tbody) => {
    if (tbody.querySelector('tr') && !beautifiedContainer.contains(tbody)) {
      const parent = tbody.closest('#enabled_panel, table, .table-container');
      if (parent && !parent.contains(beautifiedContainer)) {
        (tbody as HTMLElement).style.display = 'none';
      }
    }
  });

  setupCardEventHandlers();
  setupTabEventHandlers();
  await addFilterControls(beautifiedContainer);
  await addSaveAndCloseButton(beautifiedContainer);
  beautifiedContainer.prepend(titleContainer);
  beautifiedContainer.prepend(courseNameContainer);
}

// Export redistributeSections for use in filter-handlers
export { redistributeSections };

