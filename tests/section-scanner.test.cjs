const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.createContext(context);
vm.runInContext(ts.transpileModule(fs.readFileSync('src/utils/section-scanner.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const { findSectionColumns, parseSectionRow } = context.exports;

const plain = value => JSON.parse(JSON.stringify(value));

// Cell text as College Scheduler renders it (header cells include the <br> as whitespace).
const SECTIONS_HEADER = ['', '', 'CRN\n#', 'Subject', 'Course', 'Section', 'Credits', 'Seats\nOpen', 'Instruction Mode', 'Day(s) & Location(s)'];
const CURRENT_HEADER = ['', '', 'Status', 'CRN\n#', 'Subject', 'Course', 'Section', 'Credits', 'Instruction Mode', 'Day(s) & Location(s)'];

test('reads columns by header name', () => {
  assert.deepEqual(plain(findSectionColumns(SECTIONS_HEADER)), { crn: 2, subject: 3, course: 4, section: 5, seats: 7 });
  assert.deepEqual(plain(findSectionColumns(CURRENT_HEADER)), { status: 2, crn: 3, subject: 4, course: 5, section: 6 });
  assert.equal(findSectionColumns(['Course', 'Title']), null);
  // textContent drops the <br> in "Seats<br>Open" and "CRN<br>#".
  assert.deepEqual(plain(findSectionColumns(['', 'CRN#', 'Subject', 'Course', 'Section', 'SeatsOpen'])),
    { crn: 1, subject: 2, course: 3, section: 4, seats: 5 });
});

test('parses a sections or cart row, including a full section', () => {
  const columns = findSectionColumns(SECTIONS_HEADER);
  const row = ['', '', ' 39296 ', 'STAT', '335', '500', '3', '0', 'Traditional Face-to-Face (F2F)', 'MWF 12:40pm - 1:30pm BLOC 113'];
  assert.deepEqual(plain(parseSectionRow(row, columns)),
    { crn: '39296', subject: 'STAT', course: '335', section: '500', seatsOpen: 0 });
});

test('skips enrolled classes even though the Status column shifts everything', () => {
  const columns = findSectionColumns(CURRENT_HEADER);
  const row = ['', '', 'Enrolled', '64995', 'CSCE', '421', '501', '3', 'Traditional Face-to-Face (F2F)', 'TTh 11:10am - 12:25pm HRBB 124'];
  assert.equal(parseSectionRow(row, columns), null);
  const waitlisted = [...row];
  waitlisted[2] = 'Wait Listed';
  assert.equal(plain(parseSectionRow(waitlisted, columns)).crn, '64995');
});

test('ignores badge/instructor rows and non-section text', () => {
  const columns = findSectionColumns(SECTIONS_HEADER);
  assert.equal(parseSectionRow(['', 'Prerequisites Restrictions Instructor: Leyk, Teresa'], columns), null);
  // The old scanner turned this into "UNKNOWN XXX-... (CRN Secti)".
  assert.equal(parseSectionRow(['', 'CSCE 221 Data Structures and Algorithms', 'Sections', '', ''], null), null);
});

test('falls back to recognizing values when there is no header', () => {
  assert.deepEqual(plain(parseSectionRow(['12343', 'CSCE', '221', '501', '4', '45'], null)),
    { crn: '12343', subject: 'CSCE', course: '221', section: '501', seatsOpen: null });
});
