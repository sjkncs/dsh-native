export type Source = 'semantic-scholar' | 'pubmed' | 'arxiv' | 'biorxiv' | 'medrxiv' | 'doi'

export interface Paper {
  id: string
  title: string
  authors: string[]
  source: Source
  year?: number
  date?: string
  venue?: string
  citationCount?: number
  doi?: string
  pmid?: string
  arxivId?: string
  url?: string
  pdfUrl?: string
  openAccessPdf?: string
  abstract?: string
  externalIds?: Record<string, string>
  categories?: string[]
}

export function compact<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out as T
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function identityKeys(p: Paper): string[] {
  const keys: string[] = []
  if (p.doi) keys.push(`doi:${p.doi.toLowerCase()}`)
  if (p.arxivId) keys.push(`arxiv:${p.arxivId.toLowerCase()}`)
  if (p.pmid) keys.push(`pmid:${p.pmid}`)
  if (p.title) keys.push(`title:${normalizeTitle(p.title)}`)
  return keys
}
