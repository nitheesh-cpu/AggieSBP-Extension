import { showLoadingScreen, hideLoadingScreen } from '../components/loading-screen';
import { debugLog, errorLog } from '../utils/debug';
import { store } from '../state/store';
import { CacheUtils } from '../services/cache';
import { getTermData } from '../services/api';
import { transformSectionToScheduleFormat } from '../services/course-service';
import { fetchProfessorId } from '../services/professor-service';
import { extractTermFromUrl } from '../utils/page-detector';
import { applySettings } from '../utils/settings';
import { loadStylesheets } from '../utils/styles';
import { setupScheduleEventListeners } from '../handlers/schedule-handlers';
import { setupCheckboxSynchronization } from '../handlers/checkbox-handlers';
import { setupGenerateButtonObserver } from '../handlers/schedule-generation-handlers';

let scheduleObserver: MutationObserver | null = null;
let isBeautifying = false; // Flag to prevent infinite loops

/**
 * Set up observer for main schedule page
 */
export async function setupMainScheduleObserver(): Promise<void> {
  // Disconnect existing observer if any
  if (scheduleObserver) {
    scheduleObserver.disconnect();
    scheduleObserver = null;
  }

  const targetNode = document.querySelector('div[class*="tableCss"]');

  if (targetNode) {
    if (isBeautifying) return; // Prevent re-entry
    isBeautifying = true;
    showLoadingScreen();
    await beautifyMainSchedule();
    beautifyExistingTables();
    isBeautifying = false;
  } else {
    scheduleObserver = new MutationObserver((_mutations) => {
      if (isBeautifying) return; // Prevent re-entry
      const targetNode = document.querySelector('div[class*="tableCss"]');
      if (targetNode) {
        isBeautifying = true;
        showLoadingScreen();
        beautifyMainSchedule();
        beautifyExistingTables();
        isBeautifying = false;
        // Disconnect after first successful beautification to prevent loops
        if (scheduleObserver) {
          scheduleObserver.disconnect();
          scheduleObserver = null;
        }
      }
    });

    scheduleObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Beautify the main schedule page
 * Main entry point that fetches data, transforms sections, and calls createMainSchedule
 */
async function beautifyMainSchedule(): Promise<void> {
  // Store original content if not already stored
  if (!store.get('originalContent')) {
    store.set('originalContent', document.body.cloneNode(true));
  }

  try {
    debugLog('Starting main schedule beautification...');

    // Get term ID from URL for caching
    const term = extractTermFromUrl();
    if (!term) {
      debugLog('Could not extract term from URL');
      hideLoadingScreen();
      return;
    }

    const scheduleKey = `main_schedule_${term}`;
    const cartKey = `cart_schedule_${term}`;

    // Fast path: Check localStorage first for immediate rendering
    const fastScheduleData = CacheUtils.getCachedDataSync(scheduleKey);
    const fastCartScheduleData = CacheUtils.getCachedDataSync(cartKey);
    if (fastScheduleData && fastCartScheduleData) {
      debugLog('Using fast localStorage cache for main schedule - immediate render');
      await createMainSchedule(fastScheduleData, fastCartScheduleData);
      applySettings();
      hideLoadingScreen();
      return;
    }

    let scheduleData = fastScheduleData;
    let cartData = fastCartScheduleData;

    // Otherwise, fetch what we need
    if (!scheduleData || !cartData) {
      try {
        const termData = await getTermData();
        if (!termData || !termData.currentSections || !termData.cartSections) {
          debugLog('No term data or current sections found');
          hideLoadingScreen();
          return;
        }

        const currentSections = termData.currentSections;
        const cartSections = termData.cartSections;

        debugLog('Cart sections:', cartSections);

        scheduleData = currentSections
          .filter((section: any) => section.enrollmentStatus === 'Enrolled')
          .map((section: any) => transformSectionToScheduleFormat(section));
        cartData = cartSections.map((section: any) => transformSectionToScheduleFormat(section));

        debugLog('Schedule data:', scheduleData);
        debugLog('Cart data:', cartData);

        if (scheduleData.length === 0) {
          debugLog('No enrolled courses found');
        }

        if (cartData.length === 0) {
          debugLog('No cart courses found');
        }

        // Cache asynchronously (non-blocking)
        CacheUtils.store(scheduleKey, scheduleData).catch((error) => {
          errorLog('Error caching main schedule data:', error);
        });
        CacheUtils.store(cartKey, cartData).catch((error) => {
          errorLog('Error caching cart data:', error);
        });
        debugLog('Fetched and processed main schedule data');
      } catch (error) {
        errorLog('Error fetching main schedule data:', error);
        hideLoadingScreen();
        return;
      }
    } else {
      debugLog('Using cached main schedule data');
    }

    await createMainSchedule(scheduleData, cartData);
    applySettings();
    debugLog('Main schedule beautification completed successfully');
  } catch (error) {
    errorLog('Error beautifying main schedule:', error);
  }

  // Always hide the loading screen when main schedule beautification completes
  hideLoadingScreen();
}

/**
 * Create the main schedule UI
 * Finds tables, hides originals, generates and inserts beautified schedule containers
 */
async function createMainSchedule(enrolledCourses: any[], cartCourses: any[]): Promise<void> {
  debugLog('Creating main schedule with courses:', enrolledCourses);
  debugLog('Creating cart with courses:', cartCourses);

  // Store course data globally for details function
  store.set('enrolledCoursesData', enrolledCourses);
  store.set('cartCoursesData', cartCourses);

  // Find the target table elements specifically
  // Debug: Log all containers to see what we're working with
  const allContainers = document.querySelectorAll('div[class*="containerCss"], div[class*="constainerCss"]');
  debugLog('All containers found:', allContainers);
  allContainers.forEach((container, index) => {
    debugLog(`Container ${index}:`, container.className, container.textContent?.substring(0, 50));
  });

  // Current schedule table is in container with "Current Schedule" header
  const currentScheduleContainer = Array.from(allContainers).find((container) => {
    return container.textContent?.includes('Current Schedule');
  });

  let scheduleTable: HTMLElement | null = null;
  let cartTable: HTMLElement | null = null;

  if (currentScheduleContainer) {
    scheduleTable = currentScheduleContainer.querySelector('div[class*="tableCss"]') as HTMLElement;
    debugLog('Found current schedule container:', currentScheduleContainer);
    debugLog('Found current schedule table:', scheduleTable);
  } else {
    debugLog('Current schedule container not found');
  }

  // Find cart table by looking for "Shopping Cart" container specifically
  // Note: There's a typo in the class name - it's "constainerCss" not "containerCss"
  const shoppingCartContainer = Array.from(allContainers).find((container) => {
    return container.textContent?.includes('Shopping Cart');
  });

  if (shoppingCartContainer) {
    cartTable = shoppingCartContainer.querySelector('div[class*="tableCss"]') as HTMLElement;
    debugLog('Found shopping cart container:', shoppingCartContainer);
    debugLog('Found shopping cart table:', cartTable);
  } else {
    debugLog('Shopping cart container not found');
  }

  if (!scheduleTable) {
    debugLog('Current schedule table not found');
    return;
  }

  if (!cartTable) {
    debugLog('Cart table not found, will only beautify schedule');
  }

  debugLog('Found schedule table:', scheduleTable);
  debugLog('Found cart table:', cartTable);

  // Validate that scheduleTable has a parent node
  if (!scheduleTable.parentNode) {
    debugLog('Schedule table has no parent node');
    return;
  }

  // Hide the original tables instead of replacing them
  scheduleTable.style.display = 'none';
  if (cartTable) {
    cartTable.style.display = 'none';
  }

  // Create beautified schedule HTML
  const scheduleHTML = await createScheduleHTML(enrolledCourses, 'enrolled');
  const cartHTML = await createScheduleHTML(cartCourses, 'cart');

  // Load schedule CSS (already loaded via loadStylesheets, but ensure it's there)
  await loadStylesheets();

  // Create containers for the beautified UI
  const scheduleContainer = document.createElement('div');
  scheduleContainer.innerHTML = scheduleHTML;
  scheduleContainer.className = 'beautified-schedule-container';

  const cartContainer = document.createElement('div');
  cartContainer.innerHTML = cartHTML;
  cartContainer.className = 'beautified-cart-container';

  // Insert the beautified schedule container after the hidden schedule table
  if (scheduleTable && scheduleTable.parentNode) {
    scheduleTable.parentNode.insertBefore(scheduleContainer.firstElementChild!, scheduleTable.nextSibling);
  }

  // Insert the beautified cart container after the hidden cart table (if it exists)
  if (cartTable && cartTable.parentNode) {
    debugLog('Inserting cart container after cart table');
    cartTable.parentNode.insertBefore(cartContainer.firstElementChild!, cartTable.nextSibling);
  } else if (shoppingCartContainer) {
    // If we found the shopping cart container but no table, insert the cart container inside it
    debugLog('Inserting cart container inside shopping cart container');
    shoppingCartContainer.appendChild(cartContainer.firstElementChild!);
  } else {
    // If no cart table or container found, append cart container to the page
    debugLog('No cart table or container found, using fallback placement');
    const pageContainer = document.querySelector('div[class*="containerCss"], div[class*="constainerCss"]');
    if (pageContainer && pageContainer.parentNode) {
      pageContainer.parentNode.insertBefore(cartContainer.firstElementChild!, pageContainer.nextSibling);
    }
  }

  // Set up event listeners with checkbox synchronization
  setupScheduleEventListeners();
  setupCheckboxSynchronization();
  
  // Set up generate button observer (called from setupScheduleEventListeners, but also call here to ensure it's set up)
  setupGenerateButtonObserver();
}

/**
 * Create schedule HTML from enrolled courses
 * Generates HTML for schedule display with courses, badges, meeting times, and professor buttons
 */
async function createScheduleHTML(enrolledCourses: any[], containerType: string = 'default'): Promise<string> {
  if (!enrolledCourses || enrolledCourses.length === 0) {
    return `<div class="schedule-container">
      <div class="schedule-header">
        <div class="select-all-container">
          <input type="checkbox" id="select-all-checkbox-${containerType}" class="select-all-checkbox">
          <label for="select-all-checkbox-${containerType}" class="select-all-label">Select All</label>
        </div>
      </div>
      <div class="schedule-header">No enrolled courses found</div>
    </div>`;
  }

  // Process courses with professor buttons
  const scheduleItems: string[] = [];
  for (const course of enrolledCourses) {
    // Fetch professor button HTML if instructor is available
    let professorButtonHtml = '';
    if (course.instructor && course.instructor !== 'Unknown' && course.instructor !== 'Not Assigned') {
      try {
        const professorId = await fetchProfessorId(course.instructor);
        if (professorId) {
          const professorDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/professor/${professorId}`;
          professorButtonHtml = `<a href="${professorDetailsUrl}" target="_blank" class="professor-details-btn" title="Compare Professor Reviews">View Reviews 🔗</a>`;
        }
      } catch (error) {
        debugLog(`Error fetching professor ID for ${course.instructor}:`, error);
      }
    }

    // Create badges
    const badges: string[] = [];
    if (course.hasPrerequisites) {
      badges.push('<span class="add-course-badge badge-prerequisites">Prerequisites</span>');
    }
    if (course.hasRestrictions) {
      badges.push('<span class="add-course-badge badge-restrictions">Restrictions</span>');
    }
    const badgesHTML =
      badges.length > 0 ? `<div class="add-course-badges">${badges.join('')}</div>` : '';

    // Handle cases where there are many meeting times
    const displayMeetings = course.meetingTimes; // Show all meetings

    const displayMeetingTimesHTML = displayMeetings
      .map((meeting: any) => {
        const locationHTML = meeting.location
          ? ` <a href="#" class="location-link">${meeting.location}</a>`
          : '';

        return `
      <div class="schedule-meeting-time">
        ${meeting.timeDisplay}${meeting.isOnline ? ' - ONLINE' : ''}${locationHTML}
      </div>
    `;
      })
      .join('');

    // Conditionally include enrolled status only if enrollmentStatus is not null
    const enrolledStatusHTML =
      course.enrollmentStatus === 'Enrolled'
        ? `<span class="status-enrolled">
          <span class="status-icon">ℹ</span>
          ${course.enrollmentStatus}
        </span>`
        : '';

    // Create seats availability indicator for cart courses
    let seatsAvailableHTML = '';
    if (course.enrollmentStatus !== 'Enrolled' && course.openSeats !== undefined) {
      const seatsCount = parseInt(course.openSeats) || 0;
      let seatsClass = 'seats-available';
      let seatsIcon = '✓';

      if (seatsCount === 0) {
        seatsClass = 'seats-full';
        seatsIcon = '✗';
      } else if (seatsCount < 5) {
        seatsClass = 'seats-limited';
        seatsIcon = '!';
      }

      seatsAvailableHTML = `<div class="seats-indicator ${seatsClass}">
        <span class="seats-icon">${seatsIcon}</span>
        <span class="seats-text">${seatsCount} seats</span>
      </div>`;
    }

    const scheduleItemHTML = `
    <div class="schedule-item">
      <div class="schedule-item-header">
        <div class="schedule-item-main">
          <input type="checkbox" id="beautified_checkbox_${course.crn}" style="margin: 0px 0px 0px 0px;" class="schedule-checkbox" data-crn="${course.crn}" data-id="${course.id}" ${course.enrollmentStatus === 'Enrolled' ? 'checked' : ''}>
          <div class="course-identifier">
            ${course.subject} ${course.courseNumber}-${course.sectionNumber}
            <span class="course-crn-schedule">CRN: ${course.crn}</span>
          </div>
          <div class="course-credits">${course.credits} Credits</div>
          <div class="instruction-mode">${course.instructionMode}</div>
          ${seatsAvailableHTML}
          ${enrolledStatusHTML}
        </div>
        <div class="schedule-actions">
          <button class="details-button" data-crn="${course.crn}">Details</button>
        </div>
      </div>
      <div class="schedule-times">
        <div class="schedule-meeting-times">
          ${displayMeetingTimesHTML}
        </div>
      </div>
      <div class="instructor-info">
        <div class="instructor-container">
          <div class="instructor-name">Instructor: ${course.instructor}</div>
          ${professorButtonHtml}
        </div>
        ${badgesHTML}
      </div>
    </div>
  `;

    scheduleItems.push(scheduleItemHTML);
  }

  return `
    <div class="schedule-container">
      <div class="schedule-header">
        <div class="select-all-container">
          <input style="margin: 0;" type="checkbox" id="select-all-checkbox-${containerType}" class="select-all-checkbox">
          <label for="select-all-checkbox-${containerType}" class="select-all-label">Select All</label>
        </div>
      </div>
      ${scheduleItems.join('')}
    </div>
  `;
}

/**
 * Beautify existing tables on courses/options/schedules/breaks pages
 * This function enhances the styling of existing tables without replacing them
 */
export function beautifyExistingTables(): void {
  // Check if already beautified to prevent re-running
  if (document.querySelector('.add-course-badge, .schedule-checkbox')) {
    debugLog('Tables already beautified, skipping...');
    return;
  }
  
  debugLog('Beautifying existing tables...');

  // Add badge classes based on badge text content
  // Select all elements with flagCss class (various class names like css-1deu6zk-flagCss, css-ep2pvs-flagCss, etc.)
  document.querySelectorAll('[class*="flagCss"]').forEach((badge) => {
    // Find the actual badge span element (the one with role="button" or the first visible span)
    let targetBadge: HTMLElement = badge as HTMLElement;
    const innerBadge = badge.querySelector('span[role="button"]') as HTMLElement;
    if (innerBadge) {
      targetBadge = innerBadge;
    } else {
      const visibleSpan = badge.querySelector('span:not(.sr-only)') as HTMLElement;
      if (visibleSpan) {
        targetBadge = visibleSpan;
      }
    }
    
    // Get the visible text only (exclude screen reader text)
    let badgeText = '';
    if (targetBadge) {
      badgeText = (targetBadge.textContent || targetBadge.innerText || '').trim().toLowerCase();
    }
    
    // If we still don't have text, try the original badge element
    if (!badgeText) {
      const badgeElement = badge as HTMLElement;
      badgeText = (badgeElement.textContent || badgeElement.innerText || '').trim().toLowerCase();
      // Remove common screen reader text
      badgeText = badgeText.replace(/has\s+(prerequisites|restrictions|honors|free\s+textbook|low\s+cost\s+textbook)/gi, '').trim();
    }
    
    // Add base badge class to the target element
    targetBadge.classList.add('add-course-badge');
    
    // Determine badge type based on text content
    if (badgeText.includes('prerequisite') || badgeText.includes('prereq')) {
      targetBadge.classList.add('badge-prerequisites');
    } else if (badgeText.includes('restriction') || badgeText.includes('restrict')) {
      targetBadge.classList.add('badge-restrictions');
    } else if (badgeText.includes('honor')) {
      targetBadge.classList.add('badge-honors');
    } else if (badgeText.includes('free textbook') || badgeText.includes('free text')) {
      targetBadge.classList.add('badge-free-textbook');
    } else if (badgeText.includes('low cost textbook') || badgeText.includes('low cost')) {
      targetBadge.classList.add('badge-low-cost-textbook');
    } else {
      // Default to prerequisites if we can't determine the type
      targetBadge.classList.add('badge-prerequisites');
    }
    
    // Remove all flagCss classes from both the original badge and target
    [badge, targetBadge].forEach((element) => {
      Array.from(element.classList).forEach((cls) => {
        if (cls.includes('flagCss')) {
          element.classList.remove(cls);
        }
      });
    });
  });

  // Add checkbox classes
  document.querySelectorAll('.css-1p12iun-checkboxCss').forEach((checkbox) => {
    checkbox.classList.add('schedule-checkbox');
  });

  // Style edit buttons
  document.querySelectorAll('.css-o4eziu-hoverStyles-hoverStyles-defaultStyle-hoverStyles-btnCss-editBtnCss').forEach((button) => {
    (button as HTMLElement).style.display = 'inline-flex';
    (button as HTMLElement).style.alignItems = 'center';
    (button as HTMLElement).style.justifyContent = 'center';
  });

  // Replace cogwheel icons with SVG
  document.querySelectorAll('.cogwheel').forEach((icon) => {
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#500000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.3 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 .33 1.82v.09c0 .7.4 1.3 1 1.51h.09a2 2 0 1 1 0 4h-.09c-.7 0-1.3.4-1.51 1z"></path>
</svg>`;
    const svgElement = svgContainer.firstElementChild;
    if (svgElement && icon.parentNode) {
      icon.parentNode.replaceChild(svgElement, icon);
    }
  });

  // Replace info circle icons with SVG
  document.querySelectorAll('.fa-info-circle').forEach((icon) => {
    (icon as HTMLElement).innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" style="display: block;" width="24" height="24" fill="none" stroke="#4a90e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="16" x2="12" y2="12"></line>
  <line x1="12" y1="8" x2="12" y2="8"></line>
</svg>`;
    icon.classList.remove('fa', 'fa-info-circle');
  });

  // Replace remove icons with SVG
  document.querySelectorAll('.remove').forEach((icon) => {
    (icon as HTMLElement).innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="display: block;" width="24" height="24" fill="none" stroke="#d33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="15" y1="9" x2="9" y2="15"></line>
  <line x1="9" y1="9" x2="15" y2="15"></line>
</svg>`;
    icon.classList.remove('glyphicon', 'remove');
  });

  // Add container classes
  const containerElement = document.querySelector('.css-t9zfzt-containerCss');
  if (containerElement) {
    containerElement.classList.add('modern-table-container', 'add-course-table');
  }

  const tableElement = document.querySelector('.css-1hcgu1m-tableCss');
  if (tableElement) {
    tableElement.classList.add('modern-table-container', 'add-break-table');
  }

  // Convert course names to links
  convertCourseNamesToLinks();

  hideLoadingScreen();
  debugLog('Finished beautifying existing tables');
}

/**
 * Convert course names to links in add courses table
 */
function convertCourseNamesToLinks(): void {
  const addCoursesTable = document.querySelector('.add-course-table table');

  if (!addCoursesTable) {
    debugLog('Add courses table not found');
    return;
  }

  const tableRows = addCoursesTable.querySelectorAll('tbody tr');

  tableRows.forEach((row) => {
    const courseTitleElements = row.querySelectorAll('.css-wcutoi-titleCss');

    courseTitleElements.forEach((titleElement) => {
      // Skip if already wrapped in a link
      if (titleElement.closest('a')) return;

      const courseText = titleElement.textContent?.trim();
      if (!courseText) return;

      // Parse course text (e.g., "AGEC 105")
      const courseMatch = courseText.match(/^([A-Z]{2,4})[\s-]?(\d{3,4})/);

      if (courseMatch) {
        const subject = courseMatch[1];
        const number = courseMatch[2];
        const courseId = `${subject}${number}`;
        const courseDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/course/${courseId}`;

        // Create link wrapper
        const linkWrapper = document.createElement('a');
        linkWrapper.href = courseDetailsUrl;
        linkWrapper.target = '_blank';
        linkWrapper.className = 'course-details-link';
        linkWrapper.title = 'View Course Details';

        // Clone and wrap the element
        const clonedElement = titleElement.cloneNode(true);
        linkWrapper.appendChild(clonedElement);

        // Replace original with link
        if (titleElement.parentNode) {
          titleElement.parentNode.replaceChild(linkWrapper, titleElement);
        }

        debugLog(`Converted course title: ${courseText} -> ${courseDetailsUrl}`);
      }
    });
  });
}

