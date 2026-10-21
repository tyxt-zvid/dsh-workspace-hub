/**
 * Workspace Hub — Client half.
 *
 * Registers a global sidebar entry and its main panel. The panel reads and writes
 * the Host board through one authenticated same-origin JSON route; it imports no
 * Harness Client package, only React from the platform module table.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-workspace-hub',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'workspace-hub';
    const PANEL_ID = 'workspace-hub';
    const GUIDE_KEY = 'workspace-hub:guide:v1';
    const API = '/workspace-hub/api/';

    const DICT = {
      en: {
        'panel.title': 'Workspace Hub',
        'panel.tasks': 'Tasks',
        'panel.subchats': 'Sub chats',
        'panel.sessions': 'Conversations',
        'panel.workspace': 'Workspace',
        'guide.show': 'Guide',
        'guide.title': 'Getting started',
        'guide.dismiss': 'Got it',
        'guide.step1': 'The “Hub” button sits at the far left of the main header and opens this workspace’s board.',
        'guide.step2': 'Tasks: create a task, claim it yourself, or dispatch it to a conversation (new or existing).',
        'guide.step3': 'Conversations: every main session in this workspace with its sub chats nested; hover a session row to start a sub chat.',
        'guide.step4': 'Workspace: edit AGENTS.md and the hub-managed CONTEXT.md, create .dsh/skills skills; global rules stay read-only.',
        'guide.step5': 'Sub chats don’t interrupt the main conversation when they finish normally; check Conversations or the sidebar popover for the latest reply.',
        'workspace.readOnly': 'Read-only preview.',
        'workspace.inheritedHint': 'Inherited chain (read-only); edit the workspace file below.',
        'workspace.workspaceRules': 'Workspace AGENTS.md',
        'workspace.rulesHint': 'Saved to <workspace>/AGENTS.md. The framework re-reads instructions on the next request or session resume.',
        'workspace.context': 'Workspace context (hub-managed)',
        'workspace.contextHint': 'Injected into every conversation in this workspace',
        'workspace.contextPlaceholder': 'Shared instructions or background every session in this workspace should know…',
        'workspace.contextEffect': 'Saved to .dsh/workspace-hub/CONTEXT.md; live sessions pick it up on their next request, new sessions immediately.',
        'workspace.save': 'Save',
        'workspace.newSkill': 'New skill',
        'workspace.skillName': 'skill-name (kebab-case)',
        'workspace.skillDescription': 'One-line description',
        'workspace.skillBody': 'Skill instructions…',
        'workspace.savedRules': 'Workspace AGENTS.md saved.',
        'workspace.savedContext': 'Workspace context saved.',
        'workspace.savedSkill': 'Skill created.',
        'workspace.rules': 'Rules & context',
        'workspace.globalRules': 'User-global',
        'workspace.projectRules': 'Project / workspace',
        'workspace.rulesEmpty': 'No instruction files found.',
        'workspace.skills': 'Skills',
        'workspace.skillsEmpty': 'No skills are visible to this workspace.',
        'workspace.exists': '{n} B',
        'workspace.missing': 'not created',
        'workspace.projectRoot': 'Project root',
        'workspace.source.project': 'workspace',
        'workspace.source.user': 'user',
        'workspace.source.bundled': 'built-in',
        'workspace.source.custom': 'custom',
        'workspace.source.unknown': 'other',
        'workspace.modelOnly': 'model',
        'workspace.userOnly': 'user',
        'sessions.empty': 'No conversations in this workspace yet.',
        'sessions.running': 'running',
        'sessions.idle': 'idle',
        'sessions.subchatCount': '{n} sub chats',
        'sessions.open': 'Open',
        'sessions.newSubchat': 'New sub chat',
        'sessions.collapse': 'Collapse',
        'sessions.expand': 'Expand',
        'sessions.orphanParent': 'Parent conversation not listed',
        'sessions.subchatStatus.running': 'running',
        'sessions.subchatStatus.idle': 'idle',
        'sessions.subchatStatus.active': 'active',
        'sessions.subchatStatus.closed': 'closed',
        'sessions.subchatStatus.provisioning': 'starting',
        'sessions.subchatStatus.failed': 'failed',
        'panel.refresh': 'Refresh',
        'panel.loading': 'Loading…',
        'panel.noWorkspace': 'Open a workspace conversation to use the Workspace Hub.',
        'panel.reload': 'Reload',
        'panel.error': 'The workspace board could not be read.',
        'tasks.new': 'New task',
        'tasks.titlePlaceholder': 'What needs to be done?',
        'tasks.detailPlaceholder': 'Optional details, links, acceptance criteria…',
        'tasks.create': 'Create task',
        'tasks.cancel': 'Cancel',
        'tasks.empty': 'No tasks on this workspace board yet.',
        'tasks.emptyFilter': 'No tasks match this filter.',
        'tasks.filter.all': 'All',
        'tasks.filter.todo': 'To do',
        'tasks.filter.doing': 'Doing',
        'tasks.filter.blocked': 'Blocked',
        'tasks.filter.done': 'Done',
        'tasks.priority.low': 'Low',
        'tasks.priority.normal': 'Normal',
        'tasks.priority.high': 'High',
        'tasks.claim': 'Claim',
        'tasks.release': 'Release',
        'tasks.dispatch': 'Dispatch',
        'tasks.done': 'Done',
        'tasks.reopen': 'Reopen',
        'tasks.delete': 'Delete',
        'tasks.confirmDelete': 'Delete this task?',
        'tasks.rev': 'rev',
        'tasks.unassigned': 'Unassigned',
        'tasks.dispatchNew': 'Start a new conversation',
        'tasks.dispatchExisting': 'Send to an existing conversation',
        'tasks.dispatchGo': 'Dispatch',
        'tasks.dispatched': 'Dispatched to {session}',
        'tasks.open': 'Open',
        'subchats.new': 'New sub chat',
        'subchats.newShort': 'New sub chat',
        'subchats.titlePlaceholder': 'Short name (optional)',
        'subchats.promptPlaceholder': 'What should this sub chat work on?',
        'subchats.create': 'Start sub chat',
        'subchats.cancel': 'Cancel',
        'subchats.empty': 'No sub chats in this conversation yet.',
        'subchats.emptyClosed': 'No sub chats here yet. Use New sub chat to start one.',
        'subchats.send': 'Send',
        'subchats.sendPlaceholder': 'Message this sub chat…',
        'subchats.interrupt': 'Interrupt',
        'subchats.close': 'Close',
        'subchats.reopen': 'Reopen',
        'subchats.running': 'working',
        'subchats.idle': 'idle',
        'subchats.closed': 'closed',
        'subchats.showClosed': 'Show closed',
        'subchats.openHint': 'Sub chats run as separate conversations owned by this one. Replies arrive here as notices.',
        'subchats.noSession': 'This panel manages sub chats of the conversation you are viewing. Open a conversation first.',
        'subchats.lastReply': 'Last reply',
        'sidebar.subchats': 'Sub chats',
        'sidebar.subchats.count': '{n} sub chats',
        'sidebar.board': 'Workspace hub',
        'sidebar.boardShort': 'Hub',
        'menu.title': 'Sub chats',
        'menu.empty': 'No open sub chats.',
        'menu.open': 'Open',
        'common.failed': 'Action failed',
        'common.retry': 'Retry',
        'time.now': 'just now',
        'time.minute': '{n}m ago',
        'time.hour': '{n}h ago',
        'time.day': '{n}d ago',
      },
      zh: {
        'panel.title': '工作区中枢',
        'panel.tasks': '任务',
        'panel.subchats': '子会话',
        'panel.sessions': '会话',
        'panel.workspace': '工作区',
        'guide.show': '引导',
        'guide.title': '快速开始',
        'guide.dismiss': '知道了',
        'guide.step1': '主界面标题栏最左侧的「中枢」按钮打开当前工作区的看板。',
        'guide.step2': '任务：新建任务后用 claim 自己做，或 dispatch 派发给新建/已有会话。',
        'guide.step3': '会话：列出工作区全部主会话及其子会话；hover 会话行即可新建子会话。',
        'guide.step4': '工作区：编辑 AGENTS.md 与中枢托管的 CONTEXT.md、新建 .dsh/skills 技能；全局规则只读。',
        'guide.step5': '子会话普通完成不会打扰主对话；最新回复在「会话」页或侧边栏浮层查看。',
        'workspace.readOnly': '只读预览。',
        'workspace.inheritedHint': '继承链（只读）；可在下方编辑工作区文件。',
        'workspace.workspaceRules': '工作区 AGENTS.md',
        'workspace.rulesHint': '保存到 <workspace>/AGENTS.md；框架会在下一次请求或会话 resume 时重新读取指令。',
        'workspace.context': '工作区上下文（中枢托管）',
        'workspace.contextHint': '注入到该工作区的每个会话',
        'workspace.contextPlaceholder': '该工作区所有会话都应知道的共享说明或背景…',
        'workspace.contextEffect': '保存到 .dsh/workspace-hub/CONTEXT.md；活动会话下一轮生效，新会话立即生效。',
        'workspace.save': '保存',
        'workspace.newSkill': '新建技能',
        'workspace.skillName': 'skill-name（kebab-case）',
        'workspace.skillDescription': '一句话描述',
        'workspace.skillBody': '技能说明…',
        'workspace.savedRules': '工作区 AGENTS.md 已保存。',
        'workspace.savedContext': '工作区上下文已保存。',
        'workspace.savedSkill': '技能已创建。',
        'workspace.rules': '规则与上下文',
        'workspace.globalRules': '用户全局',
        'workspace.projectRules': '项目 / 工作区',
        'workspace.rulesEmpty': '没有找到指令文件。',
        'workspace.skills': '技能',
        'workspace.skillsEmpty': '当前工作区没有可见技能。',
        'workspace.exists': '{n} B',
        'workspace.missing': '未创建',
        'workspace.projectRoot': '项目根目录',
        'workspace.source.project': '工作区',
        'workspace.source.user': '用户',
        'workspace.source.bundled': '内置',
        'workspace.source.custom': '自定义',
        'workspace.source.unknown': '其他',
        'workspace.modelOnly': '模型',
        'workspace.userOnly': '用户',
        'sessions.empty': '这个工作区还没有会话。',
        'sessions.running': '运行中',
        'sessions.idle': '空闲',
        'sessions.subchatCount': '{n} 个子会话',
        'sessions.open': '打开',
        'sessions.newSubchat': '新建子会话',
        'sessions.collapse': '收起',
        'sessions.expand': '展开',
        'sessions.orphanParent': '父会话不在列表中',
        'sessions.subchatStatus.running': '运行中',
        'sessions.subchatStatus.idle': '空闲',
        'sessions.subchatStatus.active': '已就绪',
        'sessions.subchatStatus.closed': '已关闭',
        'sessions.subchatStatus.provisioning': '创建中',
        'sessions.subchatStatus.failed': '失败',
        'panel.refresh': '刷新',
        'panel.loading': '加载中…',
        'panel.noWorkspace': '请先打开一个工作区会话，再使用工作区中枢。',
        'panel.reload': '重新加载',
        'panel.error': '无法读取工作区任务板。',
        'tasks.new': '新建任务',
        'tasks.titlePlaceholder': '需要完成什么？',
        'tasks.detailPlaceholder': '可选：细节、链接、验收标准…',
        'tasks.create': '创建任务',
        'tasks.cancel': '取消',
        'tasks.empty': '这个工作区的任务板还没有任务。',
        'tasks.emptyFilter': '没有符合筛选条件的任务。',
        'tasks.filter.all': '全部',
        'tasks.filter.todo': '待办',
        'tasks.filter.doing': '进行中',
        'tasks.filter.blocked': '阻塞',
        'tasks.filter.done': '已完成',
        'tasks.priority.low': '低',
        'tasks.priority.normal': '普通',
        'tasks.priority.high': '高',
        'tasks.claim': '认领',
        'tasks.release': '释放',
        'tasks.dispatch': '派发',
        'tasks.done': '完成',
        'tasks.reopen': '重开',
        'tasks.delete': '删除',
        'tasks.confirmDelete': '删除这个任务？',
        'tasks.rev': '版本',
        'tasks.unassigned': '未分配',
        'tasks.dispatchNew': '新建一个对话来执行',
        'tasks.dispatchExisting': '派给已有对话',
        'tasks.dispatchGo': '派发',
        'tasks.dispatched': '已派发给 {session}',
        'tasks.open': '打开',
        'subchats.new': '新建子会话',
        'subchats.newShort': '新建子会话',
        'subchats.titlePlaceholder': '简短名称（可选）',
        'subchats.promptPlaceholder': '这个子会话要做什么？',
        'subchats.create': '创建子会话',
        'subchats.cancel': '取消',
        'subchats.empty': '这个会话还没有子会话。',
        'subchats.emptyClosed': '还没有子会话。点击“新建子会话”开始一个。',
        'subchats.send': '发送',
        'subchats.sendPlaceholder': '给子会话发消息…',
        'subchats.interrupt': '中断',
        'subchats.close': '关闭',
        'subchats.reopen': '重新打开',
        'subchats.running': '工作中',
        'subchats.idle': '空闲',
        'subchats.closed': '已关闭',
        'subchats.showClosed': '显示已关闭',
        'subchats.openHint': '子会话是由当前对话管理的独立对话，回复会以通知形式回到这里。',
        'subchats.noSession': '这个面板管理“当前正在查看的对话”的子会话。请先打开一个对话。',
        'subchats.lastReply': '最新回复',
        'sidebar.subchats': '子会话',
        'sidebar.subchats.count': '{n} 个子会话',
        'sidebar.board': '工作区中枢',
        'sidebar.boardShort': '中枢',
        'menu.title': '子会话',
        'menu.empty': '没有打开的子会话。',
        'menu.open': '打开',
        'common.failed': '操作失败',
        'common.retry': '重试',
        'time.now': '刚刚',
        'time.minute': '{n} 分钟前',
        'time.hour': '{n} 小时前',
        'time.day': '{n} 天前',
      },
    };

    const CSS = `
      .dsh-hub { display:flex; flex-direction:column; height:100%; min-height:0; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); }
      .dsh-hub * { box-sizing:border-box; }
      .dsh-hub-head { display:flex; align-items:flex-start; gap:12px; padding:18px 24px 10px; }
      .dsh-hub-head-text { min-width:0; flex:1; }
      .dsh-hub-title { margin:0; font-size:18px; font-weight:600; line-height:1.3; }
      .dsh-hub-where { margin-top:3px; font-size:12px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-where code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11.5px; }
      .dsh-hub-btn { appearance:none; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:8px; padding:6px 10px; font-size:12.5px; line-height:1.2; cursor:pointer; }
      .dsh-hub-btn:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-interactive-bg-hover); }
      .dsh-hub-btn[disabled] { opacity:.5; cursor:default; }
      .dsh-hub-btn.primary { background:var(--dsw-alias-button-primary-fill); border-color:var(--dsw-alias-button-primary-fill); color:var(--dsw-alias-label-primary-foreground); }
      .dsh-hub-btn.primary:hover { background:var(--dsw-alias-button-primary-hover); border-color:var(--dsw-alias-button-primary-hover); color:var(--dsw-alias-label-primary-foreground); }
      .dsh-hub-btn.ghost { background:transparent; border-color:transparent; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-btn.ghost:hover { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-1); }
      .dsh-hub-btn.danger:hover { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
      .dsh-hub-tabs { display:flex; gap:4px; padding:0 24px; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .dsh-hub-tab { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-secondary); font-size:13px; padding:9px 12px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
      .dsh-hub-tab.active { color:var(--dsw-alias-label-primary); border-bottom-color:var(--dsw-alias-brand-primary); font-weight:600; }
      .dsh-hub-tab .count { margin-left:6px; font-size:11px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-body { flex:1; min-height:0; overflow:auto; padding:16px 24px 40px; }
      .dsh-hub-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:12px; }
      .dsh-hub-chips { display:flex; flex-wrap:wrap; gap:4px; flex:1; }
      .dsh-hub-chip { appearance:none; border:1px solid transparent; background:transparent; color:var(--dsw-alias-label-secondary); border-radius:999px; padding:4px 10px; font-size:12px; cursor:pointer; }
      .dsh-hub-chip:hover { background:var(--dsw-alias-interactive-bg-hover); }
      .dsh-hub-chip.active { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); border-color:var(--dsw-alias-border-l1); }
      .dsh-hub-form { border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); border-radius:12px; padding:12px; margin-bottom:12px; display:flex; flex-direction:column; gap:8px; }
      .dsh-hub-input, .dsh-hub-textarea, .dsh-hub-select { width:100%; font:inherit; font-size:13px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); border:1px solid var(--dsw-alias-border-l2); border-radius:8px; padding:8px 10px; outline:none; }
      .dsh-hub-input:focus, .dsh-hub-textarea:focus, .dsh-hub-select:focus { border-color:var(--dsw-alias-brand-primary); }
      .dsh-hub-textarea { min-height:66px; resize:vertical; }
      .dsh-hub-form-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .dsh-hub-form-row .spacer { flex:1; }
      .dsh-hub-list { display:flex; flex-direction:column; gap:8px; }
      .dsh-hub-card { border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); border-radius:12px; padding:12px 14px; }
      .dsh-hub-card-top { display:flex; align-items:flex-start; gap:10px; }
      .dsh-hub-dot { width:9px; height:9px; border-radius:50%; margin-top:5px; flex:none; background:var(--dsw-alias-state-idle-primary); }
      .dsh-hub-dot.doing { background:var(--dsw-alias-brand-primary); }
      .dsh-hub-dot.running { background:var(--dsw-alias-state-success-primary); }
      .dsh-hub-dot.blocked { background:var(--dsw-alias-state-warn-primary); }
      .dsh-hub-dot.done, .dsh-hub-dot.closed { background:var(--dsw-alias-state-success-primary); opacity:.55; }
      .dsh-hub-dot.cancelled { background:var(--dsw-alias-state-error-primary); opacity:.6; }
      .dsh-hub-card-main { min-width:0; flex:1; }
      .dsh-hub-card-title { font-size:13.5px; font-weight:600; line-height:1.35; word-break:break-word; }
      .dsh-hub-card-title.done { text-decoration:line-through; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-meta { margin-top:4px; display:flex; flex-wrap:wrap; gap:8px; font-size:11.5px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-detail { margin-top:6px; font-size:12.5px; color:var(--dsw-alias-label-secondary); white-space:pre-wrap; word-break:break-word; }
      .dsh-hub-reply { margin-top:8px; padding:8px 10px; border-left:2px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-base); border-radius:0 8px 8px 0; font-size:12.5px; color:var(--dsw-alias-label-secondary); white-space:pre-wrap; word-break:break-word; max-height:200px; overflow:auto; }
      .dsh-hub-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .dsh-hub-pill { display:inline-flex; align-items:center; gap:4px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); padding:1px 7px; font-size:10.5px; color:var(--dsw-alias-label-secondary); text-transform:uppercase; letter-spacing:.03em; }
      .dsh-hub-pill.high { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
      .dsh-hub-empty { padding:36px 12px; text-align:center; color:var(--dsw-alias-label-secondary); font-size:13px; }
      .dsh-hub-error { margin:0 0 12px; padding:10px 12px; border-radius:10px; border:1px solid var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); font-size:12.5px; display:flex; gap:10px; align-items:center; }
      .dsh-hub-error .spacer { flex:1; }
      .dsh-hub-send { display:flex; gap:8px; margin-top:10px; }
      .dsh-hub-send .dsh-hub-input { flex:1; }
      .dsh-hub-muted { color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsh-hub-notice { margin:0 0 12px; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-hub-guide { border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); border-radius:12px; padding:12px 14px; margin-bottom:14px; }
      .dsh-hub-guide-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .dsh-hub-guide-title { font-size:13px; font-weight:600; }
      .dsh-hub-guide-steps { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:5px; font-size:12.5px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-guide-steps li::marker { color:var(--dsw-alias-brand-primary); }
      .dsh-hub-section { margin-bottom:18px; }
      .dsh-hub-section-head { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
      .dsh-hub-section-title { font-size:13px; font-weight:600; }
      .dsh-hub-section-hint { font-size:11.5px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-stack { display:flex; flex-direction:column; gap:6px; }
      .dsh-hub-file { display:flex; align-items:center; gap:10px; font-size:12px; min-width:0; }
      .dsh-hub-file.missing { opacity:.55; }
      .dsh-hub-file-name { flex:1; min-width:0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-file-state { flex:none; font-size:11px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-skill { display:flex; flex-direction:column; gap:3px; padding:8px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); }
      .dsh-hub-skill-head { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .dsh-hub-skill-name { font-size:12.5px; font-weight:600; }
      .dsh-hub-badge { font-size:10px; padding:1px 6px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
      .dsh-hub-skill-desc { font-size:12px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-skill-path { font-size:10.5px; color:var(--dsw-alias-label-secondary); opacity:.75; word-break:break-all; }
      .dsh-hub-subs { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
      .dsh-hub-sub-row { display:flex; align-items:center; gap:8px; min-width:0; padding:6px 8px 6px 22px; border-left:2px solid var(--dsw-alias-border-l2); margin-left:8px; border-radius:0 8px 8px 0; }
      .dsh-hub-sub-row:hover { background:var(--dsw-alias-interactive-bg-hover); }
      .dsh-hub-sub-title { flex:1; min-width:0; font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-sub-meta { flex:none; font-size:11px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-check { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--dsw-alias-label-secondary); cursor:pointer; }
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
      .dsh-hub-menu-head { padding:4px 8px 6px; font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-empty { padding:8px; font-size:12px; color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-row { appearance:none; display:flex; align-items:center; gap:8px; width:100%; box-sizing:border-box; text-align:left; background:transparent; border:0; border-radius:8px; padding:6px 8px; color:inherit; font:inherit; cursor:pointer; }
      .dsh-hub-menu-row:hover { background:var(--dsw-alias-interactive-bg-hover); }
      .dsh-hub-menu-foot { margin-top:6px; padding-top:6px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsh-hub-menu-new { color:var(--dsw-alias-label-secondary); }
      .dsh-hub-menu-form { display:flex; flex-direction:column; gap:6px; padding:2px 6px 4px; }
      .dsh-hub-menu-input, .dsh-hub-menu-textarea { width:100%; box-sizing:border-box; font:inherit; font-size:12px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); border:1px solid var(--dsw-alias-border-l2); border-radius:6px; padding:6px 8px; outline:none; }
      .dsh-hub-menu-textarea { min-height:56px; resize:vertical; }
      .dsh-hub-menu-input:focus, .dsh-hub-menu-textarea:focus { border-color:var(--dsw-alias-brand-primary); }
      .dsh-hub-menu-actions { display:flex; justify-content:flex-end; gap:6px; }
      .dsh-hub-menu-btn { appearance:none; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:6px; padding:4px 10px; font-size:11.5px; line-height:1.2; cursor:pointer; }
      .dsh-hub-menu-btn.primary { background:var(--dsw-alias-button-primary-fill); border-color:var(--dsw-alias-button-primary-fill); color:var(--dsw-alias-label-primary-foreground); }
      .dsh-hub-menu-btn.primary:hover { background:var(--dsw-alias-button-primary-hover); border-color:var(--dsw-alias-button-primary-hover); }
      .dsh-hub-menu-btn[disabled] { opacity:.5; cursor:default; }
      .dsh-hub-menu-error { color:var(--dsw-alias-state-error-primary); font-size:11px; padding:0 6px 4px; }
      .dsh-hub-menu-title { flex:1; min-width:0; font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-hub-menu-open { flex:none; font-size:11px; color:var(--dsw-alias-label-secondary); opacity:0; }
      .dsh-hub-menu-row:hover .dsh-hub-menu-open { opacity:1; }
      .dsh-hub-hover { display:flex; flex-direction:column; gap:4px; }
      .dsh-hub-hover-head { font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; color:#adb2b8; }
      .dsh-hub-hover-row { display:flex; align-items:center; gap:6px; min-width:0; font-size:12px; line-height:16px; color:#cfd3d6; }
      .dsh-hub-hover-title { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
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

    function StatusDot(props) {
      return h('span', { className: `dsh-hub-dot ${props.status}`, 'aria-hidden': true });
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
      if (scope.workspaceId === undefined) return null;
      return h(
        React.Fragment,
        null,
        h('style', null, SIDEBAR_CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-hub-headbtn',
            title: `${tr('sidebar.board')} — ${workspace?.title ?? scope.workspacePath ?? ''}`,
            onClick: () => selectHubPanel(scope.workspaceId),
          },
          h(Icon, { size: 14 }),
          h('span', null, tr('sidebar.boardShort')),
        ),
      );
    }

    function ErrorBanner(props) {
      if (props.error === undefined) return null;
      return h(
        'div',
        { className: 'dsh-hub-error', role: 'alert' },
        h('span', null, `${props.t('common.failed')}: ${props.error}`),
        h('span', { className: 'spacer' }),
        h('button', { className: 'dsh-hub-btn ghost', onClick: props.onRetry }, props.t('common.retry')),
      );
    }

    function TasksView(props) {
      const { t, scope, data, refresh, useSessions, notify } = props;
      const [filter, setFilter] = React.useState('all');
      const [creating, setCreating] = React.useState(false);
      const [title, setTitle] = React.useState('');
      const [detail, setDetail] = React.useState('');
      const [priority, setPriority] = React.useState('normal');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState();
      const [dispatchFor, setDispatchFor] = React.useState();
      const [dispatchTarget, setDispatchTarget] = React.useState('');
      const sessions = useSessions((state) => state);
      const tasks = data?.board?.tasks ?? [];
      const visible = filter === 'all' ? tasks : tasks.filter((task) => task.status === filter);
      const counts = data?.board?.counts ?? {};

      const run = async (operation) => {
        setBusy(true);
        setError(undefined);
        try {
          await operation();
          await refresh();
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setBusy(false);
        }
      };

      const base = { sessionId: scope.sessionId, workspaceId: scope.workspaceId, workspacePath: scope.workspacePath };
      const create = () =>
        run(async () => {
          await call('tasks.create', { ...base, title, detail, priority });
          setTitle('');
          setDetail('');
          setPriority('normal');
          setCreating(false);
        });
      const claim = (task) =>
        run(() => call('tasks.claim', { ...base, id: task.id, expectedRevision: task.revision }));
      const release = (task) =>
        run(() => call('tasks.release', { ...base, id: task.id, expectedRevision: task.revision }));
      const done = (task) =>
        run(() => call('tasks.update', { ...base, id: task.id, expectedRevision: task.revision, status: 'done' }));
      const reopen = (task) =>
        run(() => call('tasks.update', { ...base, id: task.id, expectedRevision: task.revision, status: 'todo' }));
      const remove = (task) => {
        if (typeof window.confirm === 'function' && !window.confirm(t('tasks.confirmDelete'))) return;
        run(() => call('tasks.delete', { ...base, id: task.id, expectedRevision: task.revision }));
      };
      const dispatch = (task) =>
        run(async () => {
          const value = await call('tasks.dispatch', {
            ...base,
            id: task.id,
            expectedRevision: task.revision,
            targetSessionId: dispatchTarget === '' ? undefined : dispatchTarget,
          });
          const target = value?.target?.sessionId;
          setDispatchFor(undefined);
          setDispatchTarget('');
          notify(value?.replay === true ? t('tasks.dispatched', { session: target ?? '' }) : t('tasks.dispatched', { session: target ?? '' }));
        });

      const sessionName = (task) => {
        const id = task.assignee?.sessionId;
        if (typeof id !== 'string') return t('tasks.unassigned');
        const title = sessions?.byId?.[id]?.title;
        return title !== undefined && title !== null && title !== '' ? title : `${id.slice(0, 8)}…`;
      };

      const sessionOptions = (data?.sessions ?? []).filter((entry) => entry.sessionId !== scope.sessionId);

      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dsh-hub-toolbar' },
          h(
            'div',
            { className: 'dsh-hub-chips', role: 'tablist' },
            ['all', 'todo', 'doing', 'blocked', 'done'].map((status) =>
              h(
                'button',
                {
                  key: status,
                  role: 'tab',
                  'aria-selected': filter === status,
                  className: `dsh-hub-chip ${filter === status ? 'active' : ''}`,
                  onClick: () => setFilter(status),
                },
                t(`tasks.filter.${status}`),
                status === 'all' ? '' : ` ${counts[status] ?? 0}`,
              ),
            ),
          ),
          h(
            'button',
            { className: 'dsh-hub-btn primary', onClick: () => setCreating((open) => !open), disabled: busy },
            t('tasks.new'),
          ),
        ),
        h(ErrorBanner, { error, t, onRetry: refresh }),
        creating
          ? h(
              'div',
              { className: 'dsh-hub-form' },
              h('input', {
                className: 'dsh-hub-input',
                autoFocus: true,
                placeholder: t('tasks.titlePlaceholder'),
                value: title,
                onChange: (event) => setTitle(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' && title.trim() !== '') create();
                },
              }),
              h('textarea', {
                className: 'dsh-hub-textarea',
                placeholder: t('tasks.detailPlaceholder'),
                value: detail,
                onChange: (event) => setDetail(event.target.value),
              }),
              h(
                'div',
                { className: 'dsh-hub-form-row' },
                h(
                  'select',
                  {
                    className: 'dsh-hub-select',
                    style: { width: 140 },
                    value: priority,
                    onChange: (event) => setPriority(event.target.value),
                  },
                  ['low', 'normal', 'high'].map((value) =>
                    h('option', { key: value, value }, t(`tasks.priority.${value}`)),
                  ),
                ),
                h('span', { className: 'spacer' }),
                h('button', { className: 'dsh-hub-btn ghost', onClick: () => setCreating(false) }, t('tasks.cancel')),
                h(
                  'button',
                  { className: 'dsh-hub-btn primary', disabled: busy || title.trim() === '', onClick: create },
                  t('tasks.create'),
                ),
              ),
            )
          : null,
        visible.length === 0
          ? h('div', { className: 'dsh-hub-empty' }, tasks.length === 0 ? t('tasks.empty') : t('tasks.emptyFilter'))
          : h(
              'div',
              { className: 'dsh-hub-list' },
              visible.map((task) =>
                h(
                  'div',
                  { className: 'dsh-hub-card', key: task.id },
                  h(
                    'div',
                    { className: 'dsh-hub-card-top' },
                    h(StatusDot, { status: task.status }),
                    h(
                      'div',
                      { className: 'dsh-hub-card-main' },
                      h('div', { className: `dsh-hub-card-title ${task.status === 'done' ? 'done' : ''}` }, task.title),
                      h(
                        'div',
                        { className: 'dsh-hub-meta' },
                        h('span', null, `${t('tasks.rev')} ${task.revision}`),
                        h('span', { className: `dsh-hub-pill ${task.priority === 'high' ? 'high' : ''}` }, t(`tasks.priority.${task.priority}`)),
                        h('span', null, sessionName(task)),
                        h('span', null, relative(t, task.updatedAt)),
                      ),
                      task.detail.trim() === '' ? null : h('div', { className: 'dsh-hub-detail' }, task.detail),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dsh-hub-actions' },
                    task.status === 'todo' || task.status === 'blocked'
                      ? h('button', { className: 'dsh-hub-btn', disabled: busy, onClick: () => claim(task) }, t('tasks.claim'))
                      : null,
                    task.assignee !== null && task.status === 'doing'
                      ? h('button', { className: 'dsh-hub-btn ghost', disabled: busy, onClick: () => release(task) }, t('tasks.release'))
                      : null,
                    task.status !== 'done' && task.status !== 'cancelled'
                      ? h(
                          'button',
                          {
                            className: 'dsh-hub-btn',
                            disabled: busy,
                            onClick: () => setDispatchFor((id) => (id === task.id ? undefined : task.id)),
                          },
                          t('tasks.dispatch'),
                        )
                      : null,
                    task.status === 'done' || task.status === 'cancelled'
                      ? h('button', { className: 'dsh-hub-btn ghost', disabled: busy, onClick: () => reopen(task) }, t('tasks.reopen'))
                      : h('button', { className: 'dsh-hub-btn ghost', disabled: busy, onClick: () => done(task) }, t('tasks.done')),
                    h('button', { className: 'dsh-hub-btn ghost danger', disabled: busy, onClick: () => remove(task) }, t('tasks.delete')),
                  ),
                  dispatchFor === task.id
                    ? h(
                        'div',
                        { className: 'dsh-hub-form', style: { marginTop: 10, marginBottom: 0 } },
                        h(
                          'div',
                          { className: 'dsh-hub-form-row' },
                          h(
                            'select',
                            {
                              className: 'dsh-hub-select',
                              value: dispatchTarget,
                              onChange: (event) => setDispatchTarget(event.target.value),
                            },
                            h('option', { value: '' }, t('tasks.dispatchNew')),
                            sessionOptions.map((entry) =>
                              h(
                                'option',
                                { key: entry.sessionId, value: entry.sessionId },
                                `${entry.title ?? entry.sessionId.slice(0, 8)}${entry.running ? ' •' : ''}`,
                              ),
                            ),
                          ),
                          h('span', { className: 'spacer' }),
                          h(
                            'button',
                            { className: 'dsh-hub-btn primary', disabled: busy, onClick: () => dispatch(task) },
                            t('tasks.dispatchGo'),
                          ),
                        ),
                      )
                    : null,
                ),
              ),
            ),
      );
    }

    /** Workspace conversation overview: every main session plus its sub chats. */
    function SessionsView(props) {
      const { t, scope, data, refresh, useSessions, openSessionById, openChildSession } = props;
      const sessions = useSessions((snapshot) => snapshot.byId);
      const [collapsed, setCollapsed] = React.useState({});
      const [createFor, setCreateFor] = React.useState();
      const [title, setTitle] = React.useState('');
      const [prompt, setPrompt] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState();
      const rows = data?.sessions ?? [];

      const run = async (operation) => {
        setBusy(true);
        setError(undefined);
        try {
          await operation();
          await refresh();
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setBusy(false);
        }
      };
      const base = { sessionId: scope.sessionId, workspaceId: scope.workspaceId, workspacePath: scope.workspacePath };
      const createSubchat = (parentSessionId) =>
        run(async () => {
          await call('subchats.create', {
            ...base,
            parentSessionId,
            title,
            prompt,
          });
          setTitle('');
          setPrompt('');
          setCreateFor(undefined);
        });
      const closeSubchat = (sessionId, row) =>
        run(() => call('subchats.close', { ...base, parentSessionId: sessionId, id: row.id }));

      if (rows.length === 0) {
        return h('div', { className: 'dsh-hub-empty' }, t('sessions.empty'));
      }

      return h(
        'div',
        null,
        h(ErrorBanner, { error, t, onRetry: refresh }),
        h(
          'div',
          { className: 'dsh-hub-list' },
          rows.map((session) => {
            const titleText = session.title || (session.orphanParent ? t('sessions.orphanParent') : session.sessionId.slice(0, 8));
            const isOpen = collapsed[session.sessionId] !== true;
            const running = session.running === true || sessions?.[session.sessionId]?.running === true;
            return h(
              'div',
              { className: 'dsh-hub-card', key: session.sessionId },
              h(
                'div',
                { className: 'dsh-hub-card-top' },
                h('span', { className: `dsh-hub-dot ${running ? 'running' : ''}`, 'aria-hidden': true }),
                h(
                  'div',
                  { className: 'dsh-hub-card-main' },
                  h('div', { className: 'dsh-hub-card-title' }, titleText),
                  h(
                    'div',
                    { className: 'dsh-hub-meta' },
                    h('span', null, running ? t('sessions.running') : t('sessions.idle')),
                    h('span', null, t('sessions.subchatCount', { n: session.subchats.length })),
                    h('span', null, relative(t, session.updatedAt)),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'dsh-hub-actions' },
                session.orphanParent !== true
                  ? h('button', { className: 'dsh-hub-btn', disabled: busy, onClick: () => openSessionById(session.sessionId) }, t('sessions.open'))
                  : null,
                h(
                  'button',
                  {
                    className: 'dsh-hub-btn ghost',
                    disabled: busy || session.orphanParent === true,
                    onClick: () => setCreateFor((current) => (current === session.sessionId ? undefined : session.sessionId)),
                  },
                  t('sessions.newSubchat'),
                ),
                session.subchats.length === 0
                  ? null
                  : h(
                      'button',
                      {
                        className: 'dsh-hub-btn ghost',
                        onClick: () => setCollapsed((current) => ({ ...current, [session.sessionId]: isOpen })),
                      },
                      isOpen ? t('sessions.collapse') : t('sessions.expand'),
                    ),
              ),
              createFor === session.sessionId
                ? h(
                    'div',
                    { className: 'dsh-hub-form', style: { marginTop: 10, marginBottom: 0 } },
                    h('input', {
                      className: 'dsh-hub-input',
                      placeholder: t('subchats.titlePlaceholder'),
                      value: title,
                      maxLength: 120,
                      onChange: (event) => setTitle(event.target.value),
                    }),
                    h('textarea', {
                      className: 'dsh-hub-textarea',
                      placeholder: t('subchats.promptPlaceholder'),
                      value: prompt,
                      autoFocus: true,
                      onChange: (event) => setPrompt(event.target.value),
                    }),
                    h(
                      'div',
                      { className: 'dsh-hub-form-row' },
                      h('span', { className: 'spacer' }),
                      h('button', { className: 'dsh-hub-btn ghost', onClick: () => setCreateFor(undefined) }, t('subchats.cancel')),
                      h(
                        'button',
                        { className: 'dsh-hub-btn primary', disabled: busy || prompt.trim() === '', onClick: () => createSubchat(session.sessionId) },
                        t('subchats.create'),
                      ),
                    ),
                  )
                : null,
              isOpen && session.subchats.length > 0
                ? h(
                    'div',
                    { className: 'dsh-hub-subs' },
                    session.subchats.map((row) =>
                      h(
                        'div',
                        { className: 'dsh-hub-sub-row', key: row.id },
                        h('span', {
                          className: `dsh-hub-dot ${row.status === 'running' ? 'running' : row.status === 'closed' ? 'closed' : 'doing'}`,
                          'aria-hidden': true,
                        }),
                        h('span', { className: 'dsh-hub-sub-title' }, row.title),
                        h('span', { className: 'dsh-hub-sub-meta' }, t('sessions.subchatStatus.' + row.status)),
                        h(
                          'button',
                          { className: 'dsh-hub-btn ghost', disabled: busy, onClick: () => openChildSession(row.id) },
                          t('sessions.open'),
                        ),
                        h(
                          'button',
                          { className: 'dsh-hub-btn ghost danger', disabled: busy, onClick: () => closeSubchat(session.sessionId, row) },
                          t('subchats.close'),
                        ),
                      ),
                    ),
                  )
                : null,
            );
          }),
        ),
      );
    }

    /** Workspace facts with workspace-local editing (rules, context, skills). */
    function WorkspaceInfoView(props) {
      const { t, base } = props;
      const [info, setInfo] = React.useState();
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState();
      const [notice, setNotice] = React.useState();
      const [rulesDraft, setRulesDraft] = React.useState('');
      const [contextDraft, setContextDraft] = React.useState('');
      const [savingRules, setSavingRules] = React.useState(false);
      const [savingContext, setSavingContext] = React.useState(false);
      const [skillOpen, setSkillOpen] = React.useState(false);
      const [skillName, setSkillName] = React.useState('');
      const [skillDesc, setSkillDesc] = React.useState('');
      const [skillBody, setSkillBody] = React.useState('');
      const [savingSkill, setSavingSkill] = React.useState(false);

      const load = React.useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
          const value = await call('hub.workspace', base);
          setInfo(value);
          setRulesDraft(value.files?.rulesContent ?? '');
          setContextDraft(value.files?.contextContent ?? '');
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setLoading(false);
        }
      }, [base.sessionId, base.workspaceId, base.workspacePath]);
      React.useEffect(() => {
        load();
      }, [load]);
      React.useEffect(() => {
        if (notice === undefined) return undefined;
        const timer = setTimeout(() => setNotice(undefined), 4000);
        return () => clearTimeout(timer);
      }, [notice]);

      const saveRules = async () => {
        setSavingRules(true);
        setError(undefined);
        try {
          await call('workspace.rules.save', { ...base, content: rulesDraft });
          setNotice(t('workspace.savedRules'));
          await load();
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setSavingRules(false);
        }
      };
      const saveContext = async () => {
        setSavingContext(true);
        setError(undefined);
        try {
          await call('workspace.context.save', { ...base, content: contextDraft });
          setNotice(t('workspace.savedContext'));
          await load();
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setSavingContext(false);
        }
      };
      const createSkill = async () => {
        setSavingSkill(true);
        setError(undefined);
        try {
          await call('workspace.skill.create', {
            ...base,
            name: skillName,
            description: skillDesc,
            body: skillBody,
          });
          setSkillOpen(false);
          setSkillName('');
          setSkillDesc('');
          setSkillBody('');
          setNotice(t('workspace.savedSkill'));
          await load();
        } catch (failure) {
          setError(failure.message ?? String(failure));
        } finally {
          setSavingSkill(false);
        }
      };

      if (info === undefined) {
        return error === undefined
          ? h('div', { className: 'dsh-hub-empty' }, t('panel.loading'))
          : h(ErrorBanner, { error, t, onRetry: load });
      }

      const stateOf = (entry) => (entry.exists ? t('workspace.exists', { n: entry.bytes ?? 0 }) : t('workspace.missing'));
      const sourceLabel = (source) => {
        if (source.startsWith('project')) return t('workspace.source.project');
        if (source.startsWith('user')) return t('workspace.source.user');
        if (source === 'bundled') return t('workspace.source.bundled');
        if (source === 'custom') return t('workspace.source.custom');
        return t('workspace.source.unknown');
      };
      const fileRow = (entry, name) =>
        h(
          'div',
          { className: `dsh-hub-file ${entry.exists ? '' : 'missing'}`, key: entry.path },
          h('span', { className: 'dsh-hub-file-name', title: entry.path }, name),
          h('span', { className: 'dsh-hub-file-state' }, stateOf(entry)),
        );

      return h(
        'div',
        null,
        h(ErrorBanner, { error, t, onRetry: load }),
        notice === undefined ? null : h('div', { className: 'dsh-hub-notice' }, notice),
        h(
          'div',
          { className: 'dsh-hub-meta', style: { marginBottom: 12 } },
          h('span', null, `${t('workspace.projectRoot')}: `),
          h('code', null, info.projectRoot),
        ),
        h(
          'div',
          { className: 'dsh-hub-section' },
          h(
            'div',
            { className: 'dsh-hub-section-head' },
            h('span', { className: 'dsh-hub-section-title' }, t('workspace.rules')),
            h('span', { className: 'dsh-hub-section-hint' }, t('workspace.inheritedHint')),
          ),
          h('div', { className: 'dsh-hub-meta', style: { marginBottom: 6 } }, t('workspace.globalRules')),
          h(
            'div',
            { className: 'dsh-hub-stack' },
            info.global.map((entry) =>
              fileRow(entry, entry.label === 'dsh' ? '~/.dsh/AGENTS.md' : '~/.agents/AGENTS.md'),
            ),
          ),
          h('div', { className: 'dsh-hub-meta', style: { margin: '10px 0 6px' } }, t('workspace.projectRules')),
          info.project.every((entry) => !entry.exists)
            ? h('div', { className: 'dsh-hub-meta' }, t('workspace.rulesEmpty'))
            : h('div', { className: 'dsh-hub-stack' }, info.project.map((entry) => fileRow(entry, entry.display))),
          h('div', { className: 'dsh-hub-meta', style: { margin: '12px 0 6px' } }, t('workspace.workspaceRules')),
          h('textarea', {
            className: 'dsh-hub-textarea',
            style: { minHeight: 120 },
            placeholder: '# Workspace rules…',
            value: rulesDraft,
            onChange: (event) => setRulesDraft(event.target.value),
          }),
          h(
            'div',
            { className: 'dsh-hub-form-row', style: { justifyContent: 'flex-end' } },
            h(
              'button',
              { className: 'dsh-hub-btn primary', disabled: savingRules, onClick: saveRules },
              savingRules ? t('panel.loading') : t('workspace.save'),
            ),
          ),
          h('div', { className: 'dsh-hub-meta', style: { marginTop: 6 } }, t('workspace.rulesHint')),
        ),
        h(
          'div',
          { className: 'dsh-hub-section' },
          h(
            'div',
            { className: 'dsh-hub-section-head' },
            h('span', { className: 'dsh-hub-section-title' }, t('workspace.context')),
            h('span', { className: 'dsh-hub-section-hint' }, t('workspace.contextHint')),
          ),
          h('textarea', {
            className: 'dsh-hub-textarea',
            style: { minHeight: 100 },
            placeholder: t('workspace.contextPlaceholder'),
            value: contextDraft,
            onChange: (event) => setContextDraft(event.target.value),
          }),
          h(
            'div',
            { className: 'dsh-hub-form-row', style: { justifyContent: 'flex-end' } },
            h(
              'button',
              { className: 'dsh-hub-btn primary', disabled: savingContext, onClick: saveContext },
              savingContext ? t('panel.loading') : t('workspace.save'),
            ),
          ),
          h('div', { className: 'dsh-hub-meta', style: { marginTop: 6 } }, t('workspace.contextEffect')),
        ),
        h(
          'div',
          { className: 'dsh-hub-section' },
          h(
            'div',
            { className: 'dsh-hub-section-head' },
            h('span', { className: 'dsh-hub-section-title' }, t('workspace.skills')),
            h('span', { className: 'dsh-hub-section-hint' }, `${info.skills.length}`),
            h('span', { style: { flex: 1 } }),
            h('button', { className: 'dsh-hub-btn', onClick: () => setSkillOpen((open) => !open) }, t('workspace.newSkill')),
          ),
          skillOpen
            ? h(
                'div',
                { className: 'dsh-hub-form' },
                h('input', {
                  className: 'dsh-hub-input',
                  placeholder: t('workspace.skillName'),
                  value: skillName,
                  onChange: (event) => setSkillName(event.target.value),
                }),
                h('input', {
                  className: 'dsh-hub-input',
                  placeholder: t('workspace.skillDescription'),
                  value: skillDesc,
                  onChange: (event) => setSkillDesc(event.target.value),
                }),
                h('textarea', {
                  className: 'dsh-hub-textarea',
                  placeholder: t('workspace.skillBody'),
                  value: skillBody,
                  onChange: (event) => setSkillBody(event.target.value),
                }),
                h(
                  'div',
                  { className: 'dsh-hub-form-row' },
                  h('span', { className: 'spacer' }),
                  h('button', { className: 'dsh-hub-btn ghost', onClick: () => setSkillOpen(false) }, t('subchats.cancel')),
                  h(
                    'button',
                    {
                      className: 'dsh-hub-btn primary',
                      disabled: savingSkill || skillName.trim() === '' || skillDesc.trim() === '',
                      onClick: createSkill,
                    },
                    savingSkill ? t('panel.loading') : t('workspace.save'),
                  ),
                ),
              )
            : null,
          info.skills.length === 0
            ? h('div', { className: 'dsh-hub-meta' }, t('workspace.skillsEmpty'))
            : h(
                'div',
                { className: 'dsh-hub-stack', style: { marginTop: 10 } },
                info.skills.map((skill) =>
                  h(
                    'div',
                    { className: 'dsh-hub-skill', key: skill.name },
                    h(
                      'div',
                      { className: 'dsh-hub-skill-head' },
                      h('span', { className: 'dsh-hub-skill-name' }, skill.name),
                      h('span', { className: 'dsh-hub-badge' }, sourceLabel(skill.source)),
                      skill.modelInvocable ? h('span', { className: 'dsh-hub-badge' }, t('workspace.modelOnly')) : null,
                      skill.userInvocable ? h('span', { className: 'dsh-hub-badge' }, t('workspace.userOnly')) : null,
                    ),
                    h('div', { className: 'dsh-hub-skill-desc' }, skill.description),
                    skill.path === undefined ? null : h('div', { className: 'dsh-hub-skill-path', title: skill.path }, skill.path),
                  ),
                ),
              ),
        ),
      );
    }

    function WorkspaceHubPanel(props) {
      const { useSessions, useWorkspaces, t } = props;
      const autoScope = useScope(useSessions, useWorkspaces);
      const scope = React.useMemo(
        () =>
          props.workspaceId === undefined
            ? autoScope
            : { ...autoScope, workspaceId: props.workspaceId, workspacePath: props.workspacePath },
        [autoScope.sessionId, autoScope.workspaceId, autoScope.workspacePath, props.workspaceId, props.workspacePath],
      );
      const [tab, setTab] = React.useState('tasks');
      const [guideOpen, setGuideOpen] = React.useState(() => {
        try {
          return localStorage.getItem(GUIDE_KEY) !== 'dismissed';
        } catch {
          return true;
        }
      });
      const dismissGuide = () => {
        try {
          localStorage.setItem(GUIDE_KEY, 'dismissed');
        } catch {
          /* private mode */
        }
        setGuideOpen(false);
      };
      const [data, setData] = React.useState();
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState();
      const [notice, setNotice] = React.useState();
      const inflight = React.useRef(false);

      const refresh = React.useCallback(
        async () => {
          if (scope.workspaceId === undefined && scope.workspacePath === undefined && scope.sessionId === undefined) {
            setLoading(false);
            return;
          }
          if (inflight.current) return;
          inflight.current = true;
          try {
            const base = {
              sessionId: scope.sessionId,
              workspaceId: scope.workspaceId,
              workspacePath: scope.workspacePath,
            };
            const context = await call('context', base);
            const tasks = await call('tasks.list', base);
            const sessions = await call('hub.sessions', base);
            setData({ context, board: tasks.board, sessions: sessions.sessions });
            setError(undefined);
          } catch (failure) {
            setError(failure.message ?? String(failure));
          } finally {
            setLoading(false);
            inflight.current = false;
          }
        },
        [scope.sessionId, scope.workspaceId, scope.workspacePath],
      );

      React.useEffect(() => {
        refresh();
        const timer = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          refresh();
        }, 4000);
        return () => clearInterval(timer);
      }, [refresh]);

      React.useEffect(() => {
        if (notice === undefined) return undefined;
        const timer = setTimeout(() => setNotice(undefined), 6000);
        return () => clearTimeout(timer);
      }, [notice]);

      if (scope.workspaceId === undefined && scope.workspacePath === undefined && scope.sessionId === undefined) {
        return h('div', { className: 'dsh-hub' }, h('style', null, CSS), h('div', { className: 'dsh-hub-empty' }, t('panel.noWorkspace')));
      }

      return h(
        'div',
        { className: 'dsh-hub' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'dsh-hub-head' },
          h(Icon, { size: 22 }),
          h(
            'div',
            { className: 'dsh-hub-head-text' },
            h('h1', { className: 'dsh-hub-title' }, t('panel.title')),
            h(
              'div',
              { className: 'dsh-hub-where' },
              h('code', null, data?.context?.workspace?.path ?? scope.workspacePath ?? ''),
            ),
          ),
          h('button', { className: 'dsh-hub-btn ghost', onClick: () => setGuideOpen(true) }, t('guide.show')),
          h(
            'button',
            { className: 'dsh-hub-btn', disabled: loading, onClick: () => refresh() },
            loading ? t('panel.loading') : t('panel.refresh'),
          ),
        ),
        h(
          'div',
          { className: 'dsh-hub-tabs', role: 'tablist' },
          h(
            'button',
            {
              role: 'tab',
              className: `dsh-hub-tab ${tab === 'tasks' ? 'active' : ''}`,
              onClick: () => setTab('tasks'),
            },
            t('panel.tasks'),
            h('span', { className: 'count' }, data?.board?.tasks?.length ?? 0),
          ),
          h(
            'button',
            {
              role: 'tab',
              className: `dsh-hub-tab ${tab === 'sessions' ? 'active' : ''}`,
              onClick: () => setTab('sessions'),
            },
            t('panel.sessions'),
            h('span', { className: 'count' }, data?.sessions?.length ?? 0),
          ),
          h(
            'button',
            {
              role: 'tab',
              className: `dsh-hub-tab ${tab === 'workspace' ? 'active' : ''}`,
              onClick: () => setTab('workspace'),
            },
            t('panel.workspace'),
          ),
        ),
        h(
          'div',
          { className: 'dsh-hub-body' },
          error !== undefined && data === undefined
            ? h(
                'div',
                { className: 'dsh-hub-error', role: 'alert' },
                h('span', null, `${t('panel.error')} ${error}`),
                h('span', { className: 'spacer' }),
                h('button', { className: 'dsh-hub-btn ghost', onClick: () => refresh() }, t('panel.reload')),
              )
            : null,
          notice === undefined ? null : h('div', { className: 'dsh-hub-notice' }, notice),
          guideOpen
            ? h(
                'div',
                { className: 'dsh-hub-guide' },
                h(
                  'div',
                  { className: 'dsh-hub-guide-head' },
                  h('span', { className: 'dsh-hub-guide-title' }, t('guide.title')),
                  h('span', { style: { flex: 1 } }),
                  h('button', { className: 'dsh-hub-btn ghost', onClick: dismissGuide }, t('guide.dismiss')),
                ),
                h('ol', { className: 'dsh-hub-guide-steps' }, [1, 2, 3, 4, 5].map((step) => h('li', { key: step }, t('guide.step' + step)))),
              )
            : null,
          tab === 'tasks'
            ? h(TasksView, { t, scope, data, refresh, useSessions, notify: setNotice })
            : tab === 'sessions'
              ? h(SessionsView, { t, scope, data, refresh, useSessions, openSessionById, openChildSession })
              : h(WorkspaceInfoView, {
                  t,
                  base: {
                    sessionId: scope.sessionId,
                    workspaceId: scope.workspaceId,
                    workspacePath: scope.workspacePath,
                  },
                }),
        ),
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
      selectHubPanel = (workspaceId) => ctx.layout.selectPanel(`${PANEL_ID}:${workspaceId}`);
      translate = t;

      // One main panel per workspace that owns a hub session. The panel is
      // fixed to that workspace; navigation comes from the hub row in the
      // sidebar, never from a global icon.
      const panelDisposers = new Map();
      const syncPanels = () => {
        const wanted = new Map(
          hubCatalog.getSnapshot().map((entry) => [entry.workspaceId, entry]),
        );
        for (const [workspaceId, dispose] of [...panelDisposers]) {
          if (!wanted.has(workspaceId)) {
            dispose();
            panelDisposers.delete(workspaceId);
          }
        }
        for (const [workspaceId, entry] of wanted) {
          if (panelDisposers.has(workspaceId)) continue;
          const dispose = ctx.slots.inject('main', () =>
            ctx.slots.register(
              {
                name: 'main',
                key: `${PANEL_ID}:${workspaceId}`,
                locale: NS,
                inject: () => ({ workspaceId, workspacePath: entry.path }),
              },
              WorkspaceHubPanel,
            ),
          );
          panelDisposers.set(workspaceId, dispose);
        }
      };
      ctx.effect(() => {
        syncPanels();
        const unsubscribe = hubCatalog.subscribe(syncPanels);
        return () => {
          unsubscribe();
          for (const dispose of panelDisposers.values()) dispose();
          panelDisposers.clear();
        };
      }, 'workspace-hub: per-workspace panels');

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
