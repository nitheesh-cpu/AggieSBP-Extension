import fs from 'node:fs';
import path from 'node:path';
import { BUILD_DIR } from './paths';

/** Fails fast with a clear message when the extension has not been built. */
export default function globalSetup(): void {
  const needed = ['manifest.json', 'background.js', 'content/main.js', 'content/howdy.js', 'index.html', 'onboarding.html'];
  const missing = needed.filter(file => !fs.existsSync(path.join(BUILD_DIR, file)));
  if (missing.length) {
    throw new Error(`The extension is not built (missing ${missing.join(', ')} in ${BUILD_DIR}). Run "npm run build" first.`);
  }
}
