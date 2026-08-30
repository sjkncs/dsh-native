/**
 * The dsh-reminder durable settings contract, shared verbatim by the host
 * registration (src/settings.ts) and the client contribution
 * (src/client/index.ts binds the same namespace through ctx.settingsScope).
 * Pure types and constants only — no package imports, so both halves and the
 * test build may use it freely.
 */

/** Default self-dismiss duration of a completion card, in seconds. */
export const DEFAULT_COMPLETION_DURATION = 8
/** Allowed duration bounds, in seconds (inclusive). */
export const MIN_COMPLETION_DURATION = 3
export const MAX_COMPLETION_DURATION = 30
/** Default and allowed bounds for the stacked-card cap (inclusive). */
export const DEFAULT_MAX_STACK = 5
export const MIN_MAX_STACK = 1
export const MAX_MAX_STACK = 10

/** The reminder settings namespace's durable shape. */
export interface ReminderSettings {
  /** Whether approval reminder cards appear. */
  approvalEnabled: boolean
  /** Whether completion reminder cards appear. */
  completionEnabled: boolean
  /** Self-dismiss duration of a completion card, in seconds (3–30). */
  completionDuration: number
  /** Whether approval cards offer a manual close button. */
  approvalClosable: boolean
  /** Maximum number of stacked cards; the oldest card yields first. */
  maxStack: number
  /** Reserved for v0.2 (failure/cancelled reminders); inactive in v0.1. */
  failureEnabled: boolean
}

/** Factory defaults, matching the host schema defaults. */
export function defaultReminderSettings(): ReminderSettings {
  return {
    approvalEnabled: true,
    completionEnabled: true,
    completionDuration: DEFAULT_COMPLETION_DURATION,
    approvalClosable: true,
    maxStack: DEFAULT_MAX_STACK,
    failureEnabled: false,
  }
}

/**
 * Clamp a wire section into a complete settings value: missing fields fall
 * back to factory defaults, numeric fields are clamped to their allowed
 * bounds. The host schema already validates writes; this guards the client
 * against a section read before first acceptance or an out-of-band edit.
 */
export function normalizeReminderSettings(raw: Partial<ReminderSettings> | undefined | null): ReminderSettings {
  const defaults = defaultReminderSettings()
  const value = raw ?? {}
  const clamp = (n: number | undefined, lo: number, hi: number, fallback: number): number => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
    return Math.min(hi, Math.max(lo, Math.round(n)))
  }
  return {
    approvalEnabled: typeof value.approvalEnabled === 'boolean' ? value.approvalEnabled : defaults.approvalEnabled,
    completionEnabled: typeof value.completionEnabled === 'boolean' ? value.completionEnabled : defaults.completionEnabled,
    completionDuration: clamp(value.completionDuration, MIN_COMPLETION_DURATION, MAX_COMPLETION_DURATION, defaults.completionDuration),
    approvalClosable: typeof value.approvalClosable === 'boolean' ? value.approvalClosable : defaults.approvalClosable,
    maxStack: clamp(value.maxStack, MIN_MAX_STACK, MAX_MAX_STACK, defaults.maxStack),
    failureEnabled: typeof value.failureEnabled === 'boolean' ? value.failureEnabled : defaults.failureEnabled,
  }
}

/** Field names of the settings section (the client write path uses these). */
export type ReminderSettingsField = keyof ReminderSettings

/** One field update sent through the plugin-owned settings Remote. */
export type ReminderSettingsUpdate =
  | { readonly field: 'approvalEnabled'; readonly value: boolean }
  | { readonly field: 'completionEnabled'; readonly value: boolean }
  | { readonly field: 'completionDuration'; readonly value: number }
  | { readonly field: 'approvalClosable'; readonly value: boolean }
  | { readonly field: 'maxStack'; readonly value: number }
  | { readonly field: 'failureEnabled'; readonly value: boolean }

