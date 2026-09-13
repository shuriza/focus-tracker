import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionDir = join(root, "extension");

// Runtime files shipped to Chrome, in a fixed list so non-runtime files never leak in.
const RUNTIME_FILES = [
  "manifest.json",
  "background.js",
  "lib.js",
  "content.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "blocked.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

// Fixed DOS timestamp (1980-01-01 00:00:00) keeps the archive byte-identical between runs.
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const deflated = deflateRawSync(entry.data, { level: 9 });
    const useDeflate = deflated.length < entry.data.length;
    const method = useDeflate ? 8 : 0;
    const payload = useDeflate ? deflated : entry.data;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed to extract
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(DOS_TIME, 10);
    localHeader.writeUInt16LE(DOS_DATE, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    locals.push(localHeader, nameBuf, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(DOS_TIME, 12);
    centralHeader.writeUInt16LE(DOS_DATE, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42);
    centrals.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const localBlock = Buffer.concat(locals);
  const centralBlock = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // central directory disk
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBlock.length, 12);
  end.writeUInt32LE(localBlock.length, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localBlock, centralBlock, end]);
}

const manifest = JSON.parse(readFileSync(join(extensionDir, "manifest.json"), "utf8"));
const version = String(manifest.version);

const entries = [...RUNTIME_FILES]
  .sort()
  .map((name) => ({ name, data: readFileSync(join(extensionDir, ...name.split("/"))) }));

const zip = buildZip(entries);
const outDir = join(root, "public", "downloads");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `fokus-kerja-v${version}.zip`);
writeFileSync(outPath, zip);

const sha256 = createHash("sha256").update(zip).digest("hex");
console.log(`Paket   : public/downloads/fokus-kerja-v${version}.zip`);
console.log(`Entri   : ${entries.length}`);
console.log(`Ukuran  : ${zip.length} byte`);
console.log(`SHA-256 : ${sha256}`);
