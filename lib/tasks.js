/**
 * Pure task-board operations.
 *
 * Every mutating operation is called with the board freshly read inside the
 * writer lock; it checks compare-and-set preconditions there, returns
 * `{ board, result }`, and the store commits with an incremented board
 * revision. Invalid input and stale preconditions throw {@link BoardError} with
 * a machine-readable `code` and the current task, so the tool layer can return a
 * structured conflict instead of losing the payload.
 */
import {
  BOARD_SCHEMA,
  BOARD_VERSION,
  CLAIM_LEASE_MS,
  MAX_DETAIL,
  MAX_NOTE,
  MAX_TITLE,
  PRIORITIES,
  STATUSES,
  BoardError,
  clampString,
  requireEnum,
} from './store.js';
import { randomUUID } from 'node:crypto';

const TASK_FIELDS = [
  'id',
  'title',
  'detail',
  'status',
  'priority',
  'revision',
  'assignee',
  'createdBy',
  'createdAt',
  'updatedAt',
  'dispatch',
  'notes',
];

/** Project one stored task for tools and the panel. */
export function taskView(task) {
  const view = {};
  for (const field of TASK_FIELDS) view[field] = task[field] ?? null;
  view.dispatches = task.dispatches ?? [];
  return view;
}

/** Project the board for tools and the panel. */
export function boardView(board, workspace) {
  return {
    schema: BOARD_SCHEMA,
    version: BOARD_VERSION,
    workspace,
    revision: board.revision,
    updatedAt: board.updatedAt,
    counts: boardCounts(board),
    tasks: board.tasks.map(taskView),
  };
}

function findTask(board, id) {
  const task = board.tasks.find((entry) => entry.id === id);
  if (task === undefined) {
    throw new BoardError('task-not-found', `task ${JSON.stringify(id)} was not found on this workspace board`);
  }
  return task;
}

function ownerOf(actor) {
  if (actor.sessionId === undefined) return null;
  return { sessionId: actor.sessionId, title: actor.sessionTitle ?? '', leaseExpiresAt: 0 };
}

function checkRevision(task, expectedRevision) {
  if (expectedRevision !== undefined && expectedRevision !== task.revision) {
    throw new BoardError(
      'stale-revision',
      `task ${JSON.stringify(task.id)} changed: expected revision ${expectedRevision}, current revision ${task.revision}`,
      { task: taskView(task) },
    );
  }
}

function touch(task) {
  task.updatedAt = Date.now();
  task.revision += 1;
}

function pushNote(task, actor, text) {
  task.notes = [...(task.notes ?? []), { at: Date.now(), sessionId: actor.sessionId, text: text.slice(0, MAX_NOTE) }].slice(-50);
}

/** List the board, optionally filtered by status or assignee session. */
export function listTasks(board, workspace, filter = {}) {
  let tasks = board.tasks;
  if (filter.status !== undefined) {
    requireEnum(filter.status, 'status', STATUSES, 'invalid-input');
    tasks = tasks.filter((task) => task.status === filter.status);
  }
  if (filter.sessionId !== undefined) {
    tasks = tasks.filter((task) => task.assignee?.sessionId === filter.sessionId);
  }
  return boardView({ ...board, tasks }, workspace);
}

/** Read one task, or `undefined` when the id is absent. */
export function getTask(board, workspace, id) {
  const task = board.tasks.find((entry) => entry.id === id);
  return task === undefined ? undefined : { workspace, task: taskView(task) };
}

