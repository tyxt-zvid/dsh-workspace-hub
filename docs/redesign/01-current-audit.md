# 01 · 工作区中枢现状审计（Before）

> 审计对象：`/Users/unclet/Projects/snippets/zvid/dsh-plugins`。git HEAD `00356d4`；实际审计的是**当前工作树**（含未提交改动：`client.js` +362 行、`lib/bridge.js` +36、`lib/tools.js` +100、`README.md` +83、`GUIDE.md` +42、`index.js` +10，另有未跟踪的 `lib/servers.js`、`lib/discover.js`、`test/*` 等），行号以工作树为准。
> 范围：`client.js`（2232 行，全文）、`index.js`、`lib/*.js`（10 个）、`README.md`、`GUIDE.md`、`test/*.mjs`；对照 DSH Host 主题 token、焦点/布局实现与 2 个随包 UI 插件（`dsh-client-ui-schedule`、`dsh-client-ui-cordis`）。
> 方法：只读代码 + 运行现有测试（`test/client-ui.test.mjs` 2/2 通过；`test/core.test.mjs` 全通过）+ 核对真实数据 `.dsh/workspace-hub/*.json`（板 rev 45，2 任务/5 子会话）。
> 行号均指当前工作树；标注 `app.asar` 的为 DSH 桌面应用内主题/布局定义（无行号）。本文只描述“现在是什么”，不设计方案。

---

## 1. 一句话结论 + 关键数字

**结论：后端已经是“并发安全的工作区共享板 + 真实子会话 + 受控进程”，前端却仍是“四个标签页 + 四张单向列表 + 提交后整页重取”。任务、执行它的会话、子会话最新回复、服务器状态在 UI 上互不相认；5 个后端已有能力没有入口；4 秒轮询 + 静默错误会让界面在无提示的情况下展示旧数据。核心问题不是“不好看”，而是“关系不可见、操作不就地、状态不可信”。**

| 维度 | 数量 | 证据 |
|---|---|---|
| 面板 | 每个注册工作区 1 个 `main` 面板（本机 8 个工作区 = 8 个） | client.js:2183-2196；README.md:198 |
| 入口 | 1 个标题栏按钮 + 1 个服务器胶囊（同槽位内）+ 3 个侧边栏子会话位 + 1 个 frame 级浮层 | client.js:2210-2227 |
| 标签 | 4 个（任务 / 会话 / 服务器〔条件出现〕/ 工作区） | client.js:2062-2110 |
| 组件 | 15 个函数组件（含 SVG/状态微组件） | client.js:463-2154 |
| 交互点 | 55 个 `button`、5 个 input、6 个 textarea、2 个 select；45 个 `onClick`、13 个 `onChange`、4 个 `onKeyDown` | 全文件 grep |
| 桥方法 | 后端 25 个；前端调用 20 个；**5 个后端能力无 UI 入口** | lib/bridge.js:97-253 |
| 轮询 | **5 条定时器**：4s 面板数据、4s 服务器、8s 胶囊、5s 子会话目录、10s 工作区目录 | client.js:584,646,753,1958,2020 |
| 请求量 | 面板打开 ≈ **85 次/分**；面板关闭 ≈ 26 次/分；其中 22.5 次/分 `servers.status` 会触发真实 HTTP 健康探测 | 见 §4.1 计算 |
| 死文案 | 19 个 locale key 无任何引用——整套子会话管理面板的残留 | client.js:18-323 |
| UI 测试 | 2 个 smoke（只验槽位注册不抛错），0 个交互/状态测试 | test/client-ui.test.mjs:91-121 |

---

## 2. 当前信息架构与入口地图

```
DSH Shell
├─ conversation.header.leading（single；每主视图 1 实例）
│  └─ HubWorkspaceButton
│     ├─ [中枢] 按钮 ──layout.selectPanel("workspace-hub:<workspaceId>")──▶ main 面板
│     └─ [服务器] 胶囊（仅 status.configured 时渲染）──▶ 选中面板 + 切到 servers 页签
├─ sidebar.workspaces.session.row.action（主会话行 hover）
│  └─ 子会话计数徽标；无子会话时显示「+」──▶ 打开/切换浮层菜单
├─ sidebar.session.row.leading（主会话行，常驻）
│  └─ 有开启子会话时显示字形按钮 ──▶ 同一浮层菜单
├─ sidebar.session.row.hover
│  └─ 前 4 条子会话摘要（纯展示，无操作）
├─ shell.overlay（全 frame 单例）
│  └─ SubchatMenu：子会话列表 + 底部「新建子会话」内联表单
└─ main（每注册工作区 1 个；key = workspace-hub:<workspaceId>）
   └─ WorkspaceHubPanel（props 固定 workspaceId / workspacePath）
      ├─ head：图标 +「工作区中枢」+ workspace path +「引导」+「刷新」
      ├─ tabs：任务 · 会话 · [服务器] · 工作区
      ├─ 引导卡（localStorage 全局只关一次）
      ├─ notice（成功提示，6s 自隐）
      └─ tab body（各自 state；切 tab 不重置、关面板全丢）
```

**入口可达性规则（非直觉，需记住）：**

1. 没有全局入口、命令面板或可配置快捷键（`test/client-ui.test.mjs:112` 断言不得注入 shortcuts 服务）。唯一主动入口是主视图标题栏按钮（client.js:1238-1263）。
2. `scope.workspaceId === undefined` 时按钮与面板都不存在（client.js:1245, 2033-2035, 2174-2184）。**未注册到 workspaceRegistry 的 ad-hoc 目录会话完全看不到中枢**，尽管后端支持按 sessionId/路径兜底（lib/hub.js:73-103）。
3. 每个注册工作区都注册面板，但一次只显示一个（`layout.selectPanel`，client.js:2166）。**面板内没有工作区切换器**；换工作区 = 先打开另一个工作区的会话，再点标题栏按钮。
4. **打开任意会话会切走中枢**（会话页「打开」1595/1664；侧栏子会话 1173）。中枢不是常驻右栏，没有返回栈，只能再点一次标题栏按钮。
5. 子会话入口挂在主会话行上，因为宿主侧边栏过滤 subagent 会话且没有行级插入槽（README.md:224-232）。菜单数据只来自“当前会话所在工作区”的 catalog（client.js:611-617, 567-571）；**侧栏里其他工作区的会话行没有子会话徽标**。
6. 服务器胶囊与 servers 页签都只在 `configured === true` 时出现（client.js:922, 2085）。显式写 `servers: []` 会被当成未配置，两条入口一起消失（lib/servers.js:203, 217）。

**跨工作区行为：** 中枢没有显式“当前工作区”状态，由 `useScope` 推断：`retainedBy.mainView > 0` 的会话 → 否则最近更新会话 → 否则 `workspaces[0]`（client.js:517-531）。面板靠 props 固定工作区所以不会串；标题栏按钮/胶囊用的是推断值，可能指向与用户正在看的对话不同的工作区（P1-10）。

---

## 3. 交互清单

> 「立即反馈」= 用户当下可见；「后果/副作用」= 真正发生的事。位置均在 `client.js`，另行标注者除外。

### 3.1 面板外壳与导航

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| P1 | 标题栏「中枢」 | click | 无 loading，主视图立即切到该 workspace 面板 | 当前会话视图卸载；`layout.selectPanel` 无失败反馈 | 1238-1263, 2166 |
| P2 | 面板标题区 | — | 显示「工作区中枢」+ 等宽 path | path 来自 `context.workspace.path`，加载前用 scope 兜底 | 2043-2054, 2052 |
| P3 | 「引导」ghost | click | 立即显示 5 步引导卡 | localStorage 只影响下次打开，不影响当次 | 2055, 2124-2137 |
| P4 | 「刷新」 | click | 仅首载时按钮变「加载中…」；之后点击**无任何反馈** | 触发 3 个串行 POST；`inflight` 时直接丢弃本次（`return`），无提示 | 2056-2060, 1989-2016 |
| P5 | 「任务」页签 | click | 下划线 + 总数计数 | 仅本地 state；不预取、不改 URL | 2065-2074 |
| P6 | 「会话」页签 | click | 同上（会话数） | 同上 | 2075-2084 |
| P7 | 「服务器」页签 | click | 仅 configured 时存在 | 若 configured 变 false，effect 强制切回工作区——**页签自己跳走** | 2085-2100, 1965-1967 |
| P8 | 「工作区」页签 | click | 首次挂载才请求 `hub.workspace` | 无缓存；已有数据不重拉；切走再回不刷新 | 2101-2109, 1699-1715 |
| P9 | 引导「知道了」 | click | 卡片消失 | 写 localStorage（全局 key，不分工作区） | 1975-1982 |
| P10 | 页签计数 | 轮询 | 每 4s 数据回来时变化 | 无 `aria-selected`（见 §8.5） | 2073, 2083, 2097 |
| P11 | 标题栏「服务器」胶囊 | click | 无 loading；选中该工作区面板并切到 servers 页签 | `selectPanel` + 全局 `serversTabRequest`；若 configured 变 false，页签随后被强制切回工作区（用户看到两次跳转） | 917-954, 773-778, 1959-1967 |

