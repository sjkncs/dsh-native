/**
 * The reminder wire contract, shared verbatim by the host manifest
 * (ctx.typert.register in typert.ts) and the client contribution
 * (ctx.remote.$mount in client/remote.ts). The service exposes plugin-owned
 * settings access — the durable reminder preferences travel this channel
 * because plugin settings namespaces are outside the web settings API's
 * explicit namespace allowlist (see dsh-host-apiproxy exposedNamespaces).
 */
import { z } from 'zod';
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
/** Strict wire codec for the resolved reminder settings section. */
export declare const reminderSettingsSchema: z.ZodReadonly<z.ZodObject<{
    approvalEnabled: z.ZodBoolean;
    completionEnabled: z.ZodBoolean;
    completionDuration: z.ZodNumber;
    approvalClosable: z.ZodBoolean;
    maxStack: z.ZodNumber;
    failureEnabled: z.ZodBoolean;
}, z.core.$strip>>;
/** Strict wire codec for one field update. */
export declare const reminderSettingsUpdateSchema: z.ZodDiscriminatedUnion<[z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"approvalEnabled">;
    value: z.ZodBoolean;
}, z.core.$strip>>, z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"completionEnabled">;
    value: z.ZodBoolean;
}, z.core.$strip>>, z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"completionDuration">;
    value: z.ZodNumber;
}, z.core.$strip>>, z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"approvalClosable">;
    value: z.ZodBoolean;
}, z.core.$strip>>, z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"maxStack">;
    value: z.ZodNumber;
}, z.core.$strip>>, z.ZodReadonly<z.ZodObject<{
    field: z.ZodLiteral<"failureEnabled">;
    value: z.ZodBoolean;
}, z.core.$strip>>], "field">;
/** The reminder Remote namespace's strict invocation descriptors. */
export declare const REMINDER_INVOCATIONS: readonly InvocationDescriptor[];
/** The wire update payload type check (keeps the contract honest with the schema). */
export type ReminderSettingsWireUpdate = z.infer<typeof reminderSettingsUpdateSchema>;
