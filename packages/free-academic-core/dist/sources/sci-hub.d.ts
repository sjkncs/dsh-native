import type { DoiResolveResult } from './doi.js';
/** Default Sci-Hub mirror list. Unstable — hosts may move or block; make this configurable. */
export declare const SCIHUB_MIRRORS: string[];
/**
 * Try to download a DOI's PDF from the Sci-Hub mirrors (off by default; the
 * host application must explicitly enable and gate this). Returns undefined
 * when every mirror fails or none yields a valid PDF — the caller decides on
 * fallback. Mirrors returning 403 / Cloudflare / 404 are simply skipped.
 */
export declare function downloadSciHubPdf(doi: string, opts?: {
    signal?: AbortSignal;
    mirrors?: string[];
}): Promise<DoiResolveResult | undefined>;
