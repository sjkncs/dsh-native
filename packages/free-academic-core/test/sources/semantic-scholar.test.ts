import { describe, it, expect, vi, afterEach } from 'vitest'
import { mapS2Paper, getSemanticPaperBatch } from '../../src/sources/semantic-scholar.js'

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

describe('mapS2Paper', () => {
  it('maps graph api record to Paper', () => {
    const raw = {
      paperId: 'abc123',
      title: 'Attention Is All You Need',
      year: 2017,
      venue: 'NeurIPS',
      citationCount: 100000,
      url: 'https://www.semanticscholar.org/paper/abc123',
      externalIds: { DOI: '10.48550/arXiv.1706.03762', ArXiv: '1706.03762' },
      openAccessPdf: { url: 'https://arxiv.org/pdf/1706.03762' },
      abstract: 'We propose a new architecture.',
      authors: [{ name: 'Ashish Vaswani' }],
    }
    const p = mapS2Paper(raw)
    expect(p.title).toBe('Attention Is All You Need')
    expect(p.arxivId).toBe('1706.03762')
    expect(p.doi).toBe('10.48550/arXiv.1706.03762')
    expect(p.source).toBe('semantic-scholar')
    expect(p.openAccessPdf).toBe('https://arxiv.org/pdf/1706.03762')
    expect(p.authors).toEqual(['Ashish Vaswani'])
  })
})

describe('getSemanticPaperBatch', () => {
  it('returns [] for empty ids without making a network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperBatch([])

    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POSTs JSON body to /paper/batch with fields as query param', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ paperId: 'abc', title: 'Attention Is All You Need', authors: [{ name: 'A. Vaswani' }] }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSemanticPaperBatch(['abc'])

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Attention Is All You Need')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/graph/v1/paper/batch')
    expect(parsed.searchParams.get('fields')).toBe('title,authors,year,venue,citationCount,externalIds,url,openAccessPdf,abstract')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({ ids: ['abc'] })
  })

  it('chunks ids into batches of 500 when more than 500', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ paperId: 'chunk', title: 'T', authors: [] }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const ids = Array.from({ length: 750 }, (_, i) => `id-${i}`)
    await getSemanticPaperBatch(ids)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const body1 = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as { ids: string[] }
    const body2 = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string) as { ids: string[] }
    expect(body1.ids).toHaveLength(500)
    expect(body2.ids).toHaveLength(250)
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('POST')
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe('POST')
  })
})
