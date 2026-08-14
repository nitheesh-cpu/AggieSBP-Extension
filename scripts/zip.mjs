import { execSync } from "node:child_process";
import { access, unlink } from "node:fs/promises";
import path from "node:path";

const target = process.argv[2] || "build"; // "build" or "build-firefox"
const zipName = process.argv[3] || (target === "build-firefox" ? "build-firefox.zip" : "build.zip");
const root = process.cwd();
const targetDir = path.join(root, target);
const zipPath = path.join(root, zipName);

async function createZip() {
  // Check if manifest.json exists in target directory
  try {
    await access(path.join(targetDir, "manifest.json"));
  } catch {
    console.error(`❌ Cannot find manifest.json inside ${target}/ directory.`);
    process.exit(1);
  }

  // Remove existing zip if present
  try {
    await unlink(zipPath);
  } catch { /* ignore if missing */ }

  const isWindows = process.platform === "win32";

  console.log(`Zipping ${target} -> ${zipName}...`);
  if (isWindows) {
    // Use PowerShell Compress-Archive to ensure manifest.json is at root without ./ prefix
    const cmd = `powershell -Command "Compress-Archive -Path '${target}\\*' -DestinationPath '${zipName}' -Force"`;
    execSync(cmd, { stdio: "inherit" });
  } else {
    // Unix zip
    const cmd = `cd "${targetDir}" && zip -r "../${zipName}" ./*`;
    execSync(cmd, { stdio: "inherit" });
  }

  console.log(`✅ Package created successfully: ${zipName}`);
}

createZip().catch((err) => {
  console.error(err);
  process.exit(1);
});
