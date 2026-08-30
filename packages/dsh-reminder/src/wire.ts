/**
 * The reminder wire contract, shared verbatim by the host manifest
 * (ctx.typert.register in typert.ts) and the client contribution
 * (ctx.remote.$mount in client/remote.ts). The service exposes plugin-owned
 * settings access — the durable reminder preferences travel this channel
 * because plugin settings namespaces are outside the web settings API's
 * explicit namespace allowlist (see dsh-host-apiproxy exposedNamespaces).
 */
import { z } from 'zod'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import type { ReminderSettings, ReminderSettingsUpdate } from './contract.ts'

/** Strict wire codec for the resolved reminder settings section. */
export const reminderSettingsSchema = z.object({
  approvalEnabled: z.boolean(),
  completionEnabled: z.boolean(),
  completionDuration: z.number(),
  approvalClosable: z.boolean(),
  maxStack: z.number(),
  failureEnabled: z.boolean(),
}).readonly()

/** Strict wire codec for one field update. */
export const reminderSettingsUpdateSchema = z.discriminatedUnion('field', [
  z.object({ field: z.literal('approvalEnabled'), value: z.boolean() }).readonly(),
  z.object({ field: z.literal('completionEnabled'), value: z.boolean() }).readonly(),
  z.object({ field: z.literal('completionDuration'), value: z.number() }).readonly(),
  z.object({ field: z.literal('approvalClosable'), value: z.boolean() }).readonly(),
  z.object({ field: z.literal('maxStack'), value: z.number() }).readonly(),
  z.object({ field: z.literal('failureEnabled'), value: z.boolean() }).readonly(),
])

/** The reminder Remote namespace's strict invocation descriptors. */
export const REMINDER_INVOCATIONS: readonly InvocationDescriptor[] = [
  {
    id: 'dsh-reminder#reminder/getSettings',
    service: 'reminder',
    namespace: 'reminder',
    method: 'getSettings',
    invocation: { kind: 'direct' },
    parameters: [],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-reminder#ReminderSettings',
      schema: reminderSettingsSchema,
    },
  },
  {
    id: 'dsh-reminder#reminder/updateSettings',
    service: 'reminder',
    namespace: 'reminder',
    method: 'updateSettings',
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'update',
        wire: 'update',
        source: 'json',
        codec: {
          mode: 'strict',
          typeSymbol: 'dsh-reminder#ReminderSettingsUpdate',
          schema: reminderSettingsUpdateSchema,
        },
      },
    ],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-reminder#ReminderSettings',
      schema: reminderSettingsSchema,
    },
  },
]

/** The wire update payload type check (keeps the contract honest with the schema). */
export type ReminderSettingsWireUpdate = z.infer<typeof reminderSettingsUpdateSchema>
