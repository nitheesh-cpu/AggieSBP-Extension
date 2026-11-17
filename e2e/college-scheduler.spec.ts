import { expect, panel, test, toggleButton } from './fixtures';
import { URLS } from './helpers/data';

test.describe('College Scheduler: course sections page', () => {
  test('shows the AggieSB+ button and a panel with professor ratings from the API', async ({ openPage, mocks }) => {
    const page = await openPage(URLS.sections);

    const button = toggleButton(page);
    await expect(button).toBeVisible();
    await expect(button).toHaveText(/AggieSB\+/);

    // Closed until clicked.
    await expect(panel(page)).toHaveClass(/collapsed/);
    await button.click();
    await expect(panel(page)).not.toHaveClass(/collapsed/);
    await expect(panel(page)).toBeInViewport();
    await expect(panel(page).locator('.prof-panel-title')).toHaveText('Course Professors');

    // One card per professor, with the ratings the (mocked) API returned.
    const cards = panel(page).locator('.prof-card');
    await expect(cards).toHaveCount(2);

    const rivera = cards.filter({ hasText: 'Jordan Rivera' });
    await expect(rivera.locator('.prof-name')).toHaveText('Jordan Rivera');
    await expect(rivera.locator('.prof-rating-scope').first()).toContainText('CSCE121');
    await expect(rivera.locator('.prof-rating-scope').first()).toContainText('4.4 / 5');
    await expect(rivera.locator('.prof-rating-scope').first()).toContainText('12 reviews');
    await expect(rivera.locator('.prof-rating-scope').nth(1)).toContainText('4.6 / 5');
    await expect(rivera.locator('.prof-summ-container')).toContainText('Lectures walk through every example');
    await expect(rivera.locator('.prof-grades-legend')).toContainText('A: 50%');

    // Links go to the AggieSB+ professor page and Rate My Professors.
    await expect(rivera.getByRole('link', { name: 'Professor', exact: true })).toHaveAttribute('href', /aggieschedulebuilderplus\.vercel\.app\/professor\/prof-rivera\?.*utm_source=extension/);
    await expect(rivera.getByRole('link', { name: /Rate My Professors/ })).toHaveAttribute('href', 'https://www.ratemyprofessors.com/professor/123456');

    await expect(cards.filter({ hasText: 'Priya Natarajan' }).locator('.prof-rating-scope').nth(1)).toContainText('3.9 / 5');

    // The extension asked for exactly the course the page is on.
    expect(mocks.requests).toContain('GET https://api-aggiesbp.nitheeshk.com/sections/202711/course/CSCE121/professors/details?campus=College%20Station');
    expect(mocks.unmocked).toEqual([]);
  });

  test('the close button collapses the panel again', async ({ openPage }) => {
    const page = await openPage(URLS.sections);
    await toggleButton(page).click();
    await expect(panel(page)).not.toHaveClass(/collapsed/);
    await panel(page).locator('.prof-panel-close').click();
    await expect(panel(page)).toHaveClass(/collapsed/);
  });

  test('the Seat Alerts tab finds the sections on the page', async ({ openPage }) => {
    const page = await openPage(URLS.sections);
    await toggleButton(page).click();
    await panel(page).getByRole('button', { name: 'Seat Alerts' }).click();
    await expect(page.locator('#prof-sidebar-tab-alerts')).toBeVisible();
    // The full section is listed first and flagged.
    const rows = page.locator('#prof-sidebar-tab-alerts .aggiesbp-discovered-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('CSCE 121-501 (CRN 41201) · Full');
    await expect(rows.nth(1)).toContainText('CSCE 121-502 (CRN 41202)');
  });
});

test.describe('College Scheduler: current schedule page', () => {
  test('shows Fit My Schedule and imports the schedule blocks into AggieSB+', async ({ context, openPage, mocks }) => {
    const page = await openPage(URLS.currentSchedule);

    await expect(toggleButton(page)).toBeVisible();
    await toggleButton(page).click();
    await expect(panel(page)).not.toHaveClass(/collapsed/);
    await expect(panel(page).locator('.prof-panel-title')).toHaveText('Fit My Schedule');

    const importButton = page.locator('#fit-import-btn');
    await expect(importButton).toBeVisible();
    await expect(importButton).toHaveText(/Import current schedule/);

    const opened = context.waitForEvent('page');
    await importButton.click();
    await expect(page.locator('#fit-import-status')).toHaveText('Imported 2 block(s). Opening Fit My Schedule...');

    // A new tab opens on AggieSB+ with the two meeting patterns read off the page.
    const fitPage = await opened;
    await expect(fitPage).toHaveURL(/aggieschedulebuilderplus\.vercel\.app\/discover\/fit\?importSchedule=/);
    const url = new URL(fitPage.url());
    expect(url.searchParams.get('utm_source')).toBe('extension');
    expect(url.searchParams.get('utm_medium')).toBe('fit-import');
    expect(JSON.parse(url.searchParams.get('importSchedule') ?? '[]')).toEqual([
      { days: ['M', 'W', 'F'], start: '08:00', end: '08:50' },
      { days: ['T', 'R'], start: '09:35', end: '10:50' },
    ]);

    await mocks.waitForStat('ext-fit-import', event => event.data.blocks === 2);
  });

  test('"Open Fit My Schedule" opens the website without importing', async ({ context, openPage }) => {
    const page = await openPage(URLS.currentSchedule);
    await toggleButton(page).click();
    const opened = context.waitForEvent('page');
    await page.locator('#fit-open-btn').click();
    await expect(await opened).toHaveURL(/aggieschedulebuilderplus\.vercel\.app\/discover\/fit\?utm_source=extension&utm_medium=fit-open$/);
  });
});

test.describe('College Scheduler: any other page', () => {
  test('shows the seat alerts panel with a sign-in prompt when signed out', async ({ openPage, mocks }) => {
    const page = await openPage(URLS.options);

    await expect(toggleButton(page)).toBeVisible();
    await toggleButton(page).click();
    await expect(panel(page)).not.toHaveClass(/collapsed/);
    await expect(panel(page).locator('.prof-panel-title')).toHaveText('Seat Alerts');

    // The background script asked the (mocked) API and it said 401.
    const account = panel(page).locator('.prof-account-status');
    await expect(account).toContainText('Not signed in');
    const signIn = account.getByRole('link', { name: /Sign in/ });
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute('href', /aggieschedulebuilderplus\.vercel\.app\/auth\?redirectToPath=%2Fprofile%2Falerts/);

    await expect(page.locator('#prof-sidebar-tab-alerts .aggiesbp-alerts-title')).toHaveText('Seat Alerts');
    await expect(page.getByText('You are not watching any sections yet.')).toBeVisible();
    // The cart table on the page is scanned for sections to watch.
    await expect(page.locator('.aggiesbp-discovered-row')).toHaveCount(2);

    // No professor lookups on this kind of page.
    expect(mocks.requests.filter(request => request.includes('/professors/details'))).toEqual([]);
    expect(mocks.unmocked).toEqual([]);
  });
});
