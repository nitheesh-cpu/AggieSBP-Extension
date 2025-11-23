// Configuration constants
export const DEBUG_MODE = true;

export const API_BASE_URL = 'https://tamu.collegescheduler.com/api';
export const EXTERNAL_API_BASE = 'https://api-aggiesbp.servehttp.com';
export const COURSE_DETAILS_BASE = 'https://aggieschedulebuilderplus.vercel.app';

export const CACHE_TTL_MINUTES = 30;
export const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const COLOR_SCHEMES = {
  default: {
    primary: '#4285f4',
    secondary: '#f5f5f5',
    accent: '#fbbc05',
    text: '#333333',
    background: '#ffffff',
  },
  maroon: {
    primary: '#500000',
    secondary: '#f5f5f5',
    accent: '#8d847d',
    text: '#333333',
    background: '#ffffff',
  },
} as const;

export const DAY_OPTIONS = [
  { value: 'M', label: 'Monday' },
  { value: 'T', label: 'Tuesday' },
  { value: 'W', label: 'Wednesday' },
  { value: 'R', label: 'Thursday' },
  { value: 'F', label: 'Friday' },
  { value: 'S', label: 'Saturday' },
  { value: 'U', label: 'Sunday' },
] as const;

export const ATTRIBUTE_NAMES: Record<string, string> = {
  DIST: 'Distance Education',
  ACST: 'College Station',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
};

