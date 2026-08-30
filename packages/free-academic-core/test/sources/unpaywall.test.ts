import { describe, it, expect, vi, afterEach } from 'vitest'
import { lookupUnpaywallOa, downloadUnpaywallPdf } from '../../src/sources/unpaywall.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

const pdfHeader = new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n1 0 obj\n')

function jsonResponse(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
  const ok = opts.ok ?? true
  const raw = JSON.stringify(body)
  return {
    ok,
    status: opts.status ?? (ok ? 200 : 404),
    statusText: ok ? 'OK' : 'Not Found',
    url: 'https://api.unpaywall.org/v2/10.1038/s41586-021-03819-2',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => raw,
    arrayBuffer: async () => new TextEncoder().encode(raw).buffer,
  }
}

function binaryResponse(opts: {
  ok: boolean
  status?: number
  contentType?: string
  body?: Uint8Array
  url?: string
}) {
  const body = opts.body ?? new Uint8Array(0)
  return {
    ok: opts.ok,
    status: opts.status ?? (opts.ok ? 200 : 500),
    statusText: '',
    url: opts.url ?? 'https://oa.example.com/paper.pdf',
    headers: new Headers(opts.contentType ? { 'content-type': opts.contentType } : {}),
    text: async () => new TextDecoder().decode(body),
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  }
}

describe('lookupUnpaywallOa', () => {
  it('maps snake_case is_oa / best_oa_location / oa_locations to camelCase', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        is_oa: true,
        best_oa_location: {
          url: 'https://repo.example.com/article/123',
          url_for_pdf: 'https://repo.example.com/article/123/file.pdf',
          host_type: 'repository',
        },
        oa_locations: [
          { url: 'https://repo.example.com/article/123', url_for_pdf: 'https://repo.example.com/article/123/file.pdf', host_type: 'repository' },
          { url: 'https://arxiv.org/abs/2106.12345', url_for_pdf: 'https://arxiv.org/pdf/2106.12345', host_type: 'preprint' },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await lookupUnpaywallOa('10.1038/s41586-021-03819-2', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(r!.isOa).toBe(true)
    expect(r!.doi).toBe('10.1038/s41586-021-03819-2')
    expect(r!.bestOaLocation?.urlForPdf).toBe('https://repo.example.com/article/123/file.pdf')
    expect(r!.bestOaLocation?.hostType).toBe('repository')
    expect(r!.oaLocations).toHaveLength(2)
    expect(r!.oaLocations[0].hostType).toBe('repository')
    expect(r!.oaLocations[1].urlForPdf).toBe('https://arxiv.org/pdf/2106.12345')
  })

  it('returns undefined on HTTP 404 (paper not in Unpaywall)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ is_oa: false }, { ok: false, status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      lookupUnpaywallOa('10.1000/missing', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })

  it('returns undefined on any non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      lookupUnpaywallOa('10.1000/xyz123', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })

  it('returns undefined when is_oa is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ is_oa: false, best_oa_location: null, oa_locations: [] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      lookupUnpaywallOa('10.1038/s41586-021-03819-2', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })

  it('tolerates null best_oa_location and missing oa_locations but still returns isOa', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ is_oa: true }))
    vi.stubGlobal('fetch', fetchMock)

    const r = await lookupUnpaywallOa('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(r!.isOa).toBe(true)
    expect(r!.bestOaLocation).toBeUndefined()
    expect(r!.oaLocations).toEqual([])
  })

  it('throws on an invalid DOI', async () => {
    await expect(lookupUnpaywallOa('not-a-doi')).rejects.toThrow()
    await expect(lookupUnpaywallOa('')).rejects.toThrow()
  })
})

describe('downloadUnpaywallPdf', () => {
  it('downloads the best_oa_location.urlForPdf and validates the %PDF- payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          is_oa: true,
          best_oa_location: {
            url: 'https://repo.example.com/article/123',
            url_for_pdf: 'https://repo.example.com/article/123/file.pdf',
            host_type: 'repository',
          },
          oa_locations: [{ url_for_pdf: 'https://repo.example.com/article/123/file.pdf', host_type: 'repository' }],
        }),
      )
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://repo.example.com/article/123/file.pdf' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadUnpaywallPdf('10.1038/s41586-021-03819-2', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(r!.bytes).toEqual(pdfHeader)
    expect(r!.finalUrl).toContain('repo.example.com')
    expect(r!.contentType).toContain('application/pdf')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toBe('https://repo.example.com/article/123/file.pdf')
  })

  it('throws when the fetched URL is not a PDF payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          is_oa: true,
          best_oa_location: { url: 'https://repo.example.com/article/123', url_for_pdf: 'https://repo.example.com/article/123/landing' },
          oa_locations: [],
        }),
      )
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'text/html; charset=utf-8', body: new TextEncoder().encode('<html>paywall</html>') }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadUnpaywallPdf('10.1000/xyz123', { signal: new AbortController().signal }),
    ).rejects.toThrow(/did not return a PDF/)
  })

  it('returns undefined when no urlForPdf or url is present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ is_oa: true, best_oa_location: null, oa_locations: [] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadUnpaywallPdf('10.1000/xyz123', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })

  it('returns undefined when the paper is not open access', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ is_oa: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadUnpaywallPdf('10.1038/s41586-021-03819-2', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })
})
