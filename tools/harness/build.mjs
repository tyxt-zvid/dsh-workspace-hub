#!/usr/bin/env node
/*
 * Installs the harness browser dependencies into /tmp (never into the repo):
 * React 18 UMD bundles and puppeteer-core (drives an already-installed Chrome).
 *
 *   node tools/harness/build.mjs            # idempotent install
 *   node tools/harness/build.mjs --force    # reinstall
 *
 * Nothing is written outside /tmp/wh-harness-deps (override with WH_HARNESS_DEPS).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEPS_DIR = process.env.WH_HARNESS_DEPS ?? '/tmp/wh-harness-deps';
const force = process.argv.includes('--force');
const reactOk = existsSync(join(DEPS_DIR, 'node_modules/react/umd/react.development.js'));
const reactDomOk = existsSync(join(DEPS_DIR, 'node_modules/react-dom/umd/react-dom.development.js'));
const puppeteerOk = existsSync(join(DEPS_DIR, 'node_modules/puppeteer-core/package.json'));

console.log(`[build] deps dir: ${DEPS_DIR}`);
if (reactOk && reactDomOk && puppeteerOk && !force) {
  console.log('[build] react@18, react-dom@18 and puppeteer-core already installed — nothing to do');
  console.log('[build] next: node tools/harness/shoot.mjs');
  process.exit(0);
}

mkdirSync(DEPS_DIR, { recursive: true });
if (!existsSync(join(DEPS_DIR, 'package.json'))) {
  execFileSync('npm', ['init', '-y'], { cwd: DEPS_DIR, stdio: 'inherit' });
}
const packages = ['react@18.3.1', 'react-dom@18.3.1', 'puppeteer-core@23.11.1'];
console.log(`[build] npm install --prefix ${DEPS_DIR} ${packages.join(' ')}`);
execFileSync('npm', ['install', '--no-audit', '--no-fund', ...packages], { cwd: DEPS_DIR, stdio: 'inherit' });
console.log('[build] done. The repo was not modified; node_modules live in /tmp only.');
console.log('[build] next: node tools/harness/shoot.mjs');
console.log(`[build] (serve manually with: node ${resolve('tools/harness/serve.mjs')})`);
