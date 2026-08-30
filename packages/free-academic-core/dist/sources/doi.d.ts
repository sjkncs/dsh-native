import type { Paper } from '../schema.js';
export interface DoiResolveResult {
    bytes: Uint8Array;
    finalUrl: string;
    contentType: string;
}
export declare function normalizeDoi(input: string): string;
/**
 * Heuristic check that a fetched payload is a PDF: an explicit PDF content-type
 * is trusted; anything else (html landing page, octet-stream, missing header,
 * etc.) must start with the `%PDF-` magic bytes.
 */
export declare function isPdfPayload(contentType: string, bytes: Uint8Array): boolean;
/** Resolve a DOI through doi.org, following redirects to the final landing page / PDF. */
export declare function resolveDoi(doi: string, opts?: {
    signal?: AbortSignal;
}): Promise<DoiResolveResult>;
/** Download the payload behind a DOI (typically a PDF). Same as resolveDoi but named for intent. */
export declare function downloadPdfByDoi(doi: string, opts?: {
    signal?: AbortSignal;
}): Promise<DoiResolveResult>;
/**
 * Download a PDF payload from a direct URL, validating that the response is a
 * real PDF (not an HTML landing page). Unlike resolveDoi there is no DOI to
 * identify the intended article, so a non-PDF payload is rejected outright.
 */
export declare function downloadPdfByUrl(url: string, opts?: {
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<DoiResolveResult>;
/** Best-effort metadata lookup via the Crossref REST API. Returns undefined on any failure. */
export declare function lookupDoiMetadata(doi: string, opts?: {
    signal?: AbortSignal;
}): Promise<Paper | undefined>;
