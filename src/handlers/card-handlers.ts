import { store } from '../state/store';
import { debugLog } from '../utils/debug';
import { updateFilterRules } from './filter-handlers';

/**
 * Set up event handlers for course cards/table rows
 */
export function setupCardEventHandlers(): void {
  // Handle details button clicks (both card and table layouts)
  document.querySelectorAll('.details-button').forEach((button) => {
    button.addEventListener('click', function (this: HTMLElement) {
      const crn = this.dataset.crn;
      if (!crn) return;

      // Check if we're in table layout or card layout
      const row = this.closest('tr.section-table-row') as HTMLElement;
      const card = this.closest('.course-card') as HTMLElement;

      if (row) {
        // Table layout: toggle extended details row
        toggleTableDetailsRow(row, crn, this as HTMLButtonElement);
      } else if (card) {
        // Card layout: toggle details element
        const detailsElement = document.getElementById(`extended-details-${crn}`);
        if (detailsElement) {
          const isVisible = detailsElement.style.display !== 'none';
          detailsElement.style.display = isVisible ? 'none' : 'block';
          const buttonText = isVisible ? 'Show Details' : 'Hide Details';
          if (this instanceof HTMLButtonElement) {
            this.textContent = buttonText;
          }
        }
      }
    });
  });

  // Handle course selection checkboxes (both card and table layouts)
  document
    .querySelectorAll('.course-select input[type="checkbox"], .section-checkbox')
    .forEach((checkbox) => {
      // Remove any existing listeners by cloning the element
      const newCheckbox = checkbox.cloneNode(true) as HTMLInputElement;
      checkbox.parentNode?.replaceChild(newCheckbox, checkbox);

      newCheckbox.addEventListener('change', function (this: HTMLInputElement, event: Event) {
        // Ignore synthetic events
        if (!(event as any).isTrusted) return;

        const row = this.closest('tr.section-table-row') as HTMLElement;
        const card = this.closest('.course-card') as HTMLElement;
        
        let crn: string | undefined;
        if (row) {
          crn = row.dataset.crn;
        } else if (card) {
          crn = card.dataset.crn;
        } else {
          crn = this.dataset.crn;
        }

        if (!crn) return;

        // Update UI
        if (row) {
          row.classList.toggle('selected-course', this.checked);
        } else if (card) {
          card.classList.toggle('selected-course', this.checked);
        }

        // Track the selection state
        const selectedCRNs = store.get('selectedCRNs') as Set<string>;
        if (this.checked) {
          selectedCRNs.add(crn);
        } else {
          selectedCRNs.delete(crn);
        }
        store.set('selectedCRNs', selectedCRNs);
        debugLog('Selected CRNs:', Array.from(selectedCRNs));

        // Sync with original checkbox if it exists
        const originalCheckbox = document.querySelector(`#checkbox_${crn}`) as HTMLInputElement;
        if (originalCheckbox && originalCheckbox.checked !== this.checked) {
          originalCheckbox.checked = this.checked;
          // Trigger change event on original checkbox
          const changeEvent = new Event('change', { bubbles: true });
          originalCheckbox.dispatchEvent(changeEvent);
          debugLog('Synced original checkbox:', crn, this.checked);
        }

        // Update filter rules with current selections
        const selectedInstructors = (window as any).instructorMultiSelect
          ? (window as any).instructorMultiSelect.getSelectedValues()
          : [];
        const selectedAttributes = (window as any).sectionAttributeMultiSelect
          ? (window as any).sectionAttributeMultiSelect.getSelectedValues()
          : [];
        updateFilterRules(selectedInstructors, selectedAttributes);
      });
    });
}

/**
 * Toggle extended details row in table layout
 */
function toggleTableDetailsRow(row: HTMLElement, crn: string, button: HTMLButtonElement): void {
  const tbody = row.closest('tbody');
  if (!tbody) return;

  // Check if details row already exists
  const existingDetailsRow = tbody.querySelector(`tr[data-details-crn="${crn}"]`) as HTMLElement;
  
  if (existingDetailsRow) {
    // Remove existing details row
    existingDetailsRow.remove();
    // Update button title (icon button doesn't have text)
    button.title = 'Show Details';
    // Update SVG stroke to indicate closed state
    const svg = button.querySelector('svg');
    if (svg) {
      svg.setAttribute('stroke', '#500000');
    }
  } else {
    // Create new details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'section-extended-details-row';
    detailsRow.setAttribute('data-details-crn', crn);
    
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 7; // Number of columns
    
    // Get course data and create extended details
    const allSectionsData = store.get('allSectionsData') as any[];
    const sectionData = allSectionsData.find((s: any) => s.crn === crn);
    
    if (sectionData) {
      // Import createExtendedDetails dynamically to avoid circular dependency
      import('../components/extended-details').then(({ createExtendedDetails }) => {
        const detailsContent = createExtendedDetails(sectionData);
        detailsCell.innerHTML = `<div class="section-extended-details-content">${detailsContent}</div>`;
        detailsRow.appendChild(detailsCell);
        
        // Insert after the current row
        row.after(detailsRow);
        // Update button title (icon button doesn't have text)
        button.title = 'Hide Details';
        // Update SVG stroke to indicate open state (darker)
        const svg = button.querySelector('svg');
        if (svg) {
          svg.setAttribute('stroke', '#700000');
        }
      });
    } else {
      detailsCell.innerHTML = '<div class="section-extended-details-content">Details not available.</div>';
      detailsRow.appendChild(detailsCell);
      row.after(detailsRow);
      // Update button title
      button.title = 'Hide Details';
      // Update SVG stroke to indicate open state
      const svg = button.querySelector('svg');
      if (svg) {
        svg.setAttribute('stroke', '#700000');
      }
    }
  }
}

/**
 * Set up event handlers for tabs
 */
export function setupTabEventHandlers(): void {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', function (this: HTMLElement) {
      const targetTab = this.dataset.tab;
      if (!targetTab) return;

      // Update tab buttons
      document.querySelectorAll('.tab-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      this.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
      });

      const targetContent = document.getElementById(`${targetTab}-sections`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

