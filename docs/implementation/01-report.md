# Workspace Hub Console · 实现报告（P0/P1）

> 日期：2026-10-22 · 已批准重构的落地记录  
> 设计依据：`docs/redesign/03-strategy.md`、`docs/redesign/prototype/index.html`  
> 实现契约：`docs/implementation/00-brief.md` · 评审：`docs/implementation/review.md` · 渲染验证：`docs/implementation/verify.md`

## 1. 结果

`client.js` 从 2232 行的「四 tab CRUD 面板」重写为 **5685 行的 Workspace Hub Console**（单文件、无构建、无新依赖；最终 sha256 前缀 `f5ad2eced5eb2364`），Host 增加聚合快照与 3 个能力。旧入口（标题栏「中枢」+ 服务器胶囊、侧边栏子会话三入口、子会话浮层菜单）全部保留，6 个槽位零回归。

| 能力 | 状态 |
|---|---|
| 概览（注意力队列 + 正在运行 + 环境） | ✅ |
| 任务（快速捕获 / 筛选 / 状态分组 / 行内展开编辑 / 备注 / 运行条 / 派发 sheet） | ✅ |
| 对话（会话树 / 子会话行内发送 / 中断 / 关闭 / 重开 / 显示已关闭 / 未读） | ✅ |
| 设置（规则链 / 上下文 / 技能，独立保存 + dirty + ⌘S） | ✅ |
| 命令面板 ⌘K、面板内键盘、焦点陷阱、撤销 toast | ✅ |
| Host `hub.snapshot`、`subchats.catalog({includeClosed,lastReply})`、`tasks.restore`、dispatch note | ✅ |
| 乐观更新（行级 pending / 回滚 / 409 行内冲突） | ✅ |
| 视图状态持久化（按工作区） | ✅ |
| 批量选择、看板视图、服务器日志浮层 | ⏳ 本期按计划后置 |

## 2. Host 变更（`lib/`）

- **`hub.snapshot`**（`lib/bridge.js`）：一次返回 `workspace + board + sessions(含 closed 子会话/lastAssistantMessage) + servers + generatedAt`；服务器失败降级为空环境而不是整体失败。旧路由全部保留，客户端可回退。
- **`subchats.catalog`**（`lib/subchats.js`）：支持 `includeClosed` 与 `lastReply`，补 `parentSessionId/createdAt/updatedAt/lastAssistantMessage`；侧边栏默认行为不变。
- **`groupWorkspaceSessions`**（`lib/hub.js`）：子会话行透传 `lastAssistantMessage` 等字段。
- **`tasks.restore`**（`lib/tasks.js` + bridge）：按原 id 恢复删除任务，保留 `assignee/dispatch/dispatches/notes/createdAt`，用于 6s 撤销；重复 id → `task-exists`。
- **派发 note**：`tasks.dispatch` 接受 `note`，写入任务备注并拼进执行提示词。
- **测试**：`node test/core.test.mjs`、`node test/snapshot.test.mjs` 覆盖 restore/assignee/catalog/快照聚合/认证拒绝。

### 评审修复（P0/P1）

- P0-1 新建子会话挂错父会话 → 两处菜单改传被点击的 session。
- P1-1 菜单重复渲染 → 删除根级 task/session 菜单，只留行内实现。
- P1-2 409 retry 旧 revision → `getData()` + 实时 `latestTask`。
- P1-3 删除冲突静默 → 冲突按行回滚 + toast + refresh。
- P1-4 只有 running 子会话可发消息 → idle/active 也可发（closed/failed 除外）。
- P1-5 子会话状态 locale 缺 key → 补 provisioning/active/failed/open。
- P1-7 撤销丢归属/派发历史 → client 传 assignee/dispatch/dispatches，Host restore 恢复。
- P1-9 「显示已关闭」假控件 → 子会话列表按开关过滤。

## 3. 客户端变更（`client.js`）

- 数据层：`useHubSnapshot`（单请求 → 合并 → 4s 轮询 → 隐藏暂停 → 4/8/16s 退避 → stale 标记 → legacy 三连回退）；`optimisticRef` 防止在途写被轮询覆盖。
- 写层：行级 pending、乐观更新、按行回滚、`stale-revision` 就地冲突、删除撤销走 `tasks.restore`；不再有整页 busy / `window.confirm`。
- 外壳：Header（工作区切换器 / 复制路径 / 同步状态 / ⌘K / 设置）、StatusStrip、Nav（概览/任务/对话）、Settings 子视图；服务器不再是 tab。
- 交互：快速捕获、行内编辑（标题/详情/优先级/备注）、派发 sheet、子会话行内消息、命令面板、`⌘K / n / / / j / k / ↵ / x / e / d / Esc`、视图状态 localStorage。
- 视觉：仅 DSH token（20 个 alias）、6 档字号、8/12/16/4 圆角、发丝线、无硬编码 hex/emoji/渐变；亮色对 11–12px 元数据做了 language-level 对比度覆盖。
- 测试：`test/client-ui.test.mjs` 4 条（槽位集合、无 shortcuts、契约 grep、静态设计约束）。

## 4. 验证

