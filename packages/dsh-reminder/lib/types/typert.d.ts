/**
 * The hand-written host Typert manifest for the reminder Remote. Registered
 * through ctx.typert.register in the plugin body, it claims the wire
 * endpoints through the strict registry — the same path generated ./typert
 * artifacts use — so the Host Gateway resolves plugin-owned settings calls
 * without consulting the @Remote marker table.
 */
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types';
/** The reminder namespace's host manifest (strict codecs shared with the client). */
export declare const TYPERT_MANIFEST: TypertContribution;
