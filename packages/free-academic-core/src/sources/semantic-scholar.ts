import { compact } from '../schema.js'
import type { Paper } from '../schema.js'
import { fetchJson, RateLimiter } from '../http.js'

const BASE = 'https://api.semanticscholar.org/graph/v1'
const FIELDS = 'title,authors,year,venue,citationCount,externalIds,url,openAccessPdf,abstract'
const BATCH_CHUNK = 500 // S2 graph API caps /paper/batch POST bodies at 500 ids
const limiter = new RateLimiter(1000)
const UA = 'free-academic-search/0.1.0 (open-source; +https://github.com/zoujialin1997/free-academic-search)'

export function mapS2Paper(raw: Record<string, unknown>): Paper {
  const ext = (raw.externalIds ?? {}) as Record<string, unknown>
  const authors = Array.isArray(raw.authors)
    ? (raw.authors as Array<Record<string, unknown>>).map((a) => String(a.name ?? '')).filter(Boolean)
    : []
  const oa = raw.openAccessPdf as { url?: string } | undefined
  return compact({
    source: 'semantic-scholar' as const,
    id: String(raw.paperId ?? ''),
    title: String(raw.title ?? ''),
    authors,
    year: typeof raw.year === 'number' ? raw.year : undefined,
    venue: typeof raw.venue === 'string' && raw.venue.length > 0 ? raw.venue : undefined,
    citationCount: typeof raw.citationCount === 'number' ? raw.citationCount : undefined,
    doi: typeof ext.DOI === 'string' ? ext.DOI : undefined,
    arxivId: typeof ext.ArXiv === 'string' ? ext.ArXiv : undefined,
    pmid: typeof ext.PubMed === 'string' ? ext.PubMed : undefined,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    openAccessPdf: oa && typeof oa.url === 'string' ? oa.url : undefined,
    abstract: typeof raw.abstract === 'string' && raw.abstract.length > 0 ? raw.abstract : undefined,
  })
}

/**
 * Maps a graph-list entry to a Paper, tolerating every nested shape the S2 API
 * actually emits: `{paper:{...}}` (match/recommendations/author-papers),
 * `{citingPaper:{...}}` (citations), `{citedPaper:{...}}` (references 鈥?and
 * occasionally recommendations, observed live), or a direct paper object.
 */
function mapS2Entry(raw: Record<string, unknown>): Paper {
  const nested = (raw.paper ?? raw.citingPaper ?? raw.citedPaper) as Record<string, unknown> | undefined
  return mapS2Paper(nested && typeof nested === 'object' ? nested : raw)
}

async function getS2GraphList(
  path: string,
  params: URLSearchParams,
  signal: AbortSignal | undefined,
  label: string,
): Promise<Paper[]> {
  await limiter.acquire()
  const res = await fetchJson<{ data?: Array<Record<string, unknown>> }>(`${BASE}${path}?${params.toString()}`, {
    signal,
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`Semantic Scholar ${label} failed: ${res.error}`)
  return (res.data.data ?? []).filter(Boolean).map(mapS2Entry)
}

export async function searchSemanticScholar(opts: { query: string; maxResults?: number; signal?: AbortSignal }): Promise<Paper[]> {
  const query = opts.query.trim()
  if (query.length === 0) throw new Error('query must be a non-empty string')
  await limiter.acquire()
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(Math.max(1, opts.maxResults ?? 10), 100)),
    fields: FIELDS,
  })
  const res = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
    `${BASE}/paper/search?${params.toString()}`,
    { signal: opts.signal, headers: { 'User-Agent': UA } },
  )
  if (!res.ok) throw new Error(`Semantic Scholar search failed: ${res.error}`)
  return (res.data.data ?? []).map(mapS2Paper)
}

export async function getSemanticPaper(ref: string, signal?: AbortSignal): Promise<Paper> {
  await limiter.acquire()
  const params = new URLSearchParams({ fields: FIELDS })
  const res = await fetchJson<Record<string, unknown>>(`${BASE}/paper/${encodeURIComponent(ref)}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Semantic Scholar lookup failed: ${res.error}`)
  return mapS2Paper(res.data)
}

export async function getSemanticPaperBatch(ids: string[], signal?: AbortSignal): Promise<Paper[]> {
  if (ids.length === 0) return []
  const papers: Paper[] = []
  for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
    const chunk = ids.slice(i, i + BATCH_CHUNK)
    await limiter.acquire()
    const params = new URLSearchParams({ fields: FIELDS })
    const res = await fetchJson<Array<Record<string, unknown>>>(`${BASE}/paper/batch?${params.toString()}`, {
      signal,
      method: 'POST',
      body: { ids: chunk },
    })
    if (!res.ok) throw new Error(`Semantic Scholar batch lookup failed: ${res.error}`)
    papers.push(...(Array.isArray(res.data) ? res.data : []).filter(Boolean).map(mapS2Paper))
  }
  return papers
}

export async function searchSemanticPaperMatch(title: string, signal?: AbortSignal): Promise<Paper[]> {
  const query = title.trim()
  if (query.length === 0) throw new Error('title must be a non-empty string')
  const params = new URLSearchParams({ query, fields: FIELDS })
  return getS2GraphList('/paper/search/match', params, signal, 'match')
}

export async function getSemanticPaperCitations(
  paperId: string,
  opts: { limit?: number; offset?: number; signal?: AbortSignal } = {},
): Promise<Paper[]> {
  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(Math.min(Math.max(1, opts.limit ?? 20), 100)),
  })
  if (opts.offset !== undefined) params.set('offset', String(opts.offset))
  return getS2GraphList(`/paper/${encodeURIComponent(paperId)}/citations`, params, opts.signal, 'citations lookup')
}

export async function getSemanticPaperReferences(
  paperId: string,
  opts: { limit?: number; offset?: number; signal?: AbortSignal } = {},
): Promise<Paper[]> {
  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(Math.min(Math.max(1, opts.limit ?? 20), 100)),
  })
  if (opts.offset !== undefined) params.set('offset', String(opts.offset))
  return getS2GraphList(`/paper/${encodeURIComponent(paperId)}/references`, params, opts.signal, 'references lookup')
}

export async function getSemanticPaperRecommendations(
  paperId: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<Paper[]> {
  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(Math.min(Math.max(1, opts.limit ?? 10), 20)),
  })
  return getS2GraphList(`/paper/${encodeURIComponent(paperId)}/recommendations`, params, opts.signal, 'recommendations lookup')
}

export async function getSemanticAuthor(authorId: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  await limiter.acquire()
  const params = new URLSearchParams({ fields: 'name,hIndex,affiliations,paperCount,citationCount,url' })
  const res = await fetchJson<Record<string, unknown>>(`${BASE}/author/${encodeURIComponent(authorId)}?${params.toString()}`, {
    signal,
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`Semantic Scholar author lookup failed: ${res.error}`)
  return compact(res.data)
}

export async function getSemanticAuthorPapers(
  authorId: string,
  opts: { limit?: number; offset?: number; signal?: AbortSignal } = {},
): Promise<Paper[]> {
  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(Math.min(Math.max(1, opts.limit ?? 20), 100)),
  })
  if (opts.offset !== undefined) params.set('offset', String(opts.offset))
  return getS2GraphList(`/author/${encodeURIComponent(authorId)}/papers`, params, opts.signal, 'author papers lookup')
}
