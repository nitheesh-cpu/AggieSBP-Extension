import { expect, test } from './fixtures';

test.describe('Onboarding', () => {
  test('opens by itself when the extension is installed', async ({ context, extensionId, mocks }) => {
    void mocks;
    // The background script opens onboarding.html from runtime.onInstalled (reason "install"), which
    // Chromium fires when it loads an unpacked extension into a new profile. The tab may already be
    // open by the time the test starts, so look at the existing pages as well as new ones.
    const onboardingUrl = `chrome-extension://${extensionId}/onboarding.html`;
    await expect.poll(() => context.pages().map(page => page.url())).toContain(onboardingUrl);

    const page = context.pages().find(candidate => candidate.url() === onboardingUrl)!;
    await expect(page.locator('#tour-modal')).toBeVisible();
    await expect(page.locator('#tour-modal-title')).not.toBeEmpty();
  });

  test('the tour can be opened again from the popup Help tab', async ({ context, extensionId, mocks }) => {
    void mocks;
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/index.html`);
    await popup.getByRole('button', { name: 'Help', exact: true }).click();
    const opened = context.waitForEvent('page', page => page.url().endsWith('/onboarding.html'));
    await popup.locator('#open-tour').click();
    const tour = await opened;
    await expect(tour.locator('#tour-modal')).toBeVisible();
  });
});
