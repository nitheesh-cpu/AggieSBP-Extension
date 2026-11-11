import {
  initializeProfessorPanel,
  initializeAlertsOnlyPanel,
  initializeScheduleFitPanel,
} from '../components/professors-panel';
import { CacheUtils } from '../services/cache';
import { store } from '../state/store';
import { isRegistrationPage, isCurrentSchedulePage } from '../utils/page-detector';
import { debugLog } from '../utils/debug';
import { exposeDebugUtils } from '../utils/debug';

type PanelMode = 'professors' | 'schedule-fit' | 'alerts';

/** Sections pages get professors; /currentschedule gets schedule fit; everything else gets seat alerts. */
function panelModeForCurrentPage(): PanelMode {
  if (isRegistrationPage()) return 'professors';
  if (isCurrentSchedulePage()) return 'schedule-fit';
  return 'alerts';
}

/**
 * Initialize the extension
 */
(async function init() {
  debugLog('AggieSBP Professor Compare initialized');

  // Run cache cleanup in background (non-blocking)
  CacheUtils.cleanupExpired().catch((error: unknown) => {
    console.error('Error during cache cleanup:', error);
  });

  // URL the sidebar currently in the page was built for.
  let renderedUrl = '';
  // Bumped on every rebuild so a slow professor lookup can't overwrite a newer page's sidebar.
  let generation = 0;

  /**
   * Make sure the sidebar button in the page matches the current URL.
   * Safe to call repeatedly: it only rebuilds when the URL changed or the button went missing
   * (e.g. Schedule Builder re-rendered the page and dropped it).
   */
  function syncPanel(): void {
    const currentUrl = location.href;
    const hasButton = document.getElementById('prof-toggle-btn') !== null;
    if (currentUrl === renderedUrl && hasButton) return;

    renderedUrl = currentUrl;
    const thisGeneration = ++generation;
    const isStale = () => thisGeneration !== generation || location.href !== currentUrl;

    const mode = panelModeForCurrentPage();
    debugLog('Building sidebar:', mode, currentUrl);

    if (mode === 'professors') {
      // Shows the button right away with a loading state, then fills in professors.
      void initializeProfessorPanel(isStale);
    } else if (mode === 'schedule-fit') {
      initializeScheduleFitPanel();
    } else {
      initializeAlertsOnlyPanel();
    }
  }

  syncPanel();

  // Schedule Builder is a SPA: pick up client-side navigation and re-add the button if it disappears.
  setInterval(syncPanel, 1000);
  window.addEventListener('popstate', () => setTimeout(syncPanel, 100));

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
