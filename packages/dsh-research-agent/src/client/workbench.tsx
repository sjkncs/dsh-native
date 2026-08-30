/**
 * 科研工作台：页面右侧的常驻工作区栏（科研模式下默认展开、占位排版
 * 不悬浮遮挡——空间预留由 body[data-research-wb] 的 CSS 完成）。
 * 五个模块各自是一张精致卡片：学术蓝小方章 + 宋体标题 + 条目列表 + 内联表单；
 * 条目动作用字段数据组装开场文本走 launchFromRoot。数据存 localStorage。
 * 文案走语言桥：数据层存中文，显示层按宿主语言映射。
 */
import * as React from 'react'
import { WORKBENCH_MODULES, type ModuleDef, type WorkbenchEntry } from './workbench-config.ts'
import { langOf, moduleText, statusText, type Lang, type LocaleFaceLike, type TranslateFn } from './locale.ts'
import type { SnapshotStore } from './types.ts'

export interface WorkbenchData {
  entries: WorkbenchEntry[]
}

interface WorkbenchShared {
  skin: SnapshotStore<{ enabled: boolean }>
  workbench: SnapshotStore<{ open: boolean }>
  t: TranslateFn
  localeFace: LocaleFaceLike
}

function useEnabled(store: SnapshotStore<{ enabled: boolean }>): boolean {
  return React.useSyncExternalStore(store.subscribe, () => store.getSnapshot().enabled)
}

function useLang(face: LocaleFaceLike): Lang {
  const active = React.useSyncExternalStore(face.subscribe, () => face.getSnapshot().active)
  return langOf(active)
}

/** 侧栏底部的工作台开关。 */
export function WorkbenchButton(props: WorkbenchShared & { wide?: boolean }): React.ReactNode {
  const enabled = useEnabled(props.skin)
  const open = React.useSyncExternalStore(props.workbench.subscribe, () => props.workbench.getSnapshot().open)
  useLang(props.localeFace)
  if (!enabled) return null
  return (
    <button
      type="button"
      className="rs-wb-btn"
      data-open={open ? 'true' : 'false'}
      title={open ? props.t('wb.btn.open') : props.t('wb.btn.closed')}
      onClick={() => props.workbench.update(draft => { draft.open = !open })}
    >
      <span className="rs-wb-btn-seal" aria-hidden="true">研</span>
      {props.wide === true ? <span className="rs-wb-btn-text">{props.t('wb.btn.text')}</span> : null}
    </button>
  )
}

/** 条目编辑表单（新增与编辑共用；编辑态为本地 state，提交才写 store）。 */
function EntryForm(props: {
  module: ModuleDef
  lang: Lang
  t: TranslateFn
  initial: Record<string, string>
  onSave(fields: Record<string, string>): void
  onCancel(): void
}): React.ReactNode {
  const [draft, setDraft] = React.useState<Record<string, string>>(props.initial)
  const text = moduleText(props.module, props.lang)
  return (
    <div className="rs-wb-form">
      {props.module.fields.map(field => {
        const view = text.fieldLabels[field.key] ?? { label: field.label, placeholder: field.placeholder }
        return (
          <label key={field.key} className="rs-wb-field">
            <span className="rs-wb-field-label">{view.label}</span>
            {field.multiline === true ? (
              <textarea
                className="rs-wb-input"
                rows={3}
                placeholder={view.placeholder}
                value={draft[field.key] ?? ''}
                onChange={event => setDraft({ ...draft, [field.key]: event.target.value })}
              />
            ) : (
              <input
                className="rs-wb-input"
                placeholder={view.placeholder}
                value={draft[field.key] ?? ''}
                onChange={event => setDraft({ ...draft, [field.key]: event.target.value })}
              />
            )}
          </label>
        )
      })}
      <div className="rs-wb-form-actions">
        <button type="button" className="rs-wb-mini rs-wb-mini-primary" onClick={() => props.onSave(draft)}>{props.t('wb.save')}</button>
        <button type="button" className="rs-wb-mini" onClick={props.onCancel}>{props.t('wb.cancel')}</button>
      </div>
    </div>
  )
}

