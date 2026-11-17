import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** The built extension that gets loaded into Chromium (npm run build). */
export const BUILD_DIR = path.join(ROOT, 'build');
export const FIXTURE_DIR = path.join(ROOT, 'e2e', 'fixtures');