### 3.2 任务页

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| T1 | 筛选 chip：全部/待办/进行中/阻塞/已完成 | click | active 样式 + 列表立即过滤（纯客户端） | 无请求；计数取 `board.counts`，「全部」不显示总数；切走再回不重置 | 1352-1372, 1289-1290 |
| T2 | 「新建任务」 | click | 展开表单 + 标题 autofocus；按钮 `disabled=busy` | 无 | 1373-1377, 1380-1424 |
| T3 | 任务标题 input | typing / Enter | 受控输入；标题非空按 Enter 直接创建（不填 detail） | 创建成功清空并收起；失败保留输入 + banner | 1384-1393, 1306-1313 |
| T4 | 详情 textarea | typing | 受控；min-height 66px | 无 Cmd/Ctrl+Enter；不自动增高 | 1394-1399, 354 |
| T5 | 优先级 select | change | 本地值 | 仅 low/normal/high | 1403-1414 |
| T6 | 「创建任务」 | click | `busy=true`，**该页所有任务按钮一起禁用** | POST `tasks.create` + 串行 `refresh()`（3 请求）；成功清空草稿，失败 banner | 1292-1313, 1417-1421 |
| T7 | 表单「取消」 | click | 收起表单 | **不清空草稿**；再次打开仍是上次内容 | 1416 |
| T8 | 「认领」 | click | busy；卡片不立即变化 | POST `tasks.claim`（`expectedRevision`=卡片 rev）→ 置 doing、assignee=scope.sessionId、15min 租约；失败 banner 显示原始英文（already-claimed / stale-revision / invalid-actor） | 1314-1315, 1456-1458 |
| T9 | 「释放」 | click | busy | POST `tasks.release` → assignee=null，doing→todo；不区分“自己的/过期的” | 1316-1317, 1459-1461 |
| T10 | 「完成」 | click | busy | POST `tasks.update status=done` → assignee 清空、rev+1；**无确认、无撤销** | 1318-1319, 1473-1475 |
| T11 | 「重开」 | click | busy | status=todo；对 cancelled 也走这里，而后端 update 拒绝 cancelled（P1-6） | 1320-1321, 1473-1474, lib/tasks.js:144-146 |
| T12 | 「删除」 | click | `window.confirm("删除这个任务？")`（**无任务名**） | 确认后 POST delete → 卡片消失，无撤销、无软删除 | 1322-1325, 1476 |
| T13 | 「派发」 | click | 卡片内展开派发表单（同时只允许一个） | 再点收起；`dispatchFor` 指向的任务若被轮询删掉则表单消失 | 1462-1472, 1478-1509 |
| T14 | 派发目标 select | change | 选项 = 全部会话（排除当前 scope.sessionId），`title + " •"(running)` | 原生 select，无搜索；无 live/归档说明 | 1347, 1486-1500 |
| T15 | 「派发」确认 | click | busy；表单不立即关闭 | POST `tasks.dispatch` → 后端 write-ahead，可能新建会话 + prompt；成功后关闭 + notice「已派发给 session-xxxx」；失败 banner 原始英文 | 1326-1338, 1502-1506 |
| T16 | 任务卡元数据 | — | 状态点、标题、`版本 N`、优先级、负责人、相对时间 | 负责人无 title 时显示 id 前 8 位；状态只有圆点，无文字 | 1431-1450, 1340-1345 |
| T17 | 「阻塞」状态 | — | 无入口 | 人类无法把任务设为 blocked / cancelled，只能由 Agent 工具设置 | 1358-1370 |

### 3.3 会话页与子会话

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| S1 | 主会话「打开」 | click | 立刻切走中枢、打开该会话 | 无确认；中枢状态（筛选/展开）丢失 | 1591-1596 |
| S2 | 「新建子会话」 | click | 卡片内展开表单 | orphan parent 禁用；**父会话不 live 时不禁用** | 1597-1605 |
| S3 | 子会话表单：标题 / 首条消息 | typing | 受控；标题 maxLength 120；首条消息必填 | textarea autoFocus | 1621-1634 |
| S4 | 「创建子会话」 | click | busy | POST `subchats.create`；要求父 Agent 当前 live 且是主会话；成功 `refresh()`（全套 3 请求）；失败 banner 原始英文 | 1541-1552, 1635-1645 |
| S5 | 「收起/展开」 | click | 本地 collapsed map | 重新挂载即丢失 | 1606-1615 |
| S6 | 子会话行「打开」 | click | 切走中枢，打开子会话 | `openChildSession` 无 try/catch，失败只在控制台 | 1662-1666, 2161-2164 |
| S7 | 子会话行「关闭」 | click | **无确认** | POST `subchats.close`：drain 子进程 + 标记 closed → 该行从所有 UI 消失且不可找回（catalog 过滤 closed） | 1667-1671, lib/subchats.js:264-277 |
| S8 | 子会话行状态 | 轮询 | 文字 running/idle/active/failed | failed 行没有错误原因；closed 永不出现 | 1656-1661, lib/subchats.js:247-258 |
| S9 | **发送 / 中断 / 重开 / 最新回复** | — | **UI 无入口** | 后端 bridge 与 Agent 工具均已实现；19 个死文案即证据 | lib/bridge.js:206-224；client.js:18-323 |

### 3.4 服务器

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| V1 | 「启动」 | click | busy（本行「启动中…」，**整张列表按钮全部 disabled**） | POST `servers.start` **阻塞到健康检查成功或超时**（默认 20s，自动识别 30s）；返回后再发一次 status；不自动打开 URL；spawn 失败时 `ok:true` + 行内 failed | 860-878, 830-851；lib/servers.js:339-368, 471-489 |
| V2 | 「停止」 | click | 「停止中…」 | POST stop（terminate + waitForExit ≤5s）→ 行消失；无成功提示；external 实例无停止按钮 | 833-842；lib/servers.js:495-516 |
| V3 | 「打开」 | click | `window.open(url)` | 弹窗被拦**静默**（只有注释）；无复制链接 | 828, 879-885 |
| V4 | 「刷新」 | click | 无 | 只刷新 `servers.status`，不动任务/会话数据 | 907 |
| V5 | **查看日志 / 编辑 servers.json / 取消启动** | — | **无入口** | 后端收集 64KB stdout/stderr 但 status 不返回；配置只能去仓库手改 | lib/servers.js:20, 461-465 |

### 3.5 工作区

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| W1 | AGENTS.md textarea | typing | 受控；无 dirty 标记 | 「保存」始终可点；无 Cmd/Ctrl+S | 1825-1832, 1836-1841 |
| W2 | 「保存」规则 | click | 按钮变「加载中…」 | POST `workspace.rules.save` **整文件覆盖** AGENTS.md → notice + 再 GET（草稿被磁盘内容重置）；无确认/无冲突检测 | 1722-1734, 1833-1841 |
| W3 | 上下文 textarea +「保存」 | click | 同上 | POST `context.save` → 后端对所有同 cwd 的 live agent 重新注入 section → notice | 1835-1869；lib/bridge.js:145-150 |
| W4 | 「新建技能」 | click | 展开三段表单 | 表单主按钮文案是「保存」，实际是创建 | 1874-1881, 1909-1917 |
| W5 | 技能 名称/描述/正文 | typing | 受控；客户端只校验 name/desc 非空 | kebab-case 由服务端校验，失败才报 | 1885-1903 |
| W6 | 技能「保存」 | click | 按钮变「加载中…」 | POST `workspace.skill.create`；成功关表单 + notice；失败 banner 原始英文 | 1748-1769 |
| W7 | 技能列表 | — | 只读展示 name/source/model/user/path | 无编辑、删除、打开文件 | 1921-1942 |

### 3.6 侧边栏与浮层

| # | 位置 | 触发器 | 立即反馈 | 后果/副作用 | 代码 |
|---|---|---|---|---|---|
| B1 | 主会话行尾徽标 /「+」 | click（hover 才出现） | 立即打开/切换菜单 | 阻止行点击；同一按钮再点收起 | 972-1026, 694-700 |
| B2 | 行首字形（常驻） | click | 同一菜单 | 运行中的行该格被框架状态点占用 | 1029-1055；README.md:226 |
| B3 | hover 卡 | hover | 前 4 条子会话 | 无 +N，超出信息静默丢失 | 1058-1084 |
| B4 | 菜单行 | click | 关闭菜单并打开子会话 | 异常只 `console.error` | 1163-1187 |
| B5 | 菜单底部「新建子会话」 | click | 内联表单，textarea autoFocus | 无 | 1226-1232, 1196-1209 |
| B6 | 菜单「创建子会话」 | click | busy | POST create → 关闭表单 + `subchatCatalog.refresh()`（5s 轮询之外多一次请求）；无成功提示 | 1105-1125 |
| B7 | Esc / 点击外部 | key/pointer | 关闭菜单 | 无方向键、无 roving tabindex、焦点不回到触发按钮 | 1126-1144 |
| B8 | **「更多菜单」** | — | **不存在** | 菜单本身就是子会话列表；无任务/服务器/工作区操作入口 | 1087-1235 |

---

## 4. 数据流与刷新模型

### 4.1 读取链路

1. **启动**：apply 后订阅 `hub.catalog`，首次 + 每 10s（client.js:642-655），用于给每个工作区注册 main 面板（2173-2207）。
2. **面板挂载**：`refresh()` **严格串行 3 个 POST**：`context` → `tasks.list` → `hub.sessions`（1997-2006），合并成 `{context, board, sessions}`；失败保留旧 data（2007-2012）。
3. **面板轮询**：`setInterval` 4s，`document.visibilityState === 'hidden'` 时跳过（2018-2025）。无 abort、无超时、无二次 loading。
4. **服务器**：面板 `useServerStatus(…, 4000)`（1958）+ 标题栏胶囊 `useServerStatus(…, 8000)`（921）——两个独立 hook、两个定时器、同一端点。hidden 跳过（732）。
5. **侧边栏**：`subchatCatalog` 5s（584，仅存在订阅者时启动；scope 变化先 `rows=[]` 再拉，598-607）；`hubCatalog` 10s（646）。
6. **工作区页**：只在挂载和每次保存后 `load()`（1713-1715, 1728, 1741, 1763），无轮询。

| 轮询面 | 间隔 | 端点 | 隐藏页 | 每 tick 的实际工作 |
|---|---|---|---|---|
| 面板主数据 | 4s | `context` + `tasks.list` + `hub.sessions` | 跳过 | 读任务板 **2 次**、读 subchats.json **1 次**、调 `sessionController.list` **2 次**（lib/hub.js:353,364；lib/bridge.js:167-177）；另有 5s 的 catalog 每轮再读一次 subchats.json |
| 服务器面板 | 4s | `servers.status` | 跳过 | 每次 `resolveServerConfig`（无配置时读 package.json/框架配置）+ 对每台服务器发真实 HTTP 健康探测（lib/servers.js:214-233, 307-321） |
| 服务器胶囊 | 8s | `servers.status` | 跳过 | 同上；**即使工作区没配置也照跑**（client.js:920-922，hook 在早退之前） |
| 子会话目录 | 5s | `subchats.catalog` | 跳过 | 读 subchats.json（564） |
| 工作区目录 | 10s | `hub.catalog` | 跳过 | 枚举 workspaceRegistry（630） |

