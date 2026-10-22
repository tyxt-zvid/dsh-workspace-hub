# OpenDesign 工具链地图 · 设计系统候选 · 评审基线

> 版本：v1（2026-10-22）  
> 作者：设计工具链（opendesign-lab）  
> 对应任务：`task-2`；被 `03-strategy.md` §7 / §11 / 附录 B 引用  
> 读者：Lead（做原型与最终 UI）、评审者、后续接手的人  
> **只读声明**：本文对 OpenDesign（下称 OD）只做读取。未执行任何 POST/PUT/DELETE、未触发 OD agent run、未改动 OD 项目文件。OD 的 App 当时处于打开状态，所有读取都直接落在版本化 payload 目录与本地 daemon 的 GET 接口上。

一句话结论：**OD 对我们真正有用的只有三样东西——`craft/*.md` 的通用规则、`design-systems/*` 的 token 契约与密度参照、`frames/` 的展示壳。** 模板（`design-templates/`）与技能提示词（`skills/*/SKILL.md`）多数是给 OD 自己生成新页面用的，不能直接搬进一个「嵌在 DSH 主内容区里、只有 900–1120px」的面板。

---

## 0. TL;DR（给 Lead 的 6 行）

1. **首选参照 `linear-app`**（暗色原生 / 层级靠亮度不靠阴影 / 发丝线 / 单一强调 / mono 元数据），**次选 `raycast`**（浮层与键盘语法），**第三 `mission-control`**（信息密度与状态优先，只借结构不借配色）。
2. **明确不采用**：`vercel`、`dashboard`、`cursor`（都是亮色优先）、`opencode-ai`（暖色 + 纯 mono 无 CJK 字形）。
3. 三个视觉方向见 §3；与 `03-strategy.md` 已定的 **Graphite Console** 对应关系：A（宿主原生）做底，B（Linear 式密列表）做列表，C（Raycast 式命令面板）只用于 ⌘K 与派发浮层。
4. 评审基线见 §4：**44 条 P0/P1**，每条都带「怎么判」，可以直接当合并门槛。
5. 截图管线已验证：Chrome 155 headless，1120×760@1x 约 3.5–5.8s/张，产物用 `tools/design/shot.sh` 自动校验尺寸与空白（无需 ImageMagick/PIL——本机这两个都坏了）。
6. **两处必须先处理的冲突**：① 09:45 曾出现的 `docs/redesign/design-system/workspace-hub/MASTER.md`（生成器默认产物：`#0F172A` 底 + `#22C55E` 强调 + Google Fonts 外链）与宿主原生方案冲突，09:50 前已被移除——若再次生成同类文件，一律以 `03-strategy.md` §7 与本文 §2.6 为准；② DSH 的 `--dsw-alias-*` **值不在** `dsh-web-frontend/dist` 的 CSS 里，而在 `@deepseek-ai/dsh-client-ui-theme` 中——见 §6.3 的路径与取值。

---

## 1. OpenDesign 资源地图

所有路径以 `$OD` 为根（下同；把 `$OD` 换成下面这串绝对路径即可得到完整路径）：

```
$OD = /Users/unclet/Library/Application Support/Open Design/launcher/channels/stable/namespaces/release-stable/versions/0.26.0/payload/Open Design.app/Contents/Resources/open-design
```

实测规模（`/api/*` GET，2026-10-22）：`design-systems` 152 个包、`design-templates` 126 个、`skills` 169 个、`craft` 13 个条目（11 个规则文件 + README + FUTURE_SECTIONS）。注意 `design-systems/README.md` 写的是 151 个，以 API/目录实测为准。

### 1.1 三层分类法（先分清「规范 / 样例 / 提示词」）

| 层 | 判断依据 | 位置 | 对我们意味着什么 |
|---|---|---|---|
| **规范（normative）** | 有 token 契约、有可判定的数值或规则 | `craft/*.md`、`design-systems/<slug>/DESIGN.md`、`design-systems/<slug>/tokens.css`、`design-systems/_schema/*`、`design-systems/<slug>/components.manifest.json` | **可以直接当标准引用**，用来评审与校准 |
| **样例（examples）** | 是某一次的完整产物，换个宽度/主题就不成立 | `design-templates/*`、`frames/*.html`、`design-systems/<slug>/components.html`、`design-systems/<slug>/preview/*.html` | 只能**借形状与做法**，不能当实现贴进来 |
| **技能提示词（prompts）** | YAML frontmatter + 给 agent 的工作流 | `skills/*/SKILL.md`、`design-templates/*/SKILL.md` | 多数是**给 OD agent 的指令**，不是给我们的规则；且不少是「去上游仓库安装」的空壳 |

**经验判据**：一个文件如果通篇在说「颜色、字号、间距、状态必须如何」，是规范；如果通篇是完整 HTML/JSX，是样例；如果一个目录里只有一个带 `triggers:` 的 `SKILL.md`，是提示词。

### 1.2 规范层 A：`craft/*.md`（11 个规则文件，1948 行）

| 文件（绝对路径均在 `$OD/craft/`） | 行数 | 内容 | 我们的用法 |
|---|---|---|---|
| `laws-of-ux.md` | 296 | 命名研究支撑的构成规则：邻近/相似/共同区域、Hick、Miller/Cowan 分块、Fitts、Jakob、Peak-End、Doherty | §3 布局方向、§4 分组与行密度 |
| `state-coverage.md` | 134 | 五态（loading/empty/error/populated/edge）、加载时长分级、错误三问、重试退避、ARIA/focus | §4「状态覆盖」整组 |
| `accessibility-baseline.md` | 201 | WCAG 2.2 AA 地板：对比、24×24 目标、focus 可见性、原生控件优先、ARIA 纪律 | §4「交互/焦点/键盘」整组 |
| `animation-discipline.md` | 154 | 150ms 默认、曲线 vs 弹簧、reduced-motion、闪烁上限、循环动效 | §4「动效」整组 |
| `anti-ai-slop.md` | 84 | 七宗罪（indigo 强调、双色渐变、emoji 图标、编造指标…）+ P1/P2 soft tells | §4「防 AI 味」+ §7 不采用清单 |
| `typography.md` | 122 | 字阶 6–8 档、字距表（含 ALL CAPS ≥0.06em）、CJK 行高覆盖、三字重 | §4「排版」整组 |
| `typography-hierarchy.md` | 165 | 单一入口、层级向量、扁平/噪声层级、三档工作模型与其 lint 清单 | §4 层级项、§3 |
| `color.md` | 88 | 色彩四层占比（中性 70–90%、强调 5–10%、语义 0–5%）、强调色 ≤2 处/屏、暗色不用纯黑白 | §4「色彩」整组 |
| `typography-hierarchy-editorial.md` | 182 | 长文/编辑性层级，本项目用不到 | 不用 |
| `form-validation.md` | 221 | 表单校验时机、错误文案、ARIA wiring | 只在「新建任务/派发」表单上用 |
| `rtl-and-bidi.md` | 186 | RTL 与双向文本 | 不用（中文单语） |

执行强度（`$OD/craft/README.md` 明写）：

- **P0 的 `anti-ai-slop.md` 列表是 OD daemon 的 `lint-artifact.ts` 自动检查的**，其余全部是「guidance」——也就是说 OD 不会替我们检查状态覆盖、焦点、动效，这些要靠 §4 的 checklist 人工/截图判。
- craft 是**按需注入**的：skill 用 frontmatter `od.craft.requires: [typography, color, anti-ai-slop]` 选择注入哪些段。我们可以照抄这个「按维度取用」的做法，而不是整本背下来。

### 1.3 规范层 B：`design-systems/<slug>/`（152 个包）

每个包的完整形状（以 `linear-app` 为例，绝对路径 `$OD/design-systems/linear-app/`）：

```
manifest.json              # 发现元数据：id / name / category / files 路径（catalog 用）
USAGE.md                   # 阅读顺序契约（先读这个）
DESIGN.md                  # 品牌散文规范：主题、调色板、字阶表、组件样式、Do/Don't
tokens.css                 # 编译后的语义 token 契约（:root 一份，可直接贴）
design-tokens.json         # 结构化 token 同源数据
tailwind-v4.css            # 同一批 token 的 Tailwind 入口
components.html            # 参考组件（样例，不是规范）
components.manifest.json   # 组件清单 + token declared/referenced 名单
preview/{colors,spacing,typography}.html   # 视觉自检页（样例）
source/                    # 审计证据（部分包有）
```

`DESIGN.md` 与 `tokens.css` 的**契约**（`$OD/design-systems/README.md` + `_schema/tokens.schema.ts`）：
固定 token 名 `--bg / --surface / --surface-warm / --fg / --fg-2 / --muted / --meta / --border / --border-soft / --accent / --accent-on / --accent-hover / --accent-active / --success / --warn / --danger / --font-display / --font-body / --font-mono / --text-xs…--text-4xl / --leading-* / --tracking-display / --space-* / --radius-* / --elev-* / --focus-ring / --motion-* / --ease-standard`。

**这个契约只适合 OD 内部产物，不适合我们的插件**：我们的宿主已经有 55 个 `--dsw-alias-*` 语义 token，再叠一层 `--bg/--accent` 只会做出两套主题。正确用法见 §2.6：**把候选值翻译成宿主 token 的决策依据**，而不是把 `tokens.css` 贴进面板。

### 1.4 样例层：templates / frames / components / preview

