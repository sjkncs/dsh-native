import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  searchSemanticPaperMatch,
  getSemanticPaperCitations,
  getSemanticPaperReferences,
  getSemanticPaperRecommendations,
  getSemanticAuthor,
  getSemanticAuthorPapers,
} from '../../src/sources/semantic-scholar.js'

const FIELDS = 'title,authors,year,venue,citationCount,externalIds,url,openAccessPdf,abstract'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(payload: unknown, status = 200, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => JSON.stringify(payload),
    headers: new Headers(),
  }
}

function paperRec(id: string, title: string) {
  return { paperId: id, title, authors: [{ name: 'A. Author' }], externalIds: {} }
}

describe('searchSemanticPaperMatch', () => {
  it('maps nested {data:[{paper}]} to papers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ paper: paperRec('m1', 'Matched Paper') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchSemanticPaperMatch('Attention is all you need')

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('m1')
    expect(result[0]?.title).toBe('Matched Paper')
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/paper/search/match')
    expect(parsed.searchParams.get('query')).toBe('Attention is all you need')
    expect(parsed.searchParams.get('fields')).toBe(FIELDS)
  })

  it('throws on empty title without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchSemanticPaperMatch('   ')).rejects.toThrow(/non-empty/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('propagates non-ok responses as errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'bad request' }, 400, 'Bad Request'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchSemanticPaperMatch('x')).rejects.toThrow(/match failed/)
  })
})

describe('getSemanticPaperCitations', () => {
  it('flattens {data:[{citingPaper}]} and sends limit/offset', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ citingPaper: paperRec('c1', 'Citing Paper') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperCitations('core-id', { limit: 5, offset: 10 })

    expect(result[0]?.title).toBe('Citing Paper')
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/paper/core-id/citations')
    expect(parsed.searchParams.get('limit')).toBe('5')
    expect(parsed.searchParams.get('offset')).toBe('10')
    expect(parsed.searchParams.get('fields')).toBe(FIELDS)
  })

  it('defaults limit to 20 and clamps to 1..100', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getSemanticPaperCitations('id')
    let parsed = new URL(fetchMock.mock.calls[0][0] as string)
    expect(parsed.searchParams.get('limit')).toBe('20')

    await getSemanticPaperCitations('id', { limit: 0 })
    parsed = new URL(fetchMock.mock.calls[1][0] as string)
    expect(parsed.searchParams.get('limit')).toBe('1')

    await getSemanticPaperCitations('id', { limit: 500 })
    parsed = new URL(fetchMock.mock.calls[2][0] as string)
    expect(parsed.searchParams.get('limit')).toBe('100')
  })

  it('omits offset when not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getSemanticPaperCitations('id')
    const parsed = new URL(fetchMock.mock.calls[0][0] as string)
    expect(parsed.searchParams.get('offset')).toBeNull()
  })
})

describe('getSemanticPaperReferences', () => {
  it('flattens {data:[{citedPaper}]} to papers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ citedPaper: paperRec('r1', 'Referenced Paper') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperReferences('core-id')

    expect(result[0]?.title).toBe('Referenced Paper')
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/paper/core-id/references')
    expect(parsed.searchParams.get('fields')).toBe(FIELDS)
  })
})

describe('getSemanticPaperRecommendations', () => {
  it('maps nested {data:[{paper}]} shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ paper: paperRec('rc1', 'Rec Nested') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperRecommendations('core-id')
    expect(result[0]?.title).toBe('Rec Nested')
  })

  it('maps direct paper-object shape {data:[{...}]}', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [paperRec('rc2', 'Rec Direct')] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperRecommendations('core-id')
    expect(result[0]?.title).toBe('Rec Direct')
  })

  it('defensively maps {data:[{citedPaper}]} shape observed from the live API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ citedPaper: paperRec('rc3', 'Rec Cited') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperRecommendations('core-id')
    expect(result[0]?.title).toBe('Rec Cited')
  })

  it('defaults limit to 10 and clamps to 1..20', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getSemanticPaperRecommendations('id')
    let parsed = new URL(fetchMock.mock.calls[0][0] as string)
    expect(parsed.searchParams.get('limit')).toBe('10')

    await getSemanticPaperRecommendations('id', { limit: 50 })
    parsed = new URL(fetchMock.mock.calls[1][0] as string)
    expect(parsed.searchParams.get('limit')).toBe('20')
  })
})

describe('getSemanticAuthor', () => {
  it('returns compact raw author object with authorId/name/hIndex', async () => {
    const raw = {
      authorId: '1741101',
      name: 'Oren Etzioni',
      hIndex: 88,
      paperCount: 259,
      citationCount: 43671,
      url: 'https://www.semanticscholar.org/author/1741101',
      affiliations: [],
      undefinedField: undefined,
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(raw))
    vi.stubGlobal('fetch', fetchMock)

    const author = await getSemanticAuthor('1741101')

    expect(author.authorId).toBe('1741101')
    expect(author.name).toBe('Oren Etzioni')
    expect(author.hIndex).toBe(88)
    expect(author).not.toHaveProperty('undefinedField')
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/author/1741101')
    expect(parsed.searchParams.get('fields')).toContain('name')
    expect(parsed.searchParams.get('fields')).toContain('hIndex')
    expect(parsed.searchParams.get('fields')).toContain('affiliations')
    expect(parsed.searchParams.get('fields')).toContain('paperCount')
    expect(parsed.searchParams.get('fields')).toContain('citationCount')
    expect(parsed.searchParams.get('fields')).toContain('url')
  })
})

describe('getSemanticAuthorPapers', () => {
  it('maps nested {data:[{paper}]} shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ paper: paperRec('ap1', 'Author Paper Nested') }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticAuthorPapers('1741101')
    expect(result[0]?.title).toBe('Author Paper Nested')
  })

  it('maps direct paper-object shape {data:[{...}]}', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [paperRec('ap2', 'Author Paper Direct')] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticAuthorPapers('1741101')
    expect(result[0]?.title).toBe('Author Paper Direct')
  })

  it('sends fields/limit/offset to /author/{id}/papers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getSemanticAuthorPapers('1741101', { limit: 5, offset: 20 })
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/author/1741101/papers')
    expect(parsed.searchParams.get('fields')).toBe(FIELDS)
    expect(parsed.searchParams.get('limit')).toBe('5')
    expect(parsed.searchParams.get('offset')).toBe('20')
  })
})
