# 全局工作区中枢渲染验证（harness）

> 结论：最终冻结版 `client.js`（6558 行，sha256 `8502b9b3…d9ca6a`）已用真实 React 18 + 假 Host 在 headless Chrome
> 中渲染。**31/31 场景成功，0 崩溃、0 React 警告、0 console error，clientStable=true**。全局 `main` 面板 key
> `workspace-hub` 捕获成功，`sidebar.panellist` 已注册并实际挂载；`hub.overview` 首页、`hub.snapshot` 下钻、跨工作区
> 切换、导航回退、空/错/stale/board-error 均验证。无 P0/P1 阻塞项。

## 1. 运行方式

```bash
node tools/harness/build.mjs   # 一次：React18 + puppeteer-core 装到 /tmp（不写仓库）
node tools/harness/shoot.mjs   # 临时静态服务 + 31 个场景 → tools/harness/shots/ + report.json
node tools/harness/shoot.mjs --filter 01-all-dark   # 单场景
node tools/harness/serve.mjs --port 4180            # 调试：/?theme=dark&view=all&data=full
```

- 每次请求从仓库根读取 `client.js`；`shoot.mjs` 记录起始/结束 sha，`clientStable=true` 方可作为交付依据。
- `report.json` 含 panelKey/panelMode/panellist/selection/viewState/hostLog、每场景 API 序列与 actions、运行时错误、
  面板 rect/scrollWidth。截图 1440×900，面板可用区 1192×900（假侧栏 248px）。

## 2. 本轮 harness 更新（`tools/harness/`）

1. **mock `hub.overview`**：4 个工作区（dsh-plugins 12 任务/4 会话/3 服务器、dsh、snippets、website），每区
   board+sessions{total,running,rows}+servers{…,counts}+updatedAt，另有 totals；镜像 `02-global-hub-brief.md §2`。
2. **`hub.snapshot` 按 workspaceId/workspacePath 返回对应工作区**用于下钻；`hub.catalog` 保留全部工作区；
   `context/tasks.list/hub.sessions/servers.status/hub.workspace/tasks.*/servers.start|stop` 均可用。
3. **empty / error / stale / boarderror 四种覆盖**：overview 与 snapshot 分别可空/失败/stale；`boarderror` 让
   snippets 的 overview 条目带 `boardError:true` 以验证「任务板无法读取」标记。
4. **两代面板捕获**：优先 `main`+key 恰为 `workspace-hub`（global），1.5s 宽限后回退旧 `workspace-hub:<id>`；
   `sidebar.panellist` 被收集并挂到假侧栏 `#nav-slot` 实际渲染（失败只记 `panellist.render`）。
5. **选择与下钻**：`select=<id|all>` 预写 `localStorage['workspace-hub:selection:v1']`；点击工作区卡片/切换器菜单/
   返回按钮作为兜底；`view=all|workspace|overview|tasks|sessions|sessions-expanded|settings|servers|palette|palette-all|
   dispatch|all-cards|drill-return|esc-return|ga-return|workspace-menu|workspace-switch|settings-esc|home-running-open`。
6. 假 Host：`t` 用插件自注册词典；`useSessions/useWorkspaces` 覆盖全部 4 个工作区；`ctx.uiWorkspace.openSession` /
   `ctx.layout.selectPanel` 记录到 hostLog；引导层 localStorage 置为 dismissed。

## 3. 截图（`tools/harness/shots/`）

| 组 | 文件 |
|---|---|
| All 首页 暗/亮/无侧栏/1280/滚到工作区卡片/board-error | `01-all-dark` `02-all-light` `03-all-bare` `16-all-1280` `01b-all-cards-dark` `02b-all-cards-light` `27-board-error-dark` |
| 工作区 Console（暗/亮/概览） | `04-workspace-dark` `04b-workspace-light` `05-overview-dark` |
| 任务/对话/设置（暗+亮） | `06-tasks-dark` `11-tasks-light` `07-sessions-dark` `07b-sessions-expanded-dark` `08-settings-dark` `12-settings-light` |
| 命令面板（工作区/All）· 派发 | `09-palette-dark` `09b-palette-all-dark` `10-dispatch-dark` |
| 空/错/stale/board-error（All+工作区） | `13-empty-dark` `14-error-dark` `15-stale-dark` `20-workspace-empty-dark` `21-workspace-error-dark` `27-board-error-dark` |
| 导航闭环 | `17-drill-return-dark` `18-esc-return-dark` `23-ga-return-dark` `19-workspace-menu-dark` `24-workspace-switch-dark` `25-settings-esc-dark` `26-home-running-open-dark` |

已逐张人工查看暗/亮主要状态；`01b/02b` 为带描边/底色的 2 列工作区卡片；`24` 切换 dsh 后无残留 dsh-plugins 数据。

## 4. 控制台与布局