**量级：** 面板打开时 45（主）+15（服务器）+12（子会话）+6（工作区）+7.5（胶囊）≈ **85.5 请求/分**，其中 22.5 次 `servers.status`/分 → 每台声明服务器每分钟约 **22 次真实 HTTP 探测**。面板关闭时 ≈ 25.5 请求/分。

### 4.2 写入链路

- 统一 `run()` 模式：`setBusy(true)` → `call()` → `await refresh()`（TasksView 1292-1303；SessionsView 1528-1539）。
- 服务器：`call` → `status.refresh()`（860-878）；菜单建子会话：`call` → `subchatCatalog.refresh()`（1105-1125）；工作区：`call` → `load()`（1722-1769）。
- **全文件没有任何乐观更新**：卡片状态、计数、列表全部等下一次 GET。一次点击 = 1 个写 round-trip + 3 个串行读 round-trip。
- 因 `refresh` 有 `inflight` 早退（1995），写入完成时若恰有 4s tick 在飞行中，**写入后的刷新被静默丢弃**，界面最长再等 4s。

### 4.3 CAS / revision 冲突如何呈现

- 前端拿卡片上的 `task.revision` 作 `expectedRevision`（1314-1321, 1328-1332）。
- 后端 `checkRevision` 抛 `stale-revision` 并附 `details.task` 最新值（lib/tasks.js:75-83）。
- bridge 对非白名单错误一律 **HTTP 200 + `{ok:false,error:{code,message,details}}`**（lib/bridge.js:23-61）；`call()` 抛出带 `code/details` 的 Error（479-499），但 `run()` 只显示 `failure.message`（1298-1299）——**最新任务实体被丢弃**。
- 用户看到的是英文 `task "t-…" changed: expected revision 3, current revision 4`；没有“谁改的/改成什么/是否重试”；失败分支不 refresh，卡片保持旧状态到下一个 tick。
- dispatch 的 write-ahead 在面板路径下**无法触发 replay**：`requestId` 由服务端每次调用新生成（lib/hub.js:282），客户端无法复用；连点派发不会幂等吸收，只会撞 revision。
- 冲突 UI 只有 TasksView 顶部一条 ErrorBanner（1379），不落在具体卡片；切页签/关面板即消失。

### 4.4 租约

- `CLAIM_LEASE_MS = 15min`（lib/store.js:22）；claim 置 assignee + `leaseExpiresAt`（lib/tasks.js:192-199）；owner 通过 `status=doing` 的 update 续租（154-157）。
- UI 不显示 `leaseExpiresAt`，没有“续租/接管”动作；卡片只在 `assignee && doing` 时给「释放」（1459-1461）。过期租约的 doing 任务只能「释放」→「认领」两步，且“释放”看不出是接管。
- 后端允许任何人释放过期租约（lib/tasks.js:204-220），UI 不区分“自己的 / 过期的 / 别人的”。

### 4.5 dispatch write-ahead（真实数据里已存在）

- `beginDispatch` 先写 `dispatch.state='creating'`、assignee=`pending:<requestId>`（lib/tasks.js:235-249）→ 新会话 queued（lib/hub.js:303-310）→ prompt 后 accepted（321-329）→ 失败回滚 todo + note（330-341）。
- 本仓库真实板第 2 条任务已有 `dispatch:{state:"accepted",mode:"existing",sessionId:"session-3f3f…"}`（`.dsh/workspace-hub/tasks.json`），**UI 完全不显示**。
- 卡片只在成功后弹一句 notice，没有 per-task 派发状态、失败原因或目标会话入口。

### 4.6 错误 / 离线 / 慢请求

- `call()` 不设超时；慢请求占住 `inflight`，后续 tick 全部早退（1995）——界面“冻住”但不报错。
- 首屏后错误被隐藏：仅在 `error !== undefined && data === undefined` 渲染（2114）；后台轮询失败只 `setError`（2008-2010），界面上**完全看不到**。
- 401/403 与网络失败在 UI 上同形：`${common.failed}: ${message}`（1265-1274），无登录/离线区分，无 backoff，每 4s 重试。
- 页面从隐藏恢复没有立即刷新，最坏再等一个周期（4/5/8/10s）。

### 4.7 具体缺陷定位（竞态 / 重复 / 闪变）

| 类型 | 位置 | 说明 |
|---|---|---|
| 乐观更新缺失 | 全文件无“先写本地 state” | 见 4.2 |
| 写后刷新被丢 | client.js:1995 + 1297 | `await refresh()` 可能立即 resolve |
| 重复读取 | lib/bridge.js:167-177；lib/hub.js:345-355, 358-388 | 每 tick 调 2 次 `conversations()`、读 2 次 board |
| 取了就丢 | client.js:2003-2006, 2052 | `context` 的 board/counts/sessions 全被丢弃，只用 `workspace.path` |
| 双份服务器轮询 | client.js:921 + 1958 | 胶囊 8s + 面板 4s，同端点两个定时器 |
| 未配置也轮询 | client.js:920-922 | hook 在 `configured !== true` 早退之前执行 |
| 作用域切换闪变 | client.js:598-607 | scope 变 → `rows=[]` → 徽标先归零再回填 |
| 胶囊入场抖动 | client.js:922 | 首次 status 前 `return null`，加载完 header 多一个按钮 |
| 页签自己跳 | client.js:1965-1967 | configured 变 false 时 servers → workspace |
| 页签状态不落盘 | client.js:1957 | 每次挂载固定从 tasks 开始；filter/collapse 全丢 |
| 认领身份漂移风险 | client.js:514-538, 1305 | 面板打开后 `retainedBy.mainView` 可能为 0，`scope.sessionId` 回退到“最近更新会话”，claim 记到不一定是用户以为的会话 |
| 菜单不跟滚动 | client.js:678-687, 1146-1152 | rect 只在打开时取一次；无 scroll/resize 重定位、无 max-height |

---

## 5. 状态覆盖矩阵

> ✅ 有覆盖；⚠️ 有但不完整/误导；❌ 缺失。数字为 `client.js` 行号（另注者除外）。

| 状态 | 面板外壳 | 任务页 | 会话页 | 服务器页 | 工作区页 |
|---|---|---|---|---|---|
| empty | ⚠️ 2033-2035：一句“请先打开工作区会话”，无跳转 | ✅ 1425-1426：区分“板空/筛选空” | ✅ 1556-1558 | ⚠️ 890：一句“还没有声明服务器”，无配置指引 | ✅ 1822-1823, 1921-1922 |
| loading | ❌ 首屏 `data===undefined` 被任务页当成空板（1425-1426）；只有 header 文案“加载中…”（2059） | ❌ 无 skeleton/spinner，加载=空 | ❌ 同左 | ⚠️ 889：纯文本 | ✅ 1771-1773 |
| error | ⚠️ 仅首屏（`data===undefined`）显示原始英文（2114-2122）；之后静默 | ⚠️ 1379 只覆盖写操作；轮询错误不可见 | ⚠️ 1563 同上 | ✅ 886-888 + 行内错误 818-820 | ⚠️ 1796；skill 校验错误是原始英文 |
| conflict | ❌ 无 | ⚠️ 只有原始英文 banner，`details.task` 丢弃（1298-1299, 492-496） | ❌ 无此语义 | ❌ 无此语义 | ❌ 整文件覆盖，无冲突检测（1726, 1739） |
| disabled | ⚠️ 刷新仅首载时禁用（2058-2059） | ⚠️ 全局 busy 禁用所有卡片（1293, 1457-1476） | ⚠️ 全局 busy；orphan 禁用（1529, 1594-1601） | ⚠️ 全局 busy 禁用所有行（858-877, 837, 847） | ⚠️ 仅保存中禁用（1838, 1865, 1913） |
| permission | ❌ 401 与网络失败同形（1265-1274） | ⚠️ 无当前会话时 claim 才报 invalid-actor（1314-1315） | ⚠️ 父会话不 live 仍可点“新建子会话”（1597-1605） | ⚠️ external 只读，用状态代替原因（829-831） | ❌ 无权限差异 |
| long-content | ✅ 331 path 省略 | ⚠️ 367/370 可断行但无 clamp；长 detail 整卡展开（真实 title 129 字符） | ✅ 405 子行省略 | ⚠️ 415 错误可滚；command/url 无 break（369, 817） | ⚠️ 394 path 省略；textarea 固定高内滚 |
| many-items | ⚠️ 无 max-width/分页（345） | ❌ 全量渲染；无排序/搜索/分页 | ⚠️ 全量渲染；hover 卡截 4 条无 +N（1071） | ⚠️ 全量；通常只有 1-2 台 | ❌ 指令链目录数 ×4 文件全平铺（1804-1824） |
| stale | ❌ 无任何“最后更新”标记 | ❌ 4s 静默轮询；写后刷新可能被丢 | ❌ 4s；closed 永不显示 | ⚠️ 4s/8s 两个来源，无最后检查时间 | ❌ 仅挂载/保存刷新 |

