# 实现简报 · Workspace Hub Console（P0/P1）

> 已批准的重构开始落地。目标：把 `client.js` 的面板从「四 tab CRUD」改成「工作台」，Host 增加聚合快照并补 3 个能力。  
> 规范来源：`docs/redesign/03-strategy.md`（交互契约/视觉 token）、`docs/redesign/prototype/index.html`（视觉与交互参照）、`docs/redesign/04-review.md`（P0/P1 清单）。  
> 本文件是实现期的唯一协调契约。

## 1. 所有权（避免并发写冲突）

| 角色 | 可写文件 |
|---|---|
| Lead | `lib/hub.js`、`lib/bridge.js`、`lib/subchats.js`、`lib/tasks.js`、`test/core.test.mjs`、`docs/implementation/*` |
| client-builder | `client.js`、`test/client-ui.test.mjs` |
| reviewer | `docs/implementation/review.md`（只读其它文件） |

禁止：新增 npm 依赖、引入构建步骤、修改 `package.json` 的 `files`/`dsh` 段（除非 Lead 同意）、改动 `index.js`/`lib/*`（client-builder）。

## 2. Host 契约（Lead 实现；client 按此编码，缺失时走兼容回退）

### 2.1 新方法 `hub.snapshot`

```js
POST /workspace-hub/api/hub.snapshot
body: { sessionId?, workspaceId?, workspacePath? }
value: {
  ok: true,
  generatedAt: number,
  workspace: { id: string|null, title: string|null, path: string },
  board: boardView,            // 同 tasks.list 的 board：tasks[]/counts/revision/updatedAt
  sessions: {                  // 同 hub.sessions 的 sessions 字段
    workspace: { id, title, path },
    sessions: [{ sessionId, title, running, idle, updatedAt, subchats: [{
      id, title, status: 'running'|'idle'|'closed', updatedAt,
      lastAssistantMessage?: string|null, parentSessionId
    }] }]
  },
  servers: { path: string|null, source: 'config'|'auto'|null, configured: boolean,
             servers: [{ name, command, cwd, url, health, state, ready, configured, external, error, startedAt }] },
  meta: { sessionsCoarse: boolean, serversProbedAt: number|null }
}
```

- 单次读板、单次会话枚举；`servers.status` 结果并入（4s 轮询接受健康探测；后续可加 TTL）。
- 任何局部失败不要整体失败：`servers` 失败时返回 `{servers:{configured:false,servers:[],error}}`，`board` 失败才抛错。
- 保留现有 `context`/`tasks.*`/`hub.sessions`/`servers.*` 路由，客户端优先 snapshot、失败回退旧三连。

### 2.2 `subchats.catalog` 扩展

- 接受 `{ includeClosed?: boolean }`，默认 false（保持侧边栏行为）。
- 每条补 `updatedAt`、`lastAssistantMessage`（尽力而为，可空）、`parentSessionId`。
- `hub.snapshot` 内部用 `includeClosed: true`，客户端默认隐藏 closed，可切换。

### 2.3 `tasks.restore`

```js
POST tasks.restore { id, expectedRevision?, title, detail, priority, status, assignee?, dispatch?, dispatches?, createdAt, notes? }
value: { ok:true, task, workspace }
```

用于删除撤销：Host 把快照重新插入板（id 不变，revision 从 1 开始）。`assignee` / `dispatch` / `dispatches` 会一并恢复，避免撤销后丢失“谁在做/已派发记录”。若 id 已存在 → `BoardError('task-exists')`。

### 2.4 明确不在本期

- `tasks.list.search`（客户端过滤）、服务器异步 job/日志、文件 hash CAS、SSE、软删除端点（用 restore 代替）。
- 服务器启动仍是同步请求：UI 必须显示行内「启动中」并禁用该行，但不得锁整页。

## 3. Client 架构要求（client-builder）

保持文件外壳不变：`window.__ModuleLoader__.load({ id, factory(require){... return { inject, apply } } })`，只 `require('react')`。

### 3.1 必须保留

- `apply(ctx)` 中的槽位注册与行为：`main`（每工作区一个面板）、`conversation.header.leading`（中枢按钮 + 服务器胶囊）、`sidebar.workspaces.session.row.action`、`sidebar.session.row.hover`、`sidebar.session.row.leading`、`shell.overlay`（子会话菜单）。
- 现有子会话侧边栏组件、`hubCatalog`/`subchatCatalog` store、`call()`、`useScope`、`relative`、`Icon`、locale `DICT`（补齐新 key 的中英双语）。
- 面板 key 仍为 `workspace-hub:<workspaceId>`；`layout.selectPanel` 行为不变。

### 3.2 新面板结构（替换 `WorkspaceHubPanel` 及任务/会话/工作区视图）

