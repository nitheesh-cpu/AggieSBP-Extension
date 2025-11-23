import { store } from '../state/store';
import { debugLog } from './debug';

/**
 * Prevent unintended page refreshes
 */
export function preventPageRefresh(): void {
  // Prevent form submissions that might cause page refresh
  document.addEventListener(
    'submit',
    (e) => {
      const isBeautifierActive = store.get('isBeautifierActive');
      if (isBeautifierActive) {
        e.preventDefault();
        e.stopPropagation();
        debugLog('Prevented form submission while beautifier is active');
      }
    },
    true
  );

  // Override window.location.reload if needed
  const originalReload = window.location.reload;
  window.location.reload = function (...args) {
    const isBeautifierActive = store.get('isBeautifierActive');
    if (isBeautifierActive) {
      debugLog('Prevented window.location.reload while beautifier is active');
      return;
    }
    return originalReload.apply(this, args);
  };
}

