/**
 * Workspace context injection.
 *
 * The hub owns an optional `<workspace>/.dsh/workspace-hub/CONTEXT.md`. While a
 * session in that workspace is live, its content is contributed as an
 * agent-scoped system-prompt section, so every conversation in the workspace
 * (main conversations and their sub chats) shares the same context. Saving the
 * file re-registers the section for live agents; new agents pick it up on
 * creation.
 */
import { readWorkspaceContext } from './workspace-info.js';

const SECTION_NAME = 'workspace-hub:context';
const SECTION_ORDER = 9000;
const HEADER = '# Workspace context\n\n';

export class WorkspaceContextSections {
  constructor(ctx, logger) {
    this.ctx = ctx;
    this.logger = logger;
    /** sessionId -> { dispose, root } */
    this.entries = new Map();
    /** workspace root -> in-flight apply, so a burst of writes serializes. */
    this.inflight = new Map();
  }

  async apply(agent, workspaceRoot) {
    const sessionId = agent.session.header.id;
    const text = (await readWorkspaceContext(workspaceRoot))?.trim() ?? '';
    this.clear(sessionId);
    if (text.length === 0) return;
    const systemPrompt = agent.ctx.get('systemPrompt');
    if (systemPrompt === undefined) return;
    const dispose = systemPrompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      text: HEADER + text,
    });
    this.entries.set(sessionId, { dispose, root: workspaceRoot });
  }

  clear(sessionId) {
    const entry = this.entries.get(sessionId);
    if (entry === undefined) return;
    try {
      entry.dispose();
    } catch {
      /* already disposed with its agent */
    }
    this.entries.delete(sessionId);
  }

  /** Re-apply the current file to every live agent of one workspace. */
  async refresh(workspaceRoot) {
    const pending = this.inflight.get(workspaceRoot);
    if (pending !== undefined) return pending;
    const promise = (async () => {
      const agents = this.ctx.get('agents');
      if (agents === undefined) return;
      for (const agent of agents.list()) {
        const header = agent.session.header;
        if (header.cwd !== workspaceRoot) continue;
        try {
          await this.apply(agent, workspaceRoot);
        } catch (error) {
          this.logger?.warn?.(
            `workspace-hub: could not apply workspace context to ${header.id}: ${String(error?.message ?? error)}`,
          );
        }
      }
    })().finally(() => this.inflight.delete(workspaceRoot));
    this.inflight.set(workspaceRoot, promise);
    return promise;
  }

  /** Remove every section this plugin registered (plugin unload). */
  clearAll() {
    for (const sessionId of [...this.entries.keys()]) this.clear(sessionId);
  }

  /** Forget sections of agents that are gone. */
  sweep() {
    const agents = this.ctx.get('agents');
    if (agents === undefined) return;
    for (const sessionId of [...this.entries.keys()]) {
      if (agents.get(sessionId) === undefined) this.entries.delete(sessionId);
    }
  }
}
