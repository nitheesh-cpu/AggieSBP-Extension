import { formatTime } from '../utils/formatters';
import { fetchProfessorId, getProfessorDetailsUrl } from '../services/professor-service';
import { debugLog } from '../utils/debug';

/**
 * Create a table row for a course section
 * @param {Object} courseData - Course section data
 * @param {number} index - Index of the row
 * @returns {Promise<HTMLTableRowElement>}
 */
export async function createSectionTableRow(courseData: any, index: number): Promise<HTMLTableRowElement> {
  const row = document.createElement('tr');
  row.className = 'section-table-row';
  row.dataset.crn = courseData.crn;
  
  if (index % 2 === 0) {
    row.classList.add('row-even');
  } else {
    row.classList.add('row-odd');
  }

  // Add selection checkbox
  const checkboxId = `beautified-checkbox-${courseData.crn}`;

  // Create availability status
  let availabilityStatus = 'Available';
  let availabilityClass = 'status-available';
  if (courseData.seatsOpen === '0') {
    availabilityStatus = 'Full';
    availabilityClass = 'status-full';
  } else if (parseInt(courseData.seatsOpen) < 5) {
    availabilityStatus = 'Limited';
    availabilityClass = 'status-limited';
  }

  // Create badge HTML for special course attributes (using same classes as schedule page)
  const badges: string[] = [];
  if (courseData.isHonors) {
    badges.push('<span class="add-course-badge badge-honors">Honors</span>');
  }
  if (courseData.isRestricted) {
    badges.push('<span class="add-course-badge badge-restrictions">Restricted</span>');
  }
  if (courseData.hasPrerequisites) {
    badges.push('<span class="add-course-badge badge-prerequisites">Prerequisites</span>');
  }

  // Add disabled reasons as badges
  if (!courseData.isEnabled && courseData.disabledReasons && courseData.disabledReasons.length > 0) {
    courseData.disabledReasons.forEach((reason: string) => {
      badges.push(`<span class="add-course-badge badge-disabled">${reason}</span>`);
    });
  } else if (!courseData.isEnabled) {
    badges.push('<span class="add-course-badge badge-disabled">Unavailable</span>');
  }

  const badgesHtml = badges.length > 0 ? `<div class="table-badges">${badges.join('')}</div>` : '';

  // Fetch professor ID if instructor is available
  let professorButtonHtml = '';
  if (courseData.instructor && courseData.instructor !== 'Unknown' && courseData.instructor !== 'Not Assigned') {
    try {
      const professorId = await fetchProfessorId(courseData.instructor);
      if (professorId) {
        const professorDetailsUrl = getProfessorDetailsUrl(professorId);
        professorButtonHtml = `<a href="${professorDetailsUrl}" target="_blank" class="professor-link-btn" title="Compare Professor Reviews">🎓 Reviews</a>`;
      }
    } catch (error) {
      debugLog(`Error fetching professor ID for ${courseData.instructor}:`, error);
    }
  }

  // Format meeting times with location links
  const meetingTimes = courseData.meetingTimes
    .map((meeting: any) => {
      const location = meeting.location || 'TBA';
      let locationHTML = location;
      
      // Create link to Aggie map if location is not TBA or ONLINE
      if (location && location !== 'TBA' && !location.toUpperCase().includes('ONLINE')) {
        // Extract building abbreviation (e.g., "KLCT 115" -> "KLCT")
        const buildingMatch = location.match(/^([A-Z]+)/);
        if (buildingMatch) {
          const buildingAbbr = buildingMatch[1];
          const mapUrl = `https://aggiemap.tamu.edu/?ref=howdy&BldgAbbrv=${buildingAbbr}`;
          locationHTML = `<a href="${mapUrl}" target="_blank" rel="noreferrer noopener" class="location-link">${location}</a>`;
        }
      }
      
      return `${meeting.days} ${formatTime(meeting.startTime)}-${formatTime(meeting.endTime)} ${locationHTML}`;
    })
    .join(', ');

  // Build the row HTML
  row.innerHTML = `
    <td class="table-cell-checkbox">
      <input type="checkbox" id="${checkboxId}" class="section-checkbox" ${courseData.isSelected ? 'checked' : ''} data-crn="${courseData.crn}">
    </td>
    <td class="table-cell-section">
      <div class="section-code">${courseData.subject} ${courseData.number}-${courseData.section}</div>
      <div class="section-crn">CRN: ${courseData.crn}</div>
    </td>
    <td class="table-cell-title">
      <div class="section-title">${courseData.title}</div>
      ${badgesHtml}
    </td>
    <td class="table-cell-instructor">
      <div class="instructor-name">${courseData.instructor || 'Not Assigned'}</div>
      ${professorButtonHtml}
    </td>
    <td class="table-cell-times">
      <div class="meeting-times-text">${meetingTimes || 'TBA'}</div>
    </td>
    <td class="table-cell-status">
      <span class="status-badge ${availabilityClass}">${availabilityStatus}</span>
      <div class="seats-count">${courseData.seatsOpen} ${parseInt(courseData.seatsOpen) === 1 ? 'seat' : 'seats'}</div>
    </td>
    <td class="table-cell-actions">
      <button class="details-button" data-crn="${courseData.crn}" title="Show Details">
        <svg xmlns="http://www.w3.org/2000/svg" style="display: block;" width="20" height="20" fill="none" stroke="#500000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="8"></line>
        </svg>
      </button>
    </td>
  `;

  return row;
}

