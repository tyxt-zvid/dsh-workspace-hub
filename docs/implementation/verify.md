# Workspace Hub 面板渲染验证（harness）

> 结论：已用真实 React 18 + 真实 `client.js` 在无 GUI 登录的前提下渲染出新控制台。冻结版 `client.js`
> （5678 行，sha1 `6758819…`，10:56）在 1440×900、暗/亮主题下 **15/15 场景渲染成功，面板自身 console 0 错误**。
> 本文所有截图来自 `tools/harness/shoot.mjs` 对冻结文件的实际运行，非原型。

## 1. 如何运行

```bash
node tools/harness/build.mjs     # 仅一次：React18/puppeteer-core 装进 /tmp/wh-harness-deps（不写仓库）
node tools/harness/shoot.mjs     # 起临时静态服务，截 15 个状态到 tools/harness/shots/
node tools/harness/shoot.mjs --filter 01-default   # 单场景
node tools/harness/serve.mjs --port 4180           # 交互调试：/?theme=dark&view=overview&data=full
```

- 服务端每次请求都从仓库根读取 `client.js`（`serve.mjs`），重跑即拾取最新代码；不改仓库依赖、不加构建步骤。
- Chrome 自动探测：`CHROME_PATH` → Playwright `chromium-1228/1223` → `/Applications/Google Chrome.app`。
- 清单/控制台错误/布局尺寸见 `tools/harness/shots/report.json`；宿主 token 从已安装 DSH app.asar 抽取到 `theme.css`。

## 2. Harness 原理（`tools/harness/`）

1. 页面加载 React/ReactDOM UMD、DSH 主题 token（`theme.css`，`body[data-ds-dark-theme]` 切暗/亮）。
2. 捕获 `window.__ModuleLoader__.load`，执行 `factory(name => React)`；按 `test/client-ui.test.mjs` 的模式建假 Cordis ctx
   （`slots.register` 收集注册、`slots.inject` 立即回调、`locale.bind/register`、`effect` 同步执行、`sessions`、
   `uiWorkspace.openSession`、`layout.selectPanel`），调用 `apply(ctx)`。
3. 轮询等待 `main` 槽注册 `workspace-hub:<workspaceId>`，用 props
   `{ workspaceId, workspacePath, sessionId, workspaceTitle, t, useSessions, useWorkspaces }` + 槽 `inject()` 渲染。
4. 拦截 `window.fetch` 的 `POST /workspace-hub/api/<method>`：`hub.snapshot`（主路径）、`hub.catalog`、`servers.status`、
   `subchats.catalog`、`hub.workspace`、`tasks.*`、`servers.start/stop`、legacy `context/tasks.list/hub.sessions` 全部返回
   `{ok:true,value}`；数据镜像原型（12 任务、4 会话/8 子会话、3 服务器、AGENTS/CONTEXT/技能）。
5. 数据模式 `full|empty|error|stale`（stale = 首帧成功后轮询失败）；`view` 通过点击导航/行/按钮或 `⌘K` 切状态。

假宿主改动均在被测文件之外：`t` 由插件自注册词典解析；`useSessions/useWorkspaces` 用 mock 快照填充；
引导层 localStorage 置为 dismissed。若面板挂载失败，页面显示 `HARNESS BOOT FAILED` + 阶段 + mock API 日志。

## 3. 截图（`tools/harness/shots/`）

| 状态 | 文件 |
|---|---|
| 默认/概览 暗、亮 | `01-default-dark.png` `02-default-light.png` `14-default-bare.png`（无假侧栏，1440 全宽） |
| 概览 / 任务 | `03-overview-dark.png` `04-tasks-dark.png` `09-tasks-light.png` |
| 对话（默认展开当前会话）/ 全部会话 | `05-sessions-dark.png` `05b-sessions-expanded-dark.png` |
| 设置 暗 / 亮 | `06-settings-dark.png` `10-settings-light.png` |
| 命令面板（⌘K） / 派发 sheet | `07-palette-dark.png` `08-dispatch-dark.png` |
| 空 / 错误 / stale | `11-empty-dark.png` `12-error-dark.png` `13-stale-dark.png` |
| 旧面板流水线佐证 | `old-01-default-dark.png` …（改造前 client.js，证明 harness 非只测新代码） |

## 4. 控制台与布局

- 冻结版 15 个场景：面板运行时错误 0、React 警告 0、console 错误 0（`report.json`）。启动时 `favicon 404` 已由
  index.html 的 `data:` 图标消除。
- 面板可用区 1192×900（1440 − 假侧栏 248），`document.scrollWidth == clientWidth`，无横向滚动；各视图片段均在
  `wh-content` 内纵向滚动。
