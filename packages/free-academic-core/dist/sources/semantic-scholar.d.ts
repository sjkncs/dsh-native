import type { Paper } from '../schema.js';
export declare function mapS2Paper(raw: Record<string, unknown>): Paper;
export declare function searchSemanticScholar(opts: {
    query: string;
    maxResults?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
export declare function getSemanticPaper(ref: string, signal?: AbortSignal): Promise<Paper>;
export declare function getSemanticPaperBatch(ids: string[], signal?: AbortSignal): Promise<Paper[]>;
export declare function searchSemanticPaperMatch(title: string, signal?: AbortSignal): Promise<Paper[]>;
export declare function getSemanticPaperCitations(paperId: string, opts?: {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
export declare function getSemanticPaperReferences(paperId: string, opts?: {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
export declare function getSemanticPaperRecommendations(paperId: string, opts?: {
    limit?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
export declare function getSemanticAuthor(authorId: string, signal?: AbortSignal): Promise<Record<string, unknown>>;
export declare function getSemanticAuthorPapers(authorId: string, opts?: {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
}): Promise<Paper[]>;
