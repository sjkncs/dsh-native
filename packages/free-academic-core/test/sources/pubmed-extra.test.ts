import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPubmedPaperDetail, getPubmedPaperBatch, getPubmedRelated } from '../../src/sources/pubmed.js'

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

function summaryJson(uids: string[]) {
  const result: Record<string, unknown> = { uids }
  for (const uid of uids) {
    result[uid] = { uid, title: `Paper ${uid}`, pubdate: '2023 Jun', source: 'Nature', authors: [{ name: 'Jane Doe' }] }
  }
  return { result }
}

describe('getPubmedPaperDetail', () => {
  it('maps a single esummary record to a Paper', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(summaryJson(['12345'])))
    vi.stubGlobal('fetch', fetchMock)

    const paper = await getPubmedPaperDetail('12345')

    expect(paper?.pmid).toBe('12345')
    expect(paper?.title).toBe('Paper 12345')
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/entrez/eutils/esummary.fcgi')
    expect(parsed.searchParams.get('db')).toBe('pubmed')
    expect(parsed.searchParams.get('id')).toBe('12345')
    expect(parsed.searchParams.get('retmode')).toBe('json')
  })

  it('returns null when the PMID does not exist (no esummary record)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ result: { uids: ['99999999999'], '99999999999': null } }))
    vi.stubGlobal('fetch', fetchMock)

    const paper = await getPubmedPaperDetail('99999999999')
    expect(paper).toBeNull()
  })

  it('throws on empty pmid without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPubmedPaperDetail('  ')).rejects.toThrow(/non-empty/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getPubmedPaperBatch', () => {
  it('maps multiple ids to multiple papers in one request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(summaryJson(['12345', '67890'])))
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedPaperBatch(['12345', '67890'])

    expect(papers.map((p) => p.pmid)).toEqual(['12345', '67890'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).searchParams.get('id')).toBe('12345,67890')
  })

  it('returns [] for empty array without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedPaperBatch([])
    expect(papers).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('chunks ids into batches of 500', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(summaryJson(['chunk'])))
    vi.stubGlobal('fetch', fetchMock)

    const ids = Array.from({ length: 750 }, (_, i) => String(1000000 + i))
    await getPubmedPaperBatch(ids)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const first = new URL(fetchMock.mock.calls[0][0] as string).searchParams.get('id') as string
    const second = new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('id') as string
    expect(first.split(',')).toHaveLength(500)
    expect(second.split(',')).toHaveLength(250)
  })
})

describe('getPubmedRelated', () => {
  it('parses elink linksetdbs and fetches summaries for the first maxResults', async () => {
    const elink = {
      linksets: [{ dbfrom: 'pubmed', ids: ['25619964'], linksetdbs: [{ dbto: 'pubmed', linkname: 'pubmed_pubmed', links: ['11111', '22222', '33333'] }] }],
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(elink))
      .mockResolvedValueOnce(jsonResponse(summaryJson(['11111', '22222'])))
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedRelated('25619964', { maxResults: 2 })

    expect(papers.map((p) => p.pmid)).toEqual(['11111', '22222'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [elinkUrl] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(elinkUrl)
    expect(parsed.pathname).toBe('/entrez/eutils/elink.fcgi')
    expect(parsed.searchParams.get('dbfrom')).toBe('pubmed')
    expect(parsed.searchParams.get('db')).toBe('pubmed')
    expect(parsed.searchParams.get('id')).toBe('25619964')
    const [summaryUrl] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(new URL(summaryUrl).searchParams.get('id')).toBe('11111,22222')
  })

  it('defaults maxResults to 10', async () => {
    const links = Array.from({ length: 15 }, (_, i) => String(1000 + i))
    const elink = { linksets: [{ dbfrom: 'pubmed', ids: ['1'], linksetdbs: [{ dbto: 'pubmed', linkname: 'pubmed_pubmed', links }] }] }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(elink))
      .mockResolvedValueOnce(jsonResponse(summaryJson(links.slice(0, 10))))
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedRelated('1')

    expect(papers).toHaveLength(10)
    const [summaryUrl] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(new URL(summaryUrl).searchParams.get('id')).toBe(links.slice(0, 10).join(','))
  })

  it('returns [] when elink has no links', async () => {
    const elink = { linksets: [{ dbfrom: 'pubmed', ids: ['1'], linksetdbs: [{ dbto: 'pubmed', linkname: 'pubmed_pubmed', links: [] }] }] }
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(elink))
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedRelated('1')
    expect(papers).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns [] when linksetdbs is absent entirely', async () => {
    const elink = { linksets: [{ dbfrom: 'pubmed', ids: ['1'] }] }
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(elink))
    vi.stubGlobal('fetch', fetchMock)

    const papers = await getPubmedRelated('1')
    expect(papers).toEqual([])
  })
})
