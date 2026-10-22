# 复审 · 全局中枢（Workspace Hub 顶层化）

- 基线：`client.js` **6531 行**，sha256 `0f97160fc62c6950ff4f189422d6e5106d29588c6f725389af5348b01febc5b1`（mtime 13:00，Lead 确认最终版；上一版 7a0d6b6f/6503 行）。Host：`lib/hub.js:367-425`、`lib/bridge.js:135-178`。本文件 §2-§7 行号固定于 0f97160f；§8 为追加复核（`8502b9b3…`，6558 行）。
- 对照：`docs/implementation/02-global-hub-brief.md`、`docs/redesign/05-global-hub.md`（已更新：02:56/75、05:42/47/48）、上一版 `review-global.md`。
- 实测：`core` / `snapshot` / `overview` / `client-ui` 四套测试全过（client-ui 4/4）。静态：confirm/gradient/hex/emoji 均 0，字号 ⊆ {10,11,12,13,14,15,20}；locale zh/en 各 368 键 parity、en 无中文。评审未修改任何代码。

## 1. 裁决

**ship** —— **P0 = 0；本轮 6 个 P1 全部修复或经决策关闭，无新增 P1。** 剩余为 P2 文档/体验项与 2 个与本重构无关的既有 P1（§5），不阻塞本次交付。

## 2. 原 P1 状态表（逐条复核 @0f97160f）

| 编号 | 状态 | 验证证据 |
|---|---|---|
| P1-1 切换工作区沿用旧数据 | **已修** | `WorkspaceConsole` 加 `key={selection}`（`client.js:3753`），切换即重建组件与 snapshot 状态，先骨架/新数据，失败也不会残留旧板。备注：`useHubSnapshot` 自身仍不按 key 重置（`2419-2450`、`2515`），若将来复用 Console 且不带 key，需在 hook 内补 reset。 |
| P1-2 跨区新建子会话写错 workspace | **已修（主路径）** | key 重建使表单/草稿随工作区切换销毁（旧状态 `3789`、入口 `5915`、提交 `4401` 不再跨区存活）。防御性建议（P2）：submit 前仍校验 `subchatCreate.sessionId === scope.sessionId`。 |
| P1-3 env 请求重放 | **已修** | 模块级 `envConsumedSeq`（`1522`）+ 条件 `envRequest.seq > envConsumedSeq`（`3804-3810`）；重进同一工作区不再自动弹环境浮层。单面板场景下足够。 |
| P1-4 All 注意力文案与行为不一致 | **已修** | 按钮统一为「打开任务」，环境项为「查看日志」（`3540-3544`），与点击只 drill-in 的行为一致。环境项本身无日志浮层（host 无 `servers.logs`，console 侧仅 error toast `4421-4426`）→ 见 §3 P2。 |
| P1-5 All 缺子会话未读 | **经决策关闭** | hint（`41/411`）+ `02:75` + `05:48` 明确「子会话未读只在工作区视图；跨区未读需 host lastReplyAt，后续」。残留：同一时刻两视图「需要你处理」内容仍不同（产品已接受）。 |
| P1-6 侧边栏入口落点 | **经决策关闭** | 决策=保留上次位置：`02:56`、`05:42` 写明「首次 All，之后保留上次位置；标题栏定位当前；g a/面包屑回 All」，实现与之一致。残留文档冲突见 §3。 |

## 3. 残留 P2 / 偏差（均不影响 ship）

