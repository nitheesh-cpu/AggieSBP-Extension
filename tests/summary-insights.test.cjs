const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.createContext(context);
vm.runInContext(ts.transpileModule(fs.readFileSync('src/components/summary-insights.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const {
  buildReviewStatsHTML, buildTipsSectionHTML, buildTldrSectionHTML, reviewStatChips,
} = context.exports;

const STATS = {
  would_take_again_pct: 82.5, would_take_again_n: 40,
  grade_distribution: { A: 12, B: 5, 'C+': 1 }, grades_reported_n: 18,
  attendance_mandatory_pct: null, attendance_n: 0,
  textbook_used_pct: 25, textbook_n: 8,
  recent_window_years: 2,
  avg_rating_recent: 4.44, recent_n: 10,
  avg_rating_older: 3.9, older_n: 30,
};

test('stats with no reporting reviews are hidden', () => {
  const labels = reviewStatChips(STATS).map(chip => chip.label);
  assert.deepEqual([...labels], ['would take again', 'used the textbook']);
  const html = buildReviewStatsHTML(STATS);
  assert.match(html, /83%<\/span> <span class="prof-stat-label">would take again/);
  assert.doesNotMatch(html, /attendance/);
});

test('grades and average ratings are not repeated as chips', () => {
  const html = buildReviewStatsHTML(STATS);
  assert.doesNotMatch(html, /reported grades|avg rating/);
  const onlyDuplicates = { ...STATS, would_take_again_n: 0, textbook_n: 0 };
  assert.equal(buildReviewStatsHTML(onlyDuplicates), '');
});

test('missing structured fields render nothing', () => {
  for (const value of [undefined, null, {}, { would_take_again_pct: 90, would_take_again_n: 0 }]) {
    assert.equal(buildReviewStatsHTML(value), '');
  }
  assert.equal(buildTldrSectionHTML(undefined), '');
  assert.equal(buildTldrSectionHTML('  '), '');
  assert.equal(buildTipsSectionHTML(undefined, false), '');
  assert.equal(buildTipsSectionHTML(['', '  '], false), '');
});

test('tldr and tips are escaped and tips can be compact-only', () => {
  assert.match(buildTldrSectionHTML('Take <b>her</b>'), /Take &lt;b&gt;her&lt;\/b&gt;/);
  const tips = buildTipsSectionHTML(['Start early', '<script>'], true);
  assert.match(tips, /prof-summ-section prof-summ-extra/);
  assert.match(tips, /<li>Start early<\/li><li>&lt;script&gt;<\/li>/);
  assert.doesNotMatch(buildTipsSectionHTML(['Start early'], false), /prof-summ-extra/);
});
