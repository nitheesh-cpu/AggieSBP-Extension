import { debugLog } from '../utils/debug';
import { store } from '../state/store';
import { checkForCourseModificationAlert } from '../handlers/schedule-generation-handlers';

/**
 * Beautify generated schedule results
 * Finds schedule rows, enhances each row, and enhances shuffle button
 */
export function beautifySchedules(resultElement: HTMLElement): void {
  if (!resultElement) {
    debugLog('No result element found');
    return;
  }

  checkForCourseModificationAlert();

  const nextSibling = resultElement.nextElementSibling as HTMLElement;
  if (!nextSibling) {
    debugLog('No next sibling found');
    return;
  }

  debugLog('Beautifying schedule results:', nextSibling);

  // Find all schedule rows in the result element
  const scheduleRows = nextSibling.querySelectorAll('div[class*="rowCss"]');

  if (scheduleRows.length === 0) {
    debugLog('No schedule rows found to beautify');
    return;
  }

  debugLog(`Found ${scheduleRows.length} schedule rows to beautify`);

  // Enhance each schedule row in place
  scheduleRows.forEach((row, index) => {
    const rowElement = row as HTMLElement;
    // Check if this row has already been enhanced
    if (!rowElement.hasAttribute('data-enhanced')) {
      debugLog(`Enhancing schedule row ${index + 1}`);
      enhanceScheduleRow(rowElement, index + 1);
      rowElement.setAttribute('data-enhanced', 'true');
    }
  });

  // Look for and enhance the shuffle button
  enhanceShuffleButton(nextSibling);

  debugLog('Schedule beautification complete');
}

/**
 * Enhance a single schedule row
 * Modernizes view button, converts courses to badges, and adds hover effects
 */
function enhanceScheduleRow(row: HTMLElement, scheduleNumber: number): void {
  // Modernize the view button/link
  const viewLink = row.querySelector('a[aria-label*="View Schedule"]') as HTMLAnchorElement;
  if (viewLink) {
    enhanceViewButton(viewLink, scheduleNumber);
  }

  // Convert course string to badges
  const courseSpan = row.querySelector('span[class*="ScheduleColumn"]:last-child') as HTMLElement;
  if (courseSpan) {
    convertCoursesToBadges(courseSpan);
  }

  // Add hover effect to the entire row
  row.classList.add('beautified-schedule-row');
}

/**
 * Enhance the view button
 * Adds modern styling, updates text and icon, and prevents new tab opens
 */
function enhanceViewButton(viewLink: HTMLAnchorElement, _scheduleNumber: number): void {
  // Add modern styling classes
  viewLink.classList.add('modern-view-button');

  // Update the text content and add an icon
  viewLink.textContent = 'View';

  // Ensure same-tab navigation
  viewLink.target = '_self';

  // Add click handler to prevent new tab opens
  viewLink.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || (e as MouseEvent).button === 1) {
      e.preventDefault();
      alert('Please click normally to view the schedule. Opening in a new tab may cause session issues.');
      return false;
    }
  });
}

/**
 * Convert course strings to individual badges
 * Parses course strings and creates badge elements
 */
function convertCoursesToBadges(courseSpan: HTMLElement): void {
  const coursesText = courseSpan.textContent?.trim() || '';
  debugLog('Courses text:', coursesText);

  if (!coursesText) return;

  // Split courses and create badges
  const courses = coursesText.split(', ');

  // Create container for badges
  const badgesContainer = document.createElement('div');
  badgesContainer.className = 'schedule-course-badges-container';

  courses.forEach((courseStr) => {
    // Parse course string like "105-AGEC-504" to "AGEC 105-504"
    const parts = courseStr.split('-');
    const courseNumber = parts[0];
    const subject = parts[1];
    const section = parts[2];

    const badge = document.createElement('span');
    badge.className = 'schedule-course-badge';
    if (section) {
      badge.textContent = `${subject} ${courseNumber}-${section}`;
    } else {
      badge.textContent = `${courseNumber}`;
    }

    badgesContainer.appendChild(badge);
  });
  debugLog('Badges container:', badgesContainer);

  // Replace the original text with badges
  courseSpan.innerHTML = '';
  courseSpan.appendChild(badgesContainer);
}

/**
 * Enhance the shuffle button
 * Finds shuffle button, adds modern styling, and sets up re-beautification on click
 */
function enhanceShuffleButton(container: HTMLElement): void {
  // Look for the shuffle button in the container and its parent elements
  const shuffleButton =
    (container.querySelector('button[class*="shuffleCss"]') as HTMLButtonElement) ||
    (container.parentElement?.querySelector('button[class*="shuffleCss"]') as HTMLButtonElement) ||
    (document.querySelector('#schedules_panel button[class*="shuffleCss"]') as HTMLButtonElement);

  if (shuffleButton && !shuffleButton.hasAttribute('data-shuffle-enhanced')) {
    debugLog('Found shuffle button, enhancing:', shuffleButton);

    // Add modern styling class
    shuffleButton.classList.add('modern-shuffle-button');

    // Mark as enhanced to prevent duplicate processing
    shuffleButton.setAttribute('data-shuffle-enhanced', 'true');

    // Add click event listener to re-beautify schedules after shuffle
    shuffleButton.addEventListener('click', () => {
      debugLog('Shuffle button clicked, setting up re-beautification');
      // Use a short delay to allow the shuffle to complete and DOM to update
      setTimeout(() => {
        reBeautifyScheduleResults();
      }, 50);
    });

    debugLog('Shuffle button enhanced successfully');
  } else if (!shuffleButton) {
    debugLog('No shuffle button found in container');
  } else {
    debugLog('Shuffle button already enhanced, skipping');
  }
}

