/**
 * Model-facing tools: the workspace task board and sub-chat management.
 *
 * Definitions are plain JSON Schema with manual argument validation; the plugin
 * imports no Harness package, so a profile-installed bundle cannot fail
 * activation on module resolution.
 */
import { BoardError } from './store.js';

const TASK_STATUS = ['todo', 'doing', 'blocked', 'done', 'cancelled'];
const TASK_PRIORITY = ['low', 'normal', 'high'];

/** Convert a thrown failure into a structured tool value the model can act on. */
function failure(error) {
  if (error instanceof BoardError) {
    return { ok: false, code: error.code, message: error.message, ...(error.details ?? {}) };
  }
  const code = typeof error?.code === 'string' ? error.code : 'error';
  return { ok: false, code, message: String(error?.message ?? error) };
}

/** Drop `undefined` members so a tool value is lossless JSON. */
function toLossless(value) {
  if (Array.isArray(value)) return value.map(toLossless).filter((entry) => entry !== undefined);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      const safe = toLossless(entry);
      if (safe !== undefined) out[key] = safe;
    }
    return out;
  }
  return value === undefined ? undefined : value;
}

function requireString(args, field, { required = false, max = Infinity } = {}) {
  const value = args[field];
  if (value === undefined || value === null) {
    if (required) throw new BoardError('invalid-input', `${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new BoardError('invalid-input', `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (required) throw new BoardError('invalid-input', `${field} must be a non-empty string`);
    return undefined;
  }
  if (trimmed.length > max) throw new BoardError('invalid-input', `${field} must be at most ${max} characters`);
  return value;
}

function requireInteger(args, field) {
  const value = args[field];
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value) || value < 1) throw new BoardError('invalid-input', `${field} must be a positive integer`);
  return value;
}

function requireEnum(args, field, allowed) {
  const value = args[field];
  if (value === undefined || value === null) return undefined;
  if (!allowed.includes(value)) throw new BoardError('invalid-input', `${field} must be one of ${allowed.join(', ')}`);
  return value;
}

function formatTask(task) {
  const owner = task.assignee?.sessionId === undefined ? '' : ` @${String(task.assignee.sessionId).slice(0, 8)}`;
  return `${task.id} [${task.status}/${task.priority}] rev ${task.revision} — ${task.title}${owner}`;
}

function formatBoard(board) {
  const header = `Workspace ${board.workspace}\nBoard revision ${board.revision} · ${board.counts.todo} todo, ${board.counts.doing} doing, ${board.counts.blocked} blocked, ${board.counts.done} done`;
  if (board.tasks.length === 0) return `${header}\n(no tasks)`;
  return `${header}\n${board.tasks.map(formatTask).join('\n')}`;
}

/** Render one tool value as the text the model reads. */
function taskRender(_args, value) {
  let text;
  if (value.ok === false) text = `workspace_task failed (${value.code}): ${value.message}`;
  else if (value.board !== undefined) text = formatBoard(value.board);
  else if (value.task !== undefined) text = formatTask(value.task);
  else if (value.deleted !== undefined) text = `Deleted task ${value.deleted.id} — ${value.deleted.title}`;
  else text = JSON.stringify(value);
  return [{ type: 'text', text }];
}

/** Execute one `workspace_task` call for the calling Agent. */
async function executeTask(args, exec, hub) {
  try {
    return toLossless(await runTask(args, exec, hub));
  } catch (error) {
    return toLossless(failure(error));
  }
}

