/**
 * 插件双语：优先接入宿主 dsh-client-locale（设置面板的 Language 偏好驱动），
 * 缺席时回退到内置中文静态词典（不阻断渲染）。
 * 数据层一律存中文（条目状态、模板），只在显示层按语言映射。
 */
import type { ModuleDef } from './workbench-config.ts'

/** 宿主 locale 服务中本插件占用的命名空间。 */
export const RESEARCH_NS = 'dsh-research-agent'

export type Lang = 'zh' | 'en'

/** LocaleFace：供 useSyncExternalStore 订阅的 getSnapshot/subscribe 面。 */
export interface LocaleFaceLike {
  subscribe(fn: () => void): () => void
  getSnapshot(): { active: string; revision: number }
}

export type TranslateFn = (key: string) => string

export interface LocaleBridge {
  t: TranslateFn
  face: LocaleFaceLike
  /** 注销词典（挂到 ctx.effect 的清理）。 */
  dispose(): void
}

/** 宿主 LocaleRuntime 中本插件触碰的成员（结构子集）。 */
interface LocaleRuntimeLike {
  register(ns: string, locale: string, dict: Record<string, string>): () => void
  bind(ns: string): TranslateFn
  subscribe(fn: () => void): () => void
  getSnapshot(): { active: string; revision: number }
}

export const UI_STRINGS: Record<Lang, Record<string, string>> = {
  zh: {
    'panel.missing': '还没装「科研模式」预设 —— 检查 ~/.dsh/.agent-presets/research 目录是否完整（preset.yml + agent.cordis.yml + skills/），修复后刷新页面。',
    'panel.armed': '已切到科研模式——把「……」补成你的实际情况，发出去就开聊。',
    'panel.unarmed': '点一张卡，会话切到科研模式并预填开场；细节你来补，主动权在你。',
    'card.topic.title': '选题立项', 'card.topic.hint': '方向 · 可行性 · 创新点',
    'card.literature.title': '文献综述', 'card.literature.hint': '检索 · 梳理 · 找缺口',
    'card.experiment.title': '实验设计', 'card.experiment.hint': '数据 · 基线 · 消融',
    'card.writing.title': '论文写作', 'card.writing.hint': '大纲 · 成稿 · 图表',
    'card.review.title': '审稿回复', 'card.review.hint': '意见 · 回应 · 修改',
    'card.submission.title': '投稿策略', 'card.submission.hint': '选刊 · cover letter · 时机',
    'mode.aria': '科研 · agent 模式',
    'mode.title': '皮肤 + 情境面板 + 科研工作台一键同开同关；开启时自动进入「科研工作台」工作区，新会话默认「科研模式」，关闭恢复原默认',
    'mode.strong': '科研 · agent', 'mode.rest': '模式',
    'mode.desc': '学界之内，自有章法——开启即进入「科研工作台」工作区',
    'mode.on': '已开启', 'mode.off': '未开启',
    'wb.btn.open': '收起科研工作台', 'wb.btn.closed': '展开科研工作台', 'wb.btn.text': '工作台',
    'wb.drawer.aria': '科研工作台', 'wb.title': '科研工作台',
    'wb.close.aria': '收起', 'wb.close.title': '收起（侧栏「研」按钮可再展开）',
    'wb.save': '保存', 'wb.cancel': '取消', 'wb.edit': '编辑', 'wb.delete': '删除',
    'wb.status.title': '点击切换状态', 'wb.add': '新增',
    'wb.unfilled.open': '（未填', 'wb.unfilled.close': '）',
    'wb.empty': '暂无条目，点右上「+」记一条',
    'wb.export': '导出 JSON', 'wb.import': '导入 JSON', 'wb.footnote': '数据存于本浏览器',
  },
  en: {
    'panel.missing': 'Research preset not installed — check that ~/.dsh/.agent-presets/research is complete (preset.yml + agent.cordis.yml + skills/), fix it, then reload.',
    'panel.armed': 'Switched to Research mode — replace "……" with your details, then send.',
    'panel.unarmed': 'Click a card to switch the session to Research mode with a prefilled opener; you fill in the details, you stay in control.',
    'card.topic.title': 'Topic Selection', 'card.topic.hint': 'Direction · feasibility · novelty',
    'card.literature.title': 'Literature Survey', 'card.literature.hint': 'Search · map · find gaps',
    'card.experiment.title': 'Experiment Design', 'card.experiment.hint': 'Data · baselines · ablations',
    'card.writing.title': 'Paper Writing', 'card.writing.hint': 'Outline · drafting · figures',
    'card.review.title': 'Peer Review Reply', 'card.review.hint': 'Comments · responses · revisions',
    'card.submission.title': 'Submission Strategy', 'card.submission.hint': 'Venue · cover letter · timing',
    'mode.aria': 'Research · agent mode',
    'mode.title': 'Skin, context panel, and workbench toggle together; when on, enters the Research Workbench workspace and new sessions default to Research mode; off restores the previous default',
    'mode.strong': 'Research · agent', 'mode.rest': 'mode',
    'mode.desc': 'Within academia there are its own conventions — enabling enters the Research Workbench workspace',
    'mode.on': 'On', 'mode.off': 'Off',
    'wb.btn.open': 'Collapse research workbench', 'wb.btn.closed': 'Expand research workbench', 'wb.btn.text': 'Workbench',
    'wb.drawer.aria': 'Research workbench', 'wb.title': 'Research Workbench',
    'wb.close.aria': 'Collapse', 'wb.close.title': 'Collapse (reopen from the sidebar seal button)',
    'wb.save': 'Save', 'wb.cancel': 'Cancel', 'wb.edit': 'Edit', 'wb.delete': 'Delete',
    'wb.status.title': 'Click to cycle status', 'wb.add': 'New',
    'wb.unfilled.open': '(no', 'wb.unfilled.close': ')',
    'wb.empty': 'No entries yet — click + at the top right to add one',
    'wb.export': 'Export JSON', 'wb.import': 'Import JSON', 'wb.footnote': 'Data stays in this browser',
  },
}

