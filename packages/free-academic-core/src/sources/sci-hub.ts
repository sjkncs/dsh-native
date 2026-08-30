/**
 * Sci-Hub 可选模块（高风险）。默认不启用。
 * WARNING: Sci-Hub provides unauthorized copies of copyrighted works. Using it
 * may be illegal in your jurisdiction and exposes the integrator to legal risk.
 * This module is OFF by default, only fetches the PDF direct link from the
 * mirror page, and must be explicitly enabled by the host application.
 * 仅在你有权访问该内容的合法场景下使用。作者不鼓励侵权。
 */
import { fetchText, fetchBinary, RateLimiter } from '../http.js'
import { normalizeDoi, isPdfPayload } from './doi.js'
import type { DoiResolveResult } from './doi.js'

/** Default Sci-Hub mirror list. Unstable — hosts may move or block; make this configurable. */
export const SCIHUB_MIRRORS = ['https://sci-hub.se', 'https://sci-hub.st', 'https://sci-hub.ru']

/** Polite pacing between mirror requests (1 request / 1.5 s). */
const limiter = new RateLimiter(1500)

/**
 * PDF direct-link patterns found in a Sci-Hub article page. Matches:
 *   href="https://...pdf..."           (anchor)
 *   src="https://...pdf..."            (embed/iframe)
 *   src='https://...pdf...'            (single-quoted)
 *   pdfUrl: 'https://...pdf'           (PDF.js viewer config)
 * We only ever parse direct PDF links out of the returned HTML — no captcha
 * or Cloudflare bypass is attempted anywhere in this module.
 */
const PDF_LINK_PATTERNS: Array<RegExp> = [
  /href="(https?:\/\/[^"]+\.pdf[^"]*)"/i,
  /src="(https?:\/\/[^"]+\.pdf[^"]*)"/i,
  /src='(https?:\/\/[^']+\.pdf[^']*)'/i,
  /pdfUrl\s*:\s*['"](https?:\/\/[^'"]+\.pdf[^'"]*)['"]/i,
]

function extractPdfUrlFromHtml(html: string): string | undefined {
  for (const re of PDF_LINK_PATTERNS) {
    const m = html.match(re)
    if (m) return m[1]
  }
  return undefined
}

/**
 * Try to download a DOI's PDF from the Sci-Hub mirrors (off by default; the
 * host application must explicitly enable and gate this). Returns undefined
 * when every mirror fails or none yields a valid PDF — the caller decides on
 * fallback. Mirrors returning 403 / Cloudflare / 404 are simply skipped.
 */
export async function downloadSciHubPdf(
  doi: string,
  opts: { signal?: AbortSignal; mirrors?: string[] } = {},
): Promise<DoiResolveResult | undefined> {
  const norm = normalizeDoi(doi)
  const mirrors = opts.mirrors ?? SCIHUB_MIRRORS
  for (const mirror of mirrors) {
    await limiter.acquire()
    const page = await fetchText(`${mirror}/${norm}`, { signal: opts.signal, timeoutMs: 30000 })
    if (!page.ok) continue // 403 / Cloudflare / 404 → skip this mirror.
    const pdfUrl = extractPdfUrlFromHtml(page.data)
    if (!pdfUrl) continue
    const bin = await fetchBinary(pdfUrl, { signal: opts.signal, timeoutMs: 60000 })
    if (!bin.ok) continue
    if (!isPdfPayload(bin.contentType, bin.data)) continue
    return { bytes: bin.data, finalUrl: bin.finalUrl, contentType: bin.contentType }
  }
  return undefined
}
