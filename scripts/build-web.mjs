import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const outputDir = resolve('site');

function copyStatic() {
  cpSync('web', outputDir, { recursive: true });
}

async function bundle() {
  await build({
    entryPoints: ['src/web.ts'],
    bundle: true,
    outfile: resolve(outputDir, 'assets/web.js'),
    sourcemap: true,
    target: 'es2020',
    platform: 'browser',
  });
}

function prepareOutputDir() {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
}

async function run() {
  prepareOutputDir();
  copyStatic();
  await bundle();
  console.log(`Web bundle created in ${outputDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