/** 内置六卡 key 集合：只对已知卡做翻译，自定义 cards.yml 的新卡保留原文。 */
export const KNOWN_CARD_KEYS = new Set(['topic', 'literature', 'experiment', 'writing', 'review', 'submission'])

/** 按语言取模块显示文本（数据层不变，映射只在显示层）。 */
export function moduleText(module: ModuleDef, lang: Lang): {
  title: string
  hint: string
  statuses: readonly string[]
  fieldLabels: Record<string, { label: string; placeholder: string }>
  actionLabels: Record<string, string>
} {
  if (lang === 'zh') {
    return {
      title: module.title,
      hint: module.hint,
      statuses: module.statuses,
      fieldLabels: Object.fromEntries(module.fields.map(f => [f.key, { label: f.label, placeholder: f.placeholder }])),
      actionLabels: Object.fromEntries(module.actions.map(a => [a.key, a.label])),
    }
  }
  return {
    title: module.en.title,
    hint: module.en.hint,
    statuses: module.en.statuses,
    fieldLabels: Object.fromEntries(
      module.fields.map((f, i) => [f.key, { label: module.en.fields[i]?.label ?? f.label, placeholder: module.en.fields[i]?.placeholder ?? f.placeholder }]),
    ),
    actionLabels: Object.fromEntries(
      module.actions.map((a, i) => [a.key, module.en.actions[i]?.label ?? a.label]),
    ),
  }
}

/** 把存储的中文状态映射到显示语言（条目数据保持中文不动）。 */
export function statusText(module: ModuleDef, stored: string, lang: Lang): string {
  const index = module.statuses.indexOf(stored)
  if (lang === 'en' && index >= 0) return module.en.statuses[index] ?? stored
  return stored
}

/** 接入宿主 locale 服务；缺席时用静态中文词典兜底。 */
export function makeLocale(getService: (name: 'locale') => unknown): LocaleBridge {
  const runtime = getService('locale') as LocaleRuntimeLike | undefined
  if (
    runtime === undefined
    || typeof runtime.register !== 'function'
    || typeof runtime.bind !== 'function'
  ) {
    const face: LocaleFaceLike = {
      subscribe: () => () => {},
      getSnapshot: () => ({ active: 'zh', revision: 0 }),
    }
    return {
      t: key => UI_STRINGS.zh[key] ?? key,
      face,
      dispose: () => {},
    }
  }
  const disposers = [
    runtime.register(RESEARCH_NS, 'zh', UI_STRINGS.zh),
    runtime.register(RESEARCH_NS, 'en', UI_STRINGS.en),
  ]
  // subscribe/getSnapshot 是类方法：必须以闭包绑定实例传出，
  // 裸引用进 useSyncExternalStore 会丢 this（listeners undefined）。
  const face: LocaleFaceLike = {
    subscribe: fn => runtime.subscribe(fn),
    getSnapshot: () => runtime.getSnapshot(),
  }
  const translate = runtime.bind(RESEARCH_NS)
  return {
    t: key => translate(key),
    face,
    dispose: () => {
      for (const d of disposers) d()
    },
  }
}

/** 语言判定：宿主 active locale 归一为 zh / en。 */
export function langOf(active: string): Lang {
  return typeof active === 'string' && active.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}
