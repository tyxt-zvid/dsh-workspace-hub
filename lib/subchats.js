/**
 * Sub-chat service: separate continuing conversations owned by one main session.
 *
 * The durable child session, its parent catalog entry, cold resume, and
 * settlement notices belong to the shipped subagent runtime; this module adds
 * only what that runtime does not provide:
 *   - a workspace-scoped row per sub chat (title, closed state, timestamps) so a
 *     sub chat can be listed, closed, and reopened independent of the catalog,
 *   - deterministic cleanup when the owning main session is disposed or the
 *     plugin unloads,
 *   - a compact list projection for tools and the Web panel.
 */
import { randomUUID } from 'node:crypto';
import { BoardError, mutateJsonFile, readJsonFile } from './store.js';

export const SUBCHAT_SCHEMA = 'dsh-workspace-hub/subchats';
export const SUBCHAT_VERSION = 1;
const FILE = 'subchats.json';
const META_TTL_MS = 3000;
const MAX_PROMPT = 20000;
const MAX_MESSAGE = 20000;
const MAX_TITLE = 120;

/** Last non-empty assistant message of one child event suffix. */
function lastAssistantText(events) {
  let content;
  for (const event of events) {
    if (event.type === 'assistant/message') {
      const blocks = event.data?.message?.content;
      if (Array.isArray(blocks) && blocks.length > 0) content = blocks;
    }
  }
  if (content === undefined) return undefined;
  const text = content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  return text.length === 0 ? undefined : text;
}

function firstWords(text, count) {
  const words = text.trim().split(/\s+/).filter(Boolean).slice(0, count);
  return words.length === 0 ? 'Sub chat' : words.join(' ').slice(0, MAX_TITLE);
}

function normalizeRow(raw, index) {
  if (raw === null || typeof raw !== 'object') throw new BoardError('subchats-invalid', `subchat[${index}] is not an object`);
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new BoardError('subchats-invalid', `subchat[${index}].id is required`);
  }
  if (typeof raw.parentSessionId !== 'string' || raw.parentSessionId.length === 0) {
    throw new BoardError('subchats-invalid', `subchat[${index}].parentSessionId is required`);
  }
  return {
    id: raw.id,
    parentSessionId: raw.parentSessionId,
    label: typeof raw.label === 'string' ? raw.label : 'Sub chat',
    title: typeof raw.title === 'string' ? raw.title : undefined,
    status: ['provisioning', 'active', 'closed', 'failed'].includes(raw.status) ? raw.status : 'active',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
    messageId: typeof raw.messageId === 'string' ? raw.messageId : undefined,
    error: typeof raw.error === 'string' ? raw.error : undefined,
  };
}

function normalizeDocument(document) {
  if (document === undefined) return { schema: SUBCHAT_SCHEMA, version: SUBCHAT_VERSION, subchats: [] };
  if (document.schema !== undefined && document.schema !== SUBCHAT_SCHEMA) {
    throw new BoardError('subchats-invalid', `unexpected sub-chat schema ${JSON.stringify(document.schema)}`);
  }
  if (document.version !== SUBCHAT_VERSION) {
    throw new BoardError('subchats-invalid', `unsupported sub-chat version ${String(document.version)}`);
  }
  if (!Array.isArray(document.subchats)) throw new BoardError('subchats-invalid', 'sub chat file has no rows array');
  return {
    schema: SUBCHAT_SCHEMA,
    version: SUBCHAT_VERSION,
    subchats: document.subchats.map(normalizeRow),
  };
}

/** Deployment recursion budget for one child, read from the live registry. */
function maxDepth(ctx) {
  try {
    return ctx.subagents.resolveMaxDepth(undefined) ?? 1;
  } catch {
    return 1;
  }
}

export class Subchats {
  constructor(ctx, logger) {
    this.ctx = ctx;
    this.logger = logger;
    /** childId -> { at, title, lastAssistantMessage } */
    this.meta = new Map();
  }

  async rows(root) {
    return normalizeDocument(await readJsonFile(root, FILE)).subchats;
  }

  async mutate(root, operation) {
    return mutateJsonFile(root, FILE, async (document) => {
      const current = normalizeDocument(document);
      const { subchats, result } = operation(current.subchats);
      return { document: { ...current, subchats }, result };
    });
  }

  /** Refuse sub-chat ownership to anything but a root (main) session. */
  assertMainSession(agent) {
    if (agent === undefined) throw new BoardError('parent-not-live', 'no live calling session');
    const header = agent.session.header;
    if (header.origin === 'subagent' || (header.delegationDepth ?? 0) > 0) {
      throw new BoardError('not-root-session', 'sub chats may only be managed by a main (non-delegated) conversation');
    }
  }

  liveParent(parentSessionId) {
    const parent = this.ctx.get('agents')?.get(parentSessionId);
    if (parent === undefined) {
      throw new BoardError(
        'parent-not-live',
        `main session ${JSON.stringify(parentSessionId)} is not live; open that conversation before managing sub chats`,
      );
    }
    return parent;
  }

