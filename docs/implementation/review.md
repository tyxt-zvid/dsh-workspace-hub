# 代码评审 · Workspace Hub Console（client.js 重写）

- 基线：`client.js` **5689 行**，sha256 `4c90c0e3092ae8f23b61d71abe30564d8e2af7e3ca5de821b4522e0e053980ff`（mtime 10:59）；`test/client-ui.test.mjs` 188 行，sha256 `cfe22685…f4268e`。
- 对照：`docs/implementation/00-brief.md`、`docs/redesign/03-strategy.md`、`docs/redesign/prototype/index.html`。
- 实测：`node test/core.test.mjs` / `test/snapshot.test.mjs` 全过；`test/client-ui.test.mjs` 4/4 过。静态 grep：`window.confirm` 0、`linear-gradient` 0、硬编码 hex 0、emoji 0、`font-size:10.5px` 0，字号集合 = {10,11,12,13,14,15,20}；`document.addEventListener` 3（2 处既有侧边栏菜单 + 1 visibilitychange），`setInterval` 3（subchatCatalog 5s / hubCatalog 10s / 头部胶囊 8s）。
- 评审期间文件从 5608（10:52）漂移到 5689（10:59），本文所有行号对应上述最终 sha。评审未修改任何代码。

## 1. 裁决

**ship after fixes** —— 外壳/槽位零回归、数据层与乐观写框架符合契约、测试与视觉硬约束全绿；但仍有 1 个写错目标的 P0 和一批交互/一致性 P1，建议修完 P0+P1 再重载插件。

## 2. P0 问题（must fix before reload）

### P0-1 会话行「新建子会话」建到了当前对话，而不是被点击的那一行
- 现象：在「对话」页对**非当前会话**点 `⋯ → 新建子会话`，新子会话（及其 prompt / 后续模型执行）挂到当前正在看的对话下；创建表单抬头显示的也是当前对话标题。
- 证据：根级会话菜单 `client.js:4122-4131` 与行内菜单 `client.js:5203-5209` 都写死 `sessionId: scope.sessionId`（`scope.sessionId` 是 `useScope` 解析出的“当前对话”，不是行参数 `session.sessionId`）；提交处 `client.js:3554-3561` 用 `subchatCreate.sessionId` 作 `parentSessionId`；抬头 `client.js:5060`。
- 修法：两处 onClick 改传 `session.sessionId`；顺手删掉重复菜单渲染（见 P1-1），只保留一处入口。

## 3. P1 问题（按影响排序）

### P1-1 task / session 上下文菜单各渲染两次（重复 DOM + 双 role=menu）
- 现象：点任务行或会话行的 `⋯` 会同时出现两个菜单：一个锚在行内右侧，一个锚在面板右上（`.wh-menu` 默认 `top:36/right:8`，`client.js:1040`）。
- 证据：根 `renderMenu` 处理 task/session：`client.js:4071,4101,4122`，并被无条件挂载 `client.js:5605`；行内又各渲染一次：task `client.js:4483`（`renderTaskMenu` 见 `4141`），session `client.js:5203`。两套菜单代码还重复（会漂移）。
- 修法：删除根 `renderMenu` 的 task/session 分支（只留 workspace 菜单），或反之；保留单一实现。

### P1-2 409「重试我的修改」必然再次 409（闭包里是旧 revision）
- 现象：行内编辑/状态切换遇到 CAS 冲突后点「重试我的修改」，会再次冲突，形成死循环；用户只能「采用最新」。
- 证据：冲突时把原请求闭包存进 `conflict.retry`（`client.js:2482-2496`），重试原样重放（`client.js:2520-2526`、按钮 `4345`）；而闭包里的 revision 来自渲染期快照：`taskRequest` `client.js:3248`、`commitEdit` `client.js:3385`（`current.revision`）、`addNote` `client.js:3440`。
- 修法：冲突里存「意图」(taskId/field/value)，重试时用 `latestTask(id).revision` 重建请求；或让 request 从 `stateRef.current.data` 读最新 revision 而非渲染闭包。

### P1-3 删除遇到 409 时静默且行不恢复
- 现象：删除被别的会话抢先修改（stale-revision）时，行仍保持“已消失”，无 toast、无冲突条，直到下一次 4s 轮询才回来。
- 证据：`runOptimistic` 冲突分支只 `patchTaskInData` + 置 conflict（`client.js:2482-2496`）——行已被乐观移除，patch 是 no-op，且 **不执行 rollback**；`deleteTask` 对 conflict 直接 return（`client.js:3291-3302`），而冲突 UI 只在存在的行上渲染（`4333-4345`），无法触达。
- 修法：冲突分支无条件执行 `rollback`；`deleteTask` 对 conflict 补一次 `snap.refresh()` + toast；或把冲突条提到面板级。

