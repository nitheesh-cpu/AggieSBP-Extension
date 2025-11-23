import { debugLog } from '../utils/debug';
import { store } from '../state/store';
import { createExtendedDetails } from '../components/extended-details';

/**
 * Set up event listeners for schedule elements
 * Handles location links, details buttons, and calls setupGenerateButtonObserver
 */
export function setupScheduleEventListeners(): void {
  // Handle location links
  document.querySelectorAll('.location-link').forEach((element) => {
    element.addEventListener('click', function (this: HTMLElement, e: Event) {
      e.preventDefault();
      // Could open building map or show location details
      debugLog('Location clicked:', this.textContent);
    });
  });

  // Handle more times links
  document.querySelectorAll('.more-times').forEach((element) => {
    element.addEventListener('click', function () {
      // Could expand to show all meeting times
      debugLog('More times clicked');
    });
  });

  // Handle details buttons
  document.querySelectorAll('.details-button').forEach((button) => {
    button.addEventListener('click', function (this: HTMLElement) {
      const crn = this.dataset.crn;
      if (!crn) return;

      debugLog('Show details for CRN:', crn);

      // Find the course data for this CRN
      const enrolledCourses = store.get('enrolledCoursesData');
      const cartCourses = store.get('cartCoursesData');
      const courseData = [...enrolledCourses, ...cartCourses].find((course: any) => course.crn === crn);

      toggleScheduleDetails(crn, courseData);
    });
  });

  // Note: Checkbox handling is now managed by setupCheckboxSynchronization()
  // to maintain synchronization with original hidden tables

  // Note: setupGenerateButtonObserver() is called from schedule-page.ts
  // after createMainSchedule() completes to ensure proper initialization order
}

/**
 * Toggle expanded details view for a schedule item
 * Shows/hides course details and transforms schedule data format
 */
export function toggleScheduleDetails(crn: string, courseData: any): void {
  const scheduleItem = document
    .querySelector(`.schedule-item [data-crn="${crn}"]`)
    ?.closest('.schedule-item') as HTMLElement;

  if (!scheduleItem) {
    debugLog('Schedule item not found for CRN:', crn);
    return;
  }

  const existingDetails = scheduleItem.querySelector('.expanded-details');

  if (existingDetails) {
    // If details are already shown, hide them and update button
    existingDetails.remove();
    const detailsButton = scheduleItem.querySelector('.details-button') as HTMLElement;
    if (detailsButton) {
      detailsButton.textContent = 'Details';
    }
    return;
  }

  // Create details section
  const detailsSection = document.createElement('div');
  detailsSection.className = 'expanded-details';

  let detailsContent = '';

  if (courseData) {
    // Transform schedule format data to match the format expected by createExtendedDetails
    const transformedData = {
      subject: courseData.subject,
      number: courseData.number || courseData.courseNumber,
      section: courseData.section || courseData.sectionNumber,
      crn: courseData.crn,
      title: courseData.title || `${courseData.subject} ${courseData.number || courseData.courseNumber}`,
      credits: courseData.credits,
      instructor: courseData.instructor,
      instructionMode: courseData.instructionMode,
      meetingTimes: courseData.meetingTimes
        ? courseData.meetingTimes.map((meeting: any) => {
            // Parse timeDisplay to extract components
            const timeDisplayParts = meeting.timeDisplay ? meeting.timeDisplay.split(' ') : ['TBA'];
            return {
              days: timeDisplayParts[0] || 'TBA',
              startTime: 0,
              endTime: 0,
              location: meeting.location || 'TBA',
              type: 'Lecture',
              startDate: '',
              endDate: '',
            };
          })
        : [],
      hasPrerequisites: courseData.hasPrerequisites,
      hasRestrictions: courseData.hasRestrictions,
      description: courseData.description || 'Course description not available.',
      campus: courseData.campus || 'College Station',
      sectionRestrictions: courseData.sectionRestrictions || [],
      sectionAttributes: courseData.sectionAttributes || [],
      sectionFees: courseData.sectionFees || null,
      prerequisites: courseData.prerequisites || null,
      courseEvalLink: courseData.courseEval || '#',
      syllabusLink: courseData.syllabusLink || null,
      instructorInfo: courseData.instructorInfo || '#',
      component: courseData.component || '',
    };

    detailsContent = createExtendedDetails(transformedData);
  } else {
    detailsContent = `
      <div class="details-message">
        <p>Detailed information for this course (CRN: ${crn}) is not available.</p>
      </div>
    `;
  }

  detailsSection.innerHTML = detailsContent;

  // Add to schedule item, after the schedule-times section
  const scheduleTimes = scheduleItem.querySelector('.schedule-times');
  if (scheduleTimes) {
    scheduleTimes.after(detailsSection);
  }

  // Update button text
  const detailsButton = scheduleItem.querySelector('.details-button') as HTMLElement;
  if (detailsButton) {
    detailsButton.textContent = 'Hide Details';
  }
}

