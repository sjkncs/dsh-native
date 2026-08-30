# DESIGN.md — dsh-native 展示站

> 本文件是写给 AI 的设计基准（hallmark / DESIGN.md 方法）。生成或修改 `site/` 内任何界面前，先读本文件；与 `AGENTS.md` 对称——`AGENTS.md` 管怎么构建，本文件管长什么样。
>
> **设计原型**：Stripe 靛蓝渐变（华丽精致、高级科技感）× Ollama 黑白极简（克制、留白、内容为王）的**融合**，与科研版专站（dsh-research）同属一套设计系统。基调克制，能量集中：大面积黑白灰承载内容与留白，靛蓝渐变只在 Hero、CTA、关键数字三处释放；绿色只属于「正式版」状态与品牌印记。

---

## 1. 视觉氛围（Visual Mood）

- **一句话**：深夜的全栈控制台中央，一枚翡翠色晶体把七条光路分发给悬浮面板。
- 气质关键词：`克制`、`可信`、`高级`、`完整`、`精密`。
- 不追求热闹：无彩带、无饱和撞色、无装饰性插画堆砌。渐变是唯一的"情绪源"，其余交给留白与排版。
- 深色优先（默认），浅色为可选主题；两主题共用同一套语义令牌。
- 全程**无 emoji**；图标一律内联 SVG（1.5–2px 描边、圆角端点）。

## 2. 色彩（Color）

语义令牌（CSS 自定义属性），深色为基准值，浅色用 `[data-theme="light"]` 覆盖：

```yaml
color:
  base:
    bg: "#0b1020"          # 页面底，近黑带蓝
    bg-soft: "#0f1629"     # 次级底 / 代码块底
    panel: "#121a31"       # 卡片面
    panel-2: "#16203c"     # 卡片内嵌面 / 表头
    border: "#232f52"      # 常规描边
    border-soft: "#1b2542" # 弱描边 / 分隔
  text:
    strong: "#e8edf7"      # 标题 / 正文强调
    body: "#a5b1cc"        # 正文
    faint: "#6b7899"       # 辅助 / 注脚
  accent:                  # 靛蓝渐变（Stripe 能量层）
    primary: "#6c8cff"
    secondary: "#9a6cff"
    soft: "rgba(108,140,255,0.14)"
    gradient: "linear-gradient(135deg, #6c8cff, #9a6cff)"
  semantic:
    ok: "#35c98e"          # 「正式版」徽章、品牌印记、完成项
    warn: "#f0b23f"
    danger: "#ff6b6b"
light_overrides:
  bg: "#f6f8fc"; bg-soft: "#eef2f9"; panel: "#ffffff"; panel-2: "#f2f5fb"
  border: "#d9e0ef"; border-soft: "#e5eaf5"
  text.strong: "#14203c"; text.body: "#46536f"; text.faint: "#7b87a3"
  accent.primary: "#3a5ee0"; accent.secondary: "#7a3ae0"
```

**用色纪律**：靛蓝渐变仅用于 ① Hero 主标题与按钮、② KPI 大数字、③ 主 CTA。绿色（`ok`）只表达「正式版 / 内置 / 完成」状态与品牌印记，不做泛装饰。正文、卡片、表格保持黑白灰；语义色（绿/黄/红）只表达状态。

## 3. 字体（Typography）

```yaml
font:
  stack: '"Inter","PingFang SC","Microsoft YaHei",system-ui,-apple-system,sans-serif'
  mono: '"JetBrains Mono","SFMono-Regular",Consolas,monospace'
  scale:
    hero-h1: { size: 52px, weight: 800, line: 1.12, tracking: "-0.02em" }
    section-h2: { size: 30px, weight: 700, line: 1.25, tracking: "-0.01em" }
    card-h3: { size: 18px, weight: 700, line: 1.3 }
    body: { size: 15px, weight: 400, line: 1.68 }
    small: { size: 13px, weight: 400, line: 1.6 }
    label: { size: 12px, weight: 600, uppercase: true, tracking: "0.05em" }
  rule: "标题用 strong 色；正文用 body 色；注脚用 faint 色。同一区块内字号层级不超过 3 级。"
```

## 4. 布局与留白（Layout & Spacing）

