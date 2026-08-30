import { compact } from '../schema.js';
import { fetchJson } from '../http.js';
export function mapRxivItem(raw) {
    // The live api.biorxiv.org details endpoint reports the server via the `server`
    // field ("bioRxiv"/"medRxiv"); `preprint_server` is kept as a fallback for
    // older/alternate shapes.
    const rawServer = (raw.server ?? raw.preprint_server);
    const server = rawServer === 'medRxiv' ? 'medrxiv' : 'biorxiv';
    const authors = Array.isArray(raw.authors) ? raw.authors.filter(Boolean) : [];
    const doi = typeof raw.doi === 'string' ? raw.doi : '';
    const title = typeof raw.title === 'string' ? raw.title : '';
    const date = typeof raw.date === 'string' ? raw.date : '';
    const year = /^(\d{4})/.exec(date)?.[1];
    return compact({
        source: server,
        id: doi,
        title,
        authors,
        year: year ? Number.parseInt(year, 10) : undefined,
        date: date || undefined,
        venue: server === 'biorxiv' ? 'bioRxiv' : 'medRxiv',
        doi: doi || undefined,
        url: doi ? `https://doi.org/${doi}` : undefined,
    });
}
export async function searchRxiv(opts) {
    const query = opts.query.trim();
    if (query.length === 0)
        throw new Error('query must be a non-empty string');
    // bioRxiv API 按日期浏览；这里取最近 30 天并按关键词过滤
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const from = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
    const wanted = Math.min(Math.max(1, opts.maxResults ?? 10), 100);
    const q = query.toLowerCase();
    const collected = [];
    let cursor = 0;
    const maxPages = 8;
    for (let page = 0; page < maxPages && collected.length < wanted; page++) {
        const url = `https://api.biorxiv.org/details/${opts.server}/${from}/${to}/${cursor}`;
        const res = await fetchJson(url, { signal: opts.signal });
        if (!res.ok)
            throw new Error(`bioRxiv/medRxiv search failed: ${res.error}`);
        const items = res.data.collection ?? [];
        if (items.length === 0)
            break;
        for (const item of items) {
            const title = typeof item.title === 'string' ? item.title : '';
            const abstract = typeof item.abstract === 'string' ? item.abstract : '';
            if (`${title} ${abstract}`.toLowerCase().includes(q))
                collected.push(mapRxivItem(item));
        }
        // The details endpoint returns 30 items per cursor page, so step by the
        // number actually fetched (robust to page-size changes) rather than a fixed 100.
        cursor += items.length;
    }
    return collected.slice(0, wanted);
}
//# sourceMappingURL=rxiv.js.map