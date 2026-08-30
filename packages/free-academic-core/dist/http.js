const DEFAULT_UA = 'free-academic-search/0.1.0 (open-source academic search; +https://github.com/zoujialin1997/free-academic-search)';
// Transient statuses worth a retry: rate-limit (429) and server errors (5xx).
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3; // 1 initial request + 2 retries
const DEFAULT_BACKOFF_MS = [250, 500];
const MAX_RETRY_AFTER_MS = 10_000;
function describeFailure(status, statusText, body) {
    const detail = body.replace(/\s+/g, ' ').trim().slice(0, 240);
    return detail ? `HTTP ${status}: ${detail}` : `HTTP ${status} ${statusText}`.trim();
}
export function parseXmlText(xml) {
    return xml
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&amp;/g, '&');
}
export class RateLimiter {
    minIntervalMs;
    last = 0;
    constructor(minIntervalMs) { this.minIntervalMs = minIntervalMs; }
    async acquire() {
        const now = Date.now();
        const wait = Math.max(0, this.last + this.minIntervalMs - now);
        if (wait > 0)
            await new Promise((r) => setTimeout(r, wait));
        this.last = Date.now();
    }
}
function requestSignal(signal, timeoutMs) {
    const timeout = AbortSignal.timeout(timeoutMs);
    return signal ? AbortSignal.any([timeout, signal]) : timeout;
}
/** Honor a Retry-After header (delta-seconds form), capped; HTTP-date form falls back to the default backoff. */
function parseRetryAfter(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed))
        return undefined;
    return Math.min(Number(trimmed) * 1000, MAX_RETRY_AFTER_MS);
}
/** Sleep that rejects with an AbortError when the caller's signal aborts, so retries stop immediately. */
function wait(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
            return;
        }
        const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException('The operation was aborted', 'AbortError'));
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
/**
 * Run a single HTTP attempt up to MAX_ATTEMPTS times, retrying only transient
 * statuses (429, 5xx) with a small backoff. Aborts (caller signal) and
 * non-retryable failures are returned immediately.
 */
async function runWithRetry(attempt, signal) {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (signal?.aborted)
            return { ok: false, error: 'The operation was aborted' };
        let outcome;
        try {
            outcome = await attempt();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // Aborts from the signal are fatal: never retry them.
            return { ok: false, error: msg };
        }
        if (outcome.kind === 'done')
            return { ok: true, result: outcome.result };
        if (i < MAX_ATTEMPTS - 1) {
            try {
                await wait(outcome.retryAfterMs ?? DEFAULT_BACKOFF_MS[i], signal);
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : String(err) };
            }
            continue;
        }
        return { ok: false, error: outcome.error, status: outcome.status };
    }
    throw new Error('unreachable');
}
async function fetchTextAttempt(url, opts) {
    const hasBody = opts.body !== undefined;
    const method = opts.method ?? (hasBody ? 'POST' : 'GET');
    const res = await fetch(url, {
        method,
        headers: {
            'User-Agent': opts.userAgent ?? DEFAULT_UA,
            'Accept': 'application/atom+xml, application/json, text/plain, */*',
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            ...opts.headers,
        },
        body: hasBody ? JSON.stringify(opts.body) : undefined,
        signal: requestSignal(opts.signal, opts.timeoutMs ?? 30000),
    });
    const body = await res.text();
    if (!res.ok) {
        const error = describeFailure(res.status, res.statusText, body);
        if (RETRYABLE_STATUS.has(res.status)) {
            return { kind: 'retry', status: res.status, retryAfterMs: parseRetryAfter(res.headers.get('retry-after')), error };
        }
        return { kind: 'done', result: { ok: false, error, status: res.status } };
    }
    return { kind: 'done', result: { ok: true, data: body, status: res.status } };
}
export async function fetchText(url, opts = {}) {
    const r = await runWithRetry(() => fetchTextAttempt(url, opts), opts.signal);
    if (!r.ok) {
        return { ok: false, error: r.error, ...(r.status !== undefined ? { status: r.status } : {}) };
    }
    return r.result;
}
export async function fetchJson(url, opts = {}) {
    const res = await fetchText(url, opts);
    if (!res.ok)
        return res;
    try {
        return { ok: true, data: JSON.parse(res.data) };
    }
    catch {
        return { ok: false, error: 'response is not valid JSON' };
    }
}
async function fetchBinaryAttempt(url, opts) {
    const res = await fetch(url, {
        headers: { 'User-Agent': DEFAULT_UA, 'Accept': 'application/pdf,application/x-pdf,*/*', ...opts.headers },
        redirect: 'follow',
        signal: requestSignal(opts.signal, opts.timeoutMs ?? 60000),
    });
    if (!res.ok) {
        const body = await res.text();
        const error = describeFailure(res.status, res.statusText, body);
        if (RETRYABLE_STATUS.has(res.status)) {
            return { kind: 'retry', status: res.status, retryAfterMs: parseRetryAfter(res.headers.get('retry-after')), error };
        }
        return { kind: 'done', result: { ok: false, error } };
    }
    return {
        kind: 'done',
        result: {
            ok: true,
            data: new Uint8Array(await res.arrayBuffer()),
            finalUrl: res.url,
            contentType: res.headers.get('content-type') ?? '',
        },
    };
}
export async function fetchBinary(url, opts = {}) {
    const r = await runWithRetry(() => fetchBinaryAttempt(url, opts), opts.signal);
    if (!r.ok)
        return { ok: false, error: r.error };
    return r.result;
}
//# sourceMappingURL=http.js.map