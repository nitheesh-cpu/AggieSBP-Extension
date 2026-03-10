import { initializeProfessorPanel } from '../components/professors-panel';
import { CacheUtils } from '../services/cache';
import { store } from '../state/store';
import { isRegistrationPage } from '../utils/page-detector';
import { debugLog } from '../utils/debug';
import { exposeDebugUtils } from '../utils/debug';

/**
 * Initialize the extension - Professor Comparison only
 */
(async function init() {
  debugLog('AggieSBP Professor Compare initialized');

  // Run cache cleanup in background (non-blocking)
  CacheUtils.cleanupExpired().catch((error: unknown) => {
    console.error('Error during cache cleanup:', error);
  });

  // Track initialization state to prevent double initialization
  let isInitializing = false;
  let lastInitializedUrl = '';

  // Function to clean up professor panel when leaving sections page
  function cleanupProfessorPanel(): void {
    const existingPanel = document.getElementById('professor-compare-panel');
    const existingToggle = document.getElementById('prof-toggle-btn');
    const existingCompareBar = document.getElementById('professor-compare-bar');

    if (existingPanel) existingPanel.remove();
    if (existingToggle) existingToggle.remove();
    if (existingCompareBar) existingCompareBar.remove();

    debugLog('Professor panel cleaned up');
  }

  // Function to initialize professor panel based on current page
  async function initializeProfessorCompare(): Promise<void> {
    const currentUrl = location.href;

    // Prevent double initialization on the same URL
    if (isInitializing || lastInitializedUrl === currentUrl) {
      debugLog('Skipping initialization - already initializing or already initialized for this URL');
      return;
    }

    // Only run on sections pages - cleanup if not
    if (!isRegistrationPage()) {
      debugLog('Not on a sections page, cleaning up professor panel');
      cleanupProfessorPanel();
      return;
    }

    isInitializing = true;
    lastInitializedUrl = currentUrl;

    try {
      debugLog('Current URL:', currentUrl);
      debugLog('Is sections page:', isRegistrationPage());

      // Initialize professor panel
      await initializeProfessorPanel();
    } finally {
      isInitializing = false;
    }
  }

  // Initialize on page load
  await initializeProfessorCompare();

  // Listen for navigation events (SPA navigation)
  let lastUrl = location.href;
  const checkUrlChange = () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      lastInitializedUrl = ''; // Reset to allow initialization on new URL
      debugLog('URL changed, checking page type:', currentUrl);
      setTimeout(async () => {
        await initializeProfessorCompare();
      }, 500);
    }
  };

  // Check for URL changes periodically (for SPA navigation)
  setInterval(checkUrlChange, 1000);

  // Also listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    lastInitializedUrl = ''; // Reset to allow re-check
    setTimeout(async () => {
      await initializeProfessorCompare();
    }, 300);
  });

  // Set up periodic cache cleanup (every 10 minutes)
  setInterval(() => {
    CacheUtils.cleanupExpired().catch((error: unknown) => {
      console.error('Error during periodic cache cleanup:', error);
    });
  }, 10 * 60 * 1000);

  // Expose debug utilities
  exposeDebugUtils({
    CacheUtils,
    currentCourse: () => store.get('currentCourse'),
  });
})();
