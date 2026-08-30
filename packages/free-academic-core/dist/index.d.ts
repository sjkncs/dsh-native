/** free-academic-core — free academic search & download (shared core). */
export declare const VERSION = "0.1.0";
export type { Paper, Source } from './schema.js';
export { compact, normalizeTitle, identityKeys } from './schema.js';
export { mergePaperLists, SOURCE_PRIORITY } from './merge.js';
export { searchPapers } from './search.js';
export { searchArxiv, normalizeArxivId, arxivPdfUrl } from './sources/arxiv.js';
export { searchSemanticScholar, searchSemanticPaperMatch, getSemanticPaper, getSemanticPaperBatch, getSemanticPaperCitations, getSemanticPaperReferences, getSemanticPaperRecommendations, getSemanticAuthor, getSemanticAuthorPapers, } from './sources/semantic-scholar.js';
export { searchPubmed, getPubmedPaperDetail, getPubmedPaperBatch, getPubmedRelated } from './sources/pubmed.js';
export { searchRxiv } from './sources/rxiv.js';
export { normalizeDoi, isPdfPayload, resolveDoi, downloadPdfByDoi, downloadPdfByUrl, lookupDoiMetadata } from './sources/doi.js';
export { lookupUnpaywallOa, downloadUnpaywallPdf } from './sources/unpaywall.js';
export type { UnpaywallOaResult, UnpaywallOaLocation } from './sources/unpaywall.js';
export { SCIHUB_MIRRORS, downloadSciHubPdf } from './sources/sci-hub.js';
export { extractPdfText, sliceText } from './pdf.js';
export { fetchBinary } from './http.js';
