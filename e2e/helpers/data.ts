// Mock API data. Names are fictional.

export const COLLEGE_SCHEDULER = 'https://tamu.collegescheduler.com';
export const HOWDY = 'https://howdy.tamu.edu';
export const API = 'https://api-aggiesbp.nitheeshk.com';
export const SITE = 'https://aggieschedulebuilderplus.vercel.app';
export const STATS = 'https://stats.nitheeshk.com';

export const TERM_DESC = 'Spring 2027 - College Station';
export const TERM_PATH = `/terms/${encodeURIComponent(TERM_DESC)}`;
export const TERM_CODE = '202711';

/** College Scheduler's id for the course the user is looking at. */
export const COURSE_ID = '4821';

export const URLS = {
  sections: `${COLLEGE_SCHEDULER}${TERM_PATH}/courses/${COURSE_ID}`,
  currentSchedule: `${COLLEGE_SCHEDULER}${TERM_PATH}/currentschedule`,
  options: `${COLLEGE_SCHEDULER}${TERM_PATH}/options`,
  planner: `${HOWDY}/main/home/degree-planner-ui/planner`,
  curriculum: `${HOWDY}/main/home/degree-planner-ui/curriculum`,
};

export const TERMS = [
  { termCode: '202631', termDesc: 'Fall 2026 - College Station', startDate: '2026-08-24', endDate: '2026-12-10', academicYear: '2026-2027' },
  { termCode: TERM_CODE, termDesc: TERM_DESC, startDate: '2027-01-19', endDate: '2027-05-11', academicYear: '2026-2027' },
];

/** College Scheduler's own /api/terms/{term}/desiredcourses/ response. */
export const DESIRED_COURSES = [
  { id: COURSE_ID, subjectId: 'CSCE', subjectLong: 'Computer Science & Engineering - CSCE', number: '121', title: 'Introduction to Program Design' },
];

export const PROFESSORS = [
  {
    id: 'prof-rivera',
    name: 'Jordan Rivera',
    campus: 'College Station',
    rating: 4.6,
    overallRating: 4.6,
    overallReviewCount: 40,
    courseRating: 4.4,
    courseReviewCount: 12,
    rmpId: 123456,
    totalReviews: 40,
    grades: { avgGpa: 3.4, totalStudents: 900, distribution: { A: 50, B: 30, C: 10, D: 5, F: 5 } },
    courseSummary: {
      courseCode: 'CSCE121',
      rating: 4.4,
      teaching: 'Lectures walk through every example and are easy to follow.',
      exams: 'Exams mirror the homework.',
      reviewCount: 12,
    },
  },
  {
    id: 'prof-natarajan',
    name: 'Priya Natarajan',
    campus: 'College Station',
    rating: 3.9,
    overallRating: 3.9,
    overallReviewCount: 22,
    courseRating: 3.7,
    courseReviewCount: 6,
    rmpId: 654321,
    totalReviews: 22,
    grades: { avgGpa: 3.1, totalStudents: 400, distribution: { A: 35, B: 35, C: 20, D: 5, F: 5 } },
  },
];

export const REVIEWS = [
  { id: 'r1', course_code: 'CSCE121', review_text: 'Great at explaining pointers.', overall_rating: 5, grade: 'A', review_date: '2026-03-01' },
];
