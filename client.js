/**
 * Workspace Hub — Client half.
 *
 * Registers a global sidebar entry and its main panel. The panel reads and writes
 * the Host board through one authenticated same-origin JSON route; it imports no
 * Harness Client package, only React from the platform module table.
 *
 * The panel is a keyboard-first console: one hub.snapshot poll feeds overview,
 * tasks, conversations and environment; writes are optimistic per row; deletes
 * are undoable; view state is remembered per workspace.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-workspace-hub',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'workspace-hub';
    const PANEL_ID = 'workspace-hub';
    const API = '/workspace-hub/api/';

    const DICT = {
      en: {
        'panel.title': 'Workspace Hub',
        'panel.noWorkspace': 'Open a workspace conversation to use the Workspace Hub.',
        'panel.untitledWorkspace': 'Untitled workspace',
        'panel.allTitle': 'All workspaces',
        'panel.allSubtitle': '{n} workspaces',
        'header.allWorkspaces': 'All workspaces',
        'header.backToAll': 'Back to all workspaces',
        'overview.workspaces': 'Workspaces',
        'overview.sessionCount': '{running}/{total} sessions',
        'overview.serverCount': '{ready}/{total} ready',
        'overview.user': 'You',
        'all.empty': 'No workspaces are registered yet.',
        'all.emptySub': 'Open or create a workspace conversation, then come back to the hub.',
        'all.boardUnreadable': 'Task board unreadable',
        'all.error': 'The workspace overview could not be read.',
        'all.errorSub': 'Check the connection or permissions, then retry.',
        'all.retry': 'Retry',
        'all.attention': 'Needs you',
        'all.attentionHint': 'Blocked, stalled, pending and environment issues; unread sub-chats inside a workspace',
        'all.noAttention': 'Nothing needs you across workspaces.',
        'all.running': 'Running now',
        'all.runningHint': 'Active runs across every workspace',
        'all.noRunning': 'No work is running across workspaces.',
        'all.workspaces': 'Workspaces',
        'all.stale': 'Sync lost · showing data from {time}',
        'palette.allWorkspaces': 'All workspaces',
        'panel.loading': 'Loading…',
        'panel.error': 'The workspace data could not be read.',
        'panel.errorSub': 'Check the connection or the workspace permissions, then retry. Nothing was changed.',
        'panel.reload': 'Reload',
        'workspace.missing': 'not created',
        'env.noStartable': 'No server to start right now',
        'tasks.updatedAgo': 'Updated {time}',
        'servers.pill': 'Servers',
        'servers.pillReady': '{ready}/{total} ready',
        'servers.pillHint': 'Workspace dev servers — open the environment panel',
        'servers.unreachable': 'Status unavailable: {message}',
        'sidebar.subchats': 'Sub chats',
        'sidebar.subchats.count': '{n} sub chats',
        'sidebar.board': 'Workspace hub',
        'sidebar.boardShort': 'Hub',
        'menu.title': 'Sub chats',
        'menu.empty': 'No open sub chats.',
        'menu.open': 'Open',
        'header.pathCopy': 'Copy workspace path',
        'header.copied': 'Path copied',
        'header.sync': 'Updated {time}',
        'header.syncWaiting': 'Not synced yet',
        'header.syncStale': 'Sync lost · Retry',
        'header.syncHint': 'Updated {time} · click to refresh',
        'header.syncStaleHint': 'Sync interrupted · showing last good data · click to retry',
        'header.palette': 'Command palette (⌘K)',
        'header.settings': 'Workspace settings',
        'header.workspaceMenu': 'Switch workspace',
        'header.currentWorkspace': 'Current',
        'nav.overview': 'Overview',
        'nav.tasks': 'Tasks',
        'nav.sessions': 'Conversations',
        'strip.doing': 'Doing',
        'strip.todo': 'To do',
        'strip.blocked': 'Blocked',
        'strip.env': 'Environments',
        'strip.updated': 'Updated {time}',
        'strip.stale': 'Sync lost · showing data from {time}',
        'strip.retry': 'Retry',
        'strip.envValue': '{ready}/{total}',
        'status.todo': 'To do',
        'status.doing': 'Doing',
        'status.blocked': 'Blocked',
        'status.done': 'Done',
        'status.cancelled': 'Cancelled',
        'overview.attention': 'Needs you',
        'overview.attentionEmpty': 'Nothing needs you right now.',
        'overview.attentionEmptySub': 'Blocked tasks, stalled runs and unread sub chats show up here.',
        'overview.running': 'Running now',
        'overview.runningEmpty': 'No running work.',
        'overview.runningEmptySub': 'Dispatch a task to a conversation and the run shows up here.',
        'overview.runningCount': '{n} active',
        'overview.env': 'Environments',
        'overview.envEmpty': 'No servers declared for this workspace.',
        'overview.envEmptySub': 'Auto-detection is off. Declare servers in .dsh/workspace-hub/servers.json to start them here.',
        'overview.viewAll': 'View all tasks',
        'overview.viewAllEnv': 'All environments',
        'overview.viewSessions': 'View conversations',
        'overview.readyCount': '{ready}/{total} ready',
        'attn.blockedReason': 'Blocked · waiting on a decision',
        'attn.stuckReason': 'Possibly stuck · owner idle for {time}',
        'attn.settledReason': 'Run ended · task is still open',
        'attn.unreadReason': 'Unread sub chat · {title} has new replies',
        'attn.highReason': 'High priority · nobody owns it',
        'attn.serverReason': 'Environment · {state}',
        'attn.openTask': 'Open task',
        'attn.requeue': 'Requeue',
        'attn.confirm': 'Complete',
        'attn.claim': 'Assign to me',
        'attn.view': 'View',
        'attn.logs': 'View logs',
        'tasks.new': 'New task',
        'tasks.capturePlaceholder': 'Add a task — Enter to create · Tab for details',
        'tasks.captureHint': 'Enter to create · Tab for details · Esc to leave',
        'tasks.captureDetailPlaceholder': 'Optional details, links, acceptance criteria…',
        'tasks.priorityLabel': 'Priority',
        'tasks.create': 'Create',
        'tasks.empty': 'No tasks yet',
        'tasks.emptySub': 'Write down the first thing this workspace needs, or start from a template.',
        'tasks.emptyFilter': 'No tasks match this filter.',
        'tasks.emptyFilterTitle': 'No “{filter}” tasks',
        'tasks.emptyFilterSub': 'Change the filter, or clear the search to see everything.',
        'tasks.emptySearchTitle': 'No tasks matching “{q}”',
        'tasks.emptySearchSub': 'Try another keyword, or clear the search.',
        'tasks.filter.all': 'All',
        'tasks.filter.todo': 'To do',
        'tasks.filter.doing': 'Doing',
        'tasks.filter.blocked': 'Blocked',
        'tasks.filter.done': 'Done',
        'tasks.filter.cancelled': 'Cancelled',
        'tasks.priority.low': 'Low',
        'tasks.priority.normal': 'Normal',
        'tasks.priority.high': 'High',
        'tasks.group.status': 'Group: status',
        'tasks.group.priority': 'Group: priority',
        'tasks.group.none': 'No groups',
        'tasks.group.done': 'Done · {n} items',
        'tasks.searchPlaceholder': 'Search tasks…',
        'tasks.template1': 'Triage this repository’s to-dos',
        'tasks.template2': 'Fix a bug',
        'tasks.template3': 'Write a README',
        'tasks.claim': 'Assign to me',
        'tasks.claimHint': 'Open a conversation first to own a task',
        'tasks.release': 'Requeue',
        'tasks.done': 'Complete',
        'tasks.reopen': 'Reopen',
        'tasks.dispatch': 'Dispatch',
        'tasks.delete': 'Delete',
        'tasks.edit': 'Edit',
        'tasks.more': 'More actions',
        'tasks.copyLink': 'Copy link',
        'tasks.linkCopied': 'Task link copied',
        'tasks.markBlocked': 'Mark blocked',
        'tasks.cancelTask': 'Cancel task',
        'tasks.markDone': 'Mark complete: {title}',
        'tasks.markReopen': 'Reopen task: {title}',
        'tasks.openSession': 'Open conversation',
        'tasks.interrupt': 'Interrupt',
        'tasks.running': 'Running',
        'tasks.elapsed': 'running {time}',
        'tasks.activity': 'Latest: {activity}',
        'tasks.noActivity': 'No activity yet',
        'tasks.owner.you': 'You',
        'tasks.owner.unassigned': 'Unassigned',
        'tasks.owner.pending': 'Waiting for the conversation…',
        'tasks.owner.assigned': 'Assigned',
        'tasks.executor': 'Owner',
        'tasks.detailPlaceholder': 'Details, links, acceptance criteria…',
        'tasks.editTitle': 'Edit task title',
        'tasks.editDetail': 'Edit task details',
        'tasks.notePlaceholder': 'Append a note…',
        'tasks.addNote': 'Add note',
        'tasks.noteAdded': 'Note added',
        'tasks.notes': 'Notes',
        'tasks.noNotes': 'No notes yet.',
        'tasks.saving': 'Saving…',
        'tasks.saved': 'Saved',
        'tasks.conflictShort': 'Conflict',
        'tasks.conflictTitle': 'This task was just updated',
        'tasks.conflictToast': 'This task changed elsewhere. The row now shows the latest version.',
        'tasks.conflictSub': 'You edited an older version of “{title}”.',
        'tasks.conflictAccept': 'Accept latest',
        'tasks.conflictRetry': 'Retry my change',
        'tasks.deletedToast': 'Deleted “{title}”',
        'tasks.deleted': 'Deleted',
        'tasks.restoredToast': 'Task restored',
        'tasks.undo': 'Undo',
        'tasks.undoFailed': 'Could not undo — the task no longer exists',
        'tasks.completedToast': 'Completed “{title}”',
        'tasks.reopenedToast': 'Reopened “{title}”',
        'tasks.claimedToast': 'Assigned “{title}” to you',
        'tasks.requeuedToast': 'Requeued “{title}”',
        'tasks.blockedToast': 'Marked “{title}” blocked',
        'tasks.cancelledToast': 'Cancelled “{title}”',
        'tasks.interruptedToast': 'Interrupted the run · task went back to the queue',
        'tasks.updatedToast': 'Updated “{title}”',
        'tasks.createdToast': 'Created “{title}”',
        'tasks.actionFailed': 'Task action failed: {message}',
        'tasks.dispatchDone': 'Dispatched to “{session}”',
        'tasks.dispatchView': 'View',
        'sessions.empty': 'No conversations in this workspace yet.',
        'sessions.emptyFilter': 'No conversations match this filter.',
        'sessions.untitled': 'Untitled conversation',
        'sessions.current': 'Current',
        'sessions.orphanParent': 'Parent conversation not listed',
        'sessions.running': 'Running',
        'sessions.idle': 'Idle',
        'sessions.filter.all': 'All',
        'sessions.filter.running': 'Running',
        'sessions.filter.idle': 'Idle',
        'sessions.filter.unread': 'Unread',
        'sessions.searchPlaceholder': 'Search conversations…',
        'sessions.showClosed': 'Show closed',
        'sessions.newSubchat': 'New sub chat',
        'sessions.subchatCount': '{n} sub chats',
        'sessions.relatedTasks': '{n} tasks',
        'sessions.open': 'Open',
        'sessions.noSubchats': 'No sub chats yet.',
        'sessions.noReply': 'No reply yet',
        'sessions.unreadBadge': '{n} unread',
        'sessions.unreadCount': '{n} unread sub chats',
        'sessions.send': 'Send',
        'sessions.sendPlaceholder': 'Message… (Enter to send, Shift+Enter for newline)',
        'sessions.sent': 'Sent to “{title}”',
        'sessions.sendFailed': 'Could not send: {message}',
        'sessions.closedToast': 'Closed “{title}”',
        'sessions.reopenedToast': 'Reopened “{title}”',
        'sessions.interruptedToast': 'Interrupted “{title}”',
        'sessions.actionFailed': 'Conversation action failed: {message}',
        'sessions.needLive': 'Open a conversation first to start a sub chat',
        'sessions.newSubchatTitle': 'Sub chat name (optional)',
        'sessions.newSubchatPrompt': 'What should this sub chat work on?',
        'sessions.createSubchat': 'Start sub chat',
        'sessions.createdToast': 'Started sub chat “{title}”',
        'sessions.createFailed': 'Could not start the sub chat: {message}',
        'sessions.hint': '{n} open sub chats',
        'subchats.status.running': 'running',
        'subchats.status.idle': 'idle',
        'subchats.status.closed': 'closed',
        'subchats.status.provisioning': 'starting',
        'subchats.status.active': 'idle',
        'subchats.status.failed': 'failed',
        'subchats.status.open': 'open',
        'subchats.interrupt': 'Interrupt',
        'subchats.close': 'Close',
        'subchats.reopen': 'Reopen',
        'subchats.newShort': 'New sub chat',
        'subchats.titlePlaceholder': 'Short name (optional)',
        'subchats.promptPlaceholder': 'What should this sub chat work on?',
        'subchats.create': 'Start sub chat',
        'subchats.cancel': 'Cancel',
        'env.title': 'Environments',
        'env.none': 'No servers declared for this workspace.',
        'env.noneHint': 'Auto-detection is off. Declare servers in .dsh/workspace-hub/servers.json.',
        'env.configuredHint': 'Declared in .dsh/workspace-hub/servers.json',
        'env.autoHint': 'Auto-detected from package.json; declare .dsh/workspace-hub/servers.json to override',
        'env.phase.ready': 'Ready',
        'env.phase.starting': 'Starting',
        'env.phase.stopped': 'Stopped',
        'env.phase.failed': 'Failed',
        'env.phase.external': 'External',
        'env.start': 'Start',
        'env.stop': 'Stop',
        'env.open': 'Open',
        'env.stopping': 'Stopping…',
        'env.starting': 'Starting…',
        'env.startingFor': 'Starting · {time}',
        'env.startedToast': 'Started “{name}”',
        'env.stoppedToast': 'Stopped “{name}”',
        'env.actionFailed': 'Server action failed: {message}',
        'env.busyHint': 'This server is already starting; other rows stay usable',
        'env.notReadyHint': 'Server is not ready yet',
        'env.noUrl': 'No URL',
        'env.logs': 'Logs',
        'env.readyCount': '{ready}/{total} ready',
        'env.errorLine': 'Last error: {message}',
        'env.popTitle': 'Environments',
        'env.popFoot': 'Open the overview environment section',
        'env.startHint': 'Start this dev server',
        'env.stopHint': 'Stop the process the hub started',
        'env.openHint': 'Open {url} in a new tab',
        'env.externalHint': 'Started outside the hub; the hub will not stop it',
        'settings.back': 'Workspace hub',
        'settings.title': 'Workspace settings',
        'settings.sub': 'Applies to this workspace · saved immediately · read on the next turn',
        'settings.projectRoot': 'Project root',
        'settings.rules': 'Rule chain',
        'settings.rulesHint': 'Applied in inheritance order · {n} layers',
        'settings.globalRules': 'User global',
        'settings.projectRules': 'Project / workspace',
        'settings.workspaceRules': 'Workspace AGENTS.md',
        'settings.rulesFileHint': 'Saved to the workspace AGENTS.md; the framework re-reads it on the next request or session resume.',
        'settings.unsaved': 'You have unsaved changes',
        'settings.discard': 'Discard',
        'settings.noEditableRule': 'No editable AGENTS.md at the project root; the editor is hidden.',
        'sessions.expand': 'Expand sub chats',
        'sessions.collapse': 'Collapse sub chats',
        'settings.context': 'Context',
        'settings.contextHint': 'CONTEXT.md · {n} B',
        'settings.contextEffect': 'Injected into conversations in this directory only; live conversations pick it up on their next turn.',
        'settings.contextPlaceholder': 'Shared instructions or background every session in this workspace should know…',
        'settings.skills': 'Skills',
        'settings.skillsHint': '{n} available',
        'settings.skillsEmpty': 'No skills are visible to this workspace.',
        'settings.skillSearch': 'Search skills…',
        'settings.newSkill': 'New skill',
        'settings.rulesEmpty': 'No instruction files found.',
        'settings.readOnly': 'Read-only',
        'settings.editable': 'Editable',
        'settings.dirty': 'Unsaved changes',
        'settings.saving': 'Saving…',
        'settings.saved': 'Saved · just now',
        'settings.saveRules': 'Save rules',
        'settings.saveContext': 'Save context',
        'settings.createSkill': 'Create skill',
        'settings.saveRulesDone': 'Workspace AGENTS.md saved.',
        'settings.saveContextDone': 'Workspace context saved.',
        'settings.skillCreated': 'Skill created.',
        'settings.saveFailed': 'Could not save: {message}',
        'settings.loadFailed': 'Could not read workspace settings: {message}',
        'settings.skillName': 'skill-name (kebab-case)',
        'settings.skillDescription': 'One-line description',
        'settings.skillBody': 'Skill instructions…',
        'settings.skillSource.user': 'user',
        'settings.skillSource.project': 'workspace',
        'settings.skillSource.bundled': 'built-in',
        'settings.skillSource.custom': 'custom',
        'settings.skillSource.unknown': 'other',
        'settings.modelOnly': 'model',
        'settings.userOnly': 'user',
        'settings.retry': 'Retry',
        'settings.kbdSave': '⌘S to save all changes',
        'dispatch.title': 'Dispatch “{title}”',
        'dispatch.sub': 'A conversation will execute it, receive the task details, and write the result back to the task.',
        'dispatch.target': 'Who executes it?',
        'dispatch.new': 'New conversation',
        'dispatch.newSub': 'Start a new conversation in this workspace',
        'dispatch.existing': 'Existing conversation',
        'dispatch.existingSub': 'Pick a recent conversation; the task is written back when it finishes',
        'dispatch.selectExisting': 'Choose an existing conversation',
        'dispatch.note': 'Extra instructions (optional)',
        'dispatch.notePlaceholder': 'Which scenarios should it verify first?',
        'dispatch.openAfter': 'Open the conversation after dispatch',
        'dispatch.cancel': 'Cancel',
        'dispatch.send': 'Dispatch',
        'dispatch.sending': 'Dispatching…',
        'dispatch.hint': '1/2 choose · Enter dispatch · Esc close',
        'dispatch.needExisting': 'Choose an existing conversation first',
        'dispatch.needSession': 'Open a conversation first to dispatch to an existing one',
        'dispatch.failed': 'Dispatch failed: {message}',
        'palette.label': 'Command palette',
        'palette.placeholder': 'Type a command, or search tasks and conversations…',
        'palette.results': 'Command results',
        'palette.actions': 'Actions',
        'palette.tasks': 'Tasks',
        'palette.sessions': 'Conversations',
        'palette.workspaces': 'Workspaces',
        'palette.empty': 'Nothing found for “{q}”. Try “dispatch” or a task title.',
        'palette.newTask': 'New task',
        'palette.newSubchat': 'New sub chat',
        'palette.needSession': 'open a conversation first',
        'palette.startServer': 'Start a server',
        'palette.openSettings': 'Open settings',
        'palette.refresh': 'Refresh data',
        'palette.refreshed': 'Refreshed · just now',
        'palette.switchWorkspace': 'Switch workspace',
        'palette.select': 'select',
        'palette.run': 'run',
        'palette.close': 'close',
        'keys.new': 'new',
        'keys.search': 'search',
        'keys.command': 'command',
        'tasks.activity2': 'Latest activity',
        'time.now': 'just now',
        'time.minute': '{n}m ago',
        'time.hour': '{n}h ago',
        'time.day': '{n}d ago',
        'time.shortSec': '{n}s',
        'time.shortMin': '{n}m',
        'common.retry': 'Retry',
        'common.cancel': 'Cancel',
        'common.close': 'Close',
        'common.delete': 'Delete',
        'common.failed': 'Action failed',
      },
      zh: {
        'panel.title': '工作区中枢',
        'panel.noWorkspace': '请先打开一个工作区会话，再使用工作区中枢。',
        'panel.untitledWorkspace': '未命名工作区',
        'panel.allTitle': '所有工作区',
        'panel.allSubtitle': '{n} 个工作区',
        'header.allWorkspaces': '所有工作区',
        'header.backToAll': '返回所有工作区',
        'overview.workspaces': '工作区',
        'overview.sessionCount': '{running}/{total} 个会话',
        'overview.serverCount': '{ready}/{total} 就绪',
        'overview.user': '你',
        'all.empty': '还没有注册工作区。',
        'all.emptySub': '打开或新建一个工作区会话，再回到中枢。',
        'all.boardUnreadable': '任务板无法读取',
        'all.error': '无法读取工作区总览。',
        'all.errorSub': '检查连接或权限后重试。',
        'all.retry': '重试',
        'all.attention': '需要你处理',
        'all.attentionHint': '所有工作区的阻塞、卡住、待确认与环境异常；子会话未读进入工作区查看',
        'all.noAttention': '所有工作区都没有需要你处理的事项。',
        'all.running': '正在运行',
        'all.runningHint': '所有工作区中正在执行的任务',
        'all.noRunning': '所有工作区都没有正在执行的任务。',
        'all.workspaces': '工作区',
        'all.stale': '同步中断 · 显示 {time}前的数据',
        'palette.allWorkspaces': '所有工作区',
        'panel.loading': '加载中…',
        'panel.error': '无法读取工作区数据。',
        'panel.errorSub': '检查连接或工作区权限后重试；没有任何改动被提交。',
        'panel.reload': '重新加载',
        'workspace.missing': '未创建',
        'env.noStartable': '当前没有可启动的服务器',
        'tasks.updatedAgo': '更新于 {time}',
        'servers.pill': '服务器',
        'servers.pillReady': '{ready}/{total} 就绪',
        'servers.pillHint': '工作区开发服务器 · 打开环境面板',
        'servers.unreachable': '状态读取失败：{message}',
        'sidebar.subchats': '子会话',
        'sidebar.subchats.count': '{n} 个子会话',
        'sidebar.board': '工作区中枢',
        'sidebar.boardShort': '中枢',
        'menu.title': '子会话',
        'menu.empty': '没有打开的子会话。',
        'menu.open': '打开',
        'header.pathCopy': '复制工作区路径',
        'header.copied': '已复制路径',
        'header.sync': '更新于 {time}',
        'header.syncWaiting': '尚未同步',
        'header.syncStale': '同步中断 · 重试',
        'header.syncHint': '更新于 {time} · 点击刷新',
        'header.syncStaleHint': '同步中断 · 当前显示最近一次成功的数据 · 点击重试',
        'header.palette': '命令面板（⌘K）',
        'header.settings': '工作区设置',
        'header.workspaceMenu': '切换工作区',
        'header.currentWorkspace': '当前',
        'nav.overview': '概览',
        'nav.tasks': '任务',
        'nav.sessions': '对话',
        'strip.doing': '进行中',
        'strip.todo': '待办',
        'strip.blocked': '阻塞',
        'strip.env': '环境',
        'strip.updated': '更新于 {time}',
        'strip.stale': '同步中断 · 显示 {time}前的数据',
        'strip.retry': '重试',
        'strip.envValue': '{ready}/{total}',
        'status.todo': '待办',
        'status.doing': '进行中',
        'status.blocked': '阻塞',
        'status.done': '已完成',
        'status.cancelled': '已取消',
        'overview.attention': '需要你处理',
        'overview.attentionEmpty': '现在没有需要你处理的事项。',
        'overview.attentionEmptySub': '阻塞任务、卡住的执行、未读子会话会出现在这里。',
        'overview.running': '正在运行',
        'overview.runningEmpty': '现在没有运行中的执行。',
        'overview.runningEmptySub': '把任务派发给会话后，执行会出现在这里。',
        'overview.runningCount': '{n} 个执行',
        'overview.env': '环境',
        'overview.envEmpty': '这个工作区还没有声明服务器。',
        'overview.envEmptySub': '自动识别已关闭。在 .dsh/workspace-hub/servers.json 声明后即可在这里启动。',
        'overview.viewAll': '查看全部任务',
        'overview.viewAllEnv': '全部环境',
        'overview.viewSessions': '查看对话',
        'overview.readyCount': '{ready}/{total} 就绪',
        'attn.blockedReason': '阻塞 · 等待一个决定',
        'attn.stuckReason': '可能卡住 · 执行者已空闲 {time}',
        'attn.settledReason': '执行结束 · 任务仍未完成',
        'attn.unreadReason': '子会话未读 · {title} 有新回复',
        'attn.highReason': '高优先级 · 无人认领',
        'attn.serverReason': '环境 · {state}',
        'attn.openTask': '打开任务',
        'attn.requeue': '放回队列',
        'attn.confirm': '确认完成',
        'attn.claim': '我来做',
        'attn.view': '查看',
        'attn.logs': '查看日志',
        'tasks.new': '新建任务',
        'tasks.capturePlaceholder': '记一条任务，Enter 创建 · Tab 补充详情',
        'tasks.captureHint': 'Enter 创建 · Tab 补充详情 · Esc 离开',
        'tasks.captureDetailPlaceholder': '可选：细节、链接、验收标准…',
        'tasks.priorityLabel': '优先级',
        'tasks.create': '创建',
        'tasks.empty': '还没有任务',
        'tasks.emptySub': '记下这个工作区要做的第一件事，或从模板开始。',
        'tasks.emptyFilter': '没有符合筛选条件的任务。',
        'tasks.emptyFilterTitle': '没有「{filter}」的任务',
        'tasks.emptyFilterSub': '换个筛选，或清空搜索后查看全部任务。',
        'tasks.emptySearchTitle': '没有匹配「{q}」的任务',
        'tasks.emptySearchSub': '换个关键词，或清空搜索后查看全部任务。',
        'tasks.filter.all': '全部',
        'tasks.filter.todo': '待办',
        'tasks.filter.doing': '进行中',
        'tasks.filter.blocked': '阻塞',
        'tasks.filter.done': '已完成',
        'tasks.filter.cancelled': '已取消',
        'tasks.priority.low': '低',
        'tasks.priority.normal': '普通',
        'tasks.priority.high': '高',
        'tasks.group.status': '分组：状态',
        'tasks.group.priority': '分组：优先级',
        'tasks.group.none': '不分组',
        'tasks.group.done': '已完成 {n} 项',
        'tasks.searchPlaceholder': '搜索任务…',
        'tasks.template1': '梳理这个仓库的待办',
        'tasks.template2': '修一个 bug',
        'tasks.template3': '写一份 README',
        'tasks.claim': '我来做',
        'tasks.claimHint': '先打开一个对话，才能把任务指派给自己',
        'tasks.release': '放回队列',
        'tasks.done': '完成',
        'tasks.reopen': '重开',
        'tasks.dispatch': '派发',
        'tasks.delete': '删除',
        'tasks.edit': '编辑',
        'tasks.more': '更多操作',
        'tasks.copyLink': '复制链接',
        'tasks.linkCopied': '已复制任务链接',
        'tasks.markBlocked': '标为阻塞',
        'tasks.cancelTask': '取消任务',
        'tasks.markDone': '标记完成：{title}',
        'tasks.markReopen': '重开任务：{title}',
        'tasks.openSession': '打开会话',
        'tasks.interrupt': '中断',
        'tasks.running': '执行中',
        'tasks.elapsed': '已运行 {time}',
        'tasks.activity': '最近活动 {activity}',
        'tasks.noActivity': '暂无活动',
        'tasks.owner.you': '你',
        'tasks.owner.unassigned': '无人',
        'tasks.owner.pending': '等待会话…',
        'tasks.owner.assigned': '已派发',
        'tasks.executor': '执行者',
        'tasks.detailPlaceholder': '详情、链接、验收标准…',
        'tasks.editTitle': '编辑任务标题',
        'tasks.editDetail': '编辑任务详情',
        'tasks.notePlaceholder': '追加一条备注…',
        'tasks.addNote': '添加备注',
        'tasks.noteAdded': '已添加备注',
        'tasks.notes': '备注',
        'tasks.noNotes': '还没有备注。',
        'tasks.saving': '保存中…',
        'tasks.saved': '已保存',
        'tasks.conflictShort': '有冲突',
        'tasks.conflictTitle': '这条任务刚被更新',
        'tasks.conflictToast': '任务在别处被更新，行内已显示最新版本。',
        'tasks.conflictSub': '你基于旧版本修改了「{title}」。',
        'tasks.conflictAccept': '采用最新',
        'tasks.conflictRetry': '重试我的修改',
        'tasks.deletedToast': '已删除「{title}」',
        'tasks.deleted': '已删除',
        'tasks.restoredToast': '已恢复任务',
        'tasks.undo': '撤销',
        'tasks.undoFailed': '任务已不存在 · 无法撤销',
        'tasks.completedToast': '已完成「{title}」',
        'tasks.reopenedToast': '已重开「{title}」',
        'tasks.claimedToast': '已把「{title}」指派给你',
        'tasks.requeuedToast': '已放回队列「{title}」',
        'tasks.blockedToast': '已把「{title}」标为阻塞',
        'tasks.cancelledToast': '已取消「{title}」',
        'tasks.interruptedToast': '已中断执行 · 任务已放回队列',
        'tasks.updatedToast': '已更新「{title}」',
        'tasks.createdToast': '已创建「{title}」',
        'tasks.actionFailed': '任务操作失败：{message}',
        'tasks.dispatchDone': '已派发给「{session}」',
        'tasks.dispatchView': '查看',
        'sessions.empty': '这个工作区还没有会话。',
        'sessions.emptyFilter': '没有符合筛选条件的会话。',
        'sessions.untitled': '未命名会话',
        'sessions.current': '当前',
        'sessions.orphanParent': '父会话不在列表中',
        'sessions.running': '运行中',
        'sessions.idle': '空闲',
        'sessions.filter.all': '全部',
        'sessions.filter.running': '运行中',
        'sessions.filter.idle': '空闲',
        'sessions.filter.unread': '有未读',
        'sessions.searchPlaceholder': '搜索会话…',
        'sessions.showClosed': '显示已关闭',
        'sessions.newSubchat': '新建子会话',
        'sessions.subchatCount': '{n} 个子会话',
        'sessions.relatedTasks': '{n} 个任务',
        'sessions.open': '打开',
        'sessions.noSubchats': '还没有子会话。',
        'sessions.noReply': '还没有回复',
        'sessions.unreadBadge': '未读 {n}',
        'sessions.unreadCount': '{n} 个子会话未读',
        'sessions.send': '发送',
        'sessions.sendPlaceholder': '发消息…（Enter 发送，Shift+Enter 换行）',
        'sessions.sent': '已发送到「{title}」',
        'sessions.sendFailed': '发送失败：{message}',
        'sessions.closedToast': '已关闭「{title}」',
        'sessions.reopenedToast': '已重新打开「{title}」',
        'sessions.interruptedToast': '已中断「{title}」',
        'sessions.actionFailed': '会话操作失败：{message}',
        'sessions.needLive': '先打开一个对话，才能新建子会话',
        'sessions.newSubchatTitle': '子会话名称（可选）',
        'sessions.newSubchatPrompt': '这个子会话要做什么？',
        'sessions.createSubchat': '创建子会话',
        'sessions.createdToast': '已创建子会话「{title}」',
        'sessions.createFailed': '创建子会话失败：{message}',
        'sessions.hint': '{n} 个子会话',
        'subchats.status.running': '运行中',
        'subchats.status.idle': '空闲',
        'subchats.status.closed': '已关闭',
        'subchats.status.provisioning': '启动中',
        'subchats.status.active': '空闲',
        'subchats.status.failed': '失败',
        'subchats.status.open': '打开',
        'subchats.interrupt': '中断',
        'subchats.close': '关闭',
        'subchats.reopen': '重开',
        'subchats.newShort': '新建子会话',
        'subchats.titlePlaceholder': '简短名称（可选）',
        'subchats.promptPlaceholder': '这个子会话要做什么？',
        'subchats.create': '创建子会话',
        'subchats.cancel': '取消',
        'env.title': '环境',
        'env.none': '这个工作区还没有声明服务器。',
        'env.noneHint': '自动识别已关闭。在 .dsh/workspace-hub/servers.json 声明服务器。',
        'env.configuredHint': '声明在 .dsh/workspace-hub/servers.json',
        'env.autoHint': '从 package.json 自动识别；写 .dsh/workspace-hub/servers.json 可覆盖',
        'env.phase.ready': '已就绪',
        'env.phase.starting': '启动中',
        'env.phase.stopped': '已停止',
        'env.phase.failed': '启动失败',
        'env.phase.external': '外部运行',
        'env.start': '启动',
        'env.stop': '停止',
        'env.open': '打开',
        'env.stopping': '停止中…',
        'env.starting': '启动中…',
        'env.startingFor': '启动中 · {time}',
        'env.startedToast': '已启动「{name}」',
        'env.stoppedToast': '已停止「{name}」',
        'env.actionFailed': '服务器操作失败：{message}',
        'env.busyHint': '这台服务器正在启动，其余行仍然可用',
        'env.notReadyHint': '服务器尚未就绪',
        'env.noUrl': '未配置地址',
        'env.logs': '日志',
        'env.readyCount': '{ready}/{total} 就绪',
        'env.errorLine': '最近错误：{message}',
        'env.popTitle': '环境',
        'env.popFoot': '在概览中查看环境',
        'env.startHint': '启动这台开发服务器',
        'env.stopHint': '停止中枢启动的进程',
        'env.openHint': '在新标签页打开 {url}',
        'env.externalHint': '由中枢之外启动，中枢不会停止它',
        'settings.back': '工作区中枢',
        'settings.title': '工作区设置',
        'settings.sub': '仅当前工作区生效 · 保存自动生效 · 下一轮会话读取',
        'settings.projectRoot': '项目根目录',
        'settings.rules': '规则链',
        'settings.rulesHint': '按继承顺序生效 · 共 {n} 层',
        'settings.globalRules': '用户全局',
        'settings.projectRules': '项目 / 工作区',
        'settings.workspaceRules': '工作区 AGENTS.md',
        'settings.rulesFileHint': '保存到工作区 AGENTS.md；框架会在下一次请求或会话 resume 时重新读取。',
        'settings.unsaved': '有未保存的修改',
        'settings.discard': '放弃修改',
        'settings.noEditableRule': '项目根目录没有可编辑的 AGENTS.md，编辑器已隐藏。',
        'sessions.expand': '展开子会话',
        'sessions.collapse': '收起子会话',
        'settings.context': '上下文',
        'settings.contextHint': 'CONTEXT.md · {n} B',
        'settings.contextEffect': '只注入同目录会话；活动会话下一轮生效。',
        'settings.contextPlaceholder': '该工作区所有会话都应知道的共享说明或背景…',
        'settings.skills': '技能',
        'settings.skillsHint': '{n} 个可用',
        'settings.skillsEmpty': '当前工作区没有可见技能。',
        'settings.skillSearch': '搜索技能…',
        'settings.newSkill': '新建技能',
        'settings.rulesEmpty': '没有找到指令文件。',
        'settings.readOnly': '只读',
        'settings.editable': '可编辑',
        'settings.dirty': '未保存的修改',
        'settings.saving': '保存中…',
        'settings.saved': '已保存 · 刚刚',
        'settings.saveRules': '保存规则',
        'settings.saveContext': '保存上下文',
        'settings.createSkill': '创建技能',
        'settings.saveRulesDone': '工作区 AGENTS.md 已保存。',
        'settings.saveContextDone': '工作区上下文已保存。',
        'settings.skillCreated': '技能已创建。',
        'settings.saveFailed': '保存失败：{message}',
        'settings.loadFailed': '无法读取工作区设置：{message}',
        'settings.skillName': 'skill-name（kebab-case）',
        'settings.skillDescription': '一句话描述',
        'settings.skillBody': '技能说明…',
        'settings.skillSource.user': '用户',
        'settings.skillSource.project': '工作区',
        'settings.skillSource.bundled': '内置',
        'settings.skillSource.custom': '自定义',
        'settings.skillSource.unknown': '其他',
        'settings.modelOnly': '模型',
        'settings.userOnly': '用户',
        'settings.retry': '重试',
        'settings.kbdSave': '⌘S 保存全部修改',
        'dispatch.title': '派发「{title}」',
        'dispatch.sub': '交给一个会话来执行。它会收到任务详情，并在完成后把结果写回任务。',
        'dispatch.target': '由谁来执行？',
        'dispatch.new': '新建对话',
        'dispatch.newSub': '在当前工作区开一个新会话',
        'dispatch.existing': '已有对话',
        'dispatch.existingSub': '选择最近 5 个对话之一，完成后结果写回任务',
        'dispatch.selectExisting': '选择已有对话',
        'dispatch.note': '补充说明（可选）',
        'dispatch.notePlaceholder': '你希望它优先验证哪些场景？',
        'dispatch.openAfter': '派发后打开该会话',
        'dispatch.cancel': '取消',
        'dispatch.send': '派发',
        'dispatch.sending': '派发中…',
        'dispatch.hint': '1/2 选择 · Enter 派发 · Esc 关闭',
        'dispatch.needExisting': '请先选择一个已有对话',
        'dispatch.needSession': '先打开一个对话，才能派发给已有对话',
        'dispatch.failed': '派发失败：{message}',
        'palette.label': '命令面板',
        'palette.placeholder': '输入命令，或搜索任务、对话…',
        'palette.results': '命令结果',
        'palette.actions': '操作',
        'palette.tasks': '任务',
        'palette.sessions': '对话',
        'palette.workspaces': '工作区',
        'palette.empty': '没有找到「{q}」。试试「派发」或任务标题。',
        'palette.newTask': '新建任务',
        'palette.newSubchat': '新建子会话',
        'palette.needSession': '先打开一个对话',
        'palette.startServer': '启动服务器',
        'palette.openSettings': '打开设置',
        'palette.refresh': '刷新数据',
        'palette.refreshed': '已刷新 · 刚刚',
        'palette.switchWorkspace': '切换工作区',
        'palette.select': '选择',
        'palette.run': '执行',
        'palette.close': '关闭',
        'keys.new': '新建',
        'keys.search': '搜索',
        'keys.command': '命令',
        'tasks.activity2': '最近活动',
        'time.now': '刚刚',
        'time.minute': '{n} 分钟前',
        'time.hour': '{n} 小时前',
        'time.day': '{n} 天前',
        'time.shortSec': '{n} 秒',
        'time.shortMin': '{n} 分',
        'common.retry': '重试',
        'common.cancel': '取消',
        'common.close': '关闭',
        'common.delete': '删除',
        'common.failed': '操作失败',
      },
    };

    const CSS = `
      .wh-root {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        color: var(--dsw-alias-label-primary);
        background: var(--dsw-alias-bg-base);
        font-family: var(--ds-font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
        font-size: 13px;
        line-height: 1.7;
        -webkit-font-smoothing: antialiased;
      }
      .wh-root * { box-sizing: border-box; }
      .wh-root :where(button) { appearance: none; border: 0; margin: 0; padding: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      .wh-root :where(input, textarea, select) { font: inherit; color: inherit; }
      .wh-root :where(svg) { display: block; }
      .wh-root :where(button, input, textarea, select, [tabindex]):focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
      .wh-ic { flex: none; }
      .wh-spacer { flex: 1; min-width: 0; }
      .wh-ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .wh-num { font-variant-numeric: tabular-nums; }
      .wh-mono { font-family: var(--ds-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; line-height: 1.5; }
      .wh-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-muted { font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      /* Light theme: 11–12px metadata on white needs >=4.5:1; label-tertiary is only 3.71:1 there. */
      body:not([data-ds-dark-theme]) .wh-row-sub,
      body:not([data-ds-dark-theme]) .wh-row-meta,
      body:not([data-ds-dark-theme]) .wh-muted,
      body:not([data-ds-dark-theme]) .wh-hint,
      body:not([data-ds-dark-theme]) .wh-nav-num,
      body:not([data-ds-dark-theme]) .wh-foot,
      body:not([data-ds-dark-theme]) .wh-kbd,
      body:not([data-ds-dark-theme]) .wh-card-path,
      body:not([data-ds-dark-theme]) .wh-card-meta,
      body:not([data-ds-dark-theme]) .wh-card-hd .wh-ic,
      body:not([data-ds-dark-theme]) .wh-sec-title,
      body:not([data-ds-dark-theme]) .wh-sec-more,
      body:not([data-ds-dark-theme]) .wh-strip-sync,
      body:not([data-ds-dark-theme]) .wh-icon-btn.sm,
      body:not([data-ds-dark-theme]) .wh-icon-btn.xs,
      body:not([data-ds-dark-theme]) .wh-back,
      body:not([data-ds-dark-theme]) .wh-ws-switch,
      body:not([data-ds-dark-theme]) .wh-hd-path,
      body:not([data-ds-dark-theme]) .wh-sync { color: var(--dsw-alias-label-secondary); }
      .wh-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 4px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 11px; line-height: 1; color: var(--dsw-alias-label-tertiary); }

      .wh-hd { flex: none; height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 max(24px, calc((100% - 960px) / 2)); border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .wh-glyph { width: 26px; height: 26px; flex: none; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
      .wh-hd-id { min-width: 0; }
      .wh-hd-title { display: flex; align-items: baseline; gap: 8px; font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
      .wh-hub-name { white-space: nowrap; }
      .wh-hd-title-sm { font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .wh-ws-switch { display: inline-flex; align-items: center; gap: 4px; height: 22px; max-width: 320px; padding: 0 6px; border: 1px solid transparent; border-radius: 4px; font-size: 12px; font-weight: 400; color: var(--dsw-alias-label-tertiary); }
      .wh-ws-switch:hover { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
      .wh-hd-path { display: flex; align-items: center; gap: 2px; margin-top: 1px; font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
      .wh-path-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px; }
      .wh-hd-right { margin-left: auto; flex: none; display: flex; align-items: center; gap: 6px; }
      .wh-sync { height: 24px; padding: 0 6px; display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; white-space: nowrap; }
      .wh-sync:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
      .wh-sync.warn { color: var(--dsw-alias-state-warn-primary); }
      .wh-key-btn { height: 28px; padding: 0 8px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .wh-key-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-icon-btn { width: 28px; height: 28px; flex: none; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--dsw-alias-label-secondary); }
      .wh-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-icon-btn.sm { width: 24px; height: 24px; color: var(--dsw-alias-label-tertiary); }
      .wh-icon-btn.xs { width: 20px; height: 20px; border-radius: 4px; color: var(--dsw-alias-label-tertiary); }
      .wh-back { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px 0 4px; border-radius: 8px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .wh-back:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-back-all { flex: none; }
      .wh-back-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
      .wh-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .wh-card { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); text-align: left; }
      .wh-card:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-card-hd { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .wh-card-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; line-height: 1.4; color: var(--dsw-alias-label-primary); }
      .wh-card-hd .wh-ic { flex: none; color: var(--dsw-alias-label-tertiary); }
      .wh-card-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      @media (max-width: 900px) {
        .wh-cards { grid-template-columns: 1fr; }
        .wh-back-label { display: none; }
      }

      .wh-strip { flex: none; height: 36px; display: flex; align-items: center; gap: 2px; padding: 0 max(24px, calc((100% - 960px) / 2)); border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow: hidden; }
      .wh-strip-item { height: 24px; padding: 0 6px; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .wh-strip-item:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-strip-v { color: var(--dsw-alias-label-primary); font-weight: 500; font-variant-numeric: tabular-nums; }
      .wh-strip-sep { padding: 0 1px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-strip-sync { margin-left: auto; padding-left: 8px; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .wh-strip-sync.warn { color: var(--dsw-alias-state-warn-primary); }

      .wh-nav { flex: none; height: 40px; display: flex; align-items: stretch; gap: 4px; padding: 0 max(16px, calc((100% - 960px) / 2)); border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .wh-nav-btn { position: relative; display: inline-flex; align-items: center; gap: 7px; padding: 0 14px; font-size: 13px; line-height: 1.4; color: var(--dsw-alias-label-secondary); }
      .wh-nav-btn:hover { color: var(--dsw-alias-label-primary); }
      .wh-nav-btn.on { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .wh-nav-btn.on::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 0; height: 2px; background: var(--dsw-alias-label-primary); }
      .wh-nav-num { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; padding: 0 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
      .wh-nav-btn.on .wh-nav-num { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-secondary); }
      .wh-nav-att { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-state-warn-primary); }

      .wh-content { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
      .wh-view { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
      .wh-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 12px max(24px, calc((100% - 960px) / 2)) 24px; }
      .wh-overview { padding-top: 14px; }
      .wh-foot { flex: none; height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 max(24px, calc((100% - 960px) / 2)); border-top: 1px solid var(--dsw-alias-border-l1); font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
      .wh-foot-dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--dsw-alias-state-success-primary); }
      .wh-foot-dot.warn { background: var(--dsw-alias-state-warn-primary); }
      .wh-foot-keys { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; overflow: hidden; }

      .wh-sec { margin-bottom: 20px; }
      .wh-sec:last-child { margin-bottom: 0; }
      .wh-sec-hd { display: flex; align-items: center; gap: 8px; height: 28px; margin-bottom: 2px; padding: 0 2px; }
      .wh-sec-title { font-size: 11px; font-weight: 600; letter-spacing: .04em; line-height: 1.4; color: var(--dsw-alias-label-tertiary); }
      .wh-sec-more { display: inline-flex; align-items: center; gap: 3px; padding: 2px 4px; border-radius: 4px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-sec-more:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
      .wh-group { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
      .wh-group + .wh-group { margin-top: 8px; }
      .wh-row-wrap { position: relative; }
      .wh-row-wrap + .wh-row-wrap > .wh-row { border-top: .5px solid var(--dsw-alias-border-l1); }
      .wh-row { position: relative; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 8px 0 10px; background: transparent; transition: background 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-row.two { height: 56px; }
      .wh-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-row:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--dsw-alias-state-business-primary); }
      .wh-row-main { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 1px; overflow: hidden; }
      .wh-row-title { font-size: 14px; font-weight: 500; line-height: 1.4; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wh-row-title.done { color: var(--dsw-alias-label-tertiary); font-weight: 400; text-decoration: line-through; text-decoration-color: var(--dsw-alias-label-tertiary); }
      .wh-row-sub { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); overflow: hidden; }
      .wh-row-sub > span { white-space: nowrap; }
      .wh-row-meta { flex: none; display: flex; align-items: center; gap: 8px; margin-left: auto; font-size: 12px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
      .wh-row-actions { position: absolute; right: 6px; top: 0; bottom: 0; display: flex; align-items: center; gap: 2px; background: var(--dsw-alias-bg-layer-1); border-radius: 8px; opacity: 0; pointer-events: none; transition: opacity 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-row:hover .wh-row-actions, .wh-row:focus-within .wh-row-actions { opacity: 1; pointer-events: auto; }
      .wh-row:hover .wh-row-meta, .wh-row:focus-within .wh-row-meta { visibility: hidden; }
      .wh-row:hover .wh-row-actions { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-mini { height: 24px; padding: 0 8px; display: inline-flex; align-items: center; gap: 4px; border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .wh-mini:hover { background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-interactive-bg-hover)); color: var(--dsw-alias-label-primary); }
      .wh-mini[disabled] { opacity: .45; cursor: default; }
      .wh-status { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 4px; color: var(--dsw-alias-label-tertiary); }
      .wh-status:hover { background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-interactive-bg-hover)); color: var(--dsw-alias-label-secondary); }
      .wh-status.doing { color: var(--dsw-alias-state-business-primary); }
      .wh-status.blocked { color: var(--dsw-alias-state-warn-primary); }
      .wh-status.done { color: var(--dsw-alias-state-success-primary); }
      .wh-status.cancelled { color: var(--dsw-alias-label-tertiary); }
      .wh-dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--dsw-alias-label-tertiary); }
      .wh-dot.idle { background: transparent; border: 1px solid var(--dsw-alias-label-tertiary); }
      .wh-dot.doing { background: var(--dsw-alias-state-business-primary); }
      .wh-dot.blocked { background: var(--dsw-alias-state-warn-primary); }
      .wh-dot.done { background: var(--dsw-alias-state-success-primary); }
      .wh-dot.closed { background: transparent; border: 1px solid var(--dsw-alias-label-tertiary); opacity: .6; }
      .wh-dot.ok { background: var(--dsw-alias-state-success-primary); }
      .wh-dot.warn, .wh-dot.starting { background: var(--dsw-alias-state-warn-primary); }
      .wh-dot.failed { background: var(--dsw-alias-state-error-primary); }
      .wh-pulse { position: relative; width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--dsw-alias-state-business-primary); }
      .wh-pulse::after { content: ""; position: absolute; inset: -3px; border: 1px solid var(--dsw-alias-state-business-primary); border-radius: 50%; opacity: .5; animation: wh-pulse 2s var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)) infinite; }
      @keyframes wh-pulse { 0% { transform: scale(.7); opacity: .6; } 70% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
      .wh-badge { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 6px; flex: none; border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); font-size: 11px; line-height: 1.4; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }
      .wh-badge.unread { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-3); font-weight: 500; padding: 0 7px; }
      .wh-pri { display: inline-flex; align-items: center; gap: 4px; flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-pri.high { color: var(--dsw-alias-state-warn-primary); }
      .wh-pri .wh-dot { width: 5px; height: 5px; background: currentColor; }
      .wh-sep { color: var(--dsw-alias-label-tertiary); opacity: .6; }
      .wh-row[data-kind="attention"] .wh-row-actions, .wh-row.always-actions .wh-row-actions { position: static; margin-left: 4px; padding-left: 2px; background: transparent; opacity: 1; pointer-events: auto; }
      .wh-row[data-kind="attention"]:hover .wh-row-meta, .wh-row.always-actions:hover .wh-row-meta { visibility: visible; }
      .wh-att-icon { width: 22px; height: 22px; flex: none; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); }

      .wh-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 12px 0 10px; }
      .wh-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .wh-chip { height: 26px; padding: 0 9px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .wh-chip:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-chip.on { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); }
      .wh-chip .wh-num { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-chip.on .wh-num { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); }
      .wh-ctl { height: 28px; padding: 0 8px; display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; border: 1px solid transparent; }
      .wh-ctl:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
      .wh-toolbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap; }
      .wh-task-search { width: 190px; flex: none; }
      .wh-field { position: relative; display: flex; align-items: center; min-width: 0; }
      .wh-field > .wh-ic { position: absolute; left: 9px; color: var(--dsw-alias-label-tertiary); pointer-events: none; }
      .wh-field > .wh-input { padding-left: 30px; }
      .wh-input, .wh-textarea, .wh-select { width: 100%; height: 32px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 13px; color: var(--dsw-alias-label-primary); outline: none; transition: border-color 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-input::placeholder, .wh-textarea::placeholder { color: var(--dsw-alias-label-tertiary); }
      .wh-input:focus, .wh-textarea:focus, .wh-select:focus { border-color: var(--dsw-alias-state-business-primary); outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
      .wh-input.sm { height: 28px; font-size: 12px; }
      .wh-textarea { height: auto; min-height: 72px; padding: 8px 10px; line-height: 1.7; resize: vertical; }
      .wh-select { height: 28px; padding: 0 6px; font-size: 12px; }
      .wh-capture { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
      .wh-capture:focus-within { border-color: var(--dsw-alias-state-business-primary); outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
      .wh-capture > .wh-ic { color: var(--dsw-alias-label-tertiary); }
      .wh-capture input { flex: 1; min-width: 0; height: 100%; border: 0; background: transparent; outline: none; font-size: 13px; color: var(--dsw-alias-label-primary); }
      .wh-capture input::placeholder { color: var(--dsw-alias-label-tertiary); }
      .wh-capture-detail { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; padding: 7px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-capture-detail .wh-input { flex: 1; min-width: 180px; }
      .wh-capture-detail label { display: inline-flex; align-items: center; gap: 6px; }
      .wh-btn { height: 28px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; font-size: 13px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .wh-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-btn[disabled] { opacity: .5; cursor: default; }
      .wh-btn.sm { height: 24px; padding: 0 8px; border-radius: 8px; font-size: 12px; gap: 4px; }
      .wh-btn.lg { height: 32px; padding: 0 12px; }
      .wh-btn.primary { border-color: var(--dsw-alias-button-primary-fill); background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); font-weight: 500; }
      .wh-btn.primary:hover { background: var(--dsw-alias-button-primary-hover); border-color: var(--dsw-alias-button-primary-hover); color: var(--dsw-alias-label-primary-foreground); }
      .wh-btn.ghost { border-color: transparent; }
      .wh-btn.danger:hover { color: var(--dsw-alias-state-error-primary); }
      .wh-flip { display: inline-flex; align-items: center; gap: 6px; min-height: 24px; padding: 2px 4px; border-radius: 4px; font-size: 12px; color: var(--dsw-alias-label-tertiary); cursor: pointer; user-select: none; }
      .wh-flip input { appearance: none; width: 26px; height: 16px; margin: 0; border-radius: 8px; background: var(--dsw-alias-bg-layer-3); position: relative; cursor: pointer; }
      .wh-flip input:checked { background: var(--dsw-alias-label-primary); }
      .wh-flip input::after { content: ""; position: absolute; left: 2px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--dsw-alias-bg-base); transition: transform 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-flip input:checked::after { transform: translateX(10px); }

      .wh-expand { padding: 12px 14px 14px 56px; border-top: .5px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
      .wh-ex-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .wh-title-input { flex: 1; min-width: 0; height: 28px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-base); font-size: 14px; font-weight: 500; color: var(--dsw-alias-label-primary); outline: none; }
      .wh-title-input:focus { border-color: var(--dsw-alias-state-business-primary); outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
      .wh-save-state { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-expand .wh-textarea { min-height: 66px; font-size: 13px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-base); }
      .wh-ex-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
      .wh-ex-label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-run-strip { display: flex; align-items: center; gap: 8px; min-height: 34px; margin-top: 10px; padding: 6px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-base); }
      .wh-run-main { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .wh-run-main .wh-ellip { max-width: 38ch; }
      .wh-run-strip .wh-btn { margin-left: auto; }
      .wh-run-strip .wh-btn + .wh-btn { margin-left: 0; }
      .wh-notes { margin-top: 12px; }
      .wh-notes-hd { display: flex; align-items: center; gap: 6px; height: 24px; font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--dsw-alias-label-tertiary); }
      .wh-timeline { position: relative; display: flex; flex-direction: column; gap: 4px; margin: 4px 0 8px; padding-left: 12px; }
      .wh-timeline::before { content: ""; position: absolute; left: 2px; top: 4px; bottom: 4px; width: 1px; background: var(--dsw-alias-border-l2); }
      .wh-tl { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .wh-tl .wh-num { flex: none; color: var(--dsw-alias-label-tertiary); }
      .wh-tl-text { min-width: 0; overflow-wrap: anywhere; }
      .wh-note-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
      .wh-note-row .wh-input { flex: 1; }
      .wh-ex-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
      .wh-conflict { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0 10px 8px 46px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .wh-conflict .wh-ic { color: var(--dsw-alias-state-warn-primary); }
      .wh-conflict-main { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .wh-conflict-sub { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-conflict .wh-btn { margin-left: auto; }
      .wh-conflict .wh-btn + .wh-btn { margin-left: 0; }

      .wh-empty { padding: 34px 12px 28px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; }
      .wh-empty > .wh-ic { color: var(--dsw-alias-label-tertiary); }
      .wh-empty-title { margin-top: 4px; font-size: 14px; font-weight: 500; color: var(--dsw-alias-label-primary); }
      .wh-empty-sub { max-width: 44ch; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-tertiary); }
      .wh-templates { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 10px; }
      .wh-tpl { height: 26px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .wh-tpl:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-empty-line { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-banner { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 34px; margin-bottom: 10px; padding: 6px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .wh-banner .wh-ic { color: var(--dsw-alias-state-warn-primary); }
      .wh-banner-link { padding: 0 2px; border-radius: 4px; color: var(--dsw-alias-label-secondary); text-decoration: underline; text-underline-offset: 2px; }
      .wh-banner-link:hover { color: var(--dsw-alias-label-primary); }
      .wh-sk-row { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 10px; border-top: .5px solid var(--dsw-alias-border-l1); }
      .wh-sk-row:first-child { border-top: 0; }
      .wh-sk { height: 8px; border-radius: 4px; background: var(--dsw-alias-bg-layer-3); }
      .wh-sk-circle { width: 14px; height: 14px; flex: none; border-radius: 50%; }
      .wh-sk-stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
      .wh-sk-line.w1 { width: 38%; }
      .wh-sk-line.w2 { width: 24%; }

      .wh-sess-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      .wh-sess-toolbar .wh-field { width: 190px; margin-left: auto; }
      .wh-sess-row { height: 48px; }
      .wh-sess-chev { flex: none; transition: transform 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-sess-chev.on { transform: rotate(90deg); }
      .wh-sess-row .wh-row-title { display: flex; align-items: center; gap: 6px; }
      .wh-sub-list { background: var(--dsw-alias-bg-base); border-top: .5px solid var(--dsw-alias-border-l1); }
      .wh-subrow { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px 8px 34px; border-top: .5px solid var(--dsw-alias-border-l1); transition: background 100ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-sub-list .wh-subrow:first-child { border-top: 0; }
      .wh-subrow:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-subrow:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--dsw-alias-state-business-primary); }
      .wh-sub-dot { margin-top: 6px; }
      .wh-sub-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .wh-sub-title { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 13px; font-weight: 500; line-height: 1.4; color: var(--dsw-alias-label-primary); }
      .wh-sub-state { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-sub-reply { display: flex; align-items: flex-start; gap: 6px; min-width: 0; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-secondary); }
      .wh-sub-reply .wh-ic { margin-top: 4px; color: var(--dsw-alias-label-tertiary); }
      .wh-ellip-2 { min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .wh-sub-meta { flex: none; margin-left: auto; padding-top: 1px; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
      .wh-sub-actions { flex: none; display: flex; align-items: center; gap: 2px; margin-top: -2px; }
      .wh-subrow.closed .wh-sub-title { color: var(--dsw-alias-label-tertiary); text-decoration: line-through; text-decoration-color: var(--dsw-alias-label-tertiary); }
      .wh-composer { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
      .wh-composer .wh-input { flex: 1; height: 30px; font-size: 12px; }
      .wh-sub-empty { padding: 12px 14px 12px 34px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-create-sub { padding: 10px 12px; margin-bottom: 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); display: flex; flex-direction: column; gap: 8px; }
      .wh-create-sub-row { display: flex; align-items: center; gap: 8px; }

      .wh-settings .wh-scroll { padding-top: 10px; }
      .wh-page-title { font-size: 20px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
      .wh-page-sub { margin: 3px 0 14px; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-tertiary); }
      .wh-set-sec { margin-bottom: 16px; }
      .wh-set-sec:last-child { margin-bottom: 0; }
      .wh-set-hd { display: flex; align-items: center; gap: 8px; height: 26px; margin-bottom: 6px; padding: 0 2px; }
      .wh-set-hd h2 { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .04em; line-height: 1.4; color: var(--dsw-alias-label-tertiary); }
      .wh-set-hd .wh-hint { margin-left: 0; }
      .wh-rule-row { padding-right: 10px; }
      .wh-rule-ic { width: 20px; height: 20px; flex: none; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); }
      .wh-rule-path { flex: 1; min-width: 0; font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wh-rule-bytes { flex: none; width: 52px; text-align: right; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
      .wh-rule-edit { flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-editor { padding: 8px 12px 10px; border-top: .5px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
      .wh-ed-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 11px; color: var(--dsw-alias-label-tertiary); min-width: 0; }
      .wh-ed-path { flex: 1; min-width: 0; font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wh-dirty { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-dirty .wh-dot { background: var(--dsw-alias-state-warn-primary); }
      .wh-saving, .wh-saved { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-saved .wh-ic { color: var(--dsw-alias-state-success-primary); }
      .wh-mono-input { width: 100%; min-height: 92px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 12px; line-height: 1.5; resize: vertical; outline: none; }
      .wh-mono-input:focus { border-color: var(--dsw-alias-state-business-primary); outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
      .wh-ed-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-skill-row { height: 44px; }
      .wh-skill-name { flex: none; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-mono, ui-monospace, Menlo, monospace); font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .wh-skill-desc { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--dsw-alias-label-tertiary); }
      .wh-skill-face { flex: none; width: 92px; text-align: right; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-set-search { max-width: 280px; margin-bottom: 8px; }
      .wh-skill-form { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

      .wh-overlay { position: absolute; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,.42); }
      .wh-overlay-palette { align-items: flex-start; padding: 56px 16px 24px; }
      .wh-dialog { display: flex; flex-direction: column; max-height: calc(100% - 16px); border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 24px 64px rgba(0,0,0,.28); outline: none; }
      .wh-sheet { width: 480px; max-width: 100%; }
      .wh-sheet-hd { display: flex; align-items: flex-start; gap: 8px; padding: 14px 14px 0 16px; }
      .wh-sheet-title { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--dsw-alias-label-primary); }
      .wh-sheet-sub { padding: 3px 16px 0; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-tertiary); }
      .wh-sheet-body { padding: 10px 16px 0; overflow-y: auto; }
      .wh-field-label { margin: 12px 0 5px; font-size: 11px; letter-spacing: .02em; color: var(--dsw-alias-label-tertiary); }
      .wh-target { display: flex; align-items: center; gap: 9px; width: 100%; margin-top: 6px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }
      .wh-target:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-target.on { border-color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); }
      .wh-radio { width: 14px; height: 14px; flex: none; display: grid; place-items: center; border: 1px solid var(--dsw-alias-label-tertiary); border-radius: 50%; }
      .wh-target.on .wh-radio { border-color: var(--dsw-alias-label-primary); }
      .wh-target.on .wh-radio::after { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-primary); }
      .wh-target-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .wh-target-title { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary); }
      .wh-target-sub { font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wh-check { display: inline-flex; align-items: center; gap: 7px; margin-top: 12px; font-size: 12px; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .wh-check input { appearance: none; width: 14px; height: 14px; margin: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; background: var(--dsw-alias-bg-layer-1); display: inline-grid; place-items: center; cursor: pointer; }
      .wh-check input:checked { border-color: var(--dsw-alias-label-primary); background: var(--dsw-alias-label-primary); }
      .wh-check input:checked::after { content: ""; width: 7px; height: 4px; border-left: 1.5px solid var(--dsw-alias-bg-base); border-bottom: 1.5px solid var(--dsw-alias-bg-base); transform: rotate(-45deg) translateY(-1px); }
      .wh-sheet .wh-textarea { margin-top: 4px; }
      .wh-sheet-foot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 14px; padding: 11px 16px 13px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .wh-sheet-foot .wh-hint { white-space: nowrap; }
      .wh-sheet-foot .wh-btn.primary { margin-left: 4px; }
      .wh-palette { width: 560px; max-width: 100%; overflow: hidden; }
      .wh-pal-input { flex: none; display: flex; align-items: center; gap: 9px; height: 46px; padding: 0 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .wh-pal-input .wh-ic { color: var(--dsw-alias-label-tertiary); }
      .wh-pal-input input { flex: 1; min-width: 0; height: 100%; border: 0; background: transparent; outline: none; font-size: 13px; color: var(--dsw-alias-label-primary); }
      .wh-pal-input input::placeholder { color: var(--dsw-alias-label-tertiary); }
      .wh-pal-list { flex: 1; min-height: 0; max-height: min(540px, 62vh); overflow-y: auto; padding: 5px 6px 7px; }
      .wh-pal-group { padding: 8px 8px 4px; font-size: 11px; font-weight: 600; letter-spacing: .05em; color: var(--dsw-alias-label-tertiary); }
      .wh-pal-row { display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 8px; border-radius: 8px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .wh-pal-row .wh-ic { color: var(--dsw-alias-label-tertiary); }
      .wh-pal-row.on { background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-interactive-bg-hover)); color: var(--dsw-alias-label-primary); }
      .wh-pal-rt { margin-left: auto; flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-pal-empty { padding: 22px 10px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
      .wh-pal-foot { flex: none; display: flex; align-items: center; gap: 12px; height: 34px; padding: 0 12px; border-top: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-pal-foot .wh-kbd { margin-right: 3px; }

      .wh-menu { position: absolute; z-index: 70; top: 36px; right: 8px; min-width: 186px; max-width: 250px; padding: 5px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); box-shadow: 0 14px 40px rgba(0,0,0,.28); }
      .wh-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; height: 30px; padding: 0 8px; border-radius: 8px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .wh-menu-item:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .wh-menu-item .wh-ic { color: var(--dsw-alias-label-tertiary); }
      .wh-menu-item.danger:hover { color: var(--dsw-alias-state-error-primary); }
      .wh-menu-sep { height: 1px; margin: 5px 4px; background: var(--dsw-alias-border-l1); }
      .wh-menu-hd { padding: 5px 8px 4px; font-size: 11px; font-weight: 600; letter-spacing: .05em; color: var(--dsw-alias-label-tertiary); }
      .wh-pop { position: absolute; z-index: 70; top: 96px; right: 24px; width: 372px; max-width: calc(100% - 32px); padding: 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); box-shadow: 0 14px 40px rgba(0,0,0,.28); }
      .wh-pop-hd { display: flex; align-items: center; gap: 6px; padding: 5px 8px 6px; font-size: 11px; font-weight: 600; letter-spacing: .05em; color: var(--dsw-alias-label-tertiary); }
      .wh-pop-count { font-weight: 400; letter-spacing: 0; }
      .wh-pop-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; }
      .wh-pop-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .wh-pop-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .wh-pop-name { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; color: var(--dsw-alias-label-primary); }
      .wh-pop-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
      .wh-pop-empty { padding: 10px 8px; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-tertiary); }
      .wh-pop-foot { margin-top: 4px; padding: 6px 4px 2px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .wh-pop-foot .wh-menu-item { height: 26px; font-size: 12px; }

      .wh-toasts { position: absolute; left: 50%; bottom: 18px; z-index: 90; display: flex; flex-direction: column; align-items: center; gap: 8px; width: max-content; max-width: calc(100% - 48px); transform: translateX(-50%); pointer-events: none; }
      .wh-toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 7px 10px 7px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-3); box-shadow: 0 14px 40px rgba(0,0,0,.28); font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary); }
      .wh-toast.error { color: var(--dsw-alias-state-error-primary); }
      .wh-toast-act { flex: none; padding: 2px 4px; border-radius: 4px; font-size: 12px; color: var(--dsw-alias-label-primary); text-decoration: underline; text-underline-offset: 2px; }
      .wh-toast-act:hover { background: var(--dsw-alias-interactive-bg-hover); }

      @keyframes wh-fade { from { opacity: 0; } to { opacity: 1; } }
      .wh-dialog:focus, .wh-dialog:focus-visible { outline: none; }
      .wh-pal-input input:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; border-radius: 4px; }
      .wh-pal-row[disabled] { opacity: .5; cursor: default; }
      .wh-dialog { animation: wh-fade 160ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      .wh-toast { animation: wh-fade 120ms var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1)); }
      @media (prefers-reduced-motion: reduce) {
        .wh-root *, .wh-root *::before, .wh-root *::after { animation-duration: 0ms !important; animation-iteration-count: 1 !important; transition-duration: 0ms !important; }
      }
      @media (max-width: 900px) {
        .wh-hd { padding: 0 16px; gap: 10px; }
        .wh-hd-path, .wh-hub-name { display: none; }
        .wh-sync-text { display: none; }
        .wh-strip, .wh-nav, .wh-scroll, .wh-foot { padding-left: 16px; padding-right: 16px; }
        .wh-row { height: auto; min-height: 44px; flex-wrap: wrap; padding-top: 6px; padding-bottom: 6px; }
        .wh-row.two { min-height: 56px; }
        .wh-row-meta { flex-basis: 100%; order: 6; margin-left: 38px; font-size: 11px; }
        .wh-row .wh-row-actions { top: 6px; bottom: auto; }
        .wh-row .wh-mini { display: none; }
        .wh-expand { padding-left: 14px; }
        .wh-conflict { margin-left: 0; }
        .wh-pop { right: 8px; width: calc(100% - 16px); }
        .wh-sess-toolbar .wh-field { width: 100%; margin-left: 0; }
        .wh-skill-face, .wh-rule-bytes { display: none; }
        .wh-task-search { width: auto; flex: 1; min-width: 140px; }
        .wh-foot-keys { display: none; }
        .wh-pal-foot .wh-pal-ws { display: none; }
        .wh-hd .wh-key-btn span { display: none; }
        .wh-hd .wh-key-btn { width: 28px; padding: 0; justify-content: center; }
      }
    `;

    /** Styles for the sidebar entries, which render outside the panel. */
    const SIDEBAR_CSS = `
      .dsh-hub-count { appearance:none; border:0; background:transparent; padding:0 1px; height:16px; display:inline-flex; align-items:center; gap:2px; color:var(--dsw-alias-label-tertiary); font:inherit; font-size:10px; line-height:1; cursor:pointer; border-radius:4px; }
      .dsh-hub-count:hover { color:var(--dsw-alias-label-primary); }
      .dsh-hub-count .n { font-variant-numeric:tabular-nums; }
      .dsh-hub-leading { width:16px; height:20px; display:inline-flex; align-items:center; justify-content:center; padding:0; border:0; border-radius:4px; background:transparent; color:var(--dsw-alias-label-tertiary); cursor:pointer; }
      .dsh-hub-leading:hover { color:var(--dsw-alias-label-primary); }
      .dsh-hub-headbtn { appearance:none; display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:1; cursor:pointer; }
      .dsh-hub-headbtn:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-2); }
      .dsh-hub-menu { position:fixed; z-index:80; pointer-events:auto; box-sizing:border-box; background:var(--dsw-alias-bg-layer-2); border:1px solid var(--dsw-alias-border-l2); border-radius:10px; padding:6px; color:var(--dsw-alias-label-primary); box-shadow:0 14px 40px rgba(0,0,0,.28); }
      .dsh-hub-menu-head { padding:4px 8px 6px; font-size:11px; letter-spacing:.05em; text-transform:uppercase; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-empty { padding:8px; font-size:12px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-row { appearance:none; display:flex; align-items:center; gap:8px; width:100%; box-sizing:border-box; text-align:left; background:transparent; border:0; border-radius:8px; padding:6px 8px; color:inherit; font:inherit; cursor:pointer; }
      .dsh-hub-menu-row:hover { background:var(--dsw-alias-interactive-bg-hover); }
      .dsh-hub-menu-foot { margin-top:6px; padding-top:6px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsh-hub-menu-new { color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-form { display:flex; flex-direction:column; gap:6px; padding:2px 6px 4px; }
      .dsh-hub-menu-input, .dsh-hub-menu-textarea { width:100%; box-sizing:border-box; font:inherit; font-size:12px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); border:1px solid var(--dsw-alias-border-l2); border-radius:6px; padding:6px 8px; outline:none; }
      .dsh-hub-menu-textarea { min-height:56px; resize:vertical; }
      .dsh-hub-menu-input:focus, .dsh-hub-menu-textarea:focus { border-color:var(--dsw-alias-state-business-primary); }
      .dsh-hub-menu-actions { display:flex; justify-content:flex-end; gap:6px; }
      .dsh-hub-menu-btn { appearance:none; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:6px; padding:4px 10px; font-size:12px; line-height:1.2; cursor:pointer; }
      .dsh-hub-menu-btn.primary { background:var(--dsw-alias-button-primary-fill); border-color:var(--dsw-alias-button-primary-fill); color:var(--dsw-alias-label-primary-foreground); }
      .dsh-hub-menu-btn.primary:hover { background:var(--dsw-alias-button-primary-hover); border-color:var(--dsw-alias-button-primary-hover); }
      .dsh-hub-menu-btn[disabled] { opacity:.5; cursor:default; }
      .dsh-hub-menu-error { color:var(--dsw-alias-state-error-primary); font-size:11px; padding:0 6px 4px; }
      .dsh-hub-menu-title { flex:1; min-width:0; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-menu-open { flex:none; font-size:11px; color:var(--dsw-alias-label-secondary); opacity:0; }
      .dsh-hub-menu-row:hover .dsh-hub-menu-open { opacity:1; }
      .dsh-hub-hover { display:flex; flex-direction:column; gap:4px; }
      .dsh-hub-hover-head { font-size:11px; letter-spacing:.05em; text-transform:uppercase; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-hover-row { display:flex; align-items:center; gap:6px; min-width:0; font-size:12px; line-height:16px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-hover-title { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-server-pill { appearance:none; display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; line-height:1; cursor:pointer; }
      .dsh-hub-server-pill:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
      .dsh-hub-server-pill.error { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
      .dsh-hub-server-pill-count { color:var(--dsw-alias-label-tertiary); font-variant-numeric:tabular-nums; }
      .dsh-hub-server-pill .dsh-hub-server-dot { margin-top:0; }
      .dsh-hub-server-dot { width:9px; height:9px; border-radius:50%; flex:none; background:var(--dsw-alias-state-idle-primary); }
      .dsh-hub-server-dot.ok { background:var(--dsw-alias-state-success-primary); }
      .dsh-hub-server-dot.warn { background:var(--dsw-alias-state-warn-primary); }
      .dsh-hub-server-dot.error { background:var(--dsw-alias-state-error-primary); }
      .dsh-hub-server-dot.idle { opacity:.45; }
    `;

    function Icon(props) {
      const size = props.size ?? 18;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 3, y: 4.5, width: 9, height: 2.6, rx: 1.3, fill: 'currentColor' }),
        h('rect', { x: 3, y: 10.7, width: 14, height: 2.6, rx: 1.3, fill: 'currentColor', opacity: 0.72 }),
        h('rect', { x: 3, y: 16.9, width: 7, height: 2.6, rx: 1.3, fill: 'currentColor', opacity: 0.5 }),
        h('path', {
          d: 'M14 12.4c0-2.1 1.9-3.8 4.2-3.8s4.2 1.7 4.2 3.8-1.9 3.8-4.2 3.8c-.5 0-.9-.1-1.4-.2L14.6 17l.6-2c-.7-.6-1.2-1.5-1.2-2.6Z',
          fill: 'var(--dsw-alias-state-success-primary)',
        }),
      );
    }

    /** POST one bridge method and unwrap its envelope. */
    async function call(method, payload) {
      const response = await fetch(`${API}${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload ?? {}),
      });
      let body;
      try {
        body = await response.json();
      } catch {
        throw Object.assign(new Error(`bridge returned ${response.status}`), { code: 'bad-response' });
      }
      if (body.ok !== true) {
        const error = new Error(body.error?.message ?? 'request failed');
        error.code = body.error?.code ?? 'error';
        error.details = body.error?.details;
        throw error;
      }
      return body.value;
    }

    /** Relative time label from the panel locale. */
    function relative(t, at) {
      if (typeof at !== 'number') return '';
      const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
      if (seconds < 45) return t('time.now');
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return t('time.minute', { n: minutes });
      const hours = Math.round(minutes / 60);
      if (hours < 24) return t('time.hour', { n: hours });
      return t('time.day', { n: Math.round(hours / 24) });
    }

    /** Resolve the conversation the user is viewing and its workspace. */
    function useScope(useSessions, useWorkspaces) {
      const sessions = useSessions((state) => state);
      const workspaces = useWorkspaces((state) => state.items);
      return React.useMemo(() => {
        const rows = Object.values(sessions?.byId ?? {});
        const current = rows.find((row) => (row.retainedBy?.mainView ?? 0) > 0);
        let workspace =
          workspaces.find((entry) => current !== undefined && entry.sessionIds?.includes(current.id)) ??
          workspaces.find((entry) => current !== undefined && entry.path === current.cwd);
        if (workspace === undefined) {
          const recent = rows.toSorted?.((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
          if (recent !== undefined) {
            workspace =
              workspaces.find((entry) => entry.sessionIds?.includes(recent.id)) ??
              workspaces.find((entry) => entry.path === recent.cwd);
          }
        }
        if (workspace === undefined && workspaces.length > 0) workspace = workspaces[0];
        return {
          sessionId: current?.id,
          workspaceId: workspace?.workspaceId,
          workspacePath: workspace?.path,
          workspaceTitle: workspace?.title,
        };
      }, [sessions, workspaces]);
    }

    // ---------------------------------------------------------------------
    // Sidebar sub-chat entries: one badge on the main conversation row plus a
    // frame-wide menu. The shipped session list filters subagent children out
    // and exposes no row-list slot, so this is the additive way to show them
    // under their parent conversation.
    // ---------------------------------------------------------------------

    /** Per-workspace sub-chat catalog shared by the sidebar entries. */
    const subchatCatalog = (() => {
      let rows = [];
      let scope = null;
      let timer = null;
      let inflight = false;
      const listeners = new Set();
      const notify = () => {
        for (const listener of listeners) listener();
      };
      const load = async () => {
        if (scope === null || inflight) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        inflight = true;
        try {
          const value = await call('subchats.catalog', {
            sessionId: scope.sessionId,
            workspaceId: scope.workspaceId,
            workspacePath: scope.workspacePath,
          });
          rows = Array.isArray(value?.subchats) ? value.subchats : [];
          notify();
        } catch {
          /* keep the last good catalog */
        } finally {
          inflight = false;
        }
      };
      const subscribe = (listener) => {
        listeners.add(listener);
        if (listeners.size === 1) {
          load();
          timer = setInterval(load, 5000);
        }
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0 && timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        };
      };
      return {
        subscribe,
        getSnapshot: () => rows,
        refresh: load,
        setScope: (next) => {
          const changed =
            scope === null || scope.sessionId !== next.sessionId || scope.workspaceId !== next.workspaceId || scope.workspacePath !== next.workspacePath;
          scope = next;
          if (changed) {
            rows = [];
            notify();
            load();
          }
        },
      };
    })();

    function useSubchatRows(useSessions, useWorkspaces) {
      const scope = useScope(useSessions, useWorkspaces);
      React.useEffect(() => {
        subchatCatalog.setScope(scope);
      }, [scope.sessionId, scope.workspaceId, scope.workspacePath]);
      return React.useSyncExternalStore(subchatCatalog.subscribe, subchatCatalog.getSnapshot);
    }

    /** Workspace id -> its "工作区中枢" session, one per registered workspace. */
    const hubCatalog = (() => {
      let entries = [];
      let timer = null;
      let inflight = false;
      const listeners = new Set();
      const notify = () => {
        for (const listener of listeners) listener();
      };
      const load = async () => {
        if (inflight) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        inflight = true;
        try {
          const value = await call('hub.catalog', {});
          entries = Array.isArray(value?.workspaces) ? value.workspaces : [];
          notify();
        } catch {
          /* keep the last good catalog */
        } finally {
          inflight = false;
        }
      };
      const subscribe = (listener) => {
        listeners.add(listener);
        if (listeners.size === 1) {
          load();
          timer = setInterval(load, 10000);
        }
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0 && timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        };
      };
      return { subscribe, getSnapshot: () => entries, refresh: load };
    })();


    /** One open sub-chat menu per page, anchored to a sidebar row. */
    let subchatMenu = { open: false, sessionId: null, rect: null };
    /** Set in `apply`; opens a child conversation through the layout service. */
    let openChildSession = () => {};
    /** Set in `apply`; opens a main conversation by id. */
    let openSessionById = () => {};
    /** Set in `apply`; selects one workspace's hub panel. */
    let selectHubPanel = () => {};
    /** Locale translate fallback for single-slot components. */
    let translate = (key) => key;
    const menuListeners = new Set();
    const publishMenu = () => {
      for (const listener of menuListeners) listener();
    };
    const subscribeMenu = (listener) => {
      menuListeners.add(listener);
      return () => menuListeners.delete(listener);
    };
    const openSubchatMenu = (sessionId, element) => {
      const rect = element.getBoundingClientRect();
      subchatMenu = {
        open: true,
        sessionId,
        rect: { top: rect.top, bottom: rect.bottom, right: rect.right },
        openedAt: Date.now(),
      };
      publishMenu();
    };
    const closeSubchatMenu = () => {
      if (!subchatMenu.open) return;
      subchatMenu = { open: false, sessionId: null, rect: null, openedAt: 0 };
      publishMenu();
    };
    /** The same row control opens and closes its menu. */
    const toggleSubchatMenu = (sessionId, element) => {
      if (subchatMenu.open && subchatMenu.sessionId === sessionId) {
        closeSubchatMenu();
        return;
      }
      openSubchatMenu(sessionId, element);
    };
    const useSubchatMenu = () => React.useSyncExternalStore(subscribeMenu, () => subchatMenu);

    // ---------------------------------------------------------------------
    // Dev-server status: the header pill and the Servers tab both read this
    // hook. Polling pauses while the page is hidden; the panel passes its live
    // status down so one poll serves the tab and its action refresh.
    // ---------------------------------------------------------------------

    function useServerStatus(scope, intervalMs) {
      const [state, setState] = React.useState({
        loading: true,
        configured: false,
        source: undefined,
        path: null,
        servers: [],
        error: undefined,
      });
      const [revision, setRevision] = React.useState(0);
      const key =
        scope.sessionId === undefined && scope.workspaceId === undefined && scope.workspacePath === undefined
          ? ''
          : `${scope.sessionId ?? ''}|${scope.workspaceId ?? ''}|${scope.workspacePath ?? ''}`;
      React.useEffect(() => {
        if (key === '') {
          setState({ loading: false, configured: false, source: undefined, path: null, servers: [], error: undefined });
          return undefined;
        }
        let cancelled = false;
        let inflight = false;
        const load = async () => {
          if (inflight) return;
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          inflight = true;
          try {
            const value = await call('servers.status', scope);
            if (cancelled) return;
            setState({
              loading: false,
              configured: value?.configured === true,
              source: value?.source === 'discovered' ? 'discovered' : 'config',
              path: typeof value?.path === 'string' ? value.path : null,
              servers: Array.isArray(value?.servers) ? value.servers : [],
              error: undefined,
            });
          } catch (error) {
            if (cancelled) return;
            setState((current) => ({ ...current, loading: false, error: String(error?.message ?? error) }));
          } finally {
            inflight = false;
          }
        };
        void load();
        const timer = setInterval(load, intervalMs);
        return () => {
          cancelled = true;
          clearInterval(timer);
        };
      }, [key, revision, intervalMs]);
      const refresh = React.useCallback(() => setRevision((value) => value + 1), []);
      return { ...state, refresh };
    }

    /** Tab request published by the header pill and consumed by the panel. */
    let serversTabRequest = { workspaceId: undefined, seq: 0 };
    let envConsumedSeq = 0;
    const serversTabListeners = new Set();
    const publishServersTab = () => {
      for (const listener of serversTabListeners) listener();
    };
    const subscribeServersTab = (listener) => {
      serversTabListeners.add(listener);
      return () => serversTabListeners.delete(listener);
    };
    const openServersTab = (workspaceId) => {
      if (workspaceId === undefined) return;
      serversTabRequest = { workspaceId, seq: serversTabRequest.seq + 1 };
      publishServersTab();
      selectHubPanel(workspaceId);
    };

    /** Header pill: visible only when the current workspace declares servers. */
    function ServerStatusPill(props) {
      const { t, useSessions, useWorkspaces } = props;
      const tr = typeof t === 'function' ? t : translate;
      const scope = useScope(useSessions, useWorkspaces);
      const status = useServerStatus(scope, 8000);
      if (scope.workspaceId === undefined || status.configured !== true) return null;
      const total = status.servers.length;
      const ready = status.servers.filter((row) => row.ready === true).length;
      const running = status.servers.filter((row) => row.running === true || row.external === true).length;
      const failed =
        status.error !== undefined ||
        status.servers.some(
          (row) => row.status === 'failed' || (typeof row.error === 'string' && row.error !== ''),
        );
      const tone = failed ? 'error' : total > 0 && ready === total ? 'ok' : running > 0 || status.loading === true ? 'warn' : 'idle';
      const hint =
        status.error !== undefined
          ? tr('servers.unreachable', { message: status.error })
          : `${tr('servers.pillHint')} · ${tr('servers.pillReady', { ready, total })}`;
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'button',
          {
            type: 'button',
            className: `dsh-hub-server-pill ${tone}`,
            title: hint,
            'aria-label': hint,
            onClick: () => openServersTab(scope.workspaceId),
          },
          h('span', { className: `dsh-hub-server-dot ${tone}`, 'aria-hidden': true }),
          h('span', null, tr('servers.pill')),
          h('span', { className: 'dsh-hub-server-pill-count' }, `${ready}/${total}`),
        ),
      );
    }

    function SubchatGlyph(props) {
      const size = props.size ?? 14;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 1.5, y: 2.5, width: 8, height: 2, rx: 1, fill: 'currentColor' }),
        h('rect', { x: 1.5, y: 6.5, width: 11, height: 2, rx: 1, fill: 'currentColor', opacity: 0.7 }),
        h('rect', { x: 1.5, y: 10.5, width: 6, height: 2, rx: 1, fill: 'currentColor', opacity: 0.45 }),
        h('path', {
          d: 'M9.4 10.2c0-1.8 1.6-3.2 3.6-3.2s3.6 1.4 3.6 3.2-1.6 3.2-3.6 3.2c-.4 0-.8-.1-1.2-.2l-1.7 1 .5-1.7c-.7-.5-1.2-1.3-1.2-2.3Z',
          fill: 'var(--dsw-alias-brand-primary)',
        }),
      );
    }

    /** Badge on a main-conversation row: number of open sub chats, opens the menu. */
    function SubchatRowAction(props) {
      const { sessionId, displayTitle, t, useSessions, useWorkspaces } = props;
      const session = useSessions((snapshot) => snapshot.byId[sessionId]);
      const rows = useSubchatRows(useSessions, useWorkspaces).filter((row) => row.parentSessionId === sessionId);
      if (rows.length === 0) {
        if (session !== undefined && session.origin === 'subagent') return null;
        return h(
          React.Fragment,
          null,
          h('style', null, SIDEBAR_CSS),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-hub-count',
              title: t('subchats.newShort'),
              'aria-label': `${t('subchats.newShort')}: ${displayTitle}`,
              'aria-haspopup': 'menu',
              'data-workspace-hub-toggle': 'true',
              onClick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleSubchatMenu(sessionId, event.currentTarget);
              },
            },
            h(SubchatGlyph, { size: 13 }),
            h('span', { className: 'n' }, '+'),
          ),
        );
      }
      const label = t('sidebar.subchats.count', { n: rows.length });
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-hub-count',
            title: `${label} — ${displayTitle}`,
            'aria-label': `${label}: ${displayTitle}`,
            'aria-haspopup': 'menu',
            'data-workspace-hub-toggle': 'true',
            onClick: (event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleSubchatMenu(sessionId, event.currentTarget);
            },
          },
          h(SubchatGlyph, { size: 13 }),
          h('span', { className: 'n' }, String(rows.length)),
        ),
      );
    }

    /** Always-visible leading glyph on a main-conversation row that has sub chats. */
    function SubchatLeading(props) {
      const { sessionId, t, useSessions, useWorkspaces } = props;
      const rows = useSubchatRows(useSessions, useWorkspaces).filter((row) => row.parentSessionId === sessionId);
      if (rows.length === 0) return null;
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-hub-leading',
            title: t('sidebar.subchats.count', { n: rows.length }),
            'aria-label': t('sidebar.subchats.count', { n: rows.length }),
            'aria-haspopup': 'menu',
            'data-workspace-hub-toggle': 'true',
            onClick: (event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleSubchatMenu(sessionId, event.currentTarget);
            },
          },
          h(SubchatGlyph, { size: 12 }),
        ),
      );
    }

    /** Hover-card section listing the row's sub chats. */
    function SubchatHover(props) {
      const { sessionId, t, useSessions, useWorkspaces } = props;
      const sessions = useSessions((state) => state.byId);
      const rows = useSubchatRows(useSessions, useWorkspaces).filter((row) => row.parentSessionId === sessionId);
      if (rows.length === 0) return null;
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'div',
          { className: 'dsh-hub-hover' },
          h('div', { className: 'dsh-hub-hover-head' }, `${t('sidebar.subchats')} · ${rows.length}`),
          rows.slice(0, 4).map((row) =>
            h(
              'div',
              { className: 'dsh-hub-hover-row', key: row.id },
              h('span', {
                className: `dsh-hub-dot ${sessions?.[row.id]?.running === true ? 'running' : 'doing'}`,
                'aria-hidden': true,
              }),
              h('span', { className: 'dsh-hub-hover-title' }, row.title || row.label),
            ),
          ),
        ),
      );
    }

    /** Frame-wide menu opened from the row badge; selecting a row opens that child. */
    function SubchatMenu(props) {
      const { t, useSessions, useWorkspaces } = props;
      const state = useSubchatMenu();
      const sessions = useSessions((snapshot) => snapshot.byId);
      const rows = useSubchatRows(useSessions, useWorkspaces).filter((row) => row.parentSessionId === state.sessionId);
      const ref = React.useRef(null);
      const [creating, setCreating] = React.useState(false);
      const [title, setTitle] = React.useState('');
      const [prompt, setPrompt] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [createError, setCreateError] = React.useState();
      React.useEffect(() => {
        if (!state.open) return;
        setCreating(false);
        setTitle('');
        setPrompt('');
        setCreateError(undefined);
      }, [state.open, state.sessionId]);
      const createSubchat = async () => {
        if (prompt.trim() === '' || busy) return;
        setBusy(true);
        setCreateError(undefined);
        try {
          await call('subchats.create', {
            sessionId: state.sessionId,
            parentSessionId: state.sessionId,
            title,
            prompt,
          });
          setCreating(false);
          setTitle('');
          setPrompt('');
          subchatCatalog.refresh();
        } catch (error) {
          setCreateError(String(error?.message ?? error));
        } finally {
          setBusy(false);
        }
      };
      React.useEffect(() => {
        if (!state.open) return undefined;
        const onPointerDown = (event) => {
          // Ignore the same gesture that opened the menu.
          if (Date.now() - (state.openedAt ?? 0) < 200) return;
          const target = event.target;
          if (target instanceof Element && target.closest('[data-workspace-hub-toggle]') !== null) return;
          if (ref.current !== null && !ref.current.contains(target)) closeSubchatMenu();
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') closeSubchatMenu();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, [state.open]);
      if (!state.open) return null;
      const width = 264;
      const estimated = 44 + Math.max(1, rows.length) * 34 + (creating ? 168 : 38);
      const top =
        state.rect.bottom + 6 + estimated > window.innerHeight
          ? Math.max(8, state.rect.top - estimated - 6)
          : state.rect.bottom + 6;
      const left = Math.max(8, Math.min(state.rect.right - width, window.innerWidth - width - 8));
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'div',
          { ref, className: 'dsh-hub-menu', role: 'menu', 'aria-label': t('sidebar.subchats'), style: { top, left, width } },
          h('div', { className: 'dsh-hub-menu-head' }, t('sidebar.subchats')),
          rows.length === 0
            ? h('div', { className: 'dsh-hub-menu-empty' }, t('menu.empty'))
            : rows.map((row) =>
                h(
                  'button',
                  {
                    key: row.id,
                    type: 'button',
                    role: 'menuitem',
                    className: 'dsh-hub-menu-row',
                    onClick: () => {
                      try {
                        openChildSession(row.id);
                      } catch (error) {
                        console.error('workspace-hub: open sub chat failed', error);
                      }
                      closeSubchatMenu();
                    },
                  },
                  h('span', {
                    className: `dsh-hub-dot ${sessions?.[row.id]?.running === true ? 'running' : 'doing'}`,
                    'aria-hidden': true,
                  }),
                  h('span', { className: 'dsh-hub-menu-title' }, row.title || row.label),
                  h('span', { className: 'dsh-hub-menu-open' }, t('menu.open')),
                ),
              ),
          h(
            'div',
            { className: 'dsh-hub-menu-foot' },
            createError === undefined ? null : h('div', { className: 'dsh-hub-menu-error' }, createError),
            creating
              ? h(
                  'div',
                  { className: 'dsh-hub-menu-form' },
                  h('input', {
                    className: 'dsh-hub-menu-input',
                    placeholder: t('subchats.titlePlaceholder'),
                    value: title,
                    maxLength: 120,
                    onChange: (event) => setTitle(event.target.value),
                  }),
                  h('textarea', {
                    className: 'dsh-hub-menu-textarea',
                    placeholder: t('subchats.promptPlaceholder'),
                    value: prompt,
                    autoFocus: true,
                    onChange: (event) => setPrompt(event.target.value),
                  }),
                  h(
                    'div',
                    { className: 'dsh-hub-menu-actions' },
                    h('button', { type: 'button', className: 'dsh-hub-menu-btn', onClick: () => setCreating(false) }, t('subchats.cancel')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-hub-menu-btn primary',
                        disabled: busy || prompt.trim() === '',
                        onClick: createSubchat,
                      },
                      t('subchats.create'),
                    ),
                  ),
                )
              : h(
                  'button',
                  { type: 'button', className: 'dsh-hub-menu-row dsh-hub-menu-new', onClick: () => setCreating(true) },
                  h('span', { className: 'dsh-hub-menu-title' }, t('subchats.newShort')),
                  h('span', { className: 'dsh-hub-menu-open' }, '+'),
                ),
          ),
        ),
      );
    }

    /** Leading-header button: opens the hub of the workspace being viewed. */
    function HubWorkspaceButton(props) {
      const { t, useSessions, useWorkspaces } = props;
      const tr = typeof t === 'function' ? t : translate;
      const scope = useScope(useSessions, useWorkspaces);
      const workspace = useWorkspaces((state) =>
        (state.items ?? []).find((entry) => entry.workspaceId === scope.workspaceId),
      );
      const where = workspace?.title ?? scope.workspacePath ?? '';
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-hub-headbtn',
            title: where === '' ? tr('panel.title') : `${tr('sidebar.board')} — ${where}`,
            onClick: () => selectHubPanel(scope.workspaceId),
          },
          h(Icon, { size: 14 }),
          h('span', null, tr('sidebar.boardShort')),
        ),
        h(ServerStatusPill, { t: tr, useSessions, useWorkspaces }),
      );
    }

    // =====================================================================
    // Console — pure helpers, hooks, and views.
    // Sidebar components above are unchanged; the panel below is the rebuild.
    // =====================================================================

    const VIEW_KEY = 'workspace-hub:view:v2:';
    const SKELETON_DELAY_MS = 300;
    const STUCK_MS = 30 * 60 * 1000;
    const STATUS_ORDER = ['todo', 'doing', 'blocked', 'done', 'cancelled'];
    const TASK_FILTERS = ['all', 'todo', 'doing', 'blocked', 'done', 'cancelled'];
    const SESSION_FILTERS = ['all', 'running', 'idle', 'unread'];

    const GLYPHS = {
      layers: [['path', { d: 'M12 3 21 8l-9 5-9-5Z' }], ['path', { d: 'M3 12l9 5 9-5' }], ['path', { d: 'M3 16l9 5 9-5' }]],
      grid: [
        ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }],
        ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }],
        ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }],
        ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }],
      ],
      tasks: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 4 }], ['path', { d: 'm8 12 3 3 5-6' }]],
      chat: [['path', { d: 'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-2.5-.4L4 21l1.3-4A7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z' }]],
      gear: [
        ['circle', { cx: 12, cy: 12, r: 3 }],
        ['path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' }],
      ],
      copy: [['rect', { x: 9, y: 9, width: 12, height: 12, rx: 2 }], ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]],
      command: [['path', { d: 'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z' }]],
      more: [
        ['circle', { cx: 5, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 12, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 19, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }],
      ],
      search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'm20 20-3.5-3.5' }]],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      play: [['path', { d: 'M8 5.4v13.2L18.4 12Z' }]],
      stop: [['rect', { x: 6, y: 6, width: 12, height: 12, rx: 2 }]],
      chevronRight: [['path', { d: 'm9 6 6 6-6 6' }]],
      chevronDown: [['path', { d: 'm6 9 6 6 6-6' }]],
      close: [['path', { d: 'M6 6l12 12M18 6 6 18' }]],
      arrowLeft: [['path', { d: 'M19 12H5M11 18l-6-6 6-6' }]],
      external: [['path', { d: 'M14 4h6v6' }], ['path', { d: 'M20 4 11 13' }], ['path', { d: 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }]],
      clock: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7v5.4l3.4 2' }]],
      ban: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M6 6l12 12' }]],
      checkCircle: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'm8.5 12 2.4 2.4 4.6-5' }]],
      circle: [['circle', { cx: 12, cy: 12, r: 8.5 }]],
      progress: [['circle', { cx: 12, cy: 12, r: 8.5, strokeWidth: 2, strokeDasharray: '40 14', transform: 'rotate(-90 12 12)' }]],
      alert: [['path', { d: 'M12 4 2.9 20h18.2Z' }], ['path', { d: 'M12 10v4.2M12 17.3h.01' }]],
      inbox: [['path', { d: 'M4 13h4l1.5 3h5L16 13h4' }], ['path', { d: 'M5.6 5h12.8l2.6 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z' }]],
      server: [['rect', { x: 3, y: 4, width: 18, height: 7, rx: 2 }], ['rect', { x: 3, y: 13, width: 18, height: 7, rx: 2 }], ['path', { d: 'M7 7.5h.01M7 16.5h.01' }]],
      refresh: [['path', { d: 'M20 12a8 8 0 1 1-2.3-5.6' }], ['path', { d: 'M20 4v4h-4' }]],
      quote: [['path', { d: 'M10 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3' }], ['path', { d: 'M20 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3' }]],
      file: [['path', { d: 'M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z' }], ['path', { d: 'M13 3v6h7' }]],
      lock: [['rect', { x: 4, y: 10, width: 16, height: 11, rx: 2 }], ['path', { d: 'M8 10V7a4 4 0 0 1 8 0v3' }]],
      stack: [['path', { d: 'M4 7h16M4 12h16M4 17h16' }]],
      dot: [['circle', { cx: 12, cy: 12, r: 3, fill: 'currentColor', stroke: 'none' }]],
    };

    function Glyph(props) {
      const size = props.size ?? 16;
      const body = GLYPHS[props.name] ?? GLYPHS.dot;
      return h(
        'svg',
        {
          className: 'wh-ic',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        body.map((entry, index) => h(entry[0], { key: index, ...entry[1] })),
      );
    }

    function statusGlyphName(status) {
      if (status === 'done') return 'checkCircle';
      if (status === 'doing') return 'progress';
      if (status === 'blocked') return 'alert';
      if (status === 'cancelled') return 'ban';
      return 'circle';
    }

    function emptyViewState() {
      return {
        nav: 'overview',
        filter: 'all',
        query: '',
        group: 'status',
        sessionFilter: 'all',
        sessionQuery: '',
        showClosed: false,
        expanded: [],
        expandedSessions: [],
        collapsed: ['done'],
        seen: {},
        settingsGroup: 'rules',
      };
    }

    function localStore() {
      try {
        const target = typeof window === 'undefined' ? undefined : window;
        return target?.localStorage;
      } catch {
        return undefined;
      }
    }

    function loadViewState(workspaceId) {
      const fallback = emptyViewState();
      if (workspaceId === undefined || workspaceId === null) return fallback;
      try {
        const raw = localStore()?.getItem(VIEW_KEY + workspaceId);
        if (typeof raw !== 'string' || raw === '') return fallback;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
        const list = (value, limit) =>
          Array.isArray(value) ? value.filter((entry) => typeof entry === 'string').slice(0, limit) : undefined;
        const seen = {};
        if (parsed.seen !== null && typeof parsed.seen === 'object' && !Array.isArray(parsed.seen)) {
          for (const [key, value] of Object.entries(parsed.seen).slice(0, 200)) {
            if (typeof key === 'string' && typeof value === 'number' && Number.isFinite(value)) seen[key] = value;
          }
        }
        return {
          nav: ['overview', 'tasks', 'sessions'].includes(parsed.nav) ? parsed.nav : fallback.nav,
          filter: TASK_FILTERS.includes(parsed.filter) ? parsed.filter : fallback.filter,
          query: typeof parsed.query === 'string' ? parsed.query.slice(0, 200) : fallback.query,
          group: ['status', 'priority', 'none'].includes(parsed.group) ? parsed.group : fallback.group,
          sessionFilter: SESSION_FILTERS.includes(parsed.sessionFilter) ? parsed.sessionFilter : fallback.sessionFilter,
          sessionQuery: typeof parsed.sessionQuery === 'string' ? parsed.sessionQuery.slice(0, 200) : '',
          showClosed: parsed.showClosed === true,
          expanded: list(parsed.expanded, 20) ?? [],
          expandedSessions: list(parsed.expandedSessions, 20) ?? [],
          collapsed: list(parsed.collapsed, 10) ?? ['done'],
          seen,
          settingsGroup: ['rules', 'context', 'skills'].includes(parsed.settingsGroup) ? parsed.settingsGroup : 'rules',
        };
      } catch {
        return fallback;
      }
    }

    function saveViewState(workspaceId, view) {
      if (workspaceId === undefined || workspaceId === null) return;
      try {
        localStore()?.setItem(VIEW_KEY + workspaceId, JSON.stringify(view));
      } catch {
        /* private mode or quota — view state is best-effort */
      }
    }

    function countTasks(tasks) {
      const counts = { all: 0, todo: 0, doing: 0, blocked: 0, done: 0, cancelled: 0 };
      for (const task of tasks ?? []) {
        counts.all += 1;
        if (typeof task?.status === 'string' && counts[task.status] !== undefined) counts[task.status] += 1;
      }
      return counts;
    }

    /** Merge a new snapshot into the previous one, keeping row order stable. */
    function mergeSnapshots(previous, next) {
      if (previous === undefined || previous === null) return next;
      if (next === undefined || next === null) return previous;
      const nextTasks = Array.isArray(next?.board?.tasks) ? next.board.tasks : [];
      const nextById = new Map(nextTasks.map((task) => [task.id, task]));
      const merged = [];
      for (const task of previous?.board?.tasks ?? []) {
        const incoming = nextById.get(task.id);
        if (incoming === undefined) continue;
        merged.push({ ...task, ...incoming });
        nextById.delete(task.id);
      }
      for (const task of nextTasks) {
        const remaining = nextById.get(task.id);
        if (remaining !== undefined) {
          merged.push(remaining);
          nextById.delete(task.id);
        }
      }
      return {
        ...next,
        workspace: next.workspace ?? previous.workspace,
        board: { ...(next.board ?? {}), tasks: merged },
        sessions: next.sessions ?? previous.sessions,
        servers: next.servers ?? previous.servers,
        meta: { ...(previous.meta ?? {}), ...(next.meta ?? {}) },
        generatedAt: typeof next.generatedAt === 'number' ? next.generatedAt : previous.generatedAt,
      };
    }

    function patchTaskInData(data, taskId, patch) {
      if (data === undefined || data === null) return data;
      let found = false;
      const tasks = (data.board?.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task;
        found = true;
        return { ...task, ...(typeof patch === 'function' ? patch(task) : patch) };
      });
      if (found !== true) return data;
      return { ...data, board: { ...(data.board ?? {}), tasks, counts: countTasks(tasks) } };
    }

    function removeTaskFromData(data, taskId) {
      if (data === undefined || data === null) return data;
      const tasks = (data.board?.tasks ?? []).filter((task) => task.id !== taskId);
      return { ...data, board: { ...(data.board ?? {}), tasks, counts: countTasks(tasks) } };
    }

    function insertTaskIntoData(data, task, index) {
      if (data === undefined || data === null) return data;
      const tasks = [...(data.board?.tasks ?? [])];
      const at = typeof index === 'number' ? Math.max(0, Math.min(tasks.length, index)) : 0;
      tasks.splice(at, 0, task);
      return { ...data, board: { ...(data.board ?? {}), tasks, counts: countTasks(tasks) } };
    }

    function patchSubchatInData(data, subchatId, patch) {
      if (data === undefined || data === null) return data;
      let found = false;
      const sessions = (data.sessions?.sessions ?? []).map((session) => {
        const subchats = (session.subchats ?? []).map((subchat) => {
          if (subchat.id !== subchatId) return subchat;
          found = true;
          return { ...subchat, ...(typeof patch === 'function' ? patch(subchat) : patch) };
        });
        return found ? { ...session, subchats } : session;
      });
      if (found !== true) return data;
      return { ...data, sessions: { ...(data.sessions ?? {}), sessions } };
    }

    function findTaskInData(data, taskId) {
      return (data?.board?.tasks ?? []).find((task) => task.id === taskId);
    }

    function findConversation(data, sessionId) {
      for (const session of data?.sessions?.sessions ?? []) {
        if (session.sessionId === sessionId) return { session, subchat: undefined };
        for (const subchat of session.subchats ?? []) {
          if (subchat.id === sessionId) return { session, subchat };
        }
      }
      return undefined;
    }

    function executorOf(data, task, scopeSessionId) {
      const assignee = task?.assignee ?? null;
      if (assignee === null || typeof assignee?.sessionId !== 'string') {
        return { kind: 'unassigned', sessionId: undefined, running: false };
      }
      const sessionId = assignee.sessionId;
      if (sessionId.startsWith('pending:')) return { kind: 'pending', sessionId: undefined, running: false };
      const found = findConversation(data, sessionId);
      const title = typeof assignee.title === 'string' && assignee.title !== '' ? assignee.title : found?.subchat?.title ?? found?.session?.title ?? '';
      if (sessionId === scopeSessionId) return { kind: 'you', sessionId, title, running: found?.subchat?.status === 'running' || found?.session?.running === true };
      return {
        kind: 'session',
        sessionId,
        title,
        running: found?.subchat?.status === 'running' || found?.session?.running === true,
      };
    }

    function lastNoteText(task) {
      const notes = Array.isArray(task?.notes) ? task.notes : [];
      for (let index = notes.length - 1; index >= 0; index -= 1) {
        if (typeof notes[index]?.text === 'string' && notes[index].text !== '') return notes[index].text;
      }
      return '';
    }

    function activityOf(data, task) {
      const note = lastNoteText(task);
      if (note !== '') return note;
      const sessionId = task?.assignee?.sessionId;
      if (typeof sessionId !== 'string' || sessionId.startsWith('pending:')) return '';
      const found = findConversation(data, sessionId);
      const reply = found?.subchat?.lastAssistantMessage ?? found?.session?.lastAssistantMessage;
      return typeof reply === 'string' ? reply : '';
    }

    function subchatUnread(subchat, seen) {
      if (subchat === null || subchat === undefined) return false;
      if (subchat.status === 'closed') return false;
      if (Number(subchat.unread ?? 0) > 0) return true;
      const at = Number(subchat.updatedAt ?? 0);
      if (!Number.isFinite(at) || at <= 0) return false;
      const last = Number(seen?.[subchat.id] ?? 0);
      return at > last && typeof subchat.lastAssistantMessage === 'string' && subchat.lastAssistantMessage !== '';
    }

    function sessionUnreadCount(session, seen) {
      let count = 0;
      for (const subchat of session?.subchats ?? []) if (subchatUnread(subchat, seen)) count += 1;
      return count;
    }

    function serverPhase(server) {
      if (server === null || server === undefined) return 'stopped';
      if (server.status === 'failed' || (server.running !== true && typeof server.error === 'string' && server.error !== '')) return 'failed';
      if (server.external === true) return 'external';
      if (server.running === true && server.ready === true) return 'ready';
      if (server.running === true || server.status === 'starting') return 'starting';
      return 'stopped';
    }

    function serverTone(phase) {
      if (phase === 'ready') return 'ok';
      if (phase === 'failed') return 'failed';
      if (phase === 'starting' || phase === 'external') return 'warn';
      return 'idle';
    }

    function serverCounts(servers) {
      let ready = 0;
      let total = 0;
      for (const server of servers ?? []) {
        if (server.configured === false) continue;
        total += 1;
        if (serverPhase(server) === 'ready') ready += 1;
      }
      return { ready, total };
    }

    function formatElapsed(t, startedAt) {
      const ms = typeof startedAt === 'number' ? Math.max(0, Date.now() - startedAt) : 0;
      const seconds = Math.round(ms / 1000);
      if (seconds < 60) return t('time.shortSec', { n: seconds });
      return t('time.shortMin', { n: Math.round(seconds / 60) });
    }

    function fuzzyScore(label, query) {
      const text = String(label ?? '').toLowerCase();
      const needle = String(query ?? '').trim().toLowerCase();
      if (needle === '') return 1;
      if (!text.includes(needle)) return 0;
      return text.startsWith(needle) ? 3 : 2;
    }

    function filterTasks(tasks, filter, query) {
      const needle = String(query ?? '').trim().toLowerCase();
      return (tasks ?? []).filter((task) => {
        if (filter !== 'all' && task.status !== filter) return false;
        if (needle === '') return true;
        return `${task.title ?? ''} ${task.detail ?? ''}`.toLowerCase().includes(needle);
      });
    }

    function groupTasks(tasks, group) {
      if (group === 'priority') {
        return ['high', 'normal', 'low']
          .map((priority) => ({ key: priority, rows: tasks.filter((task) => task.priority === priority) }))
          .filter((reply) => reply.rows.length > 0);
      }
      if (group === 'none') return tasks.length === 0 ? [] : [{ key: 'all', rows: tasks }];
      return STATUS_ORDER.map((status) => ({ key: status, rows: tasks.filter((task) => task.status === status) })).filter(
        (reply) => reply.rows.length > 0,
      );
    }

    function collectAttention(data, t, scopeSessionId, seen) {
      const items = [];
      const tasks = data?.board?.tasks ?? [];
      const now = Date.now();
      for (const task of tasks) {
        if (task.status !== 'blocked') continue;
        items.push({
          key: 'blocked:' + task.id,
          priority: 0,
          kind: 'task',
          icon: 'alert',
          taskId: task.id,
          title: task.title,
          reason: t('attn.blockedReason'),
          action: t('attn.openTask'),
          actionKind: 'openTask',
        });
      }
      for (const task of tasks) {
        if (task.status !== 'doing') continue;
        const executor = executorOf(data, task, scopeSessionId);
        if (executor.kind === 'pending' || executor.sessionId === undefined) continue;
        const found = findConversation(data, executor.sessionId);
        if (found === undefined) continue;
        const running = found.subchat !== undefined ? found.subchat.status === 'running' : found.session.running === true;
        if (running) continue;
        const at = Number(task.lastActivityAt ?? task.updatedAt ?? 0);
        if (now - at > STUCK_MS) {
          items.push({
            key: 'stuck:' + task.id,
            priority: 1,
            kind: 'task',
            icon: 'clock',
            taskId: task.id,
            title: task.title,
            reason: t('attn.stuckReason', { time: relative(t, at) }),
            action: t('attn.requeue'),
            actionKind: 'requeue',
          });
        } else {
          items.push({
            key: 'settled:' + task.id,
            priority: 2,
            kind: 'task',
            icon: 'checkCircle',
            taskId: task.id,
            title: task.title,
            reason: t('attn.settledReason'),
            action: t('attn.confirm'),
            actionKind: 'confirm',
          });
        }
      }
      for (const task of tasks) {
        if (task.status !== 'todo' || task.priority !== 'high') continue;
        if (task.assignee !== null && task.assignee !== undefined) continue;
        items.push({
          key: 'high:' + task.id,
          priority: 3,
          kind: 'task',
          icon: 'inbox',
          taskId: task.id,
          title: task.title,
          reason: t('attn.highReason'),
          action: t('attn.claim'),
          actionKind: 'claim',
        });
      }
      for (const session of data?.sessions?.sessions ?? []) {
        for (const subchat of session.subchats ?? []) {
          if (!subchatUnread(subchat, seen)) continue;
          items.push({
            key: 'unread:' + subchat.id,
            priority: 4,
            kind: 'session',
            icon: 'chat',
            sessionId: session.sessionId,
            subchatId: subchat.id,
            title: session.title || t('sessions.untitled'),
            reason: t('attn.unreadReason', { title: subchat.title || t('sessions.untitled') }),
            action: t('attn.view'),
            actionKind: 'openSession',
          });
        }
      }
      for (const server of data?.servers?.servers ?? []) {
        const phase = serverPhase(server);
        if (phase !== 'failed') continue;
        items.push({
          key: 'server:' + server.name,
          priority: 5,
          kind: 'server',
          icon: 'server',
          serverName: server.name,
          title: server.name,
          reason: t('attn.serverReason', { state: t('env.phase.failed') }),
          action: t('attn.logs'),
          actionKind: 'serverLogs',
        });
      }
      items.sort((left, right) => left.priority - right.priority);
      return items;
    }

    function isTypingTarget(target) {
      if (target === null || target === undefined) return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return target.isContentEditable === true;
    }

    function focusedRowElement() {
      const active = typeof document === 'undefined' ? null : document.activeElement;
      if (active === null || active === undefined || typeof active.closest !== 'function') return null;
      return active.closest('[data-wh-row]');
    }

    function trapTab(event, root) {
      if (root === null || root === undefined) return;
      const nodes = Array.from(
        root.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey === true && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (event.shiftKey !== true && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function copyText(text) {
      try {
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
        if (clipboard !== undefined && typeof clipboard.writeText === 'function') {
          void clipboard.writeText(text);
          return true;
        }
      } catch {
        /* clipboard unavailable */
      }
      return false;
    }

    function openExternalUrl(url) {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        /* blocked popup — the URL stays visible in the row */
      }
    }

    function messageOf(error) {
      return String(error?.message ?? error ?? '');
    }

    /**
     * Data layer: one snapshot request per tick, a legacy three-call fallback
     * for an older Host, merge-by-id, visibility pause and exponential backoff.
     */
    function useHubSnapshot(scope, legacyHooks) {
      const key =
        scope.sessionId === undefined && scope.workspaceId === undefined && scope.workspacePath === undefined
          ? ''
          : `${scope.sessionId ?? ''}|${scope.workspaceId ?? ''}|${scope.workspacePath ?? ''}`;
      const [state, setState] = React.useState({
        data: undefined,
        loading: true,
        error: undefined,
        stale: false,
        generatedAt: null,
        conflict: undefined,
      });
      const stateRef = React.useRef(state);
      stateRef.current = state;
      const tickRef = React.useRef(null);
      const optimisticRef = React.useRef(0);
      const missingRef = React.useRef(false);
      const legacyRef = React.useRef(legacyHooks);
      legacyRef.current = legacyHooks;

      React.useEffect(() => {
        if (key === '') {
          setState((current) => ({ ...current, loading: false, stale: false, data: undefined }));
          return undefined;
        }
        let alive = true;
        let timer = null;
        let busy = false;
        let failures = 0;
        const base = () => ({ sessionId: scope.sessionId, workspaceId: scope.workspaceId, workspacePath: scope.workspacePath });
        const schedule = (ms) => {
          if (timer !== null) clearTimeout(timer);
          timer = setTimeout(tick, ms);
        };
        const readLegacy = async () => {
          const readServers = typeof legacyRef.current?.servers === 'function'
            ? legacyRef.current.servers
            : () => call('servers.status', base()).catch(() => undefined);
          const [context, listed, conversations, servers] = await Promise.all([
            call('context', base()),
            call('tasks.list', base()),
            call('hub.sessions', base()),
            Promise.resolve(readServers()).catch(() => undefined),
          ]);
          return {
            generatedAt: Date.now(),
            workspace: context?.workspace ?? listed?.workspace ?? conversations?.workspace ?? {
              id: scope.workspaceId ?? null,
              title: scope.workspaceTitle ?? null,
              path: scope.workspacePath ?? '',
            },
            board: listed?.board,
            sessions: {
              workspace: conversations?.workspace ?? context?.workspace ?? null,
              sessions: Array.isArray(conversations?.sessions) ? conversations.sessions : [],
            },
            servers: servers ?? { path: null, source: null, configured: false, servers: [] },
            meta: { sessionsCoarse: true, serversProbedAt: null },
          };
        };
        const read = async () => {
          if (missingRef.current !== true) {
            try {
              return await call('hub.snapshot', base());
            } catch (error) {
              const code = error?.code;
              const message = String(error?.message ?? '');
              if (code === 'unknown-method' || code === 'bad-response' || /unknown-method|\b404\b/.test(message)) {
                missingRef.current = true;
              } else {
                throw error;
              }
            }
          }
          return readLegacy();
        };
        const tick = async (manual) => {
          if (alive !== true || busy === true) return;
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && manual !== true) {
            schedule(4000);
            return;
          }
          busy = true;
          try {
            const value = await read();
            if (alive !== true) return;
            failures = 0;
            setState((current) => ({
              ...current,
              loading: false,
              stale: false,
              error: undefined,
              generatedAt: typeof value?.generatedAt === 'number' ? value.generatedAt : Date.now(),
              // A row mutation in flight owns its optimistic value until it settles;
              // the post-write refresh picks the authoritative snapshot up.
              data: optimisticRef.current > 0 ? current.data : mergeSnapshots(current.data, value),
            }));
          } catch (error) {
            if (alive !== true) return;
            failures += 1;
            setState((current) => ({
              ...current,
              loading: false,
              stale: current.data !== undefined,
              error: messageOf(error),
            }));
          } finally {
            busy = false;
            if (alive === true) schedule(failures === 0 ? 4000 : Math.min(30000, 4000 * 2 ** Math.min(failures, 3)));
          }
        };
        tickRef.current = (manual) => tick(manual === true);
        const onVisibility = () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            const run = tickRef.current;
            if (typeof run === 'function') void run(true);
          }
        };
        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
        schedule(0);
        return () => {
          alive = false;
          if (timer !== null) clearTimeout(timer);
          if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
          tickRef.current = null;
        };
      }, [key]);

      const refresh = React.useCallback((manual) => {
        const run = tickRef.current;
        if (typeof run !== 'function') return Promise.resolve();
        return Promise.resolve(run(manual !== false)).catch(() => undefined);
      }, []);

      const runOptimistic = React.useCallback(async (transform, request, rollback) => {
        const before = stateRef.current.data;
        optimisticRef.current += 1;
        setState((current) => ({ ...current, data: transform(current.data), conflict: undefined }));
        try {
          const value = await request();
          optimisticRef.current = Math.max(0, optimisticRef.current - 1);
          void refresh(false);
          return { ok: true, value };
        } catch (error) {
          optimisticRef.current = Math.max(0, optimisticRef.current - 1);
          const conflictTask = error?.code === 'stale-revision' ? error?.details?.task : undefined;
          if (conflictTask !== undefined && conflictTask !== null) {
            setState((current) => {
              const rows = current.data?.board?.tasks ?? [];
              const present = rows.some((row) => row.id === conflictTask.id);
              return {
                ...current,
                // A deleted row has no place to render a conflict banner; put it
                // back so the user can resolve it instead of leaving a ghost gap.
                data: present
                  ? patchTaskInData(current.data ?? before, conflictTask.id, conflictTask)
                  : typeof rollback === 'function'
                    ? rollback(current.data)
                    : before,
                conflict: { taskId: conflictTask.id, task: conflictTask, retry: request, transform, rollback },
              };
            });
            return { ok: false, error, conflict: true };
          }
          setState((current) => ({
            ...current,
            // Roll back only what this write changed when the caller can describe
            // it; a full-snapshot swap would drop concurrent rows.
            data: typeof rollback === 'function' ? rollback(current.data) : before,
            error: messageOf(error),
          }));
          return { ok: false, error };
        }
      }, [refresh]);

      const mutateTask = React.useCallback(
        (taskId, patch, request) => {
          const previous = findTaskInData(stateRef.current.data, taskId);
          return runOptimistic(
            (data) => patchTaskInData(data, taskId, patch),
            request,
            (data) => (previous === undefined ? data : patchTaskInData(data, taskId, previous)),
          );
        },
        [runOptimistic],
      );
      const mutateData = React.useCallback(
        (transform, request, rollback) => runOptimistic(transform, request, rollback),
        [runOptimistic],
      );
      const clearConflict = React.useCallback(() => {
        setState((current) => ({ ...current, conflict: undefined }));
      }, []);
      const retryConflict = React.useCallback(() => {
        const conflict = stateRef.current.conflict;
        if (conflict === undefined) return Promise.resolve();
        setState((current) => ({ ...current, conflict: undefined }));
        return runOptimistic(conflict.transform, conflict.retry, conflict.rollback);
      }, [runOptimistic]);

      return { ...state, refresh, mutateTask, mutateData, clearConflict, retryConflict, getData: () => stateRef.current.data };
    }

    function useViewState(workspaceKey, workspaceId) {
      const [view, setViewState] = React.useState(() => loadViewState(workspaceId));
      const keyRef = React.useRef(workspaceKey);
      React.useEffect(() => {
        if (keyRef.current === workspaceKey) return;
        keyRef.current = workspaceKey;
        setViewState(loadViewState(workspaceId));
      }, [workspaceKey, workspaceId]);
      React.useEffect(() => {
        saveViewState(workspaceId, view);
      }, [workspaceId, view]);
      return [view, setViewState];
    }

    function useDelayedFlag(active, delay) {
      const [on, setOn] = React.useState(false);
      React.useEffect(() => {
        if (active !== true) {
          setOn(false);
          return undefined;
        }
        const timer = setTimeout(() => setOn(true), delay);
        return () => clearTimeout(timer);
      }, [active, delay]);
      return on;
    }

    function OverlayDialog(props) {
      const panelRef = React.useRef(null);
      React.useEffect(() => {
        const node = panelRef.current;
        if (node === null || node === undefined) return;
        const target = node.querySelector('[data-wh-autofocus]') ?? node;
        try {
          target.focus({ preventScroll: true });
        } catch {
          /* focus is best-effort */
        }
      }, []);
      const onKeyDown = (event) => {
        if (event.key === 'Tab') {
          trapTab(event, panelRef.current);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          props.onClose();
        }
      };
      return h(
        'div',
        {
          className: 'wh-overlay' + (props.palette === true ? ' wh-overlay-palette' : ''),
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) props.onClose();
          },
        },
        h(
          'div',
          {
            ref: panelRef,
            className: 'wh-dialog ' + (props.className ?? ''),
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': props.label,
            tabIndex: -1,
            onKeyDown,
          },
          props.children,
        ),
      );
    }

    function useWorkspaceInfo(base) {
      const [state, setState] = React.useState({ info: undefined, loading: true, error: undefined });
      const load = React.useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: undefined }));
        try {
          const value = await call('hub.workspace', base);
          setState({ info: value, loading: false, error: undefined });
        } catch (error) {
          setState((current) => ({ ...current, loading: false, error: messageOf(error) }));
        }
      }, [base.sessionId, base.workspaceId, base.workspacePath]);
      React.useEffect(() => {
        void load();
      }, [load]);
      return { ...state, reload: load };
    }

    function SettingsView(props) {
      const { t, base, pushToast, onBack, onDirtyChange } = props;
      const { info, loading, error, reload } = useWorkspaceInfo(base);
      const [rulesDraft, setRulesDraft] = React.useState('');
      const [contextDraft, setContextDraft] = React.useState('');
      const [hydrated, setHydrated] = React.useState(false);
      const [saving, setSaving] = React.useState({ rules: false, context: false, skill: false });
      const [saved, setSaved] = React.useState({ rules: false, context: false });
      const [skillQuery, setSkillQuery] = React.useState('');
      const [skillForm, setSkillForm] = React.useState({ open: false, name: '', description: '', body: '' });
      React.useEffect(() => {
        if (info === undefined) return;
        setRulesDraft(info.files?.rulesContent ?? '');
        setContextDraft(info.files?.contextContent ?? '');
        setHydrated(true);
      }, [info]);
      const rulesDirty = hydrated === true && rulesDraft !== (info?.files?.rulesContent ?? '');
      const contextDirty = hydrated === true && contextDraft !== (info?.files?.contextContent ?? '');
      const settingsDirty = rulesDirty === true || contextDirty === true || skillForm.name.trim() !== '' || skillForm.description.trim() !== '' || skillForm.body.trim() !== '';
      React.useEffect(() => {
        onDirtyChange?.(settingsDirty);
      }, [settingsDirty, onDirtyChange]);
      React.useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
      const saveRules = async () => {
        setSaving((current) => ({ ...current, rules: true }));
        setSaved((current) => ({ ...current, rules: false }));
        try {
          await call('workspace.rules.save', { ...base, content: rulesDraft });
          setSaved((current) => ({ ...current, rules: true }));
          pushToast(t('settings.saveRulesDone'));
          await reload();
        } catch (failure) {
          pushToast(t('settings.saveFailed', { message: messageOf(failure) }), { error: true });
        } finally {
          setSaving((current) => ({ ...current, rules: false }));
        }
      };
      const saveContext = async () => {
        setSaving((current) => ({ ...current, context: true }));
        setSaved((current) => ({ ...current, context: false }));
        try {
          await call('workspace.context.save', { ...base, content: contextDraft });
          setSaved((current) => ({ ...current, context: true }));
          pushToast(t('settings.saveContextDone'));
          await reload();
        } catch (failure) {
          pushToast(t('settings.saveFailed', { message: messageOf(failure) }), { error: true });
        } finally {
          setSaving((current) => ({ ...current, context: false }));
        }
      };
      const createSkill = async () => {
        setSaving((current) => ({ ...current, skill: true }));
        try {
          await call('workspace.skill.create', {
            ...base,
            name: skillForm.name,
            description: skillForm.description,
            body: skillForm.body,
          });
          setSkillForm({ open: false, name: '', description: '', body: '' });
          pushToast(t('settings.skillCreated'));
          await reload();
        } catch (failure) {
          pushToast(t('settings.saveFailed', { message: messageOf(failure) }), { error: true });
        } finally {
          setSaving((current) => ({ ...current, skill: false }));
        }
      };
      const saveAll = () => {
        if (rulesDirty === true) void saveRules();
        if (contextDirty === true) void saveContext();
      };
      const onKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          saveAll();
        }
      };
      const sourceLabel = (source) => {
        const value = String(source ?? '');
        if (value.startsWith('user')) return t('settings.skillSource.user');
        if (value.startsWith('project') || value === 'workspace') return t('settings.skillSource.project');
        if (value === 'bundled') return t('settings.skillSource.bundled');
        if (value === 'custom') return t('settings.skillSource.custom');
        return t('settings.skillSource.unknown');
      };
      const fileState = (entry) => (entry.exists === true ? `${entry.bytes ?? 0} B` : t('workspace.missing'));
      const editableRule = (info?.project ?? []).find(
        (entry) => entry.display === 'AGENTS.md' || (typeof info?.projectRoot === 'string' && entry.path === `${info.projectRoot}/AGENTS.md`),
      );
      const fileRow = (entry, name) =>
        h(
          'div',
          { className: 'wh-row wh-rule-row', key: `${entry.path}-${name}` },
          h('span', { className: 'wh-rule-ic' }, h(Glyph, { name: 'file', size: 15 })),
          h('span', { className: 'wh-rule-path', title: entry.path }, name),
          h('span', { className: 'wh-rule-bytes wh-num' }, fileState(entry)),
          h(
            'span',
            { className: 'wh-rule-edit' },
            editableRule !== undefined && entry.path === editableRule.path
              ? h(React.Fragment, null, h(Glyph, { name: 'file', size: 12 }), t('settings.editable'))
              : h(React.Fragment, null, h(Glyph, { name: 'lock', size: 12 }), t('settings.readOnly')),
          ),
        );
      const dirtyBadge = (dirty) => (dirty === true ? h('span', { className: 'wh-dirty' }, h('span', { className: 'wh-dot warn', 'aria-hidden': true }), t('settings.dirty')) : null);
      const saveState = (name, dirty) => {
        if (saving[name] === true) return h('span', { className: 'wh-saving' }, t('settings.saving'));
        if (dirty !== true && saved[name] === true) return h('span', { className: 'wh-saved' }, h(Glyph, { name: 'checkCircle', size: 12 }), t('settings.saved'));
        return null;
      };
      const skills = info?.skills ?? [];
      const needle = skillQuery.trim().toLowerCase();
      const visibleSkills = needle === '' ? skills : skills.filter((skill) => `${skill.name} ${skill.description ?? ''}`.toLowerCase().includes(needle));
      const body = () => {
        if (info === undefined) {
          return error === undefined
            ? h('div', { className: 'wh-empty' }, h('div', { className: 'wh-empty-sub' }, t('panel.loading')))
            : h(
                'div',
                { className: 'wh-empty' },
                h(Glyph, { name: 'alert', size: 24 }),
                h('div', { className: 'wh-empty-title' }, t('panel.error')),
                h('div', { className: 'wh-empty-sub' }, t('settings.loadFailed', { message: error })),
                h('button', { className: 'wh-btn primary', onClick: () => void reload() }, t('settings.retry')),
              );
        }
        return h(
          'div',
          { className: 'wh-view wh-settings', onKeyDown },
          h(
            'div',
            { className: 'wh-scroll' },
            h('h1', { className: 'wh-page-title' }, t('settings.title')),
            h('p', { className: 'wh-page-sub' }, t('settings.sub')),
            h('div', { className: 'wh-mono wh-muted', style: { marginBottom: 14 } }, `${t('settings.projectRoot')}: ${info.projectRoot ?? ''}`),
            h(
              'section',
              { className: 'wh-set-sec' },
              h(
                'div',
                { className: 'wh-set-hd' },
                h('h2', null, t('settings.rules')),
                h('span', { className: 'wh-hint' }, t('settings.rulesHint', { n: (info.global?.length ?? 0) + (info.project?.length ?? 0) })),
              ),
              h(
                'div',
                { className: 'wh-group' },
                (info.global ?? []).map((entry) => fileRow(entry, entry.label === 'dsh' ? '~/.dsh/AGENTS.md' : '~/.agents/AGENTS.md')),
                (info.project ?? []).map((entry) => fileRow(entry, entry.display ?? entry.path)),
                (info.global ?? []).length + (info.project ?? []).length === 0
                  ? h('div', { className: 'wh-empty-line' }, t('settings.rulesEmpty'))
                  : null,
              ),
              editableRule === undefined
                ? h('div', { className: 'wh-empty-line' }, t('settings.noEditableRule'))
                : h(
                'div',
                { className: 'wh-editor' },
                h(
                  'div',
                  { className: 'wh-ed-hd' },
                  h('span', { className: 'wh-ed-path' }, t('settings.workspaceRules')),
                  dirtyBadge(rulesDirty),
                  saveState('rules', rulesDirty),
                ),
                h('textarea', {
                  className: 'wh-mono-input',
                  spellCheck: false,
                  'aria-label': t('settings.workspaceRules'),
                  value: rulesDraft,
                  onChange: (event) => setRulesDraft(event.target.value),
                }),
                h(
                  'div',
                  { className: 'wh-ed-foot' },
                  h('span', null, t('settings.rulesFileHint')),
                  h('span', { className: 'wh-spacer' }),
                  h('span', { className: 'wh-hint' }, t('settings.kbdSave')),
                  h(
                    'button',
                    { className: 'wh-btn sm', disabled: saving.rules === true || rulesDirty !== true, onClick: () => void saveRules() },
                    saving.rules === true ? t('settings.saving') : t('settings.saveRules'),
                  ),
                ),
              ),
            ),
            h(
              'section',
              { className: 'wh-set-sec' },
              h(
                'div',
                { className: 'wh-set-hd' },
                h('h2', null, t('settings.context')),
                h('span', { className: 'wh-hint' }, t('settings.contextHint', { n: (info.files?.contextContent ?? '').length })),
              ),
              h(
                'div',
                { className: 'wh-group' },
                h(
                  'div',
                  { className: 'wh-editor', style: { borderTop: 0 } },
                  h('div', { className: 'wh-ed-hd' }, h('span', { className: 'wh-ed-path' }, 'CONTEXT.md'), dirtyBadge(contextDirty), saveState('context', contextDirty)),
                  h('textarea', {
                    className: 'wh-mono-input',
                    spellCheck: false,
                    'aria-label': t('settings.context'),
                    placeholder: t('settings.contextPlaceholder'),
                    value: contextDraft,
                    onChange: (event) => setContextDraft(event.target.value),
                  }),
                  h(
                    'div',
                    { className: 'wh-ed-foot' },
                    h('span', null, t('settings.contextEffect')),
                    h('span', { className: 'wh-spacer' }),
                    h('span', { className: 'wh-hint' }, t('settings.kbdSave')),
                    h(
                      'button',
                      { className: 'wh-btn sm', disabled: saving.context === true || contextDirty !== true, onClick: () => void saveContext() },
                      saving.context === true ? t('settings.saving') : t('settings.saveContext'),
                    ),
                  ),
                ),
              ),
            ),
            h(
              'section',
              { className: 'wh-set-sec' },
              h(
                'div',
                { className: 'wh-set-hd' },
                h('h2', null, t('settings.skills')),
                h('span', { className: 'wh-hint' }, t('settings.skillsHint', { n: skills.length })),
                h('span', { className: 'wh-spacer' }),
                h(
                  'button',
                  { className: 'wh-btn sm', onClick: () => setSkillForm((current) => ({ ...current, open: current.open !== true })) },
                  h(Glyph, { name: 'plus', size: 12 }),
                  t('settings.newSkill'),
                ),
              ),
              h(
                'div',
                { className: 'wh-field wh-set-search' },
                h(Glyph, { name: 'search', size: 14 }),
                h('input', {
                  className: 'wh-input',
                  value: skillQuery,
                  placeholder: t('settings.skillSearch'),
                  'aria-label': t('settings.skillSearch'),
                  onChange: (event) => setSkillQuery(event.target.value),
                }),
              ),
              skillForm.open === true
                ? h(
                    'div',
                    { className: 'wh-create-sub wh-skill-form' },
                    h('input', {
                      className: 'wh-input',
                      value: skillForm.name,
                      placeholder: t('settings.skillName'),
                      'aria-label': t('settings.skillName'),
                      onChange: (event) => setSkillForm((current) => ({ ...current, name: event.target.value })),
                    }),
                    h('input', {
                      className: 'wh-input',
                      value: skillForm.description,
                      placeholder: t('settings.skillDescription'),
                      'aria-label': t('settings.skillDescription'),
                      onChange: (event) => setSkillForm((current) => ({ ...current, description: event.target.value })),
                    }),
                    h('textarea', {
                      className: 'wh-textarea',
                      value: skillForm.body,
                      placeholder: t('settings.skillBody'),
                      'aria-label': t('settings.skillBody'),
                      onChange: (event) => setSkillForm((current) => ({ ...current, body: event.target.value })),
                    }),
                    h(
                      'div',
                      { className: 'wh-create-sub-row' },
                      h('span', { className: 'wh-spacer' }),
                      h('button', { className: 'wh-btn sm', onClick: () => setSkillForm({ open: false, name: '', description: '', body: '' }) }, t('common.cancel')),
                      h(
                        'button',
                        {
                          className: 'wh-btn sm primary',
                          disabled: saving.skill === true || skillForm.name.trim() === '' || skillForm.description.trim() === '',
                          onClick: () => void createSkill(),
                        },
                        saving.skill === true ? t('settings.saving') : t('settings.createSkill'),
                      ),
                    ),
                  )
                : null,
              visibleSkills.length === 0
                ? h('div', { className: 'wh-empty-line' }, t('settings.skillsEmpty'))
                : h(
                    'div',
                    { className: 'wh-group' },
                    visibleSkills.map((skill) =>
                      h(
                        'div',
                        { className: 'wh-row wh-skill-row', key: skill.name },
                        h('span', { className: 'wh-skill-name', title: skill.name }, skill.name),
                        h('span', { className: 'wh-badge' }, sourceLabel(skill.source)),
                        h('span', { className: 'wh-skill-desc', title: skill.description ?? '' }, skill.description ?? ''),
                        h(
                          'span',
                          { className: 'wh-skill-face' },
                          [skill.modelInvocable === true ? t('settings.modelOnly') : null, skill.userInvocable === true ? t('settings.userOnly') : null]
                            .filter(Boolean)
                            .join(' / '),
                        ),
                      ),
                    ),
                  ),
            ),
          ),
        );
      };
      return body();
    }

    // ---------------------------------------------------------------------
    // Global hub selection: 'all' or one workspaceId. The hub is a top-level
    // surface; the workspace console is the drill-in view.
    // ---------------------------------------------------------------------

    const SELECTION_KEY = 'workspace-hub:selection:v1';

    const hubSelection = (() => {
      const read = () => {
        try {
          const value = localStore()?.getItem(SELECTION_KEY);
          return typeof value === 'string' && value !== '' ? value : 'all';
        } catch {
          return 'all';
        }
      };
      let current = read();
      const listeners = new Set();
      const notify = () => {
        for (const listener of listeners) listener();
      };
      return {
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        getSnapshot: () => current,
        set: (next) => {
          const value = typeof next === 'string' && next !== '' ? next : 'all';
          if (value === current) return;
          current = value;
          try {
            localStore()?.setItem(SELECTION_KEY, value);
          } catch {
            /* private mode — selection stays in memory */
          }
          notify();
        },
      };
    })();

    function useHubSelection() {
      return React.useSyncExternalStore(hubSelection.subscribe, hubSelection.getSnapshot);
    }

    function useHubCatalogEntries() {
      return React.useSyncExternalStore(hubCatalog.subscribe, hubCatalog.getSnapshot);
    }

    /** Cross-view hand-off: open a workspace console and reveal one task. */
    let pendingTaskReveal = null;

    function requestTaskReveal(workspaceId, taskId) {
      if (typeof workspaceId !== 'string' || workspaceId === '') return;
      pendingTaskReveal = { workspaceId, taskId: typeof taskId === 'string' ? taskId : undefined };
    }

    /** Sidebar global-panel glyph; the sidebar supplies size + active. */
    function HubNavIcon(props) {
      return h(Icon, { size: props?.size ?? 16 });
    }

    // ---------------------------------------------------------------------
    // All-workspaces home: one cheap overview request for every workspace.
    // ---------------------------------------------------------------------

    function useHubOverview() {
      const [state, setState] = React.useState({
        data: undefined,
        loading: true,
        error: undefined,
        stale: false,
        generatedAt: null,
      });
      const tickRef = React.useRef(null);
      React.useEffect(() => {
        let alive = true;
        let timer = null;
        let busy = false;
        let failures = 0;
        const schedule = (ms) => {
          if (timer !== null) clearTimeout(timer);
          timer = setTimeout(tick, ms);
        };
        const tick = async (manual) => {
          if (alive !== true || busy === true) return;
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && manual !== true) {
            schedule(4000);
            return;
          }
          busy = true;
          try {
            const value = await call('hub.overview', {});
            if (alive !== true) return;
            failures = 0;
            setState((current) => ({
              ...current,
              loading: false,
              stale: false,
              error: undefined,
              generatedAt: typeof value?.generatedAt === 'number' ? value.generatedAt : Date.now(),
              data: {
                totals: value?.totals ?? {},
                workspaces: Array.isArray(value?.workspaces) ? value.workspaces : [],
              },
            }));
          } catch (error) {
            if (alive !== true) return;
            failures += 1;
            setState((current) => ({
              ...current,
              loading: false,
              stale: current.data !== undefined,
              error: messageOf(error),
            }));
          } finally {
            busy = false;
            if (alive === true) schedule(failures === 0 ? 4000 : Math.min(30000, 4000 * 2 ** Math.min(failures, 3)));
          }
        };
        tickRef.current = (manual) => tick(manual === true);
        const onVisibility = () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'visible') tickRef.current?.(true);
        };
        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
        schedule(0);
        return () => {
          alive = false;
          if (timer !== null) clearTimeout(timer);
          if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
          tickRef.current = null;
        };
      }, []);
      const refresh = React.useCallback((manual) => {
        const run = tickRef.current;
        if (typeof run !== 'function') return Promise.resolve();
        return Promise.resolve(run(manual !== false)).catch(() => undefined);
      }, []);
      return { ...state, refresh };
    }

    /** Aggregate attention rows for every workspace from the overview snapshot. */
    function collectGlobalAttention(rows, t) {
      const items = [];
      for (const row of rows ?? []) {
        const pseudo = {
          board: row.board,
          sessions: {
            sessions: (row.sessions?.rows ?? []).map((entry) => ({
              sessionId: entry.sessionId,
              title: entry.title,
              running: entry.running,
              updatedAt: entry.updatedAt,
              subchats: [],
            })),
          },
          servers: { servers: row.servers?.servers ?? [] },
        };
        for (const item of collectAttention(pseudo, t, undefined, {})) {
          items.push({ ...item, workspaceId: row.workspaceId, workspaceTitle: row.title || row.path });
        }
      }
      items.sort((left, right) => left.priority - right.priority);
      return items;
    }

    function AllWorkspacesHome(props) {
      const { t } = props;
      const overview = useHubOverview();
      const catalog = useHubCatalogEntries();
      const data = overview.data;
      const rows = data?.workspaces ?? [];
      const totals = data?.totals ?? {};
      const generatedAt = overview.generatedAt;
      const rootRef = React.useRef(null);
      const inputRef = React.useRef(null);
      const returnFocusRef = React.useRef(null);
      const [palette, setPalette] = React.useState({ open: false, query: '', index: 0 });

      const attention = React.useMemo(() => collectGlobalAttention(rows, t).slice(0, 6), [rows, t]);
      const running = React.useMemo(() => {
        const items = [];
        for (const row of rows) {
          for (const task of row.board?.tasks ?? []) {
            if (task.status === 'doing') items.push({ task, workspaceId: row.workspaceId, workspaceTitle: row.title || row.path });
          }
        }
        items.sort((left, right) => (right.task.updatedAt ?? 0) - (left.task.updatedAt ?? 0));
        return items.slice(0, 6);
      }, [rows]);

      const openWorkspace = React.useCallback((workspaceId, taskId) => {
        if (typeof workspaceId !== 'string') return;
        requestTaskReveal(workspaceId, taskId);
        hubSelection.set(workspaceId);
      }, []);
      const openWorkspaceSession = (workspaceId, sessionId) => {
        hubSelection.set(workspaceId);
        if (typeof sessionId === 'string') openSessionById(sessionId);
      };

      const syncText =
        overview.stale === true
          ? t('header.syncStale')
          : generatedAt === null || generatedAt === undefined
            ? t('header.syncWaiting')
            : t('header.sync', { time: relative(t, generatedAt) });
      const staleText =
        generatedAt === null || generatedAt === undefined
          ? t('header.syncStaleHint')
          : t('all.stale', { time: relative(t, generatedAt) });

      const paletteData = React.useMemo(() => {
        const workspaces = rows.length > 0
          ? rows.map((row) => ({ workspaceId: row.workspaceId, title: row.title, path: row.path }))
          : catalog;
        const actions = [
          { key: 'action:refresh', label: t('palette.refresh'), hint: '', icon: 'refresh', run: () => void overview.refresh() },
          { key: 'action:all', label: t('palette.allWorkspaces'), hint: '', icon: 'layers', run: () => {} },
        ];
        const workspaceItems = workspaces.map((entry) => ({
          key: `workspace:${entry.workspaceId}`,
          label: entry.title || entry.path || entry.workspaceId,
          hint: entry.path ?? '',
          icon: 'layers',
          run: () => hubSelection.set(entry.workspaceId),
        }));
        const taskItems = [];
        for (const row of rows) {
          for (const task of row.board?.tasks ?? []) {
            taskItems.push({
              key: `task:${row.workspaceId}:${task.id}`,
              label: task.title,
              hint: `${row.title || row.path} · ${t(`status.${task.status}`)}`,
              icon: 'tasks',
              run: () => openWorkspace(row.workspaceId, task.id),
            });
          }
        }
        const sessionItems = [];
        for (const row of rows) {
          for (const entry of row.sessions?.rows ?? []) {
            sessionItems.push({
              key: `session:${row.workspaceId}:${entry.sessionId}`,
              label: entry.title || t('sessions.untitled'),
              hint: `${row.title || row.path} · ${entry.running === true ? t('sessions.running') : t('sessions.idle')}`,
              icon: 'chat',
              run: () => openWorkspaceSession(row.workspaceId, entry.sessionId),
            });
          }
        }
        const pick = (items, limit) =>
          items
            .map((item) => ({ item, score: fuzzyScore(`${item.label} ${item.hint ?? ''}`, palette.query) }))
            .filter((entry) => entry.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit)
            .map((entry) => entry.item);
        const groups = [
          { key: 'actions', label: t('palette.actions'), items: pick(actions, 6) },
          { key: 'workspaces', label: t('palette.workspaces'), items: pick(workspaceItems, 8) },
          { key: 'tasks', label: t('palette.tasks'), items: pick(taskItems, 5) },
          { key: 'sessions', label: t('palette.sessions'), items: pick(sessionItems, 5) },
        ].filter((group) => group.items.length > 0);
        return { groups, flat: groups.flatMap((group) => group.items) };
      }, [rows, catalog, palette.query, t]);

      const rememberFocus = () => {
        const active = typeof document === 'undefined' ? null : document.activeElement;
        returnFocusRef.current = active !== null && active !== document.body ? active : null;
      };
      const restoreFocus = () => {
        const target = returnFocusRef.current;
        returnFocusRef.current = null;
        try {
          target?.focus?.({ preventScroll: true });
        } catch {
          /* gone */
        }
      };
      const openPalette = () => {
        rememberFocus();
        setPalette({ open: true, query: '', index: 0 });
      };
      const closePalette = () => {
        setPalette((current) => ({ ...current, open: false }));
        restoreFocus();
      };
      const runPaletteItem = (item) => {
        if (item === undefined || item === null) return;
        closePalette();
        try {
          item.run();
        } catch (error) {
          console.error('workspace-hub: command failed', error);
        }
      };
      const onPaletteKeyDown = (event) => {
        const items = paletteData.flat;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setPalette((current) => ({ ...current, index: items.length === 0 ? 0 : (current.index + 1) % items.length }));
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setPalette((current) => ({ ...current, index: items.length === 0 ? 0 : (current.index + items.length - 1) % items.length }));
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          runPaletteItem(items[palette.index]);
        }
      };
      const onKeyDown = (event) => {
        if (palette.open === true) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
          }
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openPalette();
          return;
        }
        if (event.key === 'Escape' && isTypingTarget(event.target) === true) {
          event.target.blur?.();
        }
      };

      const renderHeader = () =>
        h(
          'header',
          { className: 'wh-hd' },
          h('div', { className: 'wh-glyph' }, h(Icon, { size: 15 })),
          h(
            'div',
            { className: 'wh-hd-id' },
            h('div', { className: 'wh-hd-title' }, h('span', { className: 'wh-hub-name' }, t('panel.title')), h('span', { className: 'wh-hd-title-sm' }, t('panel.allTitle'))),
            h(
              'div',
              { className: 'wh-hd-path' },
              h('span', { className: 'wh-path-text' }, data === undefined ? '' : t('panel.allSubtitle', { n: totals.workspaces ?? rows.length })),
            ),
          ),
          h(
            'div',
            { className: 'wh-hd-right' },
            h(
              'button',
              { type: 'button', className: 'wh-sync' + (overview.stale === true ? ' warn' : ''), title: syncText, onClick: () => void overview.refresh() },
              h(Glyph, { name: 'refresh', size: 12 }),
              h('span', { className: 'wh-sync-text' }, syncText),
            ),
            h(
              'button',
              { type: 'button', className: 'wh-key-btn', 'aria-label': t('header.palette'), title: t('header.palette'), onClick: openPalette },
              h(Glyph, { name: 'command', size: 13 }),
              h('span', null, '⌘K'),
            ),
          ),
        );

      const renderStrip = () => {
        if (data === undefined) return null;
        const item = (label, value) =>
          h('span', { className: 'wh-strip-item', key: label }, label, ' ', h('span', { className: 'wh-strip-v' }, String(value ?? 0)));
        return h(
          'div',
          { className: 'wh-strip' },
          item(t('overview.workspaces'), totals.workspaces ?? rows.length),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item(t('strip.doing'), totals.doing ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item(t('strip.todo'), totals.todo ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item(t('strip.blocked'), totals.blocked ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item(t('strip.env'), `${totals.serversReady ?? 0}/${totals.serversTotal ?? 0}`),
        );
      };

      const renderFooter = () =>
        h(
          'div',
          { className: 'wh-foot' },
          h('span', { className: 'wh-foot-dot' + (overview.stale === true ? ' warn' : ''), 'aria-hidden': true }),
          h('span', null, overview.stale === true ? staleText : t('strip.updated', { time: generatedAt === null || generatedAt === undefined ? '' : relative(t, generatedAt) })),
          h('span', { className: 'wh-spacer' }),
          h('span', { className: 'wh-foot-keys' }, h('span', { className: 'wh-kbd' }, '⌘K'), ' ', t('keys.command')),
        );

      const renderStaleBanner = () => {
        if (overview.stale !== true || data === undefined) return null;
        return h(
          'div',
          { className: 'wh-banner', role: 'status' },
          h(Glyph, { name: 'alert', size: 14 }),
          h('span', null, staleText),
          overview.error === undefined ? null : h('span', { className: 'wh-hint' }, overview.error),
          h('span', { className: 'wh-spacer' }),
          h('button', { type: 'button', className: 'wh-banner-link', onClick: () => void overview.refresh() }, t('strip.retry')),
        );
      };

      const renderSkeleton = () =>
        h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll' },
            h(
              'div',
              { className: 'wh-group' },
              [0, 1, 2, 3].map((row) =>
                h(
                  'div',
                  { className: 'wh-sk-row', key: row },
                  h('span', { className: 'wh-sk wh-sk-circle' }),
                  h('div', { className: 'wh-sk-stack' }, h('span', { className: 'wh-sk wh-sk-line w1' }), h('span', { className: 'wh-sk wh-sk-line w2' })),
                ),
              ),
            ),
          ),
        );

      const renderEmpty = () =>
        h(
          'div',
          { className: 'wh-empty' },
          h(Glyph, { name: 'layers', size: 28 }),
          h('div', { className: 'wh-empty-title' }, t('all.empty')),
          h('div', { className: 'wh-empty-sub' }, t('all.emptySub')),
        );

      const renderError = () =>
        h(
          'div',
          { className: 'wh-empty' },
          h(Glyph, { name: 'alert', size: 24 }),
          h('div', { className: 'wh-empty-title' }, t('all.error')),
          h('div', { className: 'wh-empty-sub' }, overview.error === undefined ? t('all.errorSub') : `${overview.error}. ${t('all.errorSub')}`),
          h('button', { type: 'button', className: 'wh-btn primary', onClick: () => void overview.refresh() }, t('all.retry')),
        );

      const workspaceBadge = (workspaceId, title) =>
        h('span', { className: 'wh-badge', title: title ?? workspaceId }, title || workspaceId);

      const renderBody = () => {
        if (data === undefined) {
          if (overview.loading === true) return renderSkeleton();
          return overview.error === undefined ? renderSkeleton() : renderError();
        }
        if (rows.length === 0) {
          return h('div', { className: 'wh-view' }, h('div', { className: 'wh-scroll' }, renderEmpty()));
        }
        return h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll wh-overview' },
            renderStaleBanner(),
            h(
              'section',
              { className: 'wh-sec' },
              h(
                'div',
                { className: 'wh-sec-hd' },
                h('h2', { className: 'wh-sec-title' }, t('all.attention')),
                h('span', { className: 'wh-sec-more' }, t('all.attentionHint')),
              ),
              attention.length === 0
                ? h('div', { className: 'wh-group' }, h('div', { className: 'wh-empty-line' }, t('all.noAttention')))
                : h(
                    'div',
                    { className: 'wh-group' },
                    attention.map((item) =>
                      h(
                        'div',
                        { className: 'wh-row two always-actions', key: item.key },
                        h('span', { className: 'wh-att-icon' }, h(Glyph, { name: item.icon, size: 16 })),
                        h(
                          'div',
                          { className: 'wh-row-main' },
                          h('div', { className: 'wh-row-title', title: item.title }, item.title),
                          h(
                            'div',
                            { className: 'wh-row-sub' },
                            workspaceBadge(item.workspaceId, item.workspaceTitle),
                            h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                            h('span', { className: 'wh-ellip' }, item.reason),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'wh-row-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'wh-mini',
                              onClick: () => openWorkspace(item.workspaceId, item.taskId),
                            },
                            item.kind === 'server' ? t('attn.view') : t('attn.openTask'),
                            h(Glyph, { name: 'chevronRight', size: 12 }),
                          ),
                        ),
                      ),
                    ),
                  ),
            ),
            h(
              'section',
              { className: 'wh-sec' },
              h(
                'div',
                { className: 'wh-sec-hd' },
                h('h2', { className: 'wh-sec-title' }, t('all.running')),
                h('span', { className: 'wh-sec-more' }, t('all.runningHint')),
              ),
              running.length === 0
                ? h('div', { className: 'wh-group' }, h('div', { className: 'wh-empty-line' }, t('all.noRunning')))
                : h(
                    'div',
                    { className: 'wh-group' },
                    running.map(({ task, workspaceId, workspaceTitle }) =>
                      h(
                        'div',
                        { className: 'wh-row two always-actions', key: `${workspaceId}:${task.id}` },
                        h('span', { className: 'wh-pulse', 'aria-hidden': true }),
                        h(
                          'div',
                          { className: 'wh-row-main' },
                          h('div', { className: 'wh-row-title', title: task.title }, task.title),
                          h(
                            'div',
                            { className: 'wh-row-sub' },
                            workspaceBadge(workspaceId, workspaceTitle),
                            h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                            h('span', { className: 'wh-ellip' }, task.assignee?.title || t('tasks.owner.assigned')),
                            h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                            h('span', { className: 'wh-num' }, t('tasks.updatedAgo', { time: relative(t, task.updatedAt) })),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'wh-row-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'wh-mini',
                              onClick: () => {
                                const sessionId = task.assignee?.sessionId;
                                if (typeof sessionId === 'string' && sessionId.startsWith('pending:') !== true) openWorkspaceSession(workspaceId, sessionId);
                                else openWorkspace(workspaceId, task.id);
                              },
                            },
                            t('sessions.open'),
                          ),
                        ),
                      ),
                    ),
                  ),
            ),
            h(
              'section',
              { className: 'wh-sec' },
              h('div', { className: 'wh-sec-hd' }, h('h2', { className: 'wh-sec-title' }, t('all.workspaces'))),
              h(
                'div',
                { className: 'wh-cards' },
                rows.map((row) => {
                  const counts = row.board?.counts ?? {};
                  return h(
                    'button',
                    {
                      type: 'button',
                      className: 'wh-card',
                      key: row.workspaceId,
                      title: row.path,
                      onClick: () => hubSelection.set(row.workspaceId),
                    },
                    h(
                      'div',
                      { className: 'wh-card-hd' },
                      h('span', { className: 'wh-card-title' }, row.title || row.path),
                      h(Glyph, { name: 'chevronRight', size: 14 }),
                    ),
                    h('div', { className: 'wh-card-path wh-mono' }, row.path),
                      row.boardError === true ? h('div', { className: 'wh-card-meta' }, t('all.boardUnreadable')) : null,
                    h(
                      'div',
                      { className: 'wh-card-meta' },
                      h('span', null, t('strip.doing'), ' ', h('span', { className: 'wh-strip-v' }, String(counts.doing ?? 0))),
                      h('span', null, t('strip.todo'), ' ', h('span', { className: 'wh-strip-v' }, String(counts.todo ?? 0))),
                      h('span', null, t('strip.blocked'), ' ', h('span', { className: 'wh-strip-v' }, String(counts.blocked ?? 0))),
                    ),
                    h(
                      'div',
                      { className: 'wh-card-meta' },
                      h('span', null, t('overview.sessionCount', { running: row.sessions?.running ?? 0, total: row.sessions?.total ?? 0 })),
                      h('span', null, t('overview.serverCount', { ready: row.servers?.counts?.ready ?? 0, total: row.servers?.counts?.total ?? 0 })),
                      h('span', { className: 'wh-num' }, relative(t, row.updatedAt)),
                    ),
                  );
                }),
              ),
            ),
          ),
          renderFooter(),
        );
      };

      const renderPalette = () => {
        if (palette.open !== true) return null;
        const items = paletteData.flat;
        const active = items[palette.index];
        let index = -1;
        return h(
          OverlayDialog,
          { label: t('palette.label'), onClose: closePalette, palette: true, className: 'wh-palette' },
          h(
            'div',
            { className: 'wh-pal-input' },
            h(Glyph, { name: 'search', size: 16 }),
            h('input', {
              'data-wh-autofocus': '',
              value: palette.query,
              placeholder: t('palette.placeholder'),
              'aria-label': t('palette.placeholder'),
              autoComplete: 'off',
              role: 'combobox',
              'aria-expanded': 'true',
              'aria-controls': 'wh-global-pal-list',
              'aria-activedescendant': active === undefined ? undefined : `wh-global-pal-${palette.index}`,
              onChange: (event) => setPalette((current) => ({ ...current, query: event.target.value, index: 0 })),
              onKeyDown: onPaletteKeyDown,
            }),
            h('span', { className: 'wh-kbd' }, 'esc'),
          ),
          h(
            'div',
            { className: 'wh-pal-list', id: 'wh-global-pal-list', role: 'listbox', 'aria-label': t('palette.results') },
            items.length === 0
              ? h('div', { className: 'wh-pal-empty' }, t('palette.empty', { q: palette.query }))
              : paletteData.groups.map((group) =>
                  h(
                    React.Fragment,
                    { key: group.key },
                    h('div', { className: 'wh-pal-group' }, group.label),
                    group.items.map((item) => {
                      index += 1;
                      const itemIndex = index;
                      return h(
                        'button',
                        {
                          key: item.key,
                          type: 'button',
                          id: `wh-global-pal-${itemIndex}`,
                          role: 'option',
                          'aria-selected': itemIndex === palette.index,
                          className: 'wh-pal-row' + (itemIndex === palette.index ? ' on' : ''),
                          onClick: () => runPaletteItem(item),
                        },
                        h(Glyph, { name: item.icon, size: 15 }),
                        h('span', { className: 'wh-ellip' }, item.label),
                        item.hint === '' || item.hint === undefined ? null : h('span', { className: 'wh-pal-rt' }, item.hint),
                      );
                    }),
                  ),
                ),
          ),
          h(
            'div',
            { className: 'wh-pal-foot' },
            h('span', null, h('span', { className: 'wh-kbd' }, '↑'), h('span', { className: 'wh-kbd' }, '↓'), ' ', t('palette.select')),
            h('span', null, h('span', { className: 'wh-kbd' }, '↵'), ' ', t('palette.run')),
            h('span', null, h('span', { className: 'wh-kbd' }, 'esc'), ' ', t('palette.close')),
            h('span', { className: 'wh-spacer' }),
            h('span', { className: 'wh-pal-ws' }, t('panel.allTitle')),
          ),
        );
      };

      return h(
        'div',
        { className: 'wh-root', ref: rootRef, tabIndex: -1, onKeyDown },
        h('style', null, CSS),
        renderHeader(),
        renderStrip(),
        h('main', { className: 'wh-content' }, renderBody()),
        renderPalette(),
      );
    }

    /** Root hub surface: All workspaces or one workspace console. */
    function WorkspaceHubPanel(props) {
      const selection = useHubSelection();
      const autoScope = useScope(props.useSessions, props.useWorkspaces);
      const catalog = useHubCatalogEntries();
      const entry = catalog.find((item) => item.workspaceId === selection);
      const scope = React.useMemo(() => {
        if (selection === 'all') return { sessionId: undefined, workspaceId: undefined, workspacePath: undefined, workspaceTitle: undefined };
        const sameWorkspace = autoScope.workspaceId === selection;
        return {
          sessionId: sameWorkspace ? autoScope.sessionId : undefined,
          workspaceId: selection,
          workspacePath: sameWorkspace ? autoScope.workspacePath : entry?.path,
          workspaceTitle: entry?.title ?? (sameWorkspace ? autoScope.workspaceTitle : undefined),
        };
      }, [selection, autoScope.sessionId, autoScope.workspaceId, autoScope.workspacePath, autoScope.workspaceTitle, entry?.path, entry?.title]);
      const openAll = React.useCallback(() => hubSelection.set('all'), []);
      if (selection === 'all') return h(AllWorkspacesHome, { t: props.t });
      return h(WorkspaceConsole, { key: selection, t: props.t, scope, catalog, onOpenAll: openAll, useSessions: props.useSessions, useWorkspaces: props.useWorkspaces });
    }

    function WorkspaceConsole(props) {
      const { t, scope, catalog, onOpenAll } = props;
      const base = React.useMemo(
        () => ({ sessionId: scope.sessionId, workspaceId: scope.workspaceId, workspacePath: scope.workspacePath }),
        [scope.sessionId, scope.workspaceId, scope.workspacePath],
      );
      const snap = useHubSnapshot(scope);
      const workspaceKey = scope.workspaceId ?? scope.workspacePath ?? scope.sessionId ?? '';
      const [view, setViewState] = useViewState(workspaceKey, scope.workspaceId);
      const setView = React.useCallback(
        (patch) => setViewState((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) })),
        [setViewState],
      );

      const rootRef = React.useRef(null);
      const captureRef = React.useRef(null);
      const taskSearchRef = React.useRef(null);
      const sessionSearchRef = React.useRef(null);
      const returnFocusRef = React.useRef(null);
      const toastTimers = React.useRef(new Set());
      const draftTimers = React.useRef(new Map());
      const toastSeq = React.useRef(0);
      const gRef = React.useRef(0);

      const [edits, setEdits] = React.useState({});
      const [capture, setCapture] = React.useState({ title: '', detail: '', priority: 'normal', open: false });
      const [menu, setMenu] = React.useState(null);
      const [envOpen, setEnvOpen] = React.useState(false);
      const [settingsOpen, setSettingsOpen] = React.useState(false);
      const [settingsDirty, setSettingsDirty] = React.useState(false);
      const [palette, setPalette] = React.useState({ open: false, query: '', index: 0 });
      const [sheet, setSheet] = React.useState({ open: false, taskId: undefined, target: 'new', existing: '', note: '', openAfter: true, busy: false });
      const [serverPending, setServerPending] = React.useState({});
      const [toasts, setToasts] = React.useState([]);
      const [subchatCreate, setSubchatCreate] = React.useState({ open: false, sessionId: undefined, title: '', prompt: '', busy: false });
      const slowLoading = useDelayedFlag(snap.loading === true && snap.data === undefined, SKELETON_DELAY_MS);

      React.useEffect(
        () => () => {
          for (const timer of toastTimers.current) clearTimeout(timer);
          toastTimers.current.clear();
          for (const timer of draftTimers.current.values()) clearTimeout(timer);
          draftTimers.current.clear();
        },
        [],
      );

      const envRequest = React.useSyncExternalStore(subscribeServersTab, () => serversTabRequest);
      React.useEffect(() => {
        if (envRequest.workspaceId !== undefined && envRequest.seq > envConsumedSeq && envRequest.workspaceId === scope.workspaceId) {
          envConsumedSeq = envRequest.seq;
          setSettingsOpen(false);
          setView({ nav: 'overview' });
          setEnvOpen(true);
        }
      }, [envRequest.seq, scope.workspaceId]);

      const autoSessionRef = React.useRef('');
      React.useEffect(() => {
        if (view.nav !== 'sessions' || scope.sessionId === undefined) return;
        if (autoSessionRef.current === workspaceKey) return;
        autoSessionRef.current = workspaceKey;
        if (view.expandedSessions.length > 0) return;
        setView({ expandedSessions: [scope.sessionId] });
      }, [view.nav, view.expandedSessions.length, scope.sessionId, workspaceKey]);
      React.useEffect(() => {
        const subchats = (snap.data?.sessions?.sessions ?? []).flatMap((session) => session.subchats ?? []);
        if (subchats.length === 0) return;
        setViewState((current) => {
          let changed = false;
          const nextSeen = { ...current.seen };
          for (const subchat of subchats) {
            if (nextSeen[subchat.id] !== undefined) continue;
            nextSeen[subchat.id] = Number(subchat.updatedAt ?? Date.now());
            changed = true;
          }
          return changed === true ? { ...current, seen: nextSeen } : current;
        });
      }, [snap.data]);

      const data = snap.data;
      const tasks = data?.board?.tasks ?? [];
      const counts = data?.board?.counts ?? countTasks(tasks);
      const sessions = data?.sessions?.sessions ?? [];
      const servers = data?.servers?.servers ?? [];
      const seen = view.seen ?? {};
      const attention = collectAttention(data, t, scope.sessionId, seen);
      const workspaceTitle = data?.workspace?.title ?? scope.workspaceTitle ?? '';
      const workspacePath = data?.workspace?.path ?? scope.workspacePath ?? '';
      const totalTasks = counts.total ?? counts.all ?? tasks.length;
      const envCounts = serverCounts(servers);
      const visibleSessions = sessions.filter((session) => view.showClosed === true || session.archived !== true);
      const syncText =
        snap.stale === true
          ? t('header.syncStale')
          : snap.generatedAt === null || snap.generatedAt === undefined
            ? t('header.syncWaiting')
            : t('header.sync', { time: relative(t, snap.generatedAt) });
      const syncTitle =
        snap.stale === true
          ? t('header.syncStaleHint')
          : t('header.syncHint', { time: snap.generatedAt === null || snap.generatedAt === undefined ? '' : relative(t, snap.generatedAt) });
      const staleText =
        snap.generatedAt === null || snap.generatedAt === undefined
          ? t('header.syncStaleHint')
          : t('strip.stale', { time: relative(t, snap.generatedAt) });

      const dismissToast = React.useCallback((id) => {
        setToasts((current) => current.filter((row) => row.id !== id));
      }, []);
      const pushToast = React.useCallback((text, options) => {
        const settings = options ?? {};
        const id = (toastSeq.current += 1);
        const row = { id, text, action: settings.action, onAction: settings.onAction, error: settings.error === true };
        setToasts((current) => [...current.slice(-2), row]);
        const timer = setTimeout(() => {
          toastTimers.current.delete(timer);
          setToasts((current) => current.filter((entry) => entry.id !== id));
        }, settings.action === undefined ? 3600 : 6000);
        toastTimers.current.add(timer);
        return id;
      }, []);
      const runToast = (row) => {
        dismissToast(row.id);
        if (typeof row.onAction === 'function') {
          try {
            void row.onAction();
          } catch (error) {
            console.error('workspace-hub: toast action failed', error);
          }
        }
      };

      const rememberFocus = () => {
        const active = typeof document === 'undefined' ? null : document.activeElement;
        returnFocusRef.current = active !== null && active !== document.body && typeof active.focus === 'function' ? active : null;
      };
      const restoreFocus = () => {
        const target = returnFocusRef.current;
        returnFocusRef.current = null;
        if (target !== null && target !== undefined) {
          try {
            target.focus({ preventScroll: true });
          } catch {
            /* element is gone */
          }
        }
      };

      const latestTask = (taskId) => findTaskInData(snap.getData?.() ?? snap.data ?? data, taskId);
      const sessionTitleOf = (sessionId) => {
        const found = findConversation(data, sessionId);
        return found?.subchat?.title ?? found?.session?.title ?? t('sessions.untitled');
      };
      const executorLabel = (task) => {
        const executor = executorOf(data, task, scope.sessionId);
        if (executor.kind === 'unassigned') return t('tasks.owner.unassigned');
        if (executor.kind === 'pending') return t('tasks.owner.pending');
        if (executor.kind === 'you') return t('tasks.owner.you');
        return executor.title || t('sessions.untitled');
      };

      const toastRetry = (text, retry) =>
        pushToast(text, { error: true, action: typeof retry === 'function' ? t('common.retry') : undefined, onAction: retry });
      const actionFailed = (error, retry) => toastRetry(t('tasks.actionFailed', { message: messageOf(error) }), retry);

      const revealTask = (taskId) => {
        setSettingsOpen(false);
        setPalette((current) => ({ ...current, open: false }));
        setMenu(null);
        setView((current) => ({
          ...current,
          nav: 'tasks',
          filter: 'all',
          query: '',
          expanded: current.expanded.includes(taskId) ? current.expanded : [...current.expanded, taskId],
        }));
        const scroll = () => {
          const row = rootRef.current?.querySelector?.(`[data-wh-row][data-id="${taskId}"]`);
          if (row !== null && row !== undefined) {
            try {
              row.scrollIntoView({ block: 'center' });
            } catch {
              /* jsdom-like environment */
            }
            try {
              row.focus({ preventScroll: true });
            } catch {
              /* not focusable in this environment */
            }
          }
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(scroll);
        else setTimeout(scroll, 0);
      };
      React.useEffect(() => {
        if (pendingTaskReveal === null || pendingTaskReveal.workspaceId !== scope.workspaceId) return;
        const taskId = pendingTaskReveal.taskId;
        pendingTaskReveal = null;
        if (typeof taskId !== 'string') return;
        setView((current) => ({
          ...current,
          nav: 'tasks',
          filter: 'all',
          query: '',
          expanded: current.expanded.includes(taskId) ? current.expanded : [...current.expanded, taskId],
        }));
        const focusRow = () => {
          const row = rootRef.current?.querySelector?.(`[data-wh-row][data-id="${taskId}"]`);
          try {
            row?.scrollIntoView?.({ block: 'center' });
            row?.focus?.({ preventScroll: true });
          } catch {
            /* best-effort */
          }
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusRow);
        else setTimeout(focusRow, 0);
      }, [scope.workspaceId]);

      const toggleExpand = (taskId) => {
        setView((current) => ({
          ...current,
          expanded: current.expanded.includes(taskId)
            ? current.expanded.filter((id) => id !== taskId)
            : [...current.expanded, taskId],
        }));
      };
      const toggleGroup = (key) => {
        setView((current) => ({
          ...current,
          collapsed: current.collapsed.includes(key)
            ? current.collapsed.filter((id) => id !== key)
            : [...current.collapsed, key],
        }));
      };
      const toggleSession = (sessionId) => {
        const session = sessions.find((row) => row.sessionId === sessionId);
        setView((current) => ({
          ...current,
          expandedSessions: current.expandedSessions.includes(sessionId)
            ? current.expandedSessions.filter((id) => id !== sessionId)
            : [...current.expandedSessions, sessionId],
        }));
        if (session !== undefined) markSeen((session.subchats ?? []).map((subchat) => subchat.id));
      };
      const markSeen = (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) return;
        const now = Date.now();
        setView((current) => {
          const nextSeen = { ...current.seen };
          for (const id of ids) nextSeen[id] = now;
          return { ...current, seen: nextSeen };
        });
      };

      const focusCapture = () => {
        setSettingsOpen(false);
        setView((current) => ({ ...current, nav: 'tasks' }));
        const run = () => {
          const input = captureRef.current;
          if (input !== null && input !== undefined) {
            try {
              input.focus({ preventScroll: true });
              input.select?.();
            } catch {
              /* focus is best-effort */
            }
          }
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 0);
      };
      const focusSearch = () => {
        if (view.nav === 'sessions') {
          const run = () => {
            sessionSearchRef.current?.focus?.();
            sessionSearchRef.current?.select?.();
          };
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
          else setTimeout(run, 0);
          return;
        }
        setView((current) => ({ ...current, nav: 'tasks' }));
        const run = () => {
          taskSearchRef.current?.focus?.();
          taskSearchRef.current?.select?.();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 0);
      };
      const openPalette = () => {
        rememberFocus();
        setMenu(null);
        setEnvOpen(false);
        setPalette({ open: true, query: '', index: 0 });
      };
      const closePalette = () => {
        setPalette((current) => ({ ...current, open: false }));
        restoreFocus();
      };
      const openSettings = () => {
        rememberFocus();
        setPalette((current) => ({ ...current, open: false }));
        setEnvOpen(false);
        setSettingsOpen(true);
      };
      const closeSettings = (force) => {
        if (settingsDirty === true && force !== true) {
          pushToast(t('settings.unsaved'), {
            action: t('settings.discard'),
            onAction: () => {
              setSettingsDirty(false);
              setSettingsOpen(false);
              restoreFocus();
            },
          });
          return;
        }
        setSettingsDirty(false);
        setSettingsOpen(false);
        restoreFocus();
      };

      const showTaskFailure = (error, retry) => actionFailed(error, retry);
      const runTask = async (task, patch, request, successText, undoAction) => {
        const result = await snap.mutateTask(task.id, patch, request);
        if (result.ok === true) {
          if (successText !== undefined) {
            pushToast(successText, undoAction === undefined ? undefined : { action: t('tasks.undo'), onAction: undoAction });
          }
        } else if (result.conflict === true) {
          pushToast(t('tasks.conflictToast'), { error: true });
        } else {
          showTaskFailure(result.error, () => void runTask(task, patch, request, successText, undoAction));
        }
        return result;
      };
      const taskRequest = (task, body) => () => call('tasks.update', { ...base, id: task.id, expectedRevision: latestTask(task.id)?.revision ?? task.revision, ...body });
      const updateStatus = (task, status, toastKey, previous) =>
        runTask(
          task,
          { status },
          taskRequest(task, { status }),
          t(toastKey ?? 'tasks.updatedToast', { title: task.title }),
          previous === undefined
            ? undefined
            : () => {
                const current = latestTask(task.id);
                if (current === undefined) {
                  pushToast(t('tasks.undoFailed'), { error: true });
                  return;
                }
                void updateStatus(current, previous, toastKey, undefined);
              },
        );
      const toggleDone = (task) => {
        const next = task.status === 'done' ? 'todo' : 'done';
        void updateStatus(task, next, next === 'done' ? 'tasks.completedToast' : 'tasks.reopenedToast', task.status);
      };
      const claimTask = (task) => {
        if (scope.sessionId === undefined) return;
        void runTask(
          task,
          { status: 'doing', assignee: { sessionId: scope.sessionId, title: '', leaseExpiresAt: 0 } },
          () => call('tasks.claim', { ...base, id: task.id, expectedRevision: latestTask(task.id)?.revision ?? task.revision }),
          t('tasks.claimedToast', { title: task.title }),
        );
      };
      const releaseTask = (task) => {
        if (task.assignee === null || task.assignee === undefined) {
          void updateStatus(task, 'todo', 'tasks.requeuedToast', task.status);
          return;
        }
        void runTask(
          task,
          { status: 'todo', assignee: null },
          () => call('tasks.release', { ...base, id: task.id, expectedRevision: latestTask(task.id)?.revision ?? task.revision }),
          t('tasks.requeuedToast', { title: task.title }),
        );
      };
      const deleteTask = async (task) => {
        setMenu(null);
        const previous = latestTask(task.id) ?? task;
        const previousIndex = Math.max(0, tasks.findIndex((row) => row.id === task.id));
        const result = await snap.mutateData(
          (current) => removeTaskFromData(current, task.id),
          () => call('tasks.delete', { ...base, id: task.id, expectedRevision: latestTask(task.id)?.revision ?? task.revision }),
          (current) => insertTaskIntoData(current, previous, previousIndex),
        );
        if (result.ok !== true) {
          if (result.conflict === true) {
            pushToast(t('tasks.conflictToast'), { error: true });
            void snap.refresh();
          } else {
            showTaskFailure(result.error, undefined);
          }
          return;
        }
        const deleted = result.value?.deleted ?? task;
        pushToast(t('tasks.deletedToast', { title: task.title }), {
          action: t('tasks.undo'),
          onAction: async () => {
            try {
              await call('tasks.restore', {
                ...base,
                id: deleted.id,
                title: deleted.title,
                detail: deleted.detail ?? '',
                priority: deleted.priority ?? 'normal',
                status: deleted.status ?? 'todo',
                createdAt: deleted.createdAt,
                notes: deleted.notes ?? [],
                assignee: deleted.assignee ?? undefined,
                dispatch: deleted.dispatch ?? undefined,
                dispatches: deleted.dispatches ?? undefined,
              });
              pushToast(t('tasks.restoredToast'));
              void snap.refresh();
            } catch (error) {
              pushToast(t('tasks.undoFailed'), { error: true });
            }
          },
        });
      };

      const openDispatch = (task) => {
        rememberFocus();
        setMenu(null);
        const firstExisting = sessions.find((session) => session.orphanParent !== true && session.sessionId !== scope.sessionId);
        setSheet({
          open: true,
          taskId: task.id,
          target: 'new',
          existing: firstExisting?.sessionId ?? '',
          note: '',
          openAfter: true,
          busy: false,
        });
      };
      const closeDispatch = () => {
        setSheet((current) => ({ ...current, open: false, busy: false }));
        restoreFocus();
      };
      const submitDispatch = async () => {
        const task = latestTask(sheet.taskId);
        if (task === undefined) {
          pushToast(t('tasks.actionFailed', { message: t('tasks.undoFailed') }), { error: true });
          return;
        }
        if (sheet.target === 'existing' && sheet.existing === '') {
          pushToast(t('dispatch.needExisting'), { error: true });
          return;
        }
        setSheet((current) => ({ ...current, busy: true }));
        const targetSessionId = sheet.target === 'existing' ? sheet.existing : undefined;
        try {
          const value = await call('tasks.dispatch', {
            ...base,
            id: task.id,
            expectedRevision: latestTask(task.id)?.revision ?? task.revision,
            targetSessionId,
            note: sheet.note.trim() === '' ? undefined : sheet.note.trim(),
          });
          const target = value?.target?.sessionId ?? targetSessionId;
          setSheet((current) => ({ ...current, open: false, busy: false }));
          restoreFocus();
          pushToast(t('tasks.dispatchDone', { session: target === undefined ? t('tasks.owner.pending') : sessionTitleOf(target) }), {
            action: target === undefined ? undefined : t('tasks.dispatchView'),
            onAction: target === undefined ? undefined : () => openSessionById(target),
          });
          if (sheet.openAfter === true && target !== undefined) openSessionById(target);
          void snap.refresh();
        } catch (error) {
          setSheet((current) => ({ ...current, busy: false }));
          pushToast(t('dispatch.failed', { message: messageOf(error) }), { error: true });
        }
      };

      const commitEdit = async (taskId, field, value) => {
        const current = latestTask(taskId);
        if (current === undefined) return;
        const result = await snap.mutateTask(taskId, { [field]: value }, () =>
          call('tasks.update', { ...base, id: taskId, expectedRevision: current.revision, [field]: value }),
        );
        setEdits((state) => ({
          ...state,
          [taskId]: {
            ...(state[taskId] ?? {}),
            saveState: result.ok === true ? 'saved' : result.conflict === true ? 'conflict' : 'error',
          },
        }));
        if (result.ok !== true) {
          if (result.conflict === true) pushToast(t('tasks.conflictToast'), { error: true });
          else showTaskFailure(result.error, () => void commitEdit(taskId, field, value));
        }
      };
      const setEditDraft = (task, field, value) => {
        setEdits((state) => ({ ...state, [task.id]: { ...(state[task.id] ?? {}), [field]: value, saveState: 'saving' } }));
        const timerKey = `${task.id}:${field}`;
        const existing = draftTimers.current.get(timerKey);
        if (existing !== undefined) clearTimeout(existing);
        const timer = setTimeout(() => {
          draftTimers.current.delete(timerKey);
          void commitEdit(task.id, field, value);
        }, 800);
        draftTimers.current.set(timerKey, timer);
      };
      const flushEdit = (task, field) => {
        const timerKey = `${task.id}:${field}`;
        const pendingTimer = draftTimers.current.get(timerKey);
        if (pendingTimer !== undefined) {
          clearTimeout(pendingTimer);
          draftTimers.current.delete(timerKey);
        }
        const draft = edits[task.id]?.[field];
        if (draft === undefined) return;
        const current = latestTask(task.id);
        const baseline = field === 'title' ? current?.title ?? task.title : current?.detail ?? task.detail ?? '';
        if (draft === baseline) return;
        void commitEdit(task.id, field, draft);
      };
      const changePriority = (task, priority) => {
        void runTask(
          task,
          { priority },
          taskRequest(task, { priority }),
          t('tasks.updatedToast', { title: task.title }),
        );
      };
      const addNote = async (task) => {
        const draft = String(edits[task.id]?.note ?? '').trim();
        if (draft === '') return;
        const current = latestTask(task.id) ?? task;
        const notes = Array.isArray(current.notes) ? current.notes : [];
        const result = await snap.mutateTask(
          task.id,
          { notes: [...notes, { at: Date.now(), sessionId: scope.sessionId ?? null, text: draft }] },
          () => call('tasks.update', { ...base, id: task.id, expectedRevision: current.revision, note: draft }),
        );
        if (result.ok === true) {
          setEdits((state) => ({ ...state, [task.id]: { ...(state[task.id] ?? {}), note: '' } }));
          pushToast(t('tasks.noteAdded'));
        } else if (result.conflict !== true) {
          showTaskFailure(result.error, () => void addNote(task));
        }
      };

      const createTaskWith = async (title, detail, priority) => {
        const temp = {
          id: `temp-${Date.now()}`,
          title,
          detail,
          status: 'todo',
          priority,
          revision: 0,
          assignee: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          notes: [],
          dispatch: null,
        };
        const result = await snap.mutateData(
          (current) => insertTaskIntoData(current, temp, 0),
          () => call('tasks.create', { ...base, title, detail, priority }),
          (current) => removeTaskFromData(current, temp.id),
        );
        if (result.ok === true) {
          pushToast(t('tasks.createdToast', { title }));
          void snap.refresh();
          focusCapture();
        } else {
          actionFailed(result.error, () => void createTaskWith(title, detail, priority));
        }
      };
      const submitCapture = () => {
        const title = capture.title.trim();
        if (title === '') return;
        const detail = capture.detail;
        const priority = capture.priority;
        setCapture({ title: '', detail: '', priority: 'normal', open: false });
        void createTaskWith(title, detail, priority);
      };

      const actServer = async (server, action) => {
        if (serverPending[server.name] !== undefined) return;
        setServerPending((current) => ({ ...current, [server.name]: action }));
        try {
          if (action === 'start') await call('servers.start', { ...base, names: [server.name] });
          else await call('servers.stop', { ...base, names: [server.name] });
          pushToast(action === 'start' ? t('env.startedToast', { name: server.name }) : t('env.stoppedToast', { name: server.name }));
        } catch (error) {
          toastRetry(t('env.actionFailed', { message: messageOf(error) }), () => void actServer(server, action));
        } finally {
          setServerPending((current) => {
            const next = { ...current };
            delete next[server.name];
            return next;
          });
          void snap.refresh();
        }
      };
      const openServer = (server) => {
        if (typeof server.url === 'string' && server.url !== '') openExternalUrl(server.url);
      };

      const openSession = (sessionId) => {
        if (typeof sessionId !== 'string') return;
        openSessionById(sessionId);
      };
      const openSubchat = (session, subchat) => {
        markSeen([subchat.id]);
        openChildSession(subchat.id);
      };
      const sendSubchat = async (session, subchat) => {
        const editKey = `sub:${subchat.id}`;
        const draft = String(edits[editKey]?.note ?? '').trim();
        if (draft === '' || subchat.status === 'closed') return;
        const previousSubchat = findConversation(snap.data ?? data, subchat.id)?.subchat;
        const result = await snap.mutateData(
          (current) => patchSubchatInData(current, subchat.id, { status: 'running' }),
          () => call('subchats.send', { ...base, parentSessionId: session.sessionId, id: subchat.id, message: draft }),
          (current) => (previousSubchat === undefined ? current : patchSubchatInData(current, subchat.id, previousSubchat)),
        );
        if (result.ok === true) {
          setEdits((state) => ({ ...state, [editKey]: { ...(state[editKey] ?? {}), note: '' } }));
          pushToast(t('sessions.sent', { title: subchat.title || t('sessions.untitled') }));
          void snap.refresh();
        } else {
          toastRetry(t('sessions.sendFailed', { message: messageOf(result.error) }), () => void sendSubchat(session, subchat));
        }
      };
      const subchatAction = async (session, subchat, action) => {
        const method = action === 'interrupt' ? 'subchats.interrupt' : action === 'close' ? 'subchats.close' : 'subchats.reopen';
        const optimistic = action === 'close' ? 'closed' : action === 'interrupt' ? 'idle' : 'idle';
        const previousSubchat = findConversation(snap.data ?? data, subchat.id)?.subchat;
        const result = await snap.mutateData(
          (current) => patchSubchatInData(current, subchat.id, { status: optimistic }),
          () => call(method, { ...base, parentSessionId: session.sessionId, id: subchat.id }),
          (current) => (previousSubchat === undefined ? current : patchSubchatInData(current, subchat.id, previousSubchat)),
        );
        const toastKey = action === 'interrupt' ? 'sessions.interruptedToast' : action === 'close' ? 'sessions.closedToast' : 'sessions.reopenedToast';
        if (result.ok === true) {
          pushToast(
            t(toastKey, { title: subchat.title || t('sessions.untitled') }),
            action === 'close' ? { action: t('subchats.reopen'), onAction: () => void subchatAction(session, subchat, 'reopen') } : undefined,
          );
          void snap.refresh();
        } else {
          toastRetry(t('sessions.actionFailed', { message: messageOf(result.error) }), () => void subchatAction(session, subchat, action));
        }
      };
      const submitSubchatCreate = async () => {
        if (subchatCreate.sessionId === undefined || subchatCreate.prompt.trim() === '') return;
        if (subchatCreate.sessionId !== scope.sessionId) {
          pushToast(t('sessions.parentMismatch'), { error: true });
          setSubchatCreate({ open: false, sessionId: undefined, title: '', prompt: '', busy: false });
          return;
        }
        setSubchatCreate((current) => ({ ...current, busy: true }));
        try {
          await call('subchats.create', {
            ...base,
            parentSessionId: subchatCreate.sessionId,
            title: subchatCreate.title,
            prompt: subchatCreate.prompt,
          });
          const title = subchatCreate.title || t('sessions.untitled');
          setSubchatCreate({ open: false, sessionId: undefined, title: '', prompt: '', busy: false });
          pushToast(t('sessions.createdToast', { title }));
          void snap.refresh();
        } catch (error) {
          setSubchatCreate((current) => ({ ...current, busy: false }));
          toastRetry(t('sessions.createFailed', { message: messageOf(error) }), () => void submitSubchatCreate());
        }
      };

      const runAttention = (item) => {
        if (item.actionKind === 'openTask') {
          revealTask(item.taskId);
          return;
        }
        if (item.actionKind === 'openSession') {
          setView((current) => ({ ...current, nav: 'sessions', expandedSessions: current.expandedSessions.includes(item.sessionId) ? current.expandedSessions : [...current.expandedSessions, item.sessionId] }));
          markSeen([item.subchatId]);
          return;
        }
        if (item.actionKind === 'serverLogs') {
          const server = servers.find((row) => row.name === item.serverName);
          if (server !== undefined && typeof server.error === 'string' && server.error !== '') pushToast(server.error, { error: true });
          else pushToast(t('env.noUrl'), { error: true });
          return;
        }
        const task = latestTask(item.taskId);
        if (task === undefined) return;
        if (item.actionKind === 'requeue') releaseTask(task);
        else if (item.actionKind === 'confirm') updateStatus(task, 'done', 'tasks.completedToast', 'doing');
        else if (item.actionKind === 'claim') claimTask(task);
      };

      const paletteData = React.useMemo(() => {
        const nextStartable = servers.find((server) => {
          const phase = serverPhase(server);
          return phase === 'stopped' || phase === 'failed';
        });
        const workspaces = catalog;
        const actions = [
          { key: 'action:all-workspaces', label: t('palette.allWorkspaces'), hint: '', icon: 'layers', run: () => onOpenAll() },
          { key: 'action:new-task', label: t('palette.newTask'), hint: 'n', icon: 'plus', run: () => focusCapture() },
          {
            key: 'action:new-subchat',
            label: t('palette.newSubchat'),
            hint: scope.sessionId === undefined ? t('palette.needSession') : '',
            icon: 'chat',
            disabled: scope.sessionId === undefined,
            run: () => {
              setView((current) => ({ ...current, nav: 'sessions' }));
              setSubchatCreate({ open: true, sessionId: scope.sessionId, title: '', prompt: '', busy: false });
            },
          },
          {
            key: 'action:start-server',
            label: t('palette.startServer'),
            hint: nextStartable?.name ?? t('env.noStartable'),
            icon: 'play',
            disabled: nextStartable === undefined,
            run: () => {
              if (nextStartable !== undefined) void actServer(nextStartable, 'start');
            },
          },
          { key: 'action:settings', label: t('palette.openSettings'), hint: '', icon: 'gear', run: () => openSettings() },
          {
            key: 'action:refresh',
            label: t('palette.refresh'),
            hint: '',
            icon: 'refresh',
            run: () => {
              void snap.refresh();
              pushToast(t('palette.refreshed'));
            },
          },
          { key: 'action:switch-workspace', label: t('palette.switchWorkspace'), hint: workspaces.length > 0 ? String(workspaces.length) : '', icon: 'layers', run: () => setMenu({ kind: 'workspace' }) },
        ];
        const taskItems = tasks.map((task) => ({
          key: `task:${task.id}`,
          label: task.title,
          hint: t(`status.${task.status}`),
          icon: 'tasks',
          run: () => revealTask(task.id),
        }));
        const sessionItems = sessions.map((session) => ({
          key: `session:${session.sessionId}`,
          label: session.title || t('sessions.untitled'),
          hint: session.running === true ? t('sessions.running') : t('sessions.idle'),
          icon: 'chat',
          run: () => openSession(session.sessionId),
        }));
        const workspaceItems = workspaces.map((entry) => ({
          key: `workspace:${entry.workspaceId}`,
          label: entry.title || entry.workspaceId,
          hint: entry.workspaceId === scope.workspaceId ? t('header.currentWorkspace') : '',
          icon: 'layers',
          run: () => hubSelection.set(entry.workspaceId),
        }));
        const pick = (items, limit) =>
          items
            .map((item) => ({ item, score: fuzzyScore(`${item.label} ${item.hint ?? ''}`, palette.query) }))
            .filter((entry) => entry.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit)
            .map((entry) => entry.item);
        const groups = [
          { key: 'actions', label: t('palette.actions'), items: pick(actions, 8) },
          { key: 'tasks', label: t('palette.tasks'), items: pick(taskItems, 5) },
          { key: 'sessions', label: t('palette.sessions'), items: pick(sessionItems, 5) },
          { key: 'workspaces', label: t('palette.workspaces'), items: pick(workspaceItems, 5) },
        ].filter((group) => group.items.length > 0);
        return { groups, flat: groups.flatMap((group) => group.items) };
      }, [palette.query, data, servers, catalog, onOpenAll, scope.sessionId, scope.workspaceId]);

      const runPaletteItem = (item) => {
        if (item === undefined || item === null || item.disabled === true) return;
        closePalette();
        try {
          item.run();
        } catch (error) {
          console.error('workspace-hub: command failed', error);
        }
      };
      const onPaletteKeyDown = (event) => {
        const items = paletteData.flat;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setPalette((current) => ({ ...current, index: items.length === 0 ? 0 : (current.index + 1) % items.length }));
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setPalette((current) => ({ ...current, index: items.length === 0 ? 0 : (current.index + items.length - 1) % items.length }));
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          runPaletteItem(items[palette.index]);
        }
      };

      const focusedRowActivate = (row) => {
        if (row === null || row === undefined) return;
        const kind = row.getAttribute('data-kind');
        const id = row.getAttribute('data-id');
        if (id === null) return;
        if (kind === 'task') {
          toggleExpand(id);
          return;
        }
        if (kind === 'session') {
          toggleSession(id);
          return;
        }
        if (kind === 'attention') {
          const item = attention.find((entry) => entry.key === id);
          if (item !== undefined) runAttention(item);
          return;
        }
        if (kind === 'env') setEnvOpen(true);
      };
      const moveRowFocus = (delta) => {
        const rows = Array.from(rootRef.current?.querySelectorAll?.('[data-wh-row]') ?? []).filter((row) => row.offsetParent !== null);
        if (rows.length === 0) return;
        const active = typeof document === 'undefined' ? null : document.activeElement;
        const index = rows.indexOf(active);
        const next = index < 0 ? (delta > 0 ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, index + delta));
        const row = rows[next];
        try {
          row.focus({ preventScroll: true });
          row.scrollIntoView({ block: 'nearest' });
        } catch {
          /* best-effort */
        }
      };

      const onKeyDown = (event) => {
        if (palette.open === true) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
          }
          return;
        }
        if (sheet.open === true) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeDispatch();
            return;
          }
          if (event.key === '1' || event.key === '2') {
            if (isTypingTarget(event.target) !== true) {
              event.preventDefault();
              setSheet((current) => ({ ...current, target: event.key === '1' ? 'new' : 'existing' }));
            }
            return;
          }
          if (event.key === 'Enter' && isTypingTarget(event.target) !== true) {
            const focused = event.target;
            const interactive =
              focused !== null && focused !== undefined && typeof focused.closest === 'function' &&
              focused.closest('button, a, select, input, textarea, [role="radio"]') !== null;
            if (interactive !== true) {
              event.preventDefault();
              void submitDispatch();
            }
          }
          return;
        }
        if (settingsOpen === true) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeSettings();
            return;
          }
          if (isTypingTarget(event.target) !== true) return;
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openPalette();
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
          event.preventDefault();
          focusCapture();
          return;
        }
        if (event.key === 'Escape') {
          if (menu !== null) {
            setMenu(null);
            return;
          }
          if (envOpen === true) {
            setEnvOpen(false);
            return;
          }
          if (isTypingTarget(event.target) === true) {
            event.target.blur?.();
            return;
          }
          onOpenAll();
          return;
        }
        if (isTypingTarget(event.target) === true) return;
        if (event.key === 'g') {
          gRef.current = Date.now();
          return;
        }
        if (gRef.current !== 0 && Date.now() - gRef.current < 900) {
          gRef.current = 0;
          if (event.key === 'a') {
            event.preventDefault();
            onOpenAll();
            return;
          }
          if (event.key === 'o' || event.key === 't' || event.key === 'c') {
            event.preventDefault();
            setSettingsOpen(false);
            setView((current) => ({ ...current, nav: event.key === 'o' ? 'overview' : event.key === 't' ? 'tasks' : 'sessions' }));
            return;
          }
        }
        if (event.key === 'n') {
          event.preventDefault();
          focusCapture();
          return;
        }
        if (event.key === '/') {
          event.preventDefault();
          focusSearch();
          return;
        }
        if (event.key === 'j' || event.key === 'k') {
          event.preventDefault();
          moveRowFocus(event.key === 'j' ? 1 : -1);
          return;
        }
        if (event.key === 'Enter') {
          const row = focusedRowElement();
          if (row !== null) {
            event.preventDefault();
            focusedRowActivate(row);
          }
          return;
        }
        if (event.key === 'x') {
          const row = focusedRowElement();
          if (row !== null && row.getAttribute('data-kind') === 'task') {
            const task = latestTask(row.getAttribute('data-id'));
            if (task !== undefined) {
              event.preventDefault();
              toggleDone(task);
            }
          }
          return;
        }
        if (event.key === 'e') {
          const row = focusedRowElement();
          if (row !== null && row.getAttribute('data-kind') === 'task') {
            const id = row.getAttribute('data-id');
            event.preventDefault();
            setView((current) => ({ ...current, expanded: current.expanded.includes(id) ? current.expanded : [...current.expanded, id] }));
            const focusTitle = () => {
              const input = rootRef.current?.querySelector?.(`[data-wh-title="${id}"]`);
              try {
                input?.focus?.();
                input?.select?.();
              } catch {
                /* best-effort */
              }
            };
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusTitle);
            else setTimeout(focusTitle, 0);
          }
          return;
        }
        if (event.key === 'd') {
          const row = focusedRowElement();
          if (row !== null && row.getAttribute('data-kind') === 'task') {
            const task = latestTask(row.getAttribute('data-id'));
            if (task !== undefined) {
              event.preventDefault();
              openDispatch(task);
            }
          }
        }
      };

      const onRootMouseDown = (event) => {
        const target = event.target;
        if (target === null || target === undefined || typeof target.closest !== 'function') return;
        const inMenu = target.closest('[data-wh-menu]') !== null;
        const menuToggle = target.closest('[data-wh-menu-toggle]') !== null;
        if (menu !== null && inMenu !== true && menuToggle !== true) setMenu(null);
        const inEnv = target.closest('[data-wh-env]') !== null;
        const envToggle = target.closest('[data-wh-env-toggle]') !== null;
        if (envOpen === true && inEnv !== true && envToggle !== true) setEnvOpen(false);
      };

      const renderHeader = () => {
        if (settingsOpen === true) {
          return h(
            'header',
            { className: 'wh-hd' },
            h('button', { type: 'button', className: 'wh-back', onClick: closeSettings }, h(Glyph, { name: 'arrowLeft', size: 15 }), h('span', null, t('settings.back'))),
          );
        }
        const workspaceButton = h(
          'button',
          {
            type: 'button',
            className: 'wh-ws-switch',
            'aria-haspopup': 'menu',
            'aria-label': t('header.workspaceMenu'),
            title: t('header.workspaceMenu'),
            onClick: () => setMenu((current) => (current !== null && current.kind === 'workspace' ? null : { kind: 'workspace' })),
          },
          h('span', { className: 'wh-ellip' }, workspaceTitle || t('panel.untitledWorkspace')),
          h(Glyph, { name: 'chevronDown', size: 12 }),
        );
        return h(
          'header',
          { className: 'wh-hd' },
          h(
            'button',
            {
              type: 'button',
              className: 'wh-back wh-back-all',
              title: t('header.backToAll'),
              'aria-label': t('header.backToAll'),
              onClick: onOpenAll,
            },
            h(Glyph, { name: 'arrowLeft', size: 15 }),
            h('span', { className: 'wh-back-label' }, t('header.allWorkspaces')),
          ),
          h('div', { className: 'wh-glyph' }, h(Icon, { size: 15 })),
          h(
            'div',
            { className: 'wh-hd-id' },
            h('div', { className: 'wh-hd-title' }, h('span', { className: 'wh-hub-name' }, t('panel.title')), workspaceButton),
            h(
              'div',
              { className: 'wh-hd-path' },
              h('span', { className: 'wh-path-text', title: workspacePath }, workspacePath),
              h(
                'button',
                {
                  type: 'button',
                  className: 'wh-icon-btn xs',
                  'aria-label': t('header.pathCopy'),
                  title: t('header.pathCopy'),
                  onClick: () => {
                    if (copyText(workspacePath)) pushToast(t('header.copied'));
                    else pushToast(t('header.pathCopy'), { error: true });
                  },
                },
                h(Glyph, { name: 'copy', size: 12 }),
              ),
            ),
          ),
          h(
            'div',
            { className: 'wh-hd-right' },
            h(
              'button',
              { type: 'button', className: 'wh-sync' + (snap.stale === true ? ' warn' : ''), title: syncTitle, onClick: () => void snap.refresh() },
              h(Glyph, { name: 'refresh', size: 12 }),
              h('span', { className: 'wh-sync-text' }, syncText),
            ),
            h(
              'button',
              { type: 'button', className: 'wh-key-btn', 'aria-label': t('header.palette'), title: t('header.palette'), onClick: openPalette },
              h(Glyph, { name: 'command', size: 13 }),
              h('span', null, '⌘K'),
            ),
            h(
              'button',
              { type: 'button', className: 'wh-icon-btn', 'aria-label': t('header.settings'), title: t('header.settings'), onClick: openSettings },
              h(Glyph, { name: 'gear', size: 16 }),
            ),
          ),
        );
      };

      const renderStrip = () => {
        if (settingsOpen === true || data === undefined) return null;
        const item = (filter, label, value) =>
          h(
            'button',
            {
              type: 'button',
              className: 'wh-strip-item',
              onClick: () => setView((current) => ({ ...current, nav: 'tasks', filter })),
            },
            label,
            ' ',
            h('span', { className: 'wh-strip-v' }, String(value)),
          );
        return h(
          'div',
          { className: 'wh-strip' },
          item('doing', t('strip.doing'), counts.doing ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item('todo', t('strip.todo'), counts.todo ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          item('blocked', t('strip.blocked'), counts.blocked ?? 0),
          h('span', { className: 'wh-strip-sep', 'aria-hidden': true }, '·'),
          h(
            'button',
            {
              type: 'button',
              className: 'wh-strip-item',
              'data-wh-env-toggle': '',
              'aria-haspopup': 'dialog',
              onClick: () => setEnvOpen((current) => !current),
            },
            t('strip.env'),
            ' ',
            h('span', { className: 'wh-strip-v' }, `${envCounts.ready}/${envCounts.total}`),
          ),
        );
      };

      const renderNav = () => {
        if (settingsOpen === true || data === undefined) return null;
        const buttons = [
          { key: 'overview', label: t('nav.overview'), count: attention.length > 0 ? attention.length : undefined },
          { key: 'tasks', label: t('nav.tasks'), count: totalTasks },
          { key: 'sessions', label: t('nav.sessions'), count: visibleSessions.length },
        ];
        return h(
          'nav',
          { className: 'wh-nav', 'aria-label': t('panel.title') },
          buttons.map((entry) =>
            h(
              'button',
              {
                key: entry.key,
                type: 'button',
                className: 'wh-nav-btn' + (view.nav === entry.key ? ' on' : ''),
                'aria-current': view.nav === entry.key ? 'page' : undefined,
                onClick: () => {
                  setSettingsOpen(false);
                  setView((current) => ({ ...current, nav: entry.key }));
                },
              },
              entry.label,
              entry.count === undefined ? null : h('span', { className: 'wh-nav-num wh-num' }, String(entry.count)),
              entry.key === 'overview' && attention.length > 0 ? h('span', { className: 'wh-nav-att', 'aria-hidden': true }) : null,
            ),
          ),
        );
      };

      const renderFooter = () =>
        h(
          'div',
          { className: 'wh-foot' },
          h('span', { className: 'wh-foot-dot' + (snap.stale === true ? ' warn' : ''), 'aria-hidden': true }),
          h(
            'span',
            null,
            snap.stale === true
              ? staleText
              : t('strip.updated', { time: snap.generatedAt === null || snap.generatedAt === undefined ? '' : relative(t, snap.generatedAt) }),
          ),
          h('span', { className: 'wh-spacer' }),
          h(
            'span',
            { className: 'wh-foot-keys' },
            h('span', { className: 'wh-kbd' }, 'n'),
            ' ',
            t('keys.new'),
            ' ',
            h('span', { className: 'wh-kbd' }, '/'),
            ' ',
            t('keys.search'),
            ' ',
            h('span', { className: 'wh-kbd' }, '⌘K'),
            ' ',
            t('keys.command'),
          ),
        );

      const renderStaleBanner = () => {
        if (snap.stale !== true || data === undefined) return null;
        return h(
          'div',
          { className: 'wh-banner', role: 'status' },
          h(Glyph, { name: 'alert', size: 14 }),
          h('span', null, staleText),
          snap.error === undefined ? null : h('span', { className: 'wh-hint' }, snap.error),
          h('span', { className: 'wh-spacer' }),
          h(
            'button',
            {
              type: 'button',
              className: 'wh-banner-link',
              onClick: () => {
                void snap.refresh();
                pushToast(t('strip.updated', { time: t('time.now') }));
              },
            },
            t('strip.retry'),
          ),
        );
      };

      const renderMenu = () => {
        if (menu === null) return null;
        if (menu.kind === 'workspace') {
          const entries = catalog;
          return h(
            'div',
            { className: 'wh-menu', 'data-wh-menu': '', role: 'menu', style: { top: 48, left: 'max(24px, calc((100% - 960px) / 2))', right: 'auto' } },
            h('div', { className: 'wh-menu-hd' }, t('header.workspaceMenu')),
            h(
              'button',
              {
                type: 'button',
                role: 'menuitem',
                className: 'wh-menu-item',
                onClick: () => {
                  setMenu(null);
                  onOpenAll();
                },
              },
              h(Glyph, { name: 'grid', size: 14 }),
              h('span', null, t('header.allWorkspaces')),
            ),
            h('div', { className: 'wh-menu-sep' }),
            entries.length === 0
              ? h('div', { className: 'wh-menu-hd' }, t('panel.noWorkspace'))
              : entries.map((entry) =>
                  h(
                    'button',
                    {
                      key: entry.workspaceId,
                      type: 'button',
                      role: 'menuitem',
                      className: 'wh-menu-item',
                      onClick: () => {
                        setMenu(null);
                        hubSelection.set(entry.workspaceId);
                      },
                    },
                    h(Glyph, { name: 'layers', size: 14 }),
                    h('span', { className: 'wh-ellip' }, entry.title || entry.workspaceId),
                    entry.workspaceId === scope.workspaceId ? h('span', { className: 'wh-pal-rt' }, t('header.currentWorkspace')) : null,
                  ),
                ),
          );
        }
        return null;
      };
      const menuButton = (labelKey, action) =>
        h(
          'button',
          { type: 'button', role: 'menuitem', className: 'wh-menu-item', onClick: action },
          h('span', { className: 'wh-ellip' }, t(labelKey)),
        );

      const renderTaskMenu = (task) => {
        const open = menu !== null && menu.kind === 'task' && menu.id === task.id;
        if (open !== true) return null;
        return h(
          'div',
          { className: 'wh-menu', 'data-wh-menu': '', role: 'menu' },
          task.status !== 'todo' ? menuButton('tasks.release', () => releaseTask(task)) : null,
          menuButton('tasks.edit', () => revealTask(task.id)),
          menuButton('tasks.copyLink', () => {
            if (copyText(`workspace-hub://task/${task.id}`)) pushToast(t('tasks.linkCopied'));
          }),
          task.status !== 'cancelled' ? menuButton('tasks.cancelTask', () => void updateStatus(task, 'cancelled', 'tasks.cancelledToast', task.status)) : null,
          h('div', { className: 'wh-menu-sep' }),
          h(
            'button',
            { type: 'button', role: 'menuitem', className: 'wh-menu-item danger', onClick: () => void deleteTask(task) },
            h(Glyph, { name: 'close', size: 14 }),
            h('span', null, t('tasks.delete')),
          ),
        );
      };

      const renderPriority = (task) => {
        if (task.priority !== 'high') return null;
        return h('span', { className: 'wh-pri high' }, h('span', { className: 'wh-dot', 'aria-hidden': true }), t('tasks.priority.high'));
      };

      const renderTaskExpand = (task) => {
        const draft = edits[task.id] ?? {};
        const executor = executorOf(data, task, scope.sessionId);
        const notes = Array.isArray(task.notes) ? task.notes : [];
        const activeRun = task.status === 'doing' || task.status === 'blocked';
        const saveState = draft.saveState;
        return h(
          'div',
          { className: 'wh-expand' },
          h(
            'div',
            { className: 'wh-ex-title' },
            h('input', {
              className: 'wh-title-input',
              'data-wh-title': task.id,
              'aria-label': t('tasks.editTitle'),
              value: draft.title ?? task.title,
              onChange: (event) => setEditDraft(task, 'title', event.target.value),
              onBlur: () => flushEdit(task, 'title'),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  flushEdit(task, 'title');
                  event.target.blur?.();
                }
              },
            }),
            h(
              'span',
              { className: 'wh-save-state' },
              saveState === 'saving'
                ? t('tasks.saving')
                : saveState === 'saved'
                  ? t('tasks.saved')
                  : saveState === 'conflict'
                    ? t('tasks.conflictShort')
                    : '',
            ),
          ),
          h('textarea', {
            className: 'wh-textarea',
            'aria-label': t('tasks.editDetail'),
            placeholder: t('tasks.detailPlaceholder'),
            value: draft.detail ?? task.detail ?? '',
            onChange: (event) => setEditDraft(task, 'detail', event.target.value),
            onBlur: () => flushEdit(task, 'detail'),
          }),
          h(
            'div',
            { className: 'wh-ex-row' },
            h(
              'label',
              { className: 'wh-ex-label' },
              t('tasks.priorityLabel'),
              h(
                'select',
                {
                  className: 'wh-select',
                  value: draft.priority ?? task.priority ?? 'normal',
                  onChange: (event) => changePriority(task, event.target.value),
                  'aria-label': t('tasks.priorityLabel'),
                },
                ['low', 'normal', 'high'].map((priority) => h('option', { key: priority, value: priority }, t(`tasks.priority.${priority}`))),
              ),
            ),
          ),
          activeRun
            ? h(
                'div',
                { className: 'wh-run-strip' },
                task.status === 'doing' ? h('span', { className: 'wh-pulse', 'aria-hidden': true }) : h('span', { className: 'wh-dot blocked', 'aria-hidden': true }),
                h(
                  'div',
                  { className: 'wh-run-main' },
                  h('span', { className: 'wh-ellip' }, executorLabel(task)),
                  h('span', { className: 'wh-sep' }, '·'),
                  h('span', null, t('tasks.updatedAgo', { time: relative(t, task.lastActivityAt ?? task.updatedAt) })),
                  h('span', { className: 'wh-sep' }, '·'),
                  h('span', { className: 'wh-ellip' }, activityOf(data, task) || t('tasks.noActivity')),
                ),
                executor.sessionId === undefined ? null : h('button', { type: 'button', className: 'wh-btn sm', onClick: () => openSession(executor.sessionId) }, t('tasks.openSession')),
                h(
                  'button',
                  { type: 'button', className: 'wh-btn sm', onClick: () => void updateStatus(task, 'todo', 'tasks.interruptedToast', task.status) },
                  t('tasks.interrupt'),
                ),
              )
            : null,
          h(
            'div',
            { className: 'wh-notes' },
            h('div', { className: 'wh-notes-hd' }, t('tasks.notes'), h('span', { className: 'wh-num' }, String(notes.length))),
            notes.length === 0
              ? h('div', { className: 'wh-muted' }, t('tasks.noNotes'))
              : h(
                  'div',
                  { className: 'wh-timeline' },
                  notes.slice(-6).map((note, index) =>
                    h(
                      'div',
                      { className: 'wh-tl', key: note.at === undefined ? index : `${note.at}-${index}` },
                      h('span', { className: 'wh-num' }, relative(t, note.at)),
                      h('span', { className: 'wh-tl-text' }, note.text ?? ''),
                    ),
                  ),
                ),
            h(
              'div',
              { className: 'wh-note-row' },
              h('input', {
                className: 'wh-input sm',
                value: draft.note ?? '',
                placeholder: t('tasks.notePlaceholder'),
                'aria-label': t('tasks.notePlaceholder'),
                onChange: (event) => setEdits((state) => ({ ...state, [task.id]: { ...(state[task.id] ?? {}), note: event.target.value } })),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void addNote(task);
                  }
                },
              }),
              h('button', { type: 'button', className: 'wh-btn sm', onClick: () => void addNote(task) }, t('tasks.addNote')),
            ),
          ),
          h(
            'div',
            { className: 'wh-ex-actions' },
            task.status === 'todo' || task.status === 'blocked'
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'wh-btn sm',
                    disabled: scope.sessionId === undefined,
                    title: scope.sessionId === undefined ? t('tasks.claimHint') : undefined,
                    onClick: () => claimTask(task),
                  },
                  t('tasks.claim'),
                )
              : null,
            h('button', { type: 'button', className: 'wh-btn sm', onClick: () => toggleDone(task) }, task.status === 'done' ? t('tasks.reopen') : t('tasks.done')),
            task.status !== 'blocked' && task.status !== 'done' && task.status !== 'cancelled'
              ? h('button', { type: 'button', className: 'wh-btn sm', onClick: () => void updateStatus(task, 'blocked', 'tasks.blockedToast', task.status) }, t('tasks.markBlocked'))
              : null,
            task.status !== 'cancelled' ? h('button', { type: 'button', className: 'wh-btn sm', onClick: () => void updateStatus(task, 'cancelled', 'tasks.cancelledToast', task.status) }, t('tasks.cancelTask')) : null,
            task.status !== 'done' && task.status !== 'cancelled'
              ? h('button', { type: 'button', className: 'wh-btn sm', onClick: () => openDispatch(task) }, t('tasks.dispatch'))
              : null,
            h(
              'button',
              {
                type: 'button',
                className: 'wh-btn sm',
                onClick: () => {
                  if (copyText(`workspace-hub://task/${task.id}`)) pushToast(t('tasks.linkCopied'));
                },
              },
              t('tasks.copyLink'),
            ),
            h('button', { type: 'button', className: 'wh-btn sm danger', onClick: () => void deleteTask(task) }, t('tasks.delete')),
          ),
        );
      };

      const renderConflict = (conflict) =>
        h(
          'div',
          { className: 'wh-conflict', role: 'alert' },
          h(Glyph, { name: 'alert', size: 14 }),
          h(
            'div',
            { className: 'wh-conflict-main' },
            h('span', null, t('tasks.conflictTitle')),
            h('span', { className: 'wh-conflict-sub' }, t('tasks.conflictSub', { title: latestTask(conflict.taskId)?.title ?? '' })),
          ),
          h('button', { type: 'button', className: 'wh-btn sm', onClick: () => snap.clearConflict() }, t('tasks.conflictAccept')),
          h('button', { type: 'button', className: 'wh-btn sm', onClick: () => void snap.retryConflict() }, t('tasks.conflictRetry')),
        );

      const renderTaskRow = (task) => {
        const done = task.status === 'done';
        const expanded = view.expanded.includes(task.id);
        const two = task.status === 'doing' || task.status === 'blocked' || (task.notes ?? []).length > 0;
        const activity = activityOf(data, task);
        const conflict = snap.conflict !== undefined && snap.conflict !== null && snap.conflict.taskId === task.id ? snap.conflict : undefined;
        const openMenu = menu !== null && menu.kind === 'task' && menu.id === task.id;
        return h(
          'div',
          { className: 'wh-row-wrap', key: task.id },
          h(
            'div',
            {
              className: 'wh-row' + (two === true ? ' two' : ''),
              'data-wh-row': '',
              'data-kind': 'task',
              'data-id': task.id,
              tabIndex: 0,
              onClick: (event) => {
                if (typeof event.target.closest === 'function' && event.target.closest('button, input, textarea, select, a') !== null) return;
                toggleExpand(task.id);
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter' && event.target === event.currentTarget) {
                  event.preventDefault();
                  toggleExpand(task.id);
                }
              },
            },
            h(
              'button',
              {
                type: 'button',
                className: `wh-status ${task.status}`,
                'aria-label': t(done === true ? 'tasks.markReopen' : 'tasks.markDone', { title: task.title }),
                title: t(done === true ? 'tasks.markReopen' : 'tasks.markDone', { title: task.title }),
                onClick: (event) => {
                  event.stopPropagation();
                  toggleDone(task);
                },
              },
              h(Glyph, { name: statusGlyphName(task.status), size: 16 }),
            ),
            h(
              'div',
              { className: 'wh-row-main' },
              h('div', { className: 'wh-row-title' + (done === true ? ' done' : ''), title: task.title }, task.title),
              two === true
                ? h(
                    'div',
                    { className: 'wh-row-sub' },
                    h('span', { className: 'wh-ellip' }, executorLabel(task)),
                    h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                    h('span', null, `${t(`status.${task.status}`)} · ${relative(t, task.updatedAt)}`),
                    activity === ''
                      ? null
                      : h(
                          React.Fragment,
                          null,
                          h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                          h('span', { className: 'wh-ellip' }, activity),
                        ),
                  )
                : null,
            ),
            h(
              'div',
              { className: 'wh-row-meta' },
              renderPriority(task),
              two === true ? null : h('span', { className: 'wh-ellip' }, executorLabel(task)),
              h('span', { className: 'wh-num' }, relative(t, task.updatedAt)),
            ),
            h(
              'div',
              { className: 'wh-row-actions' },
              task.status === 'todo' || task.status === 'blocked'
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'wh-mini',
                      disabled: scope.sessionId === undefined,
                      title: scope.sessionId === undefined ? t('tasks.claimHint') : undefined,
                      onClick: (event) => {
                        event.stopPropagation();
                        claimTask(task);
                      },
                    },
                    t('tasks.claim'),
                  )
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: 'wh-mini',
                  onClick: (event) => {
                    event.stopPropagation();
                    toggleDone(task);
                  },
                },
                done === true ? t('tasks.reopen') : t('tasks.done'),
              ),
              task.status === 'done' || task.status === 'cancelled'
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'wh-mini',
                      onClick: (event) => {
                        event.stopPropagation();
                        openDispatch(task);
                      },
                    },
                    t('tasks.dispatch'),
                  ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'wh-icon-btn sm',
                  'data-wh-menu-toggle': `task:${task.id}`,
                  'aria-haspopup': 'menu',
                  'aria-label': t('tasks.more'),
                  title: t('tasks.more'),
                  onClick: (event) => {
                    event.stopPropagation();
                    setMenu((current) => (current !== null && current.kind === 'task' && current.id === task.id ? null : { kind: 'task', id: task.id }));
                  },
                },
                h(Glyph, { name: 'more', size: 14 }),
              ),
            ),
          ),
          openMenu === true ? renderTaskMenu(task) : null,
          expanded === true ? renderTaskExpand(task) : null,
          conflict === undefined ? null : renderConflict(conflict),
        );
      };

      const renderTaskGroup = (group) => {
        const collapsed = view.collapsed.includes(group.key) && view.query.trim() === '';
        const label =
          group.key === 'done'
            ? t('tasks.group.done', { n: group.rows.length })
            : {
                high: t('tasks.priority.high'),
                normal: t('tasks.priority.normal'),
                low: t('tasks.priority.low'),
                all: t('tasks.filter.all'),
              }[group.key] ?? t(`status.${group.key}`);
        return h(
          React.Fragment,
          { key: `group:${group.key}` },
          h(
            'button',
            {
              type: 'button',
              className: 'wh-sec-more',
              style: { height: 28, display: 'flex', width: '100%', padding: '0 4px 0 2px', fontSize: 11, fontWeight: 600, letterSpacing: '.04em' },
              'aria-expanded': collapsed !== true,
              onClick: () => toggleGroup(group.key),
            },
            h(Glyph, { name: 'chevronDown', size: 12 }),
            h('span', null, label),
            h('span', { className: 'wh-spacer' }),
            group.key === 'done' ? null : h('span', { className: 'wh-num' }, String(group.rows.length)),
          ),
          collapsed === true ? null : h('div', { className: 'wh-group' }, group.rows.map(renderTaskRow)),
        );
      };

      const renderEmptyTasks = () => {
        if (tasks.length === 0) {
          return h(
            'div',
            { className: 'wh-empty' },
            h(Glyph, { name: 'inbox', size: 28 }),
            h('div', { className: 'wh-empty-title' }, t('tasks.empty')),
            h('div', { className: 'wh-empty-sub' }, t('tasks.emptySub')),
            h(
              'div',
              { className: 'wh-templates' },
              ['tasks.template1', 'tasks.template2', 'tasks.template3'].map((key) =>
                h(
                  'button',
                  {
                    key,
                    type: 'button',
                    className: 'wh-tpl',
                    onClick: () => {
                      setCapture((current) => ({ ...current, title: t(key) }));
                      focusCapture();
                    },
                  },
                  t(key),
                ),
              ),
            ),
          );
        }
        const query = view.query.trim();
        const filteredLabel = view.filter === 'all' ? '' : t(`tasks.filter.${view.filter}`);
        return h(
          'div',
          { className: 'wh-empty' },
          h(Glyph, { name: 'search', size: 24 }),
          h('div', { className: 'wh-empty-title' }, query === '' ? t('tasks.emptyFilterTitle', { filter: filteredLabel }) : t('tasks.emptySearchTitle', { q: query })),
          h('div', { className: 'wh-empty-sub' }, query === '' ? t('tasks.emptyFilterSub') : t('tasks.emptySearchSub')),
          h(
            'div',
            { className: 'wh-templates' },
            h('button', { type: 'button', className: 'wh-tpl', onClick: () => setView((current) => ({ ...current, filter: 'all', query: '' })) }, t('tasks.filter.all')),
          ),
        );
      };

      const renderTasksView = () => {
        const visible = filterTasks(tasks, view.filter, view.query);
        const groups = groupTasks(visible, view.group);
        const chips = TASK_FILTERS.map((filter) =>
          h(
            'button',
            {
              key: filter,
              type: 'button',
              className: 'wh-chip' + (view.filter === filter ? ' on' : ''),
              'aria-pressed': view.filter === filter,
              onClick: () => setView((current) => ({ ...current, filter })),
            },
            t(`tasks.filter.${filter}`),
            h('span', { className: 'wh-num' }, String(filter === 'all' ? totalTasks : counts[filter] ?? 0)),
          ),
        );
        const groupCycle = ['status', 'priority', 'none'];
        return h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll' },
            h(
              'div',
              { className: 'wh-capture' },
              h(Glyph, { name: 'plus', size: 16 }),
              h('input', {
                ref: captureRef,
                value: capture.title,
                placeholder: t('tasks.capturePlaceholder'),
                'aria-label': t('tasks.capturePlaceholder'),
                autoComplete: 'off',
                onChange: (event) => setCapture((current) => ({ ...current, title: event.target.value })),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitCapture();
                  } else if (event.key === 'Tab' && capture.open !== true) {
                    event.preventDefault();
                    setCapture((current) => ({ ...current, open: true }));
                  } else if (event.key === 'Escape') {
                    if (capture.open === true) setCapture((current) => ({ ...current, open: false }));
                    else event.target.blur?.();
                  }
                },
              }),
              h('span', { className: 'wh-kbd' }, 'n'),
            ),
            capture.open === true
              ? h(
                  'div',
                  { className: 'wh-capture-detail' },
                  h(
                    'label',
                    null,
                    t('tasks.priorityLabel'),
                    h(
                      'select',
                      {
                        className: 'wh-select',
                        value: capture.priority,
                        onChange: (event) => setCapture((current) => ({ ...current, priority: event.target.value })),
                        'aria-label': t('tasks.priorityLabel'),
                      },
                      ['low', 'normal', 'high'].map((priority) => h('option', { key: priority, value: priority }, t(`tasks.priority.${priority}`))),
                    ),
                  ),
                  h('input', {
                    className: 'wh-input sm',
                    value: capture.detail,
                    placeholder: t('tasks.captureDetailPlaceholder'),
                    'aria-label': t('tasks.captureDetailPlaceholder'),
                    onChange: (event) => setCapture((current) => ({ ...current, detail: event.target.value })),
                  }),
                  h('span', { className: 'wh-spacer' }),
                  h('span', { className: 'wh-hint' }, t('tasks.captureHint')),
                )
              : null,
            h(
              'div',
              { className: 'wh-toolbar' },
              h('div', { className: 'wh-chips' }, chips),
              h(
                'div',
                { className: 'wh-field wh-task-search' },
                h(Glyph, { name: 'search', size: 14 }),
                h('input', {
                  ref: taskSearchRef,
                  className: 'wh-input',
                  value: view.query,
                  placeholder: t('tasks.searchPlaceholder'),
                  'aria-label': t('tasks.searchPlaceholder'),
                  onChange: (event) => setView((current) => ({ ...current, query: event.target.value })),
                }),
              ),
              h(
                'div',
                { className: 'wh-toolbar-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'wh-ctl',
                    onClick: () => {
                      const index = groupCycle.indexOf(view.group);
                      setView((current) => ({ ...current, group: groupCycle[(index + 1) % groupCycle.length] }));
                    },
                  },
                  h(Glyph, { name: 'stack', size: 13 }),
                  t(`tasks.group.${view.group}`),
                  h(Glyph, { name: 'chevronDown', size: 12 }),
                ),
                h('button', { type: 'button', className: 'wh-btn lg primary', onClick: focusCapture }, h(Glyph, { name: 'plus', size: 13 }), t('tasks.new')),
              ),
            ),
            renderStaleBanner(),
            groups.length === 0 ? renderEmptyTasks() : h('div', null, groups.map(renderTaskGroup)),
          ),
          renderFooter(),
        );
      };

      const renderOverview = () => {
        const running = tasks.filter((task) => task.status === 'doing').sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
        const attentionRows = attention.slice(0, 5);
        const attentionIcon = (item) =>
          h('span', { className: 'wh-att-icon' }, h(Glyph, { name: item.icon, size: 16 }));
        return h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll wh-overview' },
            renderStaleBanner(),
            h(
              'section',
              { className: 'wh-sec' },
              h(
                'div',
                { className: 'wh-sec-hd' },
                h('h2', { className: 'wh-sec-title' }, t('overview.attention')),
                h(
                  'button',
                  { type: 'button', className: 'wh-sec-more', onClick: () => setView((current) => ({ ...current, nav: 'tasks', filter: 'all' })) },
                  t('overview.viewAll'),
                  h(Glyph, { name: 'chevronRight', size: 12 }),
                ),
              ),
              attentionRows.length === 0
                ? h(
                    'div',
                    { className: 'wh-group' },
                    h(Glyph, { name: 'checkCircle', size: 16 }),
                    h('span', { className: 'wh-empty-line' }, t('overview.attentionEmpty')),
                  )
                : h(
                    'div',
                    { className: 'wh-group' },
                    attentionRows.map((item) =>
                      h(
                        'div',
                        {
                          key: item.key,
                          className: 'wh-row two',
                          'data-wh-row': '',
                          'data-kind': 'attention',
                          'data-id': item.key,
                          tabIndex: 0,
                          onClick: () => runAttention(item),
                          onKeyDown: (event) => {
                            if (event.key === 'Enter' && event.target === event.currentTarget) {
                              event.preventDefault();
                              runAttention(item);
                            }
                          },
                        },
                        attentionIcon(item),
                        h(
                          'div',
                          { className: 'wh-row-main' },
                          h('div', { className: 'wh-row-title', title: item.title }, item.title),
                          h('div', { className: 'wh-row-sub' }, h('span', { className: 'wh-ellip' }, item.reason)),
                        ),
                        h(
                          'div',
                          { className: 'wh-row-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'wh-mini',
                              onClick: (event) => {
                                event.stopPropagation();
                                runAttention(item);
                              },
                            },
                            t('attn.openTask'),
                            h(Glyph, { name: 'chevronRight', size: 12 }),
                          ),
                        ),
                      ),
                    ),
                  ),
            ),
            h(
              'section',
              { className: 'wh-sec' },
              h(
                'div',
                { className: 'wh-sec-hd' },
                h('h2', { className: 'wh-sec-title' }, t('overview.running')),
                h('span', { className: 'wh-sec-more' }, t('overview.runningCount', { n: running.length })),
              ),
              running.length === 0
                ? h(
                    'div',
                    { className: 'wh-group' },
                    h(
                      'div',
                      { className: 'wh-empty-line' },
                      t('overview.runningEmpty'),
                      h('span', { className: 'wh-spacer' }),
                      h('button', { type: 'button', className: 'wh-banner-link', onClick: () => setView((current) => ({ ...current, nav: 'sessions' })) }, t('overview.viewSessions')),
                    ),
                  )
                : h(
                    'div',
                    { className: 'wh-group' },
                    running.slice(0, 6).map((task) =>
                      h(
                        'div',
                        {
                          key: task.id,
                          className: 'wh-row two always-actions',
                          'data-wh-row': '',
                          'data-kind': 'task',
                          'data-id': task.id,
                          tabIndex: 0,
                          onClick: () => revealTask(task.id),
                          onKeyDown: (event) => {
                            if (event.key === 'Enter' && event.target === event.currentTarget) {
                              event.preventDefault();
                              revealTask(task.id);
                            }
                          },
                        },
                        h('span', { className: 'wh-pulse', 'aria-hidden': true }),
                        h(
                          'div',
                          { className: 'wh-row-main' },
                          h('div', { className: 'wh-row-title', title: task.title }, task.title),
                          h(
                            'div',
                            { className: 'wh-row-sub' },
                            h('span', { className: 'wh-ellip' }, executorLabel(task)),
                            h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                            h('span', null, t('tasks.updatedAgo', { time: relative(t, task.lastActivityAt ?? task.updatedAt) })),
                            activityOf(data, task) === ''
                              ? null
                              : h(
                                  React.Fragment,
                                  null,
                                  h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                                  h('span', { className: 'wh-ellip' }, activityOf(data, task)),
                                ),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'wh-row-actions' },
                          h('button', { type: 'button', className: 'wh-mini', onClick: (event) => { event.stopPropagation(); revealTask(task.id); } }, t('sessions.open')),
                          h('button', { type: 'button', className: 'wh-mini', onClick: (event) => { event.stopPropagation(); void updateStatus(task, 'todo', 'tasks.interruptedToast', 'doing'); } }, t('tasks.interrupt')),
                        ),
                      ),
                    ),
                  ),
            ),
            h(
              'section',
              { className: 'wh-sec' },
              h(
                'div',
                { className: 'wh-sec-hd' },
                h('h2', { className: 'wh-sec-title' }, t('overview.env')),
                h('span', { className: 'wh-sec-more wh-num' }, t('overview.readyCount', { ready: envCounts.ready, total: envCounts.total })),
                h(
                  'button',
                  { type: 'button', className: 'wh-sec-more', style: { marginLeft: 8 }, onClick: () => setEnvOpen(true) },
                  t('overview.viewAllEnv'),
                  h(Glyph, { name: 'chevronRight', size: 12 }),
                ),
              ),
              servers.length === 0
                ? h(
                    'div',
                    { className: 'wh-group' },
                    h(
                      'div',
                      { className: 'wh-empty-line', style: { flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px' } },
                      h('span', null, t('overview.envEmpty')),
                      h('span', { className: 'wh-hint' }, t('overview.envEmptySub')),
                    ),
                  )
                : h('div', { className: 'wh-group' }, servers.map(renderServerRow)),
            ),
          ),
          renderFooter(),
        );
      };

      const renderServerRow = (server) => {
        const phase = serverPhase(server);
        const pending = serverPending[server.name];
        const starting = phase === 'starting' || pending === 'start';
        const stateLabel =
          pending === 'stop'
            ? t('env.stopping')
            : starting === true
              ? t('env.startingFor', { time: formatElapsed(t, server.startedAt) })
              : t(`env.phase.${phase}`);
        const tone = pending === 'stop' ? 'warn' : serverTone(phase);
        const busy = pending !== undefined;
        const canStop = phase === 'ready' || phase === 'starting';
        const canStart = phase === 'stopped' || phase === 'failed';
        const primaryLabel = pending === 'stop' ? t('env.stopping') : starting === true ? t('env.starting') : canStop === true ? t('env.stop') : t('env.start');
        return h(
          'div',
          {
            key: server.name,
            className: 'wh-row always-actions' + (phase === 'failed' ? ' two' : ''),
            'data-wh-row': '',
            'data-kind': 'env',
            'data-id': server.name,
            tabIndex: 0,
          },
          h('span', { className: `wh-dot ${tone}`, 'aria-hidden': true }),
          h(
            'div',
            { className: 'wh-row-main' },
            h('div', { className: 'wh-row-title' }, server.name),
            phase === 'failed'
              ? h('div', { className: 'wh-row-sub' }, h('span', { className: 'wh-ellip', title: String(server.error ?? '') }, String(server.error ?? t('env.phase.failed'))))
              : h('div', { className: 'wh-row-sub' }, h('span', { className: 'wh-ellip' }, stateLabel)),
          ),
          typeof server.url === 'string' && server.url !== ''
            ? h(
                'button',
                { type: 'button', className: 'wh-mono wh-ellip', style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 }, onClick: (event) => { event.stopPropagation(); openServer(server); }, title: server.url },
                server.url,
              )
            : h('span', { className: 'wh-muted' }, t('env.noUrl')),
          h(
            'div',
            { className: 'wh-row-actions' },
            canStart === true
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'wh-mini',
                    disabled: busy,
                    title: busy ? t('env.busyHint') : t('env.startHint'),
                    onClick: (event) => {
                      event.stopPropagation();
                      void actServer(server, 'start');
                    },
                  },
                  pending === 'start' ? t('env.starting') : t('env.start'),
                )
              : null,
            canStop === true
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'wh-mini',
                    disabled: busy || phase === 'external',
                    title: phase === 'external' ? t('env.externalHint') : t('env.stopHint'),
                    onClick: (event) => {
                      event.stopPropagation();
                      void actServer(server, 'stop');
                    },
                  },
                  primaryLabel,
                )
              : null,
            typeof server.url === 'string' && server.url !== ''
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'wh-icon-btn sm',
                    'aria-label': t('env.open'),
                    title: t('env.openHint', { url: server.url }),
                    onClick: (event) => {
                      event.stopPropagation();
                      openServer(server);
                    },
                  },
                  h(Glyph, { name: 'external', size: 14 }),
                )
              : null,
          ),
        );
      };

      const renderSessionsView = () => {
        const needle = view.sessionQuery.trim().toLowerCase();
        const filtered = sessions
          .filter((session) => view.showClosed === true || session.archived !== true)
          .filter((session) => {
            if (view.sessionFilter === 'running') return session.running === true || (session.subchats ?? []).some((subchat) => subchat.status === 'running');
            if (view.sessionFilter === 'idle') return session.running !== true;
            if (view.sessionFilter === 'unread') return sessionUnreadCount(session, seen) > 0;
            return true;
          })
          .filter((session) => needle === '' || `${session.title ?? ''}`.toLowerCase().includes(needle));
        const countsForFilter = (filter) => {
          const rows = sessions.filter((session) => view.showClosed === true || session.archived !== true);
          if (filter === 'running') return rows.filter((session) => session.running === true).length;
          if (filter === 'idle') return rows.filter((session) => session.running !== true).length;
          if (filter === 'unread') return rows.filter((session) => sessionUnreadCount(session, seen) > 0).length;
          return rows.length;
        };
        return h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll' },
            h(
              'div',
              { className: 'wh-sess-toolbar' },
              h(
                'div',
                { className: 'wh-chips' },
                SESSION_FILTERS.map((filter) =>
                  h(
                    'button',
                    {
                      key: filter,
                      type: 'button',
                      className: 'wh-chip' + (view.sessionFilter === filter ? ' on' : ''),
                      'aria-pressed': view.sessionFilter === filter,
                      onClick: () => setView((current) => ({ ...current, sessionFilter: filter })),
                    },
                    t(`sessions.filter.${filter}`),
                    h('span', { className: 'wh-num' }, String(countsForFilter(filter))),
                  ),
                ),
              ),
              h(
                'label',
                { className: 'wh-flip' },
                h('input', {
                  type: 'checkbox',
                  checked: view.showClosed === true,
                  onChange: (event) => setView((current) => ({ ...current, showClosed: event.target.checked })),
                }),
                h('span', null, t('sessions.showClosed')),
              ),
              h(
                'div',
                { className: 'wh-field' },
                h(Glyph, { name: 'search', size: 14 }),
                h('input', {
                  ref: sessionSearchRef,
                  className: 'wh-input',
                  value: view.sessionQuery,
                  placeholder: t('sessions.searchPlaceholder'),
                  'aria-label': t('sessions.searchPlaceholder'),
                  onChange: (event) => setView((current) => ({ ...current, sessionQuery: event.target.value })),
                }),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'wh-btn lg primary',
                  disabled: scope.sessionId === undefined,
                  title: scope.sessionId === undefined ? t('sessions.needLive') : undefined,
                  onClick: () => setSubchatCreate({ open: true, sessionId: scope.sessionId, title: '', prompt: '', busy: false }),
                },
                h(Glyph, { name: 'plus', size: 13 }),
                t('sessions.newSubchat'),
              ),
            ),
            renderStaleBanner(),
            subchatCreate.open === true
              ? h(
                  'div',
                  { className: 'wh-create-sub' },
                  h('div', { className: 'wh-mono wh-muted' }, sessionTitleOf(subchatCreate.sessionId)),
                  h('input', {
                    className: 'wh-input',
                    value: subchatCreate.title,
                    placeholder: t('sessions.newSubchatTitle'),
                    'aria-label': t('sessions.newSubchatTitle'),
                    onChange: (event) => setSubchatCreate((current) => ({ ...current, title: event.target.value })),
                  }),
                  h('textarea', {
                    className: 'wh-textarea',
                    value: subchatCreate.prompt,
                    placeholder: t('sessions.newSubchatPrompt'),
                    'aria-label': t('sessions.newSubchatPrompt'),
                    onChange: (event) => setSubchatCreate((current) => ({ ...current, prompt: event.target.value })),
                  }),
                  h(
                    'div',
                    { className: 'wh-create-sub-row' },
                    h('span', { className: 'wh-spacer' }),
                    h('button', { type: 'button', className: 'wh-btn sm', onClick: () => setSubchatCreate({ open: false, sessionId: undefined, title: '', prompt: '', busy: false }) }, t('common.cancel')),
                    h(
                      'button',
                      { type: 'button', className: 'wh-btn sm primary', disabled: subchatCreate.busy === true || subchatCreate.prompt.trim() === '', onClick: () => void submitSubchatCreate() },
                      subchatCreate.busy === true ? t('settings.saving') : t('sessions.createSubchat'),
                    ),
                  ),
                )
              : null,
            filtered.length === 0
              ? h(
                  'div',
                  { className: 'wh-empty' },
                  h(Glyph, { name: 'chat', size: 26 }),
                  h('div', { className: 'wh-empty-title' }, sessions.length === 0 ? t('sessions.empty') : t('sessions.emptyFilter')),
                  sessions.length === 0
                    ? null
                    : h('div', { className: 'wh-templates' }, h('button', { type: 'button', className: 'wh-tpl', onClick: () => setView((current) => ({ ...current, sessionFilter: 'all', sessionQuery: '' })) }, t('sessions.filter.all'))),
                )
              : h('div', { className: 'wh-group' }, filtered.map(renderSessionRow)),
          ),
          renderFooter(),
        );
      };

      const renderSessionRow = (session) => {
        const subRows = (session.subchats ?? []).filter((subchat) => view.showClosed === true || subchat.status !== 'closed');
        const expanded = view.expandedSessions.includes(session.sessionId);
        const unread = sessionUnreadCount(session, seen);
        const running = session.running === true || (session.subchats ?? []).some((subchat) => subchat.status === 'running');
        const openMenu = menu !== null && menu.kind === 'session' && menu.id === session.sessionId;
        return h(
          'div',
          { className: 'wh-row-wrap', key: session.sessionId },
          h(
            'div',
            {
              className: 'wh-row wh-sess-row always-actions',
              'data-wh-row': '',
              'data-kind': 'session',
              'data-id': session.sessionId,
              tabIndex: 0,
              onClick: (event) => {
                if (typeof event.target.closest === 'function' && event.target.closest('button, input, textarea, select, a') !== null) return;
                toggleSession(session.sessionId);
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter' && event.target === event.currentTarget) {
                  event.preventDefault();
                  toggleSession(session.sessionId);
                }
              },
            },
            h('span', { className: `wh-dot ${expanded === true ? (running === true ? 'doing' : 'idle') : running === true ? 'doing' : 'idle'}`, 'aria-hidden': true }),
            h(
              'div',
              { className: 'wh-row-main' },
              h(
                'div',
                { className: 'wh-row-title' },
                h('span', { className: 'wh-ellip' }, session.title || t('sessions.untitled')),
                session.sessionId === scope.sessionId ? h('span', { className: 'wh-badge' }, t('sessions.current')) : null,
                session.orphanParent === true ? h('span', { className: 'wh-badge' }, t('sessions.orphanParent')) : null,
              ),
              h(
                'div',
                { className: 'wh-row-sub' },
                h('span', null, running === true ? t('sessions.running') : t('sessions.idle')),
                h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                h('span', null, t('sessions.subchatCount', { n: (session.subchats ?? []).length })),
                h('span', { className: 'wh-sep', 'aria-hidden': true }, '·'),
                h('span', { className: 'wh-num' }, relative(t, session.updatedAt)),
              ),
            ),
            unread > 0 ? h('span', { className: 'wh-badge unread', 'aria-label': t('sessions.unreadCount', { n: unread }) }, t('sessions.unreadBadge', { n: unread })) : null,
            h(
              'button',
              {
                type: 'button',
                className: 'wh-icon-btn sm wh-sess-chev' + (expanded === true ? ' on' : ''),
                'aria-expanded': expanded === true,
                'aria-label': expanded === true ? t('sessions.collapse') : t('sessions.expand'),
                title: expanded === true ? t('sessions.collapse') : t('sessions.expand'),
                onClick: (event) => {
                  event.stopPropagation();
                  toggleSession(session.sessionId);
                },
              },
              h(Glyph, { name: 'chevronRight', size: 14 }),
            ),
            h(
              'div',
              { className: 'wh-row-actions' },
              session.orphanParent === true
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'wh-mini',
                      onClick: (event) => {
                        event.stopPropagation();
                        openSession(session.sessionId);
                      },
                    },
                    t('sessions.open'),
                  ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'wh-icon-btn sm',
                  'data-wh-menu-toggle': `session:${session.sessionId}`,
                  'aria-haspopup': 'menu',
                  'aria-label': t('tasks.more'),
                  title: t('tasks.more'),
                  onClick: (event) => {
                    event.stopPropagation();
                    setMenu((current) => (current !== null && current.kind === 'session' && current.id === session.sessionId ? null : { kind: 'session', id: session.sessionId }));
                  },
                },
                h(Glyph, { name: 'more', size: 14 }),
              ),
            ),
          ),
          openMenu === true
            ? h(
                'div',
                { className: 'wh-menu', 'data-wh-menu': '', role: 'menu' },
                session.orphanParent === true ? null : menuButton('sessions.open', () => openSession(session.sessionId)),
                menuButton('sessions.newSubchat', () => setSubchatCreate({ open: true, sessionId: session.sessionId, title: '', prompt: '', busy: false })),
              )
            : null,
          expanded === true
            ? h(
                'div',
                { className: 'wh-sub-list' },
                subRows.length === 0
                  ? h('div', { className: 'wh-sub-empty' }, t('sessions.noSubchats'))
                  : subRows.map((subchat) => renderSubchatRow(session, subchat)),
              )
            : null,
        );
      };

      const renderSubchatRow = (session, subchat) => {
        const editKey = `sub:${subchat.id}`;
        const draft = edits[editKey]?.note ?? '';
        const unread = subchatUnread(subchat, seen);
        const running = subchat.status === 'running';
        const closed = subchat.status === 'closed';
        return h(
          'div',
          {
            key: subchat.id,
            className: 'wh-subrow' + (closed === true ? ' closed' : ''),
            'data-wh-row': '',
            'data-kind': 'subchat',
            'data-id': subchat.id,
            tabIndex: 0,
          },
          h('span', { className: `wh-dot ${running === true ? 'doing' : closed === true ? 'closed' : 'idle'} wh-sub-dot`, 'aria-hidden': true }),
          h(
            'div',
            { className: 'wh-sub-main' },
            h(
              'div',
              { className: 'wh-sub-title' },
              h('span', { className: 'wh-ellip' }, subchat.title || t('sessions.untitled')),
              h('span', { className: 'wh-sub-state' }, t(`subchats.status.${subchat.status}`)),
              unread === true ? h('span', { className: 'wh-badge unread' }, t('sessions.unreadBadge', { n: 1 })) : null,
            ),
            h(
              'div',
              { className: 'wh-sub-reply', title: subchat.lastAssistantMessage ?? '' },
              h(Glyph, { name: 'quote', size: 12 }),
              h('span', { className: 'wh-ellip-2' }, subchat.lastAssistantMessage ?? t('sessions.noReply')),
            ),
            subchat.status === 'closed' || subchat.status === 'failed'
              ? null
              : h(
                  'div',
                  { className: 'wh-composer' },
                  h('input', {
                    className: 'wh-input sm',
                    value: draft,
                    placeholder: t('sessions.sendPlaceholder'),
                    'aria-label': t('sessions.sendPlaceholder'),
                    onChange: (event) => setEdits((state) => ({ ...state, [editKey]: { ...(state[editKey] ?? {}), note: event.target.value } })),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && event.shiftKey !== true) {
                        event.preventDefault();
                        void sendSubchat(session, subchat);
                      }
                    },
                  }),
                  h(
                    'button',
                    { type: 'button', className: 'wh-btn sm', disabled: draft.trim() === '', onClick: () => void sendSubchat(session, subchat) },
                    t('sessions.send'),
                  ),
                ),
          ),
          h('div', { className: 'wh-sub-meta' }, h('span', { className: 'wh-num' }, relative(t, subchat.updatedAt))),
          h(
            'div',
            { className: 'wh-sub-actions' },
            h('button', { type: 'button', className: 'wh-mini', onClick: () => openSubchat(session, subchat) }, t('sessions.open')),
            running === true
              ? h('button', { type: 'button', className: 'wh-mini', onClick: () => void subchatAction(session, subchat, 'interrupt') }, t('subchats.interrupt'))
              : null,
            closed === true
              ? h('button', { type: 'button', className: 'wh-mini', onClick: () => void subchatAction(session, subchat, 'reopen') }, t('subchats.reopen'))
              : h('button', { type: 'button', className: 'wh-mini', onClick: () => void subchatAction(session, subchat, 'close') }, t('subchats.close')),
          ),
        );
      };

      const renderEnvPopover = () => {
        if (envOpen !== true || settingsOpen === true) return null;
        return h(
          'div',
          {
            className: 'wh-pop',
            'data-wh-env': '',
            role: 'dialog',
            'aria-label': t('env.popTitle'),
            onKeyDown: (event) => {
              if (event.key === 'Tab') trapTab(event, event.currentTarget);
            },
          },
          h(
            'div',
            { className: 'wh-pop-hd' },
            t('env.popTitle'),
            h('span', { className: 'wh-spacer' }),
            h('span', { className: 'wh-pop-count wh-num' }, t('env.readyCount', { ready: envCounts.ready, total: envCounts.total })),
          ),
          servers.length === 0
            ? h('div', { className: 'wh-pop-empty' }, t('env.none'))
            : servers.map((server) => {
                const phase = serverPhase(server);
                const pending = serverPending[server.name];
                const busy = pending !== undefined;
                const canStart = phase === 'stopped' || phase === 'failed';
                return h(
                  'div',
                  { className: 'wh-pop-row', key: server.name },
                  h('span', { className: `wh-dot ${serverTone(phase)}`, 'aria-hidden': true }),
                  h(
                    'div',
                    { className: 'wh-pop-main' },
                    h('div', { className: 'wh-pop-name' }, h('span', { className: 'wh-ellip' }, server.name), h('span', { className: 'wh-badge' }, t(`env.phase.${phase}`))),
                    h('div', { className: 'wh-pop-url' }, server.url ?? t('env.noUrl')),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'wh-btn sm',
                      disabled: busy,
                      onClick: () => void actServer(server, canStart === true ? 'start' : 'stop'),
                    },
                    canStart === true ? t('env.start') : phase === 'starting' ? t('env.starting') : t('env.stop'),
                  ),
                  server.url === null || server.url === undefined
                    ? null
                    : h(
                        'button',
                        { type: 'button', className: 'wh-icon-btn sm', 'aria-label': t('env.open'), title: t('env.openHint', { url: server.url }), onClick: () => openServer(server) },
                        h(Glyph, { name: 'external', size: 14 }),
                      ),
                );
              }),
          h('div', { className: 'wh-pop-foot' }, h('button', { type: 'button', className: 'wh-menu-item', onClick: () => { setEnvOpen(false); setView((current) => ({ ...current, nav: 'overview' })); } }, h(Glyph, { name: 'grid', size: 14 }), h('span', null, t('env.popFoot')))),
        );
      };

      const renderDispatch = () => {
        if (sheet.open !== true) return null;
        const task = latestTask(sheet.taskId) ?? tasks.find((row) => row.id === sheet.taskId);
        if (task === undefined) return null;
        const existingOptions = sessions.filter((session) => session.orphanParent !== true);
        const targetRow = (value, title, sub) =>
          h(
            'button',
            {
              type: 'button',
              className: 'wh-target' + (sheet.target === value ? ' on' : ''),
              role: 'radio',
              'aria-checked': sheet.target === value,
              onClick: () =>
                setSheet((current) => ({
                  ...current,
                  target: value,
                  existing: current.existing === '' ? existingOptions[0]?.sessionId ?? '' : current.existing,
                })),
            },
            h('span', { className: 'wh-radio', 'aria-hidden': true }),
            h('span', { className: 'wh-target-main' }, h('span', { className: 'wh-target-title' }, title), h('span', { className: 'wh-target-sub' }, sub)),
          );
        return h(
          OverlayDialog,
          { label: t('dispatch.title', { title: task.title }), onClose: closeDispatch, className: 'wh-sheet' },
          h(
            'div',
            { className: 'wh-sheet-hd' },
            h('div', { className: 'wh-sheet-title' }, t('dispatch.title', { title: task.title })),
            h('button', { type: 'button', className: 'wh-icon-btn', 'aria-label': t('common.close'), onClick: closeDispatch }, h(Glyph, { name: 'close', size: 16 })),
          ),
          h('div', { className: 'wh-sheet-sub' }, t('dispatch.sub')),
          h(
            'div',
            { className: 'wh-sheet-body' },
            h('div', { className: 'wh-field-label' }, t('dispatch.target')),
            targetRow('new', t('dispatch.new'), t('dispatch.newSub')),
            targetRow('existing', t('dispatch.existing'), t('dispatch.existingSub')),
            sheet.target === 'existing'
              ? existingOptions.length === 0
                ? h('div', { className: 'wh-hint', style: { marginTop: 6 } }, t('dispatch.needSession'))
                : h(
                    'select',
                    {
                      className: 'wh-select',
                      style: { marginTop: 6 },
                      value: sheet.existing,
                      'aria-label': t('dispatch.selectExisting'),
                      onChange: (event) => setSheet((current) => ({ ...current, existing: event.target.value })),
                    },
                    existingOptions.map((session) =>
                      h(
                        'option',
                        { key: session.sessionId, value: session.sessionId },
                        `${session.title || t('sessions.untitled')} · ${session.running === true ? t('sessions.running') : t('sessions.idle')}`,
                      ),
                    ),
                  )
              : null,
            h('div', { className: 'wh-field-label' }, t('dispatch.note')),
            h('textarea', {
              className: 'wh-textarea',
              value: sheet.note,
              placeholder: t('dispatch.notePlaceholder'),
              'aria-label': t('dispatch.note'),
              onChange: (event) => setSheet((current) => ({ ...current, note: event.target.value })),
            }),
            h(
              'label',
              { className: 'wh-check' },
              h('input', { type: 'checkbox', checked: sheet.openAfter === true, onChange: (event) => setSheet((current) => ({ ...current, openAfter: event.target.checked })) }),
              h('span', null, t('dispatch.openAfter')),
            ),
          ),
          h(
            'div',
            { className: 'wh-sheet-foot' },
            h('span', { className: 'wh-hint' }, t('dispatch.hint')),
            h('span', { className: 'wh-spacer' }),
            h('button', { type: 'button', className: 'wh-btn', onClick: closeDispatch }, t('dispatch.cancel')),
            h(
              'button',
              {
                type: 'button',
                className: 'wh-btn primary',
                disabled: sheet.busy === true || (sheet.target === 'existing' && sheet.existing === ''),
                onClick: () => void submitDispatch(),
              },
              sheet.busy === true ? t('dispatch.sending') : t('dispatch.send'),
            ),
          ),
        );
      };

      const renderPalette = () => {
        if (palette.open !== true) return null;
        const items = paletteData.flat;
        const active = items[palette.index];
        let index = -1;
        return h(
          OverlayDialog,
          { label: t('palette.label'), onClose: closePalette, palette: true, className: 'wh-palette' },
          h(
            'div',
            { className: 'wh-pal-input' },
            h(Glyph, { name: 'search', size: 16 }),
            h('input', {
              'data-wh-autofocus': '',
              value: palette.query,
              placeholder: t('palette.placeholder'),
              'aria-label': t('palette.placeholder'),
              autoComplete: 'off',
              role: 'combobox',
              'aria-expanded': 'true',
              'aria-controls': 'wh-pal-list',
              'aria-activedescendant': active === undefined ? undefined : `wh-pal-${palette.index}`,
              onChange: (event) => setPalette((current) => ({ ...current, query: event.target.value, index: 0 })),
              onKeyDown: onPaletteKeyDown,
            }),
            h('span', { className: 'wh-kbd' }, 'esc'),
          ),
          h(
            'div',
            { className: 'wh-pal-list', id: 'wh-pal-list', role: 'listbox', 'aria-label': t('palette.results') },
            items.length === 0
              ? h('div', { className: 'wh-pal-empty' }, t('palette.empty', { q: palette.query }))
              : paletteData.groups.map((group) =>
                  h(
                    React.Fragment,
                    { key: group.key },
                    h('div', { className: 'wh-pal-group' }, group.label),
                    group.items.map((item) => {
                      index += 1;
                      const itemIndex = index;
                      return h(
                        'button',
                        {
                          key: item.key,
                          type: 'button',
                          id: `wh-pal-${itemIndex}`,
                          role: 'option',
                          'aria-selected': itemIndex === palette.index,
                          disabled: item.disabled === true,
                          title: item.disabled === true ? item.hint : undefined,
                          className: 'wh-pal-row' + (itemIndex === palette.index ? ' on' : ''),
                          onClick: () => runPaletteItem(item),
                        },
                        h(Glyph, { name: item.icon, size: 15 }),
                        h('span', { className: 'wh-ellip' }, item.label),
                        item.hint === '' || item.hint === undefined ? null : h('span', { className: 'wh-pal-rt' }, item.hint),
                      );
                    }),
                  ),
                ),
          ),
          h(
            'div',
            { className: 'wh-pal-foot' },
            h('span', null, h('span', { className: 'wh-kbd' }, '↑'), h('span', { className: 'wh-kbd' }, '↓'), ' ', t('palette.select')),
            h('span', null, h('span', { className: 'wh-kbd' }, '↵'), ' ', t('palette.run')),
            h('span', null, h('span', { className: 'wh-kbd' }, 'esc'), ' ', t('palette.close')),
            h('span', { className: 'wh-spacer' }),
            h('span', { className: 'wh-pal-ws' }, `${workspaceTitle || t('panel.untitledWorkspace')} · ${t('panel.title')}`),
          ),
        );
      };

      const renderToasts = () =>
        h(
          'div',
          { className: 'wh-toasts', 'aria-live': 'polite', 'aria-atomic': 'false' },
          toasts.map((row) =>
            h(
              'div',
              { key: row.id, className: 'wh-toast' + (row.error === true ? ' error' : '') },
              row.error === true ? h(Glyph, { name: 'alert', size: 14 }) : null,
              h('span', null, row.text),
              row.action === undefined
                ? null
                : h('button', { type: 'button', className: 'wh-toast-act', onClick: () => runToast(row) }, row.action),
            ),
          ),
        );

      const renderSkeleton = () =>
        h(
          'div',
          { className: 'wh-view' },
          h(
            'div',
            { className: 'wh-scroll' },
            h(
              'div',
              { className: 'wh-group' },
              [0, 1, 2, 3].map((row) =>
                h(
                  'div',
                  { className: 'wh-sk-row', key: row },
                  h('span', { className: 'wh-sk wh-sk-circle' }),
                  h('div', { className: 'wh-sk-stack' }, h('span', { className: 'wh-sk wh-sk-line w1' }), h('span', { className: 'wh-sk wh-sk-line w2' })),
                ),
              ),
            ),
          ),
        );

      const renderErrorState = () =>
        h(
          'div',
          { className: 'wh-empty' },
          h(Glyph, { name: 'alert', size: 24 }),
          h('div', { className: 'wh-empty-title' }, t('panel.error')),
          h('div', { className: 'wh-empty-sub' }, snap.error === undefined ? t('panel.errorSub') : `${snap.error}. ${t('panel.errorSub')}`),
          h('button', { type: 'button', className: 'wh-btn primary', onClick: () => void snap.refresh() }, t('panel.reload')),
        );

      const renderBody = () => {
        if (settingsOpen === true) {
          return h(SettingsView, { t, base, pushToast, onBack: closeSettings, onDirtyChange: setSettingsDirty });
        }
        if (slowLoading === true && data === undefined) return renderSkeleton();
        if (data === undefined) {
          if (snap.error !== undefined) return renderErrorState();
          if (snap.loading !== true) return renderSkeleton();
          return null;
        }
        if (view.nav === 'tasks') return renderTasksView();
        if (view.nav === 'sessions') return renderSessionsView();
        return renderOverview();
      };

      if (workspaceKey === '') {
        return h(
          'div',
          { className: 'wh-root', ref: rootRef, tabIndex: -1 },
          h('style', null, CSS),
          h('div', { className: 'wh-empty' }, h(Icon, { size: 24 }), h('div', { className: 'wh-empty-title' }, t('panel.title')), h('div', { className: 'wh-empty-sub' }, t('panel.noWorkspace'))),
        );
      }

      return h(
        'div',
        { className: 'wh-root', ref: rootRef, tabIndex: -1, onKeyDown, onMouseDown: onRootMouseDown },
        h('style', null, CSS),
        renderHeader(),
        renderStrip(),
        renderNav(),
        h('main', { className: 'wh-content' }, renderBody()),
        renderMenu(),
        renderEnvPopover(),
        renderDispatch(),
        renderPalette(),
        renderToasts(),
      );
    }

    const inject = ['slots', 'locale', 'uiWorkspace', 'layout', 'sessions'];

    function apply(ctx) {
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, DICT), 'workspace-hub: dictionaries');
      openChildSession = (sessionId) => {
        const address = ctx.sessions?.subagentAddress?.(sessionId);
        ctx.uiWorkspace.openSession(address ?? sessionId);
      };
      openSessionById = (sessionId) => ctx.uiWorkspace.openSession(sessionId);
      selectHubPanel = (workspaceId) => {
        hubSelection.set(typeof workspaceId === 'string' && workspaceId !== '' ? workspaceId : 'all');
        ctx.layout.selectPanel(PANEL_ID);
      };
      translate = t;

      // One global hub panel at the root. Workspaces are reached by selection,
      // not by a panel per workspace.
      ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, WorkspaceHubPanel),
      );
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          { name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS, label: () => t('panel.title') },
          HubNavIcon,
        ),
      );

      // Entries on the hub session row inside its workspace group.
      ctx.slots.inject('conversation.header.leading', () =>
        ctx.slots.register({ name: 'conversation.header.leading', locale: NS }, HubWorkspaceButton),
      );

      // Sub-chat entries under the main conversation: a hover action badge, a
      // hover-card summary, and the frame-wide menu those rows open.
      ctx.slots.inject('sidebar.workspaces.session.row.action', () =>
        ctx.slots.register({ name: 'sidebar.workspaces.session.row.action', id: 'workspace-hub-subchats', order: 50, locale: NS }, SubchatRowAction),
      );
      ctx.slots.inject('sidebar.session.row.hover', () =>
        ctx.slots.register({ name: 'sidebar.session.row.hover', id: 'workspace-hub-subchats', order: 20, locale: NS }, SubchatHover),
      );
      ctx.slots.inject('sidebar.session.row.leading', () =>
        ctx.slots.register({ name: 'sidebar.session.row.leading', id: 'workspace-hub-subchats', order: 30, locale: NS }, SubchatLeading),
      );
      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'workspace-hub-subchat-menu', order: 900, locale: NS }, SubchatMenu),
      );
    }

    return { inject, apply };
  },
});
