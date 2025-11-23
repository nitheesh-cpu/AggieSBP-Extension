import { showLoadingScreen, hideLoadingScreen } from '../components/loading-screen';
import { setupObserver, disableBeautifier } from '../pages/sections-page';
import { setupMainScheduleObserver } from '../pages/schedule-page';
import { CacheUtils } from '../services/cache';
import { store } from '../state/store';
import { isRegistrationPage, isMainCoursesPage } from '../utils/page-detector';
import { debugLog } from '../utils/debug';
import { exposeDebugUtils } from '../utils/debug';
import { loadStylesheets } from '../utils/styles';
import { preventPageRefresh } from '../utils/page-refresh';
import { applySettings } from '../utils/settings';

/**
 * Initialize the extension
 */
(async function init() {
  debugLog('DOM fully loaded and parsed');

  // Load stylesheets first for proper priority
  await loadStylesheets();

  // Set up page refresh prevention
  preventPageRefresh();

  // Run cache cleanup in background (non-blocking)
  CacheUtils.cleanupExpired().catch((error: unknown) => {
    console.error('Error during cache cleanup:', error);
  });

  // Track initialization state to prevent double initialization
  let isInitializing = false;
  let lastInitializedUrl = '';

  // Function to initialize beautifier based on current page
  async function initializeBeautifier(): Promise<void> {
    const currentUrl = location.href;
    
    // Prevent double initialization on the same URL
    if (isInitializing || lastInitializedUrl === currentUrl) {
      debugLog('Skipping initialization - already initializing or already initialized for this URL');
      return;
    }

    isInitializing = true;
    lastInitializedUrl = currentUrl;

    try {
      const items = await chrome.storage.sync.get({
        beautifierEnabled: false,
        colorScheme: 'default',
        compactMode: false,
      });

      store.update({
        currentSettings: {
          colorScheme: items.colorScheme,
          compactMode: items.compactMode,
        },
        isBeautifierActive: items.beautifierEnabled,
      });

      debugLog('Beautifier initialized with settings:', store.get('currentSettings'));
      debugLog('Beautifier enabled:', items.beautifierEnabled);
      debugLog('Current URL:', currentUrl);
      debugLog('Is registration page:', isRegistrationPage());
      debugLog('Is main courses page:', isMainCoursesPage());

      // Only run beautifier if it's enabled and we're on a supported page
      if (items.beautifierEnabled) {
        if (isRegistrationPage()) {
          debugLog('Setting up observer for registration page');
          await setupObserver();
        }
        if (isMainCoursesPage()) {
          debugLog('Beautifying main schedule');
          await setupMainScheduleObserver();
          // beautifyExistingTables is called inside setupMainScheduleObserver
        }
      }

      // If beautifier is not enabled or page doesn't match, make sure no loading screen is shown
      if (!items.beautifierEnabled || (!isRegistrationPage() && !isMainCoursesPage())) {
        hideLoadingScreen();
      }
    } finally {
      isInitializing = false;
    }
  }

  // Initialize on page load
  await initializeBeautifier();

  // Listen for navigation events (SPA navigation)
  let lastUrl = location.href;
  const checkUrlChange = () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl && currentUrl !== lastInitializedUrl) {
      lastUrl = currentUrl;
      lastInitializedUrl = ''; // Reset to allow initialization on new URL
      debugLog('URL changed, re-initializing beautifier:', currentUrl);
      // Small delay to let the page update
      setTimeout(() => {
        initializeBeautifier();
      }, 300); // Increased delay to ensure page is ready
    }
  };

  // Check for URL changes periodically (for SPA navigation)
  setInterval(checkUrlChange, 1000); // Increased interval to reduce false triggers

  // Also listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      initializeBeautifier();
    }, 100);
  });

  // Set up periodic cache cleanup (every 10 minutes) - runs in background
  setInterval(() => {
    CacheUtils.cleanupExpired().catch((error: unknown) => {
      console.error('Error during periodic cache cleanup:', error);
    });
  }, 10 * 60 * 1000);

  // Expose debug utilities
  exposeDebugUtils({
    CacheUtils,
    currentCourse: () => store.get('currentCourse'),
    selectedCRNs: () => Array.from(store.get('selectedCRNs') as Set<string>),
    currentFilterRules: () => store.get('currentFilterRules'),
    allSectionsData: () => store.get('allSectionsData'),
  });
})();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener(async function (
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  if (message.action === 'toggleBeautifier') {
    store.set('isBeautifierActive', message.enabled);
    if (message.enabled) {
      // Show loading screen when enabling beautifier
      showLoadingScreen();
      if (isRegistrationPage()) {
        await setupObserver();
      }
      if (isMainCoursesPage()) {
        await setupMainScheduleObserver();
      }
    } else {
      if (isRegistrationPage()) {
        disableBeautifier();
      }
      // TODO: Add disable for schedule page
      hideLoadingScreen();
    }
  } else if (message.action === 'updateSettings') {
    store.set('currentSettings', message.settings);
      const isBeautifierActive = store.get('isBeautifierActive');
      if (isBeautifierActive) {
        applySettings();
      }
  }

  if (message.action === 'check page') {
    const isBeautifierActive = store.get('isBeautifierActive');
    if (isRegistrationPage() && isBeautifierActive) {
      showLoadingScreen();
      await setupObserver();
    }
    if (isMainCoursesPage() && isBeautifierActive) {
      showLoadingScreen();
      await setupMainScheduleObserver();
    }
  }

  sendResponse({ success: true });
  return true;
});

