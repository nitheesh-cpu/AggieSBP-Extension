/**
 * Check if current page is a registration page (course detail page)
 * @returns {boolean}
 */
export function isRegistrationPage(): boolean {
  const regex = /courses\/\d+/;
  return regex.test(location.href);
}

/**
 * Check if current page is the main courses/schedule page
 * @returns {boolean}
 */
export function isMainCoursesPage(): boolean {
  const regex = /\/terms\/[^\/]+\/courses$/;
  const regex2 = /\/terms\/[^\/]+\/options$/;
  const regex3 = /\/terms\/[^\/]+\/schedules$/;
  const regex4 = /\/terms\/[^\/]+\/breaks$/;
  return regex.test(location.href) || regex2.test(location.href) || 
         regex3.test(location.href) || regex4.test(location.href);
}

/**
 * Check if current page is the current schedule page
 * @returns {boolean}
 */
export function isCurrentSchedulePage(): boolean {
  const regex = /\/terms\/[^\/]+\/currentschedule$/;
  return regex.test(location.href);
}

/**
 * Extract term from current URL
 * @returns {string|null}
 */
export function extractTermFromUrl(): string | null {
  const urlParts = location.pathname.split('/');
  const termIndex = urlParts.findIndex((part) => part === 'terms');
  if (termIndex === -1 || termIndex + 1 >= urlParts.length) {
    return null;
  }
  return urlParts[termIndex + 1];
}

/**
 * Extract course ID from URL
 * @returns {string|null}
 */
export function extractCourseIdFromUrl(): string | null {
  const regex = /courses\/(\d+)/;
  const match = location.href.match(regex);
  return match ? match[1] : null;
}

