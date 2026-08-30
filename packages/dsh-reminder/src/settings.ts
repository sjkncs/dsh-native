/**
 * The reminder settings namespace: every durable dsh-reminder preference,
 * managed from the Web settings page. Registered with the settings provider
 * at plugin load; the client binds the same namespace through
 * ctx.settingsScope and both sides observe live values, so changes take
 * effect without a restart.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import type { ReminderSettings } from './contract.ts'
import {
  DEFAULT_COMPLETION_DURATION,
  DEFAULT_MAX_STACK,
  MAX_COMPLETION_DURATION,
  MAX_MAX_STACK,
  MIN_COMPLETION_DURATION,
  MIN_MAX_STACK,
} from './contract.ts'

/** The branded namespace name (the client binds the same string). */
export const REMINDER_NAMESPACE = settingsNamespace('reminder')

/** Schemastery schema of the reminder namespace section. */
export const ReminderSettingsSchema: z<ReminderSettings> = z.object({
  approvalEnabled: z.boolean().default(true),
  completionEnabled: z.boolean().default(true),
  completionDuration: z.natural().min(MIN_COMPLETION_DURATION).max(MAX_COMPLETION_DURATION).default(DEFAULT_COMPLETION_DURATION),
  approvalClosable: z.boolean().default(true),
  maxStack: z.natural().min(MIN_MAX_STACK).max(MAX_MAX_STACK).default(DEFAULT_MAX_STACK),
  failureEnabled: z.boolean().default(false),
})

/**
 * Register the namespace with the settings provider.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope; v0.1 only needs the registration side effect,
 *   but the handle stays useful for future host-side logic.
 */
export function registerReminderSettings(ctx: Context): SettingsScope<ReminderSettings> {
  return ctx.settings.register(REMINDER_NAMESPACE, ReminderSettingsSchema, { applies: 'live' })
}
