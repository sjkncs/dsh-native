/**
 * The dsh-reminder host Remote service (ctx.reminder, wire namespace
 * reminder). Registered as a TypertRemoteService so the Host Gateway's
 * source-mode discovery exports its @Remote methods to the Web client under
 * /api/reminder/<method>: getSettings reads the durable section, and
 * updateSettings persists one field through the settings owner scope. The
 * channel exists because plugin settings namespaces sit outside the web
 * settings API's namespace allowlist.
 */
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { ReminderSettings, ReminderSettingsUpdate } from './contract.ts'

/** Reminder settings service: plugin-owned durable preferences over the wire. */
export class ReminderRuntime extends TypertRemoteService {
  /**
   * Register the service under the reminder key (the wire namespace).
   * @param ctx - owning cordis context.
   * @param readSettings - live settings read (schema defaults resolve here).
   * @param writeSettings - durable one-field write; returns the resolved section.
   */
  constructor(
    ctx: Context,
    private readonly readSettings: () => ReminderSettings,
    private readonly writeSettings: (update: ReminderSettingsUpdate) => Promise<ReminderSettings>,
  ) {
    super(ctx, 'reminder')
  }

  /** Read the resolved durable settings through the plugin-owned wire. */
  @Remote
  getSettings(): ReminderSettings {
    return this.readSettings()
  }

  /** Persist one settings field and return the resolved section. */
  @Remote
  updateSettings(update: ReminderSettingsUpdate): Promise<ReminderSettings> {
    return this.writeSettings(update)
  }
}
