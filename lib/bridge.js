/**
 * Web panel bridge: one authenticated same-origin JSON endpoint.
 *
 * The page runs on the Host's HTTP origin, so a Plugin's `fetch('/workspace-hub/api/...')`
 * carries the signed browser cookie. The route is guarded by the Connection
 * service's request-trust and browser-authentication check before any body is
 * read, and it fails closed when that service is unavailable.
 */
import { BoardError } from './store.js';
import { groupWorkspaceSessions } from './hub.js';
import { createWorkspaceSkill, workspaceInfo, writeWorkspaceContext, writeWorkspaceRules } from './workspace-info.js';

export const BRIDGE_PREFIX = '/workspace-hub/api';
const MAX_BODY_BYTES = 1024 * 1024;

function respond(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function failureStatus(error) {
  if (error instanceof BoardError) {
    switch (error.code) {
      case 'invalid-input':
      case 'invalid-workspace':
        return 400;
      case 'workspace-unknown':
      case 'workspace-missing':
      case 'task-not-found':
      case 'unknown-subchat':
        return 404;
      case 'parent-not-live':
      case 'not-root-session':
      case 'invalid-actor':
        return 409;
      default:
        return 200;
    }
  }
  return 200;
}

function failurePayload(error) {
  return {
    ok: false,
    error: {
      code: typeof error?.code === 'string' ? error.code : 'error',
      message: String(error?.message ?? error),
      ...(error instanceof BoardError && error.details !== undefined ? { details: error.details } : {}),
    },
  };
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new BoardError('invalid-input', 'request body is too large');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new BoardError('invalid-input', 'request body is not valid JSON');
  }
}

/**
 * Register the bridge route on the Web server.
 * @returns the route disposer.
 */
