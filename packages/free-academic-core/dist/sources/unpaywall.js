import { compact } from '../schema.js';
import { fetchJson, fetchBinary, RateLimiter } from '../http.js';
import { normalizeDoi, isPdfPayload } from './doi.js';
/**
 * Placeholder email for the required Unpaywall `email` query parameter.
 * Unpaywall asks for a real email address so they can contact heavy users;
 * integrators should pass their own via `opts.email` in production.
 */
const DEFAULT_EMAIL = 'free-academic-search@example.com';
/** Unpaywall's free tier is rate limited; be polite (1 request/second). */
const limiter = new RateLimiter(1000);
/** Map a raw Unpaywall location object (snake_case) to the camelCase shape; tolerate null/malformed entries. */
function toOaLocation(raw) {
    if (raw === null || typeof raw !== 'object')
        return undefined;
    const r = raw;
    return compact({
        ...(typeof r.url === 'string' && r.url.length > 0 ? { url: r.url } : {}),
        ...(typeof r.url_for_pdf === 'string' && r.url_for_pdf.length > 0 ? { urlForPdf: r.url_for_pdf } : {}),
        ...(typeof r.host_type === 'string' && r.host_type.length > 0 ? { hostType: r.host_type } : {}),
    });
}
/**
 * Look up legal open-access versions of a DOI via the official Unpaywall API.
 * Returns undefined when the request fails, the DOI is not in Unpaywall (404),
 * or the paper is not open access (is_oa false).
 */
export async function lookupUnpaywallOa(doi, opts = {}) {
    const norm = normalizeDoi(doi);
    const email = opts.email ?? DEFAULT_EMAIL;
    const url = `https://api.unpaywall.org/v2/${encodeURIComponent(norm)}?email=${encodeURIComponent(email)}`;
    await limiter.acquire();
    const res = await fetchJson(url, { signal: opts.signal });
    if (!res.ok)
        return undefined; // includes HTTP 404 (paper not in Unpaywall)
    if (res.data.is_oa !== true)
        return undefined;
    const best = toOaLocation(res.data.best_oa_location);
    const rawLocations = Array.isArray(res.data.oa_locations) ? res.data.oa_locations : [];
    const oaLocations = rawLocations
        .map((loc) => toOaLocation(loc))
        .filter((loc) => loc !== undefined);
    return compact({
        doi: norm,
        isOa: true,
        ...(best ? { bestOaLocation: best } : {}),
        oaLocations,
    });
}
/**
 * Download the PDF of the best open-access location found for a DOI.
 * Returns undefined when no OA copy exists or the best location has no URL.
 * Throws when the resolved URL does not actually return a PDF.
 */
export async function downloadUnpaywallPdf(doi, opts = {}) {
    const oa = await lookupUnpaywallOa(doi, opts);
    if (!oa)
        return undefined;
    const target = oa.bestOaLocation?.urlForPdf ?? oa.bestOaLocation?.url;
    if (!target)
        return undefined;
    const res = await fetchBinary(target, { signal: opts.signal, timeoutMs: 60000 });
    if (!res.ok)
        throw new Error(`Download failed: ${res.error}`);
    if (!isPdfPayload(res.contentType, res.data)) {
        const contentType = res.contentType || 'unknown';
        throw new Error(`URL ${target} did not return a PDF (content-type: ${contentType})`);
    }
    return { bytes: res.data, finalUrl: res.finalUrl, contentType: res.contentType };
}
//# sourceMappingURL=unpaywall.js.map