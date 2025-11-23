import { debugLog, errorLog } from './debug';
import { store } from '../state/store';

/**
 * Collect all selected courses from checkboxes
 * Checks beautified checkboxes, finds course data, builds selected data structure,
 * removes duplicates, and returns structured data for schedule generation
 */
export function collectSelectedCourses(): {
  breaks: string[];
  cartSections: any[];
  courses: string[];
  currentSections: any[];
  padding: number;
} {
  const selectedData = {
    breaks: [] as string[],
    cartSections: [] as any[],
    courses: [] as string[],
    currentSections: [] as any[],
    padding: 0,
  };

  try {
    // Also check our beautified checkboxes
    const beautifiedCheckboxes = document.querySelectorAll('.schedule-checkbox:checked');
    beautifiedCheckboxes.forEach((checkbox) => {
      const checkboxElement = checkbox as HTMLInputElement;
      const id = findIDForCheckbox(checkboxElement);

      if (id) {
        // Find the course data for this ID
        const enrolledCourses = store.get('enrolledCoursesData');
        const cartCourses = store.get('cartCoursesData');
        const courseData = [...enrolledCourses, ...cartCourses].find((course: any) => course.id === id);

        if (courseData) {
          const courseInfo = {
            course: courseData.courseNumber || courseData.number,
            id: id,
            isExternal: false,
            registrationNumber: courseData.crn,
            subject: courseData.subject,
            subjectId: courseData.subject,
            topicId: null,
          };

          if (courseData.enrollmentStatus === 'Enrolled') {
            (courseInfo as any).enrollmentStatus = 'Enrolled';
            selectedData.currentSections.push(courseInfo);
          } else {
            selectedData.cartSections.push(courseInfo);
          }
        } else if (checkboxElement.id.includes('break_checkbox')) {
          selectedData.breaks.push(id);
        } else {
          selectedData.courses.push(id);
        }

        debugLog(`Found beautified selected ID: ${id}`);
      }
    });

    // Remove duplicates from courses array
    selectedData.courses = [...new Set(selectedData.courses)];

    // Remove duplicates from sections arrays based on ID
    selectedData.cartSections = selectedData.cartSections.filter(
      (section, index, self) => index === self.findIndex((s) => s.id === section.id)
    );
    selectedData.currentSections = selectedData.currentSections.filter(
      (section, index, self) => index === self.findIndex((s) => s.id === section.id)
    );

    debugLog('Final selected data:', selectedData);
    return selectedData;
  } catch (error) {
    errorLog('Error collecting selected courses:', error);
    return selectedData;
  }
}

/**
 * Helper function to find ID for a checkbox
 * Checks data-id attribute and parent row for link with ID
 */
export function findIDForCheckbox(checkbox: HTMLInputElement): string | null {
  try {
    // If there is a tr parent with the a class that contains rowCss, check the a tag in it for a href that contains crn
    const tr = checkbox.closest('tr');
    if (tr) {
      const a = tr.querySelector('a');
      if (a) {
        const href = a.href; // https://tamu.collegescheduler.com/terms/Fall%202025%20-%20College%20Station/courses/6982217
        const id = href.split('/').pop();
        if (id) return id;
      }
    }

    // Method 1: Check if ID is in a data-id attribute
    if (checkbox.dataset.id) {
      return checkbox.dataset.id;
    }

    return null;
  } catch (error) {
    errorLog('Error finding ID for checkbox:', error);
    return null;
  }
}