### P1-4 内联「发送」只在 running 子会话出现（与 brief §3.2 冲突，strategy §5.7 支持）
- 现象：idle/active 子会话没有输入框，只能先「打开」再回消息；host 本身支持 cold resume 发送（`lib/subchats.js:310-340`），`sendSubchat` 也已实现。
- 证据：`client.js:5256` `running !== true ? null : <composer>`。
- 修法：composer 对 `status !== 'closed' && status !== 'failed'` 渲染（或 idle 行给「发消息」按钮）；同时把 brief/strategy 两处说法统一。

### P1-5 子会话状态缺 locale 键，界面会直接显示 key
- 现象：子会话处于 provisioning/active/failed 时，行内状态文案会显示 `subchats.status.failed` 这类原始 key（中文/英文模式都会）。
- 证据：动态键 `client.js:5247`；DICT 只有 running/idle/closed（`client.js:221-223`、563-565）；catalog 会返回 `row.status`（`lib/subchats.js:278`，值为 provisioning/active/failed）。
- 修法：补齐 3 个键（双语），或 map 到 idle 再显示。

### P1-6 未读/注意力信号语义不成立（基于 updatedAt）
- 现象：给子会话发消息后，旧的 lastAssistantMessage 会被标成“未读”；而后续 assistant 新回复不产生未读，`attn.unread` / 「有未读」筛选基本失效。
- 证据：`subchatUnread` 用 `updatedAt > seen` 且 `lastAssistantMessage` 非空（`client.js:2092-2100`；`unread` 字段 host 未提供，`2095` 恒为 0）；host 只在 send/close/reopen 更新 row.updatedAt（`lib/subchats.js:330/365/384`），回复不改。
- 修法：`seen` 里记录 lastAssistantMessage 指纹，或 host 增 `lastReplyAt`（推荐，Lead）。

### P1-7 删除撤销丢归属 / 派发历史（brief §2.3 字段未落实）
- 现象：撤销删除一个 doing 任务后，任务回到「doing + 无人认领」，派发记录丢失。
- 证据：restore body 只有 id/title/detail/priority/status/createdAt/notes（`client.js:3309-3321`）；brief §2.3 的契约含可选 `assignee`；host `restoreTask` 置 assignee=null、dispatch=null、revision=1（`lib/tasks.js:305-340`）。
- 修法：client 传 `deleted.assignee`；host restore 恢复 assignee/dispatch（Lead 侧）。

### P1-8 写后刷新可能被丢弃 + 旧快照覆盖乐观值（残留竞态）
- 现象：写完成的瞬间若恰有轮询在途，写后 `refresh(false)` 被 `busy` 直接吞掉（不排队）；该旧轮询随后落盘时 `optimisticRef` 已归零，合并会覆盖乐观行，最多 4s 后才纠正。
- 证据：`client.js:2413-2418`（busy 早退）、`2478`（写后 refresh）、`2432`（仅写未完成时挡合并）、`2445`（下一次 4s）。
- 修法：pendingRefresh 标志在 tick 的 finally 补跑；或给快照请求加序号，丢弃早于最后一次写提交的响应。

### P1-9 「显示已关闭」开关是假控件
- 现象：切换该开关列表不会变化；closed 子会话始终显示。
- 证据：`client.js:3038,4977,4986` 只过滤 `session.archived`，而 host conversations 已把 archived 过滤掉（`lib/hub.js:395`），所有返回行 `archived:false`；开关 `client.js:5024`；closed subchats 无条件渲染（`client.js:5223+`）。
- 修法：用 `showClosed` 过滤 subchats（snapshot 已 `includeClosed:true`），或删除该开关并改文案。

## 4. 与 brief / strategy 的偏差（P2 汇总）

