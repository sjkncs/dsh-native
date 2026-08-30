import type { Paper, Source } from './schema.js'
import { searchArxiv } from './sources/arxiv.js'
import { searchSemanticScholar } from './sources/semantic-scholar.js'
import { searchPubmed } from './sources/pubmed.js'
import { searchRxiv } from './sources/rxiv.js'
import { mergePaperLists } from './merge.js'

export interface SearchOptions {
  query: string
  sources?: Source[]
  maxResults?: number
  signal?: AbortSignal
  yearFrom?: number
  yearTo?: number
}

/**
 * Unified multi-source search. Queries the requested sources concurrently
 * (Promise.allSettled so one failing source does not fail the whole search),
 * merges + dedupes the results, applies optional year filters, and returns at
 * most `maxResults` papers. Each source is asked for a few more results than
 * the final limit so that dedupe does not starve the result set.
 */
export async function searchPapers(opts: SearchOptions): Promise<Paper[]> {
  const sources: Source[] = opts.sources ?? ['arxiv', 'semantic-scholar', 'pubmed']
  const limit = Math.min(Math.max(1, opts.maxResults ?? 10), 50)
  const perSource = Math.max(5, Math.ceil(limit * 1.5))
  const tasks: Array<Promise<Paper[]>> = []
  if (sources.includes('arxiv')) tasks.push(searchArxiv({ query: opts.query, maxResults: perSource, signal: opts.signal }).then((r) => r.papers))
  if (sources.includes('semantic-scholar')) tasks.push(searchSemanticScholar({ query: opts.query, maxResults: perSource, signal: opts.signal }))
  if (sources.includes('pubmed')) tasks.push(searchPubmed({ query: opts.query, maxResults: perSource, signal: opts.signal }))
  if (sources.includes('biorxiv')) tasks.push(searchRxiv({ query: opts.query, server: 'biorxiv', maxResults: perSource, signal: opts.signal }))
  if (sources.includes('medrxiv')) tasks.push(searchRxiv({ query: opts.query, server: 'medrxiv', maxResults: perSource, signal: opts.signal }))
  const settled = await Promise.allSettled(tasks)
  const results = settled.filter((r): r is PromiseFulfilledResult<Paper[]> => r.status === 'fulfilled').map((r) => r.value)
  let merged = mergePaperLists(results)
  if (opts.yearFrom !== undefined) merged = merged.filter((p) => (p.year ?? 0) >= (opts.yearFrom ?? 0))
  if (opts.yearTo !== undefined) merged = merged.filter((p) => (p.year ?? 9999) <= (opts.yearTo ?? 9999))
  return merged.slice(0, limit)
}
