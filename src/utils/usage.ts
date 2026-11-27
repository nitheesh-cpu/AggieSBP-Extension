/**
 * Content-script side of the anonymous usage counts: hands the event to the
 * background script, which checks the opt-out, the allowlist and rate limits
 * (the "Anonymous usage counts" section of src/background.ts). Only pass
 * coarse labels and counts here, never names, grades, course codes or
 * professor names.
 */
export type UsageEvent =
  | 'ext-page-enhanced'
  | 'ext-panel-open'
  | 'ext-professor-action'
  | 'ext-seat-alert-add'
  | 'ext-howdy-import'
  | 'ext-fit-import'
  | 'ext-access-prompt';

/** Page loads are sampled 1 in SAMPLE_WEIGHT; each sent event carries weight: SAMPLE_WEIGHT. */
export const SAMPLE_WEIGHT = 5;

export function shouldSample(random: number = Math.random()): boolean {
  return random < 1 / SAMPLE_WEIGHT;
}

const sentThisLoad = new Set<string>();

export function reportUsage(
  name: UsageEvent,
  data: Record<string, string | number> = {},
  { oncePerLoad = false } = {},
): void {
  if (oncePerLoad) {
    const key = `${name}|${JSON.stringify(data)}`;
    if (sentThisLoad.has(key)) return;
    sentThisLoad.add(key);
  }
  try {
    chrome.runtime.sendMessage(
      { type: 'USAGE_EVENT', name, data, screen: `${screen.width}x${screen.height}` },
      () => void chrome.runtime.lastError,
    );
  } catch {
    /* extension was reloaded or updated under this page */
  }
}

/**
 * High-volume events (one per page load): send 1 in SAMPLE_WEIGHT with
 * weight: SAMPLE_WEIGHT so reviewers can sum weight to estimate the true count.
 * Always once per load; the sample is drawn once, so a load is either in or out.
 */
export function reportSampled(
  name: UsageEvent,
  data: Record<string, string | number> = {},
): void {
  const key = `${name}|${JSON.stringify(data)}`;
  if (sentThisLoad.has(key)) return;
  if (!shouldSample()) {
    sentThisLoad.add(key);
    return;
  }
  reportUsage(name, { ...data, weight: SAMPLE_WEIGHT }, { oncePerLoad: false });
  sentThisLoad.add(key);
}
