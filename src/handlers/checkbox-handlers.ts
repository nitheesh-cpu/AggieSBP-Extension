import { debugLog } from '../utils/debug';

/**
 * Set up checkbox synchronization between beautified UI and original tables
 * Handles individual checkbox changes and select-all checkboxes
 */
export function setupCheckboxSynchronization(): void {
  // Handle individual checkbox changes
  document.querySelectorAll('.schedule-checkbox').forEach((checkbox) => {
    // Skip if this is an original checkbox (not our beautified one)
    const checkboxElement = checkbox as HTMLElement;
    if (checkboxElement.closest('[style*="display: none"]') || checkboxElement.closest('table')) {
      return;
    }

    checkbox.addEventListener('change', function (this: HTMLInputElement) {
      const crn = this.dataset.crn;
      const isChecked = this.checked;

      if (!crn) return;

      debugLog('Beautified checkbox changed:', crn, isChecked);

      // Find and update the corresponding original checkbox
      const originalCheckbox = document.querySelector(`#checkbox_${crn}`) as HTMLInputElement;
      debugLog('Original checkbox:', originalCheckbox);
      if (originalCheckbox && originalCheckbox.checked !== isChecked) {
        originalCheckbox.click();

        // Trigger change event on original checkbox to maintain page functionality
        const changeEvent = new Event('change', { bubbles: true });
        originalCheckbox.dispatchEvent(changeEvent);

        debugLog('Updated original checkbox:', crn, isChecked);
      }

      // Update select all checkbox states
      updateAllSelectAllCheckboxes();

      // Check for course modification alert
      checkForCourseModificationAlert();
    });
  });

  // Handle select all checkboxes
  document.querySelectorAll('.select-all-checkbox').forEach((selectAllCheckbox) => {
    selectAllCheckbox.addEventListener('change', function (this: HTMLInputElement) {
      const isChecked = this.checked;
      const container = this.closest('.schedule-container');

      if (!container) return;

      debugLog('Select all checkbox changed:', isChecked, this.id);

      // Update beautified checkboxes in this container
      const beautifiedCheckboxes = container.querySelectorAll('.schedule-checkbox');
      beautifiedCheckboxes.forEach((checkbox) => {
        const checkboxElement = checkbox as HTMLInputElement;
        if (checkboxElement.checked !== isChecked) {
          checkboxElement.checked = isChecked;

          // Also update the corresponding original checkbox
          const crn = checkboxElement.dataset.crn;
          if (crn) {
            const originalCheckbox = document.querySelector(`#checkbox_${crn}`) as HTMLInputElement;
            if (originalCheckbox && originalCheckbox.checked !== isChecked) {
              originalCheckbox.click();

              // Trigger change event on original checkbox
              const changeEvent = new Event('change', { bubbles: true });
              originalCheckbox.dispatchEvent(changeEvent);
            }
          }
        }
      });

      // Update the original select all checkbox if it exists
      const selectAllId = this.id;
      if (selectAllId.includes('enrolled')) {
        const originalSelectAll = document.querySelector('#checkbox_select_all_Registered') as HTMLInputElement;
        if (originalSelectAll && originalSelectAll.checked !== isChecked) {
          originalSelectAll.checked = isChecked;

          // Trigger change event on original select all
          const changeEvent = new Event('change', { bubbles: true });
          originalSelectAll.dispatchEvent(changeEvent);
        }
      }

      // Check for course modification alert
      checkForCourseModificationAlert();
    });
  });

  // Sync initial states - ensure beautified checkboxes match original ones
  syncInitialCheckboxStates();
}

/**
 * Sync initial checkbox states from original to beautified
 * Finds original checkboxes in hidden tables and updates beautified checkboxes to match
 */
