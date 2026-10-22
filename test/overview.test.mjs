// Bridge test: hub.overview aggregates every registered workspace's board and
// session counts in one call, with a cheap server summary (no probes).
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { mutateBoard } from '../lib/store.js';
import { createTask, updateTask } from '../lib/tasks.js';
import { WorkspaceHub } from '../lib/hub.js';
import { Subchats } from '../lib/subchats.js';
import { registerBridge } from '../lib/bridge.js';

const rootA = await mkdtemp(join(tmpdir(), 'workspace-hub-overview-a-'));
const rootB = await mkdtemp(join(tmpdir(), 'workspace-hub-overview-b-'));

function request(body) {
  return Readable.from([Buffer.from(JSON.stringify(body))]);
}
function response() {
  const state = { statusCode: 0, body: '' };
  return {
    res: {
      set statusCode(value) {
        state.statusCode = value;
      },
      get statusCode() {
        return state.statusCode;
      },
      setHeader() {},
      end(chunk) {
        state.body += chunk ?? '';
      },
    },
    state,
  };
}
async function call(handler, method, body) {
  const { state, res } = response();
  const req = request(body);
  req.method = 'POST';
  req.url = `/workspace-hub/api/${method}`;
  await handler(req, res);
  return { status: state.statusCode, payload: JSON.parse(state.body) };
}

try {
  await mkdir(join(rootA, '.dsh', 'workspace-hub'), { recursive: true });
  await mkdir(join(rootB, '.dsh', 'workspace-hub'), { recursive: true });
  await mutateBoard(rootA, (board) => createTask(board, rootA, { sessionId: 'a-1' }, { title: 'A todo' }));
  await mutateBoard(rootA, (board) => {
    const created = createTask(board, rootA, { sessionId: 'a-1' }, { title: 'A doing' }).result;
    return updateTask(board, rootA, { sessionId: 'a-1' }, { id: created.task.id, expectedRevision: created.task.revision, status: 'doing' });
  });
  await mutateBoard(rootB, (board) => createTask(board, rootB, { sessionId: 'b-1' }, { title: 'B blocked' }));

  const workspaces = [
    { id: 'ws-a', title: 'Workspace A', path: rootA, sessionIds: ['a-1'] },
    { id: 'ws-b', title: 'Workspace B', path: rootB, sessionIds: ['b-1'] },
  ];
  const ctx = {
    connection: { requestRejection: () => undefined },
    webServer: { register: (route) => route.handler },
    logger: { warn: () => {} },
    get(name) {
      if (name === 'workspaceRegistry') {
        return {
          list: () => workspaces,
          get: (id) => workspaces.find((workspace) => workspace.id === id),
          resolveByPath: async () => undefined,
          archivedSessionIds: new Set(),
        };
      }
      if (name === 'sessionController') {
        return {
          list: async () => [
            { sessionId: 'a-1', cwd: rootA, origin: 'main', running: true, updatedAt: 10, projections: { values: { title: 'A main' } } },
            { sessionId: 'b-1', cwd: rootB, origin: 'main', running: false, updatedAt: 20, projections: { values: { title: 'B main' } } },
            { sessionId: 'child', cwd: rootA, origin: 'subagent', parentSessionId: 'a-1', running: true, updatedAt: 30 },
          ],
        };
      }
      if (name === 'agents') return { get: () => undefined, list: () => [] };
      return undefined;
    },
  };

  const hub = new WorkspaceHub(ctx);
  const subchats = new Subchats(ctx, ctx.logger);
  const servers = {
    summary: async (root) =>
      root === rootA
        ? { path: null, source: 'auto', configured: true, servers: [{ name: 'web', running: true, ready: true }], counts: { total: 1, running: 1, ready: 1, failed: 0 } }
        : { path: null, source: 'auto', configured: true, servers: [{ name: 'docs', running: false, ready: false }], counts: { total: 1, running: 0, ready: 0, failed: 0 } },
  };
  const handler = registerBridge(ctx, { hub, subchats, hubs: {}, logger: ctx.logger, servers });

  const result = await call(handler, 'hub.overview', {});
  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  const value = result.payload.value;
  assert.equal(value.workspaces.length, 2, 'overview lists every workspace');
  const a = value.workspaces.find((row) => row.workspaceId === 'ws-a');
  const b = value.workspaces.find((row) => row.workspaceId === 'ws-b');
  assert.equal(a.board.tasks.length, 2, 'overview carries the full board for attention derivation');
  assert.equal(a.sessions.total, 1, 'subagent sessions are excluded');
  assert.equal(a.sessions.running, 1);
  assert.equal(a.servers.counts.ready, 1);
  assert.equal(b.board.tasks.length, 1);
  assert.equal(b.sessions.running, 0);
  assert.equal(value.totals.workspaces, 2);
  assert.equal(value.totals.tasks, 3);
  assert.equal(value.totals.doing, 1);
  assert.equal(value.totals.todo, 2);
  assert.equal(value.totals.serversReady, 1);
  assert.equal(typeof value.generatedAt, 'number');

  // The selected-workspace snapshot route still works alongside it.
  const snap = await call(handler, 'hub.snapshot', { workspaceId: 'ws-a' });
  assert.equal(snap.payload.ok, true);
  assert.equal(snap.payload.value.board.tasks.length, 2);

  console.log('ALL OVERVIEW TESTS PASSED');
} finally {
  await rm(rootA, { recursive: true, force: true });
  await rm(rootB, { recursive: true, force: true });
}
