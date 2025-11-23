import { extractCustomDataLinks, cleanupSectionFeesHtml } from '../utils/dom';
import { extractInstructorLastName } from '../utils/formatters';
import { formatMeetingTime } from '../utils/formatters';

interface Section {
  id: string;
  subject: string;
  course: string;
  sectionNumber: string;
  registrationNumber: string;
  title: string;
  credits: string;
  openSeats: string;
  meetings: Array<{
    days: string;
    startTime: number;
    endTime: number;
    location: string;
    meetingTypeDescription: string;
    startDate: string;
    endDate: string;
  }>;
  instructor: Array<{ name: string }>;
  isHonors: boolean;
  hasRestrictions: boolean;
  hasPrerequisites: boolean;
  instructionMode: string;
  component: string;
  customData: string;
  description: string;
  campus: string;
  sectionRestrictions: Array<{ displayDescription: string }>;
  sectionAttributes: Array<{ value: string; valueTitle?: string }>;
}

interface RegistrationBlock {
  sectionIds: string[];
  selected: boolean;
  enabled: boolean;
  disabledReasons?: string[];
}

interface ApiResponse {
  sections: Section[];
  registrationBlocks: RegistrationBlock[];
}

/**
 * Extract and sort sections from API response
 * @param {ApiResponse} response - API response with sections and registration blocks
 * @returns {Array} Formatted and sorted sections
 */
export function extractAndSortSections(response: ApiResponse): any[] {
  const registrationMap = new Map<string, boolean>();
  const enabledMap = new Map<string, boolean>();
  const disabledReasonsMap = new Map<string, string[]>();

  // Build maps from registration blocks
  for (const reg of response.registrationBlocks) {
    for (const sectionId of reg.sectionIds) {
      registrationMap.set(sectionId, reg.selected);
      enabledMap.set(sectionId, reg.enabled);
      disabledReasonsMap.set(sectionId, reg.disabledReasons || []);
    }
  }

  // Format sections
  const formatted = response.sections.map((section) => {
    const isSelected = registrationMap.get(section.id) || false;
    const isEnabled = enabledMap.get(section.id) !== false;
    const disabledReasons = disabledReasonsMap.get(section.id) || [];

    const meetingTimes = section.meetings.map((m) => ({
      days: m.days,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      type: m.meetingTypeDescription,
      startDate: m.startDate,
      endDate: m.endDate,
    }));

    const instructor = section.instructor.length > 0 ? section.instructor[0].name : 'Unknown';
    const instructorLastName = extractInstructorLastName(instructor);

    const {
      courseEval,
      syllabusLink,
      instructorInfo,
      textbookLink,
      prerequisites,
    } = extractCustomDataLinks(section.customData || '');

    return {
      subject: section.subject,
      number: section.course,
      section: section.sectionNumber,
      crn: section.registrationNumber,
      title: section.title,
      credits: section.credits,
      seatsOpen: section.openSeats,
      meetingTimes,
      instructor,
      isHonors: section.isHonors,
      isRestricted: section.hasRestrictions,
      hasPrerequisites: section.hasPrerequisites,
      isSelected,
      isEnabled,
      disabledReasons,
      instructionMode: section.instructionMode,
      component: section.component,
      courseEval,
      syllabusLink,
      instructorInfo,
      textbookLink,
      description: section.description,
      campus: section.campus,
      sectionRestrictions: section.sectionRestrictions.map((r) => r.displayDescription),
      prerequisites: prerequisites,
      sectionFees: cleanupSectionFeesHtml(
        (section.customData.match(/<b>Section Fees:<\/b>(.*?)<br>/) || [])[1]?.trim()
      ),
      instructorLastName,
      sectionAttributes: section.sectionAttributes,
    };
  });

  // Sort sections
  formatted.sort((a, b) => {
    if (a.isHonors !== b.isHonors) return b.isHonors ? 1 : -1;
    if (a.campus !== b.campus) return a.campus === 'College Station' ? -1 : 1;
    return a.instructorLastName.localeCompare(b.instructorLastName);
  });

  return formatted;
}

/**
 * Transform section data to schedule format
 * @param {any} section - Section data from API
 * @returns {Object} Transformed section data
 */
export function transformSectionToScheduleFormat(section: any): any {
  // Transform meetings
  const meetingTimes = section.meetings.map((meeting: any) => formatMeetingTime(meeting));

  // Determine if has restrictions/prerequisites
  const hasRestrictions =
    section.hasRestrictions ||
    (section.sectionRestrictions && section.sectionRestrictions.length > 0);
  const hasPrerequisites = section.hasPrerequisites;

  // Get instructor name
  const instructor =
    section.instructor && section.instructor.length > 0
      ? section.instructor[0].name
      : 'Not Assigned';

  // Determine instruction mode
  let instructionMode = section.instructionMode;
  if (instructionMode === 'Traditional Face-to-Face (F2F)') {
    instructionMode = 'Traditional F2F';
  } else if (instructionMode === 'Web Based') {
    instructionMode = 'Web Based';
  }

  // Extract custom data
  let html = section.customData || '';
  const courseEval = (html.match(/href="([^"]*AefisCourseSection[^"]*)"/) || [])[1] || null;
  const instructorInfo = (html.match(/fetch\('([^']*instructor-cv-pdf[^']*)'/) || [])[1] || null;
  const syllabusLink = courseEval && courseEval.includes('No syllabus') ? null : null;

  const sectionFees = cleanupSectionFeesHtml(
    (section.customData.match(/<b>Section Fees:<\/b>(.*?)<br>/) || [])[1]?.trim()
  );

  return {
    isExternal: section.isExternal,
    registrationNumber: section.registrationNumber,
    subjectId: section.subjectId,
    topicId: section.topicId,
    id: section.id,
    description: section.description,
    title: section.title,
    credits: section.credits,
    instructionMode: instructionMode,
    instructor: instructor,
    meetingTimes: meetingTimes,
    hasPrerequisites: hasPrerequisites,
    hasRestrictions: hasRestrictions,
    component: section.components,
    courseEval,
    syllabusLink,
    instructorInfo,
    crn: section.registrationNumber,
    subject: section.subject,
    courseNumber: section.course,
    sectionNumber: section.sectionNumber,
    enrollmentStatus: section.enrollmentStatus ? section.enrollmentStatus : 'Not Enrolled',
    openSeats: section.openSeats,
    sectionRestrictions: section.sectionRestrictions,
    sectionAttributes: section.sectionAttributes,
    sectionFees: sectionFees,
  };
}

