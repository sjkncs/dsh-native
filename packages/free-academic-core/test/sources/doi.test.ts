import { describe, it, expect, vi, afterEach } from 'vitest'
import { normalizeDoi, isPdfPayload, resolveDoi, downloadPdfByDoi, downloadPdfByUrl } from '../../src/sources/doi.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function binaryResponse(opts: {
  ok: boolean
  status?: number
  statusText?: string
  contentType?: string
  body?: Uint8Array
  url?: string
}) {
  const body = opts.body ?? new Uint8Array(0)
  return {
    ok: opts.ok,
    status: opts.status ?? (opts.ok ? 200 : 500),
    statusText: opts.statusText ?? '',
    url: opts.url ?? 'https://example.com/article',
    headers: new Headers(opts.contentType ? { 'content-type': opts.contentType } : {}),
    text: async () => new TextDecoder().decode(body),
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  }
}

const pdfHeader = new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n1 0 obj\n')
const htmlPayload = new TextEncoder().encode('<html><head><title>Paywall</title></head><body>buy the paper</body></html>')

describe('normalizeDoi', () => {
  it('strips prefixes', () => {
    expect(normalizeDoi('https://doi.org/10.1038/s41586-020-2649-2')).toBe('10.1038/s41586-020-2649-2')
    expect(normalizeDoi('doi:10.1000/xyz123')).toBe('10.1000/xyz123')
  })

  it('strips http scheme and trailing dot', () => {
    expect(normalizeDoi('http://doi.org/10.1000/xyz123.')).toBe('10.1000/xyz123')
    expect(normalizeDoi('10.1000/xyz123.')).toBe('10.1000/xyz123')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeDoi('  10.1000/xyz123  ')).toBe('10.1000/xyz123')
  })

  it('throws on invalid DOIs', () => {
    expect(() => normalizeDoi('not-a-doi')).toThrow()
    expect(() => normalizeDoi('10.1000')).toThrow()
    expect(() => normalizeDoi('')).toThrow()
  })
})

describe('isPdfPayload', () => {
  it('accepts application/pdf content-type', () => {
    expect(isPdfPayload('application/pdf', htmlPayload)).toBe(true)
    expect(isPdfPayload('application/pdf; charset=binary', htmlPayload)).toBe(true)
    expect(isPdfPayload('application/x-pdf', htmlPayload)).toBe(true)
  })

  it('accepts a %PDF- magic payload even when the content-type is missing or html', () => {
    expect(isPdfPayload('text/html; charset=utf-8', pdfHeader)).toBe(true)
    expect(isPdfPayload('', pdfHeader)).toBe(true)
  })

  it('accepts octet-stream only when magic bytes confirm', () => {
    expect(isPdfPayload('application/octet-stream', pdfHeader)).toBe(true)
    expect(isPdfPayload('application/octet-stream', htmlPayload)).toBe(false)
  })

  it('rejects an html landing page payload', () => {
    expect(isPdfPayload('text/html; charset=utf-8', htmlPayload)).toBe(false)
    expect(isPdfPayload('', htmlPayload)).toBe(false)
    expect(isPdfPayload('application/octet-stream', htmlPayload)).toBe(false)
  })
})

describe('resolveDoi PDF guard', () => {
  it('returns the bytes for a real PDF payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://www.nature.com/articles/s41586-021-03819-2.pdf' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await resolveDoi('10.1038/s41586-021-03819-2', { signal: new AbortController().signal })

    expect(r.bytes).toEqual(pdfHeader)
    expect(r.finalUrl).toContain('nature.com')
    expect(r.contentType).toContain('application/pdf')
  })

  it('accepts a %PDF- payload served with a text/html content-type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'text/html; charset=utf-8', body: pdfHeader }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await resolveDoi('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r.bytes).toEqual(pdfHeader)
  })

  it('throws a clear error when the DOI resolves to an html landing page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'text/html; charset=utf-8', body: htmlPayload, url: 'https://www.nature.com/articles/s41586-021-03819-2' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      resolveDoi('10.1038/s41586-021-03819-2', { signal: new AbortController().signal }),
    ).rejects.toThrow(/landing page \(content-type: text\/html/i)
  })
})

describe('downloadPdfByDoi PDF guard', () => {
  it('throws a clear error when the DOI resolves to an html landing page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'text/html; charset=utf-8', body: htmlPayload }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadPdfByDoi('10.1038/s41586-021-03819-2', { signal: new AbortController().signal }),
    ).rejects.toThrow(/landing page \(content-type: text\/html/i)
  })

  it('returns the bytes for a real PDF payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadPdfByDoi('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r.bytes).toEqual(pdfHeader)
  })
})

describe('downloadPdfByUrl PDF guard', () => {
  it('returns bytes for a %PDF- payload served with a generic content-type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'application/octet-stream', body: pdfHeader, url: 'https://example.com/paper.pdf' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadPdfByUrl('https://example.com/paper.pdf', { signal: new AbortController().signal })

    expect(r.bytes).toEqual(pdfHeader)
    expect(r.finalUrl).toBe('https://example.com/paper.pdf')
    expect(r.contentType).toBe('application/octet-stream')
  })

  it('throws a clear error when the URL returns an html landing page instead of a PDF', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: true, contentType: 'text/html; charset=utf-8', body: htmlPayload }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadPdfByUrl('https://example.com/landing', { signal: new AbortController().signal }),
    ).rejects.toThrow(/did not return a PDF/)
  })

  it('throws Download failed when the underlying fetch is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      binaryResponse({ ok: false, status: 404 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadPdfByUrl('https://example.com/missing', { signal: new AbortController().signal }),
    ).rejects.toThrow(/Download failed/)
  })
})
