import type { ReviewStats } from '../services/professor-service';

/**
 * HTML for the structured summary fields (TL;DR, review stats, tips).
 * Every builder returns '' when its field is missing, so older API responses
 * (or a database without the structured-summary migration) render as before.
 */

export function escapeSummaryText(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

interface StatChip {
  value: string;
  label: string;
  n: number;
}

const pct = (value: number): string => `${Math.round(value)}%`;
const reviewsLabel = (n: number): string => `${n} review${n === 1 ? '' : 's'}`;

function topGrades(distribution: Record<string, number>, total: number): string {
  return Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([grade, count]) => `${grade} ${pct((100 * count) / total)}`)
    .join(' · ');
}

/** Stats that at least one review reported; a stat with n = 0 is left out. */
export function reviewStatChips(stats?: ReviewStats | null): StatChip[] {
  if (!stats) return [];
  const chips: StatChip[] = [];
  const add = (n: number | undefined, value: number | null | undefined, format: (v: number) => string, label: string) => {
    if ((n ?? 0) > 0 && typeof value === 'number' && Number.isFinite(value)) {
      chips.push({ value: format(value), label, n: n as number });
    }
  };

  add(stats.would_take_again_n, stats.would_take_again_pct, pct, 'would take again');
  const gradesN = stats.grades_reported_n ?? 0;
  if (gradesN > 0 && stats.grade_distribution) {
    const grades = topGrades(stats.grade_distribution, gradesN);
    if (grades) chips.push({ value: grades, label: 'reported grades', n: gradesN });
  }
  add(stats.attendance_n, stats.attendance_mandatory_pct, pct, 'say attendance is mandatory');
  add(stats.textbook_n, stats.textbook_used_pct, pct, 'used the textbook');
  const fixed = (v: number) => v.toFixed(1);
  add(stats.recent_n, stats.avg_rating_recent, fixed, `avg rating, last ${stats.recent_window_years ?? 2} years`);
  add(stats.older_n, stats.avg_rating_older, fixed, 'avg rating, earlier');
  return chips;
}

export function buildReviewStatsHTML(stats?: ReviewStats | null): string {
  const chips = reviewStatChips(stats);
  if (!chips.length) return '';
  const items = chips.map(chip =>
    `<li class="prof-stat" title="Based on ${reviewsLabel(chip.n)}">` +
    `<span class="prof-stat-value">${escapeSummaryText(chip.value)}</span> ` +
    `<span class="prof-stat-label">${escapeSummaryText(chip.label)}</span> ` +
    `<span class="prof-stat-n">(${reviewsLabel(chip.n)})</span></li>`
  ).join('');
  return `<ul class="prof-stats" aria-label="Review statistics">${items}</ul>`;
}

export function buildTldrSectionHTML(tldr?: string | null): string {
  if (!tldr || !tldr.trim()) return '';
  return `<div class="prof-summ-section">
         <span class="prof-summ-label prof-summ-label-tldr">TL;DR</span>
         <p class="prof-summ-text">${escapeSummaryText(tldr.trim())}</p>
       </div>`;
}

export function cleanTips(tips?: string[] | null): string[] {
  return (tips || []).filter(tip => typeof tip === 'string' && tip.trim()).map(tip => tip.trim());
}

/** Tips list; `extra` hides it in the compact summary view. */
export function buildTipsSectionHTML(tips: string[] | null | undefined, extra: boolean): string {
  const items = cleanTips(tips);
  if (!items.length) return '';
  return `<div class="prof-summ-section${extra ? ' prof-summ-extra' : ''}">
         <span class="prof-summ-label prof-summ-label-tips">Tips</span>
         <ul class="prof-summ-list">${items.map(tip => `<li>${escapeSummaryText(tip)}</li>`).join('')}</ul>
       </div>`;
}