/**
 * Re-beautify schedule results after shuffle or pagination
 * Removes beautification markers, re-runs beautification, and sets up pagination listeners
 */
export function reBeautifyScheduleResults(): void {
  const isReBeautifying = store.get('isReBeautifying');
  if (isReBeautifying) {
    debugLog('Re-beautification already in progress, skipping');
    return;
  }

  store.set('isReBeautifying', true);
  debugLog('Re-beautifying schedule results');

  const schedulesPanel = document.getElementById('schedules_panel');
  if (!schedulesPanel) {
    debugLog('Schedules panel not found for re-beautification');
    store.set('isReBeautifying', false);
    return;
  }

  // Find the results container (usually the third child)
  const resultElements = schedulesPanel.children;
  if (resultElements.length >= 3) {
    const resultElement = resultElements[2] as HTMLElement;

    // Remove previous beautification markers to allow re-processing
    removeBeautificationMarkers(resultElement);

    // Re-beautify the schedules immediately for faster visual updates
    beautifySchedules(resultElement);

    // Set up pagination click listeners without styling
    setupPaginationClickListeners();

    store.set('isReBeautifying', false);
  } else {
    debugLog('No schedule results found to re-beautify');
    store.set('isReBeautifying', false);
  }
}

/**
 * Remove beautification markers for re-processing
 * Removes data-enhanced attributes, modern classes, and resets shuffle button markers
 */
function removeBeautificationMarkers(container: HTMLElement): void {
  // Remove data-beautified attribute from the main container
  container.removeAttribute('data-beautified');

  // Remove data-enhanced attributes from schedule rows
  const scheduleRows = container.querySelectorAll('div[data-enhanced="true"]');
  scheduleRows.forEach((row) => {
    row.removeAttribute('data-enhanced');
  });

  // Remove modern classes to allow re-styling
  const modernButtons = container.querySelectorAll('.modern-view-button');
  modernButtons.forEach((button) => {
    button.classList.remove('modern-view-button');
  });

  // Remove beautified row classes
  const beautifiedRows = container.querySelectorAll('.beautified-schedule-row');
  beautifiedRows.forEach((row) => {
    row.classList.remove('beautified-schedule-row');
  });

  // Reset shuffle button enhancement marker to allow re-processing
  const shuffleButtons = container.querySelectorAll('button[data-shuffle-enhanced]');
  shuffleButtons.forEach((button) => {
    button.removeAttribute('data-shuffle-enhanced');
  });

  // DON'T remove pagination button markers - they should persist across re-beautifications

  debugLog('Removed beautification markers for re-processing (preserved pagination enhancements)');
}

/**
 * Enhance pagination buttons
 * Finds pagination container, adds modern styling, and sets up click listeners
 */
export function enhancePaginationButtons(): void {
  const paginationContainer = document.querySelector('ul[class*="pagerCss"]') as HTMLElement;

  if (!paginationContainer) {
    debugLog('No pagination container found');
    return;
  }

  if (!paginationContainer.classList.contains('modern-pagination-container')) {
    paginationContainer.classList.add('modern-pagination-container');
  }

  setupPaginationClickListeners();
}

/**
 * Set up pagination click listeners
 * Finds pagination buttons, adds click handlers, and triggers re-beautification on page change
 */
export function setupPaginationClickListeners(): void {
  const paginationContainer = document.querySelector('ul[class*="pagerCss"]') as HTMLElement;

  if (!paginationContainer) {
    debugLog('No pagination container found');
    return;
  }

  // Only add listeners to buttons that don't have them yet
  const paginationButtons = paginationContainer.querySelectorAll('button:not([data-pagination-listener])');

  debugLog(`Found ${paginationButtons.length} pagination buttons for click listeners`);

  paginationButtons.forEach((button) => {
    const buttonElement = button as HTMLButtonElement;
    // Mark as having a listener to prevent duplicates
    buttonElement.setAttribute('data-pagination-listener', 'true');

    // Add click event listener to ALL buttons (disabled ones will become enabled)
    buttonElement.addEventListener('click', () => {
      // Only process if button is not disabled at click time
      if (!buttonElement.disabled) {
        debugLog('Pagination button clicked, setting up re-beautification');
        // Immediate re-beautification for faster response
        setTimeout(() => {
          reBeautifyScheduleResults();
        }, 1);
      }
    });
  });

  debugLog('Set up pagination click listeners');
}

