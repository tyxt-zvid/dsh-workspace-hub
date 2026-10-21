/**
 * Durable, workspace-scoped task board storage.
 *
 * One board lives at `<workspace realpath>/.dsh/workspace-hub/tasks.json`, so
 * every session opened on that workspace directory reads and writes the same
 * board. A mutation runs under one in-process FIFO and one cross-process writer
 * lock, re-reads the board inside the lock (compare-and-set happens there), and
 * commits with a durable atomic replace: temp file `wx` -> fsync -> rename ->
 * fsync the directory entry.
 *
 * Readers take no lock: `rename` publishes either the complete old or the
 * complete new document.
 */
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

export const BOARD_SCHEMA = 'dsh-workspace-hub/tasks';
export const BOARD_VERSION = 1;
export const STATUSES = ['todo', 'doing', 'blocked', 'done', 'cancelled'];
export const PRIORITIES = ['low', 'normal', 'high'];
export const CLAIM_LEASE_MS = 15 * 60 * 1000;

export const MAX_TITLE = 200;
export const MAX_DETAIL = 4000;
export const MAX_NOTE = 2000;

const LOCK_WAIT_MS = 10_000;

export class BoardError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'BoardError';
    this.code = code;
    this.details = details;
  }
}

/** @returns {string} the board file for one workspace root. */
export function boardPath(workspaceRoot) {
  return join(workspaceRoot, '.dsh', 'workspace-hub', 'tasks.json');
}

/** A file inside the workspace's private hub directory. */
export function hubFile(workspaceRoot, fileName) {
  return join(normalizeRoot(workspaceRoot), '.dsh', 'workspace-hub', fileName);
}

/** The canonical workspace root a board is keyed by. */
export function normalizeRoot(workspaceRoot) {
  if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
    throw new BoardError('invalid-workspace', 'a workspace root directory is required');
  }
  return workspaceRoot.length > 1 ? workspaceRoot.replace(/[\\/]+$/, '') : workspaceRoot;
}

function emptyBoard(workspaceRoot) {
  return {
    schema: BOARD_SCHEMA,
    version: BOARD_VERSION,
    workspace: workspaceRoot,
    revision: 0,
    updatedAt: Date.now(),
    tasks: [],
  };
}

