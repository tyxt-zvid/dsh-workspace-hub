# 全局中枢改造简报（P0）

> 目标：**WorkSpace Hub 从「工作区附属面板」升级为顶层场所**。侧边栏常驻入口；全局只有一个中枢面板；首页是「所有工作区」总览；点进某个工作区才进入现有 Console（概览/任务/对话/设置）；标题栏「中枢」按钮降级为快捷方式（打开中枢并定位到当前工作区）。

## 1. 所有权

| 角色 | 可写文件 |
|---|---|
| Lead | `lib/*`、`test/overview.test.mjs`、`test/core.test.mjs`、`test/snapshot.test.mjs`、`docs/implementation/*`、`package.json` |
| client-builder | `client.js`、`test/client-ui.test.mjs` |
| ui-verifier | `tools/harness/*`、`docs/implementation/verify-global.md` |
| reviewer | `docs/implementation/review-global.md` |

## 2. Host 契约（已实现）

`POST hub.overview` → `{ ok, generatedAt, totals, workspaces[] }`

```js
workspaces[i] = {
  workspaceId, title, path,
  board: boardView,                       // 完整 tasks[] + counts（客户端自行派生注意力）
  sessions: { total, running, rows: [{ sessionId, title, running, updatedAt }] },
  servers: { path, source, configured, servers: [{ name, url, running, ready, failed, error }],
             counts: { total, running, ready, failed } },
  updatedAt
}
totals = { workspaces, tasks, doing, todo, blocked, sessionsRunning, serversTotal, serversReady }
```

- 无健康探测（cheap summary），4s 轮询可接受。
- 选中工作区仍用 `hub.snapshot`（含真实 servers 探测）。
- 旧 `hub.catalog` 保留，但首页优先 overview。

## 3. 客户端改造（client-builder）

### 3.1 面板注册（从每工作区一个 → 全局一个）

- 删除 `apply()` 里的 `syncPanels`/`panelDisposers` 循环；改为一次：
  ```js
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, WorkspaceHubPanel));
  ```
- 新增侧边栏入口：
  ```js
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS,
    label: () => t('panel.title')
  }, HubNavIcon));
  ```
  `HubNavIcon` 用现有 `Icon`（`size` 属性；active 时可用 label-primary）。sidebar 会调用 `selectPanel(PANEL_ID)`。
- 保留：header `conversation.header.leading`（中枢按钮 + 服务器胶囊）、3 个侧边栏子会话槽、`shell.overlay` 子会话菜单。
- `selectHubPanel(workspaceId)` 改为：写入全局选择 store（选中该工作区）→ `ctx.layout.selectPanel(PANEL_ID)`。服务器胶囊同样：选工作区 + 请求打开环境 popover。

### 3.2 全局选择 store（模块级）

- `hubSelection = { current: 'all' | workspaceId, listeners }`，用 `useSyncExternalStore` 订阅。
- 持久化 `localStorage['workspace-hub:selection:v1']`；无值时 `'all'`。侧边栏入口进入时恢复上次位置（含 drill-in）；标题栏按钮总是定位当前工作区；`g a`/面包屑返回 All。
- 面板内切换工作区/返回全部都写 store；标题栏按钮写 store 后 selectPanel。

### 3.3 数据层

- 新增 `useHubOverview()`：POST `hub.overview`，4s 轮询、隐藏暂停、失败退避、stale；与 snapshot 共用轮询节奏（不要两条 4s 定时器同时跑：All 视图只跑 overview，工作区视图只跑 snapshot）。
- `useHubSnapshot(scope)` 保持；scope 由选中工作区推导：
  - `scope.workspaceId/path` = 选中工作区；
  - `sessionId` 仅当**当前会话属于该工作区**时传入（避免把别的会话写成 actor）；否则 undefined。
- `hub.workspace` 设置页同样用选中工作区；`sessionId` 同上。

### 3.4 All-workspaces 首页

- Header：`工作区中枢` + 副标题「所有工作区 · N 个」；同步状态、⌘K；**不显示 ⚙**（设置是工作区级）。
- StatusStrip：`工作区 N · 进行中 X · 待办 Y · 阻塞 Z · 环境 ready/total`（来自 totals）。
- 「需要你处理」跨区聚合（最多 6 条）：每行 = 工作区徽标 + 任务标题 + 原因 + 主操作。复用 `collectAttention` 逐工作区派生，补 `workspaceId`；点击 → 选中工作区并 `revealTask`。
- 「正在运行」跨区聚合：任务 + 工作区 + 执行者 + 相对时间；「打开」进入该工作区并打开会话。
- 「工作区」卡片网格（2 列）：名称/路径、进行中/待办/阻塞计数、会话 running/total、环境 ready/total、更新时间；点击进入该工作区；卡片右上 `…` 可选（先不做）。
- 空态：没有注册工作区 → 说明 + 「打开一个工作区」引导；单工作区任务板读取失败 → 卡片标注不可读。
- 注意力范围：All 只覆盖阻塞/卡住/待确认/高优先级/环境异常；子会话未读仅在工作区视图（跨区未读需 Host lastReplyAt，后续）。
- 加载：骨架；错误：三问 + 重试；stale：保留旧数据提示。

### 3.5 工作区视图

- Header 左侧加 `← 所有工作区`（或面包屑「所有工作区 / 名称」），工作区名仍是切换器（菜单首项「所有工作区」）。
- 其余 Console 保持不变；⚙ 只在工作区视图出现。
- `Esc` 在无浮层时返回 All（可选）；`g a` 返回 All。

### 3.6 命令面板

- 新增动作「所有工作区」；工作区结果来自 overview/`hub.catalog`；选择后写 store。
- 任务/会话结果保留当前工作区范围（All 视图下可跨区列出，选中自动定位工作区后再执行）。

### 3.7 视图状态

- `workspace-hub:view:v2:<'all' | workspaceId>`；All 视图无筛选，不需要单独状态；工作区视图记住筛选/滚动。
- 选中工作区持久化独立 key。

### 3.8 验收（client-builder 自检）

- `node test/core.test.mjs`、`test/snapshot.test.mjs`、`test/overview.test.mjs`、`test/client-ui.test.mjs` 全过。
- client-ui 测试更新：期望槽位集合 = {`main`, `sidebar.panellist`, `conversation.header.leading`, 3 个 sidebar 子会话槽, `shell.overlay`}；断言不存在 `workspace-hub:${workspaceId}` 面板 key 的循环注册；断言 `hub.overview` 与全局选择 key。
- 静态：无 `window.confirm`、无硬编码 hex（rgba mask 除外）、字号 ⊆ {10,11,12,13,14,15,20}、无 emoji/渐变。
- 保留旧行为：header 中枢按钮打开中枢并定位当前工作区；sidebar 子会话三入口与浮层菜单不回归。
- harness 会由 ui-verifier 更新；若面板因 props 缺失无法渲染，协调 Lead（不要改 Host）。

## 4. 不做

- 不做独立窗口、不改任务数据模型（仍每工作区一块板）。
- 不做全局单板、跨区拖拽、服务器全量探测。
- 不新增依赖/构建。
