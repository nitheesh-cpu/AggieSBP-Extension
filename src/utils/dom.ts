/**
 * Get XSRF token from page
 * @returns {string|null}
 */
export function getXSRFToken(): string | null {
  const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]') as HTMLInputElement | null;
  if (tokenInput) {
    return tokenInput.value;
  }
  return null;
}

/**
 * Find table container element
 * @param {Element} element - Starting element
 * @returns {Element|null}
 */
export function findTableContainer(element: Element | null): Element | null {
  if (!element) return null;
  
  let current: Element | null = element;
  for (let i = 0; i < 5; i++) {
    if (!current || !current.parentElement) break;
    current = current.parentElement;
    if (
      current.classList.contains('table-container') ||
      current.classList.contains('course-listing') ||
      current.id === 'course-results' ||
      current.id === 'registration-table'
    ) {
      return current;
    }
  }
  return current;
}

/**
 * Clean up malformed HTML in section fees
 * @param {string} html - HTML string to clean
 * @returns {string|null}
 */
export function cleanupSectionFeesHtml(html: string | null | undefined): string | null {
  if (!html) return null;

  let cleaned = html
    .replace(/<th>([^<]*)<th>/g, '<th>$1</th><th>')
    .replace(/<td>([^<]*)<td>/g, '<td>$1</td><td>')
    .replace(/<th>([^<]*)<\/th><th>/g, '<th>$1</th><th>')
    .replace(/<td>([^<]*)<\/td><td>/g, '<td>$1</td><td>')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Extract custom data links from HTML
 * @param {string} html - HTML string
 * @returns {Object}
 */
export function extractCustomDataLinks(html: string): {
  courseEval: string | null;
  syllabusLink: string | null;
  instructorInfo: string | null;
  textbookLink: string | null;
  prerequisites: string | null;
} {
  const courseEval = (html.match(/href="([^"]*AefisCourseSection[^"]*)"/) || [])[1] || null;
  const instructorInfo = (html.match(/fetch\('([^']*instructor-cv-pdf[^']*)'/) || [])[1] || null;
  const textbookLink = (html.match(/form name="bookStore"[^>]*action="([^"]*)"/) || [])[1] || null;
  const syllabusLink = courseEval && courseEval.includes('No syllabus') ? null : null;
  const prerequisites = (html.match(/<b>Prerequisites:<\/b>(.*?)<br>/) || [])[1]?.trim() || null;
  
  return {
    courseEval,
    syllabusLink,
    instructorInfo,
    textbookLink,
    prerequisites,
  };
}

