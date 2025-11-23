import { DEBUG_MODE } from '../config/constants';

/**
 * Debug logging function
 * @param {...any} args - Arguments to log
 */
export function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log('[Aggie Beautifier]', ...args);
  }
}

/**
 * Error logging function
 * @param {...any} args - Arguments to log
 */
export function errorLog(...args: any[]): void {
  console.error('[Aggie Beautifier]', ...args);
}

/**
 * Make debug utilities available globally in debug mode
 * @param {Object} utils - Utilities to expose
 */
export function exposeDebugUtils(utils: Record<string, any>): void {
  if (DEBUG_MODE) {
    (window as any).aggieExtension = {
      ...(window as any).aggieExtension,
      ...utils,
    };
    debugLog('Debug functions available at window.aggieExtension');
  }
}

