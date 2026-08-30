import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchText, fetchJson, fetchBinary, RateLimiter, parseXmlText } from '../src/http.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(payload: unknown, status = 200, statusText = 'OK', headers?: Record<string, string>) {
  const h = new Headers()
  for (const [k, v] of Object.entries(headers ?? {})) h.set(k, v)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => JSON.stringify(payload),
    headers: h,
  }
}

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
    url: opts.url ?? 'https://example.com/file',
    headers: new Headers(opts.contentType ? { 'content-type': opts.contentType } : {}),
    text: async () => new TextDecoder().decode(body),
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  }
}

describe('parseXmlText', () => {
  it('decodes XML entities and numeric char refs', () => {
    expect(parseXmlText('a &amp; b &lt;c&gt; &#65;')).toBe('a & b <c> A')
  })
})

describe('RateLimiter', () => {
  it('throttles calls to min interval', async () => {
    const limiter = new RateLimiter(10)
    const t0 = Date.now()
    await limiter.acquire()
    await limiter.acquire()
    expect(Date.now() - t0).toBeGreaterThanOrEqual(8)
  })
})

describe('fetchText', () => {
  it('returns body on 200', async () => {
    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(typeof r.data).toBe('string')
  })
  it('returns error object on failure (no throw)', async () => {
    const r = await fetchText('https://example.invalid/nope', { timeoutMs: 2000 })
    expect(r.ok).toBe(false)
  })
})

describe('fetchJson with method/body', () => {
  it('sends POST with JSON body and parses the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, n: 2 }))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchJson<{ ok: boolean; n: number }>('https://example.com/api', {
      method: 'POST',
      body: { ids: ['a', 'b'] },
      timeoutMs: 5000,
    })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual({ ok: true, n: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://example.com/api')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"ids":["a","b"]}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('defaults to POST when body is given without an explicit method', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://example.com/api', { body: { hello: 'world' } })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"hello":"world"}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('keeps GET semantics (no body) when method/body are omitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('plain'))
    vi.stubGlobal('fetch', fetchMock)

    await fetchText('https://example.com/', { timeoutMs: 5000 })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(init.headers).not.toHaveProperty('Content-Type')
  })
})

describe('fetchText retry', () => {
  it('retries a 429 and succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 429, 'Too Many Requests'))
      .mockResolvedValueOnce(jsonResponse({ value: 'retried!' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toBe('{"value":"retried!"}')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after 2 retries on persistent 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 429, 'Too Many Requests'))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries a 5xx and succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 503, 'Service Unavailable'))
      .mockResolvedValueOnce(jsonResponse({ value: 'ok!' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toBe('{"value":"ok!"}')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry on non-retryable 4xx (single attempt)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 400, 'Bad Request'))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('stops retrying when the signal is aborted', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 429, 'Too Many Requests'))
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchText('https://example.com/', { signal: controller.signal, timeoutMs: 5000 })
    setTimeout(() => controller.abort(), 20)
    const r = await promise

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.toLowerCase()).toContain('aborted')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('honors Retry-After header over the default backoff', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 429, 'Too Many Requests', { 'retry-after': '0' }))
      .mockResolvedValueOnce(jsonResponse('ok', 200))
    vi.stubGlobal('fetch', fetchMock)

    const t0 = Date.now()
    const r = await fetchText('https://example.com/', { timeoutMs: 5000 })
    const elapsed = Date.now() - t0

    expect(r.ok).toBe(true)
    expect(elapsed).toBeLessThan(200) // default 250ms backoff would exceed this
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('fetchBinary retry', () => {
  it('retries a 429 and returns the payload', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.4 test')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(binaryResponse({ ok: false, status: 429 }))
      .mockResolvedValueOnce(binaryResponse({ ok: true, contentType: 'application/pdf', body: bytes }))
    vi.stubGlobal('fetch', fetchMock)

    const r = await fetchBinary('https://example.com/file.pdf', { timeoutMs: 5000 })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual(bytes)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