function clampString(value, field, max) {
  if (typeof value !== 'string') throw new BoardError('invalid-input', `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new BoardError('invalid-input', `${field} must be a non-empty string`);
  if (trimmed.length > max) throw new BoardError('invalid-input', `${field} must be at most ${max} characters`);
  return trimmed;
}

function optionalString(value, field, max) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BoardError('board-invalid', `${field} must be a string`);
  if (value.length > max) throw new BoardError('board-invalid', `${field} is longer than ${max} characters`);
  return value;
}

function requireEnum(value, field, allowed, errorCode) {
  if (!allowed.includes(value)) {
    throw new BoardError(errorCode, `${field} must be one of ${allowed.join(', ')}`);
  }
  return value;
}

function normalizeOwner(raw, index) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') throw new BoardError('board-invalid', `task[${index}].assignee is not an object`);
  if (typeof raw.sessionId !== 'string' || raw.sessionId.length === 0) {
    throw new BoardError('board-invalid', `task[${index}].assignee.sessionId is required`);
  }
  return {
    sessionId: raw.sessionId,
    title: typeof raw.title === 'string' ? raw.title : '',
    ...(typeof raw.claimId === 'string' ? { claimId: raw.claimId } : {}),
    leaseExpiresAt: Number.isFinite(raw.leaseExpiresAt) ? raw.leaseExpiresAt : 0,
  };
}

function normalizeDispatch(raw, index) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') throw new BoardError('board-invalid', `task[${index}].dispatch is not an object`);
  if (typeof raw.requestId !== 'string' || raw.requestId.length === 0) {
    throw new BoardError('board-invalid', `task[${index}].dispatch.requestId is required`);
  }
  return {
    requestId: raw.requestId,
    mode: raw.mode === 'existing' ? 'existing' : 'new',
    state: requireEnum(raw.state, `task[${index}].dispatch.state`, ['creating', 'queued', 'accepted', 'failed'], 'board-invalid'),
    ...(typeof raw.sessionId === 'string' ? { sessionId: raw.sessionId } : {}),
    at: Number.isFinite(raw.at) ? raw.at : 0,
    ...(typeof raw.error === 'string' ? { error: raw.error } : {}),
  };
}

/** Normalize one persisted task; throws on a record this version cannot read. */
function normalizeTask(raw, index) {
  if (raw === null || typeof raw !== 'object') throw new BoardError('board-invalid', `task[${index}] is not an object`);
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : undefined;
  if (id === undefined) throw new BoardError('board-invalid', `task[${index}] has no id`);
  return {
    id,
    title: clampString(raw.title, `task[${index}].title`, MAX_TITLE),
    detail: optionalString(raw.detail, `task[${index}].detail`, MAX_DETAIL) ?? '',
    status: requireEnum(raw.status, `task[${index}].status`, STATUSES, 'board-invalid'),
    priority: requireEnum(raw.priority, `task[${index}].priority`, PRIORITIES, 'board-invalid'),
    revision: (() => {
      if (!Number.isInteger(raw.revision) || raw.revision < 1) {
        throw new BoardError('board-invalid', `task[${index}].revision must be a positive integer`);
      }
      return raw.revision;
    })(),
    assignee: normalizeOwner(raw.assignee, index),
    createdBy: normalizeOwner(raw.createdBy, index),
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
    dispatch: normalizeDispatch(raw.dispatch, index),
    dispatches: Array.isArray(raw.dispatches)
      ? raw.dispatches
          .filter((entry) => entry !== null && typeof entry === 'object' && typeof entry.sessionId === 'string')
          .slice(-20)
          .map((entry) => ({
            sessionId: entry.sessionId,
            at: Number.isFinite(entry.at) ? entry.at : Date.now(),
            mode: entry.mode === 'existing' ? 'existing' : 'new',
          }))
      : [],
    notes: Array.isArray(raw.notes)
      ? raw.notes
          .filter((entry) => entry !== null && typeof entry === 'object' && typeof entry.text === 'string')
          .slice(-50)
          .map((entry) => ({
            at: Number.isFinite(entry.at) ? entry.at : Date.now(),
            sessionId: typeof entry.sessionId === 'string' ? entry.sessionId : undefined,
            text: entry.text.slice(0, MAX_NOTE),
          }))
      : [],
  };
}

/** Parse a board document and fail loudly on an unreadable version or field. */
export function decodeBoard(text, workspaceRoot) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new BoardError('board-corrupt', `${boardPath(workspaceRoot)} is not valid JSON: ${error.message}`);
  }
  if (raw === null || typeof raw !== 'object') throw new BoardError('board-corrupt', 'board is not an object');
  if (raw.schema !== undefined && raw.schema !== BOARD_SCHEMA) {
    throw new BoardError('board-invalid', `unexpected board schema ${JSON.stringify(raw.schema)}`);
  }
  if (raw.version !== BOARD_VERSION) throw new BoardError('board-invalid', `unsupported board version ${String(raw.version)}`);
  if (!Array.isArray(raw.tasks)) throw new BoardError('board-invalid', 'board has no tasks array');
  const board = emptyBoard(workspaceRoot);
  board.revision = Number.isInteger(raw.revision) && raw.revision >= 0 ? raw.revision : 0;
  board.updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now();
  board.tasks = raw.tasks.map(normalizeTask);
  return board;
}

/** Encode one board document. */
export function encodeBoard(board) {
  return `${JSON.stringify(board, null, 2)}\n`;
}

async function readBoard(file, workspaceRoot) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return emptyBoard(workspaceRoot);
    throw error;
  }
  return decodeBoard(text, workspaceRoot);
}

/** Durable atomic replace: fsync the temp file, rename, then fsync the directory entry. */
async function writeDurableAtomic(file, text) {
  const directory = dirname(file);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const temporary = join(directory, `.${randomUUID()}.tmp`);
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(text, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, file);
    if (process.platform !== 'win32') {
      const dirHandle = await open(directory, 'r');
      try {
        await dirHandle.sync();
      } finally {
        await dirHandle.close();
      }
    }
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

/** Durable atomic text write for workspace files (temp file, fsync, rename). */
export async function writeTextFileDurable(file, text) {
  await writeDurableAtomic(file, text);
}

/** Read a UTF-8 text file, or undefined when it does not exist. */
export async function readTextFile(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Remove a lock whose recorded owner process no longer exists. */
async function takeOverExitedLock(lock) {
  let record;
  try {
    record = await readFile(lock, 'utf8');
  } catch {
    return;
  }
  if (!/^\d+\n$/.test(record)) return; // incomplete record: never break it
  const pid = Number(record.trim());
  if (pid === 0 || pid === process.pid || pid > 2 ** 31 - 1) return;
  try {
    process.kill(pid, 0);
    return; // holder alive
  } catch (error) {
    if (error?.code !== 'ESRCH') return;
  }
  // One contender serializes takeovers; the claim file is removed afterwards.
  const claim = `${lock}.takeover-${createHash('sha256').update(record).digest('hex').slice(0, 16)}`;
  try {
    await writeFile(claim, `${process.pid}\n`, { mode: 0o600, flag: 'wx' });
  } catch {
    return;
  }
  try {
    let current;
    try {
      current = await readFile(lock, 'utf8');
    } catch {
      return;
    }
    if (current !== record) return;
    await rm(lock, { force: true });
  } finally {
    await rm(claim, { force: true }).catch(() => {});
  }
}

/** Hold the cross-process writer lock for `file` around `operation`. */
async function withWriterLock(file, operation, { waitMs = LOCK_WAIT_MS } = {}) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const lock = `${file}.lock`;
  const deadline = Date.now() + waitMs;
  let delayMs = 20;
  for (;;) {
    try {
      await writeFile(lock, `${process.pid}\n`, { mode: 0o600, flag: 'wx' });
      break; // acquired
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        // Windows reports a transient EPERM while a contender holds the file.
        if (!(process.platform === 'win32' && (error?.code === 'EPERM' || error?.code === 'EACCES'))) throw error;
      } else {
        await takeOverExitedLock(lock);
      }
    }
    if (Date.now() >= deadline) {
      throw new BoardError('lock-timeout', `workspace-hub: writer lock timeout at ${lock}`);
    }
    await delay(delayMs);
    delayMs = Math.min(delayMs * 2, 200);
  }
  try {
    return await operation();
  } finally {
    await rm(lock, { force: true }).catch(() => {});
  }
}

/** One FIFO per canonical board file, so same-process writers never interleave. */
const queues = new Map();

function enqueue(key, operation) {
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous.then(operation, operation);
  queues.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

/**
 * Apply a pure mutation to one JSON file under both locks.
 * `mutate` receives the parsed document (or `undefined` when absent) and
 * returns `{ document?, result }`; returning no document means no write.
 */
export function mutateJsonFile(workspaceRoot, fileName, mutate) {
  const root = normalizeRoot(workspaceRoot);
  const file = hubFile(root, fileName);
  return enqueue(file, () =>
    withWriterLock(file, async () => {
      let current;
      try {
        current = JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw new BoardError('board-corrupt', `${file} is not readable JSON: ${error.message}`);
        }
        current = undefined;
      }
      const outcome = await mutate(current);
      if (outcome.document !== undefined) {
        await writeDurableAtomic(file, `${JSON.stringify(outcome.document, null, 2)}\n`);
      }
      return outcome.result;
    }),
  );
}

/** Read one JSON file inside the hub directory; `undefined` when absent. */
export async function readJsonFile(workspaceRoot, fileName) {
  const file = hubFile(workspaceRoot, fileName);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw new BoardError('board-corrupt', `${file} is not readable JSON: ${error.message}`);
  }
}

/**
 * Apply a pure mutation to one board under both locks.
 * `mutate` receives the freshly read board and returns `{ board?, result }`;
 * returning no `board` means the mutation and value were already committed.
 */
export function mutateBoard(workspaceRoot, mutate) {
  return mutateJsonFile(workspaceRoot, 'tasks.json', async (document) => {
    const current = document === undefined ? emptyBoard(normalizeRoot(workspaceRoot)) : decodeBoard(JSON.stringify(document), normalizeRoot(workspaceRoot));
    const outcome = await mutate(current);
    if (outcome.board === undefined) return { result: outcome.result };
    outcome.board.revision = current.revision + 1;
    outcome.board.updatedAt = Date.now();
    return { document: outcome.board, result: outcome.result };
  });
}

/** Read one board without mutating it. Safe to call while a writer runs. */
export function readBoardFile(workspaceRoot) {
  return readBoard(boardPath(normalizeRoot(workspaceRoot)), normalizeRoot(workspaceRoot));
}

/** Build a new task id unique among `taken`. */
export function newTaskId(taken) {
  for (;;) {
    const id = `t-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
    if (!taken.has(id)) return id;
  }
}

export { clampString, optionalString, requireEnum };
