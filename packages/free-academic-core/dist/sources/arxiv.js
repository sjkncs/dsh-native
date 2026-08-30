import { compact } from '../schema.js';
import { fetchText, parseXmlText } from '../http.js';
const ARXIV_API = 'https://export.arxiv.org/api/query';
export const SORT_BY = { relevance: 'relevance', lastUpdatedDate: 'lastUpdatedDate', submittedDate: 'submittedDate' };
export function arxivPdfUrl(id) {
    return `https://arxiv.org/pdf/${id}`;
}
export function normalizeArxivId(input) {
    const trimmed = input.trim()
        .replace(/^arxiv:/i, '')
        .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, '')
        .replace(/\.pdf$/, '')
        .replace(/v\d+$/, '');
    if (!/^([a-z-]+(\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?$/.test(trimmed)) {
        throw new Error(`"${input}" is not an arXiv identifier (expected e.g. 2106.12345 or hep-th/9901001)`);
    }
    return trimmed;
}
export function parseArxivFeed(xml) {
    const papers = [];
    const totalMatch = /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/.exec(xml);
    const total = totalMatch ? Number.parseInt(totalMatch[1], 10) : 0;
    const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRe.exec(xml)) !== null) {
        const e = m[1];
        const tag = (t) => {
            const r = new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`).exec(e);
            return r ? parseXmlText(r[1].trim()) : '';
        };
        const title = tag('title').replace(/\s+/g, ' ');
        const idUrl = tag('id');
        const id = idUrl.replace(/^https?:\/\/arxiv\.org\/abs\//, '').replace(/v\d+$/, '');
        if (title.length === 0 || id.length === 0)
            continue;
        const abstract = tag('summary').replace(/\s+/g, ' ');
        const published = tag('published');
        const authors = [];
        const authRe = /<author>\s*<name>([^<]+)<\/name>/g;
        let am;
        while ((am = authRe.exec(e)) !== null)
            authors.push(parseXmlText(am[1].trim()));
        const categories = [];
        const catRe = /<category[^>]+term="([^"]+)"/g;
        let cm;
        while ((cm = catRe.exec(e)) !== null)
            categories.push(cm[1]);
        const doiMatch = /<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/.exec(e);
        const journalRef = /<arxiv:journal_ref[^>]*>([^<]+)<\/arxiv:journal_ref>/.exec(e);
        const doi = doiMatch ? doiMatch[1].trim() : undefined;
        const externalIds = { ArXiv: id };
        if (doi)
            externalIds.DOI = doi;
        const year = /^(\d{4})/.exec(published)?.[1];
        papers.push(compact({
            source: 'arxiv',
            id,
            title,
            authors,
            year: year ? Number.parseInt(year, 10) : undefined,
            date: published.length > 0 ? published.slice(0, 10) : undefined,
            venue: journalRef ? parseXmlText(journalRef[1].trim()) : undefined,
            abstract: abstract.length > 0 ? abstract : undefined,
            doi,
            arxivId: id,
            url: `https://arxiv.org/abs/${id}`,
            pdfUrl: arxivPdfUrl(id),
            externalIds,
            categories: categories.length > 0 ? categories : undefined,
        }));
    }
    return { papers, total };
}
export async function searchArxiv(opts) {
    const query = opts.query.trim();
    if (query.length === 0)
        throw new Error('query must be a non-empty string');
    const offset = opts.offset && opts.offset > 0 ? Math.trunc(opts.offset) : 0;
    let searchQuery = query;
    if (opts.dateFrom) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.dateFrom))
            throw new Error('date_from must be YYYY-MM-DD');
        searchQuery = `(${query}) AND submittedDate:[${opts.dateFrom.replace(/-/g, '')}0000 TO 99991231]`;
    }
    const params = new URLSearchParams({
        search_query: searchQuery,
        start: String(offset),
        max_results: String(Math.min(Math.max(1, opts.maxResults ?? 10), 100)),
        sortBy: SORT_BY[opts.sortBy ?? 'relevance'],
        sortOrder: 'descending',
    });
    const res = await fetchText(`${ARXIV_API}?${params.toString()}`, { signal: opts.signal });
    if (!res.ok)
        throw new Error(`arXiv search failed: ${res.error}`);
    const { papers, total } = parseArxivFeed(res.data);
    const reported = Math.max(total, offset + papers.length);
    const truncated = offset + papers.length < reported;
    return { papers, total: reported, nextOffset: truncated ? offset + papers.length : undefined };
}
//# sourceMappingURL=arxiv.js.map