export function registerBridge(ctx, { hub, subchats, hubs, logger, workspaceContext }) {
  const idsOf = (body) => ({
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    workspaceId: typeof body.workspaceId === 'string' ? body.workspaceId : undefined,
    workspacePath: typeof body.workspacePath === 'string' ? body.workspacePath : undefined,
  });
  const actorOfBody = (body) => ({
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    sessionTitle: undefined,
  });
  const stringField = (body, name) => (typeof body[name] === 'string' ? body[name] : undefined);

  async function dispatch(method, body) {
    const ids = idsOf(body);
    switch (method) {
      case 'context':
        return await hub.context(ids);
      case 'tasks.list': {
        const resolved = await hub.boardRootById(ids);
        return await hub.listAt(resolved, {
          status: stringField(body, 'status'),
          sessionId: body.mine === true ? ids.sessionId : stringField(body, 'assigneeSessionId'),
        });
      }
      case 'tasks.get': {
        const resolved = await hub.boardRootById(ids);
        return await hub.showAt(resolved, String(body.id));
      }
      case 'tasks.create': {
        const resolved = await hub.boardRootById(ids);
        return await hub.createAt(resolved, actorOfBody(body), {
          title: body.title,
          detail: body.detail,
          priority: body.priority,
        });
      }
      case 'tasks.update':
      case 'tasks.claim':
      case 'tasks.release':
      case 'tasks.delete': {
        const resolved = await hub.boardRootById(ids);
        const actor = actorOfBody(body);
        const input = { ...body, id: String(body.id) };
        if (method === 'tasks.update') return await hub.updateAt(resolved, actor, input);
        if (method === 'tasks.claim') return await hub.claimAt(resolved, actor, input);
        if (method === 'tasks.release') return await hub.releaseAt(resolved, actor, input);
        return await hub.removeAt(resolved, actor, input);
      }
      case 'tasks.dispatch': {
        const resolved = await hub.boardRootById(ids);
        return await hub.dispatchAt(resolved, actorOfBody(body), {
          id: String(body.id),
          expectedRevision: Number.isInteger(body.expectedRevision) ? body.expectedRevision : undefined,
          sessionId: stringField(body, 'targetSessionId'),
        });
      }
      case 'workspace.rules.save': {
        const resolved = await hub.boardRootById(ids);
        return { ok: true, ...(await writeWorkspaceRules(resolved.root, body.content)) };
      }
      case 'workspace.context.save': {
        const resolved = await hub.boardRootById(ids);
        const result = await writeWorkspaceContext(resolved.root, body.content);
        await workspaceContext?.refresh(resolved.root);
        return { ok: true, ...result };
      }
      case 'workspace.skill.create': {
        const resolved = await hub.boardRootById(ids);
        return {
          ok: true,
          ...(await createWorkspaceSkill(resolved.root, {
            name: body.name,
            description: body.description,
            body: body.body,
          })),
        };
      }
      case 'hub.workspace': {
        const resolved = await hub.boardRootById(ids);
        return { ok: true, ...(await workspaceInfo(ctx, resolved.root, ids.sessionId)) };
      }
      case 'hub.sessions': {
        const resolved = await hub.boardRootById(ids);
        const conversations = await hub.conversations(resolved);
        const catalog = await subchats.catalog(resolved.root);
        return {
          ok: true,
          workspace: {
            id: resolved.workspaceId ?? null,
            title: resolved.title ?? null,
            path: resolved.root,
          },
          sessions: groupWorkspaceSessions(conversations, catalog.subchats ?? []),
        };
      }
      case 'hub.catalog': {
        return { ok: true, workspaces: await hubs.catalog() };
      }
      case 'subchats.list': {
        const resolved = await hub.boardRootById(ids);
        const parentSessionId = stringField(body, 'parentSessionId') ?? ids.sessionId;
        if (parentSessionId === undefined) throw new BoardError('parent-not-live', 'no conversation selected');
        return await subchats.list(resolved.root, parentSessionId, { includeClosed: body.includeClosed === true });
      }
      case 'subchats.catalog': {
        const resolved = await hub.boardRootById(ids);
        return await subchats.catalog(resolved.root);
      }
      case 'subchats.create': {
        const resolved = await hub.boardRootById(ids);
        const parentSessionId = stringField(body, 'parentSessionId') ?? ids.sessionId;
        const parent = ctx.get('agents')?.get(parentSessionId);
        if (parent === undefined) {
          throw new BoardError('parent-not-live', 'open the main conversation before creating a sub chat');
        }
        return await subchats.create(resolved.root, parent, {
          title: body.title,
          prompt: body.prompt,
          cwd: body.cwd,
        });
      }
      case 'subchats.send':
      case 'subchats.interrupt':
      case 'subchats.close':
      case 'subchats.reopen': {
        const resolved = await hub.boardRootById(ids);
        const parentSessionId = stringField(body, 'parentSessionId') ?? ids.sessionId;
        if (parentSessionId === undefined) throw new BoardError('parent-not-live', 'no conversation selected');
        const id = String(body.id);
        if (method === 'subchats.send') {
          return await subchats.send(resolved.root, parentSessionId, {
            id,
            message: body.message,
            mode: body.mode === 'steer' ? 'steer' : 'queue',
          });
        }
        if (method === 'subchats.interrupt') return subchats.interrupt(resolved.root, parentSessionId, id);
        if (method === 'subchats.close') return await subchats.close(resolved.root, parentSessionId, id);
        return await subchats.reopen(resolved.root, parentSessionId, id);
      }
      default:
        throw new BoardError('unknown-method', `unknown workspace-hub bridge method ${JSON.stringify(method)}`);
    }
  }

  const handler = async (req, res) => {
    const rejection = ctx.connection.requestRejection(req);
    if (rejection !== undefined) {
      respond(res, rejection, { ok: false, error: { code: 'unauthenticated', message: 'not authenticated' } });
      return;
    }
    if (req.method !== 'POST') {
      respond(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'use POST' } });
      return;
    }
    const url = new URL(req.url ?? BRIDGE_PREFIX, 'http://localhost');
    const method = url.pathname.slice(BRIDGE_PREFIX.length).replace(/^\/+|\/+$/g, '');
    if (method.length === 0) {
      respond(res, 404, { ok: false, error: { code: 'unknown-method', message: 'missing bridge method' } });
      return;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      respond(res, 400, failurePayload(error));
      return;
    }
    try {
      const value = await dispatch(method, body);
      respond(res, 200, { ok: true, value });
    } catch (error) {
      const status = failureStatus(error);
      if (status === 200) logger?.warn?.(`workspace-hub bridge ${method} failed: ${String(error?.message ?? error)}`);
      respond(res, status, failurePayload(error));
    }
  };

  return ctx.webServer.register({ kind: 'prefix', path: BRIDGE_PREFIX, handler });
}
