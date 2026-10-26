/**
 * Finds course sections in College Scheduler tables (course sections, Build Schedule's
 * Current Schedule and Shopping Cart, the Cart page). Works on cell text so it can be
 * tested without a DOM.
 */

export interface ScannedSection {
  crn: string;
  subject: string;
  course: string;
  section: string;
  /** Null when the table has no "Seats Open" column. */
  seatsOpen: number | null;
}

export interface SectionColumns {
  crn: number;
  subject?: number;
  course?: number;
  section?: number;
  seats?: number;
  status?: number;
}

const COLUMN_PATTERNS: Array<[keyof SectionColumns, RegExp]> = [
  ['crn', /^crn/],
  ['subject', /^subj(ect)?$/],
  ['course', /^(course|crse)$/],
  ['section', /^(section|sec)$/],
  ['seats', /^seats/],
  ['status', /^status$/],
];

const clean = (text: string | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim();

/** Maps header labels to column indexes; null when the table has no CRN column. */
export function findSectionColumns(headers: string[]): SectionColumns | null {
  const columns: Partial<SectionColumns> = {};
  headers.forEach((header, index) => {
    const label = clean(header).toLowerCase().replace(/#/g, '').trim();
    const match = COLUMN_PATTERNS.find(([key, pattern]) => columns[key] === undefined && pattern.test(label));
    if (match) columns[match[0]] = index;
  });
  return columns.crn === undefined ? null : columns as SectionColumns;
}

/**
 * Reads one table row. Without columns it falls back to recognizing the values themselves.
 * Returns null for rows that aren't a section, and for classes the student is already enrolled in.
 */
export function parseSectionRow(cells: string[], columns: SectionColumns | null): ScannedSection | null {
  const values = cells.map(clean);
  let crn = '';
  let subject = '';
  let course = '';
  let section = '';
  let seats = '';
  let status = '';

  if (columns) {
    const at = (index?: number): string => (index === undefined ? '' : values[index] ?? '');
    crn = at(columns.crn);
    subject = at(columns.subject).toUpperCase();
    course = at(columns.course).toUpperCase();
    section = at(columns.section).toUpperCase();
    seats = at(columns.seats);
    status = at(columns.status);
  } else {
    for (const value of values) {
      if (!crn && /^\d{5}$/.test(value)) crn = value;
      else if (!subject && /^[A-Za-z]{3,4}$/.test(value)) subject = value.toUpperCase();
      else if (subject && !course && /^\d{3}[A-Za-z]?$/.test(value)) course = value.toUpperCase();
      else if (course && !section && /^[A-Za-z0-9]{3}$/.test(value)) section = value.toUpperCase();
    }
  }

  if (!/^\d{5}$/.test(crn) || !/^[A-Z]{3,4}$/.test(subject) || !/^\d{3}[A-Z]?$/.test(course)) return null;
  if (/enrolled|registered/i.test(status)) return null;

  return {
    crn,
    subject,
    course,
    section: /^[A-Z0-9]{3}$/.test(section) ? section : 'XXX',
    seatsOpen: /^\d+$/.test(seats) ? Number(seats) : null,
  };
}
