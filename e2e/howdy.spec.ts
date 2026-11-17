import { expect, test } from './fixtures';
import { SITE, URLS } from './helpers/data';

/** The panel lives in an open shadow root; Playwright locators pierce it. */
const importPanel = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Import to AggieSB+' });

function decodePayload(fragment: string): { v: number; source: string; courses: Array<Record<string, unknown>> } {
  const encoded = fragment.replace(/^#howdy=/, '');
  return JSON.parse(Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

test.describe('Howdy degree planner', () => {
  test('mounts the import panel and sends the planner courses to AggieSB+', async ({ context, openPage, mocks }) => {
    const page = await openPage(URLS.planner);

    const panel = importPanel(page);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Import to AggieSB+');
    // The fixture is already expanded and in table view, so the summary shows right away.
    await expect(panel).toContainText('Found 3 courses: 1 completed, 1 in progress, 1 planned.');
    const send = panel.getByRole('button', { name: 'Send to AggieSB+' });
    await expect(send).toHaveAttribute('aria-disabled', 'false');

    const opened = context.waitForEvent('page');
    await send.click();
    const planner = await opened;
    await expect(planner).toHaveURL(new RegExp(`^${SITE.replace(/[.]/g, '\\.')}/planner\\?utm_source=extension&utm_medium=howdy-import#howdy=`));

    const payload = decodePayload(new URL(planner.url()).hash);
    expect(payload.v).toBe(1);
    expect(payload.source).toBe('howdy-degree-planner');
    expect(payload.courses.map(c => [c.code, c.status, c.grade, c.term])).toEqual([
      ['CSCE 120', 'completed', 'A', '20253'],
      ['MATH 151', 'in_progress', null, '20253'],
      ['CSCE 221', 'planned', null, '20271'],
    ]);

    // Only counts go to analytics, never course codes.
    const event = await mocks.waitForStat('ext-howdy-import');
    expect(event.data).toMatchObject({ courses: 3, completed: 1, inProgress: 1, planned: 1, terms: 2 });
    expect(event.raw).not.toMatch(/CSCE|MATH|Program Design/);
  });

  test('can be minimized and restored', async ({ openPage }) => {
    const page = await openPage(URLS.planner);
    await importPanel(page).getByRole('button', { name: 'Minimize' }).click();
    await expect(importPanel(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'AggieSB+ import' }).click();
    await expect(importPanel(page)).toBeVisible();
  });

  test('on the curriculum screen the first step is the Evaluate button', async ({ openPage }) => {
    const page = await openPage(URLS.curriculum);
    const panel = importPanel(page);
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('listitem').first()).toContainText('Click "Evaluate & Go Plan View"');
    await expect(panel.getByRole('button', { name: 'Do it' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Send to AggieSB+' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('unmounts when the single-page app navigates away from the degree planner', async ({ openPage }) => {
    const page = await openPage(URLS.planner);
    await expect(importPanel(page)).toBeVisible();
    // Howdy is a SPA: the URL changes without a page load, and the content script follows it.
    await page.evaluate(() => history.pushState({}, '', '/uPortal/p/home'));
    await expect(importPanel(page)).toHaveCount(0);
    await page.evaluate(() => history.pushState({}, '', '/main/home/degree-planner-ui/planner'));
    await expect(importPanel(page)).toBeVisible();
  });
});
