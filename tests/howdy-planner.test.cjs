const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {}, TextEncoder, btoa };
vm.createContext(context);
vm.runInContext(ts.transpileModule(fs.readFileSync('src/utils/howdy-planner.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const {
  termKeyFromLabel,
  termKeyFromAcademicYear,
  isDegreePlannerUrl,
  rowToCourse,
  rowsToCourses,
  summarize,
  encodePayload,
} = context.exports;

const plain = value => JSON.parse(JSON.stringify(value));
const row = (code, badges, extra = {}) => ({
  term: '20251', evaluated: true, code, title: `${code} title`, credits: 3, badges, ...extra,
});

test('term keys from Howdy labels and academic years', () => {
  assert.equal(termKeyFromLabel(' 2024 - Summer '), '20242');
  assert.equal(termKeyFromLabel('2025 - Fall'), '20253');
  assert.equal(termKeyFromLabel('Spring 2027'), '20271');
  assert.equal(termKeyFromLabel('Academic Terms'), null);
  assert.equal(termKeyFromAcademicYear('2023-2024', 'summer'), '20242');
  assert.equal(termKeyFromAcademicYear('2024-2025', 'fall'), '20243');
  assert.equal(termKeyFromAcademicYear('2024-2025', 'spring'), '20251');
  assert.equal(termKeyFromAcademicYear('', 'fall'), null);
});

test('only the degree planner page counts', () => {
  assert.equal(isDegreePlannerUrl('https://howdy.tamu.edu/main/home/degree-planner-ui/'), true);
  assert.equal(isDegreePlannerUrl('https://howdy.tamu.edu/uPortal/p/home'), false);
  assert.equal(isDegreePlannerUrl('https://evil.example/howdy.tamu.edu/degree-planner'), false);
});

test('badges map to status, grade and transfer credit', () => {
  assert.deepEqual(plain(rowToCourse(row('CSCE 120', ['A']))), {
    code: 'CSCE 120', title: 'CSCE 120 title', credits: 3, term: '20251',
    status: 'completed', grade: 'A', transfer: false,
  });
  const tcr = plain(rowToCourse(row('ARTS 149', ['TCR'], { term: '20242' })));
  assert.equal(tcr.status, 'completed');
  assert.equal(tcr.transfer, true);
  assert.equal(tcr.grade, null);
  assert.equal(tcr.term, null);
  const ta = plain(rowToCourse(row('ENGL 210', ['TA'])));
  assert.equal(ta.grade, 'A');
  assert.equal(ta.transfer, true);
  assert.equal(rowToCourse(row('FYEX 101', ['S'])).grade, 'S');
  // Howdy renders an empty primary badge next to "In Progress".
  const ip = plain(rowToCourse(row('CSCE 421', ['In Progress'], { term: '20263' })));
  assert.equal(ip.status, 'in_progress');
  assert.equal(ip.grade, null);
  assert.equal(ip.term, '20263');
  assert.equal(rowToCourse(row('CSCE 412', [], { term: '20271', evaluated: false })).status, 'planned');
  assert.equal(rowToCourse(row('CSCE 999', [], { evaluated: true })).status, 'in_progress');
});

test('one entry per course, keeping the most settled', () => {
  const courses = plain(rowsToCourses([
    row('CSCE 110', ['TCR'], { credits: 1 }),
    row('CSCE 110', ['TCR'], { credits: 3 }),
    row('MATH 151', ['F'], { term: '20243' }),
    row('MATH 151', ['B'], { term: '20251' }),
    row('CSCE 491', ['In Progress'], { term: '20263' }),
    row('CSCE 491', [], { term: '20271', evaluated: false }),
    row('STAT 211', ['A'], { term: '20253' }),
    row('STAT 211', [], { term: '20271', evaluated: false }),
  ]));
  const by = Object.fromEntries(courses.map(c => [c.code, c]));
  assert.equal(courses.length, 4);
  assert.equal(by['CSCE 110'].credits, 1);
  assert.equal(by['MATH 151'].grade, 'B');
  assert.equal(by['CSCE 491'].status, 'in_progress');
  assert.equal(by['STAT 211'].status, 'completed');
  assert.deepEqual(plain(summarize(courses)), {
    total: 4, completed: 3, inProgress: 1, planned: 0, terms: 3,
  });
});

test('payload is base64url JSON', () => {
  const encoded = encodePayload(
    { courses: [rowToCourse(row('ENGL 104', ['TCR'], { title: 'COMPOSITION & RHETORIC é' }))] },
    new Date('2026-11-07T00:00:00Z'),
  );
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  const json = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const payload = JSON.parse(json);
  assert.equal(payload.v, 1);
  assert.equal(payload.source, 'howdy-degree-planner');
  assert.equal(payload.courses[0].title, 'COMPOSITION & RHETORIC é');
});

test('tells the curriculum screen from the plan view', () => {
  const { plannerPage } = context.exports;
  assert.equal(plannerPage('https://howdy.tamu.edu/main/home/degree-planner-ui/curriculum'), 'curriculum');
  assert.equal(plannerPage('https://howdy.tamu.edu/main/home/degree-planner-ui/planner'), 'planner');
  assert.equal(plannerPage('https://howdy.tamu.edu/main/home/degree-planner-ui/planner/?x=1'), 'planner');
  assert.equal(plannerPage('https://howdy.tamu.edu/main/home/degree-planner-ui/evaluate'), 'evaluate');
  assert.equal(plannerPage('https://howdy.tamu.edu/main/home/degree-planner-ui/'), 'other');
});

const { staticRule, codesFromList, rulesToRequirements } = context.exports;
const rule = (area, text, extra = {}) => ({
  area, areaHours: 30, areaMet: true, text, hours: 3, note: '', met: true, applied: [], ...extra,
});

test('static rules are course codes joined by or/and', () => {
  assert.deepEqual(plain(staticRule('CSCE 120')), { codes: ['CSCE 120'], any: false });
  assert.deepEqual(plain(staticRule('ENGL 103 or ENGL 104')), { codes: ['ENGL 103', 'ENGL 104'], any: true });
  assert.deepEqual(plain(staticRule('ENGR 216 or PHYS 216')), { codes: ['ENGR 216', 'PHYS 216'], any: true });
  assert.equal(staticRule('Theory Directed Elective'), null);
  assert.equal(staticRule('MATH Rqmt'), null);
  assert.equal(staticRule('Science Elective I'), null);
});

test('"Select from" lists reuse the last subject', () => {
  assert.deepEqual(
    plain(codesFromList('Must make a grade of C or better. Select from STAT 315, 335, 404, 406.')),
    ['STAT 315', 'STAT 335', 'STAT 404', 'STAT 406'],
  );
});

test('rules become requirement groups', () => {
  const groups = plain(rulesToRequirements([
    rule('Major Coursework', 'CSCE 120', { applied: ['CSCE 120'] }),
    rule('Major Coursework', 'CSCE 221', { hours: 4, applied: ['CSCE 221'] }),
    rule('Major Coursework', 'CSCE 482', { met: false }),
    rule('Communication', 'ENGL 103 or ENGL 104', { applied: ['ENGL 104'] }),
    rule('Supporting Coursework', 'Theory Directed Elective', { applied: ['CSCE 411'] }),
    rule('Supporting Coursework', 'Emphasis Area', { hours: 12, met: false }),
    rule('Statistics Minor', 'Elective', {
      hours: 9, met: false, note: 'Select from STAT 315, 335, 404.', applied: ['CSCE 421', 'STAT 404'],
    }),
    rule('Residence Requirement', 'Residence-Major', { hours: 12 }),
    rule('University Writing Requirement', 'Writing Requirement', { areaHours: 0, hours: null }),
  ]));
  assert.deepEqual(groups.map(g => [g.area, g.name, g.kind, g.pick, g.options.length, g.met]), [
    ['Major Coursework', 'Required courses', 'fixed', 3, 3, false],
    ['Communication', 'ENGL 103 or ENGL 104', 'choice', 1, 2, true],
    ['Supporting Coursework', 'Theory Directed Elective (3 hrs)', 'elective', 1, 1, true],
    ['Supporting Coursework', 'Emphasis Area (12 hrs)', 'elective', 4, 0, false],
    ['Statistics Minor', 'Elective (9 hrs)', 'choice', 3, 2, false],
  ]);
  // Only what Howdy applied is an option; the "Select from" list is what's allowed.
  assert.deepEqual(groups[4].options.flat(), ['CSCE 421', 'STAT 404']);
  assert.deepEqual(groups[4].allowed, ['STAT 315', 'STAT 335', 'STAT 404']);
});
