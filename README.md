# Workspace Hub

给 **每个工作区** 一块跨会话共享的任务板、一个工作区会话总览，以及由主对话管理的子会话；同时查看/编辑该工作区的规则、上下文与技能。DSH（DeepSeek Harness）标准 bundle：Host 服务 + Agent 工具 + Web 面板。

> GitHub: <https://github.com/tyxt-zvid/dsh-workspace-hub> · 完整安装、首次使用与 FAQ 见 [GUIDE.md](GUIDE.md)。

## 功能一览

- **任务板（工作区共享）**：跨会话创建/认领/更新/派发任务；并发安全（锁 + 每任务 CAS + 租约）；派发可新建会话或唤醒已有会话。
- **会话总览**：工作区全部主会话 + 嵌套子会话，可直接打开、为主会话新建子会话。
- **子会话（sub chat）**：真实 child session，可 create/send/interrupt/close/reopen；生命周期由主对话管理；普通完成不打扰主对话（need-to-know）。
- **工作区能力**：只读展示继承的 AGENTS.md 链与技能目录；可编辑工作区 AGENTS.md、中枢托管 CONTEXT.md、新建 .dsh/skills 技能。
- **Agent 工具**：`workspace_task`、`subchat`，任何会话可用。

## 安装（使用者）

要求：DSH `0.2.1-rc.x`（见 `engines.dsh`）。

**方式 A（Desktop，会话内）**：

```js
plugin_manager({ action: 'install_bundle', target: '/abs/path/dsh-workspace-hub-0.1.0.tgz' })
```

`target` 也可为本地目录、git 地址或 npm 包名/版本。

**方式 B（CLI）**：

```bash
dsh plugin --profile desktop add /abs/path/dsh-workspace-hub-0.1.0.tgz
```

安装后刷新页面；主界面标题栏左侧会出现「中枢」按钮。

## 打包分发（作者）

```bash
npm pack --pack-destination dist          # 生成 tarball（按 files 过滤）
# 对方：plugin_manager install_bundle target=/abs/dist/<tarball>.tgz
```

发布到 npm：把 `name` 改成自己的 scope、同步 `cordis.patch.yml` 行名、去掉 `"private": true`，然后 `npm publish --access public`。详见 [GUIDE.md](GUIDE.md)。

## 功能细节


### 1. 同一个工作区，跨会话共享的任务板

- 任务板物理位置：`<workspace>/.dsh/workspace-hub/tasks.json`，因此**同一工作区目录下打开的任何会话**都读写同一块板；DSH 重启、会话冷启动后仍在。
- 任务字段：`id / title / detail / status(todo|doing|blocked|done|cancelled) / priority / revision / assignee / dispatch / notes`。
- 并发安全：
  - 进程内按板文件串行（一个 FIFO）；
  - 跨进程 `<file>.lock`（PID 所有权、退避、崩溃持有者可接管、超时显式失败，绝不降级为无锁写）；
  - 锁内重新读取 + 每任务 `revision` 的 compare-and-set（`expectedRevision`）；
  - claim 带 15 分钟租约，持有者更新会续租，崩溃会话不会永久占坑；
  - 提交采用 `temp wx → fsync → rename → fsync 目录`，读方无锁且永远看不到半截 JSON；
  - 损坏的板**不会被覆盖**：读取/写入都显式报错。
- **派发（dispatch）**：把任务交给一个对话执行。
  - 不传 `sessionId`：在**当前工作区新建一个会话**并发送任务提示词；
  - 传 `sessionId`：把任务提示词投递给该会话（冷会话会被自动 resume，然后运行一个新 turn）。
  - 派发前先写入 `dispatch.requestId`（write-ahead），重试幂等；失败会回滚任务归属并记录原因。
- 任务所有权：`claim` 表示"本会话自己干"，`dispatch` 表示"交给别的会话干"；两者都会把任务置为 `doing` 并记录会话。

