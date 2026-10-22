/**
 * Auto-discovery for a workspace's development servers.
 *
 * When a workspace has no `.dsh/workspace-hub/servers.json`, look at its
 * `package.json` scripts (and the framework/config files those scripts use) and
 * infer one server, plus an optional backend script when the primary is a
 * framework dev server. Discovery is intentionally conservative: a script is
 * only accepted when it names a known dev tool, carries an explicit port, or
 * runs a local file that really calls `listen()`.
 *
 * Findings are returned as plain server entries in the same shape as the JSON
 * config; `servers.js` normalizes them, so both paths share one validation and
 * one runner.
 */
import { readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

/** Known dev frameworks and their default port / config file candidates. */
const FRAMEWORKS = [
  { id: 'vite', deps: ['vite'], defaultPort: 5173, configs: ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs'] },
  { id: 'next', deps: ['next'], defaultPort: 3000, configs: ['next.config.ts', 'next.config.mjs', 'next.config.js'] },
  { id: 'nuxt', deps: ['nuxt'], defaultPort: 3000, configs: ['nuxt.config.ts', 'nuxt.config.js'] },
  { id: 'astro', deps: ['astro'], defaultPort: 4321, configs: ['astro.config.mjs', 'astro.config.ts', 'astro.config.js'] },
  { id: 'sveltekit', deps: ['@sveltejs/kit'], defaultPort: 5173, configs: ['svelte.config.js'] },
  { id: 'angular', deps: ['@angular/cli'], defaultPort: 4200, configs: [] },
  { id: 'react-scripts', deps: ['react-scripts'], defaultPort: 3000, configs: [] },
  { id: 'webpack-dev-server', deps: ['webpack-dev-server'], defaultPort: 8080, configs: ['webpack.config.js'] },
  { id: 'parcel', deps: ['parcel'], defaultPort: 1234, configs: [] },
  { id: 'electron-vite', deps: ['electron-vite'], defaultPort: 5173, configs: ['electron.vite.config.ts', 'electron.vite.config.js'] },
];

const PRIMARY_SCRIPTS = ['dev', 'develop', 'play', 'serve', 'start', 'preview', 'dev:local', 'start:local'];
const BACKEND_SCRIPTS = ['server', 'api', 'backend'];
const PORT_RANGE = { min: 1024, max: 65535 };

const SKIP_TEXT = [
  /^electron\s/i,
  /\belectron\s+\./i,
  /\b(vite|next|nuxt|astro|webpack|parcel)\s+build\b/i,
  /^\s*(tsc|jest|vitest|playwright|eslint|prettier)\b/i,
  /^\s*(rimraf|rm|del)\b/i,
];

async function readText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function readJson(path) {
  const text = await readText(path);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function validPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= PORT_RANGE.min && port <= PORT_RANGE.max ? port : undefined;
}

/** Detect a framework from dependencies or the script text itself. */
function detectFramework(pkg, scriptText) {
  const dependencies = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  for (const framework of FRAMEWORKS) {
    if (framework.deps.some((name) => dependencies[name] !== undefined)) return framework;
  }
  for (const framework of FRAMEWORKS) {
    if (framework.deps.some((name) => new RegExp(`(^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(scriptText))) {
      return framework;
    }
  }
  return undefined;
}

/** A package.json script that starts a local server, not a build/electron task. */
function looksLikeServerScript(scriptText) {
  return !SKIP_TEXT.some((pattern) => pattern.test(scriptText));
}

/** The local JS entry a script runs, e.g. `node layer1/server.mjs`. */
function referencedEntryFile(scriptText) {
  const match = scriptText.match(/(?:^|\s)(?:node|tsx|ts-node|bun)\s+([^\s&|;<>]+\.(?:mjs|cjs|js|ts))/);
  if (match === null) return undefined;
  const file = match[1];
  // Bare CLI flags or URLs are not entries.
  if (file.startsWith('-') || file.startsWith('http') || file.includes('://')) return undefined;
  return file;
}

function portFromScript(scriptText) {
  const patterns = [
    /--port[=\s]+(\d{2,5})\b/i,
    /(?:^|\s)-p\s*(\d{2,5})(?=\s|$)/,
    /\bPORT\s*=\s*(\d{2,5})\b/,
    /--host[=\s]+[^\s:]+:(\d{2,5})\b/,
    /(?:^|\s)(\d{4,5})(?=\s*$)/,
  ];
  for (const pattern of patterns) {
    const match = scriptText.match(pattern);
    if (match !== null) {
      const port = validPort(match[1]);
      if (port !== undefined) return port;
    }
  }
  return undefined;
}

function portFromSource(source) {
  const patterns = [
    /listen\(\s*(\d{2,5})\b/,
    /DEFAULT_PORT\s*=\s*(\d{2,5})\b/,
    /PORT\s*\)?\s*\|\|\s*(\d{2,5})\b/i,
    /(?:const|let|var)\s+port\s*=\s*(\d{2,5})\b/i,
    /\bport\s*[:=]\s*(\d{2,5})\b/i,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match !== null) {
      const port = validPort(match[1]);
      if (port !== undefined) return port;
    }
  }
  return undefined;
}

/** A health route the server itself declares, when it has one. */
function healthPathFromSource(source) {
  if (/['"`]\/api\/health['"`]/.test(source)) return '/api/health';
  if (/['"`]\/health['"`]/.test(source)) return '/health';
  return null;
}

async function portFromFrameworkConfig(root, framework) {
  for (const file of framework.configs) {
    const text = await readText(join(root, file));
    if (text === null) continue;
    const match = text.match(/port\s*:\s*(\d{2,5})\b/);
    if (match !== null) {
      const port = validPort(match[1]);
      if (port !== undefined) return port;
    }
  }
  return undefined;
}

async function packageManagerFor(root, pkg) {
  if (typeof pkg?.packageManager === 'string') {
    const name = pkg.packageManager.split('@')[0];
    if (['npm', 'pnpm', 'yarn', 'bun'].includes(name)) return name;
  }
  if (await exists(join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await exists(join(root, 'yarn.lock'))) return 'yarn';
  if (await exists(join(root, 'bun.lockb')) || (await exists(join(root, 'bun.lock')))) return 'bun';
  return 'npm';
}

/**
 * Build one candidate server from a script, or null when the script is not
 * recognizably a long-running local server.
 */
async function candidateFor(root, scriptName, scriptText, pkg, packageManager) {
  if (!looksLikeServerScript(scriptText)) return null;
  const framework = detectFramework(pkg, scriptText);
  const entry = referencedEntryFile(scriptText);

  let port;
  let source = null;
  let healthPath = null;
  let evidence;
  if (entry !== undefined) {
    source = await readText(join(root, entry));
    if (source === null) return null;
    if (!/\.listen\(|createServer\(/.test(source)) return null;
    port = portFromScript(scriptText) ?? portFromSource(source);
    healthPath = healthPathFromSource(source);
    evidence = `scripts.${scriptName} → ${entry}`;
  } else if (framework !== undefined) {
    port = portFromScript(scriptText) ?? (await portFromFrameworkConfig(root, framework)) ?? framework.defaultPort;
    evidence = `scripts.${scriptName} → ${framework.id}`;
  } else {
    port = portFromScript(scriptText);
    if (port === undefined) return null;
    evidence = `scripts.${scriptName}`;
  }

  const name = `${pkg?.name ?? basename(root)} · ${scriptName}`;
  const url = port === undefined ? undefined : `http://127.0.0.1:${port}/`;
  const health = port === undefined ? undefined : `http://127.0.0.1:${port}${healthPath ?? '/'}`;
  return {
    name,
    command: `${packageManager} run ${scriptName}`,
    cwd: '.',
    ...(url === undefined ? {} : { url }),
    ...(health === undefined ? {} : { health }),
    readyTimeoutMs: 30_000,
    discovered: true,
    discoveredFrom: evidence,
  };
}

/**
 * Inspect one workspace and return discovered server entries.
 *
 * @param {string} workspaceRoot - the workspace directory.
 * @returns {Promise<{ servers: object[], notes: string[] }>} raw entries in config shape.
 */
export async function discoverServers(workspaceRoot) {
  const notes = [];
  const pkg = await readJson(join(workspaceRoot, 'package.json'));
  if (pkg === null) {
    // No manifest: accept a single obvious local server file, if it really listens.
    for (const file of ['serve.mjs', 'server.mjs']) {
      const source = await readText(join(workspaceRoot, file));
      if (source === null || !/\.listen\(|createServer\(/.test(source)) continue;
      const port = portFromSource(source);
      notes.push(`no package.json; found ${file}`);
      return {
        servers: [
          {
            name: `${basename(workspaceRoot)} · ${file}`,
            command: `node ${file}`,
            cwd: '.',
            ...(port === undefined
              ? {}
              : {
                  url: `http://127.0.0.1:${port}/`,
                  health: `http://127.0.0.1:${port}${healthPathFromSource(source) ?? '/'}`,
                }),
            readyTimeoutMs: 30_000,
            discovered: true,
            discoveredFrom: file,
          },
        ],
        notes,
      };
    }
    return { servers: [], notes };
  }

  const scripts = pkg.scripts !== null && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const packageManager = await packageManagerFor(workspaceRoot, pkg);
  const servers = [];
  let primaryScript;

  for (const scriptName of PRIMARY_SCRIPTS) {
    const scriptText = scripts[scriptName];
    if (typeof scriptText !== 'string' || scriptText.trim() === '') continue;
    const candidate = await candidateFor(workspaceRoot, scriptName, scriptText, pkg, packageManager);
    if (candidate === null) continue;
    servers.push(candidate);
    primaryScript = scriptName;
    break;
  }

  // A framework dev server may have a separate local backend next to it.
  if (primaryScript === 'dev') {
    for (const scriptName of BACKEND_SCRIPTS) {
      const scriptText = scripts[scriptName];
      if (typeof scriptText !== 'string' || scriptText.trim() === '') continue;
      const candidate = await candidateFor(workspaceRoot, scriptName, scriptText, pkg, packageManager);
      if (candidate === null) continue;
      servers.push(candidate);
      break;
    }
  }

  return { servers, notes };
}
