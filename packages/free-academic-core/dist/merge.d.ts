import type { Paper, Source } from './schema.js';
/**
 * Ranking priority for papers tied on hits and citations. Sources with richer
 * more authoritative metadata rank first; domain-specific biomedical sources
 * (pubmed/biorxiv/medrxiv) rank later so they cannot crowd out Semantic Scholar
 * or arXiv results for the same query.
 */
export declare const SOURCE_PRIORITY: Record<Source, number>;
/**
 * Merge multiple source result lists into a single deduplicated, ranked list.
 *
 * Two papers are considered the same when they share any identity key
 * (doi:/arxiv:/pmid:/title:). Merging is transitive — a group is found by
 * union-find over identity keys — and each group contributes its best member
 * (higher citationCount; on ties, the shorter title). The result is sorted by
 * the number of source lists that contained the group (desc), then by
 * citationCount (desc), then by source priority (asc), then by title (asc).
 */
export declare function mergePaperLists(lists: Paper[][]): Paper[];
