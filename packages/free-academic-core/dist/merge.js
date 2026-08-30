import { identityKeys } from './schema.js';
/**
 * Ranking priority for papers tied on hits and citations. Sources with richer
 * more authoritative metadata rank first; domain-specific biomedical sources
 * (pubmed/biorxiv/medrxiv) rank later so they cannot crowd out Semantic Scholar
 * or arXiv results for the same query.
 */
export const SOURCE_PRIORITY = {
    'semantic-scholar': 0,
    arxiv: 1,
    pubmed: 2,
    biorxiv: 3,
    medrxiv: 4,
    doi: 5,
};
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
export function mergePaperLists(lists) {
    // Dedupe by id first, keeping the best paper when the same id appears twice.
    const papers = new Map();
    for (const list of lists) {
        for (const p of list) {
            const existing = papers.get(p.id);
            if (existing === undefined || better(p, existing))
                papers.set(p.id, p);
        }
    }
    // Union-find: two ids belong to the same group when their papers share an identity key.
    const parent = new Map();
    const find = (x) => {
        let root = parent.get(x) ?? x;
        if (root !== x) {
            parent.set(x, find(root));
            root = parent.get(x) ?? x;
        }
        return root;
    };
    const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb)
            parent.set(ra, rb);
    };
    const keyOwner = new Map();
    for (const [id, p] of papers) {
        for (const key of identityKeys(p)) {
            const owner = keyOwner.get(key);
            if (owner !== undefined)
                union(owner, id);
            else
                keyOwner.set(key, id);
        }
    }
    // Group papers by their root id.
    const groups = new Map();
    for (const [id, p] of papers) {
        const root = find(id);
        const members = groups.get(root);
        if (members)
            members.push(p);
        else
            groups.set(root, [p]);
    }
    // hitCount per group = number of distinct source lists that contained a member.
    const hitCount = new Map();
    for (const list of lists) {
        const roots = new Set();
        for (const p of list)
            roots.add(find(p.id));
        for (const root of roots)
            hitCount.set(root, (hitCount.get(root) ?? 0) + 1);
    }
    const result = [];
    for (const members of groups.values()) {
        result.push(members.reduce((best, p) => (better(p, best) ? p : best)));
    }
    return result.sort((x, y) => (hitCount.get(find(y.id)) ?? 0) - (hitCount.get(find(x.id)) ?? 0)
        || (y.citationCount ?? 0) - (x.citationCount ?? 0)
        || SOURCE_PRIORITY[x.source] - SOURCE_PRIORITY[y.source]
        || x.title.localeCompare(y.title));
}
function better(a, b) {
    return (a.citationCount ?? 0) > (b.citationCount ?? 0)
        || (a.citationCount ?? 0) === (b.citationCount ?? 0) && a.title.length < b.title.length;
}
//# sourceMappingURL=merge.js.map