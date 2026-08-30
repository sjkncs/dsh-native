/**
 * The reminder settings page: switches for the two reminder kinds, the
 * popup duration (3-5s), and an explicit notification-permission row
 * (Chrome only shows the permission prompt from a user gesture). Every
 * settings write goes through the injected update verb -> ctx remote
 * updateSettings.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useEffect, useState, type ReactElement } from 'react'
import {
  defaultReminderSettings,
  type ReminderSettings,
  type ReminderSettingsField,
} from '../contract.ts'
import type { SettingsStoreFace } from './settings-store.ts'
import { ICON_TEST, notifyPermission, popupNotify, popupDurationMs, requestNotifyPermissionFromGesture } from './notify.ts'

/** Injected business face: the live settings source and the durable write verb. */
export interface ReminderSectionInjected {
  hooks: { settings: SettingsStoreFace }
  update: (field: ReminderSettingsField, value: unknown) => Promise<void>
}

/** Full section props: runtime share + injected face + locale seat. */
export type ReminderSectionProps = PropsRuntime<'settings.section'> & InjectFace<ReminderSectionInjected> & PropsLocale<'reminder'>

interface ToggleRowProps {
  label: string
  desc: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}

function ToggleRow({ label, desc, checked, disabled = false, onChange }: ToggleRowProps): ReactElement {
  return (
    <label className={'dsh_reminder_row' + (disabled ? ' dsh_reminder_row_disabled' : '')}>
      <input
        type="checkbox"
        className="dsh_reminder_checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => { onChange(event.target.checked) }}
      />
      <span className="dsh_reminder_rowText">
        <span className="dsh_reminder_rowTitle">{label}</span>
        <span className="dsh_reminder_rowDesc">{desc}</span>
      </span>
    </label>
  )
}

interface RangeRowProps {
  label: string
  desc: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (next: number) => void
}

function RangeRow({ label, desc, value, min, max, unit, onChange }: RangeRowProps): ReactElement {
  return (
    <div className="dsh_reminder_row">
      <span className="dsh_reminder_rowText">
        <span className="dsh_reminder_rowTitle">{label}</span>
        <span className="dsh_reminder_rowDesc">{desc}</span>
      </span>
      <span className="dsh_reminder_rangeValue">{value + unit}</span>
      <input
        type="range"
        className="dsh_reminder_range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(event) => { onChange(Number(event.target.value)) }}
      />
    </div>
  )
}

/** Permission row: live state + a gesture-triggered request button. */
function PermissionRow({ t }: { t: (key: import('./locales.ts').ReminderKey, params?: Record<string, string>) => string }): ReactElement {
  const [state, setState] = useState<ReturnType<typeof notifyPermission>>(notifyPermission())
  useEffect(() => {
    const refresh = (): void => { setState(notifyPermission()) }
    // 权限在站外可能被改（浏览器站点设置）；轮询兜底
    const id = setInterval(refresh, 1500)
    return () => { clearInterval(id) }
  }, [])
  const label = state === 'granted' ? t('settings.permissionGranted')
    : state === 'denied' ? t('settings.permissionDenied')
    : state === 'unsupported' ? t('settings.permissionUnsupported')
    : t('settings.permissionAsk')
  return (
    <div className="dsh_reminder_row">
      <span className="dsh_reminder_rowText">
        <span className="dsh_reminder_rowTitle">{t('settings.permission')}</span>
        <span className="dsh_reminder_rowDesc">{label}</span>
      </span>
      {state !== 'unsupported' && (
        <button
          type="button"
          className="dsh_reminder_permissionButton"
          onClick={() => {
            void requestNotifyPermissionFromGesture().then((next) => {
              setState(next)
              if (next === 'granted') {
                // 授权成功立刻发一条测试通知，验证整条显示链路
                popupNotify(t('settings.testTitle'), {
                  tag: 'permission-test-' + String(Date.now()),
                  body: t('settings.testBody'),
                  sessionId: '',
                  durationMs: popupDurationMs(4),
                  icon: ICON_TEST,
                  onOpen: () => undefined,
                })
              }
            })
          }}
        >
          {t('settings.permissionButton')}
        </button>
      )}
    </div>
  )
}

/**
 * Render the reminder settings page.
 * @param props - runtime share, injected face (useSettings + update), locale seat.
 */
export function ReminderSection({ useSettings, update, t }: ReminderSectionProps): ReactElement {
  const settings = useSettings((snapshot) => snapshot.value) ?? defaultReminderSettings()
  return (
    <section className="dsh_reminder_section" aria-labelledby="dsh-reminder-settings-title">
      <h2 id="dsh-reminder-settings-title" className="dsh_reminder_sectionTitle">{t('settings.title')}</h2>
      <p className="dsh_reminder_sectionSubtitle">{t('settings.subtitle')}</p>
      <PermissionRow t={t} />
      <ToggleRow
        label={t('settings.approval')}
        desc={t('settings.approvalDesc')}
        checked={settings.approvalEnabled}
        onChange={(next) => { void update('approvalEnabled', next) }}
      />
      <ToggleRow
        label={t('settings.completion')}
        desc={t('settings.completionDesc')}
        checked={settings.completionEnabled}
        onChange={(next) => { void update('completionEnabled', next) }}
      />
      <RangeRow
        label={t('settings.duration')}
        desc={t('settings.durationDesc')}
        value={settings.completionDuration}
        min={3}
        max={5}
        unit="s"
        onChange={(next) => { void update('completionDuration', next) }}
      />
      <ToggleRow
        label={t('settings.failure')}
        desc={t('settings.failureDesc')}
        checked={settings.failureEnabled}
        disabled
        onChange={() => undefined}
      />
    </section>
  )
}
