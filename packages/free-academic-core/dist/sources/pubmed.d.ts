import type { Paper } from '../schema.js';
export declare function parsePubmedSearchXml(xml: string): {
    pmids: string[];
    count: number;
};
export declare function parsePubmedSummariesJson(json: {
    result?: Record<string, unknown>;
}): Paper[];
export declare function searchPubmed(opts: {
    query: string;
    maxResults?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
export declare function getPubmedPaperDetail(pmid: string, signal?: AbortSignal): Promise<Paper | null>;
export declare function getPubmedPaperBatch(pmids: string[], signal?: AbortSignal): Promise<Paper[]>;
export declare function getPubmedRelated(pmid: string, opts?: {
    maxResults?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
