// Fails when the brotli size of the initial bundle (scripts and styles referenced by index.html)
// exceeds the constitution's limit. Brotli is what `ng build` reports as estimated transfer size.
// Usage: node scripts/check-bundle-size.mjs [limitKb]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';

const limitKb = Number(process.argv[2] ?? 100);
const browserDir = join(import.meta.dirname, '..', 'dist', 'web', 'browser');
const html = readFileSync(join(browserDir, 'index.html'), 'utf8');

const files = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
    .map(([, path]) => path)
    .filter((path) => !/^(?:https?:)?\/\//.test(path)),
);

let totalBytes = 0;
for (const file of files) {
  const bytes = brotliCompressSync(readFileSync(join(browserDir, file))).length;
  totalBytes += bytes;
  console.log(`${(bytes / 1000).toFixed(2).padStart(8)} kB  ${file}`);
}

const totalKb = totalBytes / 1000;
console.log(`${totalKb.toFixed(2).padStart(8)} kB  initial total (brotli), limit ${limitKb} kB`);
if (totalKb > limitKb) {
  console.error(`Initial bundle exceeds ${limitKb} kB (brotli).`);
  process.exit(1);
}
