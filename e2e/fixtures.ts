import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect, test as base, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { BUILD_DIR } from './paths';
import { installMocks, type Mocks } from './helpers/mocks';

interface Fixtures {
  /** A fresh Chromium profile with the built extension loaded. */
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  mocks: Mocks;
  /** Opens a new tab at a (mocked) page. */
  openPage(url: string): Promise<Page>;
}

export const test = base.extend<Fixtures>({
  // Extensions only load in a persistent context.
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agsbp-e2e-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      // The "chromium" channel is the full browser in new headless mode, which supports extensions
      // (the default headless shell does not).
      channel: 'chromium',
      headless: !process.env.HEADED,
      viewport: { width: 1280, height: 900 },
      args: [
        `--disable-extensions-except=${BUILD_DIR}`,
        `--load-extension=${BUILD_DIR}`,
        // Safety net: anything the routes in helpers/mocks.ts do not answer cannot resolve, so nothing
        // (including analytics sent while the extension installs) reaches a real server.
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
      ],
    });
    try {
      await use(context);
    } finally {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  },

  mocks: async ({ context }, use) => {
    await use(await installMocks(context));
  },

  serviceWorker: async ({ context }, use) => {
    const [existing] = context.serviceWorkers();
    await use(existing ?? (await context.waitForEvent('serviceworker')));
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  openPage: async ({ context, mocks }, use) => {
    void mocks; // routes must be in place before any page loads
    await use(async url => {
      const page = await context.newPage();
      await page.goto(url);
      return page;
    });
  },
});

export { expect };

// The sidebar is hidden with a "collapsed" class (off-screen, opacity 0), not display:none,
// so open/closed is asserted through the class and the viewport rather than toBeVisible().
export const panel = (page: Page) => page.locator('#professor-compare-panel');
export const toggleButton = (page: Page) => page.locator('#prof-toggle-btn');
