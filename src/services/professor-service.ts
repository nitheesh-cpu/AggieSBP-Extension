import { EXTERNAL_API_BASE, COURSE_DETAILS_BASE } from '../config/constants';
import { debugLog, errorLog } from '../utils/debug';
import { professorNamesMatch } from '../utils/name-matching';

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
const rmpProfileCache = new Map<string, Promise<number | null>>();

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
 * Statistics computed from a professor's (or one course's) raw reviews.
 * Each percentage comes with the number of reviews that reported it.
 */
export interface ReviewStats {
  review_count?: number;
  would_take_again_pct?: number | null;
  would_take_again_n?: number;
  grade_distribution?: Record<string, number>;
  grades_reported_n?: number;
  attendance_mandatory_pct?: number | null;
  attendance_n?: number;
  textbook_used_pct?: number | null;
  textbook_n?: number;
  recent_window_years?: number;
  avg_rating_recent?: number | null;
  recent_n?: number;
  avg_rating_older?: number | null;
  older_n?: number;
  first_review_date?: string | null;
  last_review_date?: string | null;
}

/** Summary field name -> one list of cited RMP review IDs per claim. */
export type SummaryCitations = Record<string, string[][]>;

/**
 * Course-specific summary
 */
export interface CourseSummary {
  courseCode: string;
  rating?: number | null;
  teaching?: string | null;
  exams?: string | null;
  grading?: string | null;
  workload?: string | null;
  personality?: string | null;
  policies?: string | null;
  other?: string | null;
  // Structured-summary fields; absent from older API responses.
  tips?: string[] | null;
  reviewStats?: ReviewStats | null;
  citations?: SummaryCitations | null;
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
  tldr?: string | null;
  reviewStats?: ReviewStats | null;
  citations?: SummaryCitations | null;
  reviewCount: number;
}

/**
 * Detailed professor data with all summaries
 */
export interface ProfessorDetails {
  id: string;
  name: string;
  campus?: string | null;
  universityId?: string | null;
  rating?: number | null;
  overallRating?: number | null;
  overallReviewCount?: number;
  courseRating?: number | null;
  courseReviewCount?: number;
  rmpId?: number | null;
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
export async function fetchProfessorDetails(termCode: string, courseId: string, campus?: string): Promise<ProfessorDetails[]> {
  const cacheKey = `details:${termCode}:${courseId}:${campus || ''}`;

  if (professorDetailsCache.has(cacheKey)) {
    return professorDetailsCache.get(cacheKey) || [];
  }

  try {
    const apiUrl = `${EXTERNAL_API_BASE}/sections/${termCode}/course/${courseId}/professors/details${campus ? `?campus=${encodeURIComponent(campus)}` : ''}`;
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
    const rawProfessors: ProfessorDetails[] = data.professors || [];
    let campusProfessors = rawProfessors.filter(professor =>
      !campus || professor.campus?.trim().toLowerCase() === campus.trim().toLowerCase(),
    );
    if (campus && rawProfessors.some(professor => !professor.campus)) {
      const legacyProfessors = await resolveLegacyCampusProfessors(
        termCode, courseId, campus, rawProfessors.filter(professor => !professor.campus),
      );
      campusProfessors = [...campusProfessors, ...legacyProfessors];
    }
    const professors = await addRmpProfileIds(campusProfessors);
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
    if (Array.isArray(data.professors)) {
      data.professors = await addRmpProfileIds(data.professors);
    }
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

  // Match registration, RMP, and GPA-style name variants.
  const matchesProfessor = (profName: string): boolean => {
    for (const semesterProfessor of semesterProfessors) {
      if (professorNamesMatch(profName, semesterProfessor.name)) {
        debugLog(`Professor name matched: ${profName} ~ ${semesterProfessor.name}`);
        return true;
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

async function resolveLegacyCampusProfessors(
  termCode: string, courseId: string, campus: string, professors: ProfessorDetails[],
): Promise<ProfessorDetails[]> {
  const response = await fetch(`${EXTERNAL_API_BASE}/sections/${termCode}/course/${courseId}`,
    { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Could not verify section campuses');
  const sections: Array<{ campus?: string; instructors?: Array<{ name: string }> }> = await response.json();
  const normalizeCampus = (value?: string): string => (value || '').trim().toLowerCase();
  const targetNames = sections.filter(section => normalizeCampus(section.campus) === normalizeCampus(campus))
    .flatMap(section => section.instructors || []).map(instructor => instructor.name);
  const otherNames = sections.filter(section => normalizeCampus(section.campus) !== normalizeCampus(campus))
    .flatMap(section => section.instructors || []).map(instructor => instructor.name);
  const relevant = professors.filter(professor => targetNames.some(name => professorNamesMatch(name, professor.name)));
  return Promise.all(relevant.map(async professor => {
    const unrated: ProfessorDetails = { id: '', name: professor.name, totalReviews: 0, campus };
    if (!professor.id || otherNames.some(name => professorNamesMatch(name, professor.name))) return unrated;
    try {
      const lookupResponse = await fetch(`${EXTERNAL_API_BASE}/professor/find?name=${encodeURIComponent(professor.name)}`,
        { headers: { Accept: 'application/json' } });
      if (!lookupResponse.ok) return unrated;
      const lookup = await lookupResponse.json();
      const matches: Array<{ id: string; name: string; rmpId?: number }> = (lookup.matches || [])
        .filter((match: { name: string }) => professorNamesMatch(match.name, professor.name));
      // An older backend cannot distinguish same-name RMP identities across campuses.
      const ids = new Set(matches.map(match => match.id));
      if (ids.size !== 1 || !ids.has(professor.id)) return unrated;
      return { ...professor, campus, rmpId: matches[0].rmpId };
    } catch {
      return unrated;
    }
  }));
}

export function getRateMyProfessorUrl(rmpId?: number | string | null): string | null {
  const id = typeof rmpId === 'string' && /^\d+$/.test(rmpId) ? Number(rmpId) : rmpId;
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0
    ? `https://www.ratemyprofessors.com/professor/${id}`
    : null;
}

async function addRmpProfileIds(professors: ProfessorDetails[]): Promise<ProfessorDetails[]> {
  return Promise.all(professors.map(async professor => {
    if (getRateMyProfessorUrl(professor.rmpId) || !professor.id) return professor;

    let lookup = rmpProfileCache.get(professor.id);
    if (!lookup) {
      lookup = (async () => {
        try {
          const response = await fetch(
            `${EXTERNAL_API_BASE}/professor/find?name=${encodeURIComponent(professor.name)}`,
            { headers: { Accept: 'application/json' } },
          );
          if (!response.ok) return null;
          const data = await response.json();
          // Use the matched internal identity, never an arbitrary first search result.
          const match = data.matches?.find((candidate: { id: string; rmpId?: number | string }) =>
            candidate.id === professor.id && getRateMyProfessorUrl(candidate.rmpId),
          );
          return match ? Number(match.rmpId) : null;
        } catch (error) {
          debugLog('Could not look up RMP profile:', error);
          return null;
        }
      })();
      rmpProfileCache.set(professor.id, lookup);
    }
    return { ...professor, rmpId: await lookup };
  }));
}

/**
 * Get course details URL
 * @param {string} courseId - Course ID
 * @returns {string}
 */
export function getCourseDetailsUrl(courseId: string): string {
  return `${COURSE_DETAILS_BASE}/course/${courseId}`;
}

