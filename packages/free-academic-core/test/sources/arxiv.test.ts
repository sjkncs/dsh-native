import { describe, it, expect } from 'vitest'
import { normalizeArxivId, parseArxivFeed, arxivPdfUrl } from '../../src/sources/arxiv.js'

describe('normalizeArxivId', () => {
  it('strips url, version, pdf suffix', () => {
    expect(normalizeArxivId('https://arxiv.org/abs/2106.12345v2')).toBe('2106.12345')
    expect(normalizeArxivId('2106.12345')).toBe('2106.12345')
    expect(normalizeArxivId('hep-th/9901001')).toBe('hep-th/9901001')
    expect(() => normalizeArxivId('not-an-id')).toThrow()
  })
})

describe('arxivPdfUrl', () => {
  it('builds pdf url', () => {
    expect(arxivPdfUrl('2106.12345')).toBe('https://arxiv.org/pdf/2106.12345')
  })
})

describe('parseArxivFeed', () => {
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2106.12345v2</id>
    <title>Attention Is All You Need</title>
    <summary>A transformer architecture.</summary>
    <published>2021-06-23T00:00:00Z</published>
    <author><name>Ashish Vaswani</name></author>
    <category term="cs.CL" />
  </entry>
</feed>`
  it('parses feed into papers', () => {
    const { papers, total } = parseArxivFeed(feed)
    expect(total).toBe(1)
    expect(papers[0].title).toBe('Attention Is All You Need')
    expect(papers[0].arxivId).toBe('2106.12345')
    expect(papers[0].authors).toEqual(['Ashish Vaswani'])
    expect(papers[0].year).toBe(2021)
  })
})