### 2. 单会话内的 sub chat（生命周期由主对话管理）

- 每个 sub chat 是一个**独立的持续对话**（真实 child session），有自己的上下文与 turn，settle 之后仍可继续发消息。
- 生命周期：
  - 主对话 turn 结束：sub chat 不受影响；
  - 主对话 Agent 被销毁 / 插件卸载：宿主侧确定性地 drain 该主对话名下的 resident sub chats（`agent.ctx.effect` 在 parent 仍注册时执行，因此授权有效）；
  - 主会话归档：框架自身的 archive admission 会级联停止其活动；
  - Host 重启：sub chat 列表来自 parent 的 durable catalog，可冷读；面板可继续列出，发送时会冷 resume；
  - 显式 `close`：drain resident child + 持久化 `closed` 标记（可 `reopen`）。
- Agent 侧工具可以 `list / create / send / interrupt / close / reopen`；面板同样通过 Host 服务调用。
- 子会话的回复以 `subagent-settled` 通知形式回到主对话（框架行为），面板 `list` 也会展示每个 sub chat 的最新回复。
- 只有主对话（depth 0、非 subagent origin）可以创建/管理 sub chat；子会话自身不能继续嵌套创建。

## 模型侧工具

| 工具 | 用途 |
|---|---|
| `workspace_task` | `list / get / create / update / claim / release / dispatch / delete`；跨会话任务板。 |
| `subchat` | `list / create / send / interrupt / close / reopen`；当前对话的 sub chat。 |

工具对全部 Agent 全局注册（root 级），随插件卸载而消失。

## 工作区中枢（工作区级功能，不是会话）

中枢是**每个工作区自带的功能**，不创建任何会话、不能像对话一样被删除：

- 看板面板按工作区注册为 `workspace-hub:<workspaceId>`，面板固定读取该工作区的任务板，不再出现“全局面板显示某个工作区内容”的错位。
- 入口：主界面标题栏最左侧（会话标题之前）的 **中枢 / Hub** 按钮。该按钮通过 `conversation.header.leading` 注册，无会话时也存在；打开当前所查看工作区的看板。
- 面板内容只属于该工作区；工作区被删除时中枢随之消失（因为它就是该工作区的一部分）。
- 旧版本曾为每个工作区创建「工作区中枢」会话；升级后 Host 会自动把这些会话归档、删除 `hub.json` 映射（一次性迁移），中枢不再占用会话行。
- 平台限制：这一版 DSH 的侧边栏工作区行（workspace entry）没有可插入按钮的槽位（`sidebar.workspaces` 只有会话行 action/hover/leading 与 directoryFlow 子槽），因此无法在不接管整个工作区浏览区的前提下把按钮放到工作区行上；按钮放在工作区主视图的入口标题栏，全局可见且跟随当前工作区。

## Web 面板

- 每个工作区一块看板面板，两个标签页：
  - **任务**：状态筛选、列表、新建、认领/释放、完成/重开、删除、派发（新建会话或选择已有会话）；
  - **会话**：工作区内的**全部主会话**列表，各自子会话嵌套在下方；可打开主会话/子会话、为主会话新建子会话、关闭子会话。不再只显示“当前主会话”的子会话；
  - **工作区**（只读）：当前生效的规则/上下文链（用户全局 `AGENTS.md` → 项目根 → 当前目录，含 `CLAUDE.md` 与 `.local` 覆盖层、是否存在与字节数、projectRoot）和该工作区可见的技能目录（来源：工作区/用户/内置/自定义，模型/用户可调用，源文件路径）。不写文件、不改全局配置。
- 数据通路：同源认证 JSON 路由 `POST /workspace-hub/api/<method>`，每个请求先过 `ctx.connection.requestRejection(req)`（Host/Origin 防篡改 + 浏览器签名 Cookie 认证），失败即拒绝；面板每 4 秒轮询一次（页面隐藏时暂停），所有写操作后立即刷新。
- 面板只依赖 React 与主题 token（`--dsw-alias-*`），不 import 任何 Harness Client 包。

