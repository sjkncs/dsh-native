import { describe, it, expect } from 'vitest'
import { compact, normalizeTitle, identityKeys } from '../src/schema.js'
import type { Paper } from '../src/schema.js'

describe('compact', () => {
  it('removes undefined fields', () => {
    expect(compact({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' })
  })
})

describe('normalizeTitle', () => {
  it('lowercases, folds whitespace, strips punctuation', () => {
    expect(normalizeTitle('  Attention Is All You Need!  ')).toBe('attention is all you need')
  })
})

describe('identityKeys', () => {
  it('returns doi, arxiv, pmid and title keys', () => {
    const p: Paper = { id: 'x', title: 'Attention Is All You Need', authors: [], doi: '10.1234/abc', arxivId: '1706.03762', source: 'arxiv' }
    const keys = identityKeys(p)
    expect(keys).toContain('doi:10.1234/abc')
    expect(keys).toContain('arxiv:1706.03762')
    expect(keys).toContain('title:attention is all you need')
  })
})
