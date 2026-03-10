import { EXTERNAL_API_BASE, COURSE_DETAILS_BASE } from '../config/constants';
import { debugLog, errorLog } from '../utils/debug';

// Cache for professor IDs to avoid repeated API calls
const professorIdCache = new Map<string, string | null>();

// Cache for course data to avoid repeated API calls
const courseDataCache = new Map<string, any | null>();

// Cache for terms data
let termsCache: any[] | null = null;

// Cache for semester professors
const semesterProfessorsCache = new Map<string, any[] | null>();

// Cache for detailed professor data (with summaries)
const professorDetailsCache = new Map<string, ProfessorDetails[] | null>();

/**
 * Term data from API
 */
interface TermData {
  termCode: string;
  termDesc: string;
  startDate: string;
  endDate: string;
  academicYear: string;
}

/**
 * Professor section data from API
 */
interface SemesterProfessor {
  name: string;
  sections: string[];
  isPrimary: boolean;
  hasCv: boolean;
  cvUrl: string | null;
}

/**
 * Course-specific summary
 */
export interface CourseSummary {
  courseCode: string;
  teaching?: string | null;
  exams?: string | null;
  grading?: string | null;
  workload?: string | null;
  personality?: string | null;
  policies?: string | null;
  other?: string | null;
  reviewCount: number;
}

/**
 * Overall professor summary
 */
export interface OverallSummary {
  sentiment?: string;
  strengths?: string[];
  complaints?: string[];
  consistency?: string;
  reviewCount: number;
}

/**
 * Detailed professor data with all summaries
 */
export interface ProfessorDetails {
  id: string;
  name: string;
  rating?: number;
  totalReviews: number;
  grades?: {
    avgGpa?: number;
    totalStudents?: number;
    distribution?: Record<string, number>;
  };
  courseSummary?: CourseSummary;
  overallSummary?: OverallSummary;
  otherCourseSummaries?: CourseSummary[];
}

/**
 * Fetch all available terms from API
 * @returns {Promise<TermData[]>}
 */
export async function fetchTerms(): Promise<TermData[]> {
  if (termsCache) {
    return termsCache;
  }

  try {
    const apiUrl = `${EXTERNAL_API_BASE}/terms`;
    debugLog('Fetching terms from API');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      errorLog(`Failed to fetch terms: ${response.status}`);
      return [];
    }

    const data = await response.json();
    termsCache = data;
    debugLog('Fetched terms:', data);
    return data;
  } catch (error) {
    errorLog('Error fetching terms:', error);
    return [];
  }
}

/**
 * Get term code from term description
 * @param {string} termDesc - Term description from URL (e.g., "Spring 2026 - College Station")
 * @returns {Promise<string|null>}
 */
export async function getTermCodeFromDescription(termDesc: string): Promise<string | null> {
  const terms = await fetchTerms();

  // Try exact match first
  const exactMatch = terms.find(t => t.termDesc === termDesc);
  if (exactMatch) {
    debugLog(`Found exact term match: ${termDesc} -> ${exactMatch.termCode}`);
    return exactMatch.termCode;
  }

  // Try partial match (in case of URL encoding differences)
  const decodedDesc = decodeURIComponent(termDesc);
  const partialMatch = terms.find(t =>
    t.termDesc.toLowerCase() === decodedDesc.toLowerCase() ||
    t.termDesc.toLowerCase().includes(decodedDesc.toLowerCase()) ||
    decodedDesc.toLowerCase().includes(t.termDesc.toLowerCase())
  );

  if (partialMatch) {
    debugLog(`Found partial term match: ${termDesc} -> ${partialMatch.termCode}`);
    return partialMatch.termCode;
  }


  debugLog(`No term match found for: ${termDesc}`);
  return null;
}

/**
 * Fetch professors teaching a specific course in a specific semester
 * @param {string} termCode - Term code (e.g., "202611")
 * @param {string} courseId - Course ID (e.g., "CSCE221")
 * @returns {Promise<SemesterProfessor[]>}
 */
export async function fetchSemesterProfessors(termCode: string, courseId: string): Promise<SemesterProfessor[]> {
  const cacheKey = `${termCode}:${courseId}`;

  if (semesterProfessorsCache.has(cacheKey)) {
    return semesterProfessorsCache.get(cacheKey) || [];
  }

  try {
    const apiUrl = `${EXTERNAL_API_BASE}/sections/${termCode}/course/${courseId}/professors`;
    debugLog(`Fetching semester professors for ${courseId} in term ${termCode}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch semester professors: ${response.status}`);
      semesterProfessorsCache.set(cacheKey, []);
      return [];
    }

    const data = await response.json();
    debugLog(`Found ${data.length} professors for ${courseId} in term ${termCode}`);
    semesterProfessorsCache.set(cacheKey, data);
    return data;
  } catch (error) {
    errorLog(`Error fetching semester professors for ${courseId}:`, error);
    semesterProfessorsCache.set(cacheKey, []);
    return [];
  }
}

/**
 * Fetch detailed professor data including all summaries
 * @param {string} termCode - Term code (e.g., "202611")
 * @param {string} courseId - Course ID (e.g., "CSCE411")
 * @returns {Promise<ProfessorDetails[]>}
 */
