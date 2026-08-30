/**
 * dsh-reminder client plugin: Codex/Workbuddy-style cross-window reminders.
 * Mounts the plugin-owned settings Remote (plugin namespaces are outside
 * the web settings API's allowlist), observes the session list and the
 * staged conversation snapshot, and — ONLY when the DSH window is not the
 * user's focused foreground window — pops a bottom-right desktop
 * notification when a task completes or an approval waits for the user.
 * Clicking the popup focuses DSH and opens the session; 忽略 dismisses it;
 * it auto-closes after 3-5s. No sound, no in-page cards.
 */
// Type-only: the settings.section SlotMap (the settings surface contract).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the forwarded Host-event face and SessionId branding.
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import {
  createSnapshotStore,
  type ClientContext,
  type ISessions,
} from '@deepseek-ai/dsh-client-runtime/client'
import { NS, zh, en } from './locales.ts'
import { adoptStyles } from './styles.ts'
import { ReminderSection, type ReminderSectionInjected } from './SettingsSection.tsx'
import { REMINDER_REMOTE } from './remote.ts'
import {
  diffCompletedFlags,
  diffRunningIdle,
  diffStagedConversation,
  formatDuration,
  type PendingApprovalView,
  type SessionRow,
  type StagedConversationView,
} from './controller.ts'
import { ICON_APPROVAL, ICON_COMPLETION, popupDurationMs, popupNotify, requestNotifyPermission, unlockAudio } from './notify.ts'
import {
  defaultReminderSettings,
  normalizeReminderSettings,
  type ReminderSettings,
  type ReminderSettingsUpdate,
} from '../contract.ts'

/** Required services: sessions projection, wire handle, remote face, slots, and locale. */
export const inject = ['sessions', 'connection', 'remote', 'slots', 'locale']

/** Placeholder approval id for the list-status-only fallback (no conversation wait visible yet). */
const FALLBACK_APPROVAL_ID = ''

/** 后台会话兜底通道的去重时间窗：同刻双通道触发只弹一次，新周期可再弹。 */
const FLAG_DEDUPE_WINDOW_MS = 8000

const asSessionId = (value: string): SessionId => value as unknown as SessionId