1. **文档与新行为仍不一致两处**：`05:52` 验收句仍写「侧边栏常驻中枢，点击进入 All」，与 `05:42` 新决策矛盾；`05:27` 写「All 视图筛选/滚动全局持久化」，实际 All 视图未接 `useViewState`（仅 console `3764`），筛选/滚动未持久化。
2. **设置 Esc 仍会丢草稿**：Esc 现在退出设置而非回 All（`4613-4624`），但 SettingsView 草稿是组件本地 state（`2714-2727`），`closeSettings` 卸载后即丢（`4062-4065`，无离开拦截）；`05:47` 承诺「不会丢草稿」与实现不符。需加 dirty 拦截或改文档措辞。另：settingsOpen 时所有非 Esc 键被吞（`4613-4624`），设置页内 ⌘K/⌘N 不可用（小回归）。
3. **board 读失败只标卡片，totals 仍按 0 计**：卡片已有「任务板无法读取」（`3629`；host `boardError` `lib/hub.js:386,392,411`），但 bridge totals 仍 `counts ?? {}` 累加（`lib/bridge.js:154-168`），顶部状态条会少算；建议把 boardError 工作区从 totals 中显式标为未知。
4. **All 环境项「查看日志」名不副实**：点击只 drill-in 到工作区概览，没有日志浮层；host 尚无 `servers.logs`，属已知后续。
5. **All 空态无 CTA**（`3464-3471`）：只有标题+说明，无 05 §3.5 的「打开一个工作区」引导按钮。
6. **旧 Host 无 `hub.overview` 时无降级**：All 只显示错误三问+重试（`3473-3482`），`hub.catalog` 仅用于 palette；建议降级为工作区列表。
7. **死代码/冗余**：`inputRef` 未使用（`3210`）；中英各 25 个未引用 locale key（`overview.user`、`menu.title`、`strip.envValue`、`env.logs` 等）；`HubNavIcon` 忽略 active（`3093`）。
8. **测试深度**：client-ui 仍以静态断言为主（`test/client-ui.test.mjs:154-173`）且未覆盖 key/selection 行为；`test/overview.test.mjs:98-127` 未覆盖 `boardError`/部分失败；host overview 的 board 读取仍逐工作区串行（`lib/hub.js:383-425`），4s 全量 board payload 的规模风险未测。

## 4. 本轮修复验证要点（正向）

- **隔离**：`key={selection}`（`3753`）同时解决 P1-1/P1-2 与本地状态串区；旧实例 cleanup 清 timer，`alive` 保护在途请求。
- **env**：消费序号（`1522/3804-3810`）语义正确，不吞新请求、不重放旧请求。
- **All 语义**：运行项「打开」打开执行会话（`3592-3597`），执行者缺 title 用 `tasks.owner.assigned` 而非 session id（`3578`）；卡片标 boardError；server summaries 并行（`lib/bridge.js:137-144`）。
- **导航**：header 按钮定位当前工作区、胶囊选择工作区+env（`1531-1536`）、面包屑/`g a` 回 All（`4640-4670`），settings Esc 只退设置不跳 All（`4613-4618`）。
- **注册面**：main（`key: PANEL_ID`）+ `sidebar.panellist`（id/order/label）单次注册（`6482-6508`），3 个子会话槽 + overlay 保留（`6512-6526`），client-ui 断言 7 槽位/唯一 main key/无 syncPanels（`test/client-ui.test.mjs:105-132,164-170`）。

## 5. 遗留 P1（非本次重构、仍未修，供排期）

1. **行内编辑 409「重试我的修改」仍用旧 revision**：请求闭包捕获 `current.revision`（`4222-4227`），`retryConflict` 原样重放（`2613-2619`、按钮 `5211`）→ 再冲突。
2. **未读语义不成立**：`subchatUnread` 依赖 `updatedAt`（`2175-2185`），host 只在 send/close/reopen 更新 row.updatedAt（`lib/subchats.js:330/365/384`），assistant 回复不更新 → 新回复不产生未读、自己发送后旧回复被标未读。
3. （窄竞态）写后 `refresh(false)` 在 tick busy 时被丢（`2497`、`2515`、`2561`），旧轮询可能覆盖乐观值到下一次 4s。

## 6. 未验证 / 风险

- 真实 DSH 运行时：`sidebar.panellist` 的 label()/active/order 调用方式、`layout.selectPanel` 后 main 面板状态、key 重建与 `pendingTaskReveal`/env 请求的时序（代码层已推演，harness 28 场景 0 console error，但 `verify-global.md` 在评审时仍未出现）。
- overview 规模：每 4s 全量 board + 会话行，工作区/任务多时 payload 与 tick 时长风险。
- selection 指向已删除工作区 → console 错误态，无自动回落 All。
- 文档/测试是当前主要残差：行为已对齐，材料（05 验收句、05:27、05:47）未完全对齐。

## 7. 亮点

