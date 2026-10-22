/**
 * Workspace dev servers.
 *
 * A workspace declares the servers its project needs in
 * `<workspace>/.dsh/workspace-hub/servers.json`. The Host starts them through
 * the composition's `subprocess` service, waits for each declared health URL to
 * answer, and keeps the handles so a later stop (or plugin unload) can end them.
 *
 * The panel never spawns anything itself: it posts to the bridge, so the same
 * operation stays available to a future agent tool and to any other client.
 */
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { BoardError, hubFile, normalizeRoot } from './store.js';
import { discoverServers } from './discover.js';

export const SERVERS_FILE = 'servers.json';
const DEFAULT_READY_TIMEOUT_MS = 20_000;
const MAX_READY_TIMEOUT_MS = 120_000;
const LOG_LIMIT_BYTES = 64 * 1024;
const PROBE_TIMEOUT_MS = 1_500;
const PROBE_INTERVAL_MS = 250;
const SPAWN_GRACE_MS = 4_000;

/** The workspace file that declares this workspace's servers. */
export function serversPath(workspaceRoot) {
  return hubFile(workspaceRoot, SERVERS_FILE);
}

/**
 * Split one shell-style command line into argv. This is deliberately small:
 * whitespace separates tokens, single and double quotes group them, and a
 * backslash escapes the next character outside single quotes. `argv` is the
 * exact form; this helper only makes hand-written configs pleasant.
 *
 * @param {string} text - the command line to split.
 * @returns {string[]} the argv tokens.
 */
export function splitCommand(text) {
  const argv = [];
  let current = '';
  let tokenStarted = false;
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote === '"' || quote === "'") {
      if (character === quote) {
        quote = null;
        continue;
      }
      if (character === '\\' && quote === '"' && index + 1 < text.length) {
        index += 1;
        current += text[index];
        continue;
      }
      current += character;
      tokenStarted = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
      continue;
    }
    if (character === '\\' && index + 1 < text.length) {
      index += 1;
      current += text[index];
      tokenStarted = true;
      continue;
    }
    if (character === ' ' || character === '\t' || character === '\n' || character === '\r') {
      if (tokenStarted) {
        argv.push(current);
        current = '';
        tokenStarted = false;
      }
      continue;
    }
    current += character;
    tokenStarted = true;
  }
  if (quote !== null) {
    throw new BoardError('servers-invalid', `unterminated ${quote} quote in server command ${JSON.stringify(text)}`);
  }
  if (tokenStarted) argv.push(current);
  return argv;
}

function invalid(message) {
  throw new BoardError('servers-invalid', message);
}

function optionalUrl(value, name, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') invalid(`server ${name} ${field} must be a string`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    invalid(`server ${name} ${field} is not a URL: ${JSON.stringify(value)}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    invalid(`server ${name} ${field} must be an http(s) URL`);
  }
  return value;
}

/** Validate one declared server and resolve its pieces against the workspace root. */
function normalizeServer(root, entry, index) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    invalid(`servers[${index}] must be an object`);
  }
  const fallbackName = `server-${index + 1}`;
  let name = fallbackName;
  if (entry.name !== undefined && entry.name !== null) {
    if (typeof entry.name !== 'string' || entry.name.trim() === '') {
      invalid(`servers[${index}].name must be a non-empty string`);
    }
    name = entry.name.trim();
  }

  /** @type {string[]} */
  let argv;
  if (entry.argv !== undefined) {
    if (!Array.isArray(entry.argv) || entry.argv.length === 0) {
      invalid(`server ${name} argv must be a non-empty string array`);
    }
    argv = entry.argv.map((token, tokenIndex) => {
      if (typeof token !== 'string' || token === '') {
        invalid(`server ${name} argv[${tokenIndex}] must be a non-empty string`);
      }
      return token;
    });
  } else if (typeof entry.command === 'string' && entry.command.trim() !== '') {
    argv = splitCommand(entry.command);
  } else {
    invalid(`server ${name} needs a "command" string or an "argv" array`);
  }
  if (argv.length === 0) invalid(`server ${name} has an empty command`);

  const declaredCwd = typeof entry.cwd === 'string' && entry.cwd !== '' ? entry.cwd : '.';
  const cwd = resolve(root, declaredCwd);
  const relativeCwd = relative(root, cwd);
  if (isAbsolute(declaredCwd) || relativeCwd.startsWith('..') || isAbsolute(relativeCwd)) {
    invalid(`server ${name} cwd must stay inside the workspace: ${JSON.stringify(declaredCwd)}`);
  }

  const url = optionalUrl(entry.url, name, 'url');
  const health = optionalUrl(entry.health ?? entry.healthUrl, name, 'health');
  let readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS;
  if (entry.readyTimeoutMs !== undefined) {
    if (!Number.isFinite(entry.readyTimeoutMs) || entry.readyTimeoutMs <= 0) {
      invalid(`server ${name} readyTimeoutMs must be a positive number`);
    }
    readyTimeoutMs = Math.min(Math.max(Math.round(entry.readyTimeoutMs), 1_000), MAX_READY_TIMEOUT_MS);
  }

  return {
    name,
    argv,
    cwd,
    url,
    // A declared URL doubles as the readiness probe unless health overrides it.
    health: health ?? url,
    readyTimeoutMs,
    command: argv.join(' '),
  };
}