| 位置 | 数量 | 与我们相关的条目 | 能借 / 不能借 |
|---|---|---|---|
| `$OD/design-templates/` | 126 | `dashboard`（118 行 example.html，SKILL.md 明写要求 `state-coverage + accessibility-baseline + laws-of-ux`）、`kanban-board`（270 行）、`web-prototype`、`wireframe-greybox` / `wireframe-annotated` / `wireframe-mobile-flow` / `wireframe-sketch`、`critique`、`github-dashboard`、`live-dashboard` | 借分区与信息结构；尺寸/字体/亮暗假设都不同，**不能当原型贴** |
| `$OD/frames/` | 6 | `browser-chrome.html`（135 行，Safari 风格浅色浏览器壳，`?screen=<path>&url=<host>` 用 iframe 载入）、`macbook.html`、`iphone-15-pro.html`、`android-pixel.html`、`ipad-pro.html` | 只用于展示/汇报；**它默认亮色**，套在暗色面板外会误导（见 §5） |
| `$OD/design-systems/<slug>/components.html` | 每包 1 个 | `linear-app/components.html`（14.6 KB / 37 selectors）、`raycast/components.html`（19.5 KB / 46 selectors） | 看「同一 token 怎么落到组件」；是样例 |
| `$OD/design-systems/<slug>/preview/*.html` | 每包 3 个 | 同上 | 快速目检 token 关系 |
| `$OD/prompt-templates/` | 2 | 只有 `image/` `video/` | **与 UI 无关，忽略** |

`design-templates/<id>/SKILL.md` 的 frontmatter 里通常有 `od.craft.requires`（例如 `dashboard` 要求 `[state-coverage, accessibility-baseline, laws-of-ux]`），这给了我们一个现成的「做这类界面必须覆盖哪些维度」索引，可以当 §4 的分组骨架用。

### 1.5 提示词层：`skills/*/SKILL.md`（169 个）

结构与用途：

```yaml
---
name: redesign-existing-projects
description: |
  Upgrades existing websites and apps to premium quality. Audits current design, ...
od:
  mode: prototype
  craft:
    requires: [typography, color, anti-ai-slop, state-coverage]
---
# body：真正的工作流
```

与本次改造相关的 10 个（均在 `$OD/skills/<name>/SKILL.md`）：

| skill | 内容性质 | 对我们有用吗 |
|---|---|---|
| `redesign-skill` | **有真实 body**：Typography / Color and Surfaces / 交互的完整审计清单 | 有用，§4 吸收了其中「数字用 tabular-nums / monospace」「纯黑背景改近黑」「只用了 400+700 两个字重」等条目 |
| `design-review` | 空壳：正文只写「去 GitHub 安装上游技能」 | 只能当概念索引；**不能用它的规则**（没有规则） |
| `screenshot` / `full-page-screenshot` | 同上，空壳 | 截图命令我们自己验证（§6） |
| `frontend-design` `frontend-skill` `frontend-dev` | 样例/提示词混合 | 不引 |
| `ui-ux-pro-max` | 57 行的方法论/风格库型提示词（本机未装它依赖的数据库） | 与本项目「宿主原生」方向冲突，不引 |
| `web-design-guidelines` | 检查清单类 | 与 craft 重叠，用 craft 即可（更权威、有出处） |
| `impeccable-design-polish` | 打磨流程 | 可当 P1 打磨阶段的提醒 |
| `design-brief` | 需求收敛 | 阶段 0 可用，本阶段不需要 |
| `agent-browser` | 浏览器自动化提示词 | 不引（我们有自己的 headless 管线） |

**结论**：`skills/` 只取「维度索引」和少数真实 body；**规则一律以 `craft/` 为准**，因为 craft 才有文件名可引用、有数值可判定。

### 1.6 运行时：本地 daemon 的只读接口

`http://127.0.0.1:57009`（实测 `/api/health` → `{"ok":true,"version":"0.26.0"}`）。可用的 GET：

```bash
curl -s http://127.0.0.1:57009/api/health
curl -s http://127.0.0.1:57009/api/version
curl -s http://127.0.0.1:57009/api/design-systems   # 152 条，含 id/title/category/swatches
curl -s http://127.0.0.1:57009/api/design-templates # 126 条
curl -s http://127.0.0.1:57009/api/skills           # 169 条
curl -s http://127.0.0.1:57009/api/craft            # 13 条（含 bytes）
curl -s http://127.0.0.1:57009/api/projects         # 只用于确认 daemon 活着
```

红线：

- **只 GET**。`/api/projects` 里是用户自己的 OD 项目（含中文项目名、状态、runId），**不要把内容摘抄进任何交付物**；本文只记录该接口存在。
- 不 POST/PUT/DELETE，不调任何「run/execute」类路由，不新建/修改 OD 项目——用户 App 正开着，一次写操作就可能让它重新索引或弹窗。
- 需要内容时优先**直接读 `$OD` 下的文件**（更全、可引用行号），daemon 只用来确认版本与清单数量。

---

## 2. 设计系统候选

### 2.1 七个候选的横向评估

评分 0–3，只针对「嵌在 DSH 主内容区、900–1120px、暗色优先、多人并发看板」这一个场景。

| 包 | 暗色优先 | 信息密度 | 单一强调色 | mono 元数据 | 状态色克制 | 与宿主中性色兼容 | 结论 |
|---|---|---|---|---|---|---|---|
| **`linear-app`** | 3（`#08090a` 原生暗） | 3（10–16px 全阶、8px 网格） | 3（唯一彩色是 indigo-violet） | 3（Berkeley Mono 专用于 code/metadata） | 3（绿只做状态点） | 3（冷灰中性，与 `bluish-*` 同族） | **首选**：做密度、层级、发丝线、元数据 |
| **`raycast`** | 3（`#07080a`） | 2（+0.2px 字距、16px 大圆角，偏「airy」） | 2（红 + 蓝两个彩色） | 2（GeistMono 仅 14/12px） | 2（红/绿/黄/蓝四语义） | 2（蓝调黑 + macOS 多层内阴影） | **次选**：只借浮层、焦点与键盘语法 |
| **`mission-control`** | 3（原生暗，无亮色版） | 3（11–14px 主阶、44 行高） | 1（amber + cyan + 绿 + 红） | 3（mono 数字/遥测） | 1（数据色多） | 2（navy 底 vs 宿主石墨） | **第三**：借「状态优先」的信息结构，配色不借 |
| `vercel` | 0（`#ffffff` 亮色优先） | 3 | 3 | 3（Geist Mono） | 3 | 1（亮色体系） | 不采用（极性相反） |
| `dashboard` | 1（DESIGN.md 说暗，`tokens.css` 实为 `#f4f7fb` 亮色） | 2 | 2 | 1（mono 只是 Inter 回退） | 2 | 1 | 不采用（自相矛盾 + 亮色） |
| `cursor` | 0（cream `#f2f1ed`） | 2 | 3 | 3（berkeleyMono） | 2（hover 变 crimson） | 0（暖色 + serif 正文） | 不采用（暖色/衬线，嵌进冷灰宿主会像贴纸） |
| `opencode-ai` | 1（`#201d1d` 暖近黑） | 3 | 1（Apple HIG 四色） | 3（唯一字体 Berkeley Mono） | 2 | 0（暖红底 + 纯 mono 无 CJK 字形） | 不采用（中文面板会掉回 PingFang，等宽网格断裂） |

**硬门槛**：暗色优先与信息密度是「一票否决」列——面板是嵌在宿主主内容区里的一块工作界面，不是落地页；亮色优先的包即使 token 再漂亮也不能当主参照。

### 2.2 候选 A：`linear-app`（首选）

路径：`$OD/design-systems/linear-app/{DESIGN.md,tokens.css,components.html,preview/}`

**DESIGN.md 关键段**（行号即该文件行号）：

> “Linear's website is a masterclass in dark-mode-first product design — a near-black canvas (`#08090a`) where content emerges from darkness like starlight… every element exists in a carefully calibrated hierarchy of luminance.”（L8）

> “This is not a dark theme applied to a light design — it is darkness as the native medium, where information density is managed through subtle gradations of white opacity rather than color variation.”（L8）