/** Create one task on the board. */
export function createTask(board, workspace, actor, input) {
  const title = clampString(input.title, 'title', MAX_TITLE);
  const detail = input.detail === undefined ? '' : String(input.detail).slice(0, MAX_DETAIL);
  const priority = input.priority === undefined ? 'normal' : requireEnum(input.priority, 'priority', PRIORITIES, 'invalid-input');
  const now = Date.now();
  const taken = new Set(board.tasks.map((task) => task.id));
  const task = {
    id: `t-${now.toString(36)}-${randomUUID().slice(0, 6)}`,
    title,
    detail,
    status: 'todo',
    priority,
    revision: 1,
    assignee: null,
    createdBy: ownerOf(actor),
    createdAt: now,
    updatedAt: now,
    dispatch: null,
    dispatches: [],
    notes: [],
  };
  while (taken.has(task.id)) task.id = `t-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  board.tasks.push(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/** Update one task with a compare-and-set on its revision. */
export function updateTask(board, workspace, actor, input) {
  const task = findTask(board, input.id);
  checkRevision(task, input.expectedRevision);
  if (task.status === 'cancelled') {
    throw new BoardError('not-claimable', `task ${JSON.stringify(task.id)} is cancelled`, { task: taskView(task) });
  }
  if (input.title !== undefined) task.title = clampString(input.title, 'title', MAX_TITLE);
  if (input.detail !== undefined) task.detail = String(input.detail).slice(0, MAX_DETAIL);
  if (input.status !== undefined) task.status = requireEnum(input.status, 'status', STATUSES, 'invalid-input');
  if (input.priority !== undefined) {
    task.priority = requireEnum(input.priority, 'priority', PRIORITIES, 'invalid-input');
  }
  if (input.note !== undefined) pushNote(task, actor, clampString(input.note, 'note', MAX_NOTE));
  // An owner heartbeat (status still doing) renews the claim lease.
  if (input.status === 'doing' && task.assignee !== null && task.assignee.sessionId === actor.sessionId) {
    task.assignee.leaseExpiresAt = Date.now() + CLAIM_LEASE_MS;
  }
  if (input.status === 'done' || input.status === 'cancelled') {
    task.assignee = null;
  }
  touch(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/** Claim one task for the actor's session under a renewable lease. */
export function claimTask(board, workspace, actor, input) {
  if (actor.sessionId === undefined) {
    throw new BoardError('invalid-actor', 'claiming a task requires a calling session');
  }
  const task = findTask(board, input.id);
  checkRevision(task, input.expectedRevision);
  if (task.status === 'done' || task.status === 'cancelled') {
    throw new BoardError('not-claimable', `task ${JSON.stringify(task.id)} is ${task.status}`, { task: taskView(task) });
  }
  const now = Date.now();
  const leased = task.assignee !== null && task.assignee.leaseExpiresAt > now;
  if (leased && task.assignee.sessionId !== actor.sessionId) {
    throw new BoardError(
      'already-claimed',
      `task ${JSON.stringify(task.id)} is claimed by session ${JSON.stringify(task.assignee.sessionId)} until ${new Date(task.assignee.leaseExpiresAt).toISOString()}`,
      { task: taskView(task) },
    );
  }
  if (task.assignee !== null && task.assignee.sessionId === actor.sessionId && task.status === 'doing') {
    task.assignee.leaseExpiresAt = now + CLAIM_LEASE_MS;
    touch(task);
    return { board, result: { workspace, task: taskView(task), renewed: true } };
  }
  if (task.assignee !== null && task.assignee.sessionId !== actor.sessionId && !leased) {
    pushNote(task, actor, `claim lease expired; taken over by ${actor.sessionId ?? 'an unknown session'}`);
  }
  task.assignee = {
    sessionId: actor.sessionId,
    title: actor.sessionTitle ?? '',
    claimId: `clm-${randomUUID()}`,
    leaseExpiresAt: now + CLAIM_LEASE_MS,
  };
  task.status = 'doing';
  touch(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/** Release a claim. The owner may release its own claim; anyone may release an expired one. */
export function releaseTask(board, workspace, actor, input) {
  const task = findTask(board, input.id);
  checkRevision(task, input.expectedRevision);
  if (task.assignee === null) {
    throw new BoardError('not-claimed', `task ${JSON.stringify(task.id)} is not claimed`, { task: taskView(task) });
  }
  const owned = task.assignee.sessionId === actor.sessionId;
  if (!owned && task.assignee.leaseExpiresAt > Date.now()) {
    throw new BoardError('not-owner', `task ${JSON.stringify(task.id)} is claimed by another live session`, {
      task: taskView(task),
    });
  }
  task.assignee = null;
  if (task.status === 'doing') task.status = 'todo';
  touch(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/**
 * Write-ahead half of a dispatch: record the request id and target before any
 * session RPC runs, so a retry after a crash is idempotent.
 */
export function beginDispatch(board, workspace, actor, input) {
  const task = findTask(board, input.id);
  checkRevision(task, input.expectedRevision);
  if (task.status === 'done' || task.status === 'cancelled') {
    throw new BoardError('not-claimable', `task ${JSON.stringify(task.id)} is ${task.status}`, { task: taskView(task) });
  }
  if (task.dispatch !== null && task.dispatch.state === 'creating' && task.dispatch.requestId === input.requestId) {
    return { result: { workspace, task: taskView(task), replay: true } }; // already written ahead
  }
  task.dispatch = {
    requestId: input.requestId,
    mode: input.mode,
    state: 'creating',
    ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
    at: Date.now(),
  };
  task.assignee = {
    sessionId: input.sessionId ?? `pending:${input.requestId}`,
    title: input.sessionTitle ?? '',
    claimId: `clm-${randomUUID()}`,
    leaseExpiresAt: Date.now() + CLAIM_LEASE_MS,
  };
  task.status = 'doing';
  touch(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/** Complete a dispatch after the session RPC settles. */
export function finishDispatch(board, workspace, actor, input) {
  const task = findTask(board, input.id);
  if (task.dispatch === null || task.dispatch.requestId !== input.requestId) {
    throw new BoardError('dispatch-mismatch', `task ${JSON.stringify(task.id)} has no dispatch ${input.requestId}`, {
      task: taskView(task),
    });
  }
  task.dispatch = {
    ...task.dispatch,
    state: input.state,
    ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
    at: Date.now(),
    ...(input.error === undefined ? {} : { error: input.error }),
  };
  if (input.state === 'accepted') {
    if (task.assignee === null || task.assignee.sessionId !== input.sessionId) {
      task.assignee = {
        sessionId: input.sessionId,
        title: input.sessionTitle ?? '',
        claimId: `clm-${randomUUID()}`,
        leaseExpiresAt: Date.now() + CLAIM_LEASE_MS,
      };
    }
    task.dispatches = [
      ...(task.dispatches ?? []).slice(-19),
      { sessionId: input.sessionId, at: Date.now(), mode: task.dispatch.mode },
    ];
  } else if (input.state === 'failed') {
    task.assignee = null;
    task.status = 'todo';
    if (input.error !== undefined) pushNote(task, actor, `dispatch failed: ${input.error}`);
  }
  touch(task);
  return { board, result: { workspace, task: taskView(task) } };
}

/** Remove one task. */
export function deleteTask(board, workspace, actor, input) {
  const task = findTask(board, input.id);
  checkRevision(task, input.expectedRevision);
  board.tasks = board.tasks.filter((entry) => entry.id !== task.id);
  return { board, result: { workspace, deleted: { id: task.id, title: task.title } } };
}

/** Counts used by the panel header. */
export function boardCounts(board) {
  const counts = { todo: 0, doing: 0, blocked: 0, done: 0, cancelled: 0, total: board.tasks.length };
  for (const task of board.tasks) counts[task.status] += 1;
  return counts;
}
