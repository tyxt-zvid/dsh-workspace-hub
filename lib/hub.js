/**
 * Workspace Hub Host service.
 *
 * Resolves the calling conversation to its workspace board, applies the pure
 * task operations under the board store's writer lock, and dispatches a task to
 * a conversation through the Session controller (the same Host service the GUI
 * uses, so cold-session resume and durable prompting are handled for us).
 *
 * Two entry shapes share one implementation:
 *   - Agent entry points (`create`, `claim`, ...) used by the model-facing tools.
 *   - `*At` entry points taking an already-resolved workspace and an actor
 *     descriptor, used by the Web panel bridge (a session id may be cold).
 */
import { realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { BoardError, mutateBoard, readBoardFile } from './store.js';
import {
  boardView,
  beginDispatch,
  claimTask,
  createTask,
  deleteTask,
  finishDispatch,
  getTask,
  listTasks,
  releaseTask,
  restoreTask,
  updateTask,
} from './tasks.js';

/** Resolve the durable workspace record for a directory, when one exists. */
async function workspaceByDirectory(registry, directory) {
  if (registry === undefined || directory === undefined) return undefined;
  try {
    return await registry.resolveByPath(directory);
  } catch {
    return undefined;
  }
}

/**
 * Resolve the board root for one calling Agent: durable workspace membership
 * first, then canonical path, then an ad-hoc board at the project directory.
 */
export async function resolveBoardRoot(ctx, agent) {
  const registry = ctx.get('workspaceRegistry');
  const session = agent.session;
  const sessionId = session.header.id;
  const original = session.header.cwd;
  const effective = ctx.workingDirectory.get(session);

  if (registry !== undefined) {
    const member = registry.list().find((workspace) => workspace.sessionIds.includes(sessionId));
    if (member !== undefined) {
      if ((await member.status()) === 'missing-dir') {
        throw new BoardError('workspace-missing', `workspace directory ${member.path} is missing`);
      }
      return { root: member.path, workspaceId: member.id, title: member.title };
    }
    for (const candidate of [original, effective]) {
      const byPath = await workspaceByDirectory(registry, candidate);
      if (byPath !== undefined) return { root: byPath.path, workspaceId: byPath.id, title: byPath.title };
    }
  }

  const directory = original ?? effective;
  if (directory === undefined) {
    throw new BoardError('workspace-unknown', 'this session has no project directory, so it has no workspace board');
  }
  return { root: await realpath(directory), workspaceId: undefined, title: undefined };
}

/** Resolve a board root from a Client-supplied session, workspace, or directory. */
export async function resolveBoardRootById(ctx, { sessionId, workspaceId, workspacePath }) {
  const registry = ctx.get('workspaceRegistry');
  if (workspaceId !== undefined && registry !== undefined) {
    const workspace = registry.get(workspaceId);
    if (workspace !== undefined) {
      return { root: workspace.path, workspaceId: workspace.id, title: workspace.title };
    }
  }
  if (workspacePath !== undefined) {
    const member = await workspaceByDirectory(registry, workspacePath);
    if (member !== undefined) return { root: member.path, workspaceId: member.id, title: member.title };
    try {
      return { root: await realpath(workspacePath), workspaceId: undefined, title: undefined };
    } catch {
      /* fall through to the session */
    }
  }
  if (sessionId !== undefined) {
    const agent = ctx.get('agents')?.get(sessionId);
    if (agent !== undefined) return resolveBoardRoot(ctx, agent);
    const summaries = sessionRows(await ctx.get('sessionController')?.list(new AbortController().signal));
    const summary = summaries.find((entry) => entry.sessionId === sessionId);
    const directory = summary?.cwd;
    if (directory !== undefined) {
      const member = await workspaceByDirectory(registry, directory);
      if (member !== undefined) return { root: member.path, workspaceId: member.id, title: member.title };
      return { root: await realpath(directory), workspaceId: undefined, title: undefined };
    }
  }
  throw new BoardError('workspace-unknown', 'open a workspace session before using the Workspace Hub board');
}

/** The actor descriptor recorded on task mutations. */
export function actorOf(agent) {
  if (agent === undefined) return { sessionId: undefined, sessionTitle: undefined };
  return { sessionId: agent.session.header.id, sessionTitle: undefined };
}

/**
 * Normalize the Session controller's list reply. The direct Host method returns
 * an array, but a Remote-wrapped reply can arrive as `{ ok, value }`; accept all
 * known shapes so a panel read never depends on one envelope.
 */
export function sessionRows(result) {
  if (Array.isArray(result)) return result;
  if (result !== null && typeof result === 'object') {
    if (Array.isArray(result.value)) return result.value;
    if (Array.isArray(result.items)) return result.items;
  }
  return [];
}

function workspaceView(resolved) {
  return { id: resolved.workspaceId ?? null, title: resolved.title ?? null, path: resolved.root };
}

/**
 * Group a workspace's sub chats under their main conversations. Pure, so it can
 * be verified without a Host; orphan rows (parent not in the visible list, such
 * as an archived parent) are appended as their own group instead of vanishing.
 */
export function groupWorkspaceSessions(conversations, subchats) {
  const byParent = new Map();
  for (const row of subchats) {
    const list = byParent.get(row.parentSessionId) ?? [];
    list.push({
      id: row.id,
      parentSessionId: row.parentSessionId,
      title: row.title || row.label || row.id.slice(0, 8),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastAssistantMessage: row.lastAssistantMessage ?? null,
    });
    byParent.set(row.parentSessionId, list);
  }
  const sessions = conversations.map((conversation) => ({
    ...conversation,
    subchats: byParent.get(conversation.sessionId) ?? [],
  }));
  const known = new Set(sessions.map((session) => session.sessionId));
  for (const [parentSessionId, rows] of byParent) {
    if (known.has(parentSessionId)) continue;
    sessions.push({
      sessionId: parentSessionId,
      title: null,
      running: false,
      blank: false,
      updatedAt: rows.reduce((latest, row) => Math.max(latest, row.updatedAt ?? 0), 0),
      archived: false,
      orphanParent: true,
      subchats: rows,
    });
  }
  return sessions;
}

/** Compose the prompt one dispatched conversation receives. */
export function dispatchPrompt(task, boardRoot, fromSessionId) {
  const lines = [
    '[WORKSPACE TASK DISPATCH]',
    `Task ${task.id} (revision ${task.revision}) was dispatched to this conversation by session ${fromSessionId ?? 'the task board'}.`,
    `Title: ${task.title}`,
    task.detail.trim().length > 0 ? `Details:\n${task.detail}` : 'Details: (none)',
    '',
    'You own this task now. Work on it in this conversation.',
    'Report progress with the workspace_task tool: action "update", pass this task id and the current expectedRevision, add a short "note", and set status "done" when the work is complete.',
  ];
  return lines.join('\n');
}

/** The Workspace Hub Host service. */
export class WorkspaceHub {
  constructor(ctx) {
    this.ctx = ctx;
  }

  boardRootForAgent(agent) {
    return resolveBoardRoot(this.ctx, agent);
  }

  boardRootById(ids) {
    return resolveBoardRootById(this.ctx, ids);
  }

  // ----- Agent entry points (model-facing tools) -----

  async list(agent, filter = {}) {
    return this.listAt(await resolveBoardRoot(this.ctx, agent), filter);
  }

  async show(agent, id) {
    return this.showAt(await resolveBoardRoot(this.ctx, agent), id);
  }

  async create(agent, input) {
    return this.createAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  async update(agent, input) {
    return this.updateAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  async claim(agent, input) {
    return this.claimAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  async release(agent, input) {
    return this.releaseAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  async remove(agent, input) {
    return this.removeAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  async dispatch(agent, input) {
    return this.dispatchAt(await resolveBoardRoot(this.ctx, agent), actorOf(agent), input);
  }

  // ----- Resolved entry points (Web panel bridge) -----

  async listAt(resolved, filter = {}) {
    const board = await readBoardFile(resolved.root);
    return { ok: true, board: listTasks(board, resolved.root, filter), workspace: workspaceView(resolved) };
  }

  async showAt(resolved, id) {
    const board = await readBoardFile(resolved.root);
    const found = getTask(board, resolved.root, id);
    if (found === undefined) return { ok: false, code: 'task-not-found', message: `no task ${JSON.stringify(id)}` };
    return { ok: true, ...found, workspace: workspaceView(resolved) };
  }

  async createAt(resolved, actor, input) {
    const result = await mutateBoard(resolved.root, (board) => createTask(board, resolved.root, actor, input));
    return { ok: true, ...result, workspace: workspaceView(resolved) };
  }

  async updateAt(resolved, actor, input) {
    return this.#mutate(resolved, (board) => updateTask(board, resolved.root, actor, input));
  }

  async claimAt(resolved, actor, input) {
    return this.#mutate(resolved, (board) => claimTask(board, resolved.root, actor, input));
  }

  async releaseAt(resolved, actor, input) {
    return this.#mutate(resolved, (board) => releaseTask(board, resolved.root, actor, input));
  }

  async removeAt(resolved, actor, input) {
    return this.#mutate(resolved, (board) => deleteTask(board, resolved.root, actor, input));
  }

  async restoreAt(resolved, actor, input) {
    return this.#mutate(resolved, (board) => restoreTask(board, resolved.root, actor, input));
  }

  async #mutate(resolved, operation) {
    const result = await mutateBoard(resolved.root, (board) => operation(board));
    return { ok: true, ...result, workspace: workspaceView(resolved) };
  }

  /**
   * Dispatch one task to a conversation: an existing session, or a new session
   * created in this workspace. The dispatch intent is committed before the
   * session RPC so a retry after a crash reuses the same request id.
   */
  async dispatchAt(resolved, actor, input) {
    const controller = this.ctx.get('sessionController');
    if (controller === undefined) {
      throw new BoardError('dispatch-unavailable', 'the session controller is not mounted in this profile');
    }
    const signal = new AbortController().signal;

    // 1. Write the intent ahead of any session RPC.
    const requestId = randomUUID();
    const mode = input.sessionId === undefined ? 'new' : 'existing';
    const started = await mutateBoard(resolved.root, (board) =>
      beginDispatch(board, resolved.root, actor, {
        id: input.id,
        expectedRevision: input.expectedRevision,
        requestId,
        mode,
        sessionId: input.sessionId,
        note: input.note,
      }),
    );
    if (started.replay === true) {
      return { ok: true, replay: true, task: started.task, requestId, workspace: workspaceView(resolved) };
    }

    let targetSessionId = input.sessionId;
    try {
      if (targetSessionId === undefined) {
        const request = resolved.workspaceId !== undefined ? { workspaceId: resolved.workspaceId } : { cwd: resolved.root };
        const created = await controller.create(request);
        targetSessionId = created.sessionId;
        await mutateBoard(resolved.root, (board) =>
          finishDispatch(board, resolved.root, actor, {
            id: input.id,
            requestId,
            state: 'queued',
            sessionId: targetSessionId,
          }),
        );
      }
      await controller.prompt(
        {
          requestId,
          sessionId: targetSessionId,
          mode: 'queue',
          content: [
            {
              type: 'text',
              text:
                dispatchPrompt(started.task, resolved.root, actor.sessionId) +
                (typeof input.note === 'string' && input.note.trim() !== ''
                  ? `\n\n补充说明（来自派发人）：${input.note.trim()}`
                  : ''),
            },
          ],
        },
        signal,
      );
      const accepted = await mutateBoard(resolved.root, (board) =>
        finishDispatch(board, resolved.root, actor, {
          id: input.id,
          requestId,
          state: 'accepted',
          sessionId: targetSessionId,
        }),
      );
      return { ok: true, ...accepted, requestId, target: { sessionId: targetSessionId, mode } };
    } catch (error) {
      await mutateBoard(resolved.root, (board) =>
        finishDispatch(board, resolved.root, actor, {
          id: input.id,
          requestId,
          state: 'failed',
          sessionId: targetSessionId,
          error: String(error?.message ?? error),
        }),
      ).catch(() => {});
      throw error;
    }
  }

  /**
   * Cross-workspace summary for the global hub home: one board read per
   * workspace plus a single session enumeration. Server rows are added by the
   * bridge (cheap summary, no health probes).
   */
  async overview() {
    const registry = this.ctx.get('workspaceRegistry');
    if (registry === undefined || typeof registry.list !== 'function') return [];
    const workspaces = registry.list();
    if (!Array.isArray(workspaces) || workspaces.length === 0) return [];
    const controller = this.ctx.get('sessionController');
    let summaries = [];
    if (controller !== undefined) {
      try {
        summaries = sessionRows(await controller.list(new AbortController().signal));
      } catch {
        summaries = [];
      }
    }
    const archived = new Set(registry.archivedSessionIds ?? []);
    const rows = [];
    for (const workspace of workspaces) {
      const resolved = { root: workspace.path, workspaceId: workspace.id, title: workspace.title };
      let board = null;
      let boardError = false;
      try {
        const listed = await this.listAt(resolved, {});
        board = listed.board;
      } catch {
        board = null;
        boardError = true;
      }
      const members = new Set(workspace.sessionIds ?? []);
      const visible = summaries.filter(
        (summary) =>
          summary.origin !== 'subagent' &&
          summary.parentSessionId === undefined &&
          !archived.has(summary.sessionId) &&
          (members.has(summary.sessionId) || summary.cwd === workspace.path),
      );
      const updatedAt = Math.max(
        board?.updatedAt ?? 0,
        ...visible.map((summary) => summary.updatedAt ?? 0),
      );
      rows.push({
        workspaceId: workspace.id,
        title: workspace.title ?? null,
        path: workspace.path,
        board,
        boardError,
        sessions: {
          total: visible.length,
          running: visible.filter((summary) => summary.running === true).length,
          rows: visible.map((summary) => ({
            sessionId: summary.sessionId,
            title: summary.projections?.values?.title ?? null,
            running: summary.running === true,
            updatedAt: summary.updatedAt,
          })),
        },
        updatedAt,
      });
    }
    return rows;
  }

  /** Board root + workspace + visible conversations, for the Web panel. */
  async context(ids) {
    const resolved = await resolveBoardRootById(this.ctx, ids);
    const board = await readBoardFile(resolved.root);
    return {
      ok: true,
      workspace: workspaceView(resolved),
      boardRevision: board.revision,
      counts: boardView(board, resolved.root).counts,
      sessions: await this.conversations(resolved),
    };
  }

  /** Conversations that can be picked as a dispatch target. */
  async conversations(resolved) {
    const controller = this.ctx.get('sessionController');
    const registry = this.ctx.get('workspaceRegistry');
    if (controller === undefined) return [];
    let summaries = [];
    try {
      summaries = sessionRows(await controller.list(new AbortController().signal));
    } catch {
      return [];
    }
    const members = new Set(
      resolved.workspaceId !== undefined ? (registry?.get(resolved.workspaceId)?.sessionIds ?? []) : [],
    );
    const archived = new Set(registry?.archivedSessionIds ?? []);
    return summaries
      .filter(
        (summary) =>
          summary.origin !== 'subagent' &&
          summary.parentSessionId === undefined &&
          !archived.has(summary.sessionId) &&
          (members.has(summary.sessionId) || summary.cwd === resolved.root),
      )
      .map((summary) => ({
        sessionId: summary.sessionId,
        title: summary.projections?.values?.title ?? null,
        running: summary.running === true,
        blank: summary.blank === true,
        updatedAt: summary.updatedAt,
        archived: archived.has(summary.sessionId),
      }));
  }
}