interface WorkbenchProps extends WorkbenchShared {
  data: SnapshotStore<WorkbenchData>
  launch(template: string): void
}

/** 一张模块卡片：方章头 + 条目列表 + 内联新增/编辑。 */
function ModuleCard(props: {
  module: ModuleDef
  lang: Lang
  t: TranslateFn
  rows: readonly WorkbenchEntry[]
  editing: string | null
  onEdit(id: string | 'new' | null): void
  data: SnapshotStore<WorkbenchData>
  launch(template: string): void
}): React.ReactNode {
  const { module, rows, lang, t } = props
  const text = moduleText(module, lang)
  const adding = props.editing === 'new'

  const saveNew = (fields: Record<string, string>): void => {
    props.data.update(draft => {
      draft.entries.unshift({
        id: crypto.randomUUID(),
        module: module.key,
        status: module.statuses[0]!,
        fields,
        updatedAt: Date.now(),
      })
    })
    props.onEdit(null)
  }
  const saveEdit = (id: string, fields: Record<string, string>): void => {
    props.data.update(draft => {
      const row = draft.entries.find(entry => entry.id === id)
      if (row !== undefined) { row.fields = fields; row.updatedAt = Date.now() }
    })
    props.onEdit(null)
  }
  const cycleStatus = (id: string): void => {
    props.data.update(draft => {
      const row = draft.entries.find(entry => entry.id === id)
      if (row === undefined) return
      const index = module.statuses.indexOf(row.status)
      row.status = module.statuses[(index + 1) % module.statuses.length]!
      row.updatedAt = Date.now()
    })
  }
  const remove = (id: string): void => {
    props.data.update(draft => {
      draft.entries = draft.entries.filter(entry => entry.id !== id)
    })
  }

  return (
    <section className="rs-mod-card">
      <header className="rs-mod-head">
        <span className="rs-mod-seal" aria-hidden="true">{module.icon}</span>
        <span className="rs-mod-meta">
          <span className="rs-mod-title">{text.title}</span>
          <span className="rs-mod-hint">{text.hint}</span>
        </span>
        {rows.length > 0 ? <span className="rs-mod-count">{rows.length}</span> : null}
        <button
          type="button"
          className="rs-mod-add"
          title={t('wb.add') + ' ' + text.title}
          onClick={() => props.onEdit(adding ? null : 'new')}
        >{adding ? '×' : '+'}</button>
      </header>
      {adding
        ? <EntryForm module={module} lang={lang} t={t} initial={{}} onSave={saveNew} onCancel={() => props.onEdit(null)} />
        : null}
      {rows.map(entry => (
        <div key={entry.id} className="rs-wb-entry">
          {props.editing === entry.id
            ? (
              <EntryForm
                module={module}
                lang={lang}
                t={t}
                initial={entry.fields}
                onSave={fields => saveEdit(entry.id, fields)}
                onCancel={() => props.onEdit(null)}
              />
            )
            : (
              <>
                <div className="rs-wb-entry-head">
                  <span className="rs-wb-entry-title">
                    {(entry.fields[module.fields[0]!.key] ?? '').trim()
                      || t('wb.unfilled.open') + ' ' + (text.fieldLabels[module.fields[0]!.key]?.label ?? module.fields[0]!.label) + ' ' + t('wb.unfilled.close')}
                  </span>
                  <button
                    type="button"
                    className="rs-wb-status"
                    title={t('wb.status.title')}
                    onClick={() => cycleStatus(entry.id)}
                  >{statusText(module, entry.status, lang)}</button>
                </div>
                {module.fields.slice(1).map(field => {
                  const value = (entry.fields[field.key] ?? '').trim()
                  return value === '' ? null : (
                    <div key={field.key} className="rs-wb-entry-line">
                      <span className="rs-wb-entry-key">{text.fieldLabels[field.key]?.label ?? field.label}</span>
                      <span className="rs-wb-entry-value">{value}</span>
                    </div>
                  )
                })}
                <div className="rs-wb-entry-actions">
                  {module.actions.map(action => (
                    <button
                      key={action.key}
                      type="button"
                      className="rs-wb-mini rs-wb-mini-primary"
                      onClick={() => props.launch(action.build(entry.fields))}
                    >{text.actionLabels[action.key] ?? action.label}</button>
                  ))}
                  <button type="button" className="rs-wb-mini" onClick={() => props.onEdit(entry.id)}>{t('wb.edit')}</button>
                  <button type="button" className="rs-wb-mini rs-wb-mini-danger" onClick={() => remove(entry.id)}>{t('wb.delete')}</button>
                </div>
              </>
            )}
        </div>
      ))}
      {rows.length === 0 && !adding
        ? <div className="rs-wb-empty">{t('wb.empty')}</div>
        : null}
    </section>
  )
}