1. **全局注册面干净**：单 main（key=PANEL_ID）+ sidebar.panellist，per-workspace 循环彻底移除，测试断言 7 槽位、唯一 main key、无 `syncPanels`/per-workspace key。
2. **选择 store 贯穿所有入口**：header/胶囊/卡片/注意力/面包屑/菜单/palette 均写 `hubSelection`（`3040-3082`、`6490-6493`、`1531-1536`、`3226-3232`、`3620`、`4960`、`4640-4670`），并持久化 v1 key；All 无 ⚙、设置只在工作区层。
3. **隔离与作用域**：key 重建 + `sessionId` 仅在同工作区传入（`3740-3753`）双重保证，跨区写/actor 风险关闭；All 只读（仅 selection+reveal）。
4. **一视图一轮询**：All 只跑 `hub.overview` 4s（`3101-3173`），Console 只跑 `hub.snapshot` 4s（`2419+`），均 hidden 暂停/8→16→30s 退避/stale 保留旧数据；All 骨架/错误重试/空态/卡片齐备。
5. **收尾质量**：`:where()` reset 修复标题区/卡片按钮样式被 `.wh-root button` 覆盖（`780`），亮色主题元数据对比度统一（`799-813`），All 卡片 2→1 列响应式（`837-848`）；测试全绿、静态约束干净、All 暗/亮截图齐全。

## 8. 追加复核 @8502b9b3（6558 行，mtime 13:06）

- 基线切换：`client.js` 6558 行，sha256 `8502b9b3dc0bc0d8f11ff44c4f23134f03e7e4083ba96d1c274e986288d9ca6a`；四套测试全过。静态/locale 复检：confirm/gradient/hex/emoji 0，字号合法，zh/en 各 370 键 parity、en 无中文。§2-§7 行号仍对应 0f97160f，本节按新 sha。

| 上轮 P2 | 状态 | 证据 / 残留 |
|---|---|---|
| 设置 Esc 丢草稿 | **已修（拦截）** | SettingsView 上报 dirty（`2719`、`2736-2740`）；`closeSettings` 在 dirty 时弹「放弃修改」toast 且不关闭（`4072-4085`）；settings 块 Esc→`closeSettings`（`4640-4652`）。残留：无草稿暂存；toast 6s 内不点会停留在设置页（可再按 Esc）；设置页非 Esc 键仍被吞（⌘K 不可用，未变）。 |
| 跨区子会话表单 | **已修主路径 + 新 P2** | submit 增加 parent 校验（`4419-4423`）。但守卫用 `!== scope.sessionId`，把「会话行 ⋯ → 为该行会话新建子会话」一律判错（行入口传 `session.sessionId`：`6102`；只有工具栏 `5942` 的 `scope.sessionId` 能过）；且 `sessions.parentMismatch` 未在两份 DICT 定义（locale 审计 used-missing=1）→ toast 显示原始 key。建议改为校验该 session 属于当前工作区 snapshot 的 sessions（而非等值），并补双语 key；或在非当前行隐藏入口。 |
| 服务器注意力「查看日志」名不副实 | **已修** | 改为 `attn.view`（`3551`），与 drill-in 语义一致。 |
| 05/brief 文档修正 | **已修** | `05:27`（All 无筛选、不单独持久化）、`05:47`（Esc + 放弃修改）、`05:52`（恢复上次位置）、`02:91`；与新实现一致。 |

- 未变的 P2（不阻塞）：totals 对 boardError 仍按 0 计（`lib/bridge.js:154-168`）；All 空态无 CTA（`3464-3471`）；旧 Host 无 `hub.overview` 降级；25 个死 locale key + 未用 `inputRef`（`3210`）；测试未覆盖 boardError/key 行为。
- 遗留 P1（非本次重构、未修）：行内编辑冲突重试旧 revision（`4222-4227`、`2613-2619`）；未读基于 `updatedAt`（`2175-2185`）；写后 refresh 窄竞态（`2497/2515/2561`）。
- **裁决：维持 ship。P0 = 0；本轮新增无 P1（`parentMismatch` 回归按 P2 计，仅影响非当前会话的行级入口），主路径无回归。**
