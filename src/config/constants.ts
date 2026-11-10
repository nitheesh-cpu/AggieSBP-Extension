// Configuration constants
export const DEBUG_MODE = import.meta.env.DEV === true;

export const API_BASE_URL = 'https://tamu.collegescheduler.com/api';
export const EXTERNAL_API_BASE = 'https://api-aggiesbp.nitheeshk.com';
export const COURSE_DETAILS_BASE = 'https://aggieschedulebuilderplus.vercel.app';

/**
 * Tags a link into the website so its analytics can tell extension traffic
 * apart, and which part of the extension it came from (`medium`).
 */
export function withUtm(url: string, medium: string): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'extension');
  u.searchParams.set('utm_medium', medium);
  return u.toString();
}

export const CACHE_TTL_MINUTES = 30;
export const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
