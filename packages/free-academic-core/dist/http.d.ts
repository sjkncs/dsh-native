export type HttpResult<T> = {
    ok: true;
    data: T;
    status?: number;
} | {
    ok: false;
    error: string;
    status?: number;
};
export interface FetchTextOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    headers?: Record<string, string>;
    userAgent?: string;
    /** HTTP method; defaults to 'POST' when body is provided, otherwise 'GET'. */
    method?: string;
    /** JSON-serializable body; when provided the request is sent as application/json. */
    body?: unknown;
}
export declare function parseXmlText(xml: string): string;
export declare class RateLimiter {
    private minIntervalMs;
    private last;
    constructor(minIntervalMs: number);
    acquire(): Promise<void>;
}
export declare function fetchText(url: string, opts?: FetchTextOptions): Promise<HttpResult<string>>;
export declare function fetchJson<T>(url: string, opts?: FetchTextOptions): Promise<HttpResult<T>>;
export declare function fetchBinary(url: string, opts?: {
    signal?: AbortSignal;
    timeoutMs?: number;
    headers?: Record<string, string>;
}): Promise<{
    ok: true;
    data: Uint8Array;
    finalUrl: string;
    contentType: string;
} | {
    ok: false;
    error: string;
}>;