async function runTask(args, exec, hub) {
  const agent = exec.agent;
  if (agent === undefined) throw new BoardError('invalid-actor', 'the workspace board needs a calling conversation');
  const action = requireString(args, 'action', { required: true });
    const id = requireString(args, 'id', { max: 200 });
    const expectedRevision = requireInteger(args, 'expectedRevision');
    if (action === 'list') {
      const filter = {
        status: requireEnum(args, 'statusFilter', TASK_STATUS),
        sessionId: args.mine === true ? agent?.session.header.id : undefined,
      };
      return await hub.list(agent, filter);
    }
    if (action === 'get') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for get');
      return await hub.show(agent, id);
    }
    if (action === 'create') {
      return await hub.create(agent, {
        title: requireString(args, 'title', { required: true, max: 200 }),
        detail: requireString(args, 'detail', { max: 4000 }),
        priority: requireEnum(args, 'priority', TASK_PRIORITY),
      });
    }
    if (action === 'update') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for update');
      return await hub.update(agent, {
        id,
        expectedRevision,
        title: requireString(args, 'title', { max: 200 }),
        detail: requireString(args, 'detail', { max: 4000 }),
        status: requireEnum(args, 'status', TASK_STATUS),
        priority: requireEnum(args, 'priority', TASK_PRIORITY),
        note: requireString(args, 'note', { max: 2000 }),
      });
    }
    if (action === 'claim') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for claim');
      return await hub.claim(agent, { id, expectedRevision });
    }
    if (action === 'release') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for release');
      return await hub.release(agent, { id, expectedRevision });
    }
    if (action === 'dispatch') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for dispatch');
      return await hub.dispatch(agent, {
        id,
        expectedRevision,
        sessionId: requireString(args, 'sessionId', { max: 200 }),
      });
    }
    if (action === 'delete') {
      if (id === undefined) throw new BoardError('invalid-input', 'id is required for delete');
      return await hub.remove(agent, { id, expectedRevision });
    }
    throw new BoardError('invalid-input', `unknown action ${JSON.stringify(action)}`);
  }

function formatSubchat(row) {
  const status = row.status;
  const reply = row.lastAssistantMessage === undefined ? '' : `\n  ↳ ${String(row.lastAssistantMessage).slice(0, 300)}`;
  return `${row.id} [${status}] ${row.title}${reply}`;
}

function subchatRender(_args, value) {
  let text;
  if (value.ok === false) text = `subchat failed (${value.code}): ${value.message}`;
  else if (Array.isArray(value.subchats)) {
    text =
      value.subchats.length === 0
        ? 'No open sub chats. Use action "create" with a title and a first prompt to start one.'
        : value.subchats.map(formatSubchat).join('\n');
  } else if (value.subchat !== undefined) text = formatSubchat(value.subchat);
  else if (value.messageId !== undefined) text = `Message accepted by sub chat ${value.id}.`;
  else if (value.interrupted === true) text = `Interrupted the current turn of sub chat ${value.id}.`;
  else text = JSON.stringify(value);
  return [{ type: 'text', text }];
}

/** Execute one `subchat` call for the calling Agent. */
async function executeSubchat(args, exec, hub, subchats) {
  try {
    return toLossless(await runSubchat(args, exec, hub, subchats));
  } catch (error) {
    return toLossless(failure(error));
  }
}

async function runSubchat(args, exec, hub, subchats) {
  const agent = exec.agent;
  if (agent === undefined) throw new BoardError('parent-not-live', 'sub chats need a calling conversation');
  const parentId = agent.session.header.id;
  const resolved = await hub.boardRootForAgent(agent);
  const action = requireString(args, 'action', { required: true });
    const id = requireString(args, 'id', { max: 200 });
    if (action === 'list') {
      return await subchats.list(resolved.root, parentId, { includeClosed: args.includeClosed === true });
    }
    if (action === 'create') {
      return await subchats.create(resolved.root, agent, {
        title: requireString(args, 'title', { max: 120 }),
        prompt: requireString(args, 'prompt', { required: true, max: 20000 }),
      });
    }
    if (id === undefined) throw new BoardError('invalid-input', `id is required for ${action}`);
    if (action === 'send') {
      return await subchats.send(resolved.root, parentId, {
        id,
        message: requireString(args, 'message', { required: true, max: 20000 }),
        mode: requireEnum(args, 'mode', ['queue', 'steer']),
        signal: exec.signal,
      });
    }
    if (action === 'interrupt') return subchats.interrupt(resolved.root, parentId, id);
    if (action === 'close') return await subchats.close(resolved.root, parentId, id);
    if (action === 'reopen') return await subchats.reopen(resolved.root, parentId, id);
    throw new BoardError('invalid-input', `unknown action ${JSON.stringify(action)}`);
}

