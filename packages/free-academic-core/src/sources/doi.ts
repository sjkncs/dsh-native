import { compact } from '../schema.js'
import type { Paper } from '../schema.js'
import { fetchBinary, fetchJson } from '../http.js'

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

export interface DoiResolveResult {
  bytes: Uint8Array
  finalUrl: string
  contentType: string
}

export function normalizeDoi(input: string): string {
  const trimmed = input.trim()
    .replace(/^https?:\/\/doi\.org\//, '')
    .replace(/^doi:\s*/i, '')
    .replace(/\.$/, '')
  if (!DOI_PATTERN.test(trimmed)) throw new Error(`"${input}" is not a valid DOI`)
  return trimmed
}

/**
 * Heuristic check that a fetched payload is a PDF: an explicit PDF content-type
 * is trusted; anything else (html landing page, octet-stream, missing header,
 * etc.) must start with the `%PDF-` magic bytes.
 */
export function isPdfPayload(contentType: string, bytes: Uint8Array): boolean {
  const ct = contentType.toLowerCase()
  if (ct.includes('application/pdf') || ct.includes('application/x-pdf')) return true
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
  )
}

/** Resolve a DOI through doi.org, following redirects to the final landing page / PDF. */
export async function resolveDoi(doi: string, opts: { signal?: AbortSignal } = {}): Promise<DoiResolveResult> {
  const url = `https://doi.org/${encodeURIComponent(doi)}`
  const res = await fetchBinary(url, { signal: opts.signal, timeoutMs: 60000 })
  if (!res.ok) throw new Error(`DOI resolution failed: ${res.error}`)
  if (!isPdfPayload(res.contentType, res.data)) {
    const contentType = res.contentType || 'unknown'
    throw new Error(
      `DOI ${doi} resolved to a landing page (content-type: ${contentType}), not a PDF — likely paywalled or not open-access`,
    )
  }
  return { bytes: res.data, finalUrl: res.finalUrl, contentType: res.contentType }
}

/** Download the payload behind a DOI (typically a PDF). Same as resolveDoi but named for intent. */
export async function downloadPdfByDoi(doi: string, opts: { signal?: AbortSignal } = {}): Promise<DoiResolveResult> {
  return resolveDoi(doi, opts)
}

/**
 * Download a PDF payload from a direct URL, validating that the response is a
 * real PDF (not an HTML landing page). Unlike resolveDoi there is no DOI to
 * identify the intended article, so a non-PDF payload is rejected outright.
 */
export async function downloadPdfByUrl(
  url: string,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<DoiResolveResult> {
  const res = await fetchBinary(url, { signal: opts.signal, timeoutMs: opts.timeoutMs ?? 60000 })
  if (!res.ok) throw new Error(`Download failed: ${res.error}`)
  if (!isPdfPayload(res.contentType, res.data)) {
    const contentType = res.contentType || 'unknown'
    throw new Error(
      `URL ${url} did not return a PDF (content-type: ${contentType}) — got a landing page or non-PDF payload`,
    )
  }
  return { bytes: res.data, finalUrl: res.finalUrl, contentType: res.contentType }
}

/** Best-effort metadata lookup via the Crossref REST API. Returns undefined on any failure. */
export async function lookupDoiMetadata(doi: string, opts: { signal?: AbortSignal } = {}): Promise<Paper | undefined> {
  const res = await fetchJson<{ message?: Record<string, unknown> }>(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
    { signal: opts.signal },
  )
  if (!res.ok) return undefined
  const msg = res.data?.message
  if (!msg) return undefined
  const authors = Array.isArray(msg.author)
    ? (msg.author as Array<Record<string, unknown>>).map((a) => [a.given, a.family].filter(Boolean).join(' ')).filter(Boolean)
    : []
  const title = Array.isArray(msg.title) ? String(msg.title[0] ?? '') : String(msg.title ?? '')
  const year = firstYear(msg)
  const container = msg['container-title']
  const venue = Array.isArray(container) && typeof container[0] === 'string' ? container[0] : undefined
  return compact({
    source: 'doi' as const,
    id: doi,
    title,
    authors,
    year,
    venue,
    doi,
    url: `https://doi.org/${doi}`,
  })
}

/** Extract the first publication year from Crossref date-parts (published-print, published-online, issued). */
function firstYear(msg: Record<string, unknown>): number | undefined {
  for (const key of ['published-print', 'published-online', 'issued'] as const) {
    const node = msg[key]
    if (node === null || typeof node !== 'object') continue
    const dateParts = (node as Record<string, unknown>)['date-parts']
    if (!Array.isArray(dateParts)) continue
    const first = dateParts[0]
    if (Array.isArray(first) && typeof first[0] === 'number') return first[0]
  }
  return undefined
}
