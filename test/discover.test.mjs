// Auto-discovery test: package.json/framework/file heuristics, plus the
// config-overrides-discovery rule in resolveServerConfig.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { discoverServers } from '../lib/discover.js';
import { ServerRunner, readServersConfig, resolveServerConfig, serversPath } from '../lib/servers.js';

const roots = [];

async function fixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'workspace-hub-discover-'));
  roots.push(root);
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return root;
}

after(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

test('discovers a Vite dev script, its --port, and the npm package manager', async () => {
  const root = await fixture({
    'package.json': {
      name: 'vite-game',
      scripts: { dev: 'vite --host 127.0.0.1 --port 5199' },
      devDependencies: { vite: '^8.0.0' },
    },
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 1);
  const server = result.servers[0];
  assert.equal(server.command, 'npm run dev');
  assert.equal(server.url, 'http://127.0.0.1:5199/');
  assert.equal(server.health, 'http://127.0.0.1:5199/');
  assert.equal(server.name, 'vite-game · dev');
});

test('reads the port from a Vite config and honours pnpm', async () => {
  const root = await fixture({
    'package.json': { name: 'p-vite', scripts: { dev: 'vite' }, devDependencies: { vite: '^8.0.0' } },
    'vite.config.ts': "export default { server: { port: 5188 } };",
    'pnpm-lock.yaml': 'lockfileVersion: 9',
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 1);
  assert.equal(result.servers[0].command, 'pnpm run dev');
  assert.equal(result.servers[0].url, 'http://127.0.0.1:5188/');
});

test('discovers a local node server file, its default port, and its health route', async () => {
  const root = await fixture({
    'package.json': { name: 'jiuguan-like', scripts: { play: 'node layer1/server.mjs' } },
    'layer1/server.mjs': `
      const DEFAULT_PORT = 4180;
      const pathname = '/api/health';
      server.listen(port, '0.0.0.0');
    `,
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 1);
  const server = result.servers[0];
  assert.equal(server.command, 'npm run play');
  assert.equal(server.url, 'http://127.0.0.1:4180/');
  assert.equal(server.health, 'http://127.0.0.1:4180/api/health');
});

test('uses a trailing port argument and the file health route', async () => {
  const root = await fixture({
    'package.json': { name: 'static-game', scripts: { start: 'node serve.mjs 4173' } },
    'serve.mjs': `
      const server = http.createServer(handler);
      if (pathname === '/health') return ok();
      server.listen(port);
    `,
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 1);
  assert.equal(result.servers[0].url, 'http://127.0.0.1:4173/');
  assert.equal(result.servers[0].health, 'http://127.0.0.1:4173/health');
});

test('adds a separate backend script next to a framework dev server', async () => {
  const root = await fixture({
    'package.json': {
      name: 'full-stack',
      scripts: { dev: 'vite --port 5300', server: 'node server/api.mjs' },
      devDependencies: { vite: '^8.0.0' },
    },
    'server/api.mjs': 'http.createServer(handler).listen(5301);',
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 2);
  assert.equal(result.servers[0].url, 'http://127.0.0.1:5300/');
  assert.equal(result.servers[1].command, 'npm run server');
  assert.equal(result.servers[1].url, 'http://127.0.0.1:5301/');
});

test('ignores electron-only and build/test scripts', async () => {
  const electron = await fixture({
    'package.json': { name: 'app', scripts: { start: 'electron .' }, devDependencies: { electron: '^44.0.0' } },
  });
  assert.deepEqual((await discoverServers(electron)).servers, []);

  const build = await fixture({
    'package.json': { name: 'builder', scripts: { start: 'vite build', dev: 'tsc --noEmit' } },
  });
  assert.deepEqual((await discoverServers(build)).servers, []);
});

test('falls back to a lone serve.mjs/server.mjs when package.json is absent', async () => {
  const root = await fixture({
    'server.mjs': "http.createServer(handler).listen(4321); const path = '/health';",
  });
  const result = await discoverServers(root);
  assert.equal(result.servers.length, 1);
  assert.equal(result.servers[0].command, 'node server.mjs');
  assert.equal(result.servers[0].url, 'http://127.0.0.1:4321/');
  assert.equal(result.servers[0].health, 'http://127.0.0.1:4321/health');

  const empty = await fixture({ 'README.md': 'nothing here' });
  assert.deepEqual((await discoverServers(empty)).servers, []);
});

test('an explicit config overrides discovery and an empty config opts out', async () => {
  const root = await fixture({
    'package.json': { name: 'vite-game', scripts: { dev: 'vite --port 5199' }, devDependencies: { vite: '^8.0.0' } },
  });
  const discoveredOnly = await resolveServerConfig(root);
  assert.equal(discoveredOnly.source, 'discovered');
  assert.equal(discoveredOnly.configured, true);
  assert.equal(discoveredOnly.servers[0].url, 'http://127.0.0.1:5199/');

  await mkdir(join(root, '.dsh', 'workspace-hub'), { recursive: true });
  await writeFile(
    serversPath(root),
    JSON.stringify({ version: 1, servers: [{ name: 'explicit', command: 'node custom.mjs', url: 'http://127.0.0.1:5400/' }] }),
  );
  const explicit = await resolveServerConfig(root);
  assert.equal(explicit.source, 'config');
  assert.equal(explicit.servers.length, 1);
  assert.equal(explicit.servers[0].name, 'explicit');
  assert.equal(explicit.servers[0].url, 'http://127.0.0.1:5400/');

  await writeFile(serversPath(root), JSON.stringify({ version: 1, servers: [] }));
  const optOut = await resolveServerConfig(root);
  assert.equal(optOut.source, 'config');
  assert.equal(optOut.configured, false);
  assert.equal(optOut.servers.length, 0);
});

test('readServersConfig distinguishes a missing file from an empty declaration', async () => {
  const root = await fixture({ 'README.md': 'x' });
  const missing = await readServersConfig(root);
  assert.equal(missing.present, false);

  await mkdir(join(root, '.dsh', 'workspace-hub'), { recursive: true });
  await writeFile(serversPath(root), JSON.stringify({ version: 1, servers: [] }));
  const empty = await readServersConfig(root);
  assert.equal(empty.present, true);
  assert.equal(empty.configured, false);
});

/** Minimal stand-in for the Host subprocess service, over node:child_process. */
function fakeSubprocess() {
  return {
    async resolveExecutable(command) {
      return command;
    },
    spawn(spec) {
      // detached: a process group lets terminate() mimic subprocess-local.
      const child = spawn(spec.argv[0], spec.argv.slice(1), {
        cwd: spec.cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      const done = new Promise((resolve) => child.once('exit', (exitCode, signal) => resolve({ exitCode, signal })));
      return {
        done,
        terminate() {
          try {
            process.kill(-child.pid, 'SIGTERM');
          } catch {
            child.kill('SIGTERM');
          }
        },
        async waitForExit() {
          if (child.exitCode !== null) return true;
          await done;
          return true;
        },
        collected: {
          stdout: { readFrom: () => ({ text: stdout, nextOffset: stdout.length, lossy: false }) },
          stderr: { readFrom: () => ({ text: stderr, nextOffset: stderr.length, lossy: false }) },
        },
      };
    },
  };
}

async function freePort() {
  return await new Promise((resolve) => {
    const probe = createNetServer();
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function refused(url, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
    } catch {
      return true;
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  return false;
}

test('a discovered npm script really starts and stops through the runner', async () => {
  const port = await freePort();
  const root = await fixture({
    'package.json': { name: 'npm-server', scripts: { start: 'node app.mjs' } },
    'app.mjs': `
      import http from 'node:http';
      export const server = http.createServer((request, response) => {
        response.writeHead(200);
        response.end('ok');
      });
      server.listen(${port}, '127.0.0.1');
    `,
  });

  const runner = new ServerRunner(
    { get: (name) => (name === 'subprocess' ? fakeSubprocess() : undefined) },
    undefined,
  );
  try {
    const started = await runner.start(root);
    assert.equal(started.source, 'discovered');
    assert.equal(started.servers.length, 1);
    assert.equal(started.servers[0].status, 'started');
    assert.equal(started.servers[0].ready, true);
    assert.equal(started.url, `http://127.0.0.1:${port}/`);

    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.ok, true);

    const stopped = await runner.stop(root);
    assert.deepEqual(stopped.stopped, ['npm-server · start']);
    assert.equal(await refused(`http://127.0.0.1:${port}/health`), true);
  } finally {
    await runner.dispose();
  }
});
