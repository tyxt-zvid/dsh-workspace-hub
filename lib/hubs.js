/**
 * Workspace Hub catalog.
 *
 * The hub is a workspace-level feature, not a Session: one dashboard panel per
 * registered workspace, opened from the main view's leading header button. No
 * Session is created for it, so it cannot be deleted like a conversation.
 *
 * Earlier revisions created a "工作区中枢" Session per workspace. `cleanupLegacy`
 * archives those Sessions and removes their mappings so the hub has no
 * conversation footprint.
 */
import { rm } from 'node:fs/promises';
import { hubFile, readJsonFile } from './store.js';

export const HUB_SCHEMA = 'dsh-workspace-hub/hub';
export const HUB_VERSION = 1;
const LEGACY_FILE = 'hub.json';

export class HubSessions {
  constructor(ctx, logger) {
    this.ctx = ctx;
    this.logger = logger;
  }

  /** Every registered workspace; the Web panel registers one dashboard each. */
  catalog() {
    const registry = this.ctx.get('workspaceRegistry');
    if (registry === undefined) return [];
    return registry.list().map((workspace) => ({
      workspaceId: workspace.id,
      title: workspace.title,
      path: workspace.path,
    }));
  }

  /** Archive Sessions created by the previous hub-as-Session design. */
  async cleanupLegacy() {
    const registry = this.ctx.get('workspaceRegistry');
    if (registry === undefined) return;
    let migrated = 0;
    for (const workspace of registry.list()) {
      let document;
      try {
        document = await readJsonFile(workspace.path, LEGACY_FILE);
      } catch {
        continue;
      }
      if (document === null || typeof document !== 'object') continue;
      const sessionId = typeof document.sessionId === 'string' ? document.sessionId : undefined;
      if (sessionId !== undefined) {
        try {
          await registry.archiveSession(sessionId, { stopActivity: true });
          migrated += 1;
        } catch (error) {
          this.logger?.warn?.(
            `workspace-hub: could not archive legacy hub session ${sessionId}: ${String(error?.message ?? error)}`,
          );
        }
      }
      try {
        await rm(hubFile(workspace.path, LEGACY_FILE), { force: true });
      } catch {
        /* best effort */
      }
    }
    if (migrated > 0) this.logger?.info?.(`workspace-hub: archived ${migrated} legacy hub session(s)`);
  }
}