> “Inter is used at a remarkable range of weights — from 300 (light body) through 510 (medium, Linear's signature weight) to 590 (semibold emphasis). The 510 weight is particularly distinctive: it sits between regular and medium, creating a subtle emphasis that doesn't shout.”（L10）

> “Semi-transparent white borders throughout: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`… Button backgrounds at near-zero opacity.”（L20–21 同一节）

> “On dark surfaces, traditional shadows are nearly invisible. Linear solves this by using semi-transparent white borders as the primary depth indicator. Elevation isn't communicated through shadow darkness but through background luminance steps.”（L279）

**tokens.css 核心值**（`:root` 实测）：

| 角色 | token | 值 |
|---|---|---|
| 画布 | `--bg` | `#08090a` |
| 面板/浮层底 | `--surface` | `#191a1b` |
| 主文字 | `--fg` | `#f7f8f8` |
| 次文字 | `--fg-2` | `#d0d6e0` |
| 三级/元数据 | `--muted` / `--meta` | `#8a8f98` / `#62666d` |
| 发丝线 | `--border` / `--border-soft` | `rgba(255,255,255,.08)` / `.05` |
| 强调 | `--accent` / hover / active | `#5e6ad2` / `#828fff` / `#4752c4` |
| 状态 | `--success` `--warn` `--danger` | `#27a644` `#eab308` `#dc2626` |
| 字体 | `--font-display/-body/-mono` | Inter Variable / Inter Variable / Berkeley Mono + `ui-monospace, SF Mono, Menlo` |
| 字阶 | `--text-xs…-4xl` | 12 / 14 / 16 / 18 / 24 / 32 / 48 / 72px |
| 字距/行高 | `--tracking-display` / `--leading-*` | `-0.022em` / `1.5`、`1.0` |
| 圆角 | `--radius-sm/md/lg/pill` | 6 / 8 / 12 / 9999px |
| 动效 | `--motion-fast/base`、`--ease-standard` | 150 / 200ms、`cubic-bezier(0.2, 0, 0, 1)` |
| 焦点 | `--focus-ring` | `0 0 0 2px color-mix(accent, transparent 30%)` + `0 4px 12px rgba(0,0,0,.1)` |

**适配理由**：

1. **层级模型和宿主一致**：宿主暗色也是「`bg-base #151517` → `layer-1 #232324` → `layer-2 #2c2c2e` → `layer-3 #353638`」的亮度阶 + 半透明白边（`border-l1 6% / l2 12% / l3 16% / l4 20%`）。Linear 的「亮度即高度、发丝线即边界」可以 1:1 映射过去，不需要造新机制。
2. **重量系统正是 DSH 面板缺的**：宿主字阶给了 11/12/13/14/16/20/24px，插件现在用了 18/13.5/13/12.5/12/11.5/11/10.5/10 共 9 档；Linear 的 400/510/590 三字重 + 「不靠字号也能分层」正好用来收敛。
3. **单一强调 + mono 元数据**：宿主暗色的 `brand-primary` 已经是近白（`#f9fafb`），彩色只有 `state-business-primary`（`#7aaaff`，链接/焦点/进行中）与三状态色。Linear 的「只有一种彩色」纪律与之同构，可以直接抄纪律而不是抄紫色。

**风险**：

1. **紫色是第二个品牌色**：`#5e6ad2 / #7170ff` 一旦进面板，就会和宿主的「近白主按钮 + 蓝色链接」形成两套强调，违反 `color.md` 的「never invent a second accent」。→ 只借「强调稀少」的纪律，不借色相。
2. **画布过深**：`#08090a` 比宿主 `#151517` 更黑；面板若自绘背景，会在宿主主内容区里「挖一个洞」。→ 一律用 `var(--dsw-alias-bg-base)`，不自设底色。
3. **营销尺寸误导**：DESIGN.md 的 72/64/48px display 与 80px section 间距对 1120px 内嵌面板无意义。→ 只用 10–24px 段与 8px 网格。
4. **`510` 权重依赖 Inter Variable**：DSH 的字体栈是系统字体（`-apple-system, … PingFang SC`），没有 Inter Variable；照抄 510 会落到 500 附近。→ 取 500（`label-secondary`/标题）与 600（唯一强调）两档，见 §4。

**借用清单（翻译成宿主 token）**：

| 借什么 | 落到哪里 |
|---|---|
| 亮度阶代替阴影（3 档面） | `bg-base`（画布）/ `bg-layer-1`（卡、输入）/ `bg-layer-2`（浮层、菜单）/ `bg-layer-3`（更深浮层） |
| 半透明白发丝线 | `border-l1`（行分隔）→ `border-l2`（输入/浮层边）→ `border-l3`（聚焦/强调边） |
| 三字重 | 400 正文 / 500 标签与行标题 / 600 唯一强调（当前 `font-weight:600` 用得过多，见 §4） |
| mono 只给标识符 | `--ds-font-family-code`：端口、PID、路径、hash、计数；正文不用 mono |
| 元数据降级色 | `label-tertiary` / `label-caption`（时间、计数、路径） |
| 150ms 起手 + `cubic-bezier(0.2,0,0,1)` | 宿主已有 `--ds-ease-in-out: cubic-bezier(.4,0,.2,1)`，取宿主值（见 §4 动效） |
| 8px 网格 | 宿主 `--space-*` 缺位，用 4/8/12/16/24 四档手写常量即可（不新增 token） |

**不借**：indigo 紫、72px display、80px section rhythm、9999px 全站 pill 化、`#08090a` 自绘画布、Berkeley Mono（未装）。

### 2.3 候选 B：`raycast`（次选）

路径：`$OD/design-systems/raycast/{DESIGN.md,tokens.css,components.html}`

**DESIGN.md 关键段**：

> “The signature move is the layered shadow system borrowed from macOS window chrome: multi-layer box-shadows with inset highlights that simulate physical depth, as if cards and buttons are actual pressed or raised glass elements on a dark desk.”（L10）

> “The positive letter-spacing (0.2px–0.4px on body text) is unusual for a dark UI and gives the text an airy, breathable quality that counterbalances the dense, dark surfaces.”（L12–13）

> “Weight 500 as baseline: most body text uses medium weight (500), not regular (400) — subtle extra heft improves legibility on dark surfaces.”（L96，Typography Principles）

**tokens.css 核心值**：

| 角色 | 值 |
|---|---|
| 画布 / 面 | `#07080a` / `#101111` |
| 文字 | `#f9f9f9` / `#cecece` / `#9c9c9d` / `#6a6b6c` |
| 边 | `rgba(255,255,255,.06)`（卡片）/ `.04`（行内分隔） |
| 强调 | `#FF6363`（hero 条纹 / danger），hover `#ff7777`，active `#e85757` |
| 焦点 | `0 0 0 3px hsla(202,100%,67%,.35)` —— **蓝色焦点环，与红色强调分离** |
| 字体 | Inter（正文 +0.2px 字距）/ GeistMono |
| 圆角 | 6 / 12 / 16 / 9999 |
| 动效 | 150 / 200ms + `cubic-bezier(0.2,0,0,1)`；hover 用 opacity 过渡而非改底色 |
| 高度 | `--elev-ring: rgb(27,28,30) 0 0 0 1px, rgb(7,8,10) 0 0 0 1px inset`（双层环） |

**适配理由**：

1. **「焦点色 ≠ 品牌强调色」是很有价值的一条**：Raycast 用蓝色做交互与焦点、红色只做稀缺标点。映射到宿主就是「白主按钮（`button-primary-fill`）+ 蓝 `state-business-primary` 做焦点/链接/进行中」——正好是 `03-strategy.md` §7 已经定的做法。
2. **浮层语法完整**：菜单/命令面板/键帽三层结构，适合 ⌘K 与派发 sheet。
3. **body 500 字重 + 正字距**：对暗色小字（12–13px）可读性有实证价值，和 `typography.md` 的「small text 11–13px 用 +0.01–0.02em」一致。

**风险**：

1. **macOS 拟物**：多层 inset 高光 + 键帽渐变 + `86px` pill，本质是拟物，和宿主扁平发丝线冲突。→ 只借「环」不借「玻璃」：用 `border-l2` 画环，不加 inset 高光与渐变。
2. **两个彩色**：红 + 蓝。宿主没有红色品牌位，红只能出现在 `state-error-primary`。→ 明确：红不进面板，蓝色只做业务/焦点。
3. **圆角偏大**（16px 卡片、9999 pill）：宿主面板圆角上限 12px（`--dsw-radius-md`），外层壳才 28px。→ 卡片 8–12px，chip 才用 pill。
4. **正字距与 CJK**：+0.2px 在中文 13px 标签上会显得松散，且 `typography.md` 明确「CJK 不能用负字距」，正字距也要按 CJK 单独调（0 或 ≤0.02em）。→ 中文正文 0，英文/数字标签 +0.01em。

**借用清单**：浮层层级（菜单 `bg-layer-2` + `border-l2` + 唯一外阴影）、焦点蓝与强调分离、500 字重正文、`opacity` 过渡而非 hover 位移、命令面板的「输入框 + 结果列表 + 键盘提示」结构。

**不借**：玻璃拟态、双层 inset 环、键帽渐变、红色强调、16px+ 圆角、pill 化 CTA。

### 2.4 候选 C：`mission-control`（第三，借结构）

路径：`$OD/design-systems/mission-control/{DESIGN.md,tokens.css}`

**DESIGN.md 关键段**：

> “A **deep space command center** — dark, information-dense, unambiguous. Every pixel earns its place.”（L8）

> “*Every readout must be readable at 3 meters in low light by someone who hasn't slept in 18 hours.*”（L23）

> “Primary Data `#FFB800`（telemetry）/ Accent `#00D4FF`（active/healthy）/ Alert `#FF4757`”（L10–21 的调色板表）

**tokens.css 核心值**（注意：**与 DESIGN.md 不一致**）：`--bg #090b12`、`--surface #121722`、`--fg #f8fafc`、`--fg-2 #cbd5e1`、`--muted #94a3b8`、`--border #2a3447`、`--accent #60a5fa`、`--success #26de81`、`--warn #fbbf24`、`--danger #ff4757`、`--text-xs 11 / sm 12 / base 14 / lg 16`、`--leading-body 1.45`、`--radius-sm/md/lg 10/16/24`、`--motion-fast 100ms`。

**适配理由**：11–14px 主字阶 + 1.45 行高 + 「状态优先、每个像素有职责」的信息结构，最接近「多人并发看板」需要的东西；它的数据行（label + 数值 + 状态点）可以直接改写为任务行。

**风险 / 不借**：amber-on-navy 的指挥中心人格与 DSH 石墨中性完全不兼容；四个数据色违反「状态色 ≤3 种/屏」；`--radius-sm 10px` 不在宿主档位（4/8/12/16/20/28）。**只借结构，不借任何颜色与半径。**

### 2.5 明确不采用的四个

| 包 | 决定性理由 |
|---|---|
| `vercel` | `--bg #ffffff`、`--fg #171717`：亮色优先。shadow-as-border 的思想可以偷（宿主已有 `elev-ring`），但整套 token 与「暗色优先」相反 |
| `dashboard` | **自相矛盾**：DESIGN.md 写「dark-themed cloud-platform」，`tokens.css` 却是 `--bg #f4f7fb`、`--surface #ffffff`；且是 glass-like panels（§1 视觉风格），正是本文 §7 反对的 |
| `cursor` | 亮色暖奶油 `#f2f1ed` + 衬线正文 jjannon + `#f54e00` 橙：嵌进冷灰宿主会像一张贴纸；三声部字体与本项目「一套系统字体」冲突 |
| `opencode-ai` | 暖红近黑 `#201d1d` + 唯一字体 Berkeley Mono。Berkeley Mono 无 CJK 字形，中文落回 PingFang，等宽对齐立刻断裂；Apple HIG 四语义色同时出现也违反单强调纪律 |

### 2.6 从候选到宿主：token 映射表（**不要粘贴 `tokens.css`**）

| 语义 | 宿主 token（暗 / 亮） | 采用值来自 | 说明 |
|---|---|---|---|
| 画布 | `--dsw-alias-bg-base`（`#151517` / `#fff`） | 宿主 | 不用 Linear 的 `#08090a` |
| 面板/卡 | `--dsw-alias-bg-layer-1`（`#232324` / `#fff`） | 宿主 | 亮度阶第一档 |
| 浮层/菜单 | `--dsw-alias-bg-layer-2`（`#2c2c2e` / `#fff`）+ `border-l2` | 宿主 | 菜单可用宿主现成的半透明菜单面（暗 `#43454a73`） |
| 行/卡边界 | `--dsw-alias-border-l1`（`#ffffff0f` / `#0000000a`） | 宿主 + Linear 纪律 | 发丝线，不用实心深灰边 |
| 输入边 | `--dsw-alias-border-l2`；聚焦 `border-l3` + 2px 环 | Raycast 聚焦思路 | 不能只改 1px 边色（§4 P0-26） |
| 主文字 | `--dsw-alias-label-primary`（`#f9fafb` / `#0f1115`） | 宿主 | 不用纯白/纯黑的规定由宿主已满足 |
| 次文字 | `--dsw-alias-label-secondary`（`#cfd3d6` / `#61666b`） | 宿主 | 正文默认色 |
| 元数据 | `--dsw-alias-label-tertiary` / `-caption`（`#adb2b8`/`#81858c`） | 宿主 + Linear 的 fg/meta 分层 | 时间、计数、路径 |
| 唯一实心按钮 | `--dsw-alias-button-primary-fill`（暗=近白，亮=近黑） | 宿主 | **不要**引入紫色/绿色 CTA |
| 焦点/链接/进行中 | `--dsw-alias-state-business-primary`（`#7aaaff` / `#4176e6`） | 宿主 + Raycast 的「焦点≠强调」 | 与实心主按钮分工 |
| 状态 | `--dsw-alias-state-success/warn/error-primary` | 宿主 | 只用于点、徽标文字、错误行 |
| 交互底 | `--dsw-alias-interactive-bg-hover` / `-active` | 宿主 | 行 hover / 按下 |
| mono | `--ds-font-family-code` | 宿主 | 端口/PID/路径/hash/计数 |
| 圆角 | `--dsw-radius-xs/sm/md/lg = 4/8/12/16` | 宿主 | 面板内 8–12，chip 用 999，**不出现 6/10/22px** |
| 动效 | `--ds-ease-in-out` + `.1s/.2s/.3s` | 宿主 | 见 §4 |

**一句话**：候选包给的是**决策依据**（哪一档、什么纪律），宿主 token 才是**唯一实现层**。

---

## 3. 视觉方向建议（3 个，不是 1 个）

三个方向都在宿主 token 上成立，区别只在「借多少」与「放弃什么」。`03-strategy.md` 的 **Graphite Console** 是 A+B+C 的组合体，下面的 A/B/C 是它的可拆分来源。

### 方向 A：宿主原生 —— 「只借排版与状态语义」（基准，风险最低）

- **一句话定位**：面板看起来就是 DSH 自己长出来的一个工作面板，而不是一个「设计过的产品」。
- **借用**：`linear-app` 的三字重纪律、元数据降级色、发丝线；`mission-control` 的「状态优先」信息顺序；宿主全部 `--dsw-alias-*`。
- **放弃**：一切品牌色、所有 display 字号、所有装饰性阴影/渐变/玻璃、所有 16px+ 圆角。
- **落点**：`bg-base` + `border-l1` + `label-*` + 单一实心主按钮 + 6px 状态点。
- **风险**：容易「平」——没有品牌记忆点。补偿方式：靠**文案与结构**（具体动词、关系显式化）而不是靠颜色。
- **何时选**：如果只能做一版、且要保证亮/暗都成立，选它。

### 方向 B：Linear 式 —— 「极密列表 + 键盘优先」（列表页主力）

- **一句话定位**：任务/会话是 36–44px 的行，不是卡；元数据用 mono；hover 只亮一层，不动布局。
- **借用**：`linear-app` 的密度（8px 网格、10–16px 字阶、亮度阶代替阴影）；`raycast` 的「500 字重正文 + 键盘闭环 + 焦点蓝」。
- **放弃**：Linear 的 indigo 紫、72px display、9999 pill 化、`#08090a` 自设画布；Raycast 的玻璃与拟物环。
- **落点**：行高 36–44px、`gap` 0–4px、`bg-layer-1` 只在 hover/选中出现、行尾操作固定宽度占位；`j/k`、`Enter`、`x`、`e` 在行上闭环。
- **风险**：密度上去后**可读性**与**中文**双重压力——中文 12px 行距必须 ≥1.7（`typography.md` CJK 覆盖是硬规则），行高不能只按拉丁字母算。
- **何时选**：任务/会话/环境三个「列表型」表面（本次主要收益来源）。

### 方向 C：Raycast 式 —— 「命令面板 + 浮层」（⌘K 与派发）

- **一句话定位**：所有分散操作收敛到一个「输入即过滤、方向键即选择、Enter 即执行」的面板；危险动作留在浮层里二次确认。
- **借用**：`raycast` 的浮层层级（`bg-layer-2` + `border-l2` + 单一外阴影）、键帽提示（用 `border` + 等宽字实现，不用渐变）、「焦点色与强调色分离」。
- **放弃**：macOS 拟物（内阴影高光、玻璃、86px pill）、红色强调、macOS 交通灯。
- **落点**：⌘K 面板 560–640px 宽、居中、`bg-layer-2`、输入框无边框只有底发丝线；结果行 40px；底部 kbd 提示条。
- **风险**：命令面板是「给熟手加速」的，**不能成为唯一入口**；同时必须保证 Tab 也能走完全程（`03-strategy.md` G5）。
- **何时选**：面板已有 5 个以上主操作、且重复操作占比高时。

### 组合建议（与 `03-strategy.md` 对齐）

| 表面 | 用哪个方向 | 理由 |
|---|---|---|
| 外壳/头部/状态条 | **A** | 必须和宿主无缝，不能有「第二套设计」 |
| 任务/会话/环境列表 | **B** | 当前最大问题是「一任务一卡 + 8px 间距」导致一屏 6–7 条 |
| ⌘K / 派发 sheet / `⋯` 菜单 | **C** | 操作多、需要键盘闭环，浮层是唯一能收敛的地方 |
| 概览页的「注意力队列」 | **A + mission-control 的结构** | 状态优先的排序逻辑，配色仍用宿主 |

**判断方向是否成立的三个快照**（用 §6 的管线截）：① 暗色概览一屏能否 3 秒答出「什么在跑/什么卡住」；② 任务行在 hover、focus、选中三态下是否**只有一层亮度变化**、无位移；③ ⌘K 打开时是否仍是「一块面板」而不是「一个新应用」。

---

## 4. 评审 checklist（44 条，P0 必须 / P1 建议）

用法：P0 是合并门槛（不过不合并）；P1 必须记录「为什么这次不做」，不允许静默跳过。每条都写了判定方法，能靠截图/代码/键盘三选一验证。出处列是 `$OD/craft/*.md` 的文件名。

### 4.1 色彩与对比（7 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 1 | P0 | 面板只用宿主 `--dsw-alias-*` / `--ds-font-*` / `--dsw-radius-*`，无自造品牌色 | `grep -E '#[0-9a-fA-F]{3,8}' client.js` 看 CSS 段：除 `rgba(0,0,0,…)` 阴影外应为 0 | color.md |
| 2 | P0 | 单屏可见强调色 ≤2 处（唯一实心按钮 + 当前选中/焦点），不得出现第二强调色 | 截图数彩色元素个数：同屏 ≥3 个独立彩色元素（不含状态点）即超标 | color.md「At most 2 visible uses」 |
| 3 | P0 | 彩色像素占比：强调 5–10%、语义色 0–5%，中性 70–90% | 截图上高饱和色块面积目测；超过一屏 10% 即失败 | color.md 调色板四层 |
| 4 | P0 | 正文对比 ≥4.5:1；UI 边界与大字 ≥3:1；focus 指示与相邻 ≥3:1 | 宿主暗色 `label-secondary #cfd3d6` on `bg-layer-1 #232324` 约 10.5:1，安全；新增色必须实测 | accessibility-baseline |
| 5 | P1 | 暗色不用纯黑 `#000` / 纯白 `#fff` 做底与正文 | 宿主已是 `#151517`/`#f9fafb`；检查是否有局部覆盖 | color.md Dark themes |
| 6 | P1 | 边界优先半透明白（宿主 `l1 6% / l2 12% / l3 16% / l4 20%`），不用实心深灰边 | `grep border` 看是否有 `#23252a` 之类实心值 | color.md |
| 7 | P1 | 状态色只表达状态：同屏 ≤3 种状态色，且不用于装饰性描边/图标填充 | 目测：绿点 + 黄点 + 红字同时出现即已达上限 | anti-ai-slop / color.md |

### 4.2 排版与层级（8 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 8 | P0 | 字号档位收敛到 6–8 档（宿主 11/12/13/14/16/20/24）；当前插件有 9 档（18/13.5/13/12.5/12/11.5/11/10.5/10） | `grep -o 'font-size:[0-9.]*px' client.js \| sort -u \| wc -l` ≤8 | typography.md |
| 9 | P0 | ALL CAPS 必须 `letter-spacing ≥0.06em`；当前 `.dsh-hub-pill` 是 `.03em`、`.dsh-hub-menu-head` 是 `.05em`，均不达标 | 找到 `text-transform:uppercase` 的规则，看同块 `letter-spacing` | typography.md |
| 10 | P0 | 中文正文行高 1.7–1.8；≥32px 中文标题 1.3–1.4（**不能**用拉丁的 1.0–1.2） | 宿主 `--dsw-font-base-16` 是 16/24=1.5，中文段落必须显式 `line-height:1.7` 以上 | typography.md「CJK overrides — not optional」 |
| 11 | P0 | 不得对中文用负字距 | `grep 'letter-spacing:-' client.js`，若命中元素同时含中文即失败 | typography.md |
| 12 | P1 | 三字重（400 / 500 / 600），不出现 700+，也不出现「每个菜都加粗」 | `grep font-weight` 去重 ≤3 个值；统计 `600` 出现次数应集中于标题 | typography.md |
| 13 | P1 | 端口/PID/路径/hash/计数用 `--ds-font-family-code` + `font-variant-numeric: tabular-nums`，正文不用 mono | 看表格与元数据行 | typography.md + redesign-skill |
| 14 | P1 | 纯数字列右对齐或等宽对齐，切换数据时不抖动 | 截图两次不同数据叠加对比 | typography.md |
| 15 | P1 | 单屏一层「唯一入口」：标题或第一个数字明显领先，其余靠字重/颜色降级而非加粗 | 眯眼看截图，能否指出唯一主角 | typography-hierarchy.md |

### 4.3 状态覆盖（8 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 16 | P0 | 每个取数表面五态齐备：loading / empty / error / populated / edge | 断网、清空数据、构造超长标题各走一遍；缺一即失败 | state-coverage.md |
| 17 | P0 | 加载指示器按预期时长选型：0–300ms 无指示器；300ms–2s 轻量 spinner/skeleton；2–10s 结构匹配 skeleton 或带标签 spinner；15s 出现「比预期更久」 | DevTools 网络节流到 Slow 3G 计时，对照截图 | state-coverage.md 阈值表 |
| 18 | P0 | 错误必须回答三问：发生了什么 / 为什么（可知时）/ 用户能做什么；禁止「操作失败」单句 | 遍历每个 catch 分支的文案 | state-coverage.md |
| 19 | P0 | 错误保留用户输入（重试不清空表单、不丢筛选） | 提交失败后看字段是否还在 | state-coverage.md |
| 20 | P0 | 空态不是空白：首用 = 标题 + 一句说明 + 主 CTA；搜索空 = 回显查询 + 建议 | 逐空态截图 | state-coverage.md |
| 21 | P1 | 重试退避 2s/4s/8s，3 次后给「联系支持 + 可复制错误 ID」，并显示「上次尝试 Xs 前」 | 读代码 + 手动连点 | state-coverage.md |
| 22 | P1 | 边界不破版：200 字符标题、缺失可选字段、万行列表、超长路径 | 构造 fixture 截 `#/states` 页 | state-coverage.md 测试矩阵 |
| 23 | P1 | 局部加载不替换整页 chrome（只换该区域） | 触发单个请求看外壳是否闪 | state-coverage.md |

### 4.4 交互 / 焦点 / 键盘（9 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 24 | P0 | **hover 才出现的操作必须也可通过键盘/焦点访问**（当前 `.dsh-hub-menu-open` 只在 `:hover` 显示，是典型反例） | 纯键盘 Tab 走一遍，所有行尾操作必须依次显形；CSS 需有 `:focus-visible` / `:focus-within` 分支 | laws-of-ux + accessibility-baseline |
| 25 | P0 | 交互元素用原生 `<button>` / `<a href>`，不用 `<div role="button">`；禁用态用 `disabled` 属性 | `grep 'role="button"'` 应为 0 | accessibility-baseline |
| 26 | P0 | 焦点可见：`:focus-visible` 有 ≥2px、对比 ≥3:1 的环；**不能只改 1px `border-color`**（当前 `.dsh-hub-input:focus` 就是只改边色） | 键盘 Tab 后截图；或查 `:focus` 规则是否只有 `border-color` | accessibility-baseline Focus visibility |
| 27 | P0 | 目标尺寸 ≥24×24 CSS px（AA 地板）；行内小图标按钮用 24px 间距例外，不得互相覆盖 | 量：图标按钮实际命中区 | accessibility-baseline |
| 28 | P0 | 状态变化有 ARIA 通道：错误 `role="alert"`、加载/成功 `role="status"`；live region 先于内容存在 | 检查 DOM 顺序与 `aria-live` | state-coverage.md |
| 29 | P1 | 浮层/菜单支持 Esc 关闭、焦点返回触发元素；对话框是 focus-trap 且 `role="alertdialog"`（危险动作） | 键盘实测 | accessibility-baseline + state-coverage |
| 30 | P1 | 行级操作区**固定宽度占位**，hover/聚焦出现时不推动文字（Layout shift = 0） | 截 hover 前后两张，用 §6 的图对比 | laws-of-ux Law of Similarity |
| 31 | P1 | 高频操作有键盘闭环与提示（`⌘K`、`n`、`/`、`j/k`、`Enter`、`x`、`e`、`Esc`），提示用等宽 kbd 而不是 emoji | 面板内按一遍；提示条存在 | anti-ai-slop「kbd hint = soul」 |
| 32 | P0 | 状态不能只靠颜色：点/徽标必须同时有文案或图标形状 | 把截图去色（取亮度通道）后仍能区分状态；或直接看状态点/文案是否成对出现 | accessibility-baseline + state-coverage |

### 4.5 动效（5 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 33 | P0 | 时长：hover/按下 50–100ms；状态确认 150ms；浮层 200–300ms；任何非跨屏过渡 ≤500ms | `grep transition` 与 `animation-duration` | animation-discipline.md |
| 34 | P0 | `transform/translate/scale/rotate` 类动效必须包在 `@media (prefers-reduced-motion: reduce)` 下；opacity/color 可保留 | `grep prefers-reduced-motion` 存在且覆盖 transform | animation-discipline.md |
| 35 | P1 | 只动「已发生的状态变化」（确认），不做「表演」；乐观 UI 先行，动效第二 | 逐个动效问：它确认了什么状态？ | animation-discipline.md |
| 36 | P1 | 循环动效有上限：骨架 shimmer 在内容到达即停；spinner 60s 必须停并转错误/取消 | 断网等待 60s 观察 | animation-discipline.md |
| 37 | P1 | 不自造缓动曲线：用宿主 `--ds-ease-in-out: cubic-bezier(.4,0,.2,1)` 与 `.1s/.2s/.3s` | `grep cubic-bezier` 应只有宿主值 | 宿主 theme token |

### 4.6 防 AI 味 / 内容 / 形状（7 条）

| # | 级别 | 检查项 | 怎么判 | 出处 |
|---|---|---|---|---|
| 38 | P0 | 禁止 emoji 当图标（`✨🚀🎯⚡🔥💡`）；图标用 1.5–1.8px 描边单线 SVG + `currentColor` | `node -e "const s=require('fs').readFileSync('client.js','utf8');console.log([...s].filter(c=>/\\p{Extended_Pictographic}/u.test(c)).length)"` 应为 0 | anti-ai-slop 七宗罪 #3 |
| 39 | P0 | 禁止默认 indigo（`#6366f1 #4f46e5 #4338ca #3730a3 #8b5cf6 #7c3aed #a855f7`）、双色 trust 渐变、发光 | `grep` 七个 hex + `linear-gradient`（除骨架微光外应为 0） | anti-ai-slop #1 #2 + color.md |
| 40 | P0 | 禁止编造指标与填充文案（「10× 更快」「99.9%」「功能一/二/三」「lorem」） | 逐一读可见文案，必须指向真实字段 | anti-ai-slop #6 #7 |
| 41 | P1 | 圆角只用宿主档位 4/8/12/16/20/28；同类组件同半径（当前插件出现 6px 与 10px，均不在档位） | `grep -o 'border-radius:[0-9]*px' \| sort -u` | 宿主 token + anti-ai-slop |
| 42 | P1 | 禁止「圆角卡片 + 彩色左边框」的 AI 仪表盘形状（当前 `.dsh-hub-reply` 是 `border-left:2px` + `0 8px 8px 0` 的同型结构，建议改为缩进 + `bg-base` 底） | 截图找左彩边卡 | anti-ai-slop #5 |
| 43 | P1 | 文案是产品语而不是系统语：用动词 + 对象（「扫描工作区」而不是「开始」）；不把 `rev 3`、`session-xxxx` 直接给用户 | 通读所有按钮与状态文案 | anti-ai-slop「soul」+ `03-strategy.md` §3 |
| 44 | P1 | 一屏内「同类元素同 treatment」：所有行同样 class 集、所有次按钮同一外观、所有破坏性动作同一外观 | 对比截图，异常项只能是「当前选中」或「推荐项」 | laws-of-ux Law of Similarity |

### 4.7 怎么跑（一次评审 ≈ 20 分钟）

1. 用 §6 的 `shot.sh` 截 10 张：`{now,tasks,board,sessions,settings}×{dark,light}` + `states` 页。
2. 逐张过 §4.1/4.2/4.6（纯静态项，5 分钟）。
3. 键盘走一遍主路径（打开 → 筛选 → 新建 → 派发 → 完成 → 撤销 → ⌘K），过 §4.4（5 分钟）。
4. 断网 + Slow 3G + 空数据，过 §4.3（5 分钟）。
5. 打开 DevTools 的 Rendering → `prefers-reduced-motion: reduce`，过 §4.5（2 分钟）。
6. 结果写回 `03-strategy.md` 的验收清单；P0 未过不进 P 阶段验收。

---

## 5. OpenDesign 安全工作流（不打扰用户的 App）

### 5.1 边界（硬规则）

| 允许 | 禁止 |
|---|---|
| 直接 `read` `$OD/**` 下的文件 | POST/PUT/DELETE 任何 daemon 路由 |
| `curl -s` 只读 GET `/api/health` `version` `design-systems` `design-templates` `skills` `craft` | `curl` `/api/projects` 后摘抄项目内容（隐私） |
| 用 `$OD` 里的值做我们自己的 CSS 决策 | 写 `$OD`、写 `~/Library/Application Support/Open Design/**` |
| 在 `docs/redesign/` 里引用路径与行号 | 触发 OD agent run、新建/打开 OD 项目、改用户项目文件 |

工程上还能再加一层保险：所有读取都用绝对路径直读 payload 目录（versioned，只读），**不经过正在运行的 App**；daemon 只当「目录清单 + 版本」用。

### 5.2 四种用法（按投入产出排序）

1. **复用 craft 规则做评审**（收益最高）：把 `craft/*.md` 的条目抄成 §4 的 checklist（已做）。注意区分：`anti-ai-slop.md` 的 P0 是 OD linter 自动查的，其余是 guidance；OD 不会替我们查状态/焦点/动效，所以 §4 才要写「怎么判」。
2. **用 design-systems 的 token 做视觉校准**：只取「档位与纪律」——例如「暗色层级用亮度阶」「发丝线半透明」「meta 用第四级灰」「只有一个实心按钮」；取值全部落回宿主 `--dsw-*`（§2.6）。**禁止**把 `tokens.css` 整段贴进插件（会覆盖宿主主题，见 §7）。
3. **用 `frames/` 做展示**（仅汇报用）：`browser-chrome.html` 是浅色 Safari 壳，把暗色面板套进去会误导评审（壳体亮、面板暗，看起来像两套主题）。建议：**交付截图默认裸面板 1120×760**；确实需要「宿主语境」时，自己写一个 24px 边距 + `bg-base` 的中性包裹层，而不是用 OD 的浏览器壳。若一定要用：`open -a "Google Chrome" "file://$OD/frames/browser-chrome.html?screen=file:///abs/path/prototype.html&url=127.0.0.1:60964"`（浏览器打开本地 file://，不写 OD；注意 `?screen=` 要传 file:// 绝对路径）。
4. **把原型交给用户在 OD 里看**（只给建议，不操作）：OD 的项目/产物由它自己的 launcher 管理（`.../namespaces/release-stable/data/artifacts/`），**不要**替用户丢文件进去。推荐路径：把单文件原型放在 repo 的 `docs/redesign/prototype/index.html`，需要时让用户自己在 OD 里「新建项目 → 导入本地 HTML / 粘贴 file:// 路径」，或直接在浏览器打开。我们只提供 `file://` 路径与截图，不碰 App 状态。

### 5.3 什么时候「不该用 OD」

- 需要**最终实现**时：OD 的产物是单文件 HTML 原型，我们的交付是 `client.js` 里的 cordis 插件 + 宿主 token，直接写更可控。
- 需要**像素级对齐宿主**时：OD 的样例都是独立页面，没有宿主上下文；只有 craft 与 token 值可复用。
- 需要**多状态截图**时：用我们自己的 §6 管线，而不是让 OD agent 去生成。

---

## 6. 截图 / 渲染管线（已验证）

### 6.1 已验证的环境事实

| 项 | 值 |
|---|---|
| Chrome | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`，`155.0.8059.85` |
| Node / npm | `v26.5.0` / `11.17.0` |
| 单张耗时 | 3.5–5.8s/张（冷启约 4.8s；含 `--virtual-time-budget=1500`，随尺寸与 1×/2× 浮动） |
| 产出 | 1440×900 → 26,710 B；1120×760@1× → 约 42 KB；1120×760@2× → 2240×1520、约 95 KB |
| 噪声 | stderr 的 `CVDisplayLinkCreateWithCGDisplay failed`、`task_policy_set …` **无害**，忽略 |
| 图像工具现状 | ImageMagick（`magick`）与 `python3`/PIL 在本机**均因缺 dylib 不可用**；校验必须用 Node（`zlib` 解 PNG）或 `sips` |

### 6.2 命令模板（必给）

```bash
# 任务书要求的原始模板（本机实测可用）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,900 --screenshot=out.png "file:///abs/path/page.html"

# 包成变量后等价，便于复用
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 基本：整幅 1440×900
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,900 \
  --screenshot=out.png "file:///abs/path/page.html"

# 面板实际宽度 + 2×（评审用：文字锐利）
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1120,760 \
  --virtual-time-budget=1500 \
  --screenshot=out@2x.png "file:///abs/path/page.html?theme=dark&state=empty"
```

参数说明（都实测过）：

- `--headless=new`：统一用 new headless（旧 headless 在 132+ 已合并/移除，`--headless` 不再保证行为）。
- `--disable-gpu` + `--hide-scrollbars`：避免 GPU 差异与滚动条占宽导致截图宽度不一致。
- `--force-device-scale-factor=2`：**不是**改 CSS 像素，输出为 2 倍位图（1000×700 → 2000×1400），评审看字用。
- `--window-size=W,H`：CSS 视口尺寸；也是唯一的「裁切」手段（Chrome headless 无 crop 参数）。
- `--virtual-time-budget=1500`：让字体/首屏动画在 1.5s 虚拟时间内稳定后再截；对本地 file:// 同样生效（实测输出字节数与不加时一致，说明页面已稳定）。
- `--default-background-color=00000000`：仅当页面本身透明时才需要；我们的页面有 `bg-base`，实测无 alpha 通道，不用加。

### 6.3 主题：DSH 不是 `prefers-color-scheme`，是 `body[data-ds-dark-theme]`

这是最容易踩的坑。宿主的主题实现（`@deepseek-ai/dsh-client-ui-theme@0.2.1-rc.2`）是：

- **暗色** = `<body data-ds-dark-theme>` 存在
- **亮色** = 该属性**不存在**
- 两套 `--dsw-alias-*` 分别挂在 `body{…}` 与 `body[data-ds-dark-theme]{…}` 上（`--dsw-static-neutral-bluish-*` 等底层色板另挂在 `:root`/`body`）

所以截图时：

- 不要传 `--force-dark-mode`（那是给 `prefers-color-scheme` 页面用的，对属性切换无效）。
- **harness 必须自己读 `?theme=` 并设置/移除 `document.body.dataset.dsDarkTheme`**（`dataset.dsDarkTheme='1'` 即属性名 `data-ds-dark-theme`）。本文 §6.4 的 fixture 就是按这个写的，实测亮/暗都能正确出图（亮色 `meanLum≈252.9`，暗色 `≈27.3`）。

**token 值的来源（重要修正）**：任务书里给的
`.../@deepseek-ai/dsh-web-frontend/dist/assets/index-BxpfOGf3.css`
**只有 `var(--dsw-alias-*)` 的引用，没有值**。值在主题包里：

```
/Users/unclet/Projects/snippets/zvid/dsh-plugins/.tools/asar-all/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js
（原始位置：/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme）
```

实测得到的两套关键值：

| token | 暗色 | 亮色 |
|---|---|---|
| `bg-base` | `#151517` | `#ffffff` |
| `bg-layer-1/2/3` | `#232324` / `#2c2c2e` / `#353638` | `#ffffff` ×3 |
| `label-primary` | `#f9fafb` | `#0f1115` |
| `label-secondary` | `#cfd3d6` | `#61666b` |
| `label-tertiary` | `#adb2b8` | `#81858c` |
| `label-primary-foreground` | `#0f1115` | `#ffffff` |
| `brand-primary` | `#f9fafb` | `#0f1115` |
| `button-primary-hover` | `#ebeef2` | `#43454a` |
| `border-l1/2/3/4` | `#ffffff0f` / `#ffffff1f` / `#ffffff29` / `#ffffff33` | `#0000000a` / `#0000001a` / `#0000001f` / `#00000029` |
| `interactive-bg-hover/active` | `#ffffff14` / `#ffffff24` | `#2631480f` / `#2631481a` |
| `state-business-primary`（= `link`） | `#7aaaff` | `#4176e6` |
| `state-success/warn/error-primary` | `#22c55e` / `#f59e0b` / `#f25a5a` | `#22c55e` / `#f59e0b` / `#ec1313`（只有 error 不同） |
| `state-idle-primary` | `#545557` | `#d4d4d4` |

字阶（`--dsw-font-*`）：`xxxs-11` 11/14 · `xxs-12` 12/18 · `xs-13` 13/20 · `s-14` 14/22 · `base-16` 16/24 w400 · `m-18` w500 16/28 · `l-20` w500 20/28 · `xl-24` w600 24/32。
圆角：`xs 4 / sm 8 / md 12 / lg 16 / xl 20 / panel 28`。
字体：正文 `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", …`；代码 `"SF Mono", "JetBrains Mono", "Fira Code", Consolas, …`；品牌字（仅登录/启动）Montserrat。
动效：`--ds-ease-in-out: cubic-bezier(.4, 0, .2, 1)`；`.1s / .2s / .3s`。

### 6.4 必备：截图 harness 的 token fixture

插件 CSS **没有为 `--dsw-*` 写 fallback**（例如 `background:var(--dsw-alias-bg-base)`），所以脱离宿主单独截图时会退化成浏览器默认样式（白底、无发丝线、主按钮透明）。harness 必须带一份「宿主 token 快照」：

```css
/* DSH token fixture — 值来自 dsh-client-ui-theme@0.2.1-rc.2，暗/亮两套 */
:root{
  --dsw-static-neutral-bluish-00:#fff; --dsw-static-neutral-bluish-50:#f9fafb;
  --dsw-static-neutral-bluish-300:#cfd3d6; --dsw-static-neutral-bluish-400:#adb2b8;
  --dsw-static-neutral-bluish-600:#81858c; --dsw-static-neutral-bluish-700:#61666b;
  --dsw-static-neutral-bluish-750:#43454a; --dsw-static-neutral-bluish-800:#353638;
  --dsw-static-neutral-bluish-850:#2c2c2e; --dsw-static-neutral-bluish-875:#232324;
  --dsw-static-neutral-bluish-950:#151517; --dsw-static-neutral-bluish-1000:#0f1115;
  --dsw-static-neutral-bluish-100:#ebeef2;
  --dsw-static-neutral-300:#d4d4d4; --dsw-static-neutral-600:#545557;
  --dsw-static-deepseek-400:#7aaaff; --dsw-static-deepseek-500:#4176e6;
  --dsw-static-green-500:#22c55e; --dsw-static-amber-500:#f59e0b;
  --dsw-static-red-400:#f25a5a; --dsw-static-red-600:#ec1313;
  --dsw-font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",Helvetica,Arial,sans-serif;
  --ds-font-family-code:"SF Mono","JetBrains Mono","Fira Code",Consolas,Menlo,"PingFang SC","Microsoft YaHei";
  --dsw-radius-xs:4px; --dsw-radius-sm:8px; --dsw-radius-md:12px; --dsw-radius-lg:16px;
}
html{height:100%}
body{margin:0;min-height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);
  font-family:var(--dsw-font-family);font-size:13px;line-height:20px}
body{
  --dsw-alias-bg-base:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-bg-layer-3:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-border-l1:#0000000a; --dsw-alias-border-l2:#0000001a;
  --dsw-alias-border-l3:#0000001f; --dsw-alias-border-l4:#00000029;
  --dsw-alias-label-primary:var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-700);
  --dsw-alias-label-tertiary:var(--dsw-static-neutral-bluish-600);
  --dsw-alias-label-primary-foreground:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-button-primary-fill:var(--dsw-alias-brand-primary);
  --dsw-alias-button-primary-hover:var(--dsw-static-neutral-bluish-750);
  --dsw-alias-interactive-bg-hover:#2631480f; --dsw-alias-interactive-bg-active:#2631481a;
  --dsw-alias-state-idle-primary:var(--dsw-static-neutral-300);
  --dsw-alias-state-success-primary:var(--dsw-static-green-500);
  --dsw-alias-state-warn-primary:var(--dsw-static-amber-500);
  --dsw-alias-state-error-primary:var(--dsw-static-red-600);
  --dsw-alias-state-business-primary:var(--dsw-static-deepseek-500);
}
body[data-ds-dark-theme]{
  --dsw-alias-bg-base:var(--dsw-static-neutral-bluish-950);
  --dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-875);
  --dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-850);
  --dsw-alias-bg-layer-3:var(--dsw-static-neutral-bluish-800);
  --dsw-alias-border-l1:#ffffff0f; --dsw-alias-border-l2:#ffffff1f;
  --dsw-alias-border-l3:#ffffff29; --dsw-alias-border-l4:#fff3;
  --dsw-alias-label-primary:var(--dsw-static-neutral-bluish-50);
  --dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-300);
  --dsw-alias-label-tertiary:var(--dsw-static-neutral-bluish-400);
  --dsw-alias-label-primary-foreground:var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-50);
  --dsw-alias-button-primary-fill:var(--dsw-alias-brand-primary);
  --dsw-alias-button-primary-hover:var(--dsw-static-neutral-bluish-100);
  --dsw-alias-interactive-bg-hover:#ffffff14; --dsw-alias-interactive-bg-active:#ffffff24;
  --dsw-alias-state-idle-primary:var(--dsw-static-neutral-600);
  --dsw-alias-state-success-primary:var(--dsw-static-green-500);
  --dsw-alias-state-warn-primary:var(--dsw-static-amber-500);
  --dsw-alias-state-error-primary:var(--dsw-static-red-400);
  --dsw-alias-state-business-primary:var(--dsw-static-deepseek-400);
}
```

### 6.5 harness 契约与「局部状态」

**契约**（`shot.sh` 按这个拼 query）：

```
page.html?theme=dark|light&state=populated|empty|loading|error|edge&<任意 k=v>
```

harness 里只需要几行：

```js
const q = new URLSearchParams(location.search);
const theme = q.get('theme') || 'dark';
if (theme === 'light') document.body.removeAttribute('data-ds-dark-theme');
else document.body.setAttribute('data-ds-dark-theme', '1');
document.body.dataset.state = q.get('state') || 'populated';
```

**与当前原型的差距（需要 Lead 决策）**：`docs/redesign/prototype/index.html` 目前用 `<html data-theme="dark">` + `localStorage["dsh-hub-proto:theme"]` 控制主题，**不读 `?theme=`**，也不读 `?state=`。两种对齐方式：

1. **推荐**：原型改用与宿主一致的 `data-ds-dark-theme` 语义（`document.body.toggleAttribute('data-ds-dark-theme', dark)`），并加 4 行 query 解析（`theme` / `state` 两个参数）。这样 `shot.sh` 与真实宿主同一套语义，评审截图不会「两套主题机制」。
2. 临时：亮色截图用 playwright `addInitScript` 预置 `localStorage`，或先用原型自己的主题按钮切好再截（无法批量化）。

在原型改完前，`shot.sh` 仍能截暗色（原型默认 `data-theme="dark"`），只是 `?theme=light` 会被忽略——**看 `meanLum` 就能发现（亮色应 >200）**。

三种「截局部」的做法（按可靠性排序）：

1. **状态参数（推荐）**：同一页面渲染不同状态，`?state=` 切换。实测 4 个状态一次跑完，产物 md5 各不相同（`populated` 9,789 B / `empty` 20,401 B / `loading` 12,930 B / `error` 18,399 B），说明状态真的生效了。
2. **临时包装 HTML**：用 iframe 把目标页放进固定尺寸容器（`<iframe width=900 height=600>`），对整个包装页截图；适合要「带上下文」的局部。注意 iframe 里同样要能读到 query。
3. **`--window-size` 裁切**：只对「页面顶部/左栏」有效；不能精确定位到某个元素。

两条硬注意：

- **hash 路由**（`index.html#/now`）必须把 query 放在 `#` 之前（`index.html?theme=dark#/now`），否则页面读不到 `location.search`；`shot.sh` 已处理这一点。
- **不要**用 `--window-size` 去截「某个弹层」——弹层定位依赖真实视口，改视口会改变布局。

面板尺寸建议：**1120×760**（主内容区典型值，1× 评审）/ **1120×760@2×**（看字）/ **900×700**（窄屏回归）。整页语境用 **1440×900**。

### 6.6 产物检查：尺寸 + 是否空白 + 多状态是否真的不同

没有 ImageMagick/PIL 也能查——**PNG 是 zlib 压缩的 scanline，Node 自带 `zlib` 就能解**。`tools/design/shot.sh` 内置了这段检查（约 45 行，无依赖），判定标准：

| 检查 | 方法 | 通过标准 |
|---|---|---|
| 尺寸 | `sips -g pixelWidth -g pixelHeight file.png`（或脚本内解析 IHDR） | 等于 `--window-size × --scale` |
| 是否空白 | 解 PNG → 采样 ≤20 万像素 → 算亮度标准差与颜色数 | `stddev ≥ 1.5` 且 `distinct colors ≥ 8`；纯色页实测 `stddev=0, colors=1`，会 exit 2 |
| 状态是否真的不同 | 对同名状态产物 `md5 -q` | 每个状态 md5 唯一；若两个状态相同 → 状态没生效或渲染被遮挡 |
| 文件大小 | `ls -l` | 参考：900×600 纯色 ≈ 2.9 KB；1120×760 有内容 ≈ 22–100 KB（1×） |
| 主题是否真的不同 | 平均亮度 `meanLum` | 暗色 ≈ 20–30，亮色 ≈ 250+；两者接近 = 主题没切 |
| 内容是否真的渲染了 | `colors` 与 `sdLum`（脚本默认阈值 `50 / 8`） | 低于阈值时 `shot.sh` 打印 `WARN`；`--strict` 直接失败 |
| 实测对照 | — | 纯色页 `colors=1, sd=0`；**只有外壳**（原型 JS 未完成时）`colors=18, sd=5.09`；正常内容页 `colors≈350–630, sd≈17–22` |

脚本会自动打印一份 JSON，例如：

```json
{"file":".../shot.png","w":2240,"h":1520,"meanLum":27.05,"sdLum":21.18,"colors":519,"bytes":95636}
```

### 6.7 `playwright` 值不值得引入？

**结论：值得，但只作为「多状态 + 交互态」的第二档工具，不进主流程。** 理由与实测：

- 安装：`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright@1.64.1` 在临时目录 **4 秒装完（2 个包）**；本机 `~/Library/Caches/ms-playwright` 里已有 `chromium-1169/1223/1228`，但**根本不需要它们**——用 `chromium.launch({ channel: 'chrome' })` 直接复用系统 Chrome（155），版本不匹配问题消失。
- 实测：4 个状态 @2× + hover 态 + focus 态，**872ms** 全部跑完（Chrome 逐次冷启约 15–20s）；产物 1800×1200@2×，hover 与 focus 的 md5 不同，`document.activeElement` 能读出来（`BUTTON`，`outline: auto 1px`）。
- 它能做而 Chrome 旗标做不到的：hover/focus/键盘态、等待网络空闲、滚动到某元素、`fullPage: true` 整页长图、断言单元素的位置/颜色。
- 什么时候不用它：只要 3 张以内静态图、或要在「零安装」环境跑——Chrome 旗标更快更省事。

命令模板（最小可复现）：

```bash
mkdir -p /tmp/pw && cd /tmp/pw && npm init -y >/dev/null
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright@1.64.1 --no-audit --no-fund
```

```js
// shoot.mjs —— 复用系统 Chrome，多状态 + 交互态
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1120, height: 760 }, deviceScaleFactor: 2 });
const url = 'file:///abs/path/states.html';
for (const state of ['populated', 'empty', 'loading', 'error', 'edge']) {
  await page.goto(`${url}?theme=dark&state=${state}`);
  await page.screenshot({ path: `screens/${state}-dark@2x.png` });   // fullPage: true 可截长页
}
// 交互态：hover / focus / 展开 —— 这是旗标方案拿不到的
await page.goto(`${url}?theme=dark&state=populated`);
await page.locator('.dsh-hub-row').first().hover();
await page.screenshot({ path: 'screens/row-hover-dark@2x.png' });
await page.keyboard.press('Tab');
console.log(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle));
await browser.close();
```

**成本提示**：`npm i playwright` 会写 `node_modules/` 与 lockfile——**不要**把它加到插件 `package.json` 的依赖里（插件应保持零前端依赖）；放在 `tools/design/` 的独立临时目录或 `/tmp` 下用。

### 6.8 `tools/design/shot.sh`（本次交付的脚本）

```bash
# ① 面板尺寸、暗色：可直接跑当前原型（原型默认就是暗色视图）
tools/design/shot.sh --file docs/redesign/prototype/index.html \
  --theme dark --size 1440x900 --out docs/redesign/screens/01-now-dark.png

# ② 多状态：需要 harness 实现 §6.5 的 ?state= 契约
tools/design/shot.sh --file /abs/path/harness.html \
  --state empty --theme dark --size 1120x760 --scale 2 \
  --out docs/redesign/screens/empty-dark@2x.png

# ③ 只校验已有产物（CI / 复查用，不重新截图）
tools/design/shot.sh --check docs/redesign/screens/create-dark@2x.png

# ④ 跑本地 dev server 上的原型（#/now 这类 hash 路由会保留；?theme= 会自动插在 # 之前）
tools/design/shot.sh --url 'http://127.0.0.1:8000/index.html#/now' --theme dark --out /tmp/now.png
```

已实测（本文 §6.4 fixture + 插件真实 CSS 的 harness）：暗色 1× 1120×760 → 22,662 B / `meanLum 23.91`；暗色 2× → 2240×1520 / 50,349 B；亮色 1× → `meanLum 253.64`；纯色页会以 exit 2 拒绝。

```bash
# 内容密度不达标即失败（用于 CI / 「截图必须非空壳」）
tools/design/shot.sh --file docs/redesign/prototype/index.html \
  --theme dark --size 1440x900 --strict --out docs/redesign/screens/01-now-dark.png
```

**快照（2026-10-22 09:51）**：此时 `docs/redesign/prototype/index.html` 只有外壳（header/strip/nav 已挂载、`#content` 为空），截图得到 `colors=18, sd=5.09` → `WARN`；这是**原型侧的 JS 尚未渲染**，不是管线问题（`--strict` 会拦下）。原型完成后请重截并用 `--strict` 复核。

### 6.9 已知局限（先说清楚）

1. **截不到「真实宿主里的面板」**：`dsh web` 需要认证（实测访问 `127.0.0.1:60964` 返回 `dsh web authentication required`），headless 无法带 Cookie 进宿主。→ 我们截的是「同一份 HTML/CSS + 宿主 token fixture」的 harness；**像素级最终确认仍需在真实页面上人工看一遍**（README 里也已标注「未验证像素级视觉」）。
2. **字体**：面板用系统字体，Chrome headless 与宿主同机同字体栈，通常一致；但中文行高在不同 macOS 版本上会有 1px 级差异，评审看「比例」不看「绝对像素」。
3. **动效**：单帧截图看不到 transition；要审动效得用 `playwright` 或录屏，不在本管线范围。
4. **`file://` 的 iframe/fetch 限制**：harness 若要 fetch 本地 JSON 会被 CORS 拦；用内联数据或 `--allow-file-access-from-files`（仅调试用）。

---

## 7. 不采用清单（明确反对）

| # | 方向 | 为什么不做 |
|---|---|---|
| 1 | **Apple / macOS 拟物克隆**（交通灯、macbook/iphone 外框、Raycast 玻璃键帽、内阴影高光） | 面板是嵌在 Web 应用主内容区的一块界面，不是独立 App。拟物 chrome 会与宿主扁平的 `border-l1` + 亮度阶层级直接打架，并暗示「这是个可拖动的窗口」。`frames/` 只用于汇报，不进产品 |
| 2 | **大面积玻璃拟态 / `backdrop-filter`** | 宿主只在菜单层用半透明（暗 `#43454a73`），正文区是实色；在面板里铺 blur 会让滚动性能掉一档，且亮色下几乎不可见。最多允许菜单/浮层沿用宿主已有的半透明面 |
| 3 | **渐变 / 发光 / 双色 trust 渐变** | `color.md` 与 `anti-ai-slop.md` 双重点名：hero 双色渐变是第二可靠的 AI tell；发光在暗色下会破坏「亮度即层级」的唯一判据。骨架微光（shimmer）只在等待期且 ≤ 内容到达 |
| 4 | **第二强调色**（indigo 紫、品牌绿、橙） | 宿主暗色的彩色只有 `state-business-primary #7aaaff` + 三个状态色，实心主按钮是近白。再加紫色/绿色 = 两套强调；也会让「哪个是主操作」失去唯一答案 |
| 5 | **emoji 当图标** | OD linter 的 P0；且 emoji 在暗色下颜色不可控（不同系统字形不同），与 16px 单线 SVG 混排会破坏基线 |
| 6 | **过度动效**（hero 编排、视差、hover 位移、数字滚动、循环脉冲） | `animation-discipline.md`：动效只做「已发生状态的确认」，非跨屏 >500ms 即失败；工作型界面里的装饰动效属于明确的 common mistake。行新增 160ms 淡入 + 2px 上移已是上限 |
| 7 | **巨型 display 字号**（Linear 72px / Vercel 48px） | 面板宽 900–1120px，72px 标题会占掉 1/6 屏高却零信息量；宿主字阶最大 24px（`xl-24`），面板内原则上不超过 20px |
| 8 | **全站 pill 化 / 16px+ 圆角** | 宿主圆角档位 4/8/12/16/20/28，面板内应用 8（行/输入）与 12（卡/浮层）；`9999` 只给 chip 与状态胶囊。当前插件的 6px/10px 与 22px 都属于「不在档位」 |
| 9 | **自建 token 层**（`--hub-*` 覆盖 `--dsw-*`） | 一覆盖，宿主切主题就失效；当前插件的 `#adb2b8`/`#cfd3d6` 硬编码就是这类问题（恰好等于暗色 `label-tertiary/secondary`，亮色下会错） |
| 10 | **引入 Tailwind / 第三方组件库 / 图标包** | 面板是 2232 行的 cordis 插件 + 内联 CSS，无构建链；引入构建会改变发布形态，且体积/主题一致性都退化。`03-strategy.md` §13 已明确不做 |
| 11 | **把 OD 的模板/`example.html` 当原型交付** | 它们的宽度、字体、亮暗假设都是独立页面；直接改会带来「看起来像另一个产品」的风险，且无法在宿主 token 下自洽 |
| 12 | **亮色优先体系直接搬**（Vercel/Dashboard/Cursor 的整段 token） | 宿主是暗色优先，两套 token 并存必然漂移；我们只在暗色 token 上设计，亮色由宿主自动给出（`--dsw-alias-*` 两套已就绪） |

---

## 附录 A · 关键路径速查

```
# OpenDesign 根
$OD = /Users/unclet/Library/Application Support/Open Design/launcher/channels/stable/namespaces/release-stable/versions/0.26.0/payload/Open Design.app/Contents/Resources/open-design

$OD/craft/{laws-of-ux,state-coverage,accessibility-baseline,animation-discipline,anti-ai-slop,typography,typography-hierarchy,color,form-validation,rtl-and-bidi,typography-hierarchy-editorial}.md
$OD/craft/README.md
$OD/design-systems/_schema/{tokens.schema.ts,defaults.css,manifest.schema.ts}
$OD/design-systems/linear-app/{DESIGN.md,tokens.css,components.html,USAGE.md,preview/}
$OD/design-systems/raycast/{DESIGN.md,tokens.css,components.html,USAGE.md,preview/}
$OD/design-systems/mission-control/{DESIGN.md,tokens.css}
$OD/design-systems/{vercel,dashboard,cursor,opencode-ai}/tokens.css
$OD/design-templates/{dashboard,kanban-board,web-prototype,wireframe-greybox,critique,github-dashboard}/SKILL.md
$OD/design-templates/AGENTS.md
$OD/frames/{browser-chrome,macbook,iphone-15-pro,android-pixel,ipad-pro}.html
$OD/skills/{redesign-skill,design-review,ui-ux-pro-max,web-design-guidelines}/SKILL.md
$OD/prompt-templates/{image,video}/          # 与 UI 无关

# 宿主 token（值）
/Users/unclet/Projects/snippets/zvid/dsh-plugins/.tools/asar-all/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js
# 宿主 token（引用，无值）
/Users/unclet/Projects/snippets/zvid/dsh-plugins/.tools/extract/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BxpfOGf3.css

# 本项目
/Users/unclet/Projects/snippets/zvid/dsh-plugins/client.js
/Users/unclet/Projects/snippets/zvid/dsh-plugins/docs/redesign/02-opendesign-toolkit.md   # 本文
/Users/unclet/Projects/snippets/zvid/dsh-plugins/tools/design/shot.sh
/Users/unclet/Projects/snippets/zvid/dsh-plugins/docs/redesign/03-strategy.md            # 方案（引用本文 §4）
```

## 附录 B · 与现有文档的冲突与裁决

| 冲突 | 事实 | 裁决 |
|---|---|---|
| `design-system/workspace-hub/MASTER.md`（09:45 生成，09:50 已移除）vs `03-strategy.md` §7 | 该文件用 `#0F172A` 底 / `#22C55E` 强调 / Inter + Google Fonts 外链，且带 `--space-* / --shadow-*` 自建 token 层 | **以 `03-strategy.md` §7 与本文 §2.6 为准**。它违反「只用宿主 token / 不引外部字体 / 单一强调」三条；已随 Lead 清理移除，保留此条作为「生成器默认产物不可直接采用」的记录 |
| 任务书说 token 值在 `dsh-web-frontend/dist/index-*.css` | 该文件只有 `var(--dsw-alias-*)` 引用，无定义 | 值在 `dsh-client-ui-theme/lib/client.js`；已在 §6.3 给出路径与两套值 |
| `design-systems/README.md` 说 151 个包 | `ls` 与 `/api/design-systems` 均为 152 | 以实测 152 为准 |
| `mission-control` 的 DESIGN.md vs tokens.css | DESIGN 写 `#0B1120`/`#FFB800` amber，tokens.css 实为 `#090b12`/`#60a5fa` | 说明「贴 tokens.css 不等于拿到 DESIGN.md 的视觉」——这正是 §2.6 主张「只借决策、实现落宿主 token」的理由 |
| `dashboard` 的 DESIGN.md vs tokens.css | DESIGN 说 dark，tokens.css 是 `#f4f7fb` 亮色 | 同上；该包不再作为候选 |
| README 说「未验证面板像素级视觉」 | 本机 `dsh web` 需认证，headless 进不去 | §6 的 harness 方案只能覆盖「同一份 HTML/CSS + 宿主 token」；最终仍需真实页面人工确认一次 |
| 原型主题机制 vs 截图契约 | 原型用 `<html data-theme>` + `localStorage`，不读 `?theme=` | 见 §6.5：建议原型改为 `data-ds-dark-theme` + `?theme/?state` 解析；在此之前亮色截图需 playwright 预置或手工切换 |
