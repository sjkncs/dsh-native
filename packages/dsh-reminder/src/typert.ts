/**
 * The hand-written host Typert manifest for the reminder Remote. Registered
 * through ctx.typert.register in the plugin body, it claims the wire
 * endpoints through the strict registry — the same path generated ./typert
 * artifacts use — so the Host Gateway resolves plugin-owned settings calls
 * without consulting the @Remote marker table.
 */
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types'
import { REMINDER_INVOCATIONS } from './wire.ts'

/** The reminder namespace's host manifest (strict codecs shared with the client). */
export const TYPERT_MANIFEST: TypertContribution = {
  package: 'dsh-reminder',
  face: 'host',
  schemas: [],
  model: {
    services: [
      {
        key: 'reminder',
        exportName: 'ReminderRuntime',
        description: 'Durable reminder preferences for the popup cards.',
        tags: [],
        members: [
          {
            kind: 'method',
            name: 'getSettings',
            signature: 'getSettings(): ReminderSettings',
          },
          {
            kind: 'method',
            name: 'updateSettings',
            signature: 'updateSettings(update: ReminderSettingsUpdate): Promise<ReminderSettings>',
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: REMINDER_INVOCATIONS,
}
