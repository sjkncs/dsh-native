import type { Paper } from '../schema.js';
export declare function mapRxivItem(raw: Record<string, unknown>): Paper;
export declare function searchRxiv(opts: {
    query: string;
    server: 'biorxiv' | 'medrxiv';
    maxResults?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