- 改造过程中曾发现 `Glyph`/`progress` 图标用 `'stroke-width'/'stroke-dasharray'` 触发 React "Invalid DOM property"
  警告（旧行号 `client.js:1826`），冻结版已改为 `strokeWidth/strokeDasharray`，复测消失。

## 5. 发现的问题（冻结版 file:line）

1. **P2 功能不一致：命令面板不能重启 failed 服务器。** `palette.startServer` 只选 `serverPhase === 'stopped'`
   （`client.js:3590`），而环境行/详情允许 stopped **或 failed** 启动（`client.js:4880`、`client.js:5311`）。当环境里
   只有 failed/starting 服务器时，⌘K 的「启动服务器」被禁用并提示「当前没有可启动的服务器」，但同一面板
   「环境」行的 failed 服务器仍有「启动」按钮（截图 `07-palette-dark.png` vs `02-default-light.png` 中 design preview）。
   建议：`nextStartable` 改为 `serverPhase(server) === 'stopped' || serverPhase(server) === 'failed'`。
2. **P2 亮色主题小字对比度不足 4.5:1。** 11–12px 元数据大量使用 `--dsw-alias-label-tertiary`：亮色 `#81858c`
   在 `#ffffff` 上实测 **3.71:1**（`.wh-row-sub` `client.js:803`、`.wh-row-meta` `client.js:805`、`.wh-muted`
   `client.js:734`、`.wh-strip-sync` `client.js:765`、`.wh-nav-num` `client.js:773`、`.wh-foot` `client.js:781`）。
   与 `00-brief.md §3.5`「元数据用 label-secondary，对比度按 4.5:1 校验」不符；暗色下无此问题。建议亮色改用
   `--dsw-alias-label-secondary`（`#61666b`，约 5.6:1）。截图 `09-tasks-light.png`、`10-settings-light.png`。
3. **P3 错误态把「未知」显示成 0。** `12-error-dark.png`：快照失败时顶栏仍是「进行中 0 待办 0 阻塞 0 环境 0/0」、
   导航仍是「任务 0 对话 0」，与正文「无法读取工作区数据」矛盾；建议失败且无旧数据时显示 `—` 并标注不可用。
4. **P3 面板注册依赖 `hub.catalog`。** `main` 面板由 `hubCatalog` 快照驱动注册（`client.js:1278`、`5587`、`5599`）。
   实测 `hub.catalog` 单次失败时 8s 内没有任何 main 面板（harness 报 `no main slot registration…`），而 catalog 每
   10s 才重试（`client.js:1278` 附近）；Host 短暂不可用期间用户看到的是「无面板」而非错误态，建议注册与 catalog
   成功解耦或缩短重试。
5. **P3 设置页规则链的「只读」标签易误读。** `06-settings-dark.png`：可编辑的工作区 `AGENTS.md` 在继承链里也标
   「只读」，下方却提供编辑器；若继承链只是预览，建议把该行标注为「当前工作区（可编辑）」。

（无 P0/P1 阻塞项；键盘 ⌘K、j/k/Enter、Escape 关闭、行内展开、派发 sheet、乐观完成 + 撤销 toast 均已实际渲染/触发。）

## 6. 未验证 / 局限

- 未接真实 Host：`hub.snapshot`/文件读写/服务器进程均为 mock，只能验证渲染、状态机与交互，不验证真实 Host 时序。
- 未登录真实 DSH GUI；真实宿主的 slot 包裹层（tab 栏、面板滚动容器）用等宽假侧栏近似，1192px 不是精确宿主内宽。
- 引导层被 harness 主动 dismiss；未覆盖 hover-only 视觉、拖拽/批量选择（若实现）、`prefers-reduced-motion`、窄屏 <900px。
- `file:line` 对应冻结版 sha1 `675881940dffd1341b38796495b979853b1404bf`；若后续改动请 `node tools/harness/shoot.mjs`
  重取截图再核对行号。

## 7. 评审后复验（Lead）

- 最终 `client.js` 5689 行（评审基线 sha 4c90c0e3）；评审 P0/P1 修复后重跑 `node tools/harness/shoot.mjs`：15 场景、0 console 错误。
- 修复后的截图仍在本目录 `tools/harness/shots/`：`01-default-dark`（概览）、`04-tasks-dark`（任务）、`05b-sessions-expanded-dark`（子会话展开 + 行内发送）、`06-settings-dark`、`07-palette-dark`、`08-dispatch-dark`、`09-tasks-light`。
- 已知未修：错误态顶栏计数仍显示 0；`hub.catalog` 失败时面板注册延迟；设置继承链只读标签已改为“可编辑/只读”区分。