```
<div class="wh-root">                       // position:relative; 全高；tabIndex=-1 接收键盘
  Header: 工作区图标+名称(切换器) · 路径(copy)   同步状态(点击刷新) [⌘K] [⚙]
  StatusStrip: 进行中 · 待办 · 阻塞 · 环境 n/n        [环境 popover]
  Nav: 概览 | 任务 n | 对话 n
  Body:
    overview | tasks | sessions | settings
  Overlays: dispatch sheet · command palette · env popover · toast stack
</div>
```

- **概览**：注意力队列（规则见 strategy §3）、正在运行（doing 任务 + assignee 会话 + 最近活动）、环境（行内启停/打开/日志尾）。
- **任务**：快速捕获（Enter 创建、Tab 展开详情、Esc 失焦）、筛选 chips（含 cancelled）、按状态分组、44/56 行、hover/focus 操作、展开行（标题/详情/优先级行内编辑 + 备注追加 + 运行条 + 动作）、派发 sheet、批量选择（P1，可后置）、列表/看板切换（P2，可后置但保留按钮隐藏）。
- **对话**：会话树（主会话 → 子会话），子会话行内「发送 / 中断 / 关闭 / 重开」，显示已关闭开关，未读徽标（客户端 lastSeen）。
- **设置**：复用现有规则/上下文/技能编辑能力，改成单页分组、dirty 状态、⌘S、每个表单独立动词；不引入文件 CAS。
- **⌘K**：新建任务 / 新建子会话 / 启动服务器 / 打开设置 / 刷新 / 切换工作区 + 任务/会话模糊搜索。
- **删除/关闭**：立即生效 + 6s 撤销（任务用 `tasks.restore`；子会话 `reopen`），不用 `window.confirm`。

### 3.3 数据层

```js
useHubSnapshot(scope) → {
  data, loading, error, stale, generatedAt, refresh, mutate
}
```

- 优先 `call('hub.snapshot', base)`；若返回 404/unknown-method（Host 未升级）回退 `context + tasks.list + hub.sessions`（服务器仍用现有 hook）。
- 4s 轮询、`document.visibilityState === 'hidden'` 暂停、失败指数退避 4→8→16s（上限 30s）、保留旧数据并置 `stale`。
- **合并**：按 task.id 合并，保留展开/草稿/焦点；写操作乐观更新本地 data，失败回滚并 `toast(error, {action:'重试'})`；409 用 `error.details.task` 就地更新该任务并提示。
- 视图状态 localStorage：`workspace-hub:view:v2:<workspaceId>`（nav/filter/group/scroll/expanded/seen）。

### 3.4 键盘（只在面板内生效）

根节点 `tabIndex={-1}` + `onKeyDown`（不要 document 级热键，不注入 shortcuts 服务）：`⌘K` 面板、`n` 捕获、`/` 搜索、`j/k`、`Enter` 展开、`x` 完成/重开、`e` 编辑、`d` 派发、`Esc` 关闭浮层。浮层用 `role=dialog` + 焦点陷阱 + 关闭后焦点归位（用 `data-act` 稳定选择器）。

### 3.5 视觉

- 只用 `--dsw-alias-*` / `--ds-font-*` / `--dsw-radius-*`；唯一实心按钮 `button-primary-fill`；业务蓝 `state-business-primary` 仅用于焦点/链接/进行中；状态色只在点/徽标/错误行。
- 字号 6 档：20/15/14/13/12/11；中文正文 `line-height:1.7`；发丝线 `0.5px`；圆角 8/12/16/4；`prefers-reduced-motion` 覆盖 transform。
- 无 emoji/渐变/第二品牌色；图标自绘 16px 线性 SVG。
- 环境值可能是亮色主题：对比度按 4.5:1 校验，元数据用 `label-secondary`，不用 `label-caption`。

### 3.6 状态与错误

- 首屏骨架（行高一致，>300ms 才显示）；空态有标题 + 一句说明 + 主 CTA；错误三问（发生什么/影响/下一步）；stale 顶条不阻塞操作。
- 所有 disabled 按钮带原因（tooltip/行内文案）。
- toast 单 live region（容器 `aria-live=polite` 或每 toast `role=status`，二选一）。

## 4. 验收（client-builder 自检 + reviewer 复核）

- `node test/core.test.mjs`、`node test/client-ui.test.mjs` 通过；`test/client-ui.test.mjs` 至少断言新面板仍注册 6 个槽位、无 shortcuts 服务、无 `window.confirm` 调用残留。
- `grep`：`window.confirm` = 0；emoji = 0；`linear-gradient` = 0；硬编码 hex 仅允许 `rgba(0,0,0,…)` 阴影；字号集合 ⊆ {10,11,12,13,14,15,20}；`font-size:10.5px` = 0。
- 手动：用 mock 数据渲染（可临时静态页面）检查暗/亮、空/加载/错误；如果无法在真实 GUI 验证，在交付说明里写清未验证项。
- 不做：新依赖、构建、改 Host 文件。

## 5. 交付

- `client.js` 新面板可用；旧侧边栏/入口/子会话菜单行为不回归。
- `test/client-ui.test.mjs` 更新。
- 简短交付说明（在回复里）：做了什么、未做什么、如何验证、风险。
