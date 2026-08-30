import type { Paper } from '../schema.js';
export declare const SORT_BY: {
    readonly relevance: "relevance";
    readonly lastUpdatedDate: "lastUpdatedDate";
    readonly submittedDate: "submittedDate";
};
export declare function arxivPdfUrl(id: string): string;
export declare function normalizeArxivId(input: string): string;
export declare function parseArxivFeed(xml: string): {
    papers: Paper[];
    total: number;
};
export declare function searchArxiv(opts: {
    query: string;
    maxResults?: number;
    offset?: number;
    sortBy?: keyof typeof SORT_BY;
    dateFrom?: string;
    signal?: AbortSignal;
}): Promise<{
    papers: Paper[];
    total: number;
    nextOffset?: number;
}>;
