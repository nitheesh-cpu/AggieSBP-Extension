import { API_BASE_URL } from '../config/constants';
import { getXSRFToken } from '../utils/dom';
import { extractTermFromUrl } from '../utils/page-detector';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Make API request with proper headers
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const xsrfToken = getXSRFToken();
  
  const defaultHeaders: Record<string, string> = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    priority: 'u=1, i',
    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'XMLHttpRequest',
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
 * @param {string} courseId - Course ID
 * @returns {Promise<Object|null>}
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

/**
 * Get sections for a course
 * @param {string} subjectId - Subject ID
 * @param {string} number - Course number
 * @returns {Promise<Object|null>}
 */
export async function getSections(subjectId: string, number: string): Promise<any | null> {
  const term = extractTermFromUrl();
  if (!term) {
    errorLog('Could not extract term from URL');
    return null;
  }

  const requestUrl = `${API_BASE_URL}/terms/${term}/subjects/${subjectId}/courses/${number}/regblocks`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      referrer: location.href,
      referrerPolicy: 'strict-origin-when-cross-origin',
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    });

    const data = await response.json();
    console.log('Registration data:', data);
    return data;
  } catch (error) {
    errorLog('Error fetching sections data:', error);
    return null;
  }
}

/**
 * Get term data
 * @returns {Promise<Object|null>}
 */
export async function getTermData(): Promise<any | null> {
  const term = extractTermFromUrl();
  if (!term) {
    errorLog('Could not extract term from URL');
    return null;
  }

  const termDataUrl = `${API_BASE_URL}/term-data/${term}`;
  debugLog('Fetching term data from:', termDataUrl);

  try {
    const response = await fetch(termDataUrl, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      referrer: location.href,
      referrerPolicy: 'strict-origin-when-cross-origin',
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Term data fetched successfully:', data);
    return data;
  } catch (error) {
    errorLog('Error fetching term data:', error);
    return null;
  }
}

/**
 * Update course filter rules
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Course data with filter rules
 * @returns {Promise<Response>}
 */
export async function updateCourseFilterRules(courseId: string, courseData: any): Promise<Response> {
  const term = extractTermFromUrl();
  if (!term) {
    throw new Error('Could not extract term from URL');
  }

  const url = `${API_BASE_URL}/terms/${term}/desiredcourses/${courseId}`;
  
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  });
}

