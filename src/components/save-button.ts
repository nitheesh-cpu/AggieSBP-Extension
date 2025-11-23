import { store } from '../state/store';
import { updateCourseFilterRules } from '../services/api';
import { CacheUtils } from '../services/cache';
import { getXSRFToken } from '../utils/dom';
import { extractTermFromUrl } from '../utils/page-detector';
import { debugLog, errorLog } from '../utils/debug';
import { updateFilterRules } from '../handlers/filter-handlers';

/**
 * Add save and close button to container
 * @param {HTMLElement} container - Container element
 */
export async function addSaveAndCloseButton(container: HTMLElement): Promise<void> {
  const saveButtonContainer = document.createElement('div');
  saveButtonContainer.className = 'save-button-container';

  try {
    // Load the save button template
    const response = await fetch(chrome.runtime.getURL('/templates/save-button.html'));
    const templateHtml = await response.text();
    saveButtonContainer.innerHTML = templateHtml;

    // Add to container after filter controls
    container.appendChild(saveButtonContainer);

    // Add event listeners
    const saveBtn = document.getElementById('saveAndCloseBtn');
    const backBtn = document.getElementById('backBtn');

    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveAndClose();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        redirectToCourseList();
      });
    }
  } catch (error) {
    errorLog('Error loading save button template:', error);
    // Fallback to basic save button if template fails to load
    saveButtonContainer.innerHTML = `
    <div class="save-actions">
      <button id="backBtn" class="back-button">
        <span class="button-text">Back</span>
      </button>
      <button id="saveAndCloseBtn" class="save-close-button">
        <span class="button-text">Save & Close</span>
      </button>
      <div id="saveMessage" class="save-message" style="display: none;"></div>
    </div>
  `;

    container.appendChild(saveButtonContainer);

    const saveBtn = document.getElementById('saveAndCloseBtn');
    const backBtn = document.getElementById('backBtn');

    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveAndClose();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        redirectToCourseList();
      });
    }
  }
}

/**
 * Save filter rules and close
 */
async function saveAndClose(): Promise<void> {
  const saveBtn = document.getElementById('saveAndCloseBtn') as HTMLButtonElement;
  const buttonText = saveBtn?.querySelector('.button-text') as HTMLElement;
  const buttonSpinner = saveBtn?.querySelector('.button-spinner') as HTMLElement;
  const saveMessage = document.getElementById('saveMessage') as HTMLElement;

  if (!saveBtn) return;

  try {
    // Show loading state
    saveBtn.disabled = true;
    if (buttonText) buttonText.style.display = 'none';
    if (buttonSpinner) buttonSpinner.style.display = 'inline-flex';
    if (saveMessage) saveMessage.style.display = 'none';

    // Update filter rules with current selections before saving
    const selectedInstructors = (window as any).instructorMultiSelect
      ? (window as any).instructorMultiSelect.getSelectedValues()
      : [];
    const selectedAttributes = (window as any).sectionAttributeMultiSelect
      ? (window as any).sectionAttributeMultiSelect.getSelectedValues()
      : [];
    updateFilterRules(selectedInstructors, selectedAttributes);

    // Get XSRF token
    const xsrfToken = getXSRFToken();
    if (!xsrfToken) {
      throw new Error('XSRF token not found');
    }

    // Build the course data with updated filter rules
    const courseData = buildCourseDataForSave();

    // Make the PUT request
    const currentCourse = store.get('currentCourse');
    if (!currentCourse) {
      throw new Error('No current course data available');
    }

    const response = await updateCourseFilterRules(currentCourse.id, courseData);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Clear cache since filter rules have changed
    try {
      await CacheUtils.clearCourse(currentCourse.id);
      debugLog('Cleared cache for course after saving filter rules');
    } catch (error) {
      errorLog('Error clearing cache:', error);
    }

    // Show success message
    showSaveMessage('Filters saved successfully!', 'success');

    // Redirect to course list
    const term = extractTermFromUrl();
    if (term) {
      window.location.href = `https://tamu.collegescheduler.com/terms/${term}/courses`;
    }
  } catch (error) {
    errorLog('Error saving filter rules:', error);
    showSaveMessage('Error saving filters. Please try again.', 'error');
    resetSaveButtonState();
  }
}

