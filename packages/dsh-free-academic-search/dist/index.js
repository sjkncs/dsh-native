/**
 * dsh-free-academic-search — free academic search & download for DeepSeek
 * Harness. Registers the full free tool set on `ctx.tools`, each family gated
 * by its config toggle (all on by default): arXiv search/download/read,
 * Semantic Scholar search, PubMed search, bioRxiv/medRxiv search, DOI
 * resolution + full-text reading, and a unified multi-platform search. Every
 * tool is backed by `free-academic-core` as a workspace dependency, so no API
 * key and no credits are involved.
 * @module dsh-free-academic-search
 */
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { arxivPdfUrl, downloadPdfByDoi, downloadSciHubPdf, downloadUnpaywallPdf, extractPdfText, fetchBinary, getPubmedPaperBatch, getPubmedPaperDetail, getPubmedRelated, getSemanticAuthor, getSemanticAuthorPapers, getSemanticPaper, getSemanticPaperBatch, getSemanticPaperCitations, getSemanticPaperRecommendations, getSemanticPaperReferences, isPdfPayload, normalizeArxivId, normalizeDoi, searchArxiv, searchPapers, searchPubmed, searchRxiv, searchSemanticPaperMatch, searchSemanticScholar, sliceText, } from 'free-academic-core';
/** Cordis plugin name used by loader diagnostics. */
export const name = 'free-academic-search';
/** Services required before `apply` runs. */
export const inject = ['tools'];
export const Config = Schema.object({
    arxiv: Schema.boolean().default(true).description('Register the arXiv tools (search, download, read).'),
    semanticScholar: Schema.boolean().default(true).description('Register the Semantic Scholar search tool.'),
    pubmed: Schema.boolean().default(true).description('Register the PubMed search tool.'),
    biorxiv: Schema.boolean().default(true).description('Register the bioRxiv search tool.'),
    medrxiv: Schema.boolean().default(true).description('Register the medRxiv search tool.'),
    doi: Schema.boolean().default(true).description('Register the DOI tools (download, read).'),
    unified: Schema.boolean().default(true).description('Register the unified search_papers tool.'),
    unpaywall: Schema.boolean().default(true).description('Use Unpaywall as a fallback for paywalled DOIs: download a legal open-access copy when one exists (default on).'),
    scihub: Schema.boolean().default(false).description('EXPERIMENTAL: try Sci-Hub mirrors as a last-resort fallback for paywalled DOIs. OFF by default. Sci-Hub hosts unauthorized copies of copyrighted works and using it may be illegal in your jurisdiction — enable only when you are legally entitled to access the content.'),
    unpaywallEmail: Schema.string().description('Unpaywall API email (required; Unpaywall rejects placeholder emails with 422). Default: free-academic-search@users.noreply.github.com').default('free-academic-search@users.noreply.github.com'),
    command: Schema.boolean().default(true).description('Register the /free-academic command (slash command in the composer).'),
});
/** A config toggle is on unless explicitly set to `false` (default-on). */
function enabled(v) {
    return v !== false;
}
/** Cooperative timeouts (ms). Core also enforces its own per-fetch timeouts. */
const SEARCH_TIMEOUT_MS = 180_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
const READ_TIMEOUT_MS = 300_000;
/** Default full-text slice length, matching core's sliceText default. */
const DEFAULT_MAX_CHARS = 60_000;
/** Every `Source` value core can emit (used in the output-schema enum). */
const SOURCES = ['semantic-scholar', 'pubmed', 'arxiv', 'biorxiv', 'medrxiv', 'doi'];
/** Every `source` value the DOI tools (`download_by_doi` / `read_by_doi`) can emit. */
const DOI_SOURCES = ['doi', 'arxiv', 'unpaywall', 'scihub'];
/** Human-readable platform label for headings and card titles. */
const SOURCE_LABEL = {
    'semantic-scholar': 'Semantic Scholar',
    'pubmed': 'PubMed',
    'arxiv': 'arXiv',
    'biorxiv': 'bioRxiv',
    'medrxiv': 'medRxiv',
    'doi': 'DOI',
};
/** JSON schema of one normalized `Paper` (core's shape; every field declared). */
const PAPER_OBJECT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        source: { type: 'string', required: true, enum: SOURCES },
        id: { type: 'string', required: true },
        title: { type: 'string', required: true },
        authors: { type: 'array', required: true, items: { type: 'string' } },
        year: { type: 'integer' },
        date: { type: 'string', description: 'Publication date (ISO date when available).' },
        venue: { type: 'string', description: 'Journal or venue name.' },
        citationCount: { type: 'integer' },
        doi: { type: 'string' },
        pmid: { type: 'string' },
        arxivId: { type: 'string' },
        url: { type: 'string' },
        pdfUrl: { type: 'string', description: 'Open-access PDF URL.' },
        openAccessPdf: { type: 'string' },
        abstract: { type: 'string' },
        externalIds: { type: 'object', additionalProperties: true, description: 'Other identifiers keyed by scheme.' },
        categories: { type: 'array', items: { type: 'string' } },
    },
};
/** Output schema of one platform paper-list search (arXiv / Semantic Scholar / PubMed / bioRxiv / medRxiv). */
const PAPER_LIST_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        source: { type: 'string', required: true, enum: SOURCES, description: 'The platform the papers came from.' },
        query: { type: 'string', required: true, description: 'The search query.' },
        total: { type: 'integer', required: true, description: 'Total matches reported by the platform, or the returned count when unknown.' },
        papers: { type: 'array', required: true, items: PAPER_OBJECT_SCHEMA },
        truncated: { type: 'boolean', required: true, description: 'True when more results exist beyond the returned page.' },
        nextOffset: { type: 'integer', description: 'Offset to request the next page, when known.' },
    },
};
/** Output schema of the unified `search_papers` tool. */
const UNIFIED_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        query: { type: 'string', required: true, description: 'The search query.' },
        sources: { type: 'array', required: true, items: { type: 'string' }, description: 'Platforms queried, in the order they were merged.' },
        total: { type: 'integer', required: true, description: 'Unique papers after de-duplication.' },
        papers: { type: 'array', required: true, items: PAPER_OBJECT_SCHEMA },
        truncated: { type: 'boolean', required: true, description: 'True when more results may exist beyond the returned list.' },
    },
};
/** Output schema of `download_arxiv` (id → abstract page + PDF URL). */
const DOWNLOAD_ARXIV_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        id: { type: 'string', required: true },
        url: { type: 'string', required: true, description: 'Abstract page URL.' },
        pdfUrl: { type: 'string', required: true, description: 'Direct PDF URL.' },
    },
};
/** Output schema of `download_by_doi` (resolved PDF facts; bytes is the size, not the payload). */
const DOWNLOAD_DOI_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        doi: { type: 'string', required: true, description: 'DOI or arXiv id that was resolved.' },
        pdfUrl: { type: 'string', required: true, description: 'URL that returned the PDF.' },
        contentType: { type: 'string', description: 'Content type of the resolved payload.' },
        bytes: { type: 'integer', required: true, description: 'Size of the downloaded PDF in bytes.' },
        source: { type: 'string', enum: DOI_SOURCES, description: 'Where the PDF actually came from: doi (open-access), arxiv (preprint, used directly or as a paywall fallback), unpaywall (legal open-access copy), or scihub (opt-in last-resort mirror).' },
        note: { type: 'string', description: 'Human-readable note about the actual source (set when a fallback route served a paywalled DOI).' },
    },
};
/** Output schema of every full-text read tool (`read_arxiv_paper` / `read_by_doi`). */
const READ_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        id: { type: 'string', required: true, description: 'The identifier the call resolved.' },
        pdfUrl: { type: 'string', required: true, description: 'URL the PDF was fetched from.' },
        pages: { type: 'integer', description: 'Page count of the PDF.' },
        totalChars: { type: 'integer', required: true, description: 'Length of the whole extracted text.' },
        offset: { type: 'integer', required: true, description: 'Character offset this slice starts at.' },
        text: { type: 'string', required: true, description: 'The returned slice of extracted text.' },
        truncated: { type: 'boolean', required: true, description: 'True when text remains after this slice.' },
        nextOffset: { type: 'integer', description: 'Offset to request the next slice.' },
        source: { type: 'string', enum: DOI_SOURCES, description: 'Where the PDF actually came from: doi, arxiv, unpaywall (legal open-access copy), or scihub (opt-in last-resort mirror).' },
        note: { type: 'string', description: 'Human-readable note about the actual source (set when a fallback route served a paywalled DOI).' },
    },
};
/** Output schema of a bare list of papers (match / batch / graph / author-papers / related). */
const PAPER_ARRAY_OUTPUT_SCHEMA = {
    type: 'array',
    items: PAPER_OBJECT_SCHEMA,
};
/** Output schema of `get_semantic_author` (all fields optional: S2 may omit any of them). */
const AUTHOR_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        authorId: { type: 'string', description: 'Semantic Scholar author id.' },
        name: { type: 'string', description: 'Author display name.' },
        hIndex: { type: 'integer', description: 'Author h-index (omitted when unknown).' },
        affiliations: { type: 'array', items: { type: 'string' }, description: 'Current affiliations.' },
        paperCount: { type: 'integer', description: 'Number of papers indexed for the author.' },
        citationCount: { type: 'integer', description: 'Number of citations received by the author.' },
        url: { type: 'string', description: 'Semantic Scholar author page URL.' },
    },
};
/** Output schema of `get_pubmed_paper_detail`: `found: true` carries the paper, `found: false` a message. */
const PUBMED_DETAIL_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        found: { type: 'boolean', required: true, description: 'True when a PubMed record matched the PMID.' },
        paper: PAPER_OBJECT_SCHEMA,
        message: { type: 'string', description: 'Human-readable note when the paper was not found.' },
    },
};
/** Output schema of `download_biorxiv` / `download_medrxiv` (metadata only; the bytes are never returned). */
const RXIV_DOWNLOAD_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        doi: { type: 'string', required: true },
        finalUrl: { type: 'string', required: true, description: 'URL that returned the PDF.' },
        contentType: { type: 'string', description: 'Content type of the resolved payload.' },
        size: { type: 'integer', required: true, description: 'Size of the downloaded PDF in bytes.' },
        source: { type: 'string', enum: SOURCES, description: 'The platform the PDF came from (biorxiv or medrxiv).' },
    },
};
/** Output schema of `read_biorxiv_paper` / `read_medrxiv_paper` (sliced full text). */
const RXIV_READ_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        doi: { type: 'string', required: true, description: 'The DOI the call resolved.' },
        text: { type: 'string', required: true, description: 'The returned slice of extracted text.' },
        offset: { type: 'integer', required: true, description: 'Character offset this slice starts at.' },
        hasMore: { type: 'boolean', required: true, description: 'True when text remains after this slice.' },
        totalPages: { type: 'integer', description: 'Page count of the PDF.' },
        source: { type: 'string', enum: SOURCES, description: 'The platform the PDF came from (biorxiv or medrxiv).' },
    },
};
/** Platform-native id label for the byline. */
function idLabel(source) {
    switch (source) {
        case 'semantic-scholar': return 'S2 id';
        case 'pubmed': return 'PMID';
        case 'arxiv': return 'arXiv';
        case 'biorxiv':
        case 'medrxiv': return 'DOI';
        default: return 'ID';
    }
}
/** `A, B, C et al.` style author line. */
function formatAuthors(authors, max = 3) {
    if (authors.length === 0)
        return 'Unknown authors';
    if (authors.length <= max)
        return authors.join(', ');
    return `${authors.slice(0, max).join(', ')} et al.`;
}
/** Model-facing markdown for one paper-list entry (any source). Omit `index` for a single-record view. */
function formatPaper(paper, index) {
    const lines = [];
    const heading = paper.url ? `[${paper.title}](${paper.url})` : paper.title;
    lines.push(index !== undefined ? `${index}. **${heading}**` : `**${heading}**`);
    const byline = [formatAuthors(paper.authors)];
    if (paper.year !== undefined)
        byline.push(String(paper.year));
    if (paper.venue !== undefined)
        byline.push(paper.venue);
    if (paper.citationCount !== undefined)
        byline.push(`${paper.citationCount} citations`);
    lines.push(`   ${byline.join(' · ')}`);
    const ids = [`${idLabel(paper.source)}: ${paper.id}`];
    if (paper.doi !== undefined && paper.doi !== paper.id)
        ids.push(`DOI: ${paper.doi}`);
    if (paper.pdfUrl !== undefined)
        ids.push(`PDF: ${paper.pdfUrl}`);
    lines.push(`   ${ids.join(' · ')}`);
    if (paper.categories !== undefined && paper.categories.length > 0) {
        lines.push(`   Categories: ${paper.categories.slice(0, 6).join(', ')}`);
    }
    if (paper.abstract !== undefined) {
        const clipped = paper.abstract.length > 300 ? `${paper.abstract.slice(0, 300)}…` : paper.abstract;
        lines.push(`   ${clipped}`);
    }
    return lines.join('\n');
}
/** Model-facing text for one platform paper-list result. */
function renderPaperList(label, value) {
    if (value.papers.length === 0)
        return [{ type: 'text', text: `No ${label} results for "${value.query}".` }];
    const parts = [];
    const totalNote = value.total > value.papers.length ? ` of ${value.total}` : '';
    parts.push(`${label} results for "${value.query}" (showing ${value.papers.length}${totalNote}):`);
    parts.push(value.papers.map((paper, i) => formatPaper(paper, i + 1)).join('\n\n'));
    if (value.truncated) {
        parts.push(value.nextOffset !== undefined
            ? `More results are available; call again with offset=${value.nextOffset} to continue.`
            : 'More results are available; narrow the query or raise max_results to see them.');
    }
    parts.push('Cite papers by title with their DOI or platform link.');
    return [{ type: 'text', text: parts.join('\n\n') }];
}
/** Model-facing text for one paper record (single-result tools). */
function renderPaperSingle(label, paper) {
    return [{ type: 'text', text: `${label} record:\n\n${formatPaper(paper)}` }];
}
/** Model-facing text for a bare list of papers under a caller-supplied heading. */
function renderPaperArray(label, heading, papers) {
    if (papers.length === 0)
        return [{ type: 'text', text: `No ${label} results.` }];
    const parts = [heading];
    parts.push(papers.map((paper, i) => formatPaper(paper, i + 1)).join('\n\n'));
    parts.push('Cite papers by title with their DOI or platform link.');
    return [{ type: 'text', text: parts.join('\n\n') }];
}
/** Model-facing text for one `get_semantic_author` result. */
function renderAuthor(value) {
    const lines = ['Semantic Scholar author:'];
    const info = [];
    if (value.name !== undefined)
        info.push(value.name);
    if (value.authorId !== undefined)
        info.push(`authorId: ${value.authorId}`);
    if (value.hIndex !== undefined)
        info.push(`h-index: ${value.hIndex}`);
    if (value.paperCount !== undefined)
        info.push(`${value.paperCount} papers`);
    if (value.citationCount !== undefined)
        info.push(`${value.citationCount} citations`);
    if (info.length > 0)
        lines.push(info.join(' · '));
    if (value.affiliations !== undefined && value.affiliations.length > 0) {
        lines.push(`Affiliations: ${value.affiliations.join('; ')}`);
    }
    if (value.url !== undefined)
        lines.push(`Profile: ${value.url}`);
    return [{ type: 'text', text: lines.join('\n') }];
}
/** Model-facing text for one rxiv full-text slice (`read_biorxiv_paper` / `read_medrxiv_paper`). */
function renderRxivRead(value) {
    const position = `Showing characters ${value.offset}–${value.offset + value.text.length}${value.hasMore ? ` — call again with offset=${value.offset + value.text.length} for the rest` : ' (complete)'}`;
    const head = [`Full text of ${value.doi}`, `${value.totalPages !== undefined ? `${value.totalPages} pages` : 'PDF'} · ${position}.`];
    return [{ type: 'text', text: `${head.join('\n')}\n\n${value.text}` }];
}
/** Model-facing text for the unified `search_papers` result. */
function renderUnifiedSearch(value) {
    const label = value.sources.map((s) => SOURCE_LABEL[s] ?? s).join(', ');
    if (value.papers.length === 0)
        return [{ type: 'text', text: `No papers found for "${value.query}" across ${label}.` }];
    const parts = [];
    parts.push(`Papers for "${value.query}" across ${label} — ${value.total} unique after de-duplication:`);
    parts.push(value.papers.map((paper, i) => formatPaper(paper, i + 1)).join('\n\n'));
    if (value.truncated) {
        parts.push('More results may exist; narrow the query or use the platform tools with offset to page.');
    }
    parts.push('Cite papers by title with their DOI or platform link.');
    return [{ type: 'text', text: parts.join('\n\n') }];
}
/** Model-facing text for one full-text read result. */
function renderRead(value) {
    const head = [`Full text of ${value.id}`];
    head.push(`Source PDF: ${value.pdfUrl}${value.pages !== undefined ? ` · ${value.pages} pages` : ''} · ${value.totalChars.toLocaleString('en-US')} characters`);
    head.push(`Showing characters ${value.offset.toLocaleString('en-US')}–${(value.offset + value.text.length).toLocaleString('en-US')}${value.truncated ? ` — call again with offset=${value.nextOffset} for the rest` : ' (complete)'}.`);
    return [{ type: 'text', text: `${head.join('\n')}\n\n${value.text}` }];
}
/** Slice extracted text into the read-tool value fields (offset/max_chars clamped). */
function sliceReadValue(fullText, offset, maxChars) {
    const slice = sliceText(fullText, offset, maxChars ?? DEFAULT_MAX_CHARS);
    const start = slice.offset - slice.text.length;
    return {
        totalChars: fullText.length,
        offset: start,
        text: slice.text,
        truncated: slice.hasMore,
        ...(slice.hasMore ? { nextOffset: slice.offset } : {}),
    };
}
/** True when a download error is the paywall signature: the DOI resolved to an HTML landing page. */
function isLandingPageError(err) {
    return err instanceof Error && err.message.includes('landing page');
}
/** Extract an arXiv id from a `10.48550/arXiv.<id>` DOI (the scheme that encodes an arXiv id), else undefined. */
function arxivIdFromDoi(doi) {
    const m = /^10\.48550\/arXiv[.:]?([a-z-]+(\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?$/i.exec(doi.trim());
    if (!m)
        return undefined;
    try {
        return normalizeArxivId(m[1]);
    }
    catch {
        return undefined;
    }
}
/**
 * Reverse-look-up the arXiv id for a DOI via Semantic Scholar, or return
 * undefined when it cannot be found. Only called after the DOI route already
 * failed on a paywall (landing page), so this is a deliberate second lookup,
 * never the primary path. Every failure — the S2 request itself throwing, an
 * empty/404 result, or a paper without an ArXiv mapping — silently degrades to
 * undefined so the caller can rethrow the original DOI error unchanged.
 */
async function arxivIdViaSemanticScholar(doi, signal) {
    try {
        const paper = await getSemanticPaper(doi, signal);
        return paper.arxivId ?? undefined;
    }
    catch {
        return undefined;
    }
}
/** Download a PDF from the direct arXiv URL, rejecting payloads that are not real PDFs. */
async function downloadArxivPdf(id, signal) {
    const res = await fetchBinary(arxivPdfUrl(id), { signal });
    if (!res.ok)
        throw new Error(`arXiv PDF download failed: ${res.error}`);
    if (!isPdfPayload(res.contentType, res.data)) {
        throw new Error(`arXiv ${id} did not return a PDF (content-type: ${res.contentType || 'unknown'}) — the preprint may not be available`);
    }
    return { bytes: res.data, finalUrl: res.finalUrl, contentType: res.contentType };
}
/**
 * Resolve an input that is either a DOI or an arXiv id to a PDF, walking a
 * paywall fallback chain. A plain arXiv id (or `arXiv:...` / an arXiv abs/pdf
 * URL) and a `10.48550/arXiv.*` DOI (the DOI scheme that encodes an arXiv id)
 * both go straight to the arXiv PDF — the latter never touches doi.org, so a
 * transient doi.org failure cannot block a locally-derivable arXiv id.
 * Anything else is treated as a DOI and tried through doi.org first; when the
 * DOI is paywalled (it resolves to a landing page), we fall back in order:
 *
 *   1. the free arXiv preprint — reverse-looking-up the arXiv id via
 *      Semantic Scholar;
 *   2. Unpaywall (legal open-access copy, `config.unpaywall`, default on);
 *   3. Sci-Hub mirrors (`config.scihub`, **off by default** and strictly gated
 *      — never touched unless explicitly enabled; Sci-Hub hosts unauthorized
 *      copies and may be illegal in your jurisdiction).
 *
 * Any non-landing-page failure — or a failure of every fallback layer —
 * rethrows the original DOI error unchanged. A user abort always surfaces as
 * AbortError, never as a masked DOI error.
 */
async function downloadWithFallback(input, opts) {
    const { signal, config } = opts;
    const trimmed = input.trim();
    let arxivId;
    try {
        arxivId = normalizeArxivId(trimmed);
    }
    catch {
        arxivId = undefined;
    }
    if (arxivId !== undefined) {
        const pdf = await downloadArxivPdf(arxivId, signal);
        return { ...pdf, identifier: arxivId, source: 'arxiv' };
    }
    // A `10.48550/arXiv.*` DOI encodes an arXiv id: short-circuit straight to the
    // arXiv PDF so we never spend a round-trip on doi.org, and a transient
    // doi.org failure can never prevent the locally-derivable arXiv route.
    const encodedArxiv = arxivIdFromDoi(trimmed);
    if (encodedArxiv !== undefined) {
        const pdf = await downloadArxivPdf(encodedArxiv, signal);
        return { ...pdf, identifier: encodedArxiv, source: 'arxiv' };
    }
    const doi = normalizeDoi(trimmed);
    try {
        const pdf = await downloadPdfByDoi(doi, { signal });
        return { ...pdf, identifier: doi, source: 'doi' };
    }
    catch (err) {
        // A user abort must surface as AbortError, never as the original DOI
        // (landing-page) error — check before any fallback layer runs.
        if (signal?.aborted)
            throw new DOMException('This operation was aborted', 'AbortError');
        if (isLandingPageError(err)) {
            // Reverse-look-up the arXiv id via Semantic Scholar. This runs only after
            // the DOI genuinely failed, so the DOI route stays the primary path and
            // healthy open-access DOIs never trigger an S2 call.
            const s2Id = await arxivIdViaSemanticScholar(doi, signal);
            if (s2Id !== undefined) {
                try {
                    const pdf = await downloadArxivPdf(s2Id, signal);
                    return { ...pdf, identifier: s2Id, source: 'arxiv', note: 'via Semantic Scholar arXiv lookup' };
                }
                catch (inner) {
                    // A user abort mid-chain must propagate as AbortError, never be
                    // swallowed into a graceful-degradation console.debug.
                    if (inner instanceof DOMException && inner.name === 'AbortError')
                        throw inner;
                    // Graceful degradation: record the swallowed cause for debugging.
                    console.debug('[free-academic-search] arXiv fallback failed:', inner);
                }
            }
            // Unpaywall: legal open-access copy (default on). It is skipped entirely
            // when disabled, and a failed lookup just falls through to the next layer.
            if (enabled(config.unpaywall)) {
                try {
                    const pdf = await downloadUnpaywallPdf(doi, { email: config.unpaywallEmail, signal });
                    if (pdf !== undefined) {
                        return { ...pdf, identifier: doi, source: 'unpaywall', note: 'via Unpaywall legal open-access' };
                    }
                }
                catch (inner) {
                    // A user abort mid-chain must propagate as AbortError, never be
                    // swallowed into a graceful-degradation console.debug.
                    if (inner instanceof DOMException && inner.name === 'AbortError')
                        throw inner;
                    // Graceful degradation: record the swallowed cause for debugging.
                    console.debug('[free-academic-search] Unpaywall fallback failed:', inner);
                }
            }
            // Sci-Hub mirrors: strictly opt-in. `config.scihub` defaults to false and
            // this layer is only reached when the user explicitly enabled it, so a
            // default config never touches Sci-Hub.
            if (config.scihub === true) {
                try {
                    const pdf = await downloadSciHubPdf(doi, { signal });
                    if (pdf !== undefined) {
                        return { ...pdf, identifier: doi, source: 'scihub', note: 'via Sci-Hub (EXPERIMENTAL, may be illegal in your jurisdiction)' };
                    }
                }
                catch (inner) {
                    // A user abort mid-chain must propagate as AbortError, never be
                    // swallowed into a graceful-degradation console.debug.
                    if (inner instanceof DOMException && inner.name === 'AbortError')
                        throw inner;
                    // Graceful degradation: record the swallowed cause for debugging.
                    console.debug('[free-academic-search] Sci-Hub fallback failed:', inner);
                }
            }
        }
        throw err;
    }
}
/**
 * One-line usage for each of the 25 `free_*` tools, in registration order.
 * Shown by `/free-academic help`; kept in sync with the tools registered in
 * `apply` below.
 */
const TOOL_USAGE = [
    ['free_search_arxiv', 'Search arXiv preprints by keywords or field syntax (ti:, au:, abs:, cat:).'],
    ['free_download_arxiv', 'Get the abstract page and PDF URL for an arXiv id.'],
    ['free_read_arxiv_paper', 'Download an arXiv paper and return its extracted full text.'],
    ['free_search_semantic', 'Search Semantic Scholar (200M+ papers, all fields).'],
    ['free_search_semantic_paper_match', 'Resolve a paper title to its Semantic Scholar record.'],
    ['free_get_semantic_paper', 'Fetch one paper metadata and abstract by identifier.'],
    ['free_get_semantic_paper_batch', 'Fetch many papers metadata in one call (up to 200 ids).'],
    ['free_get_semantic_citations', 'List papers citing a given paper (with citation contexts).'],
    ['free_get_semantic_references', 'List the reference list of a given paper.'],
    ['free_get_semantic_author', 'Get one Semantic Scholar author profile (h-index, affiliations).'],
    ['free_get_semantic_author_papers', 'List an author\'s papers, newest first, with citation counts.'],
    ['free_get_semantic_recommendations', 'Recommend papers similar to seed paper(s).'],
    ['free_search_pubmed', 'Search biomedical literature on PubMed.'],
    ['free_get_pubmed_paper_detail', 'Get metadata and the full abstract of one PubMed paper.'],
    ['free_get_pubmed_paper_batch', 'Get metadata for many PubMed papers (up to 200 PMIDs).'],
    ['free_get_pubmed_related', 'Get PubMed papers related to a given paper.'],
    ['free_search_biorxiv', 'List recent bioRxiv preprints by subject category.'],
    ['free_download_biorxiv', 'Download a bioRxiv preprint PDF by DOI.'],
    ['free_read_biorxiv_paper', 'Download a bioRxiv preprint and return its extracted full text.'],
    ['free_search_medrxiv', 'List recent medRxiv preprints by subject category.'],
    ['free_download_medrxiv', 'Download a medRxiv preprint PDF by DOI.'],
    ['free_read_medrxiv_paper', 'Download a medRxiv preprint and return its extracted full text.'],
    ['free_download_by_doi', 'Resolve a DOI and try to obtain the article PDF (open access anywhere; paywalled needs institutional access).'],
    ['free_read_by_doi', 'Resolve a DOI, download the PDF, and return its extracted full text.'],
    ['free_search_papers', 'Search several platforms in one call and merge/dedupe the results.'],
];
/** `/free-academic help` (or no input): the subcommand usage + all 25 tools. */
function renderCommandHelp() {
    return [
        '/free-academic — free academic search & download (no API key, no credits)',
        '',
        'Subcommands:',
        '  /free-academic search <query> [--n N] [--year YYYY-YYYY]   search top papers (Semantic Scholar + arXiv)',
        '  /free-academic help                                        show this list',
        '  /free-academic status                                      show config toggles',
        '',
        'All 25 free_* tools:',
        ...TOOL_USAGE.map(([name, usage]) => `  ${name} — ${usage}`),
    ].join('\n');
}
/** `/free-academic status`: every config toggle plus the Unpaywall email. */
function renderCommandStatus(config) {
    const toggles = [
        ['arxiv', enabled(config.arxiv) ? 'on' : 'off'],
        ['semanticScholar', enabled(config.semanticScholar) ? 'on' : 'off'],
        ['pubmed', enabled(config.pubmed) ? 'on' : 'off'],
        ['biorxiv', enabled(config.biorxiv) ? 'on' : 'off'],
        ['medrxiv', enabled(config.medrxiv) ? 'on' : 'off'],
        ['doi', enabled(config.doi) ? 'on' : 'off'],
        ['unified', enabled(config.unified) ? 'on' : 'off'],
        ['unpaywall', enabled(config.unpaywall) ? 'on' : 'off'],
        ['scihub', enabled(config.scihub) ? 'on' : 'off'],
        ['command', enabled(config.command) ? 'on' : 'off'],
    ];
    return [
        '/free-academic status',
        '',
        ...toggles.map(([key, value]) => `  ${key}: ${value}`),
        `  unpaywallEmail: ${config.unpaywallEmail}`,
        '',
        'Every free_* tool and this command run free: no API key, no credits.',
    ].join('\n');
}
/** Parse the optional `--n N` (clamped 1-20) / `--year YYYY-YYYY` flags out of a search query. */
function parseSearchFlags(query) {
    let maxResults;
    let yearFrom;
    let yearTo;
    const nMatch = /(?:^|\s)--n\s+(\d+)/u.exec(query);
    if (nMatch !== null)
        maxResults = Math.min(20, Math.max(1, Number(nMatch[1])));
    const yearMatch = /(?:^|\s)--year\s+(\d{4})-(\d{4})/u.exec(query);
    if (yearMatch !== null) {
        yearFrom = Number(yearMatch[1]);
        yearTo = Number(yearMatch[2]);
    }
    return { maxResults, yearFrom, yearTo };
}
/** Strip the `--n` / `--year` flags so only the bare query reaches the search. */
function stripSearchFlags(query) {
    return query.replace(/(?:^|\s)--n\s+\d+/gu, '').replace(/(?:^|\s)--year\s+\d{4}-\d{4}/gu, '').trim();
}
/** Format the merged papers returned by `searchPapers` as a plain-text card. */
function renderCommandResults(query, papers) {
    if (papers.length === 0) {
        return `/free-academic search "${query}" — no results found on Semantic Scholar or arXiv.`;
    }
    return [
        `/free-academic search "${query}" — ${papers.length} result(s) (Semantic Scholar + arXiv):`,
        '',
        ...papers.map((paper, index) => {
            const identity = paper.doi !== undefined
                ? `DOI: ${paper.doi}`
                : paper.arxivId !== undefined
                    ? `arXiv: ${paper.arxivId}`
                    : paper.url ?? paper.id;
            const year = paper.year !== undefined ? ` · ${paper.year}` : '';
            const citations = paper.citationCount !== undefined ? ` · ${paper.citationCount} citations` : '';
            return `  ${index + 1}. ${paper.title} (${SOURCE_LABEL[paper.source] ?? paper.source}${year}${citations})\n     ${identity}`;
        }),
    ].join('\n');
}
/**
 * Register the enabled tools. Each registration is an effect on `ctx`, so
 * disposing the plugin fiber removes the tools together.
 * @param ctx - plugin context with the `tools` service ready.
 * @param config - schemastery-validated config with defaults applied.
 */
export function apply(ctx, config) {
    if (enabled(config.arxiv)) {
        ctx.tools.register(defineTool({
            name: 'free_search_arxiv',
            description: 'Search arXiv preprints (physics, mathematics, computer science, quantitative biology, statistics, and more). Free; no API key needed. Returns title, authors, abstract, arXiv id, categories, and PDF link. Supports the arXiv query syntax (e.g. ti:"graph neural network" AND cat:cs.LG) and date filtering.',
            parameters: {
                query: { type: 'string', required: true, description: 'Search query; plain keywords or arXiv field syntax (ti:, au:, abs:, cat:).' },
                max_results: { type: 'integer', description: 'Number of results (default 10, max 100).' },
                offset: { type: 'integer', description: 'Pagination offset (default 0). Use the returned nextOffset to fetch the next page.' },
                sort_by: { type: 'string', enum: ['relevance', 'lastUpdatedDate', 'submittedDate'], description: 'Sort order (default relevance).' },
                date_from: { type: 'string', description: 'Only papers submitted on or after this date, YYYY-MM-DD.' },
            },
            output: {
                schema: PAPER_LIST_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperList('arXiv', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `arXiv: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                const page = await searchArxiv({
                    query: args.query,
                    maxResults: args.max_results,
                    offset: args.offset,
                    sortBy: args.sort_by,
                    dateFrom: args.date_from,
                    signal: exec.signal,
                });
                return {
                    source: 'arxiv',
                    query: args.query,
                    total: page.total,
                    papers: page.papers,
                    truncated: page.nextOffset !== undefined,
                    ...(page.nextOffset !== undefined ? { nextOffset: page.nextOffset } : {}),
                };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_download_arxiv',
            description: 'Get the abstract page and direct PDF URL for an arXiv paper by id. Free; no API key needed.',
            parameters: {
                paper_id: { type: 'string', required: true, description: 'arXiv identifier, e.g. "2106.12345" or "hep-th/9901001".' },
            },
            output: {
                schema: DOWNLOAD_ARXIV_OUTPUT_SCHEMA,
                render: (_args, value) => [{ type: 'text', text: `arXiv:${value.id}\nAbstract page: ${value.url}\nPDF: ${value.pdfUrl}` }],
            },
            timeoutMs: DOWNLOAD_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `arXiv: ${args.paper_id}`, kind: 'fetch', rawInput: args.paper_id }),
            async execute(args) {
                const id = normalizeArxivId(args.paper_id);
                return { id, url: `https://arxiv.org/abs/${id}`, pdfUrl: arxivPdfUrl(id) };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_read_arxiv_paper',
            description: "Download an arXiv paper's PDF and return its extracted full text. Free; no API key needed. Long papers are returned in slices: use offset/max_chars to continue (default slice 60000 characters).",
            parameters: {
                paper_id: { type: 'string', required: true, description: 'arXiv identifier, e.g. "2106.12345".' },
                offset: { type: 'integer', description: 'Character offset to start from (default 0).' },
                max_chars: { type: 'integer', description: 'Characters to return (default 60000).' },
            },
            output: {
                schema: READ_OUTPUT_SCHEMA,
                render: (_args, value) => renderRead(value),
            },
            timeoutMs: READ_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Read arXiv: ${args.paper_id}`, kind: 'read', rawInput: args.paper_id }),
            async execute(args, exec) {
                const id = normalizeArxivId(args.paper_id);
                const pdf = await fetchBinary(arxivPdfUrl(id), { signal: exec.signal });
                if (!pdf.ok)
                    throw new Error(`arXiv PDF download failed: ${pdf.error}`);
                const { text, pages } = await extractPdfText(pdf.data);
                if (text.trim().length === 0)
                    throw new Error('the PDF downloaded but no readable text could be extracted (scanned or image-only PDF)');
                return { id, pdfUrl: pdf.finalUrl, pages, source: 'arxiv', ...sliceReadValue(text, args.offset, args.max_chars) };
            },
        }));
    }
    if (enabled(config.semanticScholar)) {
        ctx.tools.register(defineTool({
            name: 'free_search_semantic',
            description: 'Search academic papers on Semantic Scholar (200M+ papers, all fields). Free; no API key needed. Returns title, authors, year, venue, citation count, identifiers, and abstract. Use sort_by=citationCount to rank results by descending citation count (default relevance keeps Semantic Scholar order).',
            parameters: {
                query: { type: 'string', required: true, description: 'Search query, e.g. "graph neural networks drug discovery".' },
                max_results: { type: 'integer', description: 'Number of results to return (default 10, max 100).' },
                sort_by: { type: 'string', enum: ['relevance', 'citationCount'], description: 'Sort order (default relevance). Set to citationCount to rank by descending citation count.' },
            },
            output: {
                schema: PAPER_LIST_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperList('Semantic Scholar', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Semantic Scholar: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                const papers = await searchSemanticScholar({ query: args.query, maxResults: args.max_results, signal: exec.signal });
                if (args.sort_by === 'citationCount') {
                    papers.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0));
                }
                return { source: 'semantic-scholar', query: args.query, total: papers.length, papers, truncated: false };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_search_semantic_paper_match',
            description: 'Resolve a paper title to its Semantic Scholar record (best title matches, returns candidates). Free; no API key needed.',
            parameters: {
                title: { type: 'string', required: true, description: 'The paper title, e.g. "Attention Is All You Need".' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperArray('Semantic Scholar', 'Best title matches:', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Match: ${args.title}`, kind: 'search', rawInput: args.title }),
            async execute(args, exec) {
                return searchSemanticPaperMatch(args.title, exec.signal);
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_paper',
            description: 'Get metadata and the full abstract of one Semantic Scholar paper by identifier (S2 paperId, DOI:, ARXIV:, PMID:, or URL: prefixed). Free; no API key needed.',
            parameters: {
                paper_id: { type: 'string', required: true, description: 'Paper identifier (S2 paperId, or DOI:, ARXIV:, PMID:, URL: prefixed).' },
            },
            output: {
                schema: PAPER_OBJECT_SCHEMA,
                render: (_args, value) => renderPaperSingle('Semantic Scholar', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `S2 paper: ${args.paper_id}`, kind: 'fetch', rawInput: args.paper_id }),
            async execute(args, exec) {
                return getSemanticPaper(args.paper_id, exec.signal);
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_paper_batch',
            description: 'Get metadata for many Semantic Scholar papers in one call (up to 200 ids). Accepts paperIds or prefixed ids (DOI:, ARXIV:, PMID:, CorpusId:). Ids the platform cannot resolve are skipped. Free; no API key needed.',
            parameters: {
                ids: { type: 'array', items: { type: 'string' }, required: true, description: 'Paper identifiers (paperId, or DOI:..., ARXIV:..., PMID:..., CorpusId:...).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('Semantic Scholar', `Lookup results for ${args.ids.length} id(s):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `S2 batch (${args.ids.length})`, kind: 'fetch', rawInput: args.ids.join(', ') }),
            async execute(args, exec) {
                return getSemanticPaperBatch(args.ids, exec.signal);
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_citations',
            description: 'Get papers that cite the given paper from the Semantic Scholar citation graph, with citation contexts and intents when available. Free; no API key needed.',
            parameters: {
                paper_id: { type: 'string', required: true, description: 'Paper identifier (paperId, DOI:, ARXIV:, PMID:, CorpusId:).' },
                limit: { type: 'integer', description: 'Number of results (default 20, max 100).' },
                offset: { type: 'integer', description: 'Pagination offset (default 0).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('Semantic Scholar', `Papers citing ${args.paper_id} (showing ${value.length}):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Citations of ${args.paper_id}`, kind: 'fetch', rawInput: args.paper_id }),
            async execute(args, exec) {
                return getSemanticPaperCitations(args.paper_id, { limit: args.limit, offset: args.offset, signal: exec.signal });
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_references',
            description: 'Get papers the given paper cites (its reference list) from the Semantic Scholar citation graph, with citation contexts and intents when available. Free; no API key needed.',
            parameters: {
                paper_id: { type: 'string', required: true, description: 'Paper identifier (paperId, DOI:, ARXIV:, PMID:, CorpusId:).' },
                limit: { type: 'integer', description: 'Number of results (default 20, max 100).' },
                offset: { type: 'integer', description: 'Pagination offset (default 0).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('Semantic Scholar', `References of ${args.paper_id} (showing ${value.length}):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `References of ${args.paper_id}`, kind: 'fetch', rawInput: args.paper_id }),
            async execute(args, exec) {
                return getSemanticPaperReferences(args.paper_id, { limit: args.limit, offset: args.offset, signal: exec.signal });
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_author',
            description: 'Get one Semantic Scholar author profile by author id: name, affiliations, h-index, paper and citation counts, and profile URL. Free; no API key needed.',
            parameters: {
                author_id: { type: 'string', required: true, description: 'Semantic Scholar author id, e.g. "1741101".' },
            },
            output: {
                schema: AUTHOR_OUTPUT_SCHEMA,
                render: (_args, value) => renderAuthor(value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Author: ${args.author_id}`, kind: 'fetch', rawInput: args.author_id }),
            async execute(args, exec) {
                const raw = await getSemanticAuthor(args.author_id, exec.signal);
                return {
                    ...(typeof raw.authorId === 'string' ? { authorId: raw.authorId } : {}),
                    ...(typeof raw.name === 'string' ? { name: raw.name } : {}),
                    ...(typeof raw.hIndex === 'number' ? { hIndex: raw.hIndex } : {}),
                    ...(Array.isArray(raw.affiliations)
                        ? { affiliations: raw.affiliations.filter((a) => typeof a === 'string') }
                        : {}),
                    ...(typeof raw.paperCount === 'number' ? { paperCount: raw.paperCount } : {}),
                    ...(typeof raw.citationCount === 'number' ? { citationCount: raw.citationCount } : {}),
                    ...(typeof raw.url === 'string' ? { url: raw.url } : {}),
                };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_author_papers',
            description: "List a Semantic Scholar author's papers by author id, newest first, with citation counts. Supports offset pagination. Free; no API key needed.",
            parameters: {
                author_id: { type: 'string', required: true, description: 'Semantic Scholar author id, e.g. "1741101".' },
                limit: { type: 'integer', description: 'Number of results (default 20, max 100).' },
                offset: { type: 'integer', description: 'Pagination offset (default 0).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('Semantic Scholar', `Papers by author ${args.author_id} (showing ${value.length}):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Papers by ${args.author_id}`, kind: 'fetch', rawInput: args.author_id }),
            async execute(args, exec) {
                return getSemanticAuthorPapers(args.author_id, { limit: args.limit, offset: args.offset, signal: exec.signal });
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_semantic_recommendations',
            description: 'Recommend papers similar to one Semantic Scholar paper (recommendation model). Free; no API key needed. The upstream recommendations endpoint is intermittently unstable and may fail — retry later if so.',
            parameters: {
                paper_id: { type: 'string', required: true, description: 'Seed paper identifier (paperId, DOI:, ARXIV:, PMID:, CorpusId:).' },
                limit: { type: 'integer', description: 'Number of results (default 10, max 20).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('Semantic Scholar', `Recommended papers similar to ${args.paper_id}:`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Recommendations for ${args.paper_id}`, kind: 'fetch', rawInput: args.paper_id }),
            async execute(args, exec) {
                try {
                    return await getSemanticPaperRecommendations(args.paper_id, { limit: args.limit, signal: exec.signal });
                }
                catch (err) {
                    if (err instanceof Error && err.name === 'AbortError')
                        throw err;
                    throw new Error(`Semantic Scholar recommendations are temporarily unavailable: the upstream endpoint is unstable and intermittently returns errors. Please retry later. Original error: ${err instanceof Error ? err.message : String(err)}`);
                }
            },
        }));
    }
    if (enabled(config.pubmed)) {
        ctx.tools.register(defineTool({
            name: 'free_search_pubmed',
            description: 'Search biomedical and life-science literature on PubMed. Free; no API key needed. Returns title, authors, journal, publication date, PMID, DOI, and abstract.',
            parameters: {
                query: { type: 'string', required: true, description: 'PubMed query; field tags such as [Title/Abstract] and boolean operators are supported.' },
                max_results: { type: 'integer', description: 'Number of results to return (default 10, max 100).' },
            },
            output: {
                schema: PAPER_LIST_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperList('PubMed', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `PubMed: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                const papers = await searchPubmed({ query: args.query, maxResults: args.max_results, signal: exec.signal });
                return { source: 'pubmed', query: args.query, total: papers.length, papers, truncated: false };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_pubmed_paper_detail',
            description: 'Get metadata and the full abstract of one PubMed paper by PMID. Returns found:false with a message when the PMID has no record (no error). Free; no API key needed.',
            parameters: {
                pmid: { type: 'string', required: true, description: 'PubMed identifier, e.g. "39575807".' },
            },
            output: {
                schema: PUBMED_DETAIL_OUTPUT_SCHEMA,
                render: (_args, value) => value.found && value.paper !== undefined
                    ? renderPaperSingle('PubMed', value.paper)
                    : [{ type: 'text', text: value.message ?? `No PubMed record found for the given PMID.` }],
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `PubMed: ${args.pmid}`, kind: 'fetch', rawInput: args.pmid }),
            async execute(args, exec) {
                const paper = await getPubmedPaperDetail(args.pmid, exec.signal);
                if (!paper)
                    return { found: false, message: `No PubMed record found for PMID ${args.pmid}.` };
                return { found: true, paper };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_pubmed_paper_batch',
            description: 'Get metadata for many PubMed papers in one call by PMID (up to 200 ids). Free; no API key needed.',
            parameters: {
                pmids: { type: 'array', items: { type: 'string' }, required: true, description: 'PubMed identifiers, e.g. ["39575807", "30102808"].' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('PubMed', `Records for ${args.pmids.length} PMID(s) (${value.length} found):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `PubMed batch (${args.pmids.length})`, kind: 'fetch', rawInput: args.pmids.join(', ') }),
            async execute(args, exec) {
                return getPubmedPaperBatch(args.pmids, exec.signal);
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_get_pubmed_related',
            description: 'Get PubMed papers related to the given paper (PubMed similar-articles ranking), by PMID. Free; no API key needed.',
            parameters: {
                pmid: { type: 'string', required: true, description: 'PubMed identifier, e.g. "39575807".' },
                max_results: { type: 'integer', description: 'Number of results (default 10).' },
            },
            output: {
                schema: PAPER_ARRAY_OUTPUT_SCHEMA,
                render: (args, value) => renderPaperArray('PubMed', `Papers related to PMID ${args.pmid} (showing ${value.length}):`, value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Related to ${args.pmid}`, kind: 'fetch', rawInput: args.pmid }),
            async execute(args, exec) {
                return getPubmedRelated(args.pmid, { maxResults: args.max_results, signal: exec.signal });
            },
        }));
    }
    if (enabled(config.biorxiv)) {
        ctx.tools.register(defineTool({
            name: 'free_search_biorxiv',
            description: 'List recent bioRxiv preprints in a subject category within a look-back window (the bioRxiv API browses by category and date, not by free text — filter the returned titles/abstracts for the topic). Free; no API key needed.',
            parameters: {
                query: { type: 'string', required: true, description: 'bioRxiv category, e.g. "neuroscience", "cell biology", "bioinformatics", "genomics".' },
                max_results: { type: 'integer', description: 'Number of results (default 10, max 100).' },
            },
            output: {
                schema: PAPER_LIST_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperList('bioRxiv', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `bioRxiv: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                const papers = await searchRxiv({ query: args.query, server: 'biorxiv', maxResults: args.max_results, signal: exec.signal });
                return { source: 'biorxiv', query: args.query, total: papers.length, papers, truncated: false };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_download_biorxiv',
            description: 'Download a bioRxiv preprint PDF by DOI and return download metadata (final URL, content type, byte size) — not the raw bytes. Free; no API key needed.',
            parameters: {
                doi: { type: 'string', required: true, description: 'bioRxiv DOI, e.g. "10.1101/2024.01.01.123456".' },
            },
            output: {
                schema: RXIV_DOWNLOAD_OUTPUT_SCHEMA,
                render: (_args, value) => [{ type: 'text', text: `bioRxiv ${value.doi} downloaded (${(value.size / 1024).toFixed(0)} KB).\nPDF: ${value.finalUrl}` }],
            },
            timeoutMs: DOWNLOAD_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Download bioRxiv ${args.doi}`, kind: 'fetch', rawInput: args.doi }),
            async execute(args, exec) {
                const doi = normalizeDoi(args.doi);
                const pdf = await downloadPdfByDoi(doi, { signal: exec.signal });
                return { doi, finalUrl: pdf.finalUrl, contentType: pdf.contentType, size: pdf.bytes.length, source: 'biorxiv' };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_read_biorxiv_paper',
            description: "Download a bioRxiv preprint's PDF by DOI and return its extracted full text in slices: use offset/max_chars to continue (default slice 60000 characters). Free; no API key needed.",
            parameters: {
                doi: { type: 'string', required: true, description: 'bioRxiv DOI, e.g. "10.1101/2024.01.01.123456".' },
                offset: { type: 'integer', description: 'Character offset to start from (default 0).' },
                max_chars: { type: 'integer', description: 'Characters to return (default 60000).' },
            },
            output: {
                schema: RXIV_READ_OUTPUT_SCHEMA,
                render: (_args, value) => renderRxivRead(value),
            },
            timeoutMs: READ_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Read bioRxiv: ${args.doi}`, kind: 'read', rawInput: args.doi }),
            async execute(args, exec) {
                const doi = normalizeDoi(args.doi);
                const pdf = await downloadPdfByDoi(doi, { signal: exec.signal });
                const { text, pages } = await extractPdfText(pdf.bytes);
                if (text.trim().length === 0)
                    throw new Error('the PDF downloaded but no readable text could be extracted (scanned or image-only PDF)');
                const slice = sliceText(text, args.offset ?? 0, args.max_chars ?? DEFAULT_MAX_CHARS);
                return { doi, text: slice.text, offset: slice.offset - slice.text.length, hasMore: slice.hasMore, totalPages: pages, source: 'biorxiv' };
            },
        }));
    }
    if (enabled(config.medrxiv)) {
        ctx.tools.register(defineTool({
            name: 'free_search_medrxiv',
            description: 'List recent medRxiv preprints in a subject category within a look-back window (the medRxiv API browses by category and date, not by free text — filter the returned titles/abstracts for the topic). Free; no API key needed.',
            parameters: {
                query: { type: 'string', required: true, description: 'medRxiv category, e.g. "epidemiology", "oncology", "cardiovascular medicine", "public and global health".' },
                max_results: { type: 'integer', description: 'Number of results (default 10, max 100).' },
            },
            output: {
                schema: PAPER_LIST_OUTPUT_SCHEMA,
                render: (_args, value) => renderPaperList('medRxiv', value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `medRxiv: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                const papers = await searchRxiv({ query: args.query, server: 'medrxiv', maxResults: args.max_results, signal: exec.signal });
                return { source: 'medrxiv', query: args.query, total: papers.length, papers, truncated: false };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_download_medrxiv',
            description: 'Download a medRxiv preprint PDF by DOI and return download metadata (final URL, content type, byte size) — not the raw bytes. Free; no API key needed.',
            parameters: {
                doi: { type: 'string', required: true, description: 'medRxiv DOI, e.g. "10.1101/2024.01.01.123456".' },
            },
            output: {
                schema: RXIV_DOWNLOAD_OUTPUT_SCHEMA,
                render: (_args, value) => [{ type: 'text', text: `medRxiv ${value.doi} downloaded (${(value.size / 1024).toFixed(0)} KB).\nPDF: ${value.finalUrl}` }],
            },
            timeoutMs: DOWNLOAD_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Download medRxiv ${args.doi}`, kind: 'fetch', rawInput: args.doi }),
            async execute(args, exec) {
                const doi = normalizeDoi(args.doi);
                const pdf = await downloadPdfByDoi(doi, { signal: exec.signal });
                return { doi, finalUrl: pdf.finalUrl, contentType: pdf.contentType, size: pdf.bytes.length, source: 'medrxiv' };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_read_medrxiv_paper',
            description: "Download a medRxiv preprint's PDF by DOI and return its extracted full text in slices: use offset/max_chars to continue (default slice 60000 characters). Free; no API key needed.",
            parameters: {
                doi: { type: 'string', required: true, description: 'medRxiv DOI, e.g. "10.1101/2024.01.01.123456".' },
                offset: { type: 'integer', description: 'Character offset to start from (default 0).' },
                max_chars: { type: 'integer', description: 'Characters to return (default 60000).' },
            },
            output: {
                schema: RXIV_READ_OUTPUT_SCHEMA,
                render: (_args, value) => renderRxivRead(value),
            },
            timeoutMs: READ_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Read medRxiv: ${args.doi}`, kind: 'read', rawInput: args.doi }),
            async execute(args, exec) {
                const doi = normalizeDoi(args.doi);
                const pdf = await downloadPdfByDoi(doi, { signal: exec.signal });
                const { text, pages } = await extractPdfText(pdf.bytes);
                if (text.trim().length === 0)
                    throw new Error('the PDF downloaded but no readable text could be extracted (scanned or image-only PDF)');
                const slice = sliceText(text, args.offset ?? 0, args.max_chars ?? DEFAULT_MAX_CHARS);
                return { doi, text: slice.text, offset: slice.offset - slice.text.length, hasMore: slice.hasMore, totalPages: pages, source: 'medrxiv' };
            },
        }));
    }
    if (enabled(config.doi)) {
        ctx.tools.register(defineTool({
            name: 'free_download_by_doi',
            description: 'Resolve a DOI (or arXiv id) and try to obtain the article PDF: open-access copies work anywhere; paywalled publishers work only when dsh runs on a network with institutional access (campus/VPN). A plain arXiv id (or a 10.48550/arXiv.* DOI) downloads the free arXiv preprint directly; a paywalled DOI falls back to its arXiv preprint automatically (embedded id or Semantic Scholar reverse-lookup), then to a legal Unpaywall open-access copy, and finally — only when scihub is enabled in the plugin config — to Sci-Hub mirrors (EXPERIMENTAL, may be illegal in your jurisdiction). Returns the PDF URL that answered. Free; no API key needed.',
            parameters: {
                doi: { type: 'string', required: true, description: 'DOI or arXiv id, e.g. "10.1038/s41586-021-03819-2", "10.48550/arXiv.2301.11313", or "2301.11313".' },
            },
            output: {
                schema: DOWNLOAD_DOI_OUTPUT_SCHEMA,
                render: (_args, value) => {
                    const label = value.source === 'arxiv' ? 'arXiv preprint' : value.source === 'unpaywall' ? 'Unpaywall open-access copy' : value.source === 'scihub' ? 'Sci-Hub copy' : 'DOI';
                    return [{ type: 'text', text: `Resolved ${label} ${value.doi} (${(value.bytes / 1024).toFixed(0)} KB).\nPDF: ${value.pdfUrl}${value.note !== undefined ? `\nNote: ${value.note}.` : ''}` }];
                },
            },
            timeoutMs: DOWNLOAD_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Resolve DOI ${args.doi}`, kind: 'fetch', rawInput: args.doi }),
            async execute(args, exec) {
                const { bytes, finalUrl, contentType, identifier, source, note } = await downloadWithFallback(args.doi, { signal: exec.signal, config });
                return {
                    doi: identifier,
                    pdfUrl: finalUrl,
                    contentType,
                    bytes: bytes.length,
                    source,
                    ...(note !== undefined ? { note } : {}),
                };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'free_read_by_doi',
            description: 'Resolve a DOI (or arXiv id), download the PDF, and return its extracted full text in slices. Open-access copies work anywhere; a paywalled DOI falls back to its arXiv preprint automatically (embedded id or Semantic Scholar reverse-lookup), then to a legal Unpaywall open-access copy, and finally — only when scihub is enabled in the plugin config — to Sci-Hub mirrors (EXPERIMENTAL, may be illegal in your jurisdiction). Use offset/max_chars to continue (default slice 60000 characters). Free; no API key needed.',
            parameters: {
                doi: { type: 'string', required: true, description: 'DOI or arXiv id, e.g. "10.1038/s41586-021-03819-2", "10.48550/arXiv.2301.11313", or "2301.11313".' },
                offset: { type: 'integer', description: 'Character offset to start from (default 0).' },
                max_chars: { type: 'integer', description: 'Characters to return (default 60000).' },
            },
            output: {
                schema: READ_OUTPUT_SCHEMA,
                render: (_args, value) => renderRead(value),
            },
            timeoutMs: READ_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Read DOI: ${args.doi}`, kind: 'read', rawInput: args.doi }),
            async execute(args, exec) {
                const { bytes, finalUrl, identifier, source, note } = await downloadWithFallback(args.doi, { signal: exec.signal, config });
                const { text, pages } = await extractPdfText(bytes);
                if (text.trim().length === 0)
                    throw new Error('the PDF downloaded but no readable text could be extracted (scanned or image-only PDF)');
                return {
                    id: identifier,
                    pdfUrl: finalUrl,
                    pages,
                    source,
                    ...(note !== undefined ? { note } : {}),
                    ...sliceReadValue(text, args.offset, args.max_chars),
                };
            },
        }));
    }
    if (enabled(config.unified)) {
        ctx.tools.register(defineTool({
            name: 'free_search_papers',
            description: 'Search several platforms in one call and merge the results: duplicates are collapsed by DOI / arXiv id / PMID / title, papers found on more than one platform rank first, then by citation count. Free; no API key needed. For a plain topic search this call REPLACES the per-platform search tools; add extra platforms via sources instead.',
            parameters: {
                query: { type: 'string', required: true, description: 'Topic or keywords; sent to every selected platform as-is.' },
                sources: {
                    type: 'array',
                    items: { type: 'string', enum: ['arxiv', 'semantic-scholar', 'pubmed', 'biorxiv', 'medrxiv'] },
                    description: 'Platforms to query (default ["arxiv","semantic-scholar","pubmed"]).',
                },
                max_results: { type: 'integer', description: 'Maximum number of merged results (default 10, max 50).' },
                year_from: { type: 'integer', description: 'Earliest publication year.' },
                year_to: { type: 'integer', description: 'Latest publication year.' },
            },
            output: {
                schema: UNIFIED_OUTPUT_SCHEMA,
                render: (_args, value) => renderUnifiedSearch(value),
            },
            timeoutMs: SEARCH_TIMEOUT_MS,
            isConcurrencySafe: () => true,
            presentCall: (args) => ({ card: 'generic', title: `Papers: ${args.query}`, kind: 'search', rawInput: args.query }),
            async execute(args, exec) {
                if (args.year_from !== undefined && args.year_to !== undefined && args.year_from > args.year_to) {
                    throw new Error('year_from must not be later than year_to');
                }
                const sources = args.sources !== undefined && args.sources.length > 0
                    ? args.sources
                    : ['arxiv', 'semantic-scholar', 'pubmed'];
                const papers = await searchPapers({
                    query: args.query,
                    sources,
                    maxResults: args.max_results,
                    yearFrom: args.year_from,
                    yearTo: args.year_to,
                    signal: exec.signal,
                });
                return { query: args.query, sources, total: papers.length, papers, truncated: false };
            },
        }));
    }
    // The `/free-academic` slash command is optional: `commands` may not exist
    // under headless, so it is lazy-injected only when the service is present.
    if (enabled(config.command)) {
        ctx.inject(['commands'], (commandCtx) => {
            const commands = commandCtx.commands;
            commands.register({
                name: 'free-academic',
                description: 'Free Academic Search: search papers, list the free_* tools, or show config status (e.g. /free-academic search distributed optimization)',
                input: { hint: 'search <query> | help | status' },
                handler: async (invocation) => {
                    const input = invocation.rawInput.trim();
                    // Empty or `help`: the usage list of all 25 free_* tools.
                    if (input.length === 0 || /^help(?:\s|$)/u.test(input)) {
                        return { kind: 'success', text: renderCommandHelp() };
                    }
                    if (input === 'status') {
                        return { kind: 'success', text: renderCommandStatus(config) };
                    }
                    const searchMatch = /^search\s+(.+)$/u.exec(input);
                    if (searchMatch !== null) {
                        const query = stripSearchFlags(searchMatch[1]);
                        const { maxResults, yearFrom, yearTo } = parseSearchFlags(searchMatch[1]);
                        try {
                            const papers = await searchPapers({
                                query,
                                sources: ['semantic-scholar', 'arxiv'],
                                maxResults,
                                yearFrom,
                                yearTo,
                                signal: invocation.signal,
                            });
                            return { kind: 'success', text: renderCommandResults(query, papers) };
                        }
                        catch (err) {
                            return { kind: 'error', text: err instanceof Error ? err.message : String(err) };
                        }
                    }
                    return { kind: 'error', text: `Unknown subcommand "${input}". Run /free-academic help` };
                },
            });
        });
    }
}
//# sourceMappingURL=index.js.map