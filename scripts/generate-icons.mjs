import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "extension", "icons");
mkdirSync(outDir, { recursive: true });

const CREAM = [255, 250, 241];
const TERRACOTTA = [196, 92, 38];

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function sample(size, x, y) {
  const center = size / 2 - 0.5;
  const dx = x - center;
  const dy = y - center;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dot = size * 0.09;
  const gap = size * 0.22;
  const ringOuter = size * 0.42;

  if (dist <= dot) return TERRACOTTA;
  if (dist <= gap) return CREAM;
  if (dist <= ringOuter) return TERRACOTTA;
  return CREAM;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const ss = 3;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          const [pr, pg, pb] = sample(
            size,
            x + (sx + 0.5) / ss - 0.5,
            y + (sy + 0.5) / ss - 0.5,
          );
          r += pr;
          g += pg;
          b += pb;
        }
      }
      const n = ss * ss;
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(r / n);
      pixels[offset + 1] = Math.round(g / n);
      pixels[offset + 2] = Math.round(b / n);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

for (const size of [16, 48, 128]) {
  const png = encodePng(size, size, render(size));
  writeFileSync(join(outDir, `icon${size}.png`), png);
  console.log(`icon${size}.png — ${png.length} bytes`);
}