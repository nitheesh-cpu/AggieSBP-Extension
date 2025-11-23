/**
 * Multi-select dropdown component
 */
export class MultiSelect {
  private container: HTMLElement;
  private options: Array<{ value: string; label: string }>;
  private placeholder: string;
  private selectedValues: string[];
  private onChangeCallback: (values: string[]) => void;

  constructor(container: HTMLElement, options: {
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    label?: string;
    onChange?: (values: string[]) => void;
  } = {}) {
    this.container = container;
    this.options = options.options || [];
    this.placeholder = options.placeholder || 'Select options...';
    // label is accepted in options but not stored (for API compatibility)
    this.selectedValues = [];
    this.onChangeCallback = options.onChange || (() => {});

    this.init();
  }

  private init(): void {
    this.container.innerHTML = `
      <div class="multi-select">
        <div class="multi-select__control">
          <div class="multi-select__value-container">
            <div class="multi-select__selected-values"></div>
            <div class="multi-select__input-container">
              <input type="text" class="multi-select__input" placeholder="${this.placeholder}" readonly>
            </div>
          </div>
          <div class="multi-select__indicators">
            <div class="multi-select__clear" title="Clear All">
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
              </svg>
            </div>
            <div class="multi-select__separator"></div>
            <div class="multi-select__dropdown-indicator">
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="multi-select__menu" style="display: none;">
          <div class="multi-select__options"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderOptions();
  }

  private setupEventListeners(): void {
    const control = this.container.querySelector('.multi-select__control');
    const clearBtn = this.container.querySelector('.multi-select__clear');

    if (!control || !clearBtn) return;

    // Toggle dropdown
    control.addEventListener('click', (e) => {
      if (
        !(e.target as HTMLElement).closest('.multi-select__clear') &&
        !(e.target as HTMLElement).closest('.multi-select__value-remove')
      ) {
        this.toggleDropdown();
      }
    });

    // Clear all selections
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearAll();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });
  }

  private renderOptions(): void {
    const optionsContainer = this.container.querySelector('.multi-select__options');
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    this.options.forEach((option) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'multi-select__option';
      optionEl.textContent = option.label;
      optionEl.dataset.value = option.value;

      if (this.selectedValues.includes(option.value)) {
        optionEl.classList.add('multi-select__option--selected');
      }

      optionEl.addEventListener('click', () => {
        this.toggleOption(option.value);
      });

      optionsContainer.appendChild(optionEl);
    });
  }

  private renderSelectedValues(): void {
    const container = this.container.querySelector('.multi-select__selected-values');
    if (!container) return;

    container.innerHTML = '';

    this.selectedValues.forEach((value) => {
      const option = this.options.find((opt) => opt.value === value);
      if (option) {
        const valueEl = document.createElement('div');
        valueEl.className = 'multi-select__value';
        valueEl.innerHTML = `
          <div class="multi-select__value-label">${option.label}</div>
          <div class="multi-select__value-remove" data-value="${value}">
            <svg width="14" height="14" viewBox="0 0 20 20">
              <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
            </svg>
          </div>
        `;

        const removeBtn = valueEl.querySelector('.multi-select__value-remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeValue(value);
          });
        }

        container.appendChild(valueEl);
      }
    });

    // Update placeholder visibility
    const input = this.container.querySelector('.multi-select__input') as HTMLInputElement;
    if (input) {
      if (this.selectedValues.length > 0) {
        input.placeholder = '';
      } else {
        input.placeholder = this.placeholder;
      }
    }
  }

  private toggleDropdown(): void {
    const menu = this.container.querySelector('.multi-select__menu') as HTMLElement;
    if (!menu) return;

    const isOpen = menu.style.display !== 'none';

    if (isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    const menu = this.container.querySelector('.multi-select__menu') as HTMLElement;
    const control = this.container.querySelector('.multi-select__control');
    if (menu && control) {
      menu.style.display = 'block';
      control.classList.add('multi-select__control--menu-is-open');
    }
  }

  private closeDropdown(): void {
    const menu = this.container.querySelector('.multi-select__menu') as HTMLElement;
    const control = this.container.querySelector('.multi-select__control');
    if (menu && control) {
      menu.style.display = 'none';
      control.classList.remove('multi-select__control--menu-is-open');
    }
  }

  private toggleOption(value: string): void {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(value);
    }

    this.renderOptions();
    this.renderSelectedValues();
    this.onChangeCallback(this.selectedValues);
  }

  private removeValue(value: string): void {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.renderOptions();
      this.renderSelectedValues();
      this.onChangeCallback(this.selectedValues);
    }
  }

  clearAll(): void {
    this.selectedValues = [];
    this.renderOptions();
    this.renderSelectedValues();
    this.onChangeCallback(this.selectedValues);
  }

  setOptions(options: Array<{ value: string; label: string }>): void {
    this.options = options;
    this.renderOptions();
  }

  setSelectedValues(values: string[]): void {
    this.selectedValues = values.slice();
    this.renderOptions();
    this.renderSelectedValues();
  }

  getSelectedValues(): string[] {
    return this.selectedValues.slice();
  }
}