| 状态 | 标题栏按钮 | 服务器胶囊 | 侧边栏入口/浮层 | 引导卡 | 通知与错误 |
|---|---|---|---|---|---|
| empty | ⚠️ 无 workspace 时整个按钮消失，无解释（1245） | ✅ 未配置时隐藏（922） | ✅「+」入口 976-1000；菜单空态 1161-1162 | ✅ 静态 5 条 | ✅ 无通知时不渲染 |
| loading | ✅ 同步打开 | ⚠️ 用“隐藏”代替 loading，加载完出现导致 header 抖动（922） | ❌ 无 loading；切 scope 先闪空（598-607） | — | ❌ 无 pending / aria-busy |
| error | ❌ `selectPanel` 无失败反馈（2166） | ✅ 红态 + title 926-935 | ❌ catalog 错误被吞（574-576） | — | ⚠️ role=alert 但原始英文（1265-1274） |
| conflict | — | — | — | — | ⚠️ 原始英文 |
| disabled | ❌ 从不 disabled | ❌ 总是可点 | ⚠️ 仅空 prompt 禁用创建（1219） | — | — |
| permission | ⚠️ 非注册工作区直接消失（1245） | ⚠️ 同左 | ⚠️ 无权限区分 | — | ❌ 无 401 专用态 |
| long-content | ✅ title 含工作区名 | ⚠️ 只有原生 title（935） | ✅ 444 省略；菜单无 max-height（427） | ✅ | ⚠️ 服务器 stderr 尾部可达 1200 字符、无折叠（415；lib/servers.js:267） |
| many-items | — | ✅ ready/total（951） | ⚠️ 菜单全量、无滚动上限（1146-1152） | ✅ | — |
| stale | ❌ scope 推断可能过期（517-531） | ⚠️ 8s，无时间戳 | ⚠️ 5s，错误静默 | ❌ 固定文案 | ⚠️ 6s 自动消失（2027-2031），无 hover 暂停/aria-live |

**矩阵里最值得注意的四个结论：**

1. **“loading = empty”**：面板首屏唯一可见的是空板文案（1425-1426），用户无法区分“没任务”和“还没加载”。
2. **“error 只在没数据时可见”**（2114）：中枢最需要可信度，却对“数据可能已过期”完全沉默。
3. “conflict” 在 5 个 surface 里几乎全 ❌/⚠️：后端有完整的 CAS 语义，前端只把它翻译成一句英文。
4. 子会话：发送/中断/重开/最新回复/已关闭列表在设计上全部缺席，与 README/GUIDE 承诺（README.md:13, 220）不一致。

---

## 6. 交互摩擦清单（按优先级）

### P0 · 不解决则重构没有意义

**P0-1 子会话在面板里只能“建”和“关”，不能发消息/中断/重开；关闭即消失**
- 现象：中枢的会话页对子会话只有「打开 / 关闭」；想追加一句话或打断当前 turn，必须离开中枢进入子会话；点过「关闭」后，它在侧栏徽标、hover 卡、会话页里同时消失，无法找回。
- 代价：一个“由主对话管理子会话”的产品，管理动作只实现了一半；关闭变成不可逆的心理负担，用户不敢点。
- 根因：**交互模型 + 信息架构**（后端能力齐全，纯前端可补；closed 过滤是 API 语义而非 UI 选择）。
- 证据：client.js:1648-1675；lib/bridge.js:206-224；lib/subchats.js:264-277；client.js:18-323 的 19 个死 key。
- 建议方向：子会话行内联“最新回复 + 输入框 + 中断/重开”，会话页加“显示已关闭”。

**P0-2 状态会静默过期，错误不可见**
- 现象：首屏成功之后，断网、401、后端 500 都会让界面看起来完全正常；agent 在另一个会话改了任务，中枢最多 4s 后才变，期间没有任何“旧数据”提示；点刷新可能毫无反应。
- 代价：用户对中枢的信任只能靠“碰巧对”；排障时看不到任何线索。
- 根因：**数据流**（轮询 + 错误状态模型）。
- 证据：client.js:1995（write-after-refresh 被丢）、2008-2010、2114（error 仅首屏）、2020-2023（无恢复刷新）、564/630/732（各自跳过 hidden）。
- 建议方向：单一数据源 + 明确“最后更新/已过期/离线”状态；写后强制刷新排队而不是丢弃。

**P0-3 “这个工作区现在在干什么”没有视图**
- 现象：任务页显示谁负责（标题或 id），但不显示任务是否真的在跑、最近一条进展、派发是否成功；会话页不显示该会话负责哪些任务；子会话最新回复不展示；服务器是另一个页签。
- 代价：一次巡检要在 3 个页签之间拼图，再从侧边栏打开会话，平均 5-8 次点击（见 §10a）；“关系”全靠人脑 JOIN。
- 根因：**信息架构**（缺 overview）+ **数据模型**（任务无“当前进度”摘要；但 notes/dispatch/lastAssistantMessage 已存在）。
- 证据：client.js:1431-1451、1581-1588、1652-1673；lib/tasks.js:26-39；lib/subchats.js:247-258。
- 建议方向：首屏“工作区动态”聚合 + 任务行常驻执行者/最近动态。

**P0-4 写操作反馈不可靠且具误导性**
- 现象：派发成功后只弹「已派发给 session-xxxx」；卡片不立即变化；按钮全页禁用；等待期间再点会报英文冲突；「取消」表单不清草稿。
- 代价：用户不确定是否成功 → 重复点击 → 冲突 → 更不确定；把机器信息当产品反馈。
- 根因：**交互反馈 + 数据流**（无乐观更新、无 per-item pending、反馈用了内部 ID）。
- 证据：client.js:1326-1338, 1292-1303, 1416, 1457-1476。
- 建议方向：就地乐观状态 + 目标会话标题 + 可撤销；“派发中”只锁当前卡片。

**P0-5 破坏性/覆盖性操作没有护栏**
- 现象：删除只有原生 confirm 且不带任务名；关闭子会话无确认且不可回；AGENTS.md/CONTEXT.md 是整文件覆盖，无版本/冲突提示；都不可撤销。
- 代价：误操作不可恢复（文件无版本、任务无软删除）；用户不敢碰“删除/关闭/保存”。
- 根因：**交互模型 + API**（缺 If-Match/回收站/撤销端点）。
- 证据：client.js:1322-1325, 1553-1554, 1722-1747, 1836-1841；lib/workspace-info.js:179-191。
- 建议方向：统一确认层（对象名 + 后果）+ 软删除/撤销 toast + 文件写入带 hash CAS。

### P1 · 影响主路径效率与可信度

**P1-1 全局 busy 串行化**
- 现象：任务页任意操作会让**所有卡片**的认领/完成/派发/删除一起禁用；服务器页启动一台时所有行 disabled；会话页创建子会话时所有“打开/关闭”禁用。
- 代价：多任务并行处理被强行排队；长操作（服务器启动 20-30s）期间整页不可用。
- 根因：**交互模型**（一个 view 级 `busy` 布尔）。
- 证据：client.js:1283, 1292-1303, 1457-1476；858-877, 837/847；1524-1538, 1595-1669。
- 建议方向：pending 粒度降到“对象/动作”，其余操作保持可用。

**P1-2 服务器启动是“阻塞 HTTP”，没有进度、日志、取消**
- 现象：点启动后进入最长 20-30s 的白等；全部按钮禁用；看不到进程输出；不自动打开页面；超时后行内只显示错误尾部。
- 代价：用户不知道是慢、卡死还是已失败；只能反复点或去终端看。
- 根因：**API**（同步返回 start 结果）+ 交互。
- 证据：client.js:860-878；lib/servers.js:339-368, 471-489；日志 64KB 已收集但不返回（20, 461-465）。
- 建议方向：异步 job + 轮询/流式日志 + 取消 + 就绪自动打开。

**P1-3 服务器状态枚举会自相矛盾**
- 现象：进程在跑但健康检查未通过（含已超时失败）时，`serverState` 一律显示「启动中」；只有点开错误文本才知道已经超时。
- 代价：用户以为还在启动，实际永远起不来。
- 根因：**数据模型**（`status/ready/error` 三字段与 UI 标签的映射不完整）。
- 证据：client.js:781-791；lib/servers.js:425-428, 471-489。
- 建议方向：把“启动中/就绪超时/已崩溃/外部运行”拆成互斥状态，失败必须显式。

**P1-4 轮询浪费与重复请求**
- 现象：每个 4s tick 中，`context` 的 board/counts/sessions 全被丢弃，只为拿一个 path；`hub.sessions` 又重复做一遍会话枚举；服务器被 4s 与 8s 两个定时器各查一次，未配置工作区也在查；每次 status 都发真实健康探测。
- 代价：CPU/IO/网络与 Host 日志噪音；探测本身可能影响被监控进程；4s 的“实时感”并没有换来正确性。
- 根因：**API**（端点粒度过粗）+ 数据流。
- 证据：client.js:2003-2006, 2052；lib/bridge.js:167-177；lib/hub.js:353, 364；client.js:921, 1958, 920-922；lib/servers.js:307-321。
- 建议方向：一个聚合快照端点（含 revision/时间戳）+ 单一定时器 + 按需探测。

**P1-5 任务列表不可扩展**
- 现象：无排序、无搜索、无分页、无分组；「已完成」和「待办」混在一个时间序里；没有 cancelled 筛选；后端支持的 `status`/`mine` 过滤完全没用；任务多时只能滚。
- 代价：任务板从“共享看板”退化成“流水账”；真实使用超过 20 条后不可用。
- 根因：**信息架构 + 数据流**（客户端过滤替代服务端查询）。
- 证据：client.js:1288-1290, 1358-1370；lib/bridge.js:102-108。
- 建议方向：默认按“需要我处理/进行中/最近完成”分组排序；服务端过滤 + 搜索；保留状态筛选作为二级。

**P1-6 任务只能改状态，不能改内容/加备注/设阻塞/取消**
- 现象：标题、详情、优先级都不可编辑；看不到任何 notes（真实板里有 2 条）；无法把任务标 blocked；对 cancelled 任务点「重开」会被后端拒绝。
- 代价：任务会腐烂（描述过时只能删了重建）；冲突/失败原因无处记录；cancelled 成为只读死状态。
- 根因：**交互模型 + 信息架构**（后端 update 全支持，纯前端可补）。
- 证据：client.js:1318-1321, 1450；lib/bridge.js:121-132；lib/tasks.js:141-163, 144-146；.dsh/workspace-hub/tasks.json 的 notes。
- 建议方向：行内编辑标题/详情/优先级，备注时间线，blocked/cancelled 作为显式动作。

