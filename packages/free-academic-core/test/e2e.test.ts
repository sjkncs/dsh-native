import { describe, it, expect } from 'vitest'
import { searchPapers, searchArxiv } from '../src/index.js'

const runNet = !!process.env.NET

describe.skipIf(!runNet)('e2e (real API)', () => {
  it('arxiv returns real results', async () => {
    const r = await searchArxiv({ query: 'distributed optimization', maxResults: 5 })
    expect(r.papers.length).toBeGreaterThan(0)
  })
  it('searchPapers merges sources', async () => {
    const papers = await searchPapers({ query: 'graph neural networks', sources: ['arxiv', 'semantic-scholar'], maxResults: 5 })
    expect(papers.length).toBeGreaterThan(0)
  })
})
