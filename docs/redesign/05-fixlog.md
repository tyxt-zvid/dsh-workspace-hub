# 05 · 评审修复记录（Lead 复核）

> 对应 `04-review.md`（裁决 ship with fixes：P0 20/24、P1 14/20）。  
> 修复对象：`docs/redesign/prototype/index.html` + `prototype/README.md`；策略与 README 的 overclaim 同步改写。  
> 修复后未再跑一次完整独立评审；以下为逐条自验证据，建议实现前由另一人复验。

---

## 1. P0（评审 4 条未过 → 全部处理）

| # | 评审项 | 处理 | 自验证据 |
|---|---|---|---|
| #4 | 亮色对比度 | 亮色语义阶本地覆盖：元数据 `#61666b`、琥珀文字 `#b45309`、绿色图标 `#15803d`、控件边界 `#00000029`；暗色不动 | Playwright 取 computed color：`.row-sub` = `rgb(97,102,107)`（白底 5.8:1）；`#/now-light` 截图无低对比灰字 |
| #16 | 五态覆盖只在任务表面 | `#/states` 补：对话 · 加载/错误；环境 · 探测中/不可达；设置 · 读取失败。画廊可滚动（`.gallery` 1087/750） | 截图 `screens/13-states-more-dark.png`（滚动到底部）；新增块含原因/影响/重试 |
| #27 | 命中区 <24px | 状态控件 28×28；复选框 label 24×24；主题按钮 24×24；开关 label 撑高 | Playwright：`.status`=[28,28]，`.row-sel`=[24,24]，`.kbd`=11px |
| #32 | 状态只靠颜色 | 统一语义：running=蓝环 / done=绿勾 / idle=空心 / blocked=琥珀 / failed=红；子会话行补「运行中/空闲/已关闭」文字；看板进行中不再用绿点 | Playwright：看板列 dot class = todo/doing/blocked/done；子会话 `.sub-state` 文本齐全 |

## 2. P1 / 键盘硬伤

| 评审项 | 处理 | 自验 |
|---|---|---|
| 派发 sheet Enter 劫持「取消」 | Enter 只激活当前获得焦点的按钮；仅当焦点在主按钮/容器时提交 | 焦点在「取消」按 Enter：sheet 关闭、无 toast |
| 快速捕获 Tab 陷阱 | 首次 Tab 展开详情，之后 Tab 进入优先级/归属 select | 连按两次 Tab：`activeElement` = `SELECT#capture-prio` |
| 浮层关闭焦点归位错误 | 记录触发元素 `data-act` + row id，渲染后按选择器重取 | `⌘K` → Esc：`activeElement.dataset.act` = `palette-open` |
| <900px 丢工作区身份/同步/行元数据 | 折叠为短名 + 图标 tooltip + 两行元数据，不再 `display:none` | 820px 截图（见评审原图对比） |
| 看板假 affordance | 实现 `j/k` 卡片焦点与 `[` `]` 改状态 | `j` 后 `]`：toast「状态已改为「进行中」」 |
| 任务无搜索 | 工具行加搜索框，`/` 聚焦 | `/` 后焦点 = `#task-search`（placeholder「搜索任务…」） |
| 对话页两个实心主按钮 | 行内「发送」降为次级，仅保留「新建子会话」为主 | 截图 `06-sessions-dark` |
| 空态演示与计数矛盾 | `⋯ > 空状态` 同时把状态条/导航/筛选计数归零 | 演示态截图 |
| 命令面板语义 | listbox + option + input `aria-activedescendant` 均已存在（评审脚本查错元素） | Playwright：`role=listbox` 存在，option 12 个，input 的 activedescendant 配置见 `index.html:1786` |
| toast 双 live region | 只保留 per-toast `role=status/alert`，移除容器 `aria-live` | 静态：无 `aria-live` 容器 |
| kbd 10.5px | 改 11px | Playwright computed 11px |
| 行标题无 title | 任务行标题加 `title` | Playwright：全部 `.row-title` 带 title |
| 选中语义/焦点 | 选中行用 business 蓝左条 + 4% 底；焦点行允许 inset 2px | 静态 CSS |

## 3. 文档修正（Overclaim）

`docs/redesign/README.md` 已改写：派发「3 步」限定为「已有任务」；撤销/软删除、服务器异步、文件 CAS 标为 Host 依赖；§6 改标题为「待实现契约」；状态覆盖改为「任务表面完整，其余见修复记录」；新增 `04-review` 裁决与 `05-fixlog` 链接。

`docs/redesign/03-strategy.md` 采纳评审 §4.2 的 10 条 spec corrections：行标题字号统一 14；默认按状态分组（注意力改为 pinned 筛选）；搜索改为客户端 ≤200（Host 参数列入依赖）；CAS/日志/软删除标注 Host 未就绪时的降级验收；选中/焦点统一 business 蓝；彩色预算改 <5%；行内容器允许 inset 焦点环；截图清单与实际 13 张对齐；原型不可验收项单列；新增「状态语义表」。

## 4. 仍未做（明确遗留，不阻塞「构思」交付）

1. 派发 sheet 的 submitting loading、409 就地冲突、派发后自动打开会话（需 Host 行为配合，原型只能占位）。
2. 环境「查看日志」浮层、服务器启动取消的完整状态机（Host job 依赖）。
3. 设置「另存为」出口、离开未保存拦截、真实文件 CAS。
4. 工作区切换器、returnPath 恢复（宿主 layout 能力，原型范围外）。
5. 失败路径演示（断网/慢请求/写失败回滚）——原型无后端。
6. 820px 主题分段按钮在窄屏为 20px（低于 24，空间妥协）；建议实现时用 24 + 图标 tooltip。

## 5. 结论

评审的 4 条 P0 与 12 条可前端修复的 P1 已处理并有自验证据；剩余项全部是 Host 依赖或原型范围外，已在路线图与 README 中标注。建议以 `04-review.md` 的清单为 PR 门禁，在真实 DSH 页面再跑一次人工验收（入口/胶囊/真实 token/键盘）。
