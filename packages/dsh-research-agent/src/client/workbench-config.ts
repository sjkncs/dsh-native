/**
 * 科研工作台模块定义：字段、状态流、智能动作。
 * 新模块 = 往 WORKBENCH_MODULES 加一条配置，框架自动获得表单/列表/状态流转。
 */

export interface FieldDef {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
}

export interface ActionDef {
  key: string
  label: string
  /** 用条目字段组装开场文本（空字段以「……」占位，由科研老前辈摸底补齐）。 */
  build(fields: Record<string, string>): string
}

export interface ModuleDef {
  key: string
  title: string
  /** 卡片头的单字印记（学术蓝小方章）。 */
  icon: string
  /** 卡片头的小字注解。 */
  hint: string
  statuses: readonly string[]
  fields: readonly FieldDef[]
  actions: readonly ActionDef[]
  /** 英文显示层（数据层与动作模板保持中文；仅渲染时映射）。 */
  en: ModuleDefEn
}

/** 模块英文显示层：与 zh 字段按序对齐（字段/动作顺序必须一致）。 */
export interface ModuleDefEn {
  title: string
  hint: string
  statuses: readonly string[]
  fields: readonly { label: string; placeholder: string }[]
  actions: readonly { label: string }[]
}

/** 条目（持久化在 localStorage 的数据行）。 */
export interface WorkbenchEntry {
  id: string
  module: string
  status: string
  fields: Record<string, string>
  updatedAt: number
}

const v = (fields: Record<string, string>, key: string): string => {
  const value = (fields[key] ?? '').trim()
  return value === '' ? '……' : value
}