## 安装

```js
plugin_manager({ action: 'install_bundle', target: '/absolute/path/to/this/directory' })
```

bundle 的 `cordis.patch.yml` 插入一行 `workspace-hub`；Client 侧 `dsh.client` 在页面加载时注册面板。安装后页面会自动收到模块图更新（首次安装经 HMR 生效）。

## 验证状态

已在当前 Desktop profile 实测（2026-10-20 / 2026-10-21）：

- 安装：`install_bundle` → `application: applied`，Host 行 `include:workspace-hub` → `fiberPhase: active`；`workspace_task` / `subchat` 出现在调用方 schema 中。
- 中枢为工作区级功能：不再创建任何会话。`main` 槽位为全部 8 个注册工作区各注册一个 `workspace-hub:<workspaceId>` 面板（occupant 均 `active: true`），面板固定绑定该工作区。
- 全局入口移除：`sidebar.panellist` 中不再有 workspace-hub，也不再有全局 `main` key；入口是 `conversation.header.leading`（single，原先为空）上的「中枢」按钮，occupant `active: true`，无会话时也可见、跟随当前工作区。
- 旧中枢会话迁移：升级后 Host 自动归档旧版本创建的两个「工作区中枢」会话（`workspace.json.archivedSessionIds` 已含 `session-269c86b6-…`、`session-eb3ecbb4-…`）并删除对应 `hub.json`；现在 `.dsh/workspace-hub/` 只剩 `tasks.json` / `subchats.json`，不再有中枢会话行。
- 安全边界：未认证 `POST /workspace-hub/api/hub.catalog` → `401`；伪造 `Origin` → `403`。
- 任务板：`create → list → claim → update(note, done) → delete` 全部通过；CAS 冲突、已认领、损坏板保护、并发 claim 单赢家在 `node test/core.test.mjs` 中覆盖（全通过）；持久文件位于 `.dsh/workspace-hub/tasks.json`，无 `.lock`/`.tmp` 残留。
- 会话枚举兼容性修复：本 profile 的 `sessionController.list()` 返回 `{ items: SessionSummary[] }` 而不是裸数组；`sessionRows()` 同时接受数组、`{items}`、`{ok,value}` 三种形状，并已加入回归断言。
- 跨会话派发：任务派发到新建会话（`session-5fe3bda9-…`），该会话收到提示词后自行 `update` 任务为 `done` 并写入 note，证明跨会话读写同一块板。
- 子会话：`create`（回复 `SUBCHAT_OK`）→ `list` → `close` → `reopen` → `send`（冷恢复后回复 `RESUMED`）→ `close` 全部通过；回复以 `subagent-settled` 通知回到主对话。
- 未验证：面板的像素级视觉表现（本会话无浏览器控制），仅验证了槽位注册与数据通路；面板在亮/暗主题下的实际观感需要在页面上人工确认。
- 环境备注：验证期间另一个并发会话在同一 profile 中安装并启用了 `@local/grok-bot` bundle，且正在通过本插件的工具使用共享任务板；两者工具名/面板 key 不冲突，本插件保持 `active`。

## 如何新建子会话

三种方式，任选其一：

1. **侧边栏（推荐）**：hover 任意主对话的会话行 → 点尾部的 **子会话图标 / “+”** 打开浮层 → 点 **「新建子会话」** → 填写可选标题与首条消息 → 创建。首条消息会立即投递给子会话并开始它自己的 turn。
2. **看板面板**：标题栏「中枢」→「子会话」标签页 →「新建子会话」。
3. **直接让助手创建**：在主对话里说“新建一个子会话，让它……”，助手会调用 `subchat` 工具的 `create` 动作。

要求：主对话当前必须是 **live**（打开该会话即可）；子会话创建后可在侧边栏浮层、看板子会话页里查看最新回复、发送消息、中断或关闭。

