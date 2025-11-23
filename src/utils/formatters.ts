/**
 * Format time from numeric format (e.g., 1430) to readable format (e.g., 2:30pm)
 * @param {number} time - Time in format HHMM
 * @returns {string}
 */
export function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const formattedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

/**
 * Format date string to MM/DD/YYYY format
 * @param {string} dateStr - Date string
 * @returns {string}
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
    .getDate()
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
}

interface MeetingTime {
  days: string;
  startTime: number;
  endTime: number;
  startDate?: string;
  endDate?: string;
  location?: string;
}

interface FormattedMeetingTime {
  timeDisplay: string;
  location: string;
  isOnline: boolean;
}

/**
 * Format meeting time for display
 * @param {MeetingTime} meeting - Meeting object with days, startTime, endTime, etc.
 * @returns {FormattedMeetingTime}
 */
export function formatMeetingTime(meeting: MeetingTime): FormattedMeetingTime {
  const timeStr = `${formatTime(meeting.startTime)}-${formatTime(meeting.endTime)}`;
  const dateStr = `${formatDate(meeting.startDate)}-${formatDate(meeting.endDate)}`;
  const location = meeting.location || '';
  
  return {
    timeDisplay: `${meeting.days} ${timeStr} ${dateStr}`,
    location: location,
    isOnline: location.includes('ONLINE'),
  };
}

/**
 * Extract instructor last name from full name
 * @param {string} fullName - Full instructor name
 * @returns {string}
 */
export function extractInstructorLastName(fullName: string): string {
  const parts = fullName.split(',');
  return parts.length > 1 ? parts[0].trim() : fullName.trim();
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string}
 */
export function generateStarRating(rating: number | null | undefined): string {
  if (!rating) return '<span class="no-rating">No rating</span>';

  const stars: string[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('☆');
    } else {
      stars.push('☆');
    }
  }

  return `<span class="stars">${stars.join('')}</span>`;
}

