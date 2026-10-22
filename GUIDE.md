# Workspace Hub 使用指南

Workspace Hub（工作区中枢）是 DeepSeek Harness 的一个插件包：它为**每个工作区**提供一块跨会话共享的任务板、一个工作区会话总览，以及由主对话管理的子会话；并可在中枢里查看/编辑该工作区的规则、上下文与技能。

一句话：**把"这个工作区现在有哪些事、哪些对话、共享规则"收在一个工作区级控制台里。**

---

## 1. 前置条件

- 已安装 DeepSeek Harness（Desktop 或 CLI 版），版本满足 `engines.dsh`：`>=0.2.1-rc.2 <0.3.0`。
- 知道当前 profile 名称（Desktop 默认 `desktop`；CLI 用 `--profile <name>`，Web 版本常为 `web`）。

---

## 2. 安装

### 0. 通过 ZVID 市场安装（最方便）

1. 打开 **Plugins → Discover**，点 **Add index source**；
2. 添加市场索引：`https://raw.githubusercontent.com/tyxt-zvid/zvid-plugins/main/index.json`；
3. 在市场下拉选择 **ZVID Plugins / ZVID 插件市场**，找到 **Workspace Hub**，点 **Install**。

插件是一个标准 DSH bundle（`package.json` 里声明了 `dsh.bundle.patch` 与 `dsh.client`），三种方式任选：

### A. 在 DSH 会话里让 Agent 安装（Desktop 最方便）

把包目录或 tarball 路径交给 Agent，调用：

```js
plugin_manager({
  action: 'install_bundle',
  target: '/绝对路径/dsh-workspace-hub-0.2.1.tgz'
})
```

`target` 也接受：本地目录、git 地址、npm 包名/版本（例如 `my-scope/dsh-workspace-hub@0.2.0`）。安装成功返回 `application: applied`。

### B. 用 CLI 安装

```bash
dsh plugin --profile desktop add /绝对路径/dsh-workspace-hub-0.2.1.tgz
# 或 npm：dsh plugin --profile desktop add @your-scope/dsh-workspace-hub
# 或 git：dsh plugin --profile desktop add https://github.com/you/dsh-workspace-hub
```

移除：

```bash
dsh plugin --profile desktop remove @local/dsh-workspace-hub
```

### C. 开发者：目录直连

在仓库目录直接运行：

```bash
dsh plugin --profile desktop add ./dsh-plugins
```

（`plugin_manager` 也可直接传目录绝对路径；改动 Host 代码后需 `remove` + 重新 `add` 才会重新加载。）

> 安装后如果页面没有立即出现「中枢」按钮，刷新一次页面。

---

## 3. 首次使用（7 步）

1. **侧边栏「工作区中枢」** 是常驻入口（与日程等平级），点击进入**所有工作区**总览；标题栏左侧的 **「中枢」** 按钮是快捷方式，打开中枢并定位到当前会话所属工作区；工作区声明了服务器时，按钮旁还有 **「服务器」状态胶囊**（点击打开该工作区环境）。
2. **所有工作区**：全局状态条 + 跨区「需要你处理 / 正在运行」+ 工作区卡片；点卡片（或注意力项）进入该工作区。
3. **工作区 Console**：面包屑「所有工作区 / 名称」可返回；顶部状态条 + **概览 / 任务 / 对话**，右上角 ⚙ 进入工作区设置。
4. **概览**：一屏看「需要你处理 / 正在运行 / 环境」，每条注意力都有原因和一个主操作。
5. **任务**：快速捕获（`Enter` 创建）→ 行内展开编辑/备注 → 认领（我来做）或派发给某个对话（可附补充说明）；删除 6 秒内可撤销。任务板对该工作区所有会话共享。
6. **对话**：工作区所有主会话 + 子会话树；子会话行内可直接发消息/中断/关闭/重开，可切换「显示已关闭」。
7. **工作区设置（⚙）**：查看/编辑 `AGENTS.md`、中枢托管的 `CONTEXT.md`、新建 `.dsh/skills` 技能；同时只读展示继承链与技能清单。

**从侧边栏新建子会话**：hover 主对话的会话行 → 点行尾子会话图标（无子会话时显示 `+`）→ 浮层底部「新建子会话」→ 填可选标题与首条消息。同一个按钮再点一次收起。

**让 Agent 帮忙**：在主对话里直接说"新建一个子会话，让它……"，或"把任务 X 派发给会话 Y"。

---

## 4. 模型侧工具

| 工具 | 用途 |
|---|---|
| `workspace_task` | `list / get / create / update / claim / release / dispatch / delete`，工作区共享任务板 |
| `subchat` | `list / create / send / interrupt / close / reopen`，当前主对话的子会话 |
| `dev_server` | `start / status / stop`，按工作区的 `servers.json` 起停开发服务器 |

---

