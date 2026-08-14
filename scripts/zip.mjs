import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const target = process.argv[2] || "build";
const zipName = process.argv[3] || (target === "build-firefox" ? "build-firefox.zip" : "build.zip");
const root = process.cwd();
const targetDir = path.join(root, target);
const zipPath = path.join(root, zipName);

function createZipArchive(sourceDir, outZipPath) {
  if (!fs.existsSync(path.join(sourceDir, "manifest.json"))) {
    console.error(`❌ Cannot find manifest.json inside ${sourceDir}/ directory.`);
    process.exit(1);
  }

  const files = [];

  function readDirRecursive(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        readDirRecursive(fullPath);
      } else if (entry.isFile()) {
        // Enforce POSIX forward slashes for all entry paths inside zip archive
        const relPath = path.relative(sourceDir, fullPath).replace(/\\/g, "/");
        files.push({ fullPath, relPath });
      }
    }
  }

  readDirRecursive(sourceDir);

  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const data = fs.readFileSync(file.fullPath);
    const filenameBuf = Buffer.from(file.relPath, "utf8");
    const crc = zlib.crc32(data);
    const compressedData = zlib.deflateRawSync(data);

    const isDeflated = compressedData.length < data.length;
    const finalData = isDeflated ? compressedData : data;
    const method = isDeflated ? 8 : 0;

    // Local Header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
    localHeader.writeUInt16LE(method, 8);     // Compression method
    localHeader.writeUInt16LE(0, 10);         // Last mod file time
    localHeader.writeUInt16LE(0, 12);         // Last mod file date
    localHeader.writeUInt32LE(crc, 14);       // CRC-32
    localHeader.writeUInt32LE(finalData.length, 18); // Compressed size
    localHeader.writeUInt32LE(data.length, 22);     // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28);         // Extra field length
    filenameBuf.copy(localHeader, 30);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46 + filenameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralHeader.writeUInt16LE(20, 4);         // Version made by
    centralHeader.writeUInt16LE(20, 6);         // Version needed to extract
    centralHeader.writeUInt16LE(0, 8);          // General purpose bit flag
    centralHeader.writeUInt16LE(method, 10);    // Compression method
    centralHeader.writeUInt16LE(0, 12);         // Last mod file time
    centralHeader.writeUInt16LE(0, 14);         // Last mod file date
    centralHeader.writeUInt32LE(crc, 16);       // CRC-32
    centralHeader.writeUInt32LE(finalData.length, 20); // Compressed size
    centralHeader.writeUInt32LE(data.length, 24);     // Uncompressed size
    centralHeader.writeUInt16LE(filenameBuf.length, 28); // Filename length
    centralHeader.writeUInt16LE(0, 30);         // Extra field length
    centralHeader.writeUInt16LE(0, 32);         // File comment length
    centralHeader.writeUInt16LE(0, 36);         // Internal file attributes
    centralHeader.writeUInt32LE(0, 38);         // External file attributes
    centralHeader.writeUInt32LE(offset, 42);    // Relative offset of local header
    filenameBuf.copy(centralHeader, 46);

    localHeaders.push(localHeader, finalData);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + finalData.length;
  }

  const centralDirStart = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of Central Directory Record (EOCD - 22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4);         // Number of this disk
  eocd.writeUInt16LE(0, 6);         // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirStart, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);        // Comment length

  const zipBuffer = Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  fs.writeFileSync(outZipPath, zipBuffer);
}

console.log(`Zipping ${target} -> ${zipName}...`);
createZipArchive(targetDir, zipPath);
console.log(`✅ POSIX zip package created successfully: ${zipName}`);
