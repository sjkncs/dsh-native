/**
 * The dsh-reminder durable settings contract, shared verbatim by the host
 * registration (src/settings.ts) and the client contribution
 * (src/client/index.ts binds the same namespace through ctx.settingsScope).
 * Pure types and constants only — no package imports, so both halves and the
 * test build may use it freely.
 */
/** Default self-dismiss duration of a completion card, in seconds. */
export declare const DEFAULT_COMPLETION_DURATION = 8;
/** Allowed duration bounds, in seconds (inclusive). */
export declare const MIN_COMPLETION_DURATION = 3;
export declare const MAX_COMPLETION_DURATION = 30;
/** Default and allowed bounds for the stacked-card cap (inclusive). */
export declare const DEFAULT_MAX_STACK = 5;
export declare const MIN_MAX_STACK = 1;
export declare const MAX_MAX_STACK = 10;
/** The reminder settings namespace's durable shape. */
export interface ReminderSettings {
    /** Whether approval reminder cards appear. */
    approvalEnabled: boolean;
    /** Whether completion reminder cards appear. */
    completionEnabled: boolean;
    /** Self-dismiss duration of a completion card, in seconds (3–30). */
    completionDuration: number;
    /** Whether approval cards offer a manual close button. */
    approvalClosable: boolean;
    /** Maximum number of stacked cards; the oldest card yields first. */
    maxStack: number;
    /** Reserved for v0.2 (failure/cancelled reminders); inactive in v0.1. */
    failureEnabled: boolean;
}
/** Factory defaults, matching the host schema defaults. */
export declare function defaultReminderSettings(): ReminderSettings;
/**
 * Clamp a wire section into a complete settings value: missing fields fall
 * back to factory defaults, numeric fields are clamped to their allowed
 * bounds. The host schema already validates writes; this guards the client
 * against a section read before first acceptance or an out-of-band edit.
 */
export declare function normalizeReminderSettings(raw: Partial<ReminderSettings> | undefined | null): ReminderSettings;
/** Field names of the settings section (the client write path uses these). */
export type ReminderSettingsField = keyof ReminderSettings;
/** One field update sent through the plugin-owned settings Remote. */
export type ReminderSettingsUpdate = {
    readonly field: 'approvalEnabled';
    readonly value: boolean;
} | {
    readonly field: 'completionEnabled';
    readonly value: boolean;
} | {
    readonly field: 'completionDuration';
    readonly value: number;
} | {
    readonly field: 'approvalClosable';
    readonly value: boolean;
} | {
    readonly field: 'maxStack';
    readonly value: number;
} | {
    readonly field: 'failureEnabled';
    readonly value: boolean;
};
