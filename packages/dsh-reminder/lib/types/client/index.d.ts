import { type ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: sessions projection, wire handle, remote face, slots, and locale. */
export declare const inject: string[];
/**
 * Compose the reminder surface.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