export async function fetchProfessorDetails(termCode: string, courseId: string): Promise<ProfessorDetails[]> {
  const cacheKey = `details:${termCode}:${courseId}`;

  if (professorDetailsCache.has(cacheKey)) {
    return professorDetailsCache.get(cacheKey) || [];
  }

  try {
    const apiUrl = `${EXTERNAL_API_BASE}/sections/${termCode}/course/${courseId}/professors/details`;
    debugLog(`Fetching detailed professor data for ${courseId} in term ${termCode}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch professor details: ${response.status}`);
      professorDetailsCache.set(cacheKey, []);
      return [];
    }

    const data = await response.json();
    const professors: ProfessorDetails[] = data.professors || [];
    debugLog(`Found ${professors.length} professors with details for ${courseId} in term ${termCode}`);
    professorDetailsCache.set(cacheKey, professors);
    return professors;
  } catch (error) {
    errorLog(`Error fetching professor details for ${courseId}:`, error);
    professorDetailsCache.set(cacheKey, []);
    return [];
  }
}

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
 * Fetch course data filtered to only professors teaching in the specified term
 * @param {string} courseId - Course ID (e.g., "CSCE221")
 * @param {string} termCode - Term code (e.g., "202611")
 * @returns {Promise<Object|null>}
 */
export async function fetchCourseDataForTerm(courseId: string, termCode: string): Promise<any | null> {
  // Fetch full course data
  const courseData = await fetchCourseData(courseId);
  if (!courseData) {
    return null;
  }

  // Fetch professors teaching this semester
  const semesterProfessors = await fetchSemesterProfessors(termCode, courseId);

  if (!semesterProfessors || semesterProfessors.length === 0) {
    debugLog(`No professors found for ${courseId} in term ${termCode}, returning all professors`);
    return courseData;
  }

  // Helper function to normalize and parse name parts
  const parseNameParts = (name: string): { firstParts: string[]; last: string; full: string; initials: string[] } => {
    const normalized = name.toLowerCase().trim();
    // Remove periods and split on whitespace
    const parts = normalized.replace(/\./g, '').split(/\s+/).filter(p => p.length > 0);
    const last = parts.length > 0 ? parts[parts.length - 1] : '';
    // All parts except the last are considered first/middle names
    const firstParts = parts.length > 1 ? parts.slice(0, -1) : [];
    // Extract initials from first/middle name parts
    const initials = firstParts.map(p => p[0] || '');
    return {
      firstParts,
      last,
      full: normalized,
      initials,
    };
  };

  // Parse semester professor names
  const semesterProfessorParsed = semesterProfessors.map(p => parseNameParts(p.name));

  // Match function that handles name variations including middle names
  const matchesProfessor = (profName: string): boolean => {
    const prof = parseNameParts(profName);

    for (const semProf of semesterProfessorParsed) {
      // Exact match
      if (prof.full === semProf.full) {
        return true;
      }

      // Last name must match
      if (prof.last !== semProf.last) {
        continue;
      }

      // If either has no first name parts, match on last name alone
      if (prof.firstParts.length === 0 || semProf.firstParts.length === 0) {
        debugLog(`Name matched by last name only: ${profName} ~ ${semProf.full}`);
        return true;
      }

      // Check if any first/middle name parts match exactly
      const hasMatchingPart = prof.firstParts.some(profPart =>
        semProf.firstParts.some(semPart => profPart === semPart)
      );
      if (hasMatchingPart) {
        debugLog(`Name matched by common first/middle part: ${profName} ~ ${semProf.full}`);
        return true;
      }

      // Check if any first/middle name part contains another (handles nicknames)
      const hasContainmentMatch = prof.firstParts.some(profPart =>
        semProf.firstParts.some(semPart =>
          (profPart.length >= 3 && semPart.includes(profPart)) ||
          (semPart.length >= 3 && profPart.includes(semPart))
        )
      );
      if (hasContainmentMatch) {
        debugLog(`Name matched by containment: ${profName} ~ ${semProf.full}`);
        return true;
      }

      // Check if first initials match (handles "J. Smith" vs "John Smith")
      // Only match by initial if one side has a single-letter name part
      const profHasInitial = prof.firstParts.some(p => p.length === 1);
      const semProfHasInitial = semProf.firstParts.some(p => p.length === 1);

      if (profHasInitial || semProfHasInitial) {
        const initialsMatch = prof.initials.some(pi =>
          semProf.initials.some(si => pi === si)
        );
        if (initialsMatch) {
          debugLog(`Name matched by initial: ${profName} ~ ${semProf.full}`);
          return true;
        }
      }
    }

    return false;
  };

  // Filter course.professors to only include those teaching this semester
  if (courseData.professors && Array.isArray(courseData.professors)) {
    const filteredProfessors = courseData.professors.filter((prof: any) => {
      const isTeaching = matchesProfessor(prof.name || '');

      if (isTeaching) {
        debugLog(`Professor ${prof.name} is teaching this semester`);
      }
      return isTeaching;
    });

    debugLog(`Filtered from ${courseData.professors.length} to ${filteredProfessors.length} professors for this semester`);

    return {
      ...courseData,
      professors: filteredProfessors,
    };
  }

  return courseData;
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

