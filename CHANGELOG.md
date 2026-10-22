# Changelog

## 0.2.0 — 2026-10-22

Workspace Hub 从「每个工作区一个看板面板」升级为**顶层全局场所**，并重写整套 Console UI。

### 新增

- **全局中枢**：侧边栏常驻「工作区中枢」（`sidebar.panellist`）；全局唯一面板（`main` key `workspace-hub`）；标题栏「中枢」按钮保留为快捷方式。
- **所有工作区首页**：全局状态条、跨区「需要你处理 / 正在运行」、工作区卡片（任务/会话/环境/更新时间），点击 drill-in。
- **工作区 Console**：概览 / 任务 / 对话 / 设置；面包屑返回 All；工作区切换器。
- **任务**：快速捕获、状态筛选与分组、搜索、行内编辑标题/详情/优先级、备注、运行条、派发 sheet（可附补充说明）、删除 6 秒撤销、行级乐观更新与 409 就地冲突。
- **对话**：会话树 + 子会话行内发消息/中断/关闭/重开、显示已关闭、未读徽标。
- **命令面板 `⌘K`** 与面板内键盘：`n` `/` `j/k` `↵` `x` `e` `d` `g o/t/c/a` `Esc`。
- **Host API**：`hub.overview`（跨区聚合）、`hub.snapshot`（单工作区快照）、`tasks.restore`（撤销删除并保留归属/派发历史）、`subchats.catalog` 支持 `includeClosed`/`lastReply`、派发 `note`、`ServerRunner.summary`（无健康探测）。
- **环境**：开发服务器不再是独立标签页，改为状态条 + 概览环境区 + 环境 popover；启动是行级 pending，不阻塞其它操作。
- **工程**：README/GUIDE 同步新交互；`tools/harness` 用真实 `client.js` + mock Host 做 31 场景渲染验证；测试新增 `test/snapshot.test.mjs`、`test/overview.test.mjs`。

### 变更 / 升级注意

- 中枢入口从「标题栏按钮」变为「侧边栏常驻 + 标题栏快捷方式」；每个工作区不再有独立中枢面板。
- 需要重启 DeepSeek Harness（Host 新增 `hub.overview`/`hub.snapshot`/`tasks.restore`），仅刷新页面只能看到 Client 新 UI（走 legacy 数据回退）。
- 任务板/子会话/服务器仍是**按工作区**隔离存储，本次不引入全局单板。

### 已知限制

- 跨区子会话未读未纳入 All 首页（需要 Host `lastReplyAt` 与全局 seen 状态）。
- 行内编辑 409 的「重试我的修改」在极少数情况下仍可能带旧 revision；未读判定仍基于 `updatedAt`。
- 亮色主题个别 11px 徽标文本仍使用 `label-tertiary`（约 3.71:1），待宿主 token 调整或后续补丁。

### 验证

- `npm test`：core / snapshot / overview / client-ui 全绿。
- 真实渲染：31/31 场景、0 console 错误（`clientStable=true`）。
- 独立复审：0 P0，6 个 P1 全部修复或经决策关闭。
