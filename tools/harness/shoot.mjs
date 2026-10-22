#!/usr/bin/env node
/*
 * Screenshot the REAL Workspace Hub panel from the repo client.js.
 *
 *   node tools/harness/build.mjs     # once: installs React/puppeteer into /tmp
 *   node tools/harness/shoot.mjs     # starts the harness server, shoots all states
 *
 * Flags:
 *   --filter <text>   only shoot matching scenario names
 *   --tag <text>      output filename prefix (default: none)
 *   --dsf <n>         device scale factor (default 2)
 *   --no-server       reuse an already running harness at $WH_HARNESS_URL
 *
 * Writes tools/harness/shots/*.png + shots/report.json. Never touches client.js.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startServer, HARNESS_DIR, DEPS_DIR } from './serve.mjs';

const requireFromDeps = createRequire(join(DEPS_DIR, 'noop.cjs'));
const puppeteer = requireFromDeps('puppeteer-core');

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback;
};
const filter = argValue('--filter', '');
const tag = argValue('--tag', '');
const dsf = Number(argValue('--dsf', '2'));
const noServer = args.includes('--no-server');

const SHOTS_DIR = join(HARNESS_DIR, 'shots');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  join(homedir(), 'Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((candidate) => candidate !== undefined && existsSync(candidate));

if (CHROME_CANDIDATES.length === 0) {
  console.error('[shoot] no Chrome/Chromium found; set CHROME_PATH');
  process.exit(1);
}

const scenarios = [
  { name: '01-all-dark', theme: 'dark', view: 'all' },
  { name: '01b-all-cards-dark', theme: 'dark', view: 'all-cards' },
  { name: '02-all-light', theme: 'light', view: 'all' },
  { name: '02b-all-cards-light', theme: 'light', view: 'all-cards' },
  { name: '03-all-bare', theme: 'dark', view: 'all', shell: 'bare' },
  { name: '04-workspace-dark', theme: 'dark', view: 'workspace' },
  { name: '04b-workspace-light', theme: 'light', view: 'workspace' },
  { name: '05-overview-dark', theme: 'dark', view: 'overview' },
  { name: '06-tasks-dark', theme: 'dark', view: 'tasks' },
  { name: '07-sessions-dark', theme: 'dark', view: 'sessions' },
  { name: '07b-sessions-expanded-dark', theme: 'dark', view: 'sessions-expanded' },
  { name: '08-settings-dark', theme: 'dark', view: 'settings' },
  { name: '09-palette-dark', theme: 'dark', view: 'palette' },
  { name: '09b-palette-all-dark', theme: 'dark', view: 'palette-all' },
  { name: '10-dispatch-dark', theme: 'dark', view: 'dispatch' },
  { name: '11-tasks-light', theme: 'light', view: 'tasks' },
  { name: '12-settings-light', theme: 'light', view: 'settings' },
  { name: '13-empty-dark', theme: 'dark', data: 'empty', view: 'all' },
  { name: '14-error-dark', theme: 'dark', data: 'error', view: 'all' },
  { name: '15-stale-dark', theme: 'dark', data: 'stale', view: 'all', delay: 5600 },
  { name: '16-all-1280', theme: 'dark', view: 'all', width: 1280, height: 800 },
  { name: '17-drill-return-dark', theme: 'dark', view: 'drill-return', delay: 1200 },
  { name: '18-esc-return-dark', theme: 'dark', view: 'esc-return', delay: 1200 },
  { name: '19-workspace-menu-dark', theme: 'dark', view: 'workspace-menu', delay: 1200 },
  { name: '20-workspace-empty-dark', theme: 'dark', data: 'empty', view: 'workspace' },
  { name: '21-workspace-error-dark', theme: 'dark', data: 'error', view: 'workspace' },
  { name: '23-ga-return-dark', theme: 'dark', view: 'ga-return', delay: 1200 },
  { name: '24-workspace-switch-dark', theme: 'dark', view: 'workspace-switch', delay: 1200 },
  { name: '25-settings-esc-dark', theme: 'dark', view: 'settings-esc', delay: 1200 },
  { name: '26-home-running-open-dark', theme: 'dark', view: 'home-running-open', delay: 1200 },
  { name: '27-board-error-dark', theme: 'dark', data: 'boarderror', view: 'all' },
].filter((scenario) => filter === '' || scenario.name.includes(filter) || (scenario.view + scenario.theme + (scenario.data ?? '')).includes(filter));

await mkdir(SHOTS_DIR, { recursive: true });
const server = noServer ? undefined : await startServer({ port: Number(process.env.WH_HARNESS_PORT ?? 0) });
const base = noServer ? process.env.WH_HARNESS_URL ?? 'http://127.0.0.1:4180/' : server.url;
console.log(`[shoot] harness: ${base}  (panel width ${1440 - 248}px inside the fake shell)`);

const browser = await puppeteer.launch({
  executablePath: CHROME_CANDIDATES[0],
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1', '--font-render-hinting=none', '--lang=zh-CN'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: dsf },
});

const hashClient = () => createHash('sha1').update(readFileSync(join(HARNESS_DIR, '..', '..', 'client.js'))).digest('hex');
const report = { generatedAt: new Date().toISOString(), clientMtime: null, clientSha: hashClient(), base, scenarios: [], consoleErrors: [] };

try {
  const health = await fetch(new URL('/health', base)).then((response) => response.json());
  report.clientMtime = new Date(health.clientMtimeMs).toISOString();

  for (const scenario of scenarios) {
    const page = await browser.newPage();
    if (scenario.width !== undefined || scenario.height !== undefined) {
      await page.setViewport({ width: scenario.width ?? 1440, height: scenario.height ?? 900, deviceScaleFactor: dsf });
    }
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleErrors.push({ type: message.type(), text: message.text().slice(0, 1200) });
      }
    });
    page.on('pageerror', (error) => consoleErrors.push({ type: 'pageerror', text: String(error?.stack ?? error).slice(0, 2000) }));
    const query = new URLSearchParams({ theme: scenario.theme, view: scenario.view, data: scenario.data ?? 'full', shell: scenario.shell ?? 'full' });
    const url = `${base}?${query}`;
    const entry = { name: scenario.name, url, consoleErrors };
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('body[data-wh-ready="1"], body[data-wh-ready="error"]', { timeout: 15000 });
      await new Promise((resolve) => setTimeout(resolve, scenario.delay ?? 900));
      const state = await page.evaluate(() => {
        const harness = window.__WH_HARNESS__;
        const errorBox = document.querySelector('#harness-error');
        const renderError = document.querySelector('#render-error');
        return {
          ready: document.body.dataset.whReady,
          errors: window.__WH_ERRORS__ ?? [],
          actions: harness?.actions ?? window.__WH_ACTIONS__ ?? [],
          report: harness?.report ?? null,
          apiMethods: [...new Set((harness?.apiLog ?? []).map((call) => `${call.ok ? 'ok' : 'err'} ${call.method}`))],
          errorBox: errorBox?.classList.contains('on') ? errorBox.textContent : (renderError?.textContent ?? null),
          text: document.body.innerText.slice(0, 4000),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          panelRect: (() => {
            const host = document.querySelector('#panel-host');
            const rect = host?.getBoundingClientRect();
            return rect === undefined ? null : { width: Math.round(rect.width), height: Math.round(rect.height) };
          })(),
        };
      });
      entry.state = state;
      entry.screenshot = join(SHOTS_DIR, `${tag}${scenario.name}.png`);
      await page.screenshot({ path: entry.screenshot, fullPage: false });
      report.scenarios.push(entry);
      console.log(`[shoot] ${scenario.name} -> ${entry.screenshot}  (${state.report?.panelKey ?? 'no panel key'})`);
      if (state.errors.length > 0) console.log(`[shoot]   ${state.errors.length} runtime error(s): ${state.errors[0].message.split('\n')[0]}`);
    } catch (error) {
      entry.failure = String(error?.stack ?? error);
      report.scenarios.push(entry);
      console.error(`[shoot] ${scenario.name} FAILED: ${entry.failure.split('\n')[0]}`);
      try {
        entry.screenshot = join(SHOTS_DIR, `${tag}${scenario.name}-failed.png`);
        await page.screenshot({ path: entry.screenshot, fullPage: false });
      } catch {
        /* ignore */
      }
    } finally {
      report.consoleErrors.push(...consoleErrors.map((row) => ({ scenario: scenario.name, ...row })));
      await page.close();
    }
  }
} finally {
  await browser.close();
  if (server !== undefined) {
    server.server.closeAllConnections?.();
    await new Promise((resolve) => server.server.close(resolve));
  }
}

report.clientShaAfter = hashClient();
report.clientStable = report.clientSha === report.clientShaAfter;
report.summary = report.scenarios.map((entry) => ({
  name: entry.name,
  ok: entry.failure === undefined && entry.state?.ready === '1',
  panelKey: entry.state?.report?.panelKey ?? null,
  actions: entry.state?.actions ?? [],
  apiMethods: entry.state?.apiMethods ?? [],
  runtimeErrors: (entry.state?.errors ?? []).length,
  consoleErrors: entry.consoleErrors.length,
  textSample: (entry.state?.text ?? '').replace(/\s+/g, ' ').slice(0, 220),
}));
await writeFile(join(SHOTS_DIR, 'report.json'), JSON.stringify(report, null, 2));
console.log(`[shoot] report: ${join(SHOTS_DIR, 'report.json')}`);
if (report.clientStable !== true) console.error('[shoot] client.js changed during the run; shots may mix revisions');
const failed = report.summary.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`[shoot] ${failed.length}/${report.summary.length} scenario(s) not clean: ${failed.map((entry) => entry.name).join(', ')}`);
}
process.exit(failed.length > 0 ? 1 : 0);
