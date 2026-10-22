// Bridge test: hub.snapshot aggregation over a real board + sub-chat store,
// with a fake Cordis context. No Harness runtime is required.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { mutateBoard } from '../lib/store.js';
import { createTask } from '../lib/tasks.js';
import { WorkspaceHub } from '../lib/hub.js';
import { Subchats } from '../lib/subchats.js';
import { registerBridge } from '../lib/bridge.js';

const root = await mkdtemp(join(tmpdir(), 'workspace-hub-bridge-'));

function fakeRequest(body) {
  return Readable.from([Buffer.from(JSON.stringify(body))]);
}

function fakeResponse() {
  const state = { statusCode: 0, headers: {}, body: '' };
  return {
    state,
    res: {
      set statusCode(value) {
        state.statusCode = value;
      },
      get statusCode() {
        return state.statusCode;
      },
      setHeader(name, value) {
        state.headers[name] = value;
      },
      end(chunk) {
        state.body += chunk ?? '';
      },
    },
  };
}

async function call(handler, method, body, rejection) {
  const { state, res } = fakeResponse();
  const req = fakeRequest(body);
  req.method = 'POST';
  req.url = `/workspace-hub/api/${method}`;
  await handler(req, res, rejection);
  return { status: state.statusCode, payload: JSON.parse(state.body) };
}

try {
  await mkdir(join(root, '.dsh', 'workspace-hub'), { recursive: true });
  await mkdir(join(root, '.dsh', 'skills'), { recursive: true });

  // One task and two sub chats (one open, one closed) under a main session.
  await mutateBoard(root, (board) => createTask(board, root, { sessionId: 'session-a' }, { title: 'Snapshot me', priority: 'high' }));
  await writeFile(
    join(root, '.dsh', 'workspace-hub', 'subchats.json'),
    JSON.stringify({
      schema: 'dsh-workspace-hub/subchats',
      version: 1,
      subchats: [
        { id: 'child-open', parentSessionId: 'session-a', label: 'Open', status: 'open', createdAt: 1, updatedAt: 2 },
        { id: 'child-closed', parentSessionId: 'session-a', label: 'Closed', status: 'closed', createdAt: 3, updatedAt: 4 },
      ],
    }),
  );

  const workspace = { id: 'workspace-test', path: root, title: 'Test Workspace', sessionIds: ['session-a'] };
  let rejection;
  const ctx = {
    connection: { requestRejection: () => rejection },
    webServer: {
      register: (route) => {
        assert.equal(route.path, '/workspace-hub/api');
        return route.handler;
      },
    },
    logger: { warn: () => {} },
    get(name) {
      if (name === 'workspaceRegistry') {
        return {
          get: (id) => (id === workspace.id ? workspace : undefined),
          resolveByPath: async () => undefined,
          archivedSessionIds: new Set(),
        };
      }
      if (name === 'sessionController') {
        return {
          list: async () => [
            {
              sessionId: 'session-a',
              cwd: root,
              origin: 'main',
              running: false,
              updatedAt: 5,
              projections: { values: { title: 'Main session' } },
            },
          ],
        };
      }
      if (name === 'agents') return { get: () => undefined, list: () => [] };
      if (name === 'sessionQuery') return undefined;
      return undefined;
    },
  };

  const hub = new WorkspaceHub(ctx);
  const subchats = new Subchats(ctx, ctx.logger);
  const servers = { status: async () => ({ path: null, source: 'auto', configured: false, servers: [] }) };
  const handler = registerBridge(ctx, { hub, subchats, hubs: {}, logger: ctx.logger, servers });

  const ids = { workspaceId: workspace.id };
  const health = await call(handler, 'hub.snapshot', ids);
  assert.equal(health.status, 200);
  assert.equal(health.payload.ok, true);
  const value = health.payload.value;
  assert.equal(typeof value.generatedAt, 'number');
  assert.equal(value.workspace.id, workspace.id);
  assert.equal(value.board.tasks.length, 1, 'snapshot carries the board');
  assert.equal(value.board.tasks[0].title, 'Snapshot me');
  assert.equal(value.sessions.sessions.length, 1, 'snapshot carries the main session');
  const group = value.sessions.sessions[0];
  assert.equal(group.sessionId, 'session-a');
  assert.equal(group.subchats.length, 2, 'closed sub chats are included in the snapshot');
  const closed = group.subchats.find((row) => row.id === 'child-closed');
  assert.equal(closed.status, 'closed');
  assert.ok('lastAssistantMessage' in closed, 'sub chat rows carry the last-reply field');
  assert.equal(value.servers.configured, false);
  assert.equal(value.meta.serversProbedAt !== null, true);

  // Existing routes still work and the snapshot does not disturb them.
  const listed = await call(handler, 'tasks.list', ids);
  assert.equal(listed.status, 200);
  assert.equal(listed.payload.value.board.tasks.length, 1);

  // Unauthenticated access fails closed.
  rejection = 401;
  const denied = await call(handler, 'hub.snapshot', ids);
  assert.equal(denied.status, 401);
  assert.equal(denied.payload.ok, false);
  rejection = undefined;

  console.log('ALL SNAPSHOT TESTS PASSED');
} finally {
  await rm(root, { recursive: true, force: true });
}
