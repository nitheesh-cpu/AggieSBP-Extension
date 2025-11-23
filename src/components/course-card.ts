import { formatTime, formatDate } from '../utils/formatters';
import { fetchProfessorId, getProfessorDetailsUrl } from '../services/professor-service';
import { createExtendedDetails } from './extended-details';
import { debugLog } from '../utils/debug';

/**
 * Create a course card element
 * @param {Object} courseData - Course section data
 * @param {number} index - Index of the card
 * @returns {Promise<HTMLElement>}
 */
export async function createCourseCard(courseData: any, _index: number): Promise<HTMLElement> {
  const card = document.createElement('div');
  card.className = 'course-card';
  card.dataset.crn = courseData.crn;

  // Add selection checkbox
  const checkboxId = `beautified-checkbox-${courseData.crn}`;

  // Create class indicator based on seats available
  let availabilityClass = 'seats-available';
  if (courseData.seatsOpen === '0') {
    availabilityClass = 'seats-full';
  } else if (parseInt(courseData.seatsOpen) < 5) {
    availabilityClass = 'seats-limited';
  }

  // Create badge HTML for special course attributes
  let badgesHtml = '';
  if (courseData.isHonors) {
    badgesHtml += '<span class="course-badge honors-badge">Honors</span>';
  }
  if (courseData.isRestricted) {
    badgesHtml += '<span class="course-badge restricted-badge">Restricted</span>';
  }
  if (courseData.hasPrerequisites) {
    badgesHtml += '<span class="course-badge prereq-badge">Prerequisites</span>';
  }

  // Add disabled reasons as badges
  if (
    !courseData.isEnabled &&
    courseData.disabledReasons &&
    courseData.disabledReasons.length > 0
  ) {
    courseData.disabledReasons.forEach((reason: string) => {
      badgesHtml += `<span class="course-badge disabled-badge">${reason}</span>`;
    });
  } else if (!courseData.isEnabled) {
    badgesHtml += '<span class="course-badge disabled-badge">Unavailable</span>';
  }

  // Fetch professor ID if instructor is available
  let professorButtonHtml = '';
  if (courseData.instructor && courseData.instructor !== 'Unknown' && courseData.instructor !== 'Not Assigned') {
    try {
      const professorId = await fetchProfessorId(courseData.instructor);
      if (professorId) {
        const professorDetailsUrl = getProfessorDetailsUrl(professorId);
        professorButtonHtml = `<a href="${professorDetailsUrl}" target="_blank" class="professor-details-btn" title="Compare Professor Reviews">🎓 Compare Reviews</a>`;
      }
    } catch (error) {
      debugLog(`Error fetching professor ID for ${courseData.instructor}:`, error);
    }
  }

  const meetingTimes = courseData.meetingTimes
    .map((meeting: any) => {
      const formattedMeeting = `<div class="meeting-time">
    ${meeting.days} ${formatTime(meeting.startTime)} - ${formatTime(
        meeting.endTime
      )} ${formatDate(meeting.startDate)} - ${formatDate(meeting.endDate)} ${meeting.location
        } \\(${meeting.type}\\)</div>`;

      return formattedMeeting;
    })
    .join('');

  // Create extended details section (initially hidden)
  const extendedDetails = createExtendedDetails(courseData);

  // Build the card HTML
  card.innerHTML = `
      <div class="card-header ${availabilityClass}">
        <div class="course-select">
          <input type="checkbox" id="${checkboxId}" ${courseData.isSelected ? 'checked' : ''}>
          <label for="${checkboxId}"></label>
        </div>
        <div class="course-code">${courseData.subject} ${courseData.number}-${courseData.section}</div>
        <div class="course-crn">CRN: ${courseData.crn}</div>
      </div>
      <div class="card-body">
      <div class="details-row">
            <div class="detail-item">
                <h3 class="course-title">${courseData.title}</h3>
                <div class="course-badges">
                ${badgesHtml}
                </div>
            </div>
            <div class="detail-item">
                <div class="details-row">
                    <div class="detail-item">
                        <span class="detail-label">Seats:</span>
                        <span class="detail-value seats-available-text">${courseData.seatsOpen}</span>
                    </div>
                </div>
                <div class="details-row">
                    <div class="detail-item full-width">
                        <span class="detail-label">Instructor:</span>
                        <div class="instructor-container">
                          <span class="detail-value">${courseData.instructor}</span>
                          ${professorButtonHtml}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        <div class="meeting-times">
          ${meetingTimes}
        </div>
        
        <!-- Extended details section (initially hidden) -->
        <div class="extended-details" id="extended-details-${courseData.crn}" style="display: none;">
          ${extendedDetails}
        </div>
      </div>
      <div class="card-footer">
        <button class="details-button" data-crn="${courseData.crn}">Show Details</button>
      </div>
    `;
  return card;
}

