import type { Paper, Source } from './schema.js';
export interface SearchOptions {
    query: string;
    sources?: Source[];
    maxResults?: number;
    signal?: AbortSignal;
    yearFrom?: number;
    yearTo?: number;
}
/**
 * Unified multi-source search. Queries the requested sources concurrently
 * (Promise.allSettled so one failing source does not fail the whole search),
 * merges + dedupes the results, applies optional year filters, and returns at
 * most `maxResults` papers. Each source is asked for a few more results than
 * the final limit so that dedupe does not starve the result set.
 */
export declare function searchPapers(opts: SearchOptions): Promise<Paper[]>;