- **轮询未收敛到「单定时器单请求」**（strategy §6.1）：panel snapshot 4s（`client.js:2432-2445`）+ 头部胶囊 servers.status 8s（`1460`，`1411`）+ subchatCatalog 5s（`1259`）+ hubCatalog 10s（`1321`）≈40 请求/分；snapshot 内部每 4s 已探测 servers（`lib/bridge.js:142`），胶囊再探测一次。
- **概览筛选**：「查看全部」跳 `filter=all`（`client.js:4712`），缺 strategy §5.5 的「需要你处理」pinned 筛选；无列表/看板切换、多选（brief 允许后置，但按钮未保留）。
- **设置页**（strategy §5.8）：只有按钮 + ⌘S（`client.js:2689-2696`），无 1s autosave、无离开未保存拦截；`viewState` 未持久化 scroll（brief §3.3 列了 scroll；`loadViewState` `client.js:1917-1950`）。
- **环境日志**：失败行「查看日志」只弹 error toast（`client.js:3574-3590`），无 strategy §5.9 的日志浮层；host bridge 无 `servers.logs`，属 host 依赖。
- **键盘**：缺 strategy §6.4 的 `g o / g t / g c`；面板根 `onKeyDown`（`client.js:3738-3860`）只有 n、/、j/k、Enter、x、e、d、⌘K/⌘N、Esc，brief §3.4 已满足。
- **头部工作区切换器无法点自身关闭菜单**：mousedown 先关、click 再开（`client.js:3863-3870` vs `3886` 无 `data-wh-menu-toggle`）。
- **死代码/冗余**：24 个双语未引用 locale key（`menu.title`、`strip.envValue`、`overview.attentionEmptySub`、`overview.runningEmptySub`、`tasks.emptyFilter`、`tasks.running`、`tasks.elapsed`、`tasks.activity`、`tasks.executor`、`tasks.deleted`、`tasks.activity2`、`sessions.relatedTasks`、`sessions.hint`、`env.title`、`env.noneHint`、`env.configuredHint`、`env.autoHint`、`env.notReadyHint`、`env.logs`、`env.errorLine`、`settings.globalRules`、`settings.projectRules`、`common.delete`、`common.failed`）；未用 CSS `.wh-btn.ghost`（`884`）；`view.settingsGroup` 只存不读（`1904/1945`）；`SettingsView` 的 `onBack` prop 未用（`2622`）；`useHubSnapshot(scope, legacyHooks)` 的 `legacyHooks` 参数未用（`2336`）。
- **视觉**：面板本体只用 24 个 DSH token、圆角 4/8/12/16、中文 1.7 行高、`.5px` 发丝线、`prefers-reduced-motion`；但保留的侧边栏旧样式仍有 6px/10px 圆角、10px 字号，且每个侧边栏组件实例重复注入 `<style>`（`client.js:1478` 等，属 pre-existing，sidebar 按 brief 保持行为不变）。
- **a11y 小项**：子会话行 `tabIndex=0` 但 Enter/点击无动作（`5237`；`focusedRowActivate` `3703` 只处理 task/session/attention/env）；dispatch sheet 无 `data-wh-autofocus`，初始焦点在 dialog 容器，Shift+Tab 可逃出 Tab trap（`2557-2586`、`2288-2300`）；env popover `role=dialog` 无初始焦点/关闭归位（`5296+`），busy 时按钮 disabled 无原因（`5338`）。
- **CAS 覆盖不全**：claim/release 的 `already-claimed`/`not-claimable` 也带 `details.task`，但 client 只把 `stale-revision` 当冲突（`client.js:2482`），其余走全量回滚 + 通用错误，没做行内就地更新。
- **快速双击状态控件**会发两个同一 revision 的写，第二个 409 弹冲突条（CAS 预期，但缺行级在途禁用）。
- **隐藏页每 4s 仍起床**（`client.js:2415`，不发请求）；`missingRef` 遇到一次 `bad-response` 就永久回退 legacy（`2405`）。

## 5. 未验证 / 风险