/**
 * Build the course data object for saving
 */
function buildCourseDataForSave(): any {
  const currentCourse = store.get('currentCourse');
  if (!currentCourse) {
    throw new Error('No current course data available');
  }

  const currentFilterRules = store.get('currentFilterRules');

  return {
    id: currentCourse.id,
    subjectShort: currentCourse.subjectId,
    subjectLong: currentCourse.subjectLong + ' - ' + currentCourse.subjectLong,
    subjectId: currentCourse.subjectId,
    number: currentCourse.number,
    topic: currentCourse.topic || null,
    title: currentCourse.title,
    topicTitle: currentCourse.topicTitle || null,
    description: currentCourse.description || '',
    enrollmentRequirements: currentCourse.enrollmentRequirements || [],
    notes: currentCourse.notes || null,
    component: currentCourse.component || null,
    courseAttributes: currentCourse.courseAttributes || '',
    credits: currentCourse.credits || '3',
    corequisites: currentCourse.corequisites || '',
    prerequisites: currentCourse.prerequisites || '',
    lockedRegistrationBlockId: currentCourse.lockedRegistrationBlockId || '',
    isRequired: currentCourse.isRequired || false,
    isLocked: currentCourse.isLocked || false,
    isLearningCommunity: currentCourse.isLearningCommunity || false,
    hasHonors: currentCourse.hasHonors || false,
    hasCorequisites: currentCourse.hasCorequisites || false,
    hasPrerequisites: currentCourse.hasPrerequisites || false,
    hasRequisites: currentCourse.hasRequisites || false,
    hasRestrictions: currentCourse.hasRestrictions || false,
    hasReserveCaps: currentCourse.hasReserveCaps || false,
    hasWritingEnhanced: currentCourse.hasWritingEnhanced || false,
    hasOptional: currentCourse.hasOptional || false,
    hasSectionNotes: currentCourse.hasSectionNotes || false,
    hasFreeTextbook: currentCourse.hasFreeTextbook || false,
    hasLowCostTextbook: currentCourse.hasLowCostTextbook || false,
    courseKey: `${currentCourse.subjectId} ${currentCourse.number}`,
    filteredRegBlockIds: currentCourse.filteredRegBlockIds || [],
    selectedOptionalSectionIds: currentCourse.selectedOptionalSectionIds || [],
    filterRules: currentFilterRules,
    flags: currentCourse.flags || [],
    optionMessages: currentCourse.optionMessages || [],
    addedMessage: currentCourse.addedMessage || null,
    selected: currentCourse.selected !== undefined ? currentCourse.selected : true,
  };
}

/**
 * Show save message
 */
function showSaveMessage(message: string, type: string): void {
  const saveMessage = document.getElementById('saveMessage');
  if (saveMessage) {
    saveMessage.textContent = message;
    saveMessage.className = `save-message ${type}`;
    saveMessage.style.display = 'block';
  }
}

/**
 * Reset save button state
 */
function resetSaveButtonState(): void {
  const saveBtn = document.getElementById('saveAndCloseBtn') as HTMLButtonElement;
  if (!saveBtn) return;

  const buttonText = saveBtn.querySelector('.button-text') as HTMLElement;
  const buttonSpinner = saveBtn.querySelector('.button-spinner') as HTMLElement;

  saveBtn.disabled = false;
  if (buttonText) buttonText.style.display = 'inline';
  if (buttonSpinner) buttonSpinner.style.display = 'none';
}

/**
 * Redirect back to course list
 */
function redirectToCourseList(): void {
  try {
    const term = extractTermFromUrl();
    if (term) {
      window.location.href = `https://tamu.collegescheduler.com/terms/${term}/courses`;
    } else {
      // Fallback: try to go back in history
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  } catch (error) {
    errorLog('Error during redirect:', error);
  }
}

