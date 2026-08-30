/**
 * dsh-reminder host plugin: registers the reminder settings namespace
 * (the durable switches), exposes them to the Web client through the
 * plugin-owned Typert Remote (plugin namespaces are outside the web
 * settings API's allowlist), and performs no event relay — the client
 * observes the session list and conversation streams directly, per the
 * PRD's read-only-event design. The client half ships in the same package
 * (./client); the web server serves it under /plugins/dsh-reminder/client.js.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name (the Loader entry and client bundle id). */
export declare const name = "dsh-reminder";
/** Services required before load: the settings provider and the Typert registry. */
export declare const inject: string[];
/**
 * Mount the reminder settings namespace and its Remote wire face.
 * @param ctx - host cordis context.
 */
export declare function apply(ctx: Context): void;
