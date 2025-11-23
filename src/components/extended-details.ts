import { formatTime, formatDate } from '../utils/formatters';

/**
 * Create extended details content for a course
 * @param {Object} courseData - Course section data
 * @returns {string} HTML string
 */
export function createExtendedDetails(courseData: any): string {
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

  return `
      <div class="extended-details-container">
        <h4>Course Description</h4>
        <p>${courseData.description || 'No description available.'}</p>
        
        <div class="detail-section">
          <h4>Course Information</h4>
          <div class="detail-grid">
            <div class="detail-row">
              <b class="extended-label">Department:</b>
              <span class="extended-value">${courseData.subject}</span>
              </div>
              <div class="detail-row">
                <b class="extended-label">Credits:</b>
                <span class="extended-value">${courseData.credits}</span>
              </div>
            <div class="detail-row">
              <b class="extended-label">Instruction Mode:</b>
              <span class="extended-value">${courseData.instructionMode}</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Component:</b>
              <span class="extended-value">${courseData.component}</span>
            </div>
            <div class="detail-row">
              <a class="extended-label" href=${courseData.courseEval || '#'}>Course Eval</a>
               | 
              <a class="extended-label" href=${courseData.syllabusLink ? courseData.syllabusLink : '#'}>${courseData.syllabusLink ? 'Syllabus' : 'No Syllabus'}</a>
               | 
              <a class="extended-label" href=${courseData.instructorInfo || '#'}>${courseData.instructor}</a>
            </div>
            
            <div class="detail-row">
              <b class="extended-label">Campus:</b>
              <span class="extended-value">${courseData.campus}</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Restrictions:</b>
              <span class="extended-value">${courseData.sectionRestrictions
      ? courseData.sectionRestrictions
        .map(
          (restriction: string) =>
            `<span class="section-restriction">${restriction}</span>`
        )
        .join(', ')
      : 'None'
    }</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Attributes:</b>
              <span class="extended-value">${courseData.sectionAttributes
      ? courseData.sectionAttributes
        .map(
          (attr: any) =>
            `<span class="section-attribute">${attr.valueTitle || attr.value}</span>`
        )
        .join(', ')
      : 'None'
    }</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Fees:</b>
              
              <div class="extended-value">
                ${courseData.sectionFees && courseData.sectionFees.trim() !== ''
      ? `<div class="section-fees-container">${courseData.sectionFees}</div>`
      : 'No section fees'
    }
              </div>
            </div>
          </div>
        </div>
        
        ${courseData.prerequisites
      ? `
        <div class="detail-section">
          <h4>Prerequisites</h4>
          <p>${courseData.prerequisites}</p>
        </div>
        `
      : ''
    }
        
        <div class="detail-section">
          <h4>Schedule Details</h4>
          <div class="schedule-details">
            ${meetingTimes}
          </div>
        </div>
      </div>
    `;
}

