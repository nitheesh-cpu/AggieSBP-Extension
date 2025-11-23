import { debugLog } from '../utils/debug';
import { collectSelectedCourses } from '../utils/course-collection';

// Import beautify functions - these will be implemented in generated-schedules-page.ts
// Using dynamic import to avoid circular dependencies
let beautifySchedules: ((resultElement: HTMLElement) => void) | null = null;
let enhancePaginationButtons: (() => void) | null = null;

// Lazy load the beautify functions
async function getBeautifyFunctions() {
  if (!beautifySchedules || !enhancePaginationButtons) {
    const module = await import('../pages/generated-schedules-page');
    beautifySchedules = module.beautifySchedules;
    enhancePaginationButtons = module.enhancePaginationButtons;
  }
  return { beautifySchedules, enhancePaginationButtons };
}

/**
 * Set up MutationObserver for generate buttons
 * Finds and enhances generate buttons, replaces button text and styling,
 * adds click handlers with course collection, and watches for new buttons via MutationObserver
 */
export function setupGenerateButtonObserver(): void {
  // Function to replace generate buttons in a given panel
  function replaceGenerateButtonsInPanel(panel: HTMLElement | null): boolean {
    if (!panel) return false;

    const buttons = panel.querySelectorAll('button[type="button"]:not(.modern-generate-button)');
    let buttonsReplaced = false;

    buttons.forEach((button) => {
      const buttonElement = button as HTMLButtonElement;
      const buttonText = buttonElement.textContent || buttonElement.value || '';
      if (buttonText.includes('Generate Schedules') || buttonText.includes('Generate Schedule')) {
        buttonElement.classList.add('modern-generate-button');
        buttonElement.textContent = '🚀 Generate Schedules';

        // Copy click functionality with course collection
        buttonElement.addEventListener('click', function (e) {
          e.preventDefault();

          // Collect all selected courses
          const selectedCourses = collectSelectedCourses();

          debugLog('Selected courses for schedule generation:', selectedCourses);

          buttonElement.classList.add('loading');
          buttonElement.textContent = 'Generating...';

          watchScheduleGeneration(buttonElement);
        });

        buttonsReplaced = true;
      }
    });

    return buttonsReplaced;
  }

  // Initial check for existing panels and buttons
  const favoritesPanel = document.getElementById('favorites_panel');
  const schedulesPanel = document.getElementById('schedules_panel');

  if (favoritesPanel) {
    replaceGenerateButtonsInPanel(favoritesPanel);
  }
  if (schedulesPanel) {
    replaceGenerateButtonsInPanel(schedulesPanel);
  }

  // Set up MutationObserver to watch for changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if nodes were added
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          // Skip if not an element
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          const element = node as HTMLElement;

          // Check if the added node is one of our target panels
          if (element.id === 'favorites_panel' || element.id === 'schedules_panel') {
            debugLog('Target panel appeared:', element.id);
            replaceGenerateButtonsInPanel(element);
            if (element.id === 'schedules_panel') {
              // Beautify schedules if compare panel exists
              const comparePanel = element.querySelector('div[class*="comparePanelCss"]') as HTMLElement;
              if (comparePanel) {
                getBeautifyFunctions().then(({ beautifySchedules }) => {
                  if (beautifySchedules) {
                    beautifySchedules(comparePanel);
                  }
                });
              }
            }
          }

          // Check if the added node contains buttons in our target panels
          const targetPanels = [
            document.getElementById('favorites_panel'),
            document.getElementById('schedules_panel'),
          ].filter((panel) => panel !== null) as HTMLElement[];

          targetPanels.forEach((panel) => {
            // Check if the mutation happened within this panel
            if (panel.contains(element) || (element.contains && element.contains(panel))) {
              replaceGenerateButtonsInPanel(panel);
            }
          });
        });
      }

      // Also check for attribute changes that might indicate content loaded
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        if (target.id === 'favorites_panel' || target.id === 'schedules_panel') {
          // Delay slightly to let content load
          setTimeout(() => {
            replaceGenerateButtonsInPanel(target);
          }, 100);
        }
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'], // Watch for class and style changes that might indicate content loading
  });

  debugLog('Generate button observer set up successfully');
}

/**
 * Watch for schedule generation results
 * Observes schedules panel and detects when third child is added
 */
export function watchScheduleGeneration(button: HTMLButtonElement): void {
  // Watch schedule panel for a third child
  const schedulePanel = document.getElementById('schedules_panel');

  if (!schedulePanel) {
    debugLog('Schedules panel not found');
    return;
  }

  debugLog('Starting to watch for schedule generation results...');

  // Create a new MutationObserver specifically for schedule generation results
  const scheduleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if a third child (or more) has been added
        const childCount = schedulePanel.children.length;
        debugLog('Schedule panel child count:', childCount);

        if (childCount >= 3) {
          // A third div has been added - this likely contains the schedule generation results
          const thirdChild = schedulePanel.children[2] as HTMLElement;
          debugLog('Third child detected:', thirdChild);

          button.classList.remove('loading');
          button.textContent = '🚀 Generate Schedules';

          // Handle the schedule generation response
          handleScheduleGenerationComplete(thirdChild);

          // Stop observing once we've found the results
          scheduleObserver.disconnect();
        }
      }
    });
  });

  // Start observing the schedules panel for child additions
  scheduleObserver.observe(schedulePanel, {
    childList: true,
    subtree: false, // Only watch direct children, not nested elements
  });
}

/**
 * Handle when schedule generation is complete
 * Checks result type (warnings vs schedules) and calls beautifySchedules if needed
 */
export async function handleScheduleGenerationComplete(resultElement: HTMLElement): Promise<void> {
  debugLog('Schedule generation complete, processing results:', resultElement);

  // Add a small delay to ensure DOM is fully updated
  setTimeout(async () => {
    // Check what type of content was added
    if (resultElement.textContent?.includes('warning') || resultElement.textContent?.includes('alert')) {
      debugLog('Schedule generation returned warnings/errors');
      // The existing displayWarnings function can handle this
    } else if (resultElement.textContent?.includes('schedule') || resultElement.querySelector('table')) {
      debugLog('Schedule generation returned schedules');
      const { beautifySchedules, enhancePaginationButtons } = await getBeautifyFunctions();
      if (beautifySchedules) {
        beautifySchedules(resultElement);
      }
      if (enhancePaginationButtons) {
        enhancePaginationButtons();
      }
    } else {
      debugLog('Unknown schedule generation result type');
    }
  }, 100);
}

/**
 * Check for and handle course modification alert
 * Finds alert in schedules panel and updates alert message if needed
 */
export function checkForCourseModificationAlert(): void {
  const schedulesPanel = document.getElementById('schedules_panel');
  if (!schedulesPanel) return;

  // Look for the alert with role="alert" and warning class
  const alert = schedulesPanel.querySelector('div[class*="dismissableCss-alertCss"]') as HTMLElement;

  if (alert) {
    debugLog('Course modification alert detected:', alert);

    // Check if the alert contains a Generate Schedules button
    const generateButton = alert.querySelector('div[class*="messageCss"]') as HTMLElement;
    if (generateButton) {
      generateButton.textContent =
        'You have modified your course settings or filters. Click Generate Schedules for your changes to take effect.';
    }
  }
}

