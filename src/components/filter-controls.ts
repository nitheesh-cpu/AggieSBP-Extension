import { MultiSelect } from './multi-select';
import { store } from '../state/store';
import { errorLog } from '../utils/debug';
import { ATTRIBUTE_NAMES, DAY_OPTIONS } from '../config/constants';
import { handleFilterChange } from '../handlers/filter-handlers';

/**
 * Get instructor options from all sections data
 * @returns {Array} Array of option objects
 */
function getInstructorOptions(): Array<{ value: string; label: string }> {
  const allSectionsData = store.get('allSectionsData');
  const instructors = new Set<string>();

  allSectionsData.forEach((section: any) => {
    if (section.instructor && section.instructor !== 'Unknown') {
      instructors.add(section.instructor);
    }
  });

  return Array.from(instructors)
    .sort()
    .map((instructor) => ({
      value: instructor,
      label: instructor,
    }));
}

/**
 * Get section attribute options
 * @returns {Array} Array of option objects
 */
function getSectionAttributeOptions(): Array<{ value: string; label: string }> {
  const attributes = new Set<string>();
  const currentFilterRules = store.get('currentFilterRules');
  const allSectionsData = store.get('allSectionsData');

  // Add attributes from filterRules
  if (currentFilterRules) {
    currentFilterRules.forEach((rule: any) => {
      if (rule.type === 'sectionAttributes' && rule.values) {
        rule.values.forEach((valueString: string) => {
          try {
            const parsed = JSON.parse(valueString);
            if (parsed.value) {
              attributes.add(parsed.value);
            }
          } catch (e) {
            if (typeof valueString === 'string' && valueString.includes('DIST')) {
              attributes.add('DIST');
            }
          }
        });
      }
    });
  }

  // Add attributes from sections data
  allSectionsData.forEach((section: any) => {
    if (section.sectionAttributes) {
      section.sectionAttributes.forEach((attr: any) => {
        if (attr.value) {
          attributes.add(attr.value);
        }
      });
    }
  });

  // Add common section attributes
  const commonAttributes = ['DIST', 'ACST', 'ONLINE', 'HYBRID'];
  commonAttributes.forEach((attr) => attributes.add(attr));

  return Array.from(attributes)
    .sort()
    .map((attribute) => ({
      value: attribute,
      label: ATTRIBUTE_NAMES[attribute] || attribute,
    }));
}

/**
 * Initialize multi-select dropdowns for filters
 */
export function initializeMultiSelectFilters(): void {
  // Initialize instructor filter
  const instructorOptions = getInstructorOptions();
  const instructorContainer = document.getElementById('instructorFilter');
  if (instructorContainer) {
    (window as any).instructorMultiSelect = new MultiSelect(instructorContainer, {
      options: instructorOptions,
      placeholder: 'Select instructors...',
      onChange: () => onFilterChange(),
    });
  }

  // Initialize section attribute filter
  const attributeOptions = getSectionAttributeOptions();
  const attributeContainer = document.getElementById('sectionAttributeFilter');
  if (attributeContainer) {
    (window as any).sectionAttributeMultiSelect = new MultiSelect(attributeContainer, {
      options: attributeOptions,
      placeholder: 'Select attributes...',
      onChange: () => onFilterChange(),
    });
  }

  // Initialize day filter
  const dayContainer = document.getElementById('dayFilter');
  if (dayContainer) {
    (window as any).dayMultiSelect = new MultiSelect(dayContainer, {
      options: [...DAY_OPTIONS],
      placeholder: 'Select days...',
      onChange: () => onFilterChange(),
    });
  }

  // Apply initial filters based on filterRules
  applyInitialFilters();
}

/**
 * Apply initial filters based on course filterRules
 */
function applyInitialFilters(): void {
  const currentFilterRules = store.get('currentFilterRules');
  if (!currentFilterRules || currentFilterRules.length === 0) return;

  currentFilterRules.forEach((rule: any) => {
    if (rule.type === 'sectionAttributes' && rule.values) {
      const selectedAttributes: string[] = [];
      rule.values.forEach((valueString: string) => {
        try {
          const parsed = JSON.parse(valueString);
          if (parsed.value) {
            selectedAttributes.push(parsed.value);
          }
        } catch (e) {
          console.warn('Could not parse filter rule value:', valueString);
        }
      });

      if (selectedAttributes.length > 0 && (window as any).sectionAttributeMultiSelect) {
        (window as any).sectionAttributeMultiSelect.setSelectedValues(selectedAttributes);
      }
    }
  });

  // Apply the filters after setting initial values
  setTimeout(() => onFilterChange(), 100);
}

/**
 * Handle filter changes
 */
function onFilterChange(): void {
  handleFilterChange();
}

/**
 * Add filter controls to the page
 * @param {HTMLElement} container - Container element
 */
export async function addFilterControls(container: HTMLElement): Promise<void> {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'course-filter-container';

  try {
    // Load the filter controls template
    const response = await fetch(chrome.runtime.getURL('/templates/filter-controls.html'));
    const templateHtml = await response.text();
    filterContainer.innerHTML = templateHtml;

    // Add filter container to the page
    container.prepend(filterContainer);

    // Initialize multi-select dropdowns
    initializeMultiSelectFilters();

    // Add event listeners for other filters
    const searchFilter = document.getElementById('searchFilter');
    const honorsFilter = document.getElementById('honorsFilter');
    const prereqFilter = document.getElementById('prereqFilter');
    const openSeatsFilter = document.getElementById('openSeatsFilter');

    if (searchFilter) {
      searchFilter.addEventListener('input', onFilterChange);
    }
    if (honorsFilter) {
      honorsFilter.addEventListener('change', onFilterChange);
    }
    if (prereqFilter) {
      prereqFilter.addEventListener('change', onFilterChange);
    }
    if (openSeatsFilter) {
      openSeatsFilter.addEventListener('change', onFilterChange);
    }
  } catch (error) {
    errorLog('Error loading filter controls template:', error);
    // Fallback to basic filter controls if template fails to load
    filterContainer.innerHTML = `
      <div class="filter-header">
        <h3>Filter Sections</h3>
      </div>
      <div class="filter-options">
        <div class="filter-group filter-search">
          <label for="searchFilter">Search:</label>
          <input type="text" id="searchFilter" placeholder="Search titles, CRN...">
        </div>
      </div>
    `;
    container.prepend(filterContainer);
  }
}