const TASK_TOOL = {
  name: 'workspace_task',
  description:
    'Manage the shared task board of the current workspace. Every conversation opened on this workspace directory sees the same board, so this is how work is handed between conversations. ' +
    'Actions: list (read tasks; filter by status or to your own session), get (one task), create (title plus optional detail/priority), ' +
    'update (title/detail/status/priority, or append a note; pass expectedRevision from your last read so another conversation cannot be overwritten), ' +
    'claim (take ownership for this session, mark doing, 15-minute renewable lease), release, ' +
    'dispatch (hand the task to a conversation: omit sessionId to start a new session in this workspace, or pass an existing sessionId; that conversation receives the task and starts working), delete. ' +
    'A stale expectedRevision returns the fresh task so you can retry. Use dispatch when another conversation should do the work; use claim when you will do it yourself.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'claim', 'release', 'dispatch', 'delete'],
        description: 'What to do with the workspace board.',
      },
      id: { type: 'string', description: 'Task id for get/update/claim/release/dispatch/delete.' },
      title: { type: 'string', description: 'Task title for create/update (1-200 characters).' },
      detail: { type: 'string', description: 'Task detail for create/update (up to 4000 characters).' },
      status: { type: 'string', enum: TASK_STATUS, description: 'New task status for update.' },
      priority: { type: 'string', enum: TASK_PRIORITY, description: 'Task priority.' },
      note: { type: 'string', description: 'Short progress note appended to the task for update.' },
      expectedRevision: {
        type: 'integer',
        description: 'The task revision you last read; the update is refused when it moved. Required for safe claim/update/dispatch.',
      },
      statusFilter: { type: 'string', enum: TASK_STATUS, description: 'For list: only tasks with this status.' },
      mine: { type: 'boolean', description: 'For list: only tasks assigned to this conversation.' },
      sessionId: {
        type: 'string',
        description: 'For dispatch: an existing conversation id to hand the task to. Omit to create a new session in this workspace.',
      },
    },
  },
  output: {
    schema: { type: 'object', additionalProperties: true, properties: { ok: { type: 'boolean' } } },
    render: taskRender,
  },
  presentCall: (args) => ({ card: 'generic', title: `Workspace task: ${args.action}`, kind: 'other', rawInput: args }),
};

const SUBCHAT_TOOL = {
  name: 'subchat',
  description:
    'Manage sub chats of this conversation. A sub chat is a separate continuing conversation owned by this one: it has its own context and turns, keeps working on its own, and can receive more messages after it settles. ' +
    'Replies arrive in this conversation as subagent-settled notices, and action "list" shows the latest reply of each sub chat. ' +
    'Actions: list, create (title + first prompt), send (message; mode "queue" starts a new turn, "steer" injects into the running turn), interrupt (cancel its current turn but keep it continuable), close (stop and hide it), reopen. ' +
    'Only a main conversation can manage sub chats. Closing is reversible with reopen. Use a sub chat for work that needs its own long-running context; use workspace_task dispatch when the work belongs to the shared workspace board.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'create', 'send', 'interrupt', 'close', 'reopen'],
        description: 'What to do with sub chats.',
      },
      id: { type: 'string', description: 'Sub chat id for send/interrupt/close/reopen.' },
      title: { type: 'string', description: 'Short title for create (1-120 characters).' },
      prompt: { type: 'string', description: 'First prompt for create (required when creating).' },
      message: { type: 'string', description: 'Message text for send.' },
      mode: {
        type: 'string',
        enum: ['queue', 'steer'],
        description: 'send: queue a fresh turn (default) or steer the running turn.',
      },
      includeClosed: { type: 'boolean', description: 'list: include closed sub chats.' },
    },
  },
  output: {
    schema: { type: 'object', additionalProperties: true, properties: { ok: { type: 'boolean' } } },
    render: subchatRender,
  },
  presentCall: (args) => ({ card: 'generic', title: `Sub chat: ${args.action}`, kind: 'other', rawInput: args }),
};

function formatServerRow(row) {
  const state =
    row.status === 'failed'
      ? 'failed'
      : row.status === 'started'
        ? 'started'
        : row.status === 'starting'
          ? 'starting'
          : row.status === 'running'
            ? 'running'
            : row.status === 'external' || row.external === true
              ? 'already running'
              : row.running === true
                ? 'running'
                : 'stopped';
  const ready = row.ready === true ? ' · ready' : '';
  const url = typeof row.url === 'string' ? ` — ${row.url}` : '';
  const error = row.error === undefined || row.error === null ? '' : `\n  ↳ ${String(row.error).slice(0, 600)}`;
  return `${row.name}: ${state}${ready}${url}${error}`;
}

