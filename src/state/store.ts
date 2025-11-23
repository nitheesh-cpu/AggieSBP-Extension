import { debugLog } from '../utils/debug';

interface StoreState {
  originalContent: Node | null;
  isBeautifierActive: boolean;
  currentCourse: any | null;
  currentFilterRules: any[];
  allSectionsData: any[];
  selectedCRNs: Set<string>;
  enrolledCoursesData: any[];
  cartCoursesData: any[];
  isReBeautifying: boolean;
  currentSettings: {
    colorScheme: string;
    compactMode: boolean;
  };
}

/**
 * Global state store for the extension
 */
class Store {
  private state: StoreState;

  constructor() {
    this.state = {
      originalContent: null,
      isBeautifierActive: false,
      currentCourse: null,
      currentFilterRules: [],
      allSectionsData: [],
      selectedCRNs: new Set(),
      enrolledCoursesData: [],
      cartCoursesData: [],
      isReBeautifying: false,
      currentSettings: {
        colorScheme: 'default',
        compactMode: false,
      },
    };
  }

  /**
   * Get state value
   * @param {string} key - State key
   * @returns {any}
   */
  get<K extends keyof StoreState>(key: K): StoreState[K] {
    return this.state[key];
  }

  /**
   * Set state value
   * @param {string} key - State key
   * @param {any} value - Value to set
   */
  set<K extends keyof StoreState>(key: K, value: StoreState[K]): void {
    this.state[key] = value;
    debugLog(`State updated: ${key}`, value);
  }

  /**
   * Update multiple state values
   * @param {Partial<StoreState>} updates - Object with key-value pairs to update
   */
  update(updates: Partial<StoreState>): void {
    Object.assign(this.state, updates);
    debugLog('State updated:', updates);
  }

  /**
   * Get all state
   * @returns {StoreState}
   */
  getAll(): StoreState {
    return { ...this.state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      originalContent: null,
      isBeautifierActive: false,
      currentCourse: null,
      currentFilterRules: [],
      allSectionsData: [],
      selectedCRNs: new Set(),
      enrolledCoursesData: [],
      cartCoursesData: [],
      isReBeautifying: false,
      currentSettings: {
        colorScheme: 'default',
        compactMode: false,
      },
    };
  }
}

// Export singleton instance
export const store = new Store();

