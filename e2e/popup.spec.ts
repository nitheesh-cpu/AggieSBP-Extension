import { expect, test } from './fixtures';

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
    await expect(link).toHaveAttribute('href', 'https://aggieschedulebuilderplus.vercel.app/privacy');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
});
