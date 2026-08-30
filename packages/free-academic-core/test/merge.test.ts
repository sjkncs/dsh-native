import { describe, it, expect } from 'vitest'
import { mergePaperLists } from '../src/merge.js'
import type { Paper } from '../src/schema.js'

function paper(partial: Partial<Paper> & { id: string; title: string; source: Paper['source'] }): Paper {
  return { authors: [], ...partial }
}

describe('mergePaperLists', () => {
  it('dedupes by doi across sources, prefers multi-hit', () => {
    const a = paper({ id: 'a', title: 'Attention', source: 'arxiv', doi: '10.1/abc', arxivId: '1706.03762', citationCount: 10 })
    const b = paper({ id: 'b', title: 'Attention', source: 'semantic-scholar', doi: '10.1/abc', arxivId: '1706.03762', citationCount: 100 })
    const merged = mergePaperLists([[a], [b]])
    expect(merged.length).toBe(1)
    expect(merged[0].citationCount).toBe(100)
  })
  it('sorts by citation count desc', () => {
    const low = paper({ id: 'l', title: 'Low', source: 'arxiv', citationCount: 1 })
    const high = paper({ id: 'h', title: 'High', source: 'arxiv', citationCount: 50 })
    const merged = mergePaperLists([[low], [high]])
    expect(merged.map((p) => p.id)).toEqual(['h', 'l'])
  })
  it('ranks same-citation papers by source priority: S2 before arXiv before PubMed', () => {
    const lists = [
      [paper({ id: 'pm', title: 'Zeta', source: 'pubmed', citationCount: 5 })],
      [paper({ id: 's2', title: 'Alpha', source: 'semantic-scholar', citationCount: 5 })],
      [paper({ id: 'ax', title: 'Beta', source: 'arxiv', citationCount: 5 })],
    ]
    const merged = mergePaperLists(lists)
    expect(merged.map((p) => p.id)).toEqual(['s2', 'ax', 'pm'])
  })
  it('orders all six sources by SOURCE_PRIORITY: S2 < arxiv < pubmed < biorxiv < medrxiv < doi', () => {
    const order: Paper['source'][] = ['semantic-scholar', 'arxiv', 'pubmed', 'biorxiv', 'medrxiv', 'doi']
    const lists = order.map((source, i) => [
      paper({ id: `p${i}`, title: `Title ${order.length - i}`, source, citationCount: 7 }),
    ])
    const merged = mergePaperLists(lists)
    expect(merged.map((p) => p.source)).toEqual(order)
  })
  it('places S2/arXiv CS papers ahead of PubMed medical papers when citations are all zero', () => {
    const lists = [
      [paper({ id: 'pm1', title: 'AAA medical journal article', source: 'pubmed' })],
      [paper({ id: 's2', title: 'ZZZ distributed optimization algorithm', source: 'semantic-scholar' })],
      [paper({ id: 'ax', title: 'MMM federated learning preprint', source: 'arxiv' })],
    ]
    const merged = mergePaperLists(lists)
    expect(merged.map((p) => p.id)).toEqual(['s2', 'ax', 'pm1'])
  })
  it('keeps citation count as the primary tie-breaker over source priority', () => {
    const lists = [
      [paper({ id: 's2', title: 'S2 paper', source: 'semantic-scholar' })],
      [paper({ id: 'pm', title: 'PubMed paper', source: 'pubmed', citationCount: 100 })],
    ]
    const merged = mergePaperLists(lists)
    expect(merged.map((p) => p.id)).toEqual(['pm', 's2'])
  })
  it('keeps hit count as the primary ranking key over citations and source priority', () => {
    const x = paper({ id: 'x', title: 'X paper', source: 'arxiv', doi: '10.1/x', citationCount: 3 })
    const x2 = paper({ id: 'x2', title: 'X paper', source: 'pubmed', doi: '10.1/x' })
    const y = paper({ id: 'y', title: 'Y paper', source: 'semantic-scholar', citationCount: 50 })
    const merged = mergePaperLists([[x], [x2], [y]])
    expect(merged[0].id).toBe('x')
  })
})
