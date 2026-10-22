/*
 * Mock Host data for the Workspace Hub harness.
 *
 * Loaded before harness.js. `window.__WH_MOCK__.answer(method, body, mode)` returns
 * the same `{ ok, value }` envelope the Host bridge (`lib/bridge.js`) returns for
 * `POST /workspace-hub/api/<method>`. The data mirrors
 * docs/redesign/prototype/index.html so screenshots are comparable to the prototype.
 *
 * Modes: "full" (default), "empty", "error". A failing mode keeps the transport
 * contract but returns `{ ok:false, error }` (harness renders an error state).
 */
(() => {
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const now = Date.now();

  const WORKSPACE = {
    workspaceId: 'ws-dsh-plugins',
    id: 'ws-dsh-plugins',
    title: 'dsh-plugins',
    path: '/Users/unclet/Projects/snippets/zvid/dsh-plugins',
    sessionIds: ['s1', 's2', 's3', 's4'],
    hubSessionId: 's1',
  };

  const task = (id, title, status, priority, patch = {}) => ({
    id,
    title,
    detail: patch.detail ?? '',
    status,
    priority,
    revision: patch.revision ?? 1,
    assignee: patch.assignee ?? null,
    createdBy: patch.createdBy ?? { kind: 'user', label: '你', sessionId: 's1' },
    createdAt: now - (patch.age ?? 2 * DAY),
    updatedAt: now - (patch.updated ?? 10 * MIN),
    dispatch: patch.dispatch ?? null,
    dispatches: [],
    notes: patch.notes ?? [],
    run: patch.run ?? null,
  });

  const TASKS = [
    task('t1', '修复暗色外观下的浮层残留', 'blocked', 'high', {
      detail:
        '暗色主题下浮层关闭后残留 1px 描边，并在 1080px 宽度下出现 60ms 的残影。需要先确认层级方案，再统一清理 popover 的 outline。',
      updated: 12 * MIN,
      age: 1 * DAY + 15 * HOUR,
      assignee: { sessionId: 's2', title: '修复暗色浮层', leaseExpiresAt: now + 20 * MIN },
      notes: [
        { at: now - 1 * DAY + 4 * HOUR, sessionId: 's1', text: '你 创建了任务，标注为高优先级' },
        { at: now - 1 * DAY + 3 * HOUR, sessionId: 's2', text: '会话「修复暗色浮层」复现了 1080px 下的残影' },
        { at: now - 2 * HOUR, sessionId: 's2', text: '阻塞：等待浮层层级方案确认' },
      ],
    }),
    task('t2', '把会话摘要写回任务板', 'done', 'normal', {
      updated: 18 * HOUR,
      age: 3 * DAY,
      assignee: null,
      notes: [{ at: now - 18 * HOUR, sessionId: 's1', text: '你 完成任务' }],
    }),
    task('t3', '统一 revision 冲突提示', 'doing', 'high', {
      detail:
        '写操作返回 409 时，当前只弹通用错误并把整页置为 busy。改为行内提示「已被「修复暗色浮层」更新」，提供「采用最新」「重试我的修改」两个出口，不整页刷新。',
      updated: 3 * MIN,
      age: 1 * DAY,
      assignee: { sessionId: 's2', title: '修复暗色浮层', leaseExpiresAt: now + 15 * MIN },
      run: { elapsed: '2 分钟', short: '2m', activity: '补了冲突分支的单元测试', session: '修复暗色浮层' },
      notes: [
        { at: now - 4 * HOUR, sessionId: 's1', text: '你 创建了任务，标注为高优先级' },
        { at: now - 3 * HOUR, sessionId: 's2', text: '会话「修复暗色浮层」开始执行，先复现 409 时的整页刷新' },
        { at: now - 2 * MIN, sessionId: 's2', text: '已补冲突分支单测，正在改行内提示' },
      ],
    }),
    task('t4', '补充任务派发的空状态文案', 'todo', 'low', { updated: 1 * HOUR, age: 2 * DAY }),
    task('t5', '为会话通知增加未读标记', 'doing', 'normal', {
      updated: 6 * MIN,
      age: 1 * DAY,
      assignee: { sessionId: 'sc4', title: '未读标记接口', leaseExpiresAt: now + 25 * MIN },
      run: { elapsed: '6 分钟', short: '6m', activity: '正在改 sessions 列表的未读字段', session: '未读标记接口' },
    }),
    task('t6', '整理工作区路径的展示规则', 'todo', 'normal', {
      updated: 2 * HOUR,
      age: 2 * DAY,
      assignee: null,
      notes: [{ at: now - 2 * HOUR, sessionId: 's1', text: '交给会话「整理路径规则」跟进' }],
    }),
    task('t7', '检查 worktree 切换后的任务归属', 'doing', 'normal', {
      updated: 34 * MIN,
      age: 5 * DAY,
      assignee: { sessionId: 'sc5', title: 'worktree 归属排查', leaseExpiresAt: now - 4 * MIN },
      run: { elapsed: '34 分钟', short: '34m', activity: '34 分钟前 · 等待输出', session: 'worktree 归属排查' },
    }),
    task('t8', '归档 7 月之前的子会话', 'todo', 'low', { updated: 18 * HOUR, age: 4 * DAY }),
    task('t9', '验证服务器自动识别在 monorepo 的表现', 'done', 'normal', {
      updated: 1 * DAY + 2 * HOUR,
      age: 6 * DAY,
    }),
    task('t10', '中枢快速捕获交互', 'todo', 'normal', { updated: 1 * DAY + 6 * HOUR, age: 6 * DAY }),
    task('t11', '服务器胶囊错误态', 'done', 'low', { updated: 2 * DAY, age: 8 * DAY }),
    task('t12', '技能新建表单校验', 'todo', 'high', { updated: 2 * DAY, age: 8 * DAY }),
  ];

  const SUBCHAT_SC = [
    { id: 'sc1', title: '路径截断规则', status: 'running', updatedAt: now - 1 * MIN, lastAssistantMessage: '正在对比 980px 与 1080px 下的截断位置', parentSessionId: 's1' },
    { id: 'sc2', title: '路径展示评审', status: 'idle', updatedAt: now - 18 * HOUR, lastAssistantMessage: '建议路径尾部保留仓库名，前面用上级目录缩写', parentSessionId: 's1', unread: 2 },
    { id: 'sc3', title: '工作区标题文案', status: 'closed', updatedAt: now - 1 * DAY + 4 * HOUR, lastAssistantMessage: '文案已合并到 draft 分支', parentSessionId: 's1' },
    { id: 'sc4', title: '未读标记接口', status: 'running', updatedAt: now - 6 * MIN, lastAssistantMessage: '正在改 sessions 列表的未读字段', parentSessionId: 's2' },
    { id: 'sc5', title: 'worktree 归属排查', status: 'idle', updatedAt: now - 34 * MIN, lastAssistantMessage: '34 分钟前 · 等待输出', parentSessionId: 's2' },
    { id: 'sc6', title: '导航重构评审', status: 'running', updatedAt: now - 12 * MIN, lastAssistantMessage: '顶部分段控件在 900px 宽时计数挤压标题', parentSessionId: 's3', unread: 2 },
    { id: 'sc7', title: '派发流程评审', status: 'idle', updatedAt: now - 1 * DAY + 7 * HOUR, lastAssistantMessage: '三个目标选项已经收敛，等待文案确认', parentSessionId: 's3' },
    { id: 'sc8', title: '归档脚本', status: 'closed', updatedAt: now - 1 * DAY + 8 * HOUR, lastAssistantMessage: '脚本已合并，旧会话归档完成，等待任务确认', parentSessionId: 's4' },
  ];

  const SESSIONS = [
    { sessionId: 's1', title: '整理工作区路径的展示规则', status: 'running', running: true, updatedAt: now - 3 * MIN, subchats: ['sc1', 'sc2', 'sc3'] },
    { sessionId: 's2', title: '修复暗色浮层', status: 'idle', running: false, updatedAt: now - 18 * HOUR, subchats: ['sc4', 'sc5'] },
    { sessionId: 's3', title: '中枢重构', status: 'running', running: true, updatedAt: now - 12 * MIN, subchats: ['sc6', 'sc7'] },
    { sessionId: 's4', title: '归档 7 月之前的子会话', status: 'closed', running: false, updatedAt: now - 1 * DAY + 8 * HOUR, subchats: [] },
  ].map((session) => ({ ...session, subchats: session.subchats.map((id) => SUBCHAT_SC.find((row) => row.id === id)) }));

  const SERVERS = [
    { name: 'dsh-plugins dev', command: 'pnpm run dev', cwd: WORKSPACE.path, url: 'http://localhost:5173', health: 'http://localhost:5173', running: true, ready: true, external: false, state: 'running', startedAt: now - 32 * MIN, error: null },
    { name: 'docs preview', command: 'pnpm run preview:docs', cwd: WORKSPACE.path, url: 'http://localhost:4173', health: 'http://localhost:4173', running: true, ready: false, external: false, state: 'starting', startedAt: now - 4_000, error: null },
    { name: 'design preview', command: 'pnpm run preview:design', cwd: WORKSPACE.path, url: 'http://localhost:4174', health: 'http://localhost:4174', running: false, ready: false, external: false, state: 'failed', startedAt: null, error: 'Error: listen EADDRINUSE: address already in use :::4174\n    at Server.setupListenHandle (node:net:1919:16)\n    at listenInCluster (node:net:1977:12)' },
  ];

  // ---------------------------------------------------------------------------
  // Multiple workspaces — the new global home (`hub.overview`) aggregates these.
  // The primary workspace keeps the prototype data above so drill-in screens
  // match the earlier per-workspace verification; the others are smaller and
  // deliberately expose blocked/failed/stale-ish states for the home screen.
  // ---------------------------------------------------------------------------
  const extraSession = (id, title, running, updatedAt) => ({
    sessionId: id,
    title,
    status: running ? 'running' : 'idle',
    running,
    updatedAt,
    subchats: [],
  });

  const DSH_WS = {
    workspaceId: 'ws-dsh',
    title: 'dsh',
    path: '/Users/unclet/Projects/dsh',
    tasks: [
      task('d-t1', '修复 client 模块加载顺序', 'doing', 'high', {
        detail: '模块表在上一次热更新后偶发重复注册，需要在模块加载器里加版本判定。',
        updated: 4 * MIN,
        age: 1 * DAY,
        assignee: { sessionId: 'd1', title: '重构 client 模块加载器', leaseExpiresAt: now + 20 * MIN },
        run: { elapsed: '4 分钟', short: '4m', activity: '补齐热更新回归用例', session: '重构 client 模块加载器' },
      }),
      task('d-t2', '补齐 app.asar 主题 token 快照', 'blocked', 'normal', {
        detail: '需要确认 asar 解包在 CI 上的路径与版本。',
        updated: 26 * MIN,
        age: 2 * DAY,
      }),
      task('d-t3', '整理 sidebar 路由的键盘可达性', 'todo', 'normal', { updated: 3 * HOUR, age: 2 * DAY }),
      task('d-t4', '归档旧的快捷键文档', 'done', 'low', { updated: 1 * DAY, age: 5 * DAY }),
    ],
    sessions: [
      extraSession('d1', '重构 client 模块加载器', true, now - 4 * MIN),
      extraSession('d2', '主题 token 抽取', false, now - 26 * MIN),
    ],
    servers: [
      { name: 'dsh dev', command: 'pnpm run dev', cwd: '/Users/unclet/Projects/dsh', url: 'http://localhost:5199', health: 'http://localhost:5199', running: true, ready: true, external: false, state: 'running', startedAt: now - 20 * MIN, error: null },
      { name: 'dsh docs', command: 'pnpm run docs', cwd: '/Users/unclet/Projects/dsh', url: null, health: null, running: false, ready: false, external: false, state: 'stopped', startedAt: null, error: null },
    ],
  };

  const SNIPPETS_WS = {
    workspaceId: 'ws-snippets',
    title: 'snippets',
    path: '/Users/unclet/Projects/snippets',
    tasks: [
      task('s-t1', '把 zvid 示例迁到独立仓库', 'todo', 'normal', { detail: '保留 git 历史，拆分 docs 与示例。', updated: 5 * HOUR, age: 3 * DAY }),
      task('s-t2', '整理共享 Dotfiles 的安装脚本', 'todo', 'low', { updated: 1 * DAY + 3 * HOUR, age: 4 * DAY }),
      task('s-t3', '清理未使用的 yaml 片段', 'cancelled', 'low', { updated: 2 * DAY, age: 6 * DAY }),
    ],
    sessions: [extraSession('n1', '拆分 zvid 仓库', false, now - 5 * HOUR)],
    servers: [],
  };

  const WEBSITE_WS = {
    workspaceId: 'ws-website',
    title: 'website',
    path: '/Users/unclet/Projects/website',
    tasks: [
      task('w-t1', '首页在 1440 下的栅格溢出', 'doing', 'high', {
        detail: 'Bento 网格在第三列溢出 8px，需要把 minmax 改为 min(0, 1fr)。',
        updated: 8 * MIN,
        age: 1 * DAY,
        assignee: { sessionId: 'w1', title: '首页栅格修复', leaseExpiresAt: now + 30 * MIN },
        run: { elapsed: '8 分钟', short: '8m', activity: '已定位到网格 min-width', session: '首页栅格修复' },
      }),
      task('w-t2', '发布页的 OG 图缺失 fallback', 'todo', 'normal', { updated: 2 * HOUR, age: 2 * DAY }),
      task('w-t3', '更新部署手册的 Node 版本', 'done', 'low', { updated: 1 * DAY + 1 * HOUR, age: 4 * DAY }),
    ],
    sessions: [
      extraSession('w1', '首页栅格修复', true, now - 8 * MIN),
      extraSession('w2', '发布页 OG 图', false, now - 2 * HOUR),
    ],
    servers: [
      { name: 'website dev', command: 'pnpm run dev', cwd: '/Users/unclet/Projects/website', url: 'http://localhost:3000', health: 'http://localhost:3000', running: true, ready: true, external: false, state: 'running', startedAt: now - 41 * MIN, error: null },
      { name: 'website preview', command: 'pnpm run preview', cwd: '/Users/unclet/Projects/website', url: 'http://localhost:3001', health: 'http://localhost:3001', running: false, ready: false, external: false, state: 'failed', startedAt: null, error: 'Error: listen EADDRINUSE: address already in use :::3001' },
    ],
  };

  const WORKSPACE_ROWS = [
    {
      workspaceId: WORKSPACE.workspaceId,
      title: WORKSPACE.title,
      path: WORKSPACE.path,
      hubSessionId: 's1',
      tasks: TASKS,
      sessions: SESSIONS,
      servers: SERVERS,
      subchats: SUBCHAT_SC,
    },
    DSH_WS,
    SNIPPETS_WS,
    WEBSITE_WS,
  ];
  const primaryRow = WORKSPACE_ROWS[0];

  const resolveRow = (body) => {
    const workspaceId = body?.workspaceId ?? body?.workspace?.id;
    const workspacePath = body?.workspacePath ?? body?.workspace?.path;
    return (
      WORKSPACE_ROWS.find((row) => row.workspaceId === workspaceId) ??
      WORKSPACE_ROWS.find((row) => typeof workspacePath === 'string' && row.path === workspacePath) ??
      primaryRow
    );
  };
  const wsOf = (row) => ({ id: row.workspaceId, title: row.title, path: row.path });
  const countsFor = (tasks) => ({
    all: tasks.length,
    todo: tasks.filter((row) => row.status === 'todo').length,
    doing: tasks.filter((row) => row.status === 'doing').length,
    blocked: tasks.filter((row) => row.status === 'blocked').length,
    done: tasks.filter((row) => row.status === 'done').length,
    cancelled: tasks.filter((row) => row.status === 'cancelled').length,
  });
  const boardFor = (row) => ({
    tasks: row.tasks.map((item) => ({ ...item })),
    counts: countsFor(row.tasks),
    revision: 7,
    updatedAt: now - 3_000,
    workspace: wsOf(row),
  });
  const sessionsValueFor = (row) => ({
    workspace: wsOf(row),
    sessions: row.sessions.map((session) => ({ ...session, subchats: (session.subchats ?? []).map((sub) => ({ ...sub })) })),
  });
  const summaryServers = (row) =>
    row.servers.map((server) => ({
      name: server.name,
      url: server.url ?? null,
      running: server.running === true,
      ready: server.ready === true,
      failed: server.state === 'failed' || (server.running !== true && typeof server.error === 'string' && server.error !== ''),
      error: server.error ?? null,
    }));
  const serversValueFor = (row) => ({
    path: `${row.path}/.dsh/workspace-hub/servers.json`,
    source: 'config',
    configured: row.servers.length > 0,
    servers: row.servers.map((server) => ({ ...server })),
  });
  const snapshotFor = (row) => ({
    generatedAt: now - 3_000,
    workspace: wsOf(row),
    board: boardFor(row),
    sessions: sessionsValueFor(row),
    servers: serversValueFor(row),
    meta: { sessionsCoarse: false, serversProbedAt: now - 2_000 },
  });
  const workspaceValueFor = (row) => ({
    workspace: wsOf(row),
    projectRoot: row.path,
    global: [
      { label: 'dsh', path: '~/.dsh/AGENTS.md', exists: true, bytes: 2438 },
      { label: 'agents', path: '~/.agents/AGENTS.md', exists: false, bytes: 0 },
    ],
    project: [
      { path: `${row.path}/AGENTS.md`, display: 'AGENTS.md', exists: true, bytes: row === primaryRow ? 6182 : 1240 },
      { path: `${row.path}/docs/AGENTS.md`, display: 'docs/AGENTS.md', exists: false, bytes: 0 },
    ],
    skills:
      row === primaryRow
        ? [
            { name: 'hub-craft-review', description: '按 OpenDesign checklist 评审工作区原型', source: 'user', path: '~/.dsh/skills/hub-craft-review/SKILL.md', bytes: 1840, face: '模型 / 用户' },
            { name: 'workspace-audit', description: '检查四个视图的状态覆盖与键盘闭环', source: 'workspace', path: '.dsh/skills/workspace-audit/SKILL.md', bytes: 1220, face: '模型' },
            { name: 'task-dispatch', description: '把任务派发给会话，并回写执行摘要', source: 'user', path: '~/.dsh/skills/task-dispatch/SKILL.md', bytes: 2080, face: '模型 / 用户' },
          ]
        : [],
    files: {
      rulesContent:
        row === primaryRow
          ? '# 工作区规则\n\n- 面板内边距 24px，行高 44/56px\n- 浮层只用于派发、命令面板、环境详情\n- 写操作乐观更新，冲突就地解决\n- 不引入新依赖，不加构建步骤\n'
          : '# 工作区规则\n\n- 保持小而清晰\n- 提交前跑 node --check\n',
      contextContent:
        row === primaryRow
          ? '# 中枢上下文\n\n面板位于 client.js，原型在 docs/redesign/prototype。\n写操作乐观更新，删除走 6 秒撤销窗口。\n会话上下文只注入同目录会话，下一轮生效。\n'
          : '# 工作区上下文\n\n当前工作区由全局中枢管理。\n',
    },
    rules: { global: [], project: [] },
  });

  const EMPTY_SNAPSHOT = (row) => ({
    generatedAt: now,
    workspace: wsOf(row),
    board: { tasks: [], counts: { all: 0, todo: 0, doing: 0, blocked: 0, done: 0, cancelled: 0 }, revision: 1, updatedAt: now, workspace: wsOf(row) },
    sessions: { workspace: wsOf(row), sessions: [] },
    servers: { path: `${row.path}/.dsh/workspace-hub/servers.json`, source: null, configured: false, servers: [] },
    meta: { sessionsCoarse: false, serversProbedAt: null },
  });

  const emptyTotals = () => ({ workspaces: 0, tasks: 0, doing: 0, todo: 0, blocked: 0, sessionsRunning: 0, serversTotal: 0, serversReady: 0 });
  const EMPTY_OVERVIEW = () => ({ generatedAt: now, totals: emptyTotals(), workspaces: [] });

  /** Host `hub.overview`: cheap summaries for the All-workspaces home. */
  const overview = () => {
    const workspaces = WORKSPACE_ROWS.map((row) => {
      const board = boardFor(row);
      const serving = summaryServers(row);
      return {
        workspaceId: row.workspaceId,
        title: row.title,
        path: row.path,
        board,
        ...(state.overviewBoardError === true && row.workspaceId === 'ws-snippets' ? { boardError: true } : {}),
        sessions: {
          total: row.sessions.length,
          running: row.sessions.filter((session) => session.running === true).length,
          rows: row.sessions.map((session) => ({
            sessionId: session.sessionId,
            title: session.title,
            running: session.running === true,
            updatedAt: session.updatedAt,
          })),
        },
        servers: {
          ...serversValueFor(row),
          servers: serving,
          counts: {
            total: serving.length,
            running: serving.filter((server) => server.running).length,
            ready: serving.filter((server) => server.ready).length,
            failed: serving.filter((server) => server.failed).length,
          },
        },
        updatedAt: now - 2_000,
      };
    });
    const totals = emptyTotals();
    totals.workspaces = workspaces.length;
    for (const workspace of workspaces) {
      totals.tasks += workspace.board.counts.all;
      totals.doing += workspace.board.counts.doing;
      totals.todo += workspace.board.counts.todo;
      totals.blocked += workspace.board.counts.blocked;
      totals.sessionsRunning += workspace.sessions.running;
      totals.serversTotal += workspace.servers.counts.total;
      totals.serversReady += workspace.servers.counts.ready;
    }
    return { generatedAt: now - 2_000, totals, workspaces };
  };

  /** Return live values across polls (for load-then-fail states). */
  const state = {
    snapshotCalls: 0,
    overviewCalls: 0,
    overviewBoardError: false,
    servers: SERVERS.map((row) => ({ ...row })),
  };

  const ok = (value) => ({ ok: true, value });
  const fail = (code, message) => ({ ok: false, error: { code, message } });

  const requireTask = (body) => {
    const row = resolveRow(body);
    const found = row.tasks.find((item) => item.id === body.id);
    if (found === undefined) {
      const error = new Error(`task ${JSON.stringify(body.id)} not found`);
      error.code = 'not-found';
      throw error;
    }
    return found;
  };
  const touch = (row) => {
    row.updatedAt = Date.now();
    row.revision += 1;
  };
  const serversFor = (row) => (row === primaryRow ? state.servers : row.servers);

  const handlers = {
    'hub.catalog': () =>
      ok({
        workspaces: WORKSPACE_ROWS.map((row) => ({
          workspaceId: row.workspaceId,
          id: row.workspaceId,
          title: row.title,
          path: row.path,
          sessionId: row.hubSessionId,
          sessionIds: row.sessions.map((session) => session.sessionId),
        })),
      }),
    'hub.overview': () => ok(overview()),
    'hub.snapshot': (body) => ok(snapshotFor(resolveRow(body))),
    'context': (body) => {
      const row = resolveRow(body);
      return ok({ workspace: wsOf(row), session: { id: body?.sessionId ?? 's1', title: row.sessions[0]?.title ?? '当前会话' } });
    },
    'tasks.list': (body) => {
      const row = resolveRow(body);
      return ok({ board: boardFor(row), workspace: wsOf(row) });
    },
    'hub.sessions': (body) => ok(sessionsValueFor(resolveRow(body))),
    'servers.status': (body) => {
      const row = resolveRow(body);
      return ok({ ...serversValueFor(row), servers: serversFor(row).map((item) => ({ ...item })) });
    },
    'hub.workspace': (body) => ok(workspaceValueFor(resolveRow(body))),
    'subchats.catalog': (body) => {
      const row = resolveRow(body);
      return ok({
        subchats: row.subchats.filter((item) => body?.includeClosed === true || item.status !== 'closed').map((item) => ({ ...item })),
      });
    },
    'subchats.create': (body) => {
      const row = resolveRow(body);
      const subchat = {
        id: `sc-${Date.now().toString(36)}`,
        title: body.title ?? '新的子会话',
        status: 'running',
        updatedAt: Date.now(),
        lastAssistantMessage: null,
        parentSessionId: body.parentSessionId ?? row.sessions[0]?.sessionId ?? 's1',
      };
      row.subchats.push(subchat);
      return ok({ subchat });
    },
    'subchats.close': (body) => {
      const row = resolveRow(body);
      const subchat = row.subchats.find((item) => item.id === body.id);
      if (subchat !== undefined) subchat.status = 'closed';
      return ok({ closed: true, subchat: subchat ?? null });
    },
    'subchats.reopen': (body) => {
      const row = resolveRow(body);
      const subchat = row.subchats.find((item) => item.id === body.id);
      if (subchat !== undefined) subchat.status = 'running';
      return ok({ reopened: true, subchat: subchat ?? null });
    },
    'tasks.create': (body) => {
      const row = resolveRow(body);
      const created = task(`t-${Date.now().toString(36)}`, body.title ?? '新任务', 'todo', body.priority ?? 'normal', {
        detail: body.detail ?? '',
        age: 0,
        updated: 0,
      });
      row.tasks.unshift(created);
      return ok({ task: { ...created }, workspace: wsOf(row) });
    },
    'tasks.claim': (body) => {
      const row = requireTask(body);
      row.status = 'doing';
      row.assignee = { sessionId: body?.sessionId ?? 's1', title: '当前会话', leaseExpiresAt: Date.now() + 30 * MIN };
      touch(row);
      return ok({ task: { ...row }, workspace: wsOf(resolveRow(body)) });
    },
    'tasks.release': (body) => {
      const row = requireTask(body);
      row.assignee = null;
      row.status = 'todo';
      touch(row);
      return ok({ task: { ...row } });
    },
    'tasks.update': (body) => {
      const row = requireTask(body);
      if (body.status !== undefined) row.status = body.status;
      if (body.title !== undefined) row.title = body.title;
      if (body.detail !== undefined) row.detail = body.detail;
      if (body.priority !== undefined) row.priority = body.priority;
      touch(row);
      return ok({ task: { ...row }, workspace: wsOf(resolveRow(body)) });
    },
    'tasks.delete': (body) => {
      const row = requireTask(body);
      const workspace = resolveRow(body);
      const index = workspace.tasks.indexOf(row);
      workspace.tasks.splice(index, 1);
      return ok({ task: { ...row }, deleted: true });
    },
    'tasks.restore': (body) => {
      const workspace = resolveRow(body);
      const restored = {
        ...task(body.id, body.title ?? '恢复的任务', body.status ?? 'todo', body.priority ?? 'normal', {
          detail: body.detail ?? '',
          notes: body.notes ?? [],
        }),
        createdAt: body.createdAt ?? Date.now(),
      };
      workspace.tasks.unshift(restored);
      return ok({ task: restored });
    },
    'tasks.dispatch': (body) => {
      const row = requireTask(body);
      const sessionId = body.targetSessionId ?? resolveRow(body).sessions[0]?.sessionId ?? 's1';
      row.status = 'doing';
      row.assignee = { sessionId, title: '整理工作区路径的展示规则', leaseExpiresAt: Date.now() + 30 * MIN };
      touch(row);
      return ok({ task: { ...row }, target: { sessionId, title: '整理工作区路径的展示规则' }, replay: false });
    },
    'servers.start': (body) => {
      const workspace = resolveRow(body);
      const servers = serversFor(workspace);
      for (const name of body.names ?? []) {
        const row = servers.find((item) => item.name === name);
        if (row !== undefined) Object.assign(row, { running: true, ready: false, state: 'starting', startedAt: Date.now(), error: null });
      }
      return ok({ ...serversValueFor(workspace), servers: servers.map((row) => ({ ...row })) });
    },
    'servers.stop': (body) => {
      const workspace = resolveRow(body);
      const servers = serversFor(workspace);
      for (const name of body.names ?? []) {
        const row = servers.find((item) => item.name === name);
        if (row !== undefined) Object.assign(row, { running: false, ready: false, external: false, state: 'stopped', startedAt: null, error: null });
      }
      return ok({ ...serversValueFor(workspace), servers: servers.map((row) => ({ ...row })) });
    },
    'workspace.rules.save': () => ok({ saved: true }),
    'workspace.context.save': () => ok({ saved: true }),
    'workspace.skill.create': (body) => ok({ skill: { name: body.name, description: body.description ?? '' } }),
  };

  function successFor(method, body, mode) {
    if (mode === 'empty') {
      const row = resolveRow(body);
      if (method === 'hub.overview') return EMPTY_OVERVIEW();
      if (method === 'hub.snapshot') return EMPTY_SNAPSHOT(row);
      if (method === 'context') return { workspace: wsOf(row) };
      if (method === 'tasks.list') return { board: EMPTY_SNAPSHOT(row).board, workspace: wsOf(row) };
      if (method === 'hub.sessions') return { workspace: wsOf(row), sessions: [] };
      if (method === 'servers.status') return { path: null, source: null, configured: false, servers: [] };
      if (method === 'hub.workspace') return { ...workspaceValueFor(row), global: [], project: [], skills: [], files: { rulesContent: '', contextContent: '' } };
      if (method === 'subchats.catalog') return { subchats: [] };
    }
    const handler = handlers[method];
    if (handler === undefined) return { unknown: true };
    return handler(body);
  }

  function answer(method, body, mode) {
    // hub.catalog is the workspace list used by the sidebar and (legacy) panel
    // registration; keep it alive so error/stale modes still render the panel.
    if (method === 'hub.catalog') return handlers['hub.catalog']();
    if (mode === 'error') return fail('internal', `mock failure for ${method}: workspace board is unavailable`);
    if (method === 'hub.snapshot') {
      state.snapshotCalls += 1;
      if (mode === 'stale' && state.snapshotCalls > 1) return fail('internal', 'mock failure for hub.snapshot: bridge timed out after 4000ms');
    }
    if (method === 'hub.overview') {
      if (mode === 'boarderror') state.overviewBoardError = true;
      state.overviewCalls += 1;
      if (mode === 'stale' && state.overviewCalls > 1) return fail('internal', 'mock failure for hub.overview: bridge timed out after 4000ms');
    }
    const result = successFor(method, body, mode);
    if (result?.unknown === true) return fail('unknown-method', `unknown bridge method ${JSON.stringify(method)}`);
    // Handlers return the {ok,value} envelope; empty-mode overrides above return
    // raw values, so normalise both shapes here.
    return result?.ok === true || result?.ok === false ? result : ok(result);
  }

  window.__WH_MOCK__ = {
    mode: 'full',
    workspace: WORKSPACE,
    primaryWorkspaceId: WORKSPACE.workspaceId,
    workspaces: WORKSPACE_ROWS.map((row) => ({ workspaceId: row.workspaceId, title: row.title, path: row.path })),
    workspaceData: Object.fromEntries(
      WORKSPACE_ROWS.map((row) => [
        row.workspaceId,
        {
          workspaceId: row.workspaceId,
          title: row.title,
          path: row.path,
          sessionIds: row.sessions.map((session) => session.sessionId),
          sessions: row.sessions.map((session) => ({ ...session, subchats: (session.subchats ?? []).map((sub) => ({ ...sub })) })),
        },
      ]),
    ),
    tasks: TASKS,
    sessions: SESSIONS,
    subchats: SUBCHAT_SC,
    servers: SERVERS,
    overview,
    snapshotFor,
    snapshot: (body) => snapshotFor(resolveRow(body)),
    answer,
    reset() {
      state.snapshotCalls = 0;
      state.overviewCalls = 0;
      state.overviewBoardError = false;
    },
  };
})();
