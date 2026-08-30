/**
 * reminder locale namespace: settings copy and popup titles. The popup is a
 * native desktop notification; its title/body copy follows the host locale.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'nav': '提醒',
  'settings.title': '提醒弹窗',
  'settings.subtitle': '当你切到其他窗口工作时，任务完成或需要你许可时在屏幕右下角弹出桌面通知；点击通知回到 DSH 界面。DSH 窗口在前台时不弹。无任何音效。',
  'settings.approval': '审批提醒',
  'settings.approvalDesc': '出现等待许可的操作且 DSH 不在前台时，弹出右下角通知。',
  'settings.completion': '完成提醒',
  'settings.completionDesc': '任务回合完成且 DSH 不在前台时，弹出右下角通知，短暂停留后自动消失。',
  'settings.duration': '通知停留时长',
  'settings.durationDesc': '通知自动消失前的停留秒数（3–5 秒）。',
  'settings.failure': '失败/取消提醒',
  'settings.failureDesc': '任务失败或被取消时也弹出提醒。v0.2 版本启用。',
  'settings.permission': '桌面通知权限',
  'settings.permissionAsk': '尚未授权——点击右侧按钮，在浏览器弹窗中选择「允许」。',
  'settings.permissionGranted': '已允许，通知可以正常弹出。',
  'settings.permissionDenied': '已被拒绝——请在浏览器地址栏左侧的站点设置中改为「允许」。',
  'settings.permissionUnsupported': '当前浏览器不支持桌面通知。',
  'settings.permissionButton': '开启并测试通知',
  'settings.testTitle': '测试通知',
  'settings.testBody': '通知通道正常！你切到其他窗口工作时，任务完成/需要审批就会这样提醒你。',
  'popup.completion': '任务完成',
  'popup.approval': '等待你的许可',
} satisfies Record<string, string>

/** The reminder namespace key union. */
export type ReminderKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'nav': 'Reminders',
  'settings.title': 'Reminder notifications',
  'settings.subtitle': 'Desktop notifications at the bottom-right of the screen when a task completes or waits for your approval while you work in other windows; clicking a notification brings you back to DSH. Nothing pops while the DSH window is focused. Never any sound.',
  'settings.approval': 'Approval reminders',
  'settings.approvalDesc': 'Notify when an action waits for your approval and DSH is not in the foreground.',
  'settings.completion': 'Completion reminders',
  'settings.completionDesc': 'Notify when a turn completes and DSH is not in the foreground; the popup fades after a short delay.',
  'settings.duration': 'Notification duration',
  'settings.durationDesc': 'How many seconds a notification stays before it disappears (3–5 s).',
  'settings.failure': 'Failure / cancel reminders',
  'settings.failureDesc': 'Also notify when a task fails or is cancelled. Ships in v0.2.',
  'settings.permission': 'Desktop notification permission',
  'settings.permissionAsk': 'Not granted yet — click the button and choose Allow in the browser prompt.',
  'settings.permissionGranted': 'Allowed; notifications can appear.',
  'settings.permissionDenied': 'Denied — change it to Allow in the browser site settings (lock icon).',
  'settings.permissionUnsupported': 'Desktop notifications are not supported by this browser.',
  'settings.permissionButton': 'Enable and test notifications',
  'settings.testTitle': 'Test notification',
  'settings.testBody': 'The notification channel works! Completion and approval popups will look like this when you work in other windows.',
  'popup.completion': 'Task complete',
  'popup.approval': 'Waiting for your approval',
} satisfies Record<ReminderKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'reminder'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The reminder settings copy. */
    [NS]: ReminderKey
  }
}
