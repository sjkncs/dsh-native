/**
 * The client-side Typert Remote contribution for the dsh-reminder host
 * service: mounts the shared strict descriptors into ctx.remote.reminder.
 * The descriptors and codecs come from the shared wire module, so the
 * browser bundle and the host manifest stay on one wire definition.
 */
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ReminderSettings, ReminderSettingsUpdate } from '../contract.ts';
/** The reminder Remote namespace's client contribution. */
export declare const REMINDER_REMOTE: TypertRemoteContribution;
declare module '@deepseek-ai/dsh-typert-protocol' {
    /** The reminder namespace face mounted under ctx.remote.reminder. */
    interface TypertRemoteNamespace$reminder {
        getSettings: () => Promise<RemoteResult<ReminderSettings>>;
        updateSettings: (update: ReminderSettingsUpdate) => Promise<RemoteResult<ReminderSettings>>;
    }
    interface TypertRemoteMap {
        'reminder/getSettings': () => Promise<RemoteResult<ReminderSettings>>;
        'reminder/updateSettings': (update: ReminderSettingsUpdate) => Promise<RemoteResult<ReminderSettings>>;
    }
    interface TypertRemoteNamespaceMap {
        reminder: TypertRemoteNamespace$reminder;
    }
}
