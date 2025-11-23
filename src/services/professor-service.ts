import { EXTERNAL_API_BASE, COURSE_DETAILS_BASE } from '../config/constants';
import { debugLog, errorLog } from '../utils/debug';

// Cache for professor IDs to avoid repeated API calls
const professorIdCache = new Map<string, string | null>();

// Cache for course data to avoid repeated API calls
const courseDataCache = new Map<string, any | null>();

/**
 * Fetch course data from external API
 * @param {string} courseId - Course ID (e.g., "AGEC105")
 * @returns {Promise<Object|null>}
 */
export async function fetchCourseData(courseId: string): Promise<any | null> {
  // Check cache first
  if (courseDataCache.has(courseId)) {
    return courseDataCache.get(courseId);
  }

  try {
    const apiUrl = `${EXTERNAL_API_BASE}/course/${courseId}`;
    debugLog(`Fetching course data for: ${courseId}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch course data for ${courseId}: ${response.status}`);
      courseDataCache.set(courseId, null);
      return null;
    }

    const data = await response.json();
    debugLog(`Found course data for ${courseId}:`, data);
    courseDataCache.set(courseId, data);
    return data;
  } catch (error) {
    errorLog(`Error fetching course data for ${courseId}:`, error);
    courseDataCache.set(courseId, null);
    return null;
  }
}

/**
 * Fetch professor ID from external API
 * @param {string} professorName - Professor name
 * @returns {Promise<string|null>}
 */
export async function fetchProfessorId(professorName: string): Promise<string | null> {
  // Check cache first
  if (professorIdCache.has(professorName)) {
    return professorIdCache.get(professorName) || null;
  }

  try {
    // Skip if instructor is "Unknown" or similar
    if (!professorName || professorName === 'Unknown' || professorName === 'Not Assigned') {
      professorIdCache.set(professorName, null);
      return null;
    }

    const encodedName = encodeURIComponent(professorName);
    const apiUrl = `${EXTERNAL_API_BASE}/professor/find?name=${encodedName}`;

    debugLog(`Fetching professor ID for: ${professorName}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch professor ID for ${professorName}: ${response.status}`);
      professorIdCache.set(professorName, null);
      return null;
    }

    const data = await response.json();

    // Get the first match if available
    if (data.matches && data.matches.length > 0) {
      const professorId = data.matches[0].id;
      debugLog(`Found professor ID for ${professorName}: ${professorId}`);
      professorIdCache.set(professorName, professorId);
      return professorId;
    } else {
      debugLog(`No professor ID found for ${professorName}`);
      professorIdCache.set(professorName, null);
      return null;
    }
  } catch (error) {
    errorLog(`Error fetching professor ID for ${professorName}:`, error);
    professorIdCache.set(professorName, null);
    return null;
  }
}

/**
 * Get professor details URL
 * @param {string} professorId - Professor ID
 * @returns {string}
 */
export function getProfessorDetailsUrl(professorId: string): string {
  return `${COURSE_DETAILS_BASE}/professor/${professorId}`;
}

/**
 * Get course details URL
 * @param {string} courseId - Course ID
 * @returns {string}
 */
export function getCourseDetailsUrl(courseId: string): string {
  return `${COURSE_DETAILS_BASE}/course/${courseId}`;
}

