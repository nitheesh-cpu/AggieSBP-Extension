import { API_BASE_URL } from '../config/constants';
import { extractTermFromUrl } from '../utils/page-detector';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Get XSRF token from cookies
 */
function getXSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Make API request with proper headers
 */
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const xsrfToken = getXSRFToken();

  const defaultHeaders: Record<string, string> = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    ...(xsrfToken && { 'x-xsrf-token': xsrfToken }),
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    referrer: location.href,
    referrerPolicy: 'strict-origin-when-cross-origin',
    mode: 'cors',
    credentials: 'include',
  });

  return response;
}

/**
 * Get selected course data
 * @param courseId - Course ID
 */
export async function getSelectedCourseData(courseId: string): Promise<any | null> {
  const term = extractTermFromUrl();
  if (!term) {
    errorLog('Could not extract term from URL');
    return null;
  }

  const requestUrl = `${API_BASE_URL}/terms/${term}/desiredcourses/`;

  try {
    const response = await apiRequest(requestUrl, { method: 'GET' });
    const data = await response.json();
    const course = data.find((course: any) => course.id === courseId);
    debugLog('Course data:', course);
    return course;
  } catch (error) {
    errorLog('Error fetching course data:', error);
    return null;
  }
}
