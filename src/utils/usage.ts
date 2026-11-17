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
  | 'ext-fit-import';

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