## 4.1 开发服务器状态与启停（Web 游戏工作区）

**默认什么都不用配**：打开任意工作区的会话，中枢会从 `package.json` 自动识别开发服务器（`dev/start/play/serve` 等脚本、端口、`/health` 路由、Vite 等框架默认端口、npm/pnpm/yarn/bun），标题栏「中枢」旁的 **「服务器」状态胶囊** 随之出现，面板环境区标「自动识别」。

需要覆盖自动识别或配置多实例时，再写 `<workspace>/.dsh/workspace-hub/servers.json`：

```json
{
  "version": 1,
  "servers": [
    {
      "name": "game",
      "command": "node layer1/server.mjs",
      "url": "http://127.0.0.1:4180/",
      "health": "http://127.0.0.1:4180/api/health"
    }
  ]
}
```

- 胶囊状态：绿=全部就绪，琥珀=运行中/启动中，灰=全部停止，红=失败；数字是 `就绪数/总数`。没识别到服务器的工作区不显示胶囊。
- 点胶囊打开中枢面板并展开**环境 popover**（或从概览「环境」区进入）：每个实例一行，显示状态、命令、目录、URL，并提供 **启动 / 停止 / 打开**（失败行有日志尾）。停止只停中枢自己启动的进程；已在外部终端启动的实例标为「外部运行」。
- 写 `{"version":1,"servers":[]}` 可显式关闭自动识别；显式配置永远优先。
- `cwd` 必须是工作区内的相对路径，`url`/`health` 只接受 http(s)；`command` 与 `argv` 二选一（跨平台建议 `argv`）。服务器进程在插件卸载时自动结束。

**在其他工作区启用**：插件是 profile 级（装一次即可），通常打开工作区就能看到自动识别的胶囊。推断不准（monorepo 子包、脚本里算出来的端口）时再按上面的格式写配置。常见映射：

- 静态服：`"command": "node serve.mjs"`，`health` 用 `http://127.0.0.1:<port>/health`
- Vite / Next：`"command": "npm run dev"`，`health` 用首页（Vite 对 `/` 返回 200），`readyTimeoutMs: 30000`
- 前后端两个进程：`servers` 写两条（自动识别也会把 `dev` 旁的 `server`/`api`/`backend` 脚本并进来）
- 需要固定端口/环境变量：在项目 `package.json` 里加 npm script，再让 `command` 调它（配置本身不支持 `env`）

本机 `games/vw-flower`（4173）和 `games/tyler-diver`（Vite 5179）已删除示例配置，现在走自动识别验收；打开这两个工作区会看到同样的「自动识别」实例。

---

## 5. 数据放在哪

- 任务板：`<workspace>/.dsh/workspace-hub/tasks.json`
- 子会话行：`<workspace>/.dsh/workspace-hub/subchats.json`
- 开发服务器声明（可选；缺省自动识别）：`<workspace>/.dsh/workspace-hub/servers.json`
- 工作区上下文：`<workspace>/.dsh/workspace-hub/CONTEXT.md`
- 工作区规则：`<workspace>/AGENTS.md`
- 工作区技能：`<workspace>/.dsh/skills/<name>/SKILL.md`

全部是工作区本地文件，可随仓库一起备份/迁移；不写用户全局配置。

---

## 6. 作者：打包与发布

```bash
# 生成可分发 tarball（会按 package.json 的 files 过滤）
npm pack --pack-destination dist

# 对方安装
plugin_manager({ action:'install_bundle', target:'/abs/path/dist/local-dsh-workspace-hub-0.2.1.tgz' })
```

发布到 npm（让别人用名字安装）：

1. 把 `package.json` 的 `name` 改成你自己的 scope，例如 `@your-scope/dsh-workspace-hub`；
2. 同步更新 `cordis.patch.yml` 里插入行的 `name`；
3. 删除 `"private": true`；
4. `npm publish --access public`。

版本兼容由 `engines.dsh` 声明；DSH 会在安装前校验，不满足会拒绝安装。

---

## 7. FAQ

- **看不到「中枢」按钮？** 确认插件已启用（`extension` 状态 active），然后刷新页面；按钮在主视图标题栏最左侧。
- **子会话回复为什么不在主对话里刷屏？** 采用 need-to-know：普通完成不打扰主对话；失败/中断/超限等才提示。最新回复在「对话」页子会话行内或侧边栏浮层查看。
- **改了 AGENTS.md 没立刻生效？** 指令链在下次请求或会话 resume 时重新读取；`CONTEXT.md` 保存后活动会话下一轮生效，新会话立即生效。
- **技能没出现？** 检查 frontmatter 的 `name` 是否 kebab-case、`description` 是否非空；技能目录是 watch 的，下一个模型 step 可见。
- **全局规则/技能能在这里改吗？** 不能，中枢只写工作区本地文件；全局文件保持只读展示。