  /** Create one sub chat with its first prompt. */
  async create(root, parentAgent, input) {
    this.assertMainSession(parentAgent);
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    if (prompt.length === 0) throw new BoardError('invalid-input', 'prompt must be a non-empty string');
    if (prompt.length > MAX_PROMPT) throw new BoardError('invalid-input', `prompt must be at most ${MAX_PROMPT} characters`);
    const requestedTitle = typeof input.title === 'string' ? input.title.trim() : '';
    if (requestedTitle.length > MAX_TITLE) {
      throw new BoardError('invalid-input', `title must be at most ${MAX_TITLE} characters`);
    }
    const label = requestedTitle.length > 0 ? requestedTitle : firstWords(prompt, 8);
    const provider = this.ctx.get('subagents').getProvider('spawn');
    if (provider === undefined) throw new BoardError('provider-missing', 'sub agents provider "spawn" is not registered');
    if (provider.prepareContinuable === undefined) {
      throw new BoardError('provider-not-continuable', 'the "spawn" provider cannot create a continuing conversation');
    }
    const parentSessionId = parentAgent.session.header.id;
    const childId = `session-${randomUUID()}`;
    const now = Date.now();

    await this.mutate(root, (subchats) => ({
      subchats: [
        ...subchats,
        { id: childId, parentSessionId, label, title: label, status: 'provisioning', createdAt: now, updatedAt: now },
      ],
      result: undefined,
    }));

    let activation;
    try {
      activation = await this.ctx.get('subagents').startActivation({
        provider: 'spawn',
        childId,
        label,
        request: {
          prompt: [{ type: 'text', text: prompt }],
          parent: parentAgent,
          ...(typeof input.cwd === 'string' && input.cwd.length > 0 ? { cwd: input.cwd } : {}),
          maxDepth: input.maxDepth ?? maxDepth(this.ctx),
        },
        signal: input.signal ?? new AbortController().signal,
        delivery: 'parent',
      });
    } catch (error) {
      await this.mutate(root, (subchats) => ({
        subchats: subchats.map((row) =>
          row.id === childId
            ? { ...row, status: 'failed', updatedAt: Date.now(), error: String(error?.message ?? error) }
            : row,
        ),
        result: undefined,
      })).catch(() => {});
      throw error;
    }

    const row = await this.mutate(root, (subchats) => {
      const updated = subchats.map((entry) =>
        entry.id === childId
          ? { ...entry, status: 'active', updatedAt: Date.now(), messageId: activation.messageId ?? undefined }
          : entry,
      );
      return { subchats: updated, result: updated.find((entry) => entry.id === childId) };
    });
    return { ok: true, subchat: row };
  }

  /** Read the live-ish metadata of one child, cached briefly. */
  async childMeta(childId, force = false) {
    const cached = this.meta.get(childId);
    if (!force && cached !== undefined && Date.now() - cached.at < META_TTL_MS) return cached;
    const query = this.ctx.get('sessionQuery');
    const record = { at: Date.now(), title: undefined, lastAssistantMessage: undefined };
    if (query !== undefined) {
      let observation;
      try {
        observation = await query.observeSession(childId, { projectionMode: 'all' });
      } catch {
        this.meta.set(childId, record);
        return record;
      }
      try {
        const events = observation.events.slice(observation.inheritedEventCount ?? 0);
        record.title = observation.projections?.values?.title;
        record.lastAssistantMessage = lastAssistantText(events);
      } finally {
        try {
          observation[Symbol.dispose]?.();
        } catch {
          /* ignore */
        }
      }
    }
    this.meta.set(childId, record);
    return record;
  }

  /** List this parent's open sub chats with status and last reply. */
  async list(root, parentSessionId, options = {}) {
    const rows = (await this.rows(root)).filter(
      (row) => row.parentSessionId === parentSessionId && (options.includeClosed === true || row.status !== 'closed'),
    );
    if (rows.length === 0) return { ok: true, subchats: [] };
    let catalog = [];
    try {
      catalog = await this.ctx.get('subagents').listChildren(parentSessionId, options.signal);
    } catch {
      catalog = [];
    }
    const byId = new Map(catalog.map((entry) => [entry.id, entry]));
    const agents = this.ctx.get('agents');
    const subchats = [];
    for (const row of rows.slice(0, 50)) {
      const entry = byId.get(row.id);
      const live = agents?.get(row.id);
      const meta = await this.childMeta(row.id, live?.status === 'running');
      subchats.push({
        id: row.id,
        parentSessionId: row.parentSessionId,
        label: entry?.label ?? row.label,
        title: meta.title ?? row.title ?? row.label,
        status: row.status === 'closed' ? 'closed' : live?.status === 'running' ? 'running' : 'idle',
        registered: entry !== undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        lastAssistantMessage: meta.lastAssistantMessage,
      });
    }
    return { ok: true, subchats };
  }

  /** Open sub chats of one workspace, for the sidebar's per-row entry. */
  async catalog(root) {
    const rows = (await this.rows(root)).filter((row) => row.status !== 'closed');
    return {
      ok: true,
      subchats: rows.map((row) => ({
        id: row.id,
        parentSessionId: row.parentSessionId,
        label: row.label,
        title: row.title ?? row.label,
        status: row.status,
        updatedAt: row.updatedAt,
      })),
    };
  }