/**
 * Compose the reminder surface.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-reminder: dictionaries')
  // Stable translate: reads the active locale at call time (popups, nav label).
  const t = ctx.locale.bind(NS)
  requestNotifyPermission()
  const log = (...args: unknown[]): void => {
    console.info('[dsh-reminder]', ...args)
  }
  const notifyState = (): string => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  }
  // 调试出口：把事件记录挂到 window 上，便于排查（只读数组）
  const debugEvents: string[] = []
  const record = (text: string): void => {
    log(text)
    debugEvents.push(Date.now() + ' ' + text)
    ;(window as unknown as { __dshReminderDebug?: { events: string[] } }).__dshReminderDebug = { events: debugEvents }
  }
  record('loaded (cross-window notify v0.2); permission=' + notifyState())

  const sessions = ctx.get('sessions') as unknown as ISessions

  // ---- settings transport (plugin-owned Typert Remote) ---------------------
  const settingsStore = createSnapshotStore({ value: defaultReminderSettings() })
  let currentSettings: ReminderSettings = defaultReminderSettings()
  const syncSettings = (value: ReminderSettings | undefined): void => {
    currentSettings = normalizeReminderSettings(value)
    settingsStore.set({ value: currentSettings })
  }

  /** The mounted reminder namespace service's callable face. */
  interface ReminderNamespaceFace {
    getSettings(): Promise<{ ok: true; value: ReminderSettings } | { ok: false; error: { code: string; message: string; details: object } }>
    updateSettings(update: ReminderSettingsUpdate): Promise<{ ok: true; value: ReminderSettings } | { ok: false; error: { code: string; message: string; details: object } }>
  }

  let reminderRemote: ReminderNamespaceFace | undefined
  let settingsGeneration = 0
  let settingsTail: Promise<void> = Promise.resolve()

  const loadSettings = async (): Promise<void> => {
    const remote = reminderRemote
    if (remote === undefined) return
    const generation = ++settingsGeneration
    try {
      const result = await remote.getSettings()
      if (reminderRemote !== remote || generation !== settingsGeneration) return
      if (result.ok) syncSettings(result.value)
    } catch (error) {
      if (reminderRemote === remote && generation === settingsGeneration) {
        console.error('[dsh-reminder] settings read failed:', error)
      }
    }
  }

  const updateSettings = (update: ReminderSettingsUpdate): Promise<void> => {
    const operation = settingsTail.then(async () => {
      const remote = reminderRemote
      if (remote === undefined) return
      const generation = ++settingsGeneration
      try {
        const result = await remote.updateSettings(update)
        if (reminderRemote !== remote || generation !== settingsGeneration) return
        if (result.ok) syncSettings(result.value)
      } catch (error) {
        if (reminderRemote === remote && generation === settingsGeneration) {
          console.error('[dsh-reminder] settings update failed:', error)
        }
      }
    })
    settingsTail = operation.catch(() => {})
    return operation
  }

  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(REMINDER_REMOTE)
    reminderRemote = (ctx.reflect as unknown as { get(name: string): unknown }).get('remote.reminder') as ReminderNamespaceFace | undefined
    if (reminderRemote === undefined) {
      throw new Error('dsh-reminder: the reminder Remote namespace did not mount')
    }
    await loadSettings()
    return () => {
      settingsGeneration += 1
      reminderRemote = undefined
      void dispose()
    }
  }, 'dsh-reminder: remote')

  // Chrome 的自动播放策略：音频上下文必须在用户手势中创建/恢复。
  // 首次点击/按键即解锁音频；权限仍为 default 时顺带申请一次。
  {
    const gesture = (): void => {
      unlockAudio()
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        requestNotifyPermission()
        record('permission requested from user gesture; result=' + notifyState())
      }
      window.removeEventListener('pointerdown', gesture)
      window.removeEventListener('keydown', gesture)
    }
    window.addEventListener('pointerdown', gesture)
    window.addEventListener('keydown', gesture)
  }

  // ---- snapshot projections ----------------------------------------------
  const listRows = (): Map<string, SessionRow> => {
    const snap = sessions.list.getSnapshot()
    const rows = new Map<string, SessionRow>()
    for (const id of snap.ids) {
      const row = snap.byId[id]
      if (row === undefined) continue
      rows.set(row.id, {
        sessionId: row.id,
        displayTitle: row.displayTitle,
        running: row.running,
        pendingInteraction: row.pendingInteraction,
        completed: row.completed,
      })
    }
    return rows
  }

  const toWaitView = (wait: unknown): PendingApprovalView | undefined => {
    if (typeof wait !== 'object' || wait === null) return undefined
    const candidate = wait as { kind?: unknown; payload?: unknown }
    if (candidate.kind !== 'approval' || typeof candidate.payload !== 'object' || candidate.payload === null) return undefined
    const payload = candidate.payload as { approvalId?: unknown; toolName?: unknown; reason?: unknown }
    if (typeof payload.approvalId !== 'string') return undefined
    return {
      approvalId: payload.approvalId,
      toolName: typeof payload.toolName === 'string' ? payload.toolName : '',
      reason: typeof payload.reason === 'string' ? payload.reason : undefined,
    }
  }

  /** Approval waits of one session; binding replay makes them visible even for never-staged sessions. */
  const approvalWaitsOf = (sessionId: string): PendingApprovalView[] => {
    const binding = sessions.binding(asSessionId(sessionId))
    const conv = binding?.session.getSnapshot()
    if (conv === undefined) return []
    const waits: PendingApprovalView[] = []
    for (const wait of conv.pending) {
      const view = toWaitView(wait)
      if (view !== undefined) waits.push(view)
    }
    return waits
  }

  const stagedView = (sessionId: string): StagedConversationView | undefined => {
    const conv = sessions.binding(asSessionId(sessionId))?.session.getSnapshot()
    if (conv === undefined) return undefined
    const pendingApprovals: PendingApprovalView[] = []
    for (const wait of conv.pending) {
      const view = toWaitView(wait)
      if (view !== undefined) pendingApprovals.push(view)
    }
    return {
      running: conv.running,
      lastAgentError: conv.lastAgentError,
      turnEnds: [...conv.turnEnds.keys()].sort((a, b) => a - b),
      turnTimings: conv.turnTimings,
      pendingApprovals,
      openState: String(conv.openState ?? 'open'),
    }
  }

  // ---- popup emitters ------------------------------------------------------
  const notifiedCompletions = new Set<string>()
  const lastFlagFire = new Map<string, number>()
  const seenApprovals = new Set<string>()

  const notifyCompletion = (sessionId: string, displayTitle: string, turn: number | undefined, durationMs: number | undefined): void => {
    if (!currentSettings.completionEnabled) {
      record('completion skipped: completionEnabled=false')
      return
    }
    let key: string
    if (turn !== undefined) {
      // 当前会话：按 (会话, 回合) 永久去重
      key = sessionId + '#turn' + String(turn)
      if (notifiedCompletions.has(key)) return
      notifiedCompletions.add(key)
    } else {
      // 后台会话兜底：时间窗去重（双通道同刻触发只弹一次；新周期可再弹）
      const now = Date.now()
      const last = lastFlagFire.get(sessionId) ?? 0
      if (now - last < FLAG_DEDUPE_WINDOW_MS) return
      lastFlagFire.set(sessionId, now)
      key = sessionId + '#flag:' + String(now)
    }
    const body = durationMs === undefined ? displayTitle : displayTitle + ' · ' + formatDuration(durationMs)
    const shown = popupNotify(t('popup.completion'), {
      tag: key,
      body,
      sessionId,
      durationMs: popupDurationMs(currentSettings.completionDuration),
      icon: ICON_COMPLETION,
      onOpen: (id) => { sessions.open(asSessionId(id)) },
    })
    record('completion popup ' + (shown ? 'SHOWN: ' : 'BLOCKED (permission=' + notifyState() + '): ') + key)
  }

  const notifyApprovals = (sessionId: string, displayTitle: string, waits: PendingApprovalView[]): void => {
    if (!currentSettings.approvalEnabled) return
    for (const wait of waits) {
      const key = sessionId + ':' + wait.approvalId
      if (seenApprovals.has(key)) continue
      seenApprovals.add(key)
      const body = wait.toolName !== '' ? wait.toolName : displayTitle
      const shown = popupNotify(t('popup.approval'), {
        tag: key,
        body,
        sessionId,
        durationMs: popupDurationMs(currentSettings.completionDuration),
        icon: ICON_APPROVAL,
        onOpen: (id) => { sessions.open(asSessionId(id)) },
      })
      record('approval popup ' + (shown ? 'SHOWN: ' : 'BLOCKED (permission=' + notifyState() + '): ') + key + ' body=' + body)
    }
  }

  // ---- staged (current) conversation tracking ------------------------------
  let prevCompletedFlags: Map<string, boolean> | undefined
  let prevRunningFlags: Map<string, boolean> | undefined
  let prevStaged: StagedConversationView | undefined
  let stagedSessionId: string | undefined
  let stagedDispose: (() => void) | undefined

  const detachStaged = (): void => {
    stagedDispose?.()
    stagedDispose = undefined
    stagedSessionId = undefined
    prevStaged = undefined
  }

  const attachStaged = (sessionId: string | undefined): void => {
    detachStaged()
    if (sessionId === undefined) return
    const binding = sessions.binding(asSessionId(sessionId))
    const session = binding?.session
    if (session === undefined) return
    stagedSessionId = sessionId
    // 切回会话时窗口异步重建：openState='loading' 期间到达的历史回合只进基线，
    // 不弹通知（否则会把离开期间的旧回合当成新完成补弹）。
    let baselinePending = true
    prevStaged = stagedView(sessionId)
    if (prevStaged !== undefined && prevStaged.openState !== 'loading') baselinePending = false
    stagedDispose = session.subscribe(() => {
      const view = stagedView(sessionId)
      if (view === undefined) return
      if (baselinePending) {
        prevStaged = view
        if (view.openState !== 'loading') baselinePending = false
        return
      }
      const diff = diffStagedConversation(prevStaged, view)
      prevStaged = view
      const hit = diff.completedTurn
      if (hit === undefined) return
      const turn = hit.turn
      const startTime = hit.startTime
      const endTime = hit.endTime
      const row = sessions.list.getSnapshot().byId[asSessionId(sessionId)]
      const durationMs = endTime !== undefined && startTime !== undefined ? Math.max(0, endTime - startTime) : undefined
      notifyCompletion(sessionId, row?.displayTitle ?? sessionId, turn, durationMs)
    })
  }

  // ---- session list reconciliation -----------------------------------------
  const applyList = (): void => {
    const snap = sessions.list.getSnapshot()
    const rows = listRows()
    const current = snap.current === undefined ? undefined : String(snap.current)

    // 后台会话完成：平台 completed 标记 + running→idle 兜底双通道。
    // 同一去重键（sessionId#flag），任一通道先到即弹，另一通道自动跳过。
    const flagDiff = diffCompletedFlags(prevCompletedFlags, rows)
    prevCompletedFlags = new Map([...rows].map(([id, row]) => [id, row.completed === true]))
    const idleDiff = diffRunningIdle(prevRunningFlags, rows, current)
    prevRunningFlags = new Map([...rows].map(([id, row]) => [id, row.running === true]))
    for (const hit of [...flagDiff.additions, ...idleDiff.additions]) {
      notifyCompletion(hit.sessionId, hit.displayTitle, undefined, undefined)
    }

    // Approvals: notify each NEW approval id (edge-based, remembered forever).
    for (const [id, row] of rows) {
      if (row.pendingInteraction !== 'approval') continue
      let waits = approvalWaitsOf(id)
      if (waits.length === 0) waits = [{ approvalId: FALLBACK_APPROVAL_ID, toolName: '', reason: undefined }]
      notifyApprovals(id, row.displayTitle, waits)
    }

    if (current !== stagedSessionId) attachStaged(current)
  }
  ctx.effect(() => sessions.list.subscribe(applyList), 'dsh-reminder: session list')
  applyList()

  // Reconnect: bindings die with the generation; re-attach after the next list pull.
  ctx.on('connection/reset', () => {
    detachStaged()
    void loadSettings()
    const current = sessions.list.getSnapshot().current
    attachStaged(current === undefined ? undefined : String(current))
  })

  // ---- settings section -----------------------------------------------------
  // Slot contract: the registrant owns its localized label and re-registers
  // with fresh text on locale change; the shell never subscribes locale state.
  let sectionDispose: (() => void) | undefined
  let lastActive = ctx.locale.getSnapshot().active
  const mountSection = (): void => {
    sectionDispose?.()
    sectionDispose = ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'reminder',
      order: 60,
      label: () => t('nav'),
      locale: NS,
      inject: (): ReminderSectionInjected => ({
        hooks: { settings: settingsStore },
        // The section hands each field its correctly-typed value; the cast
        // narrows to the wire's discriminated union.
        update: async (field, value) => {
          await updateSettings({ field, value } as unknown as ReminderSettingsUpdate)
        },
      }),
    }, ReminderSection))
  }
  ctx.effect(() => {
    mountSection()
    const unsubscribe = ctx.locale.subscribe(() => {
      const active = ctx.locale.getSnapshot().active
      if (active === lastActive) return
      lastActive = active
      mountSection()
    })
    return () => {
      unsubscribe()
      sectionDispose?.()
      sectionDispose = undefined
    }
  }, 'dsh-reminder: settings section')
}
