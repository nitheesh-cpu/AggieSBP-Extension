import { store } from '../state/store';
import { debugLog } from '../utils/debug';
// redistributeSections is defined in this file to avoid circular dependency
import { createSectionTableRow } from '../components/section-table-row';
import { setupCardEventHandlers } from './card-handlers';

/**
 * Handle filter changes and update displayed sections
 */
export async function handleFilterChange(): Promise<void> {
  const selectedInstructors = (window as any).instructorMultiSelect
    ? (window as any).instructorMultiSelect.getSelectedValues()
    : [];
  const selectedAttributes = (window as any).sectionAttributeMultiSelect
    ? (window as any).sectionAttributeMultiSelect.getSelectedValues()
    : [];
  const selectedDays = (window as any).dayMultiSelect
    ? (window as any).dayMultiSelect.getSelectedValues()
    : [];
  const searchValue = (document.getElementById('searchFilter') as HTMLInputElement)?.value.toLowerCase() || '';
  const honorsChecked = (document.getElementById('honorsFilter') as HTMLInputElement)?.checked || false;
  const noPrereqChecked = (document.getElementById('prereqFilter') as HTMLInputElement)?.checked || false;
  const openSeatsChecked = (document.getElementById('openSeatsFilter') as HTMLInputElement)?.checked || false;

  // Update filterRules based on current selections
  updateFilterRules(selectedInstructors, selectedAttributes);

  const allSectionsData = store.get('allSectionsData');

  // Filter sections based on criteria
  const filteredSections = allSectionsData.filter((section: any) => {
    let passesFilter = true;

    // Instructor filter
    if (selectedInstructors.length > 0 && passesFilter) {
      passesFilter = selectedInstructors.includes(section.instructor);
    }

    // Section attribute filter
    if (selectedAttributes.length > 0 && passesFilter) {
      let hasAttribute = false;

      // Check section attributes
      if (section.sectionAttributes) {
        section.sectionAttributes.forEach((attr: any) => {
          if (selectedAttributes.includes(attr.value)) {
            hasAttribute = true;
          }
        });
      }

      // Special check for distance education
      if (!hasAttribute && selectedAttributes.includes('DIST')) {
        if (
          section.instructionMode &&
          section.instructionMode.includes('Web Based')
        ) {
          hasAttribute = true;
        }
        // Check meeting location
        if (section.meetingTimes) {
          section.meetingTimes.forEach((meeting: any) => {
            if (meeting.location && meeting.location.includes('ONLINE')) {
              hasAttribute = true;
            }
          });
        }
      }

      passesFilter = hasAttribute;
    }

    // Day filter
    if (selectedDays.length > 0 && passesFilter) {
      let hasDay = false;
      if (section.meetingTimes) {
        section.meetingTimes.forEach((meeting: any) => {
          if (meeting.days) {
            selectedDays.forEach((day: string) => {
              if (meeting.days.includes(day)) {
                hasDay = true;
              }
            });
          }
        });
      }
      passesFilter = hasDay;
    }

    // Search filter
    if (searchValue && passesFilter) {
      const searchableText = [
        section.title,
        section.crn,
        section.instructor,
        section.subject,
        section.number,
        section.section,
      ]
        .join(' ')
        .toLowerCase();
      passesFilter = searchableText.includes(searchValue);
    }

    // Honors filter
    if (honorsChecked && passesFilter) {
      passesFilter = section.isHonors;
    }

    // No prerequisites filter
    if (noPrereqChecked && passesFilter) {
      passesFilter = !section.hasPrerequisites;
    }

    // Open seats filter
    if (openSeatsChecked && passesFilter) {
      const seatsCount = parseInt(section.seatsOpen) || 0;
      passesFilter = seatsCount > 0;
    }

    return passesFilter;
  });

  // Redistribute sections between tabs
  await redistributeSections(filteredSections);
}

/**
 * Update filterRules based on current selections
 * @param {Array} selectedInstructors - Selected instructor names
 * @param {Array} selectedAttributes - Selected section attributes
 */
export function updateFilterRules(_selectedInstructors: string[], selectedAttributes: string[]): void {
  const allSectionsData = store.get('allSectionsData');
  if (!allSectionsData || allSectionsData.length === 0) {
    debugLog('No sections data available for filter rules update');
    return;
  }

  let currentFilterRules = store.get('currentFilterRules');

  // Clear existing sectionAttributes and registrationNumber rules
  currentFilterRules = currentFilterRules.filter(
    (rule: any) =>
      rule.type !== 'sectionAttributes' && rule.type !== 'registrationNumber'
  );

  // Add new sectionAttributes rules based on selected attributes
  if (selectedAttributes && selectedAttributes.length > 0) {
    selectedAttributes.forEach((attribute) => {
      const newRule = {
        type: 'sectionAttributes',
        values: [JSON.stringify({ attr: null, value: attribute })],
        value: null,
        excluded: false,
      };
      currentFilterRules.push(newRule);
    });
  }

  // Add excluded registration numbers for unselected courses
  const selectedCRNs = store.get('selectedCRNs');
  const allAvailableCRNs = allSectionsData
    .filter((section: any) => section.isEnabled)
    .map((section: any) => section.crn);

  const unselectedCRNs = allAvailableCRNs.filter(
    (crn: string) => !selectedCRNs.has(crn)
  );

  if (unselectedCRNs.length > 0) {
    const excludedRule = {
      type: 'registrationNumber',
      excluded: true,
      values: unselectedCRNs,
    };
    currentFilterRules.push(excludedRule);
    debugLog('Adding excluded registration numbers:', unselectedCRNs);
  }

  store.set('currentFilterRules', currentFilterRules);
  debugLog('Updated filterRules:', currentFilterRules);
  debugLog('Selected CRNs:', Array.from(selectedCRNs));
  debugLog('All available CRNs:', allAvailableCRNs);
}

/**
 * Redistribute sections between enabled and disabled tabs
 * @param {Array} filteredSections - Filtered sections to display
 */
export async function redistributeSections(filteredSections: any[]): Promise<void> {
  const enabledContent = document.getElementById('enabled-sections');
  const disabledContent = document.getElementById('disabled-sections');

  if (!enabledContent || !disabledContent) {
    debugLog('Tab content containers not found');
    return;
  }

  // Clear existing content
  enabledContent.innerHTML = '';
  disabledContent.innerHTML = '';

  const allSectionsData = store.get('allSectionsData');

  // Separate filtered sections into enabled and those that don't pass filters
  const enabledSections: any[] = [];
  const disabledSections: any[] = [];

  allSectionsData.forEach((section: any) => {
    if (filteredSections.includes(section) && section.isEnabled) {
      enabledSections.push(section);
    } else {
      disabledSections.push(section);
    }
  });

  // Create table for enabled sections
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
    noSectionsMsg.textContent = 'No available sections match the current filters.';
    enabledContent.appendChild(noSectionsMsg);
  }

  // Create table for disabled sections
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

  // Update tab counts
  updateTabCounts(enabledSections.length, disabledSections.length);

  // Re-setup event handlers for new cards
  setupCardEventHandlers();
}

/**
 * Update tab counts
 * @param {number} enabledCount - Number of enabled sections
 * @param {number} disabledCount - Number of disabled sections
 */
function updateTabCounts(enabledCount: number, disabledCount: number): void {
  const enabledTab = document.getElementById('enabled-tab');
  const disabledTab = document.getElementById('disabled-tab');

  if (enabledTab) {
    enabledTab.textContent = `Available Sections (${enabledCount})`;
  }

  if (disabledTab) {
    disabledTab.textContent = `Unavailable Sections (${disabledCount})`;
  }
}

