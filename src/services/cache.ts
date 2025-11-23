import { CACHE_TTL_MINUTES } from '../config/constants';
import { debugLog } from '../utils/debug';

interface CacheItem {
  value: any;
  timestamp: number;
  expiry: number;
}

/**
 * Cache utilities for storing and retrieving data
 */
export const CacheUtils = {
  /**
   * Get cached data synchronously from localStorage (fast path)
   * @param {string} key - Cache key
   * @returns {any|null}
   */
  getCachedDataSync(key: string): any | null {
    try {
      const result = localStorage.getItem(`aggie_cache_${key}`);
      if (result) {
        const item: CacheItem = JSON.parse(result);
        const now = Date.now();
        if (item.expiry && now <= item.expiry) {
          return item.value;
        } else {
          localStorage.removeItem(`aggie_cache_${key}`);
        }
      }
    } catch (error) {
      debugLog('Sync cache lookup error:', error);
    }
    return null;
  },

  /**
   * Get cached data asynchronously from chrome.storage
   * @param {string} key - Cache key
   * @returns {Promise<any|null>}
   */
  async get(key: string): Promise<any | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          debugLog('Cache lookup error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }

        const item = result[key] as CacheItem | undefined;
        if (!item || !item.timestamp || !item.expiry) {
          resolve(null);
          return;
        }

        const now = Date.now();
        if (now > item.expiry) {
          chrome.storage.local.remove(key, () => {
            debugLog(`Removed expired cache key: ${key}`);
          });
          resolve(null);
        } else {
          resolve(item.value);
        }
      });
    });
  },

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlMinutes - Time to live in minutes
   * @returns {Promise<void>}
   */
  store(key: string, data: any, ttlMinutes: number = CACHE_TTL_MINUTES): Promise<void> {
    const now = Date.now();
    const item: CacheItem = {
      value: data,
      timestamp: now,
      expiry: now + ttlMinutes * 60 * 1000,
    };

    // Also cache in localStorage for faster synchronous access
    try {
      localStorage.setItem(`aggie_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      debugLog('localStorage cache error:', error);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: item }, () => {
        if (chrome.runtime.lastError) {
          debugLog('Cache storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          debugLog(`Cached data for key: ${key}`);
          resolve();
        }
      });
    });
  },

  /**
   * Clean up expired cache entries
   * @returns {Promise<number>} Number of keys removed
   */
  cleanupExpired(): Promise<number> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const now = Date.now();
        const keysToRemove: string[] = [];

        for (const key in items) {
          const item = items[key] as CacheItem | undefined;
          if (item && item.expiry && now > item.expiry) {
            keysToRemove.push(key);
          }
        }

        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            console.log('Cleaned up expired cache keys:', keysToRemove);
            resolve(keysToRemove.length);
          });
        } else {
          resolve(0);
        }
      });
    });
  },

  /**
   * Clear cache for specific course
   * @param {string} courseId - Course ID
   * @returns {Promise<void>}
   */
  clearCourse(courseId: string): Promise<void> {
    const keys = [`course_${courseId}`, `sections_${courseId}`];

    // Clear localStorage cache too
    try {
      localStorage.removeItem(`aggie_cache_course_${courseId}`);
      localStorage.removeItem(`aggie_cache_sections_${courseId}`);
    } catch (error) {
      debugLog('Error clearing localStorage cache:', error);
    }

    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => {
        debugLog('Cleared cache for course:', courseId);
        resolve();
      });
    });
  },
};

