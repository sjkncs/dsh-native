/**
 * The reminder settings namespace: every durable dsh-reminder preference,
 * managed from the Web settings page. Registered with the settings provider
 * at plugin load; the client binds the same namespace through
 * ctx.settingsScope and both sides observe live values, so changes take
 * effect without a restart.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type SettingsScope } from '@deepseek-ai/dsh-settings';
import type { ReminderSettings } from './contract.ts';
/** The branded namespace name (the client binds the same string). */
export declare const REMINDER_NAMESPACE: Branded<"SettingsNamespace">;
/** Schemastery schema of the reminder namespace section. */
export declare const ReminderSettingsSchema: z<ReminderSettings>;
/**
 * Register the namespace with the settings provider.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope; v0.1 only needs the registration side effect,
 *   but the handle stays useful for future host-side logic.
 */
export declare function registerReminderSettings(ctx: Context): SettingsScope<ReminderSettings>;
