/**
 * 情境入口面板：conversation.input.dock 的 list 项。
 * 只在空白会话渲染；点卡片 = 切「科研模式」preset + 预填开场模板（不自动发送）。
 * 文案走语言桥；内置六卡有英文映射，自定义 cards.yml 的新卡保留原文。
 */
import * as React from 'react'
import { PRESET_ID, SITUATION_CARDS, type SituationCard } from './cards.ts'
import { KNOWN_CARD_KEYS, type LocaleFaceLike, type TranslateFn } from './locale.ts'
import type { InputActionsLike, SessionListState, SnapshotStore } from './types.ts'

interface PanelInjected {
  /** roster 中「科研模式」是否可用（缓存的一次性探测）。 */
  probePreset(): Promise<boolean>
  /** preset 目录 cards.yml 的卡片（缺席时回退内置六卡）。 */
  probeCards(): Promise<readonly SituationCard[]>
  /** 切 preset 并预填草稿。 */
  launch(sessionId: string, inputActions: InputActionsLike, template: string): Promise<void>
  /** 皮肤总闸：面板随皮肤同开同关。 */
  skin: SnapshotStore<{ enabled: boolean }>
  t: TranslateFn
  localeFace: LocaleFaceLike
}

interface PanelProps extends PanelInjected {
  sessionId: string
  inputActions: InputActionsLike
  useSessions<T>(selector: (state: SessionListState) => T): T
}

/** 面板组件（默认导出给 slots.register）。 */
export function BrandPanel(props: PanelProps): React.ReactNode {
  const skinOn = React.useSyncExternalStore(
    props.skin.subscribe,
    () => props.skin.getSnapshot().enabled,
  )
  React.useSyncExternalStore(
    props.localeFace.subscribe,
    () => props.localeFace.getSnapshot().active,
  )
  const blank = props.useSessions(state => state.byId[props.sessionId]?.blank === true)
  const preset = props.useSessions(state => state.byId[props.sessionId]?.agentPreset)
  const [ready, setReady] = React.useState<boolean | undefined>(undefined)
  const [cards, setCards] = React.useState<readonly SituationCard[]>(SITUATION_CARDS)

  React.useEffect(() => {
    let live = true
    void props.probePreset().then(value => { if (live) setReady(value) })
    void props.probeCards().then(rows => { if (live) setCards(rows) })
    return () => { live = false }
    // probePreset/probeCards 是注册期固定的注入面，身份稳定。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!skinOn || !blank) return null

  const armed = preset === PRESET_ID
  const t = props.t

  return (
    <div className="rs-panel">
      {ready === false ? (
        <div className="rs-panel-note">{t('panel.missing')}</div>
      ) : (
        <>
          <div className="rs-panel-grid">
            {cards.map(card => (
              <button
                key={card.key}
                type="button"
                className="rs-card"
                onClick={() => { void props.launch(props.sessionId, props.inputActions, card.template) }}
              >
                <span className="rs-card-title">{KNOWN_CARD_KEYS.has(card.key) ? t(`card.${card.key}.title`) : card.title}</span>
                <span className="rs-card-hint">{KNOWN_CARD_KEYS.has(card.key) ? t(`card.${card.key}.hint`) : card.hint}</span>
              </button>
            ))}
          </div>
          <div className="rs-panel-note">{armed ? t('panel.armed') : t('panel.unarmed')}</div>
        </>
      )}
    </div>
  )
}
