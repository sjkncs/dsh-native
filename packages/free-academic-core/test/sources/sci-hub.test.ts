import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadSciHubPdf, SCIHUB_MIRRORS } from '../../src/sources/sci-hub.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

const pdfHeader = new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n1 0 obj\n')

function textResponse(html: string, opts: { ok?: boolean; status?: number } = {}) {
  const ok = opts.ok ?? true
  return {
    ok,
    status: opts.status ?? (ok ? 200 : 403),
    statusText: ok ? 'OK' : 'Forbidden',
    url: 'https://sci-hub.se/10.1000/xyz123',
    headers: new Headers({ 'content-type': 'text/html' }),
    text: async () => html,
    arrayBuffer: async () => new TextEncoder().encode(html).buffer,
  }
}

function binaryResponse(opts: {
  ok: boolean
  contentType?: string
  body?: Uint8Array
  url?: string
}) {
  const body = opts.body ?? new Uint8Array(0)
  return {
    ok: opts.ok,
    status: opts.ok ? 200 : 500,
    statusText: '',
    url: opts.url ?? 'https://dacemirror.sci-hub.se/10.1000/xyz123/file.pdf',
    headers: new Headers(opts.contentType ? { 'content-type': opts.contentType } : {}),
    text: async () => new TextDecoder().decode(body),
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  }
}

describe('SCIHUB_MIRRORS', () => {
  it('is a list of default mirrors', () => {
    expect(SCIHUB_MIRRORS).toContain('https://sci-hub.se')
    expect(SCIHUB_MIRRORS.length).toBeGreaterThanOrEqual(3)
  })
})

describe('downloadSciHubPdf', () => {
  it('downloads the PDF direct link found on the first mirror page', async () => {
    const html = `<html><body>
      <embed type="application/pdf" src="https://dacemirror.sci-hub.se/10.1000/xyz123/file.pdf#view=FitH">
    </body></html>`
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse(html))
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://dacemirror.sci-hub.se/10.1000/xyz123/file.pdf' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadSciHubPdf('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(r!.bytes).toEqual(pdfHeader)
    expect(r!.finalUrl).toContain('dacemirror.sci-hub.se')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('skips a blocked (403) first mirror and succeeds on the second', async () => {
    const html2 = `<html><body>
      <a href="https://dacemirror.sci-hub.st/10.1000/xyz123/file.pdf">pdf</a>
    </body></html>`
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse('<html>challenge</html>', { ok: false, status: 403 }))
      .mockResolvedValueOnce(textResponse(html2))
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://dacemirror.sci-hub.st/10.1000/xyz123/file.pdf' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadSciHubPdf('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(r!.bytes).toEqual(pdfHeader)
    // The PDF must come from the second mirror, not the blocked first one.
    expect(fetchMock.mock.calls[2][0]).toBe('https://dacemirror.sci-hub.st/10.1000/xyz123/file.pdf')
  })

  it('skips a mirror whose page has no PDF link and continues to the next', async () => {
    const htmlNoLink = '<html><body><h1>No article found</h1></body></html>'
    const htmlWithLink = `<html><body>
      <a href="https://dacemirror.sci-hub.ru/10.1000/xyz123/file.pdf">pdf</a>
    </body></html>`
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse(htmlNoLink))
      .mockResolvedValueOnce(textResponse(htmlNoLink))
      .mockResolvedValueOnce(textResponse(htmlWithLink))
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://dacemirror.sci-hub.ru/10.1000/xyz123/file.pdf' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadSciHubPdf('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(fetchMock.mock.calls[2][0]).toBe('https://sci-hub.ru/10.1000/xyz123')
  })

  it('returns undefined when every mirror fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse('<html>challenge</html>', { ok: false, status: 403 }))
      .mockResolvedValueOnce(textResponse('<html><body>no pdf</body></html>'))
      .mockResolvedValueOnce(textResponse('<html>gone</html>', { ok: false, status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadSciHubPdf('10.1000/xyz123', { signal: new AbortController().signal }),
    ).resolves.toBeUndefined()
  })

  it('parses a pdfUrl expression inside a script block (PDF.js viewer)', async () => {
    const html = `<html><head><script>
      var viewerConfig = { container: '#viewer', pdfUrl:'https://cdn.sci-hub.se/downloads/10.1000/xyz123.pdf' };
    </script></head></html>`
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse(html))
      .mockResolvedValueOnce(
        binaryResponse({ ok: true, contentType: 'application/pdf', body: pdfHeader, url: 'https://cdn.sci-hub.se/downloads/10.1000/xyz123.pdf' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const r = await downloadSciHubPdf('10.1000/xyz123', { signal: new AbortController().signal })

    expect(r).toBeDefined()
    expect(fetchMock.mock.calls[1][0]).toBe('https://cdn.sci-hub.se/downloads/10.1000/xyz123.pdf')
    expect(r!.bytes).toEqual(pdfHeader)
  })

  it('throws on an invalid DOI before any fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(downloadSciHubPdf('not-a-doi')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