## 侧边栏里的子会话

DSH 的左侧会话列表按设计过滤 `origin === "subagent"`，且没有“追加子行”的扩展点；因此插件采用官方的增量槽位，把子会话挂在**主对话行**上：

- `sidebar.session.row.leading`：空闲主对话行的 16px 前导位显示子会话图标（常驻，不必 hover；运行中的行由框架状态点占用该格）。点击同样打开浮层列表。
- `sidebar.workspaces.session.row.action`：主对话行 hover 时出现「子会话 N」徽标（只有存在打开的子会话才出现）。
- 点击徽标打开 `shell.overlay` 里的框架级菜单：列出该主对话的打开子会话（运行中/空闲状态点），点击任意一项通过 `uiWorkspace.openSession(childId)` 直接打开该子会话（自动解析 subagent 地址）。
- `sidebar.session.row.hover`：行 hover 卡片中额外列出前 4 个子会话，便于扫一眼。
- 目录数据来自 `POST /workspace-hub/api/subchats.catalog`（当前工作区的打开子会话，5 秒轮询；关闭的不显示）。

> 限制：shipped 侧边栏没有可插入的行级列表槽位，因此子会话不是“始终可见的缩进行”，而是主对话行上的入口 + 浮层列表；要变成真正的常驻缩进行只能整体替换 shipped 侧边栏，成本高且易随版本失效，故未采用。

## 工作区级规则 / 技能 / 上下文

「工作区」页签管理的是**工作区本地**的能力，绝不写用户全局文件：

| 能力 | 落点 | 生效方式 |
|---|---|---|
| 工作区规则 | `<workspace>/AGENTS.md`（可编辑） | 框架在下一次请求或会话 resume 时重新读取指令链；不是实时 watch |
| 工作区上下文 | `<workspace>/.dsh/workspace-hub/CONTEXT.md`（中枢托管，可编辑） | 以 agent-scoped system prompt section 注入该工作区会话；保存后活动会话下一轮生效，新会话立即生效 |
| 工作区技能 | `<workspace>/.dsh/skills/<name>/SKILL.md`（可新建） | 技能 provider watch 目录，下一个模型 step 进入 catalog；名称校验 kebab-case、frontmatter 自动生成 |

页签同时**只读展示**继承链（用户全局 `~/.dsh/AGENTS.md`、`~/.agents/AGENTS.md` → 项目根 → 当前目录的 `AGENTS.md`/`CLAUDE.md` 与 `.local` 覆盖层）以及会话可见技能目录（来源、模型/用户可调用面、源文件路径）。

边界：全局规则/技能不在中枢编辑；`CONTEXT.md` 只对**工作区目录相同**的会话注入（主会话与其子会话）；规则文件保存后若当前会话没有新的文件操作/resume，可能仍使用上一版指令。

## 子会话 ↔ 主会话的交互语义

子会话是**真实 Session**（框架层 `origin="subagent"`、`parentSession=主会话`、`delegationDepth=父+1`），不是主会话的子上下文；插件只补“行记录（标题/所属/closed）+ 帮助方法”。

三条消息通道：

1. **父 → 子（主动）**：`startActivation({delivery:'parent'})` 创建并**立即返回 childId**，首条 prompt 以 queue 投递给子会话启动第一轮；后续用 `subagents.prompt`（queue=新一轮 / steer=当前 step 边界）或 `interrupt`（只停当前 turn，可继续）。
2. **子 → 父（显式）**：只有 resident continuable child 能发给**直接父**，落地为一条 user message（`Agent <childId> sent a message: …`）；发送不结束子自己的 turn。
3. **框架 → 父（自动结算）**：每个 activation 在子 idle、无 pending inbox、无未结算后代后结算一次，向父会话追加一条 `subagent-settled` notice（stopReason 摘要等）。父闲时会**唤醒新一轮**；通知条数 = activation 数。

