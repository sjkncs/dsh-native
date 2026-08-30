export type Source = 'semantic-scholar' | 'pubmed' | 'arxiv' | 'biorxiv' | 'medrxiv' | 'doi';
export interface Paper {
    id: string;
    title: string;
    authors: string[];
    source: Source;
    year?: number;
    date?: string;
    venue?: string;
    citationCount?: number;
    doi?: string;
    pmid?: string;
    arxivId?: string;
    url?: string;
    pdfUrl?: string;
    openAccessPdf?: string;
    abstract?: string;
    externalIds?: Record<string, string>;
    categories?: string[];
}
export declare function compact<T extends Record<string, unknown>>(obj: T): T;
export declare function normalizeTitle(title: string): string;
export declare function identityKeys(p: Paper): string[];
