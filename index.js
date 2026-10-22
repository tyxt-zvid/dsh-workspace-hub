/**
 * Workspace Hub — Host half.
 *
 * Two capabilities in one bundle:
 *   1. A durable task board shared by every conversation in a workspace,
 *      with dispatch to a new or existing conversation.
 *   2. Sub chats: separate continuing conversations owned by a main
 *      conversation, created and managed through the subagent runtime.
 *
 * Both surfaces are exposed as model-facing tools (`workspace_task`,
 * `subchat`) and to the bundled Web panel through an authenticated JSON route.
 */
import { WorkspaceHub, resolveBoardRoot } from './lib/hub.js';
import { Subchats } from './lib/subchats.js';
import { HubSessions } from './lib/hubs.js';
import { WorkspaceContextSections } from './lib/context-injection.js';
import { ServerRunner } from './lib/servers.js';
import { registerTools } from './lib/tools.js';
import { registerBridge } from './lib/bridge.js';

export const name = 'workspace-hub';
export const inject = ['tools', 'workingDirectory'];

const NOTICE_KIND = 'subagent-settled';

/**
 * Stop reason carried by a settlement notice, read from its summary line.
 * Undefined means the message is not a settlement notice.
 */
function noticeStopReason(message) {
  if (message === null || typeof message !== 'object') return undefined;
  if (message.source?.kind !== NOTICE_KIND) return undefined;
  const blocks = Array.isArray(message.content) ? message.content : [];
  const line = blocks.find((block) => block?.type === 'text')?.text ?? '';
  if (/finished and will do no further work|finished\. It cannot receive/.test(line)) return 'completed';
  if (/was stopped before it finished/.test(line)) return 'aborted';
  if (/ran out of room before it finished/.test(line)) return 'max-tokens';
  if (/declined the task/.test(line)) return 'refusal';
  if (/failed before it finished/.test(line)) return 'error';
  return 'abnormal';
}

/** True for a conversation the user opened, not a delegated child. */
function isMainConversation(agent) {
  const header = agent.session.header;
  return header.origin !== 'subagent' && (header.delegationDepth ?? 0) === 0;
}

export function apply(ctx) {
  const logger = ctx.logger;
  const hub = new WorkspaceHub(ctx);
  const subchats = new Subchats(ctx, logger);
  const hubs = new HubSessions(ctx, logger);
  const workspaceContext = new WorkspaceContextSections(ctx, logger);
  const servers = new ServerRunner(ctx, logger);

  // Stop every dev server this plugin started before its Host half unloads, so
  // disabling the plugin never leaves an orphan process holding a port.
  ctx.effect(() => () => servers.dispose(), 'workspace-hub: dev servers');

  ctx.effect(() => {
    void hubs
      .cleanupLegacy()
      .catch((error) => logger?.warn?.(`workspace-hub: legacy hub cleanup failed: ${String(error?.message ?? error)}`));
  }, 'workspace-hub: legacy hub sessions');

  ctx.effect(() => registerTools(ctx, { hub, subchats, servers }), 'workspace-hub: tools');

  // Sub-chat lifecycle: stop a conversation's resident sub chats when that
  // conversation's Agent is disposed. The scoped effect runs while the parent is
  // still registered, so drainChildren authorizes.
  const watched = new Map();
  const watch = (agent) => {
    if (!isMainConversation(agent)) return;
    const sessionId = agent.session.header.id;
    if (watched.has(sessionId)) return;
    const disposeDrain = agent.ctx.effect(
      () => () => async () => {
        watched.delete(sessionId);
        try {
          const resolved = await resolveBoardRoot(ctx, agent);
          await subchats.releaseOwned(resolved.root, sessionId);
        } catch (error) {
          logger?.warn?.(`workspace-hub: sub chat disposal cleanup failed for ${sessionId}: ${String(error?.message ?? error)}`);
        }
      },
      'workspace-hub: sub chat parent disposal',
    );
    // need-to-know: a plain sub-chat completion must not wake the main
    // conversation or enter its context. Failures and interrupted runs stay.
    const disposeNotices = agent.ctx.effect(
      () =>
        agent.ctx.on('agent/pre-step', async (payload, next) => {
          const claimed = Array.isArray(payload.messages) ? payload.messages : [];
          const completed = claimed.filter((message) => noticeStopReason(message) === 'completed');
          if (completed.length === 0) return next();
          const decision = await next();
          if (decision.kind !== 'enter') return decision;
          if (claimed.every((message) => noticeStopReason(message) === 'completed')) {
            // The only reason this turn started was a quiet completion.
            return { kind: 'enter', messages: [] };
          }
          return {
            ...decision,
            messages: decision.messages.filter((message) => noticeStopReason(message) !== 'completed'),
          };
        }),
      'workspace-hub: need-to-know notices',
    );
    watched.set(sessionId, [disposeDrain, disposeNotices]);
  };
  const applyWorkspaceContext = async (agent) => {
    try {
      const resolved = await resolveBoardRoot(ctx, agent);
      await workspaceContext.apply(agent, resolved.root);
    } catch (error) {
      logger?.warn?.(
        `workspace-hub: workspace context unavailable for ${agent.session.header.id}: ${String(error?.message ?? error)}`,
      );
    }
  };
  ctx.on('agent/created', (payload) => {
    watch(payload.agent);
    void applyWorkspaceContext(payload.agent);
  });
  ctx.on('agent/disposed', (payload) => workspaceContext.clear(payload.agent.session.header.id));
  for (const agent of ctx.get('agents')?.list() ?? []) {
    watch(agent);
    void applyWorkspaceContext(agent);
  }
  ctx.effect(
    () => () => {
      workspaceContext.clearAll();
      for (const disposers of watched.values()) {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch {
            /* already disposed */
          }
        }
      }
      watched.clear();
    },
    'workspace-hub: parent watchers',
  );

  // Plugin unload: withdraw injected workspace context sections and stop resident
  // sub chats under still-live main conversations so
  // disabling the plugin does not leave orphans running.
  ctx.effect(
    () => () => {
      const live = (ctx.get('agents')?.list() ?? []).filter(isMainConversation);
      return Promise.allSettled(
        live.map(async (agent) => {
          const resolved = await resolveBoardRoot(ctx, agent);
          await subchats.releaseOwned(resolved.root, agent.session.header.id);
        }),
      );
    },
    'workspace-hub: unload cleanup',
  );

  // Web panel bridge. It is optional: without a Web server and the Connection
  // service the tools still work.
  ctx.inject(['webServer', 'connection'], (bridgeCtx) => {
    bridgeCtx.effect(
      () => registerBridge(bridgeCtx, { hub, subchats, hubs, logger, workspaceContext, servers }),
      'workspace-hub: panel bridge',
    );
  });
}
