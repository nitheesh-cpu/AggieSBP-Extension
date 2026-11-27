import { expect, panel, test, toggleButton } from './fixtures';
import { URLS } from './helpers/data';

// Allowed in the request body: the Umami envelope and, per event, small enum/count fields.
const ENVELOPE_KEYS = ['website', 'hostname', 'url', 'title', 'language', 'screen', 'name', 'data'];
const DATA_KEYS = ['page', 'site', 'version', 'action', 'source', 'courses', 'completed', 'inProgress', 'planned', 'terms', 'blocks', 'browser', 'previousVersion', 'weight'];

test.describe('Anonymous usage stats', () => {
  test('a sections page sends coarse events with no personal or course data', async ({ openPage, mocks }) => {
    const page = await openPage(URLS.sections);
    await expect(toggleButton(page)).toBeVisible();
    await toggleButton(page).click();
    await expect(panel(page)).not.toHaveClass(/collapsed/);
    await expect(panel(page).locator('.prof-card')).toHaveCount(2);

    // ext-panel-open is always sent; ext-page-enhanced only for 1 in 5 loads (parent D-025),
    // so it can't be waited for.
    const opened = await mocks.waitForStat('ext-panel-open');
    expect(opened.data).toMatchObject({ page: 'sections', site: 'collegescheduler' });
    expect(opened.url).toBe('/extension/collegescheduler/sections');
    // Unpacked builds are kept apart from store installs in the stats.
    expect(opened.hostname).toBe('extension-dev.aggiesbp');

    // When this load was sampled in, the event carries its weight.
    for (const enhanced of mocks.stats.filter(event => event.name === 'ext-page-enhanced')) {
      expect(enhanced.data).toMatchObject({ page: 'sections', site: 'collegescheduler', weight: 5 });
    }

    // Everything sent, including anything else that arrives, is on the allowlist and anonymous.
    for (const event of mocks.stats) {
      const body = JSON.parse(event.raw) as { type: string; payload: Record<string, unknown> };
      expect(body.type).toBe('event');
      expect(Object.keys(body.payload).every(key => ENVELOPE_KEYS.includes(key)), `envelope keys of ${event.name}`).toBe(true);
      expect(Object.keys(event.data).every(key => DATA_KEYS.includes(key)), `data keys of ${event.name}`).toBe(true);
      expect(event.raw).not.toMatch(/Rivera|Natarajan|Jordan|Priya|CSCE|121|Spring|College Station|202711|prof-|@|st-access-token/i);
    }
  });

  test('with the toggle off, nothing is sent to the stats server', async ({ context, extensionId, serviceWorker, openPage, mocks }) => {
    // Control: with stats on, a page view is counted, so the checks below could have caught a send.
    // (ext-panel-open, not the sampled ext-page-enhanced, so the control never depends on chance.)
    const first = await openPage(URLS.sections);
    await expect(toggleButton(first)).toBeVisible();
    await toggleButton(first).click();
    await mocks.waitForStat('ext-panel-open', event => event.data.page === 'sections');

    // Turn stats off in the popup, like a user would.
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/index.html`);
    await popup.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(popup.locator('#usage-stats-toggle')).toBeChecked();
    await popup.locator('label.toggle-switch').filter({ has: popup.locator('#usage-stats-toggle') }).click();
    await expect.poll(() => serviceWorker.evaluate(async () => (await chrome.storage.sync.get('usageStatsEnabled')).usageStatsEnabled)).toBe(false);
    await popup.close();

    const sentBefore = mocks.stats.length;
    const requestsBefore = mocks.unmocked.length;

    // Activity that would normally be counted: other page types, opening the sidebar, a fit import.
    const schedule = await openPage(URLS.currentSchedule);
    await expect(toggleButton(schedule)).toBeVisible();
    await toggleButton(schedule).click();
    await expect(panel(schedule)).not.toHaveClass(/collapsed/);
    await schedule.locator('#fit-import-btn').click();
    await expect(schedule.locator('#fit-import-status')).toContainText('Imported 2 block(s)');
    const alerts = await openPage(URLS.options);
    await expect(toggleButton(alerts)).toBeVisible();
    await toggleButton(alerts).click();
    await expect(panel(alerts)).not.toHaveClass(/collapsed/);
    // The account lookup is sent after the usage message from the same page, so once it has
    // answered, the background script has already decided about the events.
    await expect(panel(alerts).locator('.prof-account-status')).toContainText('Not signed in');
    // Round trip through the background script's own storage queue.
    await serviceWorker.evaluate(() => chrome.storage.sync.get('usageStatsEnabled'));

    expect(mocks.stats.length).toBe(sentBefore);
    expect(mocks.stats.map(event => event.name)).not.toContain('ext-fit-import');
    // Nothing reached the real network either (any unmocked request is aborted and recorded).
    expect(mocks.unmocked.slice(requestsBefore)).toEqual([]);
  });
});