1. **真实 DSH 运行时无法本地复现**：槽位 props 形状（`useSessions`/`useWorkspaces` 选择器）、locale 缺键时是返回 key 还是 undefined（影响 P1-5 的可见性）、`layout.selectPanel` 后面板是否卸载（若宿主保留多个 panel，N 个 4s snapshot 叠加）、`shell.overlay` 与面板 `z-index:80` 的层叠、剪贴板/`window.open` 权限。已有 harness 截图（tools/harness/shots），但评审时 `docs/implementation/verify.md` 尚未出现。
2. **snapshot 成本**：每 4s 一次 `subchats.catalog({lastReply:true})`，每个子会话走 `childMeta → observeSession`（`lib/subchats.js:268-292`，meta TTL 3s < 4s 轮询），子会话多时会持续扫描事件；建议 host 降频或缓存。
3. **跨工作区 actor**：面板用 `props.workspaceId` 固定工作区，但保留 `autoScope.sessionId`（`client.js:2945-2951`）；当当前对话属于另一个工作区时，claim/note 的 actor 会记成那个会话。建议仅在 sessionId 属于目标工作区时传。
4. **无数据层/冲突/撤销自动化测试**：`test/client-ui.test.mjs` 只做一次 apply 挂载（`116-140`）与静态 regex（`150-184`），P1-2/P1-3/P1-8 都无法被测试拦截；建议补 useHubSnapshot/runOptimistic 的纯函数级测试。
5. 撤销恢复 revision=1 是 brief §2.3 允许的，但 dispatch 历史/assignee 丢失需 Lead 决定 host 契约是否补。
6. 长开面板的 `seen` 只增不减（load 截断 200，save 不截断）；多面板同时挂载、隐藏 tab 定时器需在真实宿主里观察。

## 6. 亮点

1. **外壳与槽位零回归**：`apply()` 与旧版逐字一致（评审 diff 验证），6 个槽位（每工作区 `main`、header 入口 + 服务器胶囊、3 个侧边栏子会话入口、overlay 菜单）全部保留；`test/client-ui.test.mjs:116-140` 现在严格断言六槽位 + 无 shortcuts 注入，侧边栏组件代码与旧版一致。
2. **数据层契约齐**：单 4s snapshot、hidden 暂停、8→16→30s 退避（`2432-2445`）、stale 保留旧数据、unknown-method/404 回退 legacy 三连（`2370-2404`）、按 task.id 合并；新增 per-row rollback（`2502-2512`）与 optimisticRef 合并门（`2432`）。
3. **写路径**：行级 pending、乐观 apply/rollback、409 `details.task` 行内冲突 UI、`tasks.restore` 6s 撤销、dispatch 备注已端到端（client `3364` → bridge `lib/bridge.js:171` → hub `299/331` → prompt）。
4. **键盘/无障碍**：面板根 keydown（容器级，无 document 全局热键）、`OverlayDialog` role=dialog + aria-modal + Tab trap + Esc + 焦点归位、真实 `button` + aria-label、单一 toast live region、状态形状+文字不只靠颜色。
5. **视觉/本地化**：24 个 DSH token、0 硬编码 hex、0 渐变/emoji、字号 ⊆ 宿主 6 档、CSS 每面板注入一次、`prefers-reduced-motion` 覆盖；zh/en 各 340 键 parity、en 无中文泄漏、`window.confirm` 归零。

---

## 附录 · 评审后修复（Lead，2026-10-22）

按 P0 + 可前端修复的 P1 处理，随后 `node test/core.test.mjs` / `test/snapshot.test.mjs` / `test/client-ui.test.mjs` 全过，harness 15 场景 0 console 错误。

| 评审项 | 处理 |
|---|---|
| **P0-1 新建子会话挂到当前会话** | 根菜单与会话行菜单两处 `setSubchatCreate` 改为传被点击的 `session.sessionId` |
| P1-1 菜单重复渲染 | 删除根 `renderMenu` 中 task/session 分支，只保留 workspace 菜单；行内菜单为唯一实现 |
| P1-2 409 retry 用旧 revision | `useHubSnapshot` 暴露 `getData()`，`latestTask` 读实时 state；重试闭包再次执行时取最新 revision |
| P1-3 删除冲突静默 | 冲突时按行 rollback 把行放回，并 toast + `snap.refresh()`；`runOptimistic` 冲突分支对“行已不存在”执行 rollback |
| P1-4 只有 running 子会话能发消息 | 除 closed/failed 外都渲染 composer（Host 支持 cold resume） |
| P1-5 子会话状态缺 key | 补 `provisioning/active/failed/open` 中英双语 |
| P1-7 撤销丢归属/派发历史 | client 传 `assignee/dispatch/dispatches`；Host `restoreTask` 恢复这些字段（core 测试覆盖） |
| P1-9 「显示已关闭」假控件 | 子会话列表按 `showClosed` 过滤 closed 行 |

仍遗留（不阻塞 reload，已记录在 `01-report.md` §5）：未读语义依赖 `updatedAt`（Host 无 lastReplyAt）；写后刷新在极窄窗口可能被在途轮询吞一次；批量/看板/日志浮层按计划后置。