function serverRender(_args, value) {
  if (value.ok === false) return [{ type: 'text', text: `dev_server failed (${value.code}): ${value.message}` }];
  const discovered = value.source === 'discovered';
  if (Array.isArray(value.stopped)) {
    const stopped = value.stopped.length === 0 ? 'nothing (no hub-started server was running)' : value.stopped.join(', ');
    return [{ type: 'text', text: `Workspace ${value.workspace}\nStopped: ${stopped}` }];
  }
  if (Array.isArray(value.servers) && value.servers.length > 0) {
    const lines = [value.url === undefined || value.url === null ? '' : `Open ${value.url}`, ...value.servers.map(formatServerRow)]
      .filter((line) => line !== '')
      .join('\n');
    return [
      {
        type: 'text',
        text: `Workspace ${value.workspace}${discovered ? ' (auto-detected from package.json)' : ''}\n${lines}`,
      },
    ];
  }
  return [
    {
      type: 'text',
      text: `Workspace ${value.workspace}: no servers are declared in .dsh/workspace-hub/servers.json and none were auto-detected from package.json.`,
    },
  ];
}

/** Execute one `dev_server` call for the calling Agent. */
async function executeDevServer(args, exec, hub, servers) {
  try {
    return toLossless(await runDevServer(args, exec, hub, servers));
  } catch (error) {
    return toLossless(failure(error));
  }
}

async function runDevServer(args, exec, hub, servers) {
  const agent = exec.agent;
  if (agent === undefined) throw new BoardError('invalid-actor', 'dev servers need a calling conversation');
  const resolved = await hub.boardRootForAgent(agent);
  const action = requireString(args, 'action', { required: true });
  const names = Array.isArray(args.names) ? args.names.filter((name) => typeof name === 'string' && name !== '') : undefined;
  if (action === 'status') return { ...(await servers.status(resolved.root)), workspace: resolved.root };
  if (action === 'start') return { ...(await servers.start(resolved.root, { names })), workspace: resolved.root };
  if (action === 'stop') return { ...(await servers.stop(resolved.root, { names })), workspace: resolved.root };
  throw new BoardError('invalid-input', `unknown action ${JSON.stringify(action)}`);
}

const DEV_SERVER_TOOL = {
  name: 'dev_server',
  description:
    'Start, stop, or inspect the development servers this workspace declares in .dsh/workspace-hub/servers.json. ' +
    'Actions: start (start every declared server that is not already healthy, wait for its health URL, and return the URL to open), status, ' +
    'stop (terminate only servers this hub started; servers started outside it stay untouched). ' +
    'This is the same operation as the "Start workspace servers" keyboard shortcut, so use it when a web project needs its dev server running before a browser check.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['action'],
    properties: {
      action: { type: 'string', enum: ['start', 'status', 'stop'], description: 'What to do with the workspace dev servers.' },
      names: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional server names; omit to act on every declared server.',
      },
    },
  },
  output: {
    schema: { type: 'object', additionalProperties: true, properties: { ok: { type: 'boolean' } } },
    render: serverRender,
  },
  presentCall: (args) => ({ card: 'generic', title: `Dev servers: ${args.action}`, kind: 'other', rawInput: args }),
};

/** Register both tools on the Host tool registry, bound to the two services. */
export function registerTools(ctx, { hub, subchats, servers }) {
  const disposers = [
    ctx.tools.register({ ...TASK_TOOL, execute: (args, exec) => executeTask(args, exec, hub) }),
    ctx.tools.register({ ...SUBCHAT_TOOL, execute: (args, exec) => executeSubchat(args, exec, hub, subchats) }),
    ctx.tools.register({ ...DEV_SERVER_TOOL, execute: (args, exec) => executeDevServer(args, exec, hub, servers) }),
  ];
  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}

export { TASK_TOOL, SUBCHAT_TOOL, DEV_SERVER_TOOL };