- `npm test` = core + snapshot + client-ui 全过。
- **真实渲染**：`tools/harness/` 用真实 React 18 + 真实 `client.js` + mock `hub.snapshot` 在 headless Chrome 渲染 15 个场景，**0 运行时/console 错误**，暗/亮、空/错误/stale、设置、⌘K、派发、子会话展开均验证；截图 `tools/harness/shots/*.png`。
- 独立代码评审见 `review.md`：P0-1（新建子会话挂错父会话）与 P1-1/3/4/5/9 已修复；P1-2（retry 用最新 revision）通过 `getData()` 修复。

## 5. 已知未做 / 风险

1. **未在真实 DSH 页面人工验收**：host 需重启后加载新代码；harness 只能模拟 token/服务。
2. **未读语义**仍基于 `updatedAt`（Host 没有 `lastReplyAt`）；发消息会把旧回复标成未读，建议后续 Host 增字段。
3. **写后刷新竞态**：极窄窗口内写后 `refresh` 可能被在途轮询吞掉一次；下一次 4s 轮询会纠正。
4. 批量选择、看板视图、服务器日志浮层、设置文件 CAS 按计划后置。
5. 失败路径（断网/409/服务器启动失败）只有静态/契约级验证，无真实后端注入。

## 6. 如何加载

插件通过 `link:` 安装在 desktop profile，代码改动**不会热加载 Host**：

1. 完全退出并重新打开 DeepSeek Harness（或重启 `dsh web` 进程），让 `lib/*` 生效；
2. 刷新页面（Client bundle 会重新读取 `client.js`）；
3. 打开任意工作区，点标题栏「中枢」，检查概览/任务/对话/设置；
4. 快速回归：`⌘K`、新建任务、派发、子会话发送、设置保存。

若只想先看新 UI：仅刷新页面即可（Host 未升级时面板自动走 legacy 回退，功能仍可用，只是没有快照聚合）。

---

## 7. 后续：全局中枢（顶层场所）

按反馈「工作区中枢应该从工作区单独出去」实施，设计记录见 `docs/redesign/05-global-hub.md`，契约 `02-global-hub-brief.md`。

### 7.1 结果

- **一个全局面板**：`main` key `workspace-hub`（删除每工作区一个面板的 syncPanels 循环）；侧边栏新增 `sidebar.panellist` 常驻入口（id workspace-hub / order 20）。
- **所有工作区首页**：全局状态条 + 跨区「需要你处理 / 正在运行」+ 工作区卡片（任务计数/会话/环境/更新时间）；点击 drill-in。
- **工作区视图**：面包屑「← 所有工作区」+ 工作区切换器（首项 All）；现有 Console/设置只在此层出现。
- **选择状态**：模块级 `hubSelection`（`all` | workspaceId，`localStorage['workspace-hub:selection:v1']`）；标题栏「中枢」按钮 = 打开中枢并定位当前工作区；服务器胶囊 = 定位工作区 + 环境 popover；命令面板可切 All/工作区；`g a`/Esc 返回 All。
- **Host**：新增 `hub.overview`（一次返回全部工作区的 board、会话行/计数、服务器 cheap summary、totals；无健康探测）；`ServerRunner.summary()` 带 8s 配置缓存；单工作区仍用 `hub.snapshot`（含真实探测）。
- **任务写入归属**：仅当当前会话属于选中工作区时才传 `sessionId`，避免跨区误归属。
- **视图状态**：`workspace-hub:view:v2:<all|workspaceId>`。

### 7.2 验证

- `npm test`：core + snapshot + **overview** + client-ui 全过；新增 `test/overview.test.mjs` 覆盖聚合、totals、子会话排除、快照并存。
- client-ui 断言：槽位集合 = {main(key workspace-hub), sidebar.panellist, header, 3 个 sidebar 子会话槽, shell.overlay}；无 per-workspace key 循环。
- harness：**23 个场景、0 console 错误**（All 暗/亮/卡片、drill-in、返回、`g a`、palette All、empty/error/stale 等）。
- 评审修复：` :where()` 按钮 reset（工作区卡片被 reset 抢走 border/background）、亮色 All 视图元数据对比度、`g a`/Esc 返回 All。

**最终 `client.js`：6558 行，sha256 `8502b9b3…9ca6a`。** 全局评审见 `review-global.md`，渲染验证见 `verify-global.md`。

### 7.3 全局评审修复

- 切换工作区时用 `key={selection}` 重挂 Console，清空旧板/本地草稿，避免跨区显示上一个工作区数据、以及跨区新建子会话写错父会话。
- 服务器胶囊的环境请求只消费一次，重进工作区不再自动弹 popover。
- All 注意力主操作改为「打开任务 / 查看日志」；All「正在运行」优先打开执行会话，不再暴露 session id。
- 设置页 Esc 先关闭设置（不丢草稿），设置打开时屏蔽 `g` 导航快捷键。
- 工作区板读取失败在卡片标注「任务板无法读取」；服务器 summary 并行获取。
- 决策：侧边栏入口恢复上次位置（含 drill-in），标题栏按钮定位当前工作区，`g a`/面包屑回 All；文档已同步。
- 最终验证：`npm test` 全过；harness **30 场景 0 console 错误**（`clientStable=true`）。
- 收尾：设置 Esc 的未保存草稿拦截、跨区子会话父校验、All 环境项文案、文档口径（侧边栏恢复上次位置 / All 无筛选持久化）已对齐。
