/**
 * reminder locale namespace: settings copy and popup titles. The popup is a
 * native desktop notification; its title/body copy follows the host locale.
 */
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    nav: string;
    'settings.title': string;
    'settings.subtitle': string;
    'settings.approval': string;
    'settings.approvalDesc': string;
    'settings.completion': string;
    'settings.completionDesc': string;
    'settings.duration': string;
    'settings.durationDesc': string;
    'settings.failure': string;
    'settings.failureDesc': string;
    'settings.permission': string;
    'settings.permissionAsk': string;
    'settings.permissionGranted': string;
    'settings.permissionDenied': string;
    'settings.permissionUnsupported': string;
    'settings.permissionButton': string;
    'settings.testTitle': string;
    'settings.testBody': string;
    'popup.completion': string;
    'popup.approval': string;
};
/** The reminder namespace key union. */
export type ReminderKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    nav: string;
    'settings.title': string;
    'settings.subtitle': string;
    'settings.approval': string;
    'settings.approvalDesc': string;
    'settings.completion': string;
    'settings.completionDesc': string;
    'settings.duration': string;
    'settings.durationDesc': string;
    'settings.failure': string;
    'settings.failureDesc': string;
    'settings.permission': string;
    'settings.permissionAsk': string;
    'settings.permissionGranted': string;
    'settings.permissionDenied': string;
    'settings.permissionUnsupported': string;
    'settings.permissionButton': string;
    'settings.testTitle': string;
    'settings.testBody': string;
    'popup.completion': string;
    'popup.approval': string;
};
/** Locale namespace id registered under ctx.locale. */
export declare const NS = "reminder";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The reminder settings copy. */
        [NS]: ReminderKey;
    }
}
