export interface TextSlice {
    text: string;
    offset: number;
    hasMore: boolean;
}
/** Slice a long text into chunks, reporting where the next slice should start and whether more remains. */
export declare function sliceText(text: string, offset?: number, maxChars?: number): TextSlice;
/**
 * Extract plain text from PDF bytes (pdf-parse v2 class API; works on Uint8Array directly).
 * Whitespace is collapsed and page count returned.
 */
export declare function extractPdfText(bytes: Uint8Array): Promise<{
    text: string;
    pages: number;
}>;
