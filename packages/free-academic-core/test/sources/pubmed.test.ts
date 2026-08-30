import { describe, it, expect } from 'vitest'
import { parsePubmedSearchXml, parsePubmedSummariesJson } from '../../src/sources/pubmed.js'

describe('parsePubmedSearchXml', () => {
  it('extracts pmids and count', () => {
    const xml = '<eSearchResult><Count>2</Count><IdList><Id>12345</Id><Id>67890</Id></IdList></eSearchResult>'
    const { pmids, count } = parsePubmedSearchXml(xml)
    expect(count).toBe(2)
    expect(pmids).toEqual(['12345', '67890'])
  })
})

describe('parsePubmedSummariesJson', () => {
  it('maps esummary result to papers', () => {
    const json = {
      result: {
        '12345': {
          uid: '12345', title: 'A GLP-1 story',
          pubdate: '2023 Jun', source: 'Nature Medicine',
          authors: [{ name: 'Jane Doe' }],
          doi: '10.1038/s41591-023-00000-0',
        },
      },
    }
    const papers = parsePubmedSummariesJson(json)
    expect(papers[0].pmid).toBe('12345')
    expect(papers[0].title).toBe('A GLP-1 story')
    expect(papers[0].venue).toBe('Nature Medicine')
    expect(papers[0].doi).toBe('10.1038/s41591-023-00000-0')
  })
})
