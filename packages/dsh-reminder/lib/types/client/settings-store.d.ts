/** Minimal structural face of the settings snapshot store (see createSnapshotStore). */
import type { ReminderSettings } from '../contract.ts';
export interface SettingsStoreFace {
    getSnapshot(): {
        value: ReminderSettings;
    };
    subscribe(listener: () => void): () => void;
}