/**
 * Read and validate one workspace's server declaration.
 *
 * @param {string} workspaceRoot - the workspace directory.
 * @returns {Promise<{ path: string, present: boolean, configured: boolean, servers: object[] }>}
 *   `present` tells an explicit empty declaration (opt out) apart from a
 *   missing file, which is eligible for auto-discovery.
 */
export async function readServersConfig(workspaceRoot) {
  const file = serversPath(workspaceRoot);
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return { path: file, present: false, configured: false, servers: [] };
    throw new BoardError('servers-unreadable', `cannot read ${file}: ${String(error?.message ?? error)}`);
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    throw new BoardError('servers-invalid', `${file} is not valid JSON: ${String(error?.message ?? error)}`);
  }
  const list = Array.isArray(document) ? document : document?.servers;
  if (!Array.isArray(list)) {
    throw new BoardError('servers-invalid', `${file} must be {"servers":[...]} or an array of servers`);
  }
  const servers = list.map((entry, index) => normalizeServer(workspaceRoot, entry, index));
  const names = new Set();
  for (const server of servers) {
    if (names.has(server.name)) invalid(`duplicate server name ${JSON.stringify(server.name)}`);
    names.add(server.name);
  }
  return { path: file, present: true, configured: servers.length > 0, servers };
}

/**
 * Resolve the servers to show and start for one workspace: the explicit
 * declaration when the file exists (even an empty one), otherwise auto-discovery
 * from `package.json` and common framework files.
 *
 * @param {string} workspaceRoot - the workspace directory.
 * @returns {Promise<{ path: string, present: boolean, source: 'config'|'discovered', configured: boolean, servers: object[], notes?: string[] }>}
 */
