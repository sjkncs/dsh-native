export function compact(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj))
        if (v !== undefined)
            out[k] = v;
    return out;
}
export function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
export function identityKeys(p) {
    const keys = [];
    if (p.doi)
        keys.push(`doi:${p.doi.toLowerCase()}`);
    if (p.arxivId)
        keys.push(`arxiv:${p.arxivId.toLowerCase()}`);
    if (p.pmid)
        keys.push(`pmid:${p.pmid}`);
    if (p.title)
        keys.push(`title:${normalizeTitle(p.title)}`);
    return keys;
}
//# sourceMappingURL=schema.js.map