  rowFor(rows, id) {
    const row = rows.find((entry) => entry.id === id);
    if (row === undefined) throw new BoardError('unknown-subchat', `no sub chat ${JSON.stringify(id)} under this conversation`);
    return row;
  }

  /** Send one follow-up turn to a sub chat, cold-resuming it when idle. */
  async send(root, parentSessionId, input) {
    const message = typeof input.message === 'string' ? input.message.trim() : '';
    if (message.length === 0) throw new BoardError('invalid-input', 'message must be a non-empty string');
    if (message.length > MAX_MESSAGE) throw new BoardError('invalid-input', `message must be at most ${MAX_MESSAGE} characters`);
    const parent = this.liveParent(parentSessionId);
    const rows = await this.rows(root);
    const row = this.rowFor(rows, input.id);
    if (row.status === 'closed') throw new BoardError('subchat-closed', 'this sub chat is closed; reopen it before messaging');
    if (row.status === 'failed') throw new BoardError('subchat-failed', 'this sub chat failed to start; close it and create a new one');
    const content = [{ type: 'text', text: message }];
    const signal = input.signal ?? new AbortController().signal;
    // The public Remote-face method delivers a human-attributed prompt with
    // queue/steer semantics and cold-resumes an idle child. It avoids importing
    // `dsh-subagent/internal`, which a profile install can resolve to a stale
    // hoisted copy that differs from the running Host build.
    const receipt = await this.ctx.get('subagents').prompt(
      {
        requestId: randomUUID(),
        parentSessionId,
        childSessionId: row.id,
        mode: 'continuable',
        delivery: input.mode === 'steer' ? 'steer' : 'queue',
        content,
      },
      signal,
    );
    const messageId = receipt?.messageId;
    await this.mutate(root, (subchats) => ({
      subchats: subchats.map((entry) => (entry.id === row.id ? { ...entry, updatedAt: Date.now() } : entry)),
      result: undefined,
    }));
    return { ok: true, id: row.id, messageId };
  }

  /** Cancel the sub chat's current turn; the conversation stays continuable. */
  interrupt(root, parentSessionId, id) {
    this.ctx.get('subagents').interrupt(id, { kind: 'user', parentSessionId });
    return { ok: true, id, interrupted: true };
  }

  /** Stop the resident child and mark the sub chat closed. */
  async close(root, parentSessionId, id, options = {}) {
    const rows = await this.rows(root);
    const row = this.rowFor(rows, id);
    const parent = this.ctx.get('agents').get(parentSessionId);
    if (parent !== undefined) {
      try {
        await this.ctx.get('subagents').drainChildren(parent, [row.id]);
      } catch (error) {
        if (error?.code !== 'UNAUTHORIZED') {
          this.logger?.warn?.(`workspace-hub: sub chat drain failed for ${row.id}: ${String(error?.message ?? error)}`);
        }
      }
    }
    if (options.archive === true) {
      try {
        await this.ctx.get('workspaceRegistry')?.archiveSession(row.id, { stopActivity: true });
      } catch (error) {
        this.logger?.warn?.(`workspace-hub: sub chat archive failed for ${row.id}: ${String(error?.message ?? error)}`);
      }
    }
    const closed = await this.mutate(root, (subchats) => {
      const updated = subchats.map((entry) =>
        entry.id === row.id ? { ...entry, status: 'closed', updatedAt: Date.now() } : entry,
      );
      return { subchats: updated, result: updated.find((entry) => entry.id === row.id) };
    });
    return { ok: true, subchat: closed };
  }

  /** Reopen a closed sub chat; it becomes messageable again. */
  async reopen(root, parentSessionId, id) {
    const rows = await this.rows(root);
    this.rowFor(rows, id);
    try {
      await this.ctx.get('workspaceRegistry')?.unarchiveSession(id);
    } catch {
      /* the child was never archived */
    }
    const opened = await this.mutate(root, (subchats) => {
      const updated = subchats.map((entry) =>
        entry.id === id && entry.parentSessionId === parentSessionId
          ? { ...entry, status: 'active', updatedAt: Date.now() }
          : entry,
      );
      return { subchats: updated, result: updated.find((entry) => entry.id === id) };
    });
    return { ok: true, subchat: opened };
  }

  /** Parent-disposal and plugin-unload cleanup: stop this parent's resident children. */
  async releaseOwned(root, parentSessionId) {
    const rows = (await this.rows(root)).filter(
      (row) => row.parentSessionId === parentSessionId && row.status !== 'closed',
    );
    if (rows.length === 0) return;
    const parent = this.ctx.get('agents').get(parentSessionId);
    if (parent === undefined) return;
    try {
      await this.ctx.get('subagents').drainChildren(
        parent,
        rows.map((row) => row.id),
      );
    } catch (error) {
      this.logger?.warn?.(
        `workspace-hub: sub chat cleanup for ${parentSessionId} failed: ${String(error?.message ?? error)}`,
      );
    }
  }
}