export async function resolveServerConfig(workspaceRoot) {
  const root = normalizeRoot(workspaceRoot);
  const config = await readServersConfig(root);
  if (config.present) return { ...config, source: 'config' };
  const discovered = await discoverServers(root);
  const servers = discovered.servers.map((entry, index) => normalizeServer(root, entry, index));
  const names = new Set();
  for (const server of servers) {
    if (names.has(server.name)) invalid(`duplicate server name ${JSON.stringify(server.name)}`);
    names.add(server.name);
  }
  return {
    path: config.path,
    present: false,
    source: 'discovered',
    configured: servers.length > 0,
    servers,
    notes: Array.isArray(discovered.notes) ? discovered.notes : [],
  };
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

/** Probe one health URL without letting a hanging socket stall the caller. */
async function probe(url) {
  if (typeof url !== 'string') return false;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** The last part of a child's collected output, for failure messages. */
function outputTail(entry) {
  const readers = [entry?.handle?.collected?.stderr, entry?.handle?.collected?.stdout];
  const parts = [];
  for (const reader of readers) {
    if (reader === undefined) continue;
    try {
      const read = reader.readFrom(0);
      if (typeof read?.text === 'string' && read.text.trim() !== '') parts.push(read.text.trim());
    } catch {
      /* a closed reader tells us nothing */
    }
  }
  const text = parts.join('\n');
  return text.length > 1_200 ? `…${text.slice(-1_200)}` : text;
}

function failureDetail(entry) {
  const tail = outputTail(entry);
  const reason = entry?.error ?? 'exited before becoming ready';
  return tail === '' ? reason : `${reason}\n${tail}`;
}

/**
 * Owns every server process this Host started, keyed by workspace root and name.
 *
 * The runner only terminates processes it spawned; a server that was already
 * running outside the hub is reported as `external` and left alone.
 */
export class ServerRunner {
  /**
   * @param {object} ctx - the Host plugin context (for `subprocess` and logging).
   * @param {{ warn?: (message: string) => void } | undefined} logger - optional logger.
   */
  constructor(ctx, logger) {
    this.ctx = ctx;
    this.logger = logger;
    /** @type {Map<string, object>} spawned processes, keyed by workspace + name. */
    this.entries = new Map();
    /** @type {Map<string, Promise<unknown>>} coalesces concurrent starts per workspace. */
    this.pending = new Map();
    /** @type {Map<string, {at: number, config: object}>} short-lived config cache for the global overview. */
    this.configCache = new Map();
  }

  #key(root, server) {
    return `${root}\u0000${server.name}`;
  }

  /** True when the runner started this server and it is still alive. */
  #alive(root, server) {
    const entry = this.entries.get(this.#key(root, server));
    return entry !== undefined && entry.exited !== true ? entry : undefined;
  }

  /** Resolve a workspace's server config through a short TTL cache (overview polling). */
  async #config(root) {
    const cached = this.configCache.get(root);
    if (cached !== undefined && Date.now() - cached.at < 8000) return cached.config;
    const config = await resolveServerConfig(root);
    this.configCache.set(root, { at: Date.now(), config });
    return config;
  }

  /**
   * Cheap per-workspace server summary for the global overview: no health
   * probes, only processes this runner owns. The detailed `status` (with
   * probing) remains the source for the selected workspace.
   */
  async summary(workspaceRoot) {
    const root = normalizeRoot(workspaceRoot);
    let config;
    try {
      config = await this.#config(root);
    } catch (error) {
      return {
        path: null,
        source: null,
        configured: false,
        servers: [],
        counts: { total: 0, running: 0, ready: 0, failed: 0 },
        error: String(error?.message ?? error),
      };
    }
    let running = 0;
    let ready = 0;
    let failed = 0;
    const servers = config.servers.map((server) => {
      const entry = this.#alive(root, server);
      const isFailed = entry !== undefined && entry.error !== undefined;
      const isRunning = entry !== undefined && !isFailed;
      const isReady = isRunning && entry.ready === true;
      if (isRunning) running += 1;
      if (isReady) ready += 1;
      if (isFailed) failed += 1;
      return {
        name: server.name,
        url: server.url ?? null,
        running: isRunning,
        ready: isReady,
        failed: isFailed,
        error: entry?.error ?? null,
      };
    });
    return {
      path: config.path,
      source: config.source,
      configured: config.configured,
      servers,
      counts: { total: servers.length, running, ready, failed },
    };
  }

  /** One row describing a configured server, without starting anything. */
  async #describe(root, server) {
    const entry = this.#alive(root, server);
    const healthy = server.health === undefined ? false : await probe(server.health);
    return {
      name: server.name,
      command: server.command,
      cwd: server.cwd,
      url: server.url ?? null,
      running: entry !== undefined,
      ready: entry === undefined ? healthy : entry.ready === true || healthy,
      external: entry === undefined && healthy,
      startedAt: entry?.startedAt ?? null,
      error: entry?.error ?? null,
    };
  }

  /** Resolve the workspace servers (config or auto-discovery) and describe each. */
  async status(workspaceRoot) {
    const root = normalizeRoot(workspaceRoot);
    const config = await resolveServerConfig(root);
    const servers = [];
    for (const server of config.servers) servers.push(await this.#describe(root, server));
    return { path: config.path, source: config.source, configured: config.configured, servers };
  }

  /**
   * Start every configured server (or only `names`), skipping healthy ones.
   * Concurrent presses join the same attempt instead of spawning twice.
   *
   * @param {string} workspaceRoot - the workspace directory.
   * @param {{ names?: string[] }} [options] - restrict the start to named servers.
   */
  async start(workspaceRoot, options = {}) {
    const root = normalizeRoot(workspaceRoot);
    const inflight = this.pending.get(root);
    if (inflight !== undefined) return inflight;
    const operation = this.#start(root, options).finally(() => this.pending.delete(root));
    this.pending.set(root, operation);
    return operation;
  }

  async #start(root, { names } = {}) {
    const config = await resolveServerConfig(root);
    if (config.servers.length === 0) {
      throw new BoardError(
        'servers-unconfigured',
        config.present
          ? `no servers are declared in ${serversPath(root)}`
          : `no servers are declared in ${serversPath(root)} and none could be auto-discovered from package.json`,
      );
    }
    const wanted = Array.isArray(names) && names.length > 0
      ? config.servers.filter((server) => names.includes(server.name))
      : config.servers;
    if (wanted.length === 0) {
      throw new BoardError('servers-unknown', `no declared server is named ${JSON.stringify(names)}`);
    }
    const servers = [];
    for (const server of wanted) servers.push(await this.#ensure(root, server));
    const firstUrl = servers.find((row) => typeof row.url === 'string' && row.url !== '')?.url ?? null;
    return { path: config.path, source: config.source, url: firstUrl, servers };
  }

  /** Ensure one server is running, becoming ready, or explicitly already up. */
  async #ensure(root, server) {
    const existing = this.#alive(root, server);
    if (existing !== undefined) {
      if (server.health !== undefined && existing.ready !== true && (await probe(server.health))) {
        existing.ready = true;
      }
      return this.#row(server, existing, 'running');
    }
    if (server.health !== undefined && (await probe(server.health))) {
      return {
        name: server.name,
        command: server.command,
        cwd: server.cwd,
        url: server.url ?? null,
        status: 'external',
        ready: true,
        startedAt: null,
        error: null,
      };
    }

    let handle;
    try {
      handle = await this.#spawn(server);
    } catch (error) {
      return {
        name: server.name,
        command: server.command,
        cwd: server.cwd,
        url: server.url ?? null,
        status: 'failed',
        ready: false,
        startedAt: null,
        error: String(error?.message ?? error),
      };
    }

    const entry = { handle, startedAt: Date.now(), ready: false, exited: false, error: null };
    const key = this.#key(root, server);
    this.entries.set(key, entry);
    handle.done.then(
      (outcome) => {
        entry.exited = true;
        entry.outcome = outcome;
        entry.error ??= `exited with code ${outcome?.exitCode ?? 'null'}${outcome?.signal === null || outcome?.signal === undefined ? '' : ` (${outcome.signal})`}`;
        if (this.entries.get(key) === entry) this.entries.delete(key);
      },
      (error) => {
        entry.exited = true;
        entry.error = `exited: ${String(error?.message ?? error)}`;
        if (this.entries.get(key) === entry) this.entries.delete(key);
      },
    );

    const readiness = await this.#waitReady(server, entry);
    entry.ready = readiness.ready === true;
    if (readiness.error !== undefined) entry.error = readiness.error;
    return this.#row(server, entry, readiness.ready === true ? 'started' : 'starting');
  }

  #row(server, entry, status) {
    return {
      name: server.name,
      command: server.command,
      cwd: server.cwd,
      url: server.url ?? null,
      status,
      ready: entry.ready === true,
      startedAt: entry.startedAt ?? null,
      error: entry.error ?? null,
    };
  }

  async #spawn(server) {
    const subprocess = this.ctx.get('subprocess');
    if (subprocess === undefined) {
      throw new BoardError('servers-unavailable', 'this Host composition has no subprocess service');
    }
    let executable;
    try {
      executable = await subprocess.resolveExecutable(server.argv[0]);
    } catch (error) {
      throw new BoardError(
        'servers-spawn-failed',
        `cannot run ${JSON.stringify(server.argv[0])}: ${String(error?.message ?? error)}`,
      );
    }
    return subprocess.spawn({
      argv: [executable, ...server.argv.slice(1)],
      cwd: server.cwd,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: LOG_LIMIT_BYTES },
        stderr: { maxBytes: LOG_LIMIT_BYTES },
      },
      graceMs: SPAWN_GRACE_MS,
    });
  }

  /** Wait for the declared health endpoint, failing fast when the child exits. */
  async #waitReady(server, entry) {
    const deadline = Date.now() + server.readyTimeoutMs;
    while (Date.now() < deadline) {
      if (entry.exited === true) {
        return { ready: false, error: failureDetail(entry) };
      }
      if (server.health !== undefined) {
        if (await probe(server.health)) return { ready: true };
      } else if (Date.now() - entry.startedAt >= 1_000) {
        // Nothing to probe: give the process a moment, then treat it as up.
        return { ready: true };
      }
      await sleep(PROBE_INTERVAL_MS);
    }
    return {
      ready: false,
      error: `not ready after ${server.readyTimeoutMs} ms${server.health === undefined ? '' : ` (${server.health})`}`,
    };
  }

  /**
   * Terminate the servers this runner started for one workspace.
   * Servers detected as `external` are never touched.
   *
   * @param {string} workspaceRoot - the workspace directory.
   * @param {{ names?: string[] }} [options] - restrict the stop to named servers.
   */
  async stop(workspaceRoot, options = {}) {
    const root = normalizeRoot(workspaceRoot);
    const names = Array.isArray(options.names) && options.names.length > 0 ? options.names : null;
    const stopped = [];
    for (const [key, entry] of [...this.entries]) {
      if (!key.startsWith(`${root}\u0000`)) continue;
      const name = key.slice(root.length + 1);
      if (names !== null && !names.includes(name)) continue;
      this.entries.delete(key);
      try {
        entry.handle.terminate();
        await entry.handle.waitForExit(AbortSignal.timeout(5_000));
      } catch (error) {
        this.logger?.warn?.(`workspace-hub: stopping ${name} failed: ${String(error?.message ?? error)}`);
      }
      stopped.push(name);
    }
    return { stopped };
  }

  /** Stop every process this runner started; used when the plugin unloads. */
  async dispose() {
    const entries = [...this.entries];
    this.entries.clear();
    await Promise.all(
      entries.map(async ([key, entry]) => {
        try {
          entry.handle.terminate();
          await entry.handle.waitForExit(AbortSignal.timeout(4_000));
        } catch (error) {
          this.logger?.warn?.(`workspace-hub: stopping ${key} on unload failed: ${String(error?.message ?? error)}`);
        }
      }),
    );
  }
}
