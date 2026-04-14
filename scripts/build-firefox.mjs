import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const chromeBuildDir = path.join(root, "build");
const firefoxBuildDir = path.join(root, "build-firefox");
const firefoxManifestTemplatePath = path.join(
  root,
  "public",
  "manifest-firefox.json",
);

const requiredFiles = [
  "background.js",
  "content/main.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

async function ensureFile(filePath) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Required file missing: ${path.relative(root, filePath)}`);
  }
}

async function run() {
  await ensureFile(path.join(chromeBuildDir, "manifest.json"));
  await ensureFile(firefoxManifestTemplatePath);

  await mkdir(firefoxBuildDir, { recursive: true });
  await cp(chromeBuildDir, firefoxBuildDir, { recursive: true, force: true });

  const manifestPath = path.join(firefoxBuildDir, "manifest.json");
  const manifestRaw = await readFile(firefoxManifestTemplatePath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  manifest.content_scripts = (manifest.content_scripts || []).map((script) => ({
    ...script,
    js: (script.js || []).map((entry) =>
      entry === "content/main.ts" ? "content/main.js" : entry,
    ),
  }));

  manifest.icons = manifest.icons || {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  };

  manifest.action = manifest.action || {};
  manifest.action.default_icon = manifest.action.default_icon || manifest.icons;

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  for (const relativePath of requiredFiles) {
    await ensureFile(path.join(firefoxBuildDir, relativePath));
  }

  console.log("Firefox package ready at build-firefox/");
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
