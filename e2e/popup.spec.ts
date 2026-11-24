import { expect, test } from './fixtures';
import { E2E_ACCESS_TOKEN } from './helpers/mocks';

test.describe('Popup', () => {
  test('switches between the Home, Help and Settings tabs', async ({ context, extensionId, mocks }) => {
    void mocks;
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);

    const tab = (name: string) => page.getByRole('button', { name, exact: true });
    await expect(page.locator('#tab-home')).toBeVisible();
    await expect(page.locator('#tab-help')).toBeHidden();
    await expect(page.locator('#tab-settings')).toBeHidden();

    // Signed out (the mocked API answers 401).
    await expect(page.locator('#auth-state-container')).toContainText('Not signed in');
    await expect(page.getByRole('link', { name: /Sign in to AggieSB\+/ })).toBeVisible();

    await tab('Help').click();
    await expect(page.locator('#tab-help')).toBeVisible();
    await expect(page.locator('#tab-home')).toBeHidden();
    await expect(tab('Help')).toHaveClass(/active/);

    await tab('Settings').click();
    await expect(page.locator('#tab-settings')).toBeVisible();
    await expect(page.locator('#tab-help')).toBeHidden();
    await expect(tab('Settings')).toHaveClass(/active/);

    await tab('Home').click();
    await expect(page.locator('#tab-home')).toBeVisible();
    await expect(page.locator('#tab-settings')).toBeHidden();
  });

  test('"Send anonymous usage stats" is on by default and the choice survives a reload', async ({ context, extensionId, serviceWorker, mocks }) => {
    void mocks;
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();

    const toggle = page.locator('#usage-stats-toggle');
    const switchFor = (id: string) => page.locator('label.toggle-switch').filter({ has: page.locator(id) });
    await expect(toggle).toBeChecked();

    await switchFor('#usage-stats-toggle').click();
    await expect(toggle).not.toBeChecked();
    // It is stored in chrome.storage.sync, which is what the background script reads.
    await expect.poll(() => serviceWorker.evaluate(async () => (await chrome.storage.sync.get('usageStatsEnabled')).usageStatsEnabled)).toBe(false);

    await page.reload();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('#usage-stats-toggle')).not.toBeChecked();

    // And back on.
    await switchFor('#usage-stats-toggle').click();
    await expect(page.locator('#usage-stats-toggle')).toBeChecked();
    await expect.poll(() => serviceWorker.evaluate(async () => (await chrome.storage.sync.get('usageStatsEnabled')).usageStatsEnabled)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('#usage-stats-toggle')).toBeChecked();
  });

  test('the privacy policy link points to the website', async ({ context, extensionId, mocks }) => {
    void mocks;
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const link = page.getByRole('link', { name: 'Privacy policy' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://aggiesbp.com/privacy');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('Sign out of this browser revokes the session and clears the site cookies (D-021)', async ({ context, extensionId, mocks }) => {
    const OLD_SITE = 'https://aggieschedulebuilderplus.vercel.app';
    await context.addCookies([
      { name: 'st-access-token', value: E2E_ACCESS_TOKEN, url: OLD_SITE },
      { name: 'st-refresh-token', value: 'e2e-refresh', url: OLD_SITE },
    ]);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);
    await expect(page.locator('#auth-state-container')).toContainText('Signed in to AggieSB+');
    await expect(page.locator('#auth-state-container')).toContainText('student@example.test');

    await page.getByRole('button', { name: 'Sign out of this browser' }).click();
    await expect(page.locator('#auth-state-container')).toContainText('Not signed in');
    expect(mocks.requests.filter(request => request.includes('/auth/signout'))).toHaveLength(1);
    expect((await context.cookies(OLD_SITE)).filter(cookie => cookie.name.startsWith('st-'))).toEqual([]);
  });
});
