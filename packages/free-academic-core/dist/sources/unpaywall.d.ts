import type { DoiResolveResult } from './doi.js';
/** A single legal open-access location reported by Unpaywall. */
export interface UnpaywallOaLocation {
    url?: string;
    urlForPdf?: string;
    hostType?: string;
}
export interface UnpaywallOaResult {
    doi: string;
    isOa: boolean;
    bestOaLocation?: UnpaywallOaLocation;
    oaLocations: UnpaywallOaLocation[];
}
/**
 * Look up legal open-access versions of a DOI via the official Unpaywall API.
 * Returns undefined when the request fails, the DOI is not in Unpaywall (404),
 * or the paper is not open access (is_oa false).
 */
export declare function lookupUnpaywallOa(doi: string, opts?: {
    email?: string;
    signal?: AbortSignal;
}): Promise<UnpaywallOaResult | undefined>;
/**
 * Download the PDF of the best open-access location found for a DOI.
 * Returns undefined when no OA copy exists or the best location has no URL.
 * Throws when the resolved URL does not actually return a PDF.
 */
export declare function downloadUnpaywallPdf(doi: string, opts?: {
    email?: string;
    signal?: AbortSignal;
}): Promise<DoiResolveResult | undefined>;
