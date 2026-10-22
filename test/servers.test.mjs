// Dev-server runner test: config validation plus real process lifecycle through
// a stand-in subprocess provider (same spawn/resolve/collected contract).
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { ServerRunner, readServersConfig, serversPath, splitCommand } from '../lib/servers.js';

const workspaces = [];

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), 'workspace-hub-servers-'));
  workspaces.push(root);
  return root;
}

async function writeConfig(root, servers) {
  await mkdir(join(root, '.dsh', 'workspace-hub'), { recursive: true });
  await writeFile(serversPath(root), JSON.stringify({ version: 1, servers }, null, 2));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** Minimal implementation of the Host subprocess contract over node:child_process. */
function fakeSubprocess(specs = []) {
  return {
    async resolveExecutable(command) {
      if (command === 'node') return process.execPath;
      return command;
    },
    spawn(spec) {
      specs.push(spec);
      const child = spawn(spec.argv[0], spec.argv.slice(1), { cwd: spec.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      const done = new Promise((resolve) => {
        child.once('error', (error) => resolve({ exitCode: null, signal: null, error }));
        child.once('exit', (code, signal) => resolve({ exitCode: code, signal }));
      });
      return {
        done,
        terminate() {
          child.kill('SIGTERM');
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

function runnerFor(provider) {
  return new ServerRunner({ get: (name) => (name === 'subprocess' ? provider : undefined) }, undefined);
}

async function waitForHealth(url, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  return false;
}

after(async () => {
  for (const root of workspaces) await rm(root, { recursive: true, force: true });
});

test('splitCommand handles quoting and escapes', () => {
  assert.deepEqual(splitCommand('node layer1/server.mjs'), ['node', 'layer1/server.mjs']);
  assert.deepEqual(splitCommand('node -e "console.log(1)"'), ['node', '-e', 'console.log(1)']);
  assert.deepEqual(splitCommand("sh -c 'echo hi'"), ['sh', '-c', 'echo hi']);
  assert.deepEqual(splitCommand('node  a\\ b'), ['node', 'a b']);
  assert.deepEqual(splitCommand('  '), []);
  assert.throws(() => splitCommand('node "unterminated'), /unterminated/);
});

test('readServersConfig reads, validates, and rejects bad declarations', async () => {
  const root = await workspace();
  const empty = await readServersConfig(root);
  assert.equal(empty.configured, false);
  assert.equal(empty.servers.length, 0);

  await writeConfig(root, [
    {
      name: 'game',
      command: 'node layer1/server.mjs',
      url: 'http://127.0.0.1:4180/',
      health: 'http://127.0.0.1:4180/api/health',
    },
  ]);
  const config = await readServersConfig(root);
  assert.equal(config.configured, true);
  assert.equal(config.servers.length, 1);
  assert.deepEqual(config.servers[0].argv, ['node', 'layer1/server.mjs']);
  assert.equal(config.servers[0].cwd, root);
  assert.equal(config.servers[0].health, 'http://127.0.0.1:4180/api/health');

  await writeConfig(root, [{ name: 'escape', argv: ['node'], cwd: '../outside' }]);
  await assert.rejects(readServersConfig(root), (error) => error.code === 'servers-invalid');

  await writeConfig(root, [{ name: 'same', argv: ['node'] }, { name: 'same', argv: ['node'] }]);
  await assert.rejects(readServersConfig(root), (error) => error.code === 'servers-invalid');

  await writeFile(serversPath(root), '{ not json');
  await assert.rejects(readServersConfig(root), (error) => error.code === 'servers-invalid');
});

test('runner starts, reuses, reports, stops, and disposes a real process', async () => {
  const root = await workspace();
  const port = await freePort();
  const script = `require('node:http').createServer((request, response) => { response.writeHead(200); response.end('ok'); }).listen(${port}, '127.0.0.1');`;
  const health = `http://127.0.0.1:${port}/health`;
  await writeConfig(root, [
    {
      name: 'fake-game',
      argv: ['node', '-e', script],
      health,
      url: `http://127.0.0.1:${port}/`,
      readyTimeoutMs: 10_000,
    },
  ]);

  const specs = [];
  const runner = runnerFor(fakeSubprocess(specs));
  const started = await runner.start(root);
  assert.equal(started.servers.length, 1);
  assert.equal(started.servers[0].status, 'started');
  assert.equal(started.servers[0].ready, true);
  assert.equal(started.url, `http://127.0.0.1:${port}/`);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].cwd, root);

  const again = await runner.start(root);
  assert.equal(again.servers[0].status, 'running');
  assert.equal(specs.length, 1, 'a second press must not spawn again');

  const status = await runner.status(root);
  assert.equal(status.servers[0].running, true);
  assert.equal(status.servers[0].ready, true);

  const stopped = await runner.stop(root);
  assert.deepEqual(stopped.stopped, ['fake-game']);
  assert.equal(await waitForHealth(health, 3_000), false);

  const disposed = await runner.start(root);
  assert.equal(disposed.servers[0].status, 'started');
  await runner.dispose();
  assert.equal(await waitForHealth(health, 3_000), false);
});

test('runner reports an already-running server as external and never kills it', async () => {
  const root = await workspace();
  const external = createServer((request, response) => {
    response.writeHead(200);
    response.end('external');
  });
  await new Promise((resolve) => external.listen(0, '127.0.0.1', resolve));
  const { port } = external.address();
  const health = `http://127.0.0.1:${port}/health`;
  await writeConfig(root, [{ name: 'outside', argv: ['node', '-e', 'setInterval(() => {}, 1000)'], health }]);

  const specs = [];
  const runner = runnerFor(fakeSubprocess(specs));
  const result = await runner.start(root);
  assert.equal(result.servers[0].status, 'external');
  assert.equal(specs.length, 0, 'an existing healthy server must not be spawned');

  const stopped = await runner.stop(root);
  assert.deepEqual(stopped.stopped, []);
  const response = await fetch(health);
  assert.equal(response.ok, true, 'external server stays up');

  await new Promise((resolve) => {
    external.closeAllConnections?.();
    external.close(resolve);
  });
});

test('runner surfaces a failed executable as a failed row', async () => {
  const root = await workspace();
  await writeConfig(root, [{ name: 'missing', argv: ['definitely-not-a-real-executable'] }]);
  const runner = runnerFor({
    async resolveExecutable() {
      throw new Error('not found');
    },
    spawn() {
      throw new Error('should not spawn');
    },
  });
  const result = await runner.start(root);
  assert.equal(result.servers[0].status, 'failed');
  assert.match(result.servers[0].error, /not found/);
});

test('runner reports unconfigured workspaces explicitly', async () => {
  const root = await workspace();
  const runner = runnerFor(fakeSubprocess());
  await assert.rejects(runner.start(root), (error) => error.code === 'servers-unconfigured');
});