**P1-7 会话页信息不足**
- 现象：只有运行点、子会话数、相对时间；没有“最近一条消息/最近活动”、没有该会话负责的任务、没有子会话最新回复；失败的子会话没有原因；无 title 时显示 `session-xxxx` 前 8 位。
- 代价：无法判断“这个会话是否还在推进”，也无法从会话回到它负责的工作。
- 根因：**信息架构 + 数据模型**（hub.sessions 只返回摘要；subchats.catalog 不含 lastReply）。
- 证据：client.js:1567-1589, 1652-1673；lib/hub.js:134-165；lib/subchats.js:247-258。
- 建议方向：会话行补“最后活动摘要 + 关联任务 + 子会话未读/最新回复”。

**P1-8 工作区编辑缺脏状态/冲突检测/快捷键**
- 现象：保存按钮永远可点；没有“未保存”提示；保存成功后草稿被磁盘内容整体重置；没有 Cmd/Ctrl+S；三个表单共用「保存」和「加载中…」文案；无技能编辑/删除。
- 代价：易覆盖他人编辑；用户不知道是否保存；技能写错只能去文件系统改。
- 根因：**交互模型 + API**（全文件覆盖、无版本）。
- 证据：client.js:1689-1747, 1826-1868, 1913-1917；lib/workspace-info.js:179-191。
- 建议方向：dirty 标记 + 保存快捷键 + If-Match + 明确的保存/创建动词。

**P1-9 权限/前置条件不可见**
- 现象：「新建子会话」对所有会话可点，点后才报 “open the main conversation before creating a sub chat”；没有当前会话时「认领」报 invalid-actor；external 服务器没有停止按钮但不解释原因。
- 代价：错误只能在点击后以英文出现；用户以为功能坏了。
- 根因：**交互模型**（无 disabled 原因/前置校验）。
- 证据：client.js:1597-1605, 1314-1315；lib/bridge.js:193-199；lib/tasks.js:166-169。
- 建议方向：按钮带 disabled + 一句原因；或在选择器里过滤/标注 live 会话。

**P1-10 工作区作用域不透明，且没有切换器**
- 现象：标题栏入口跟随“当前会话”的推断工作区；面板固定工作区但不能切换；侧栏中其他工作区的会话行没有子会话徽标；没有当前工作区的显式名称（只有 path）。
- 代价：多工作区用户不知道自己在看哪个工作区；入口偶发指向错误工作区；子会话入口跨工作区失效。
- 根因：**信息架构**（无 workspace 状态/切换模型）。
- 证据：client.js:514-539, 611-617, 567-571, 1238-1245, 2049-2053。
- 建议方向：面板内显式工作区切换 + 标题显示工作区名；入口只对当前工作区生效并标明。

**P1-11 浮层菜单不稳定**
- 现象：菜单 rect 只在打开时取一次，侧栏滚动/resize 后悬空；无 max-height，子会话多时溢出视口；无方向键/焦点陷阱，Esc 关闭后焦点不回按钮；hover 卡只列 4 条且不提示还有多少。
- 代价：键盘用户几乎不可用；长列表时菜单跑出屏幕。
- 根因：**交互模型 + 视觉**。
- 证据：client.js:678-687, 1146-1152, 427, 1126-1144, 1071。
- 建议方向：滚动/resize 重定位或改为 anchored popover；max-height + 滚动；菜单键盘模型。

### P2 · 体验与一致性问题

**P2-1 自造字号/边框/圆角体系，与宿主不一致**
- 现象：字号 10/10.5/11/11.5/12/12.5/13/13.5/18（9 级、含半像素）；边框 1px；圆角 8/10/12；卡片铺满面板宽度。
- 代价：视觉上“像另一个产品”；半像素字号在非整数缩放下发虚；宽屏卡片行宽过长难读。
- 根因：**视觉**。
- 证据：client.js:325-460；对照 `.tools/extract/dsh/node_modules/@deepseek-ai/dsh-client-ui-schedule/lib/client.js:2433`（14px/1.6、`.5px`、radius 16、`max-width:960px`）与 app.asar 的 radius sm/md/lg=8/12/16。
- 建议方向：收束到宿主 14/13/12/11 四级 + 0.5px hairline + 12/16 圆角 + 内容最大宽。

**P2-2 设计 token 使用偏差**
- 现象：选中态用 `--dsw-alias-brand-primary`（黑白），宿主用 `--dsw-alias-state-business-primary`（deepseek 蓝）；菜单用 `bg-layer-2 + border + 硬阴影`，宿主用 `specific-menu + backdrop-filter + elevation-prominent`；hover 卡字体色硬编码 `#adb2b8/#cfd3d6`（正好等于暗色 label-tertiary/secondary）；light 主题卡片边框 `border-l1`=4% 黑，几乎不可见。
- 代价：暗/亮主题下观感差异大；与宿主菜单/焦点语言割裂；亮色主题卡片“没有边界”。
- 根因：**视觉**（部分为硬编码）。
- 证据：client.js:343, 350, 427, 448-449, 358；app.asar 主题块（border-l1 light `#0000000a`，dark `#ffffff0f`；specific-menu/backdrop）。
- 建议方向：选中/焦点统一 business-primary；菜单/浮层用宿主 surface+elevation；去掉硬编码 hex。

**P2-3 键盘与可访问性缺失**
- 现象：无任何 `:focus-visible` 规则；输入框 `outline:none` 只换边框色；页签没有 `aria-selected/aria-controls/tabpanel`；筛选 chip 用 `role="tablist"` 却没有对应 tabpanel；菜单 `role=menu` 但无 roving tabindex/方向键；无 `aria-live/aria-busy`；任务状态只靠颜色圆点；行尾徽标点击区 16px 高。
- 代价：键盘和读屏用户无法可靠完成“筛选/认领/派发/子会话”主路径；色觉障碍用户读不出任务状态。
- 根因：**视觉 + 交互模型**。
- 证据：client.js:352-353, 420-424, 1159-1187, 1357-1371, 1437, 2064-2110；宿主焦点规范见 app.asar `:focus-visible`（2px）+ schedule client（`:4530` `aria-selected` 页签、`:3487` `aria-busy`、`:3306` `aria-live`）。
- 建议方向：焦点环、语义化 tabs、状态文字、点击区 ≥24px、菜单键盘模型。

**P2-4 空状态只有一行灰字**
- 现象：任务/会话/服务器/技能/筛选 5 处空态都只有 13px 灰字，没有图标、解释或下一步按钮。
- 代价：新用户不知道“空”意味着什么、下一步做什么（尤其 servers 空态）。
- 根因：**视觉 + 信息架构**。
- 证据：client.js:375, 890, 1426, 1557, 1922；宿主空态含 glyph + title + action（schedule client:2433 `.empty/.emptyGlyph/.emptyAction`）。
- 建议方向：空态 = 一句解释 + 一个主行动（新建任务 / 新建子会话 / 如何声明服务器）。

**P2-5 每个侧栏组件重复注入 `<style>`**
- 现象：`SIDEBAR_CSS` 在 7 处被 `h('style')` 注入；每个主会话行的徽标/行首图标/hover 卡各注入一次；`.dsh-hub-server-dot` 在两张样式表里重复定义。
- 代价：N 个会话行 → 2N-3N 个 `<style>` 节点；样式重复解析；随行数线性增长。
- 根因：**架构（客户端注入方式）**。
- 证据：client.js:939, 981, 1006, 1036, 1066, 1156, 1249；409-414 与 456-460。
- 建议方向：一次注入（模块级 style/样式表）而不是每组件实例。

**P2-6 引导卡占首屏，且是“一次性全局”**
- 现象：默认打开，位于所有 tab 内容之上；只按 localStorage 全局 dismiss，不按工作区、不按版本重置；step2 直接写英文 claim/dispatch。
- 代价：老用户每次装新环境都被挡一次；真正需要的上下文帮助（当前工作区没有服务器怎么配）没有。
- 根因：**信息架构 + 文案**。
- 证据：client.js:15, 1968-1982, 2124-2137, 203-207。
- 建议方向：首次运行提示 + 可召回的上下文帮助，而不是常驻卡片。

**P2-7 文档与实现漂移**
- 现象：README 承诺面板有「子会话」页签、可发送/中断/重开（README.md:13, 217, 220），实际不存在；README 说工作区页“只读”（105），实际可写；说统一 4s 轮询（106），实际 5 条不同周期；说可 `POST /workspace-hub/api/hub.ensure` 重建（275），该路由不存在；README 274 仍把中枢描述为“真实普通会话”。
- 代价：用户按文档找不到功能；后续开发者按文档改错地方。
- 根因：**文档/信息架构**。
- 证据：README.md:105-106, 217-220, 274-275；GUIDE.md:70-75；对比 lib/bridge.js:97-253。
- 建议方向：以本审计为准重写 README 的“Web 面板/子会话”两节，删掉不存在的能力。

**P2-8 时间与版本元数据不可读**
- 现象：只有相对时间（刚刚/N 分钟前/N 小时前/N 天前），无绝对时间、无 title；`版本 N` 直接暴露 revision；服务器 `startedAt` 不显示。
- 代价：跨天任务无法定位“到底什么时候”；“版本 3”对用户无意义，只在冲突时更困惑。
- 根因：**内容/文案**。
- 证据：client.js:502-511, 1445, 1448；lib/servers.js:318。
- 建议方向：相对 + 绝对（hover/详情），version 改为“最后修改”或只在冲突时出现。

---

## 7. 内容与文案问题

