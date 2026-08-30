/**
 * Settings → General 的「科研 · agent 模式」开关卡片。
 * 学术蓝印章 + 宋体标题的品牌卡：整卡可点、开启时学术蓝描边点亮。
 * 持久化走 localStorage（树外插件唯一可用的配置通道），调和在 index.tsx 统一完成。
 * 文案走语言桥（宿主 Language 偏好驱动；缺席时中文兜底）。
 */
import * as React from 'react'
import type { LocaleFaceLike, TranslateFn } from './locale.ts'
import type { SnapshotStore } from './types.ts'

interface ModeRowInjected {
  skin: SnapshotStore<{ enabled: boolean }>
  t: TranslateFn
  localeFace: LocaleFaceLike
}

/** 设置卡片组件。 */
export function ResearchModeRow(props: ModeRowInjected): React.ReactNode {
  const enabled = React.useSyncExternalStore(
    props.skin.subscribe,
    () => props.skin.getSnapshot().enabled,
  )
  const active = React.useSyncExternalStore(
    props.localeFace.subscribe,
    () => props.localeFace.getSnapshot().active,
  )
  void active
  const t = props.t
  return (
    <button
      type="button"
      className="rs-settings-card"
      data-on={enabled ? 'true' : 'false'}
      role="switch"
      aria-checked={enabled}
      aria-label={t('mode.aria')}
      title={t('mode.title')}
      onClick={() => props.skin.update(draft => { draft.enabled = !enabled })}
    >
      <span className="rs-seal" aria-hidden="true">科研</span>
      <span className="rs-settings-meta">
        <span className="rs-settings-label"><b>{t('mode.strong')}</b> {t('mode.rest')}</span>
        <span className="rs-settings-desc">{t('mode.desc')}</span>
      </span>
      <span className="rs-settings-state">
        <span className="rs-settings-state-word">{enabled ? t('mode.on') : t('mode.off')}</span>
        <span className="rs-switch" data-on={enabled ? 'true' : 'false'} />
      </span>
    </button>
  )
}