export function syncInitialCheckboxStates(): void {
  // Find all original checkboxes in hidden tables
  const hiddenTables = document.querySelectorAll('div[style*="display: none"] table, table');

  hiddenTables.forEach((table) => {
    const originalCheckboxes = table.querySelectorAll(
      'input[type="checkbox"][id^="checkbox_"]:not(.select-all-checkbox)'
    );

    originalCheckboxes.forEach((originalCheckbox) => {
      const checkboxElement = originalCheckbox as HTMLInputElement;
      const crn = checkboxElement.id.replace('checkbox_', '');
      const beautifiedCheckbox = document.querySelector(
        `.schedule-checkbox[data-crn="${crn}"]:not(table .schedule-checkbox)`
      ) as HTMLInputElement;

      if (beautifiedCheckbox && beautifiedCheckbox.checked !== checkboxElement.checked) {
        beautifiedCheckbox.checked = checkboxElement.checked;
        debugLog('Synced initial state for CRN:', crn, checkboxElement.checked);
      }
    });
  });

  // Update all select all checkbox states
  updateAllSelectAllCheckboxes();
}

/**
 * Update all select all checkboxes to reflect current state
 * Iterates through all select-all checkboxes and updates original select-all if exists
 */
export function updateAllSelectAllCheckboxes(): void {
  document.querySelectorAll('.select-all-checkbox').forEach((selectAllCheckbox) => {
    updateSelectAllCheckboxState(selectAllCheckbox as HTMLInputElement);
  });

  // Also update original select all if it exists
  const originalSelectAll = document.querySelector('#checkbox_select_all_Registered') as HTMLInputElement;
  if (originalSelectAll) {
    const allOriginalCheckboxes = document.querySelectorAll(
      'input[type="checkbox"][id^="checkbox_"]:not([id*="select_all"])'
    );
    const checkedOriginalCheckboxes = document.querySelectorAll(
      'input[type="checkbox"][id^="checkbox_"]:not([id*="select_all"]):checked'
    );

    if (checkedOriginalCheckboxes.length === 0) {
      originalSelectAll.checked = false;
      originalSelectAll.indeterminate = false;
    } else if (checkedOriginalCheckboxes.length === allOriginalCheckboxes.length) {
      originalSelectAll.checked = true;
      originalSelectAll.indeterminate = false;
    } else {
      originalSelectAll.checked = false;
      originalSelectAll.indeterminate = true;
    }
  }
}

/**
 * Update single select-all checkbox state
 * Calculates checked/indeterminate state and updates checkbox accordingly
 */
export function updateSelectAllCheckboxState(selectAllCheckbox: HTMLInputElement | null): void {
  // If no checkbox provided, try to find one (for backward compatibility)
  if (!selectAllCheckbox) {
    selectAllCheckbox = document.querySelector('.select-all-checkbox') as HTMLInputElement;
  }

  if (!selectAllCheckbox) return;

  // Find the parent schedule container for this select all checkbox
  const scheduleContainer = selectAllCheckbox.closest('.schedule-container');
  if (!scheduleContainer) {
    debugLog('Could not find parent schedule container for select all checkbox');
    return;
  }

  // Only consider checkboxes within this container
  const scheduleCheckboxes = scheduleContainer.querySelectorAll('.schedule-checkbox');
  const checkedCheckboxes = scheduleContainer.querySelectorAll('.schedule-checkbox:checked');

  if (checkedCheckboxes.length === 0) {
    // No checkboxes checked
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCheckboxes.length === scheduleCheckboxes.length) {
    // All checkboxes checked
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    // Some checkboxes checked (indeterminate state)
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

/**
 * Check for course modification alert
 * This function will be imported from schedule-generation-handlers to avoid circular dependency
 * For now, it's a placeholder that will be replaced when schedule-generation-handlers is created
 */
function checkForCourseModificationAlert(): void {
  const schedulesPanel = document.getElementById('schedules_panel');
  if (!schedulesPanel) return;

  // Look for the alert with role="alert" and warning class
  const alert = schedulesPanel.querySelector('div[class*="dismissableCss-alertCss"]');

  if (alert) {
    debugLog('Course modification alert detected:', alert);

    // Check if the alert contains a Generate Schedules button
    const generateButton = alert.querySelector('div[class*="messageCss"]');
    if (generateButton) {
      (generateButton as HTMLElement).textContent =
        'You have modified your course settings or filters. Click Generate Schedules for your changes to take effect.';
    }
  }
}