隔离与共享：父看不到子的 reasoning/step/tool/token 流，spawn 子看不到父对话；共享 workspace/cwd/权限根/preset（子不能扩权）。读子会话内容只能读子会话日志，或在 UI 中通过 `{parentSessionId, childSessionId, mode}` 子会话地址打开（本插件已改为显式地址打开）。

生命周期：父 turn 结束 ≠ 子结束；子 idle 后 activation 释放、Session 持久，再发消息即冷恢复；父 Agent 销毁时框架不自动回收 resident 子会话，本插件在 `agent.ctx.effect` 中 drain；主会话归档会级联停止后代；Host 重启后 catalog 可读、发送时冷恢复。默认 `maxDepth=1`（子不能再建子）、每 activation 树最多 8 个活跃子。

**need-to-know 降噪（默认启用）**：主会话的 `agent/pre-step` 会过滤结算通知——普通完成（`stopReason=completed`）不再进入主对话、也不会唤醒主对话；失败 / 被中断 / max-tokens / refusal / 异常结束仍会进入主对话（这些才需要主对话处理）。子会话的最新回复可随时用 `subchat list` 或看板查看。历史已写入日志的通知无法改写，但从此不再增长。

对产品行为的直接含义：面板“发送”只返回 messageId（最新回复靠轮询）；创建/发送要求主会话 live；每条结算通知都是主对话里的真实 user message、会占 context；侧边栏不显示子会话是框架过滤（`origin === 'subagent'`），所以入口只能挂在主对话行上；`close` 是 drain + 标记，不是删除。

## 限制与已知取舍

- 同一工作区文件被**多个 Host 进程**同时写入时，跨进程锁在本机有效；网络文件系统上的多 Host 并发不受支持（与 DSH 自带 atomic-write 的限制一致）。
- 面板数据是轮询快照（4s），不是推送；一次操作后会立即刷新。
- sub chat 的每一次后续 turn 都会以 `subagent-settled` 通知主对话（框架无公开开关）；这是"由主对话管理"的代价，也是其可观察性来源。
- sub chat 创建/发送要求主对话 Agent **当前是 live 的**（打开该会话即可）；冷父会话需要先打开。
- 面板无法直接打开 child 会话的完整 transcript（DSH 对 subagent 会话使用专用地址），因此面板展示最新回复而非完整对话。
- 不写入 profile，不依赖 `@deepseek-ai/*` 导入（避免 profile 里可能存在的旧版本 hoist 造成版本错配）。
- 中枢会话是真实普通会话：会占用一个会话行、可在侧边栏重命名/归档；插件不会删除它。已有但从未使用过的工作区不会在安装时被批量创建中枢，首次打开该工作区时才创建。
- 若中枢会话被手工删除，映射仍保留；可通过 `POST /workspace-hub/api/hub.ensure`（`{workspaceId}`）重建，或删除对应 `hub.json` 等待下一次 reconcile。

## 布局

| 文件 | 作用 |
|---|---|
| `index.js` | Host 插件入口：注册工具、父会话生命周期钩子、Web 桥。 |
| `lib/store.js` | 任务板持久化：FIFO、跨进程锁、fsync 原子替换、解析校验。 |
| `lib/tasks.js` | 纯任务操作（CAS/租约/派发 write-ahead）。 |
| `lib/hub.js` | 工作区解析、任务服务、会话枚举与派发。 |
| `lib/subchats.js` | sub chat 服务：创建/列表/发送/中断/关闭/重开与父会话清理。 |
| `lib/hubs.js` | 每工作区中枢会话的自动创建、目录与映射（`hub.json`）。 |
| `lib/tools.js` | `workspace_task` 与 `subchat` 工具 schema 与执行。 |
| `lib/bridge.js` | 同源认证 JSON 路由。 |
| `client.js` | 按工作区注册的看板面板、中枢会话入口与子会话侧边栏项。 |
| `locale/*.json` | 插件显示元数据。 |
