# Workspace Hub 使用指南

Workspace Hub（工作区中枢）是 DeepSeek Harness 的一个插件包：它为**每个工作区**提供一块跨会话共享的任务板、一个工作区会话总览，以及由主对话管理的子会话；并可在中枢里查看/编辑该工作区的规则、上下文与技能。

一句话：**把"这个工作区现在有哪些事、哪些对话、共享规则"收在一个工作区级控制台里。**

---

## 1. 前置条件

- 已安装 DeepSeek Harness（Desktop 或 CLI 版），版本满足 `engines.dsh`：`>=0.2.1-rc.2 <0.3.0`。
- 知道当前 profile 名称（Desktop 默认 `desktop`；CLI 用 `--profile <name>`，Web 版本常为 `web`）。

---

## 2. 安装

插件是一个标准 DSH bundle（`package.json` 里声明了 `dsh.bundle.patch` 与 `dsh.client`），三种方式任选：

### A. 在 DSH 会话里让 Agent 安装（Desktop 最方便）

把包目录或 tarball 路径交给 Agent，调用：

```js
plugin_manager({
  action: 'install_bundle',
  target: '/绝对路径/dsh-workspace-hub-0.1.0.tgz'
})
```

`target` 也接受：本地目录、git 地址、npm 包名/版本（例如 `my-scope/dsh-workspace-hub@0.1.0`）。安装成功返回 `application: applied`。

### B. 用 CLI 安装

```bash
dsh plugin --profile desktop add /绝对路径/dsh-workspace-hub-0.1.0.tgz
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

## 3. 首次使用（5 步）

1. **打开任意工作区里的会话**，看主界面标题栏最左侧：会出现 **「中枢」** 按钮（无会话时也存在）。
2. 点它打开该工作区的看板，看到三个页签：**任务 / 会话 / 工作区**。
3. **任务**：新建任务 → 认领（自己做）或派发给某个对话（新建会话/已有会话）。任务板对该工作区所有会话共享。
4. **会话**：工作区所有主会话 + 嵌套的子会话一览；可打开、关闭子会话，也可为主会话新建子会话。
5. **工作区**：查看/编辑 `AGENTS.md`、中枢托管的 `CONTEXT.md`、新建 `.dsh/skills` 技能；同时只读展示继承链与技能清单。

**从侧边栏新建子会话**：hover 主对话的会话行 → 点行尾子会话图标（无子会话时显示 `+`）→ 浮层底部「新建子会话」→ 填可选标题与首条消息。同一个按钮再点一次收起。

**让 Agent 帮忙**：在主对话里直接说"新建一个子会话，让它……"，或"把任务 X 派发给会话 Y"。

---

## 4. 模型侧工具

| 工具 | 用途 |
|---|---|
| `workspace_task` | `list / get / create / update / claim / release / dispatch / delete`，工作区共享任务板 |
| `subchat` | `list / create / send / interrupt / close / reopen`，当前主对话的子会话 |

---

## 5. 数据放在哪

- 任务板：`<workspace>/.dsh/workspace-hub/tasks.json`
- 子会话行：`<workspace>/.dsh/workspace-hub/subchats.json`
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
plugin_manager({ action:'install_bundle', target:'/abs/path/dist/local-dsh-workspace-hub-0.1.0.tgz' })
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
- **子会话回复为什么不在主对话里刷屏？** 采用 need-to-know：普通完成不打扰主对话；失败/中断/超限等才提示。最新回复在「会话」页或侧边栏浮层查看。
- **改了 AGENTS.md 没立刻生效？** 指令链在下次请求或会话 resume 时重新读取；`CONTEXT.md` 保存后活动会话下一轮生效，新会话立即生效。
- **技能没出现？** 检查 frontmatter 的 `name` 是否 kebab-case、`description` 是否非空；技能目录是 watch 的，下一个模型 step 可见。
- **全局规则/技能能在这里改吗？** 不能，中枢只写工作区本地文件；全局文件保持只读展示。