- 内容最大宽度 `1080px` 居中；两侧 `padding: 0 24px`。
- 分区（section）上下 `padding: 72px 0`；分区间用 1px `border-soft` 分隔，营造 Ollama 式克制的节奏。
- 间距标尺：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 72`，优先 8 的倍数。
- 网格：桌面 `grid-3`（3 列）、`grid-2`（2 列）、KPI `grid-4`；列间距 `16px`。
- **留白是设计**：Hero 与各分区之间宁可空，不可挤；一段文案不超过两行。

## 5. 组件（Components）

```yaml
components:
  badge:      # 圆角 999 的胶囊；默认描边灰，变体用状态色 10% 底 + 45% 描边；「正式版」用 badge-ga（绿）
  button:
    primary:  # 靛蓝渐变、无边框、白字、柔和渐变投影；悬停上浮 1px
    ghost:    # 透明底、1px 描边；悬停变靛蓝软底
  card:       # panel 底、1px 弱描边、圆角 14、内边距 22；悬停上浮 3px + 描边加深
  kpi:        # 大号数字用靛蓝渐变文字裁剪；标签用小字 body 色
  table:      # 弱描边包裹、表头 panel-2 + 小写大写字母、行悬停靛蓝软底；插件栈表格的来源列用徽章
  step:       # 编号方块（靛蓝软底）+ 标题 + 说明 + 代码块
  roadmap:    # 列表；完成项绿点带光晕、文字 strong；未完成灰点、文字 body
```

圆角标尺：小元素 `9px`，卡片 `14px`，胶囊 `999px`。阴影仅用于卡片与主按钮，深色主题用深蓝投影、浅色用柔和灰投影。

## 6. 图标与图像（Iconography & Imagery）

- 图标：全部**内联 SVG**，描边 `2`、`stroke-linecap: round`、随文字颜色；**禁止 emoji**。
- 品牌印记：方形圆角**绿色渐变**块内一枚白色多面晶体线稿（全栈发行意象，`.mark-ok`）；与科研版的靛蓝烧瓶印记区分但同一形状语言。
- 场景图：**确定性自绘 SVG**（`site/assets/img/hero.svg`：深色底、翡翠晶体核心、七条光束分发七块线框面板、三层装配底座），仅用于 Hero 背景，置底并叠加深色渐变遮罩，保证其上文字可读。不依赖外部图像生成，保证可复现、可审计。
- 不出现真实人物照片与受版权保护的品牌素材。

## 7. 动效与交互（Motion & Interaction）

- 原则：**动效服务于叙事，不抢戏**。时长 `150–400ms`，缓动 `cubic-bezier(0.22,1,0.36,1)`。
- 滚动叙事：分区进入视口时做 `opacity 0→1 + translateY 16px→0` 的揭示（滚动位置检测，只播一次）。
- 视差：Hero 场景图随滚动做轻微 `translateY`（系数 ≤0.15），保持克制。
- 悬停：卡片上浮、按钮上浮、链接加下划线；均 `150ms`。
- 尊重 `prefers-reduced-motion`：命中时关闭揭示与视差，直接呈现。

## 8. 响应式（Responsive）

```yaml
breakpoints:
  desktop: ">= 920px"   # grid-3/grid-4 全开
  mobile: "< 920px"     # 单列；pipeline 改 2 列并隐藏箭头；导航仅留品牌 + 主题/语言按钮
rules:
  - Hero 标题在移动端降到 34px
  - 表格在移动端允许横向滚动（.table-wrap），不改结构
  - 触控目标不小于 44px
```

## 9. 给 AI 的提示词指南（Prompt Guidelines）

生成/修改本站点界面时，AI **必须**：

1. 先读本文件，颜色一律取自第 2 节令牌，**不新造硬编码色值**；
2. 结构语义化（`header/section/footer` + 合理标题层级），可访问性达标（见下）；
3. **绝不使用 emoji**；需要图标用内联 SVG；
4. 文案措辞：阶段统一写「正式版」，**永不**写「预览版」或「测试版」；
5. 交互动效遵循第 7 节的克制原则，并为 `prefers-reduced-motion` 兜底；
6. 不引入新的运行时依赖；纯静态（原生 HTML/CSS/JS），资源用相对路径以兼容 Pages 子路径托管；
7. 文案数据集中在 `site/data/snapshot.json`（含中英），渲染逻辑读它，不把内容写死在 HTML；`index.html` 的每个 `data-i18n` 键必须在快照双语两侧都有定义（测试强制）。

**可访问性底线**：正文对比度 ≥ 4.5:1；交互元素有 `:focus-visible` 描边；图片有 `alt`；主题/语言切换是真实 `<button>`。

---

_基准版本：2026-08-30 · 原型融合：Stripe 靛蓝渐变 × Ollama 黑白极简 · 品牌区分：绿色晶体印记 · 读者：AI 优先_
