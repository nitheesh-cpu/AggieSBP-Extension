import { store } from '../state/store';
import { COLOR_SCHEMES } from '../config/constants';

/**
 * Apply user settings (color scheme, compact mode, etc.)
 */
export function applySettings(): void {
  // Remove any existing dynamic theme styles
  const existingDynamicStyles = document.querySelector('style[data-dynamic-theme]');
  if (existingDynamicStyles) {
    existingDynamicStyles.remove();
  }

  // Add custom CSS based on user settings
  const dynamicCSS = document.createElement('style');
  dynamicCSS.setAttribute('data-dynamic-theme', 'true');

  const currentSettings = store.get('currentSettings');
  const colors = COLOR_SCHEMES[currentSettings.colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;

  // Define dynamic CSS that depends on color scheme
  dynamicCSS.textContent = `
    /* Dynamic Color Scheme Styles */
    .course-card {
      background-color: ${colors.background};
    }
    
    .card-header,
    .card-header.seats-available {
      background-color: ${colors.primary};
    }
    
    .card-body {
      color: ${colors.text};
    }
    
    .detail-value {
      color: ${colors.text};
    }
    
    .meeting-times {
      background-color: ${colors.secondary};
    }
    
    .meeting-times h4 {
      color: ${colors.text};
    }
    
    .meeting-time {
      background-color: ${colors.background};
      border-left: 3px solid ${colors.accent};
    }
    
    .card-footer {
      background-color: ${colors.secondary};
    }
    
    .details-button {
      background-color: ${colors.primary};
    }
    
    .details-button:hover {
      background-color: ${colors.primary}dd;
    }
    
    .tab-button:hover {
      color: ${colors.primary};
    }
    
    .tab-button.active {
      color: ${colors.primary};
      border-bottom-color: ${colors.primary};
    }
  `;

  // Add compact mode class to container if enabled
  const container = document.querySelector('.course-cards-container');
  if (container) {
    if (currentSettings.compactMode) {
      container.classList.add('compact-mode');
    } else {
      container.classList.remove('compact-mode');
    }
  }

  document.head.appendChild(dynamicCSS);
}

