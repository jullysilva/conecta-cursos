#!/usr/bin/env node
/**
 * Builds the Vercel Build Output (v3) in .vercel/output, deployed with `vercel deploy --prebuilt`:
 *   static/           the Angular app (web/dist/web/browser)
 *   functions/api.func the NestJS API bundled into one ESM file
 *   config.json       /api/* goes to the function; other unknown paths fall back to the SPA
 *
 * Assumes `npm ci` already ran in api/ and web/. Usage: node scripts/build-vercel-output.mjs
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'api');
const webDir = join(root, 'web');
const output = join(root, '.vercel', 'output');
const functionDir = join(output, 'functions', 'api.func');

/** Node runtime and region of the API function (São Paulo, close to the users). */
const FUNCTION_CONFIG = {
  runtime: 'nodejs24.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  regions: ['gru1'],
  maxDuration: 30,
};

/**
 * Optional Nest/Express integrations the API does not use. Nest requires them lazily
 * inside try/catch, so leaving them out of the bundle is safe.
 */
const OPTIONAL_MODULES = [
  '@nestjs/microservices',
  '@nestjs/microservices/*',
  '@nestjs/websockets',
  '@nestjs/websockets/*',
  '@fastify/static',
  'class-transformer/storage',
];

const run = (command, cwd) => execSync(command, { cwd, stdio: 'inherit' });

function buildStatic() {
  run('npm run build', webDir);
  cpSync(join(webDir, 'dist', 'web', 'browser'), join(output, 'static'), { recursive: true });
}

async function buildFunction() {
  // tsc (via nest build) emits the decorator metadata Nest needs; esbuild only bundles the JS.
  run('npm run build', apiDir);
  const { build } = createRequire(join(apiDir, 'package.json'))('esbuild');
  await build({
    entryPoints: [join(apiDir, 'dist', 'vercel.js')],
    outfile: join(functionDir, 'index.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    external: OPTIONAL_MODULES,
    // CommonJS dependencies call require(); give the ESM bundle one.
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
    logLevel: 'warning',
  });
  writeFileSync(join(functionDir, '.vc-config.json'), JSON.stringify(FUNCTION_CONFIG, null, 2));
  writeFileSync(join(functionDir, 'package.json'), JSON.stringify({ type: 'module' }));
}

function writeConfig() {
  const config = {
    version: 3,
    routes: [
      { src: '^/api(?:/.*)?$', dest: '/api' },
      { handle: 'filesystem' },
      // Angular routes (/curso/x, /admin, ...) are served by index.html.
      { src: '^/(.*)$', dest: '/index.html' },
    ],
  };
  writeFileSync(join(output, 'config.json'), JSON.stringify(config, null, 2));
}

rmSync(output, { recursive: true, force: true });
mkdirSync(functionDir, { recursive: true });
buildStatic();
await buildFunction();
writeConfig();
console.log(`Vercel output ready at ${output}`);