| 类别 | 现状（引文/证据） | 问题 | 位置 |
|---|---|---|---|
| 产品名 | 「工作区中枢」（标题）／「中枢」（按钮）／「看板」（引导）／「任务板」（README）／Hub（英文按钮） | 同一个产品 5 个称呼，用户无法建立稳定心智 | client.js:172, 203, 312, 1255；README.md:11 |
| 会话 vs 对话 | 页签「会话」；派发项「新建一个对话来执行」「派给已有对话」；空态「请先打开一个对话」 | 同一对象两种称呼，且“对话”只出现在动作里 | client.js:175, 284-285, 307 |
| 子会话 | UI 统一「子会话」，但工具名 `subchat`、英文 `Sub chats`、默认标题 `Sub chat`、底层 id `session-…` | 中英/缩写混用；默认标题是英文 | client.js:174, 289-308；lib/subchats.js:44,58 |
| 派发 | 「派发」「派给已有对话」；引导里直接写 `dispatch 派发` | 动词/名词混用；中文句子里夹英文命令名 | client.js:203-204, 277, 284-286 |
| 认领/释放 | 引导 `用 claim 自己做`；按钮「认领」「释放」 | 英文动词泄漏；「释放」看不出是“放弃/交接” | client.js:203-204, 275-276 |
| 关闭/停止/中断 | 服务器「停止」、子会话「关闭」、后端还有 `interrupt`「中断」（UI 无） | 三个近义动词对应三种语义，界面只出现两个 | client.js:190, 299-301 |
| 取消 | 表单「取消」与任务状态 cancelled（无 UI 入口、无筛选） | 同一词既是动作又是状态 | client.js:264, 271, 365 |
| 版本号 | 卡片显示「版本 3」（`tasks.rev`） | revision 是实现细节，对用户无意义且制造困惑 | client.js:282, 1445 |
| 机器 ID | 「已派发给 session-xxxx」；负责人、会话标题 fallback 到 id 前 8 位 | 内部 ID 进入 toast/卡片；用户无法对应到会话标题 | client.js:1337, 1344, 1568；lib/hub.js:140 |
| 英文错误 | `already-claimed`、`stale-revision`、`parent-not-live`、`skill name must be kebab-case` 等原样进 banner | 用户读不懂，也无法据此行动 | client.js:1298-1299, 1265-1274；lib/* 抛错处 |
| 时间 | 只有「刚刚 / N 分钟前 / N 小时前 / N 天前」，四舍五入（45s→1 分钟） | 无绝对时间、无“更新于”标签、无 title；跨天任务无法定位 | client.js:502-511, 1448 |
| 破坏性措辞 | 「删除这个任务？」不带任务名、不说不可以撤销；子会话「关闭」实际会 drain 进程 | 文案不表达后果 | client.js:281, 1322-1325, 1553-1554 |
| 按钮标签复用 | 技能表单主按钮是「保存」但动作是创建；保存中按钮显示「加载中…」 | 动词错误；加载/保存混为一谈 | client.js:1839, 1866, 1916 |
| 内部机制文案 | 「框架会在下一次请求或会话 resume 时重新读取指令」「注入到该工作区的每个会话」「保存到 .dsh/workspace-hub/CONTEXT.md」 | 面向开发者，不是用户语言 | client.js:208-215 |
| 引导文案 | 「主界面标题栏最左侧的「中枢」按钮打开当前工作区的看板」；第 5 步解释 need-to-know | 自指；解释内部机制；占首屏 | client.js:201-207 |
| 符号无图例 | 派发下拉用 `•` 表示 running；徽标用 `+`；元数据用 `·` | 用户不知道 `•` 的含义 | client.js:1497, 998 |
| 服务器状态拼接 | `运行中 · 就绪`、`启动中` 由 `serverState()` 拼字符串 | 状态不是可枚举值，无法本地化/测试/加图标 | client.js:781-791 |
| 文档漂移 | README 承诺不存在的「子会话」页签、发送/中断、只读工作区、hub.ensure 路由 | 用户按文档找不到功能；开发者按文档改错 | README.md:13, 105-106, 217-220, 274-275 |

**文案判断：** 术语应收束为「工作区中枢 / 任务 / 会话 / 子会话 / 派发 / 认领」六个词；错误信息必须是“发生了什么 + 我该怎么办”；破坏性动词要说明对象与后果；内部概念（revision、session id、need-to-know、system prompt section）不应出现在面向用户的文案里。

---

## 8. 视觉盘点

### 8.1 实际使用的 token（17 个）与宿主值

| token | 中枢用在哪 | light 值 | dark 值 |
|---|---|---|---|
| `--dsw-alias-bg-base` | 面板底、输入框、回复块 | `#fff` | `#151517` |
| `--dsw-alias-bg-layer-1` | 卡片/表单/按钮底 | `#fff`（与 base 同色） | `#232324` |
| `--dsw-alias-bg-layer-2` | 菜单、chip active | `#fff` | `#2c2c2e` |
| `--dsw-alias-border-l1` | 卡片/页签/按钮边框 | `#0000000a`（4% 黑） | `#ffffff0f`（6% 白） |
| `--dsw-alias-border-l2` | 输入框、菜单边框 | `#0000001a` | `#ffffff1f` |
| `--dsw-alias-label-primary` | 正文 | `#0f1115` | `#f9fafb` |
| `--dsw-alias-label-secondary` | 元数据/次要 | `#61666b` | `#cfd3d6` |
| `--dsw-alias-label-tertiary` | 侧栏计数 | `#81858c` | `#adb2b8` |
| `--dsw-alias-label-primary-foreground` | 主按钮文字 | `#fff` | `#0f1115` |
| `--dsw-alias-brand-primary` | 选中页签/输入 focus/图标气泡 | `#0f1115`（近黑） | `#f9fafb`（近白） |
| `--dsw-alias-button-primary-fill/hover` | 主按钮 | `#0f1115` / `#43454a` | `#f9fafb` / `#ebeef2` |
| `--dsw-alias-interactive-bg-hover` | 行/chip hover | `#2631480f` | `#ffffff14` |
| `--dsw-alias-state-success-primary` | running/done 点、Icon 绿气泡 | `#22c55e` | `#22c55e` |
| `--dsw-alias-state-warn-primary` | blocked 点、external 点 | amber-500 | amber-500 |
| `--dsw-alias-state-error-primary` | 删除 hover/错误/失败点 | `#ec1313` | `#f25a5a` |
| `--dsw-alias-state-idle-primary` | 停止/空闲点 | `#d4d4d4` | `#545557` |

（值取自 app.asar 的 `body{…}` 与 `body[data-ds-dark-theme]{…}` 主题块；中枢未使用 `--dsw-alias-border-l3/l4`、`--dsw-alias-state-business-primary`、`--dsw-radius-*`、`--dsw-font-*`、`--dsw-elevation-*`、`--dsw-specific-menu`、`--dsw-focus-ring-*`、`--dsw-alias-label-caption`。）

### 8.2 硬编码颜色（仅 3 处，但都在主题敏感位置）

| 位置 | 值 | 风险 |
|---|---|---|
| client.js:427 菜单阴影 | `box-shadow:0 14px 40px rgba(0,0,0,.28)` | 宿主用 `--dsw-elevation-prominent`（随主题变化的描边+阴影）；自定义阴影在亮色下过重 |
| client.js:448 hover 卡标题 | `color:#adb2b8` | 恰等于暗色 `label-tertiary`；亮色主题/亮色宿主 hover 面板上对比不足 |
| client.js:449 hover 卡正文 | `color:#cfd3d6` | 恰等于暗色 `label-secondary`；同上，且完全不响应主题 |

### 8.3 与宿主设计语言的量化差异

| 维度 | 工作区中枢 | 宿主（schedule / cordis 插件与 token） |
|---|---|---|
| 字号阶梯 | 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 18（9 级，含半像素） | 20 标题 / 16 base / 14 body / 13 / 12 / 11；`--dsw-font-s-14`、`--dsw-font-xs-13` |
| 边框 | 统一 `1px`，card 用 `border-l1` | 大量 `.5px` hairline，card/行用 `border-l3`/`border-l4` |
| 圆角 | 按钮/输入 8、菜单/技能 10、卡片/表单 12、chip/pill 999 | `radius-sm=8`、`md=12`、`lg=16`；主按钮 32px 高、圆角 16（胶囊）；菜单 16 |
| 按钮尺寸 | `padding:6px 10px`、12.5px 字、高约 27px | 主按钮高 32、圆角 16；图标按钮 28×28；行内按钮 24-28 |
| 行/卡密度 | 卡片 `padding:12px 14px`、列表 `gap:8px`、动作区 `margin-top:10px` | 列表行 `padding:8px`、`gap:2px`；设置行 `min-height:48px`；卡片 12-16 圆角 |
| 内容宽度 | 面板 body 无 max-width，左右固定 24px | `max-width:960px; margin:0 auto; padding:0 clamp(24px,4vw,48px) 48px` |
| 标题 | 18px / 600 | `h1` 20px / 500，行高 28 |
| 选中态颜色 | `brand-primary`（黑白） | `state-business-primary`（deepseek 蓝），下划线/文字同色 |
| 菜单 surface | 不透明 `bg-layer-2` + 1px 边 + 自定义阴影 | `specific-menu`（半透明）+ `backdrop-filter:blur(40px) saturate(150%)` + `elevation-prominent` |
| 焦点 | 未定义任何 `:focus-visible`；输入框 `outline:none` | 全局 `:focus-visible` 2px，颜色 `focus-ring-color`/state-business |
| 空态 | 36px padding + 一行 13px 灰字 | 48px padding + 图标 + 标题 + 行动按钮 |

### 8.4 暗色 / 亮色风险点

1. **亮色主题卡片几乎没有边界**：`bg-layer-1` 与 `bg-base` 同为 `#fff`，卡片只靠 `border-l1`=`#0000000a`（4% 黑）区分（client.js:326, 358）；宿主亮色卡片用 `border-l4`（16% 黑）。在亮色屏幕上整页会“糊成一片”。
2. **ghost 按钮 hover 在亮色下不可见**：`.ghost:hover` 用 `bg-layer-1`（=白）作背景（client.js:339），宿主用 `interactive-bg-hover`。
3. **菜单不随主题变化**：不透明 `bg-layer-2` + 黑阴影，暗色下比宿主菜单“实”，亮色下阴影过重；没有 `specific-menu` 的半透明/模糊效果（client.js:427）。
4. **hover 卡硬编码暗色 token 值**：`#adb2b8` / `#cfd3d6` 是暗色 label-tertiary/secondary（client.js:448-449）——作者显然只对着暗色看过。
5. **选中态没有品牌色**：`brand-primary` 在亮色是近黑、暗色是近白，页签选中只表现为“更黑/更白 + 细下划线”；宿主用蓝色 business-primary，识别成本更低。
6. **状态色只出现在 9px 圆点上**（client.js:360-365），亮色 `state-idle-primary` `#d4d4d4` 在白底上几乎不可见；任务状态没有文字兜底。

### 8.5 可访问性（a11y）风险

| 风险 | 证据 |
|---|---|
| 页签语义不完整：`role="tab"` 无 `aria-selected`/`aria-controls`，没有 `tabpanel` | client.js:2064-2110 |
| 筛选 chip 用 `role="tablist"` 但没有对应 panel；实际是 segmented control 语义 | client.js:1357-1371 |
| 无任何自定义 `:focus-visible`；输入框 `outline:none` 只换边框色 | client.js:352-353, 437 |
| 菜单 `role=menu`/`menuitem`，但无 roving tabindex、方向键、焦点陷阱；菜单渲染在 frame 级 overlay 中，Tab 顺序不与触发按钮相邻 | client.js:1159-1187, 1126-1144 |
| 无 `aria-live`/`aria-busy`：轮询更新、notice、错误都不播报 | client.js:2027-2031, 2115-2122；对比 schedule client:3487（aria-busy）/ :3306（aria-live） |
| 任务状态仅靠颜色圆点，读屏完全读不到状态 | client.js:1437, 360-365 |
| 点击区过小：行尾徽标高 16px、行首字形 16×20、部分 ghost 按钮 20-24px | client.js:420-424, 423 |
| 对比度风险：10.5px 大写 pill 用 secondary（client.js:373）；`.missing` 透明度 .55（393）；disabled 透明度 .5（335）；错误长文本无最大高（376） | 同上 |
| 图标按钮没有可见文字，只有 `title`/`aria-label`；读屏可用，但可视用户要靠猜 | client.js:986-988, 1042-1043 |

---

## 9. 架构约束与可扩展点

### 9.1 已用槽位与可选扩展点

| 槽位 | 中枢注册内容 | 约束 | 证据 |
|---|---|---|---|
| `conversation.header.leading` | 中枢按钮 + 服务器胶囊 | single（README.md:199），每主视图 1 个；无会话也在 | client.js:2210-2211, 1238-1263 |
| `sidebar.workspaces.session.row.action` | 子会话计数徽标 /「+」 | 主会话行 hover 动作区 | client.js:2216-2218 |
| `sidebar.session.row.leading` | 子会话字形（常驻） | 运行中的行该格被框架状态点占用 | client.js:2222-2224；README.md:226 |
| `sidebar.session.row.hover` | hover 卡前 4 条 | 纯展示 | client.js:2219-2221 |
| `shell.overlay` | frame 级菜单 | 单例、定位 fixed | client.js:2225-2227 |
| `main` | 每工作区 1 个面板 | key 即身份；`layout.selectPanel` 切换 | client.js:2185-2195, 2166 |

app.asar 中出现、中枢未使用、可作为后续扩展点（语义需 Host 文档确认，不能在未确认前依赖）：`sidebar.workspaces.session.menu.item`、`sidebar.workspaces.directoryFlow`、`sidebar.panellist`、`sidebar.footer.action`、`sidebar.brand.mark`/`sidebar.brand.name`、`sidebar.right.pane.tab`、`sidebar.toggle.badge`。

### 9.2 面板与布局约束

- **宽度**：`main` 面板 = 视口 − 侧栏。宿主布局 store：侧栏默认 280、clamp 264–420；右栏最小 300、可全屏（app.asar 布局服务）。中枢 body 无 max-width（client.js:345），宽屏下卡片行宽会非常长。
- **无响应式规则**：`client.js` 全文件没有 `@media`；窄屏只靠 flex-wrap（client.js:346, 372）勉强不溢出。
- **不是右栏/浮层**：中枢占 `main`，打开会话就离开中枢；宿主支持右栏（`sidebar.right.pane.tab` 等），但中枢没有利用。
- **无 URL/深链**：面板身份只是 `layout.selectPanel` 的字符串（client.js:2166）；tab 不进入任何路由或持久化（client.js:1957），刷新页面回到任务页。

### 9.3 客户端能力边界（只能用什么）

- 客户端只 `require('react')`，不导入任何 Harness 组件库（client.js:8-16）；样式是字符串 CSS + `--dsw-*` token（325-461）。**没有现成的宿主 Button/Menu/Tabs 可复用**，只能按其视觉/ARIA 约定重实现（§8 的对照即为此）。
- 注入服务：`slots`、`locale`、`uiWorkspace`、`layout`、`sessions`（client.js:2156）；本地可用：同源 `fetch`、`localStorage`、`window.open`/`confirm`、`document` 事件。
- 桥路由：`POST /workspace-hub/api/<method>` only（lib/bridge.js:261-264），同源 cookie 认证（255-260）；board 错误多数返回 **HTTP 200 + body.ok=false**（23-61），客户端不能靠 HTTP status 判断冲突。
- 无构建步骤：`package.json` 的 `files` 只发 `client.js`/`index.js`/`lib`，不能引第三方 UI 依赖或 JSX。

### 9.4 改动归属：纯前端 vs 必须动 Host/API

| 需求 | 纯前端 | 需 Host/API | 说明 |
|---|---|---|---|
| 子会话发送 / 中断 / 重开 / 显示已关闭 | ✅ | — | bridge 已实现（lib/bridge.js:206-224），只差 UI + `includeClosed` 调用 |
| 子会话最新回复 | ⚠️ | ✅ | `subchats.catalog` 不含 `lastAssistantMessage`；用 `subchats.list` 需 live 父会话且逐父拉取；更好的做法是扩展 catalog |
| 任务备注 / 派发状态 / 编辑标题详情 / blocked / cancelled | ✅ | — | `tasks.list` 已返回 `notes`/`dispatch`/`dispatches`；bridge update 支持全字段（lib/bridge.js:121-132） |
| 任务 ↔ 会话关联、工作区动态 | ✅ | — | 两侧都有 `sessionId`，可直接 join |
| 服务器日志 / 启动进度 / 取消 | — | ✅ | `start` 同步阻塞、`status` 不返回日志；需要异步 job + 日志读取接口 |
| 规则/上下文写入冲突检测 | — | ✅ | 需要返回 hash/mtime + If-Match 语义 |
| 键盘快捷键 / 命令面板 | — | ✅ | 客户端测试明确不得注入 shortcuts（test/client-ui.test.mjs:112）；需要 Host 能力 |
| tab 级深链 / 恢复 | — | ✅ | layout 只有 `selectPanel`，无路由 |
| 推送式更新（替代轮询） | — | ✅ | 客户端无事件通道 |
| 工作区切换器 / 当前工作区显式显示 | ✅ | — | `hub.catalog` 数据已有；也可在面板 head 显示 workspace title |
| 编辑 servers.json | — | ✅ | 当前无写配置文件的 bridge 方法 |
| 软删除 / 撤销 | — | ✅ | 需要回收站/undo 端点 |

### 9.5 结构约束

1. 单文件、无构建：设计系统只能以“字符串 CSS + 小组件 + token”实现。
2. 面板按工作区注册，不是单例：任何跨面板状态必须放模块级 store（现有 `subchatCatalog`/`hubCatalog` 即此模式，client.js:552-657）。
3. 仅 web 平台（`package.json` → `dsh.client.platform: "web"`）：无移动端布局。
4. 版本窗口 `>=0.2.1-rc.2 <0.3.0`：槽位名与 token 以该版本为准，升级需回归。
5. 测试只 mock React（test/client-ui.test.mjs:8-18），无法渲染真实组件树：状态机/交互必须先纯函数化，否则无法测试。

---

## 10. 5 个用户任务场景走查

> 点击次数按代码路径实算（不含滚动/阅读）。

### (a) 打开中枢看清“现在工作区在干什么”

- 目标：3 秒内回答：哪些任务在跑、哪些会话在跑、服务器是否就绪、子会话有没有新回复。
- 实际操作：点「中枢」（1）→ 默认落在任务页，读卡片（0，但卡片没有 running/最近进展）→ 点「会话」（2）→ 数运行中会话 → 点「服务器」（3）→ 读就绪数 → 想确认某任务进展，点回「会话」（4）→ 找执行会话点「打开」（5）→ 离开中枢；再看子会话回复需回侧栏 hover 主行（不计点击）→ 点徽标（6）→ 点子会话（7）。
- 点击：**7 次**（1 次打开中枢 + 3 次页签 + 打开会话 + 徽标 + 子会话），其中 2 次会离开中枢。
- 卡点：四块状态不在同一屏；任务卡没有“是否真的在跑”；子会话回复不可见；每次“打开”都丢失中枢上下文。
- 理想交互：打开即一屏「工作区动态」——进行中任务 + 执行会话 + 运行中子会话 + 服务器状态 + 最近变更，全部可直接点入。

### (b) 新建任务并派发给一个已有会话

- 目标：一个任务交给某个已有会话执行。
- 实际操作：中枢（1）→ 新建任务（2）→ 点标题输入（3）+ 输入 →（可选详情）→ 创建任务（4）（或 Enter）→ 等创建 + 3 个刷新请求 → 派发（5）→ 打开下拉（6）→ 选会话（7）→ 点派发（8）。
- 点击：**8 次指针动作 + 1 次输入**；若用 Enter 可省第 4 击。
- 卡点：创建与派发是两次提交、两个等待；必须等任务出现在列表后才能派发；下拉是原生 select 不可搜索；确认后只回一个 session id。
- 理想交互：一个 composer「标题 + 目标会话 + 创建并派发」，一次提交，就地显示目标会话标题。

### (c) 跟踪一个已派发任务的进展

- 目标：知道任务被谁接手、做到哪、有没有回话。
- 实际操作：中枢（1）→ 任务卡（0：能看到负责人标题/版本/相对时间，但看不到 dispatch 状态、备注、最近回复）→ 点「会话」（2）→ 找到执行会话点「打开」（3）→ 读对话；任务上下文丢失。
- 点击：**3 次 + 一次视图切换（离开中枢）**。
- 卡点：`dispatch.state`/`notes`/`lastAssistantMessage` 都已存在但不展示；没有“打开执行会话”链接；不知道 agent 是否真的接手。
- 理想交互：任务行常驻“执行者 + 最近动态 + 未读”，展开就地看时间线，一键跳到会话。

### (d) 给运行中的子会话追加消息 / 中断

- 目标：不离开中枢，给子会话补一句话或打断当前 turn。
- 实际操作（唯一路径）：侧栏 hover 主行（不计点击）→ 点徽标（1）→ 点子会话（2）→ 在子会话输入框发送（3）；中断要再找该会话自己的停止控件（4）。或经中枢：会话（1）→ 展开（2）→ 打开（3）→ 发送/停止（4）。
- 点击：**4 次**（徽标 → 子会话 → 发送 → 中断控件），且必须进入子会话会话（离开中枢）。
- 卡点：中枢完全没有发送/中断/重开；关闭后无法找回；菜单不显示最新回复。
- 理想交互：子会话行内联「最新回复 + 输入框 + 中断/重开」，全程不离开中枢。

### (e) 起开发服务器并打开页面

- 目标：把声明/识别出的 dev server 起起来，打开页面。
- 实际操作：点「服务器」胶囊（1）→ 落在服务器页 → 点「启动」（2）→ 等待最多 20–30s（按钮全禁用、无进度/日志、不能取消）→ 就绪后点「打开」（3）。
- 点击：**3 次**（这是全产品最顺的路径）；若胶囊不存在（未识别/显式关闭）：中枢（1）→ 工作区（2）→ **没有任何服务器配置入口**，只能去仓库手写 `servers.json`。
- 卡点：阻塞等待不可取消；失败只有 stderr 尾部；不自动打开；启动中状态可能永远停在「启动中」。
- 理想交互：一键「启动并打开」，过程有实时日志与取消，就绪自动打开或高亮「打开」。

---

## 11. 可用但未利用的数据与能力

### 11.1 后端已返回、UI 丢弃的字段

| 来源 | 字段 | 现状 |
|---|---|---|
| `tasks.list` → task | `notes[]`（最多 50 条，带 sessionId/时间） | 完全不展示；真实板里 2 条 |
| 同上 | `dispatch{state,mode,sessionId,at,error}`、`dispatches[]`（20 条） | 完全不展示；真实板里已有 `accepted` |
| 同上 | `createdBy{title,sessionId}`、`createdAt` | 不展示“谁建的/创建时间” |
| 同上 | `assignee.title` 以外的 `assignee.leaseExpiresAt`、`claimId` | 租约/接管不可见 |
| `tasks.list` → board | `revision`、`updatedAt`、`counts.cancelled/total` | 板级版本/总更新不显示；cancelled 无筛选入口 |
| `context` | `board`、`boardRevision`、`counts`、`sessions` | 客户端只用 `workspace.path`（client.js:2052） |
| `hub.sessions` | `workspace{id,title,path}`、session `blank/archived/updatedAt`、subchat `updatedAt/label` | 基本不用 |
| `subchats.list`（未调用） | `lastAssistantMessage`、`registered`、`createdAt` | 最新回复能力存在但 UI 不请求 |
| `subchats.catalog` | 只返回未关闭行；`includeClosed` 能力在 `subchats.list` | 关闭后不可见、不可重开 |
| `servers.status` | `path`、`source`；发现器的 `notes` 被 `status()` 丢弃 | 配置路径/识别说明不显示 |
| `servers.start` | 返回的 per-row 结果（含 url/错误） | 客户端丢弃，改为再发一次 status（client.js:870-872） |
| `hub.workspace` | `files.rulesPath/contextPath/skillsDir`、skill `provider/workspaceScoped`、`project[].scope` | 只用了部分；`global[].label` 被用来猜文件名（1817-1819，脆弱） |
| 服务器进程 | 64KB stdout/stderr（lib/servers.js:20, 461-465） | 只在失败消息里回显尾部；无日志视图 |

### 11.2 已有 bridge 方法但前端从未调用（5 个）

| 方法 | 能力 | 后果 |
|---|---|---|
| `tasks.get` | 单任务读取 | 无单任务详情视图 |
| `subchats.list` | 按父会话列子会话（含最新回复、includeClosed） | 最新回复/已关闭列表不可见 |
| `subchats.send` | queue / steer 发送 | 面板不能发消息 |
| `subchats.interrupt` | 停当前 turn、保留可继续 | 面板不能中断 |
| `subchats.reopen` | 重开已关闭子会话 | 关闭不可逆 |

### 11.3 Agent 工具已支持、UI 没有的动作

- `workspace_task`：`update` 的 title/detail/priority/note/status（含 blocked/cancelled）、`list` 的 `statusFilter`/`mine`、`get`、`release`、`delete`（lib/tools.js:97-153）。
- `subchat`：`send`（queue/steer）、`interrupt`、`reopen`、`list includeClosed`（lib/tools.js:186-214）。
- `dev_server`：`status`、`start`/`stop` 带 `names` 批量（lib/tools.js:353-363）；面板只能逐行操作、不能批量。

### 11.4 DSH 宿主已有、中枢未采用的 UI 能力

`state-business-primary` 选中色；`.5px` hairline（border-l3/l4）；`elevation-panel/prominent`；`specific-menu` + `backdrop-filter: blur(40px) saturate(150%)`；`radius-sm/md/lg`；`--dsw-font-*` 字体阶梯；`:focus-visible` 2px 焦点环；`aria-selected` 页签 + 下划线；`aria-busy`/`aria-live`；空态 glyph + 标题 + action；确认对话框模式；搜索框；segmented control（`filterTab`）；tooltip surface；scrollbar token；`prefers-reduced-motion`；`field-sizing`。证据：app.asar 主题/焦点块；`.tools/extract/dsh/node_modules/@deepseek-ai/dsh-client-ui-schedule/lib/client.js:2433`（页面/空态/页签/搜索/焦点）、`:1784`（菜单/行）、`:3306/:3487/:4530`（aria-live/aria-busy/aria-selected）。

---

## 12. 现有设计的可保留资产

1. **“每个工作区一个固定面板”的身份模型**：面板 props 固定 workspaceId/path，key 即身份，跨工作区不会串数据（client.js:2185-2196；README.md:93）。这是正确的信息架构地基，重构不要退回“全局单面板”。
2. **标题栏入口 + 状态胶囊的组合**：入口可见、跟随工作区、无会话也在；胶囊用“就绪/总数 + 四色”做 glanceable 状态（client.js:917-954, 1238-1263）。胶囊的“数字 + 点 + 点击进入详情”模式值得保留。
3. **任务卡的信息骨架**：状态点 → 标题 → 优先级 pill → 负责人 → 相对时间 → 详情，层级清楚、密度尚可（client.js:1431-1451）。重构可换布局，不必推翻字段选择。
4. **状态筛选 + 计数**：`counts` 由后端统一口径计算（lib/tasks.js:299-303），前端只筛不重算；这是正确做法（client.js:1352-1372）。
5. **服务器行的运维透明度**：命令、cwd、URL、外部运行标注、失败输出尾部（client.js:793-853）。比多数“只显示 running”的实现诚实。
6. **工作区“继承链只读 + 本地可编辑 + 生效时机说明”的模型**：全局/项目规则只读展示，只写工作区本地文件，并提示何时生效（client.js:1804-1870；README.md:234-246）。模型正确，只是呈现和护栏要补。
7. **子会话的增量入口方案**：宿主不提供行级子会话槽位时，用“行首字形 + hover 徽标 + overlay 菜单”挂到主会话行（client.js:972-1235；README.md:224-232）。在不接管侧边栏的前提下这是务实解法。
8. **后端并发模型**：进程内 FIFO + 跨进程锁 + 每任务 CAS + 15min 租约 + 原子写 + 损坏不覆盖（lib/store.js:1-13, 203-228, 286-314；lib/tasks.js:75-88）。这是产品可信度的底座，重构的乐观 UI 可以建立在其上。
9. **dispatch 的 write-ahead 设计**：先落盘 intent 再发 RPC，失败回滚并写 note（lib/tasks.js:226-288；lib/hub.js:274-342）。语义完整，值得在 UI 上“显性化”而不是重做。
10. **完整 i18n 字典与 locale 服务**：150 个 key 覆盖全部 surface，中英齐全（client.js:18-323）。重构文案可直接改字典，不需要重接线。
11. **单文件、无依赖、token 化、前缀隔离**：`dsh-hub-` 命名空间 + `--dsw-*` token，不污染宿主样式（client.js:325-461；package.json）。这是可维护性资产。
12. **可跑的测试基线**：`client-ui` 验证槽位注册与不抛错；`core.test` 覆盖 CAS/租约/并发 claim 单赢家/损坏保护/无锁残留。重构后端语义有回归保护，前端交互测试需补。
13. **首次运行引导的“可关闭 + 记住”机制**：localStorage 方案简单有效（client.js:15, 1968-1982），可保留为“首次运行提示”的基础。

---

## 审计边界

- 本审计未做浏览器像素级走查（当前会话无浏览器控制）：视觉结论来自代码、DSH 主题 token 与宿主 UI 插件的 CSS/ARIA 实现；亮/暗两套主题的实际观感需在设计阶段用真实页面复核。
- “请求量/点击次数”按代码路径静态计算，未在运行时打点；真实数值受缓存、用户操作节奏影响。
- 所有源码保持只读；本次唯一写入是 `docs/redesign/01-current-audit.md`。


