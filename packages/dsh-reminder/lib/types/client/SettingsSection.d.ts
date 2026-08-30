/**
 * The reminder settings page: switches for the two reminder kinds, the
 * popup duration (3-5s), and an explicit notification-permission row
 * (Chrome only shows the permission prompt from a user gesture). Every
 * settings write goes through the injected update verb -> ctx remote
 * updateSettings.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ReactElement } from 'react';
import { type ReminderSettingsField } from '../contract.ts';
import type { SettingsStoreFace } from './settings-store.ts';
/** Injected business face: the live settings source and the durable write verb. */
export interface ReminderSectionInjected {
    hooks: {
        settings: SettingsStoreFace;
    };
    update: (field: ReminderSettingsField, value: unknown) => Promise<void>;
}
/** Full section props: runtime share + injected face + locale seat. */
export type ReminderSectionProps = PropsRuntime<'settings.section'> & InjectFace<ReminderSectionInjected> & PropsLocale<'reminder'>;
/**
 * Render the reminder settings page.
 * @param props - runtime share, injected face (useSettings + update), locale seat.
 */
export declare function ReminderSection({ useSettings, update, t }: ReminderSectionProps): ReactElement;
