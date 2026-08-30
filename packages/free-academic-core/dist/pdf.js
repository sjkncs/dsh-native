import { PDFParse } from 'pdf-parse';
/** Slice a long text into chunks, reporting where the next slice should start and whether more remains. */
export function sliceText(text, offset = 0, maxChars = 60000) {
    const start = Math.max(0, Math.trunc(offset));
    const slice = text.slice(start, start + maxChars);
    return { text: slice, offset: start + slice.length, hasMore: start + slice.length < text.length };
}
/**
 * Extract plain text from PDF bytes (pdf-parse v2 class API; works on Uint8Array directly).
 * Whitespace is collapsed and page count returned.
 */
export async function extractPdfText(bytes) {
    const parser = new PDFParse({ data: bytes });
    try {
        const result = await parser.getText();
        const text = result.text.replace(/\s+/g, ' ').trim();
        return { text, pages: result.total };
    }
    finally {
        await parser.destroy();
    }
}
//# sourceMappingURL=pdf.js.map