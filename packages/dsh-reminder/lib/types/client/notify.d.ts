/**
 * Cross-window bottom-right notifications (Codex/Workbuddy style) via the
 * browser Notification API. Shown ONLY when the DSH window is not the
 * user's focused foreground window; clicking the popup focuses the DSH
 * window and opens the owning session; the 忽略 action (or the 3-5s
 * auto-close) dismisses it. No sound, ever.
 */
/** Ask for notification permission once (default state only). */
export declare function requestNotifyPermission(): void;
/** Current permission state: 'granted' | 'denied' | 'default' | 'unsupported'. */
export declare function notifyPermission(): NotificationPermission | 'unsupported';
/**
 * Ask for permission from a user gesture (Chrome requires one). Resolves to
 * the settled permission state.
 */
export declare function requestNotifyPermissionFromGesture(): Promise<NotificationPermission | 'unsupported'>;
export interface PopupNotifyOptions {
    /** Dedupe tag: one notification per tag; a later one replaces the earlier. */
    tag: string;
    body: string;
    sessionId: string;
    /** Auto-close after this many milliseconds (clamped to 3-5s by the caller). */
    durationMs: number;
    /** Focus the DSH window and open the session. */
    onOpen: (sessionId: string) => void;
    /** Toast icon (data URL); absent = no icon. */
    icon?: string;
    /** Play the soft two-note chime (default true; requires an unlocked audio context). */
    sound?: boolean;
}
/** 完成：绿色对勾。 */
export declare const ICON_COMPLETION: string;
/** 审批：琥珀感叹号。 */
export declare const ICON_APPROVAL: string;
/** 通用测试：青色铃铛。 */
export declare const ICON_TEST: string;
/** 在首次用户手势中解锁音频（Chrome 自动播放策略要求）。 */
export declare function unlockAudio(): void;
/**
 * Show one cross-window notification popup. Returns false when the
 * environment cannot notify (unsupported/denied).
 */
export declare function popupNotify(title: string, options: PopupNotifyOptions): boolean;
/** Clamp the stored completion-duration seconds into the popup's 3-5s window. */
export declare function popupDurationMs(seconds: number): number;
