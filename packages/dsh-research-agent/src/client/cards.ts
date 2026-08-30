/** 六张科研情境卡：与 research-skill playbook 的分诊一一对应。 */
export interface SituationCard {
  key: string
  title: string
  hint: string
  template: string
}

export const SITUATION_CARDS: readonly SituationCard[] = [
  {
    key: 'topic',
    title: '选题立项',
    hint: '方向 · 可行性 · 创新点',
    template: '我关注的研究方向是「……」，手头条件是……，帮我评估几个候选选题的可行性、创新点和工作量。',
  },
  {
    key: 'literature',
    title: '文献综述',
    hint: '检索 · 梳理 · 找缺口',
    template: '围绕「……」帮我梳理研究现状：主流方法有哪些、各自的局限、目前还有哪些没解决的缺口。',
  },
  {
    key: 'experiment',
    title: '实验设计',
    hint: '数据 · 基线 · 消融',
    template: '我想验证「……」这个想法，帮我设计实验方案：数据集怎么选、基线选谁、评价指标和消融怎么安排。',
  },
  {
    key: 'writing',
    title: '论文写作',
    hint: '大纲 · 成稿 · 图表',
    template: '帮我规划一篇关于「……」的论文：先出证据大纲，我确认后再逐节展开，图表怎么配也一并想好。',
  },
  {
    key: 'review',
    title: '审稿回复',
    hint: '意见 · 回应 · 修改',
    template: '审稿人提了这些意见：……，帮我逐条拆解他们的真实关切，起草点对点回复和修改方案。',
  },
  {
    key: 'submission',
    title: '投稿策略',
    hint: '选刊 · cover letter · 时机',
    template: '这篇工作的内容是……，想投稿但拿不准去哪，帮我对比合适的期刊/会议，再准备投稿材料。',
  },
]

/** 「科研模式」preset 的 roster id（目录名）。 */
export const PRESET_ID = 'research'

/** 科研专用工作区目录（与服务端 index.ts 的 RESEARCH_WORKSPACE_PATH 一致）。 */
export const RESEARCH_WORKSPACE_PATH = 'E:\\DeepSeek harness\\科研工作台'

/** cards 路由返回行的运行时校验（wire 边界）。 */
export function isSituationCard(row: unknown): row is SituationCard {
  if (typeof row !== 'object' || row === null) return false
  const record = row as Record<string, unknown>
  return ['key', 'title', 'hint', 'template']
    .every(field => typeof record[field] === 'string' && record[field] !== '')
}
