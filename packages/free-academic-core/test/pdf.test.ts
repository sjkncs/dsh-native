import { describe, it, expect } from 'vitest'
import { sliceText, extractPdfText } from '../src/pdf.js'

describe('sliceText', () => {
  it('slices with offset and reports hasMore', () => {
    const text = 'a'.repeat(1000)
    const r = sliceText(text, 0, 400)
    expect(r.text.length).toBe(400)
    expect(r.hasMore).toBe(true)
    expect(r.offset).toBe(400)
  })
  it('returns remainder at end', () => {
    const r = sliceText('hello world', 6)
    expect(r.text).toBe('world')
    expect(r.hasMore).toBe(false)
  })
  it('clamps negative offset and respects maxChars default', () => {
    const text = 'x'.repeat(100)
    const r = sliceText(text, -5, 30)
    expect(r.text.length).toBe(30)
    expect(r.offset).toBe(30)
    expect(r.hasMore).toBe(true)
  })
})

describe('extractPdfText', () => {
  // A tiny, hand-built, valid PDF (single page, "Hello, PDF World!") so the test
  // is deterministic and offline. xref offsets are computed at build time.
  function buildMinimalPdf(text: string): Uint8Array {
    const header = '%PDF-1.4\n'
    const stream = `BT /F1 24 Tf 100 700 Td (${text}) Tj ET`
    const objects: Record<number, string> = {
      1: '<< /Type /Catalog /Pages 2 0 R >>',
      2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      3: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      4: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      5: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    }
    let pdf = header
    const offsets: number[] = [0]
    for (let i = 1; i <= 5; i++) {
      offsets[i] = Buffer.byteLength(pdf)
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
    }
    const xrefPos = Buffer.byteLength(pdf)
    pdf += 'xref\n0 6\n0000000000 65535 f \n'
    for (let i = 1; i <= 5; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
    }
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
    return new TextEncoder().encode(pdf)
  }

  it('extracts text and page count from a small PDF buffer', async () => {
    const pdf = buildMinimalPdf('Hello, PDF World!')
    const { text, pages } = await extractPdfText(pdf)
    expect(pages).toBe(1)
    expect(text).toContain('Hello, PDF World!')
  })
})
