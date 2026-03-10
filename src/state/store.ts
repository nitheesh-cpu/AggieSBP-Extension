import { debugLog } from '../utils/debug';

interface StoreState {
  currentCourse: any | null;
}

/**
 * Global state store for the extension
 */
class Store {
  private state: StoreState;

  constructor() {
    this.state = {
      currentCourse: null,
    };
  }

  /**
   * Get state value
   */
  get<K extends keyof StoreState>(key: K): StoreState[K] {
    return this.state[key];
  }

  /**
   * Set state value
   */
  set<K extends keyof StoreState>(key: K, value: StoreState[K]): void {
    this.state[key] = value;
    debugLog(`State updated: ${key}`, value);
  }

  /**
   * Get all state
   */
  getAll(): StoreState {
    return { ...this.state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      currentCourse: null,
    };
  }
}

// Export singleton instance
export const store = new Store();
