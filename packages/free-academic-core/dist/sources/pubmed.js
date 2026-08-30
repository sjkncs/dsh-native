import { compact } from '../schema.js';
import { fetchJson, fetchText, parseXmlText, RateLimiter } from '../http.js';
const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const limiter = new RateLimiter(350);
export function parsePubmedSearchXml(xml) {
    const countMatch = /<Count>(\d+)<\/Count>/.exec(xml);
    const pmids = [];
    const idRe = /<Id>(\d+)<\/Id>/g;
    let m;
    while ((m = idRe.exec(xml)) !== null)
        pmids.push(m[1]);
    return { pmids, count: countMatch ? Number.parseInt(countMatch[1], 10) : pmids.length };
}
export function parsePubmedSummariesJson(json) {
    const result = json.result ?? {};
    const papers = [];
    for (const [uid, raw] of Object.entries(result)) {
        if (uid === 'uids')
            continue;
        const rec = raw;
        if (!rec || typeof rec !== 'object' || typeof rec.uid === 'undefined')
            continue;
        const authors = Array.isArray(rec.authors)
            ? rec.authors.map((a) => parseXmlText(String(a.name ?? ''))).filter(Boolean)
            : [];
        const pubdate = typeof rec.pubdate === 'string' ? rec.pubdate : '';
        const year = /^(\d{4})/.exec(pubdate)?.[1];
        papers.push(compact({
            source: 'pubmed',
            id: uid,
            title: parseXmlText(typeof rec.title === 'string' ? rec.title : ''),
            authors,
            year: year ? Number.parseInt(year, 10) : undefined,
            date: pubdate.length > 0 ? pubdate : undefined,
            venue: typeof rec.source === 'string' && rec.source.length > 0 ? parseXmlText(rec.source) : undefined,
            doi: typeof rec.doi === 'string' ? rec.doi : undefined,
            pmid: uid,
            url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
        }));
    }
    return papers;
}
export async function searchPubmed(opts) {
    const query = opts.query.trim();
    if (query.length === 0)
        throw new Error('query must be a non-empty string');
    await limiter.acquire();
    const searchParams = new URLSearchParams({ db: 'pubmed', term: query, retmax: String(Math.min(Math.max(1, opts.maxResults ?? 10), 1000)), retmode: 'xml' });
    const esearch = await fetchText(`${EUTILS}/esearch.fcgi?${searchParams.toString()}`, { signal: opts.signal });
    if (!esearch.ok)
        throw new Error(`PubMed search failed: ${esearch.error}`);
    const { pmids } = parsePubmedSearchXml(esearch.data);
    if (pmids.length === 0)
        return [];
    await limiter.acquire();
    const summaryParams = new URLSearchParams({ db: 'pubmed', id: pmids.join(','), retmode: 'json' });
    const esummary = await fetchJson(`${EUTILS}/esummary.fcgi?${summaryParams.toString()}`, { signal: opts.signal });
    if (!esummary.ok)
        throw new Error(`PubMed summary failed: ${esummary.error}`);
    return parsePubmedSummariesJson(esummary.data);
}
const ESUMMARY_CHUNK = 500; // conservative per-request cap for esummary id lists
async function esummaryForIds(ids, signal) {
    const papers = [];
    for (let i = 0; i < ids.length; i += ESUMMARY_CHUNK) {
        const chunk = ids.slice(i, i + ESUMMARY_CHUNK);
        await limiter.acquire();
        const params = new URLSearchParams({ db: 'pubmed', id: chunk.join(','), retmode: 'json' });
        const res = await fetchJson(`${EUTILS}/esummary.fcgi?${params.toString()}`, { signal });
        if (!res.ok)
            throw new Error(`PubMed summary failed: ${res.error}`);
        papers.push(...parsePubmedSummariesJson(res.data));
    }
    return papers;
}
export async function getPubmedPaperDetail(pmid, signal) {
    const id = pmid.trim();
    if (id.length === 0)
        throw new Error('pmid must be a non-empty string');
    const papers = await esummaryForIds([id], signal);
    return papers[0] ?? null;
}
export async function getPubmedPaperBatch(pmids, signal) {
    if (pmids.length === 0)
        return [];
    return esummaryForIds(pmids, signal);
}
export async function getPubmedRelated(pmid, opts = {}) {
    const id = pmid.trim();
    if (id.length === 0)
        throw new Error('pmid must be a non-empty string');
    await limiter.acquire();
    const params = new URLSearchParams({ dbfrom: 'pubmed', db: 'pubmed', id, retmode: 'json' });
    const res = await fetchJson(`${EUTILS}/elink.fcgi?${params.toString()}`, { signal: opts.signal });
    if (!res.ok)
        throw new Error(`PubMed elink failed: ${res.error}`);
    const links = res.data.linksets?.[0]?.linksetdbs?.[0]?.links ?? [];
    if (links.length === 0)
        return [];
    const ids = links.slice(0, Math.max(1, opts.maxResults ?? 10));
    return esummaryForIds(ids, opts.signal);
}
//# sourceMappingURL=pubmed.js.map