export const WORKBENCH_MODULES: readonly ModuleDef[] = [
  {
    key: 'idea',
    title: '想法素材库',
    icon: '想',
    hint: '灵感随手记 · 攒够再立项',
    statuses: ['萌芽', '待验证', '已立项'],
    fields: [
      { key: 'name', label: '想法名', placeholder: '如：小样本下的检索增强微调' },
      { key: 'spark', label: '灵感来源', placeholder: '如：读某篇论文时发现 / 组会讨论' },
      { key: 'notes', label: '初步想法', placeholder: '核心假设、可能难点、和现有工作的关系', multiline: true },
    ],
    actions: [
      {
        key: 'assess',
        label: '选题论证',
        build: f => `我有个研究想法想请你把关。想法名：${v(f, 'name')}；灵感来源：${v(f, 'spark')}；初步想法：\n${v(f, 'notes')}\n帮我评估可行性、创新点和工作量，指出最容易被质疑的地方。`,
      },
      {
        key: 'proposal',
        label: '开题草稿',
        build: f => `帮我把这个想法整理成开题报告草稿。想法名：${v(f, 'name')}；初步想法：\n${v(f, 'notes')}\n按研究背景、问题定义、技术路线、预期贡献、风险预案来组织。`,
      },
    ],
    en: {
      title: 'Idea Pool',
      hint: 'Capture sparks · launch when ready',
      statuses: ['Sprout', 'To validate', 'Launched'],
      fields: [
        { label: 'Idea name', placeholder: 'e.g. few-shot retrieval-augmented fine-tuning' },
        { label: 'Spark source', placeholder: 'e.g. found while reading a paper / group meeting' },
        { label: 'Initial idea', placeholder: 'Core hypothesis, likely difficulties, relation to existing work' },
      ],
      actions: [{ label: 'Topic review' }, { label: 'Proposal draft' }],
    },
  },
  {
    key: 'reading',
    title: '文献研读',
    icon: '读',
    hint: '笔记 · 心得 · 结合课题',
    statuses: ['待读', '已读', '已整理'],
    fields: [
      { key: 'title', label: '篇名', placeholder: '如：某方法的原始论文' },
      { key: 'source', label: '来源', placeholder: '如：NeurIPS 2025 / arXiv:xxxx.xxxxx' },
      { key: 'takeaways', label: '研读笔记', placeholder: '核心贡献、和我课题的关系、存疑处', multiline: true },
    ],
    actions: [
      {
        key: 'note',
        label: '生成文献笔记',
        build: f => `帮我整理一篇文献笔记。篇名：${v(f, 'title')}；来源：${v(f, 'source')}；我的初步笔记：\n${v(f, 'takeaways')}\n按「一句话总结 / 方法要点 / 局限 / 对我课题的启发」组织。`,
      },
      {
        key: 'review',
        label: '纳入综述',
        build: f => `把这篇文献放进我的综述框架里。篇名：${v(f, 'title')}；来源：${v(f, 'source')}；笔记：\n${v(f, 'takeaways')}\n帮我定位它属于哪条技术脉络，和哪些工作构成对比或承接。`,
      },
    ],
    en: {
      title: 'Literature',
      hint: 'Notes · insights · ties to your topic',
      statuses: ['Queued', 'Read', 'Organized'],
      fields: [
        { label: 'Paper title', placeholder: 'e.g. the original paper of a method' },
        { label: 'Source', placeholder: 'e.g. NeurIPS 2025 / arXiv:xxxx.xxxxx' },
        { label: 'Reading notes', placeholder: 'Core contribution, relation to my topic, doubts' },
      ],
      actions: [{ label: 'Paper notes' }, { label: 'Into survey' }],
    },
  },
  {
    key: 'experiment-log',
    title: '实验记录',
    icon: '验',
    hint: '数据 · 参数 · 异常',
    statuses: ['进行中', '已完成', '已归档'],
    fields: [
      { key: 'name', label: '实验名', placeholder: '如：基线复现 / 消融 A1' },
      { key: 'setup', label: '设置', placeholder: '数据集、超参、环境、随机种子' },
      { key: 'result', label: '结果与异常', placeholder: '关键指标、异常现象、下一步', multiline: true },
    ],
    actions: [
      {
        key: 'record',
        label: '整理实验记录',
        build: f => `帮我整理这次实验记录，要能直接贴进论文附录或复现文档。实验名：${v(f, 'name')}；设置：${v(f, 'setup')}；结果与异常：\n${v(f, 'result')}`,
      },
      {
        key: 'analyze',
        label: '结果分析',
        build: f => `帮我分析这组实验结果。实验名：${v(f, 'name')}；设置：${v(f, 'setup')}；结果：\n${v(f, 'result')}\n先看结果是否支持原假设，再给下一步实验建议，指出需要补的对照。`,
      },
    ],
    en: {
      title: 'Experiments',
      hint: 'Data · params · anomalies',
      statuses: ['Running', 'Done', 'Archived'],
      fields: [
        { label: 'Experiment name', placeholder: 'e.g. baseline reproduction / ablation A1' },
        { label: 'Setup', placeholder: 'Dataset, hyperparameters, environment, random seed' },
        { label: 'Results & anomalies', placeholder: 'Key metrics, anomalies, next steps' },
      ],
      actions: [{ label: 'Format log' }, { label: 'Result analysis' }],
    },
  },
  {
    key: 'draft',
    title: '论文草稿',
    icon: '著',
    hint: '提纲 · 章节 · 图表',
    statuses: ['提纲', '成稿中', '已定稿'],
    fields: [
      { key: 'title', label: '题目', placeholder: '如：面向……的……方法' },
      { key: 'venue', label: '目标发表', placeholder: '如：某期刊 / 某会议（含截稿日）' },
      { key: 'progress', label: '当前进度', placeholder: '已完成章节、卡住的地方', multiline: true },
    ],
    actions: [
      {
        key: 'polish',
        label: '打磨章节',
        build: f => `帮我打磨论文的某个章节。题目：${v(f, 'title')}；目标发表：${v(f, 'venue')}；当前进度：\n${v(f, 'progress')}\n我把章节草稿贴给你，先指出逻辑和证据问题，再动语言。`,
      },
      {
        key: 'selfcheck',
        label: '全文自查',
        build: f => `投稿前帮我做全文自查。题目：${v(f, 'title')}；目标发表：${v(f, 'venue')}。按主张-证据一致性、图表数据一致、引用完整性、格式要求四遍过，列出问题清单。`,
      },
    ],
    en: {
      title: 'Paper Draft',
      hint: 'Outline · sections · figures',
      statuses: ['Outline', 'Writing', 'Finalized'],
      fields: [
        { label: 'Title', placeholder: 'e.g. A method for ... targeting ...' },
        { label: 'Target venue', placeholder: 'e.g. a journal / conference (with deadline)' },
        { label: 'Progress', placeholder: 'Sections done, blockers' },
      ],
      actions: [{ label: 'Polish section' }, { label: 'Full self-check' }],
    },
  },
  {
    key: 'submission',
    title: '投稿与答辩',
    icon: '投',
    hint: 'cover letter · 逐条回复',
    statuses: ['准备中', '已投', '已接收'],
    fields: [
      { key: 'venue', label: '目标期刊/会议', placeholder: '如：某 SCI 期刊 / 某顶会' },
      { key: 'deadline', label: '截稿/节点', placeholder: '如：9 月 15 日截稿' },
      { key: 'materials', label: '材料清单', placeholder: '投稿信、回复函、补充材料等', multiline: true },
    ],
    actions: [
      {
        key: 'cover',
        label: '起草投稿信',
        build: f => `帮我起草投稿用的 cover letter。目标：${v(f, 'venue')}；时间节点：${v(f, 'deadline')}；论文要点：\n${v(f, 'materials')}\n突出贡献与期刊范围的匹配，简洁不吹嘘。`,
      },
      {
        key: 'rebuttal',
        label: '逐条回复',
        build: f => `收到审稿意见要做逐条回复（rebuttal）。目标：${v(f, 'venue')}；相关材料：\n${v(f, 'materials')}\n我把意见原文贴给你，先拆解每条的真实关切，再起草点对点回复，语气克制、有据可查。`,
      },
    ],
    en: {
      title: 'Submission',
      hint: 'Cover letter · point-by-point reply',
      statuses: ['Preparing', 'Submitted', 'Accepted'],
      fields: [
        { label: 'Target venue', placeholder: 'e.g. an SCI journal / a top conference' },
        { label: 'Deadline', placeholder: 'e.g. deadline on Sep 15' },
        { label: 'Materials list', placeholder: 'Cover letter, response letter, supplementary material' },
      ],
      actions: [{ label: 'Draft cover letter' }, { label: 'Rebuttal' }],
    },
  },
]
