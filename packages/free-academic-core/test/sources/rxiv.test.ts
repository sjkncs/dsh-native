import { describe, it, expect } from 'vitest'
import { mapRxivItem } from '../../src/sources/rxiv.js'

describe('mapRxivItem', () => {
  it('maps biorxiv item to Paper', () => {
    const raw = {
      title: 'A Cell Biology Result',
      authors: ['Alice', 'Bob'],
      doi: '10.1101/2024.01.01.123456',
      category: 'cell biology',
      date: '2024-01-02',
      preprint_server: 'bioRxiv',
    }
    const p = mapRxivItem(raw)
    expect(p.title).toBe('A Cell Biology Result')
    expect(p.doi).toBe('10.1101/2024.01.01.123456')
    expect(p.source).toBe('biorxiv')
    expect(p.authors).toEqual(['Alice', 'Bob'])
  })
})
