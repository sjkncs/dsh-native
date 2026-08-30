/**
 * Cross-window bottom-right notifications (Codex/Workbuddy style) via the
 * browser Notification API. Shown ONLY when the DSH window is not the
 * user's focused foreground window; clicking the popup focuses the DSH
 * window and opens the owning session; the 忽略 action (or the 3-5s
 * auto-close) dismisses it. No sound, ever.
 */

/** Ask for notification permission once (default state only). */
export function requestNotifyPermission(): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') {
    void Notification.requestPermission().catch(() => {})
  }
}

/** Current permission state: 'granted' | 'denied' | 'default' | 'unsupported'. */
export function notifyPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Ask for permission from a user gesture (Chrome requires one). Resolves to
 * the settled permission state.
 */
export async function requestNotifyPermissionFromGesture(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export interface PopupNotifyOptions {
  /** Dedupe tag: one notification per tag; a later one replaces the earlier. */
  tag: string
  body: string
  sessionId: string
  /** Auto-close after this many milliseconds (clamped to 3-5s by the caller). */
  durationMs: number
  /** Focus the DSH window and open the session. */
  onOpen: (sessionId: string) => void
  /** Toast icon (data URL); absent = no icon. */
  icon?: string
  /** Play the soft two-note chime (default true; requires an unlocked audio context). */
  sound?: boolean
}

// ---- 图标（SVG data URL；Chrome 桌面通知展示于横幅左侧） -------------------
function svgIcon(color: string, glyph: string): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
    '<rect width="64" height="64" rx="14" fill="#101216"/>' +
    '<circle cx="32" cy="32" r="21" fill="none" stroke="' + color + '" stroke-width="4"/>' +
    glyph +
    '</svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/** 完成：绿色对勾。 */
export const ICON_COMPLETION = svgIcon('#34c77b', '<path d="M22 33l7 7 13-15" fill="none" stroke="#34c77b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
/** 审批：琥珀感叹号。 */
export const ICON_APPROVAL = svgIcon('#ffbf00', '<path d="M32 19v14" stroke="#ffbf00" stroke-width="4.5" stroke-linecap="round"/><circle cx="32" cy="43" r="2.6" fill="#ffbf00"/>')
/** 通用测试：青色铃铛。 */
export const ICON_TEST = svgIcon('#4da3ff', '<path d="M32 15a10 10 0 0 0-10 10v7l-4 6h28l-4-6v-7a10 10 0 0 0-10-10z" fill="none" stroke="#4da3ff" stroke-width="4" stroke-linejoin="round"/><path d="M28 43a4 4 0 0 0 8 0" fill="none" stroke="#4da3ff" stroke-width="4" stroke-linecap="round"/>')

// ---- 提示音（Web Audio 双音符轻和弦，E5→A5） ------------------------------
let audioContext: AudioContext | null = null

/** 在首次用户手势中解锁音频（Chrome 自动播放策略要求）。 */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return
  if (audioContext === null) {
    try {
      audioContext = new AudioContext()
    } catch {
      return
    }
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => {})
  }
}

/** 播放轻柔双音符提示音（约 0.4s；未解锁则先尝试恢复再播）。 */
function playChime(): void {
  const ctx = audioContext
  if (ctx === null) return
  const schedule = (): void => {
    const now = ctx.currentTime
    const note = (freq: number, start: number, duration: number, sub = false): void => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const peak = sub ? 0.045 : 0.16
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(peak, now + start + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.05)
    }
    // 比中间值略低一档：D4 → A4，垫音更厚
    note(293.66, 0, 0.3)          // D4 主音
    note(146.83, 0, 0.3, true)    // D3 垫
    note(440, 0.28, 0.34)         // A4 主音
    note(220, 0.28, 0.34, true)   // A3 垫
  }
  if (ctx.state === 'running') {
    schedule()
  } else {
    void ctx.resume().then(() => {
      if (ctx.state === 'running') schedule()
    }).catch(() => {})
  }
}

/**
 * Show one cross-window notification popup. Returns false when the
 * environment cannot notify (unsupported/denied).
 */
export function popupNotify(title: string, options: PopupNotifyOptions): boolean {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') {
    requestNotifyPermission()
    return false
  }
  // 注意：Chrome 页面上下文创建的 Notification 不允许带 actions
  // （只有 ServiceWorker 持久通知才支持），带 actions 会直接抛异常。
  // 关闭/忽略由自动消散（3-5s）承担，点击本体即回 DSH。
  const notificationOptions = {
    body: options.body,
    tag: options.tag,
    silent: true,
    ...(options.icon !== undefined ? { icon: options.icon } : {}),
  } as NotificationOptions
  let notification: Notification
  try {
    notification = new Notification(title, notificationOptions)
  } catch (error) {
    const debug = (window as unknown as { __dshReminderDebug?: { events: string[] } }).__dshReminderDebug
    const message = error instanceof Error ? (error.name + ': ' + error.message) : String(error)
    if (debug !== undefined && debug !== null) debug.events.push(Date.now() + ' notification construct FAILED: ' + message)
    console.error('[dsh-reminder] notification construct failed:', error)
    return false
  }
  console.info('[dsh-reminder] notification created:', title, '| tag=' + options.tag)
  if (options.sound !== false) playChime()
  const timer = setTimeout(() => {
    notification.close()
  }, options.durationMs)
  notification.onclick = () => {
    clearTimeout(timer)
    notification.close()
    window.focus()
    options.onOpen(options.sessionId)
  }
  notification.onclose = () => {
    clearTimeout(timer)
  }
  return true
}

/** Clamp the stored completion-duration seconds into the popup's 3-5s window. */
export function popupDurationMs(seconds: number): number {
  if (!Number.isFinite(seconds)) return 4000
  return Math.min(5, Math.max(3, Math.round(seconds))) * 1000
}