- 31 场景面板运行时错误 0、React 警告 0、`console.error` 0（favicon 404 已消除）。
- 面板 1192×900；`scrollWidth == clientWidth`（1440/1440）无横向溢出；1280 视口下面板 1032×800 正常。
- 900px 高时首页「工作区」卡片区在首屏折叠线下方（需滚动），符合滚动预期；卡片 2 列各 476px。

## 5. 已验证的全局化行为

- 槽位：`main(key=workspace-hub，31 场景中各恰好 1 个)`、`sidebar.panellist(id=workspace-hub,order=20,label)`、
  `conversation.header.leading`、3 个 sidebar 子会话槽、`shell.overlay`；无 `workspace-hub:<id>` 循环注册。
- **轮询分离**：All 首页仅 `hub.catalog+hub.overview`；下钻仅 `+hub.snapshot`；返回 All 再 `hub.overview`
  （17 场景 API=overview→snapshot→overview），无双 4s 定时器叠加。
- **导航**：卡片进入→「← 所有工作区」返回；`Esc`、`g a` 返回 All（18/23 场景 inWorkspace=false）；切换器菜单含
  「所有工作区」+4 工作区、当前项标记；切到 dsh 后标题/路径/计数/任务全部刷新（`key={selection}` 重挂载生效，24 场景
  API 仅 snapshot）；设置页 `Esc` 关闭设置并留在工作区（25 场景 inWorkspace=true）。
- **All 首页行为**：注意力行动作 `打开任务/确认完成/我来做`，服务器行改为「查看」（无 log 浮层）；「正在运行」行
  「打开」会切入该工作区并 `openSession` 执行者会话（26 场景 hostLog=`openSession s2`）；boardError 卡片显示
  「任务板无法读取」（27 场景文本命中）。
- **状态**：All/工作区 空态与错误态、stale（保留旧数据+顶条+重试）均成立；派发 sheet、工作区/All 命令面板正常。

## 6. 发现的问题（最终冻结版 file:line）

1. **P3 亮色残留对比度 3.71:1**：`.wh-badge`（`client.js:925`，工作区徽标/技能来源/会话「当前」/环境阶段）11px
   `#81858c` 在 `#ffffff` 上 3.71:1；同组 `.wh-chip .wh-num`（`940`）、`.wh-tl .wh-num`（`996`）、`.wh-rule-bytes`
   （`1066`，字节数/「未创建」）。亮色 override（`791-820`）已覆盖主元数据与卡片/页头等（复测 ≥4.5:1），上述
   4 处未纳入。截图 `02-all-light` `02b-all-cards-light` `12-settings-light`。
2. **P3 All 首页命令面板保留无操作「所有工作区」**：`client.js:3262`（`action:all`, `run: () => {}`）；已在 All 时
   仍可执行但无效果，建议隐藏或标「当前」。截图 `09b-palette-all-dark`。
3. **P3 设置页返回按钮文案**：`settings.back`=`工作区中枢`（`client.js:663`），按钮 `4776` 实际 `closeSettings`
   返回该工作区 Console 而非 All；全局化后「中枢」语义偏 All，建议改为「返回工作区」。截图 `08-settings-dark`。

## 7. 上轮发现 → 最终版复测

- CSS reset 特异度：`client.js:784` 已改为 `.wh-root :where(button)`；`.wh-card/.wh-btn/.wh-mini/.wh-key-btn/.wh-sync`
  的 border/background/padding 恢复（probe 实测卡片 `1px solid`+layer 底+12/14 padding）。
- 亮色主元数据 override（791-820）复测无 <4.5；`g a`/`Esc` 返回 All（`client.js:4672-4684`）验证通过。
- 本轮 delta 复测：跨工作区 `key={selection}`（`3762`）无旧数据残留；设置 Esc 脏稿守卫（`closeSettings(force)` 4072、
  失败时 toast+放弃修改）；环境请求单次消费（`3812-3820`，代码级）；服务器注意力标签 `查看`（`3551`）；boardError
  标记（`3638`）。
- 过程说明：12:55–13:00 期间仓库出现过两次 freeze 后的半保存（我曾捕获 `client.js:4408` 语法错误），均已由 Lead
  修复；本报告只基于最终 sha `8502b9b3…` 的一次连续稳定 shoot（起止 sha 相同）。

## 8. 局限

- 仍为 mock Host（overview/snapshot/文件读写/服务器进程均在内存），验证渲染、状态机与交互，不验证真实 Host 的
  健康探测耗时、并行 server 汇总性能与真实数据规模。
- 未登录真实 DSH GUI；真实 slot 宿主包裹层（tab 栏/滚动容器/sidebar 尺寸）用假侧栏近似；未覆盖 hover-only 视觉、
  拖拽/批量选择、`prefers-reduced-motion`、真实 <900px 窄屏与 IME；子会话提交的 parent 校验未在 UI 侧触发（代码级）。
- `file:line` 对应冻结版 sha256 `8502b9b3dc0bc0d8f11ff44c4f23134f03e7e4083ba96d1c274e986288d9ca6a`。