/** 右侧工作区栏本体。 */
export function WorkbenchDrawer(props: WorkbenchProps): React.ReactNode {
  const enabled = useEnabled(props.skin)
  const open = React.useSyncExternalStore(props.workbench.subscribe, () => props.workbench.getSnapshot().open)
  const entries = React.useSyncExternalStore(props.data.subscribe, () => props.data.getSnapshot().entries)
  const lang = useLang(props.localeFace)
  const t = props.t
  // 编辑态全局唯一：'new:<moduleKey>' 或条目 id 或 null。
  const [editing, setEditing] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  if (!enabled || !open) return null

  const exportJson = (): void => {
    const blob = new Blob([JSON.stringify({ entries }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `research-workbench-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const importJson = (file: File): void => {
    void file.text().then(text => {
      const parsed: unknown = JSON.parse(text)
      const list = (parsed as { entries?: unknown }).entries
      if (!Array.isArray(list)) throw new Error('bad file')
      const valid = list.filter((row): row is WorkbenchEntry =>
        typeof row === 'object' && row !== null
        && typeof (row as WorkbenchEntry).id === 'string'
        && typeof (row as WorkbenchEntry).module === 'string'
        && typeof (row as WorkbenchEntry).status === 'string'
        && typeof (row as WorkbenchEntry).fields === 'object')
      props.data.set({ entries: valid })
    }).catch(() => { /* 坏文件：不动现有数据 */ })
  }

  return (
    <aside className="rs-wb-drawer" aria-label={t('wb.drawer.aria')}>
      <div className="rs-wb-head">
        <span className="rs-wb-title">{t('wb.title')}</span>
        <button
          type="button"
          className="rs-wb-close"
          aria-label={t('wb.close.aria')}
          title={t('wb.close.title')}
          onClick={() => props.workbench.update(draft => { draft.open = false })}
        >×</button>
      </div>
      <div className="rs-wb-body">
        {WORKBENCH_MODULES.map(module => {
          const rows = entries.filter(entry => entry.module === module.key)
          const editingHere = editing === 'new:' + module.key
            ? 'new' as const
            : rows.some(row => row.id === editing) ? editing : null
          return (
            <ModuleCard
              key={module.key}
              module={module}
              lang={lang}
              t={t}
              rows={rows}
              editing={editingHere}
              onEdit={value => setEditing(value === 'new' ? 'new:' + module.key : value)}
              data={props.data}
              launch={props.launch}
            />
          )
        })}
      </div>
      <div className="rs-wb-foot">
        <button type="button" className="rs-wb-mini" onClick={exportJson}>{t('wb.export')}</button>
        <button type="button" className="rs-wb-mini" onClick={() => fileRef.current?.click()}>{t('wb.import')}</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={event => {
            const file = event.target.files?.[0]
            if (file !== undefined) importJson(file)
            event.target.value = ''
          }}
        />
        <span className="rs-wb-foot-note">{t('wb.footnote')}</span>
      </div>
    </aside>
  )
}
