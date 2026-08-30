import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apply } from '../src/index.js'
import { downloadPdfByDoi, downloadSciHubPdf, downloadUnpaywallPdf, extractPdfText, fetchBinary, getSemanticPaper, searchPapers, searchSemanticScholar } from 'free-academic-core'

/**
 * Task 20: mock only the network-facing core functions; keep the real
 * normalizeDoi / normalizeArxivId / arxivPdfUrl / sliceText so identifier
 * parsing and slicing are exercised for real.
 */
vi.mock('free-academic-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('free-academic-core')>()
  return {
    ...actual,
    downloadPdfByDoi: vi.fn(),
    downloadSciHubPdf: vi.fn(),
    downloadUnpaywallPdf: vi.fn(),
    extractPdfText: vi.fn().mockResolvedValue({ text: 'Mocked full text extracted from the PDF.', pages: 3 }),
    fetchBinary: vi.fn(),
    getSemanticPaper: vi.fn(),
    searchPapers: vi.fn(),
    searchSemanticScholar: vi.fn(),
  }
})

/**
 * A minimal plugin context: `ctx.tools.register` just records definitions.
 * Each registered tool object carries a `name` field. `ctx.inject` records
 * the lazy service-injection callbacks so tests can fire them manually (the
 * `/free-academic` command registers through `ctx.inject(['commands'], ...)`).
 */
function makeCtx() {
  const tools: unknown[] = []
  const injects: Array<{ keys: string[]; cb: (c: unknown) => void }> = []
  return {
    tools: { register: (t: unknown) => { tools.push(t) } },
    _list: tools,
    inject: (keys: string[], cb: (c: unknown) => void) => { injects.push({ keys, cb }) },
    _injects: injects,
  }
}

function namesOf(ctx: { _list: Array<{ name: string }> }): string[] {
  return ctx._list.map((t) => t.name)
}

/** Look up one registered tool definition by name (for schema checks). */
function toolNamed(ctx: { _list: unknown[] }, name: string): Record<string, unknown> | undefined {
  return ctx._list.find((t) => (t as { name?: string }).name === name) as Record<string, unknown> | undefined
}

const ARXIV_TOOLS = ['free_search_arxiv', 'free_download_arxiv', 'free_read_arxiv_paper']
const SEMANTIC_TOOLS = [
  'free_search_semantic',
  'free_search_semantic_paper_match',
  'free_get_semantic_paper',
  'free_get_semantic_paper_batch',
  'free_get_semantic_citations',
  'free_get_semantic_references',
  'free_get_semantic_author',
  'free_get_semantic_author_papers',
  'free_get_semantic_recommendations',
]
const PUBMED_TOOLS = ['free_search_pubmed', 'free_get_pubmed_paper_detail', 'free_get_pubmed_paper_batch', 'free_get_pubmed_related']
const BIORXIV_TOOLS = ['free_search_biorxiv', 'free_download_biorxiv', 'free_read_biorxiv_paper']
const MEDRXIV_TOOLS = ['free_search_medrxiv', 'free_download_medrxiv', 'free_read_medrxiv_paper']
const DOI_TOOLS = ['free_download_by_doi', 'free_read_by_doi']
const UNIFIED_TOOLS = ['free_search_papers']

/** The complete registered tool set: 10 pre-existing + 15 new (25 total). */
const FULL_TOOL_SET = [
  ...ARXIV_TOOLS,
  ...SEMANTIC_TOOLS,
  ...PUBMED_TOOLS,
  ...BIORXIV_TOOLS,
  ...MEDRXIV_TOOLS,
  ...DOI_TOOLS,
  ...UNIFIED_TOOLS,
]

describe('plugin registers tools', () => {
  it('registers the configured tool families', () => {
    const ctx = makeCtx() as never
    apply(ctx, { arxiv: true, semanticScholar: false, pubmed: false })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const expected of ARXIV_TOOLS) expect(names).toContain(expected)
    for (const absent of [...SEMANTIC_TOOLS, ...PUBMED_TOOLS]) expect(names).not.toContain(absent)
  })

  it('enables every tool family by default (all 25 tools)', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    expect(names).toHaveLength(FULL_TOOL_SET.length)
    expect([...names].sort()).toEqual([...FULL_TOOL_SET].sort())
  })

  it('gates each family off by config', () => {
    const ctx = makeCtx() as never
    apply(ctx, {
      arxiv: false,
      semanticScholar: true,
      pubmed: true,
      biorxiv: true,
      medrxiv: true,
      doi: true,
      unified: true,
    })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const absent of ARXIV_TOOLS) expect(names).not.toContain(absent)
    for (const expected of [...SEMANTIC_TOOLS, ...PUBMED_TOOLS, ...BIORXIV_TOOLS, ...MEDRXIV_TOOLS, ...DOI_TOOLS, ...UNIFIED_TOOLS]) {
      expect(names).toContain(expected)
    }
  })

  it('gates the Semantic Scholar tools off via semanticScholar', () => {
    const ctx = makeCtx() as never
    apply(ctx, { semanticScholar: false })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const absent of SEMANTIC_TOOLS) expect(names).not.toContain(absent)
    for (const expected of [...ARXIV_TOOLS, ...PUBMED_TOOLS, ...BIORXIV_TOOLS, ...MEDRXIV_TOOLS, ...DOI_TOOLS, ...UNIFIED_TOOLS]) {
      expect(names).toContain(expected)
    }
  })

  it('gates the PubMed tools off via pubmed', () => {
    const ctx = makeCtx() as never
    apply(ctx, { pubmed: false })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const absent of PUBMED_TOOLS) expect(names).not.toContain(absent)
    for (const expected of [...ARXIV_TOOLS, ...SEMANTIC_TOOLS, ...BIORXIV_TOOLS, ...MEDRXIV_TOOLS, ...DOI_TOOLS, ...UNIFIED_TOOLS]) {
      expect(names).toContain(expected)
    }
  })

  it('gates the bioRxiv tools off via biorxiv (medRxiv stays)', () => {
    const ctx = makeCtx() as never
    apply(ctx, { biorxiv: false })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const absent of BIORXIV_TOOLS) expect(names).not.toContain(absent)
    for (const expected of MEDRXIV_TOOLS) expect(names).toContain(expected)
  })

  it('gates the medRxiv tools off via medrxiv (bioRxiv stays)', () => {
    const ctx = makeCtx() as never
    apply(ctx, { medrxiv: false })
    const names = namesOf(ctx as unknown as { _list: Array<{ name: string }> })
    for (const absent of MEDRXIV_TOOLS) expect(names).not.toContain(absent)
    for (const expected of BIORXIV_TOOLS) expect(names).toContain(expected)
  })

  it('gives every tool the full defineTool shape', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    for (const name of FULL_TOOL_SET) {
      const tool = toolNamed(ctx as unknown as { _list: unknown[] }, name)
      expect(tool, `tool ${name} registered`).toBeDefined()
      expect(typeof tool?.description).toBe('string')
      expect(typeof tool?.parameters).toBe('object')
      expect(typeof (tool?.output as { render?: unknown })?.render).toBe('function')
      expect(typeof (tool?.output as { schema?: unknown })?.schema).toBe('object')
      expect(typeof tool?.timeoutMs).toBe('number')
      expect(typeof tool?.isConcurrencySafe).toBe('function')
      expect(typeof tool?.presentCall).toBe('function')
      expect(typeof tool?.execute).toBe('function')
    }
  })
})

// ---- Minimal JSON-schema-ish validator (subset sufficient for the plugin's output schemas) ----
type JsonSchema = {
  type?: string
  required?: string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  additionalProperties?: boolean
  enum?: unknown[]
}

function validateSchema(schema: JsonSchema, value: unknown, path = '$', errors: string[] = []): string[] {
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    errors.push(`${path}: value ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`)
  }
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') errors.push(`${path}: expected string, got ${typeof value}`)
      break
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) errors.push(`${path}: expected integer, got ${JSON.stringify(value)}`)
      break
    case 'boolean':
      if (typeof value !== 'boolean') errors.push(`${path}: expected boolean, got ${typeof value}`)
      break
    case 'array': {
      if (!Array.isArray(value)) { errors.push(`${path}: expected array, got ${typeof value}`); break }
      value.forEach((item, i) => validateSchema(schema.items!, item, `${path}[${i}]`, errors))
      break
    }
    case 'object': {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${path}: expected object, got ${value === null ? 'null' : typeof value}`)
        break
      }
      const rec = value as Record<string, unknown>
      for (const required of schema.required ?? []) {
        if (rec[required] === undefined) errors.push(`${path}: missing required property "${required}"`)
      }
      for (const [key, propValue] of Object.entries(rec)) {
        const propSchema = schema.properties?.[key]
        if (propSchema === undefined) {
          if (schema.additionalProperties === false) errors.push(`${path}: unexpected property "${key}"`)
        } else if (propValue !== undefined) {
          validateSchema(propSchema, propValue, `${path}.${key}`, errors)
        }
      }
      break
    }
    default:
      break
  }
  return errors
}

function expectValid(schema: JsonSchema, value: unknown): void {
  const errors = validateSchema(schema, value)
  expect(errors).toEqual([])
}

describe('new tool output schemas accept their documented return shapes', () => {
  it('get_semantic_paper schema accepts a Paper object', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_get_semantic_paper')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      source: 'semantic-scholar',
      id: '649def34f8be52c8b66281af98ae884c09aef38b',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani'],
      year: 2017,
      citationCount: 90000,
      doi: '10.48550/arXiv.1706.03762',
      url: 'https://www.semanticscholar.org/paper/...',
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
    })
  })

  it('search_semantic_paper_match schema accepts a Paper array', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_search_semantic_paper_match')?.output as { schema: JsonSchema }).schema
    expectValid(schema, [
      { source: 'semantic-scholar', id: 'abc', title: 'A', authors: ['A'] },
      { source: 'semantic-scholar', id: 'def', title: 'B', authors: ['B'], year: 2020 },
    ])
  })

  it('get_semantic_author schema accepts an author profile', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_get_semantic_author')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      authorId: '1741101',
      name: 'Yann LeCun',
      hIndex: 150,
      affiliations: ['New York University'],
      paperCount: 500,
      citationCount: 300000,
      url: 'https://www.semanticscholar.org/author/1741101',
    })
    // sparse author (missing optional fields) must also validate
    expectValid(schema, { name: 'Unknown Author' })
  })

  it('get_pubmed_paper_detail schema accepts found and not-found shapes', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_get_pubmed_paper_detail')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      found: true,
      paper: { source: 'pubmed', id: '19872477', title: 'A paper', authors: ['Jane Doe'], year: 2009, doi: '10.1038/nature14539' },
    })
    expectValid(schema, { found: false, message: 'No PubMed record found for PMID 999999.' })
  })

  it('read_biorxiv_paper schema accepts a text slice', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_read_biorxiv_paper')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      doi: '10.1101/2024.01.01.123456',
      text: 'Abstract. The paper describes...',
      offset: 0,
      hasMore: true,
      totalPages: 7,
    })
  })

  it('download_biorxiv schema accepts download metadata (no bytes)', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_biorxiv')?.output as { schema: JsonSchema }).schema
    expectValid(schema, { doi: '10.1101/2024.01.01.123456', finalUrl: 'https://www.biorxiv.org/content/10.1101/2024.01.01.123456v2.full.pdf', contentType: 'application/pdf', size: 123456 })
  })
})

// ---- Task 20 helpers: drive a registered tool's execute with mocked core ----

/** A valid `%PDF-` magic-bytes payload (not a parseable PDF, but enough for the fallback path). */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]) // "%PDF-1.4"

function execCtx() {
  return { signal: new AbortController().signal }
}

type ExecTool = { execute: (args: any, exec: { signal: AbortSignal }) => Promise<any> }

function execTool(ctx: { _list: unknown[] }, name: string): ExecTool {
  const t = toolNamed(ctx, name) as unknown as ExecTool
  expect(t, `tool ${name} registered`).toBeDefined()
  return t
}

const LANDING_PAGE_ERROR = (doi: string) =>
  new Error(`DOI ${doi} resolved to a landing page (content-type: text/html), not a PDF — likely paywalled or not open-access`)

describe('free_search_semantic sort_by', () => {
  const papers = [
    { source: 'semantic-scholar', id: 'a', title: 'Low citations', authors: ['A'], citationCount: 10 },
    { source: 'semantic-scholar', id: 'b', title: 'High citations', authors: ['B'], citationCount: 900 },
    { source: 'semantic-scholar', id: 'c', title: 'Unknown citations', authors: ['C'] },
  ]

  it('sort_by=citationCount returns results sorted by descending citation count', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_search_semantic')
    vi.mocked(searchSemanticScholar).mockResolvedValue([...papers])
    const out = await tool.execute({ query: 'attention', sort_by: 'citationCount' }, execCtx())
    expect(out.papers.map((p: { id: string }) => p.id)).toEqual(['b', 'a', 'c'])
  })

  it('default relevance keeps the platform-returned order (no reorder)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_search_semantic')
    vi.mocked(searchSemanticScholar).mockResolvedValue([...papers])
    const out = await tool.execute({ query: 'attention' }, execCtx())
    expect(out.papers.map((p: { id: string }) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('free_download_by_doi arXiv fallback', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  it('resolves an open-access DOI directly with source doi and no note', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockResolvedValue({
      bytes: PDF_BYTES,
      finalUrl: 'https://www.nature.com/articles/s41586-021-03819-2.pdf',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.1038/s41586-021-03819-2' }, execCtx())
    expect(out.source).toBe('doi')
    expect(out.note).toBeUndefined()
    expect(out.pdfUrl).toBe('https://www.nature.com/articles/s41586-021-03819-2.pdf')
  })

  it('10.48550/arXiv.* DOI short-circuits straight to the arXiv PDF, never touching doi.org (#6)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    // Even if doi.org would fail (landing page or a transient network error),
    // the arXiv id is locally derivable so doi.org must never be hit.
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.48550/arXiv.2301.11313'))
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.48550/arXiv.2301.11313' }, execCtx())
    expect(downloadPdfByDoi).not.toHaveBeenCalled()
    expect(out.source).toBe('arxiv')
    expect(out.doi).toBe('2301.11313')
    expect(out.note).toBeUndefined()
    expect(out.pdfUrl).toBe('https://arxiv.org/pdf/2301.11313')
    expect(out.bytes).toBe(PDF_BYTES.length)
    expect(fetchBinary).toHaveBeenCalledWith('https://arxiv.org/pdf/2301.11313', expect.objectContaining({ signal: expect.anything() }))
  })

  it('a plain arXiv id input goes straight to the arXiv PDF without touching doi.org', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '2301.11313' }, execCtx())
    expect(out.source).toBe('arxiv')
    expect(downloadPdfByDoi).not.toHaveBeenCalled()
    expect(out.doi).toBe('2301.11313')
  })
})

describe('free_read_by_doi arXiv fallback', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  it('read_by_doi short-circuits 10.48550/arXiv.* DOIs to the arXiv PDF without doi.org (#6)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.48550/arXiv.2301.11313'))
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.48550/arXiv.2301.11313' }, execCtx())
    expect(downloadPdfByDoi).not.toHaveBeenCalled()
    expect(out.source).toBe('arxiv')
    expect(out.id).toBe('2301.11313')
    expect(out.note).toBeUndefined()
    expect(out.text).toBe('Mocked full text extracted from the PDF.')
  })

  it('rethrows the original landing-page error when the arXiv fallback also fails', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')
    // A generic paywalled DOI (no embedded arXiv id): the arXiv preprint is
    // reached via the Semantic Scholar reverse-lookup, then fails to download.
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TPWRD.2019.2912345'))
    vi.mocked(getSemanticPaper).mockResolvedValue({
      id: 'abc',
      title: 'A paywalled paper',
      authors: [],
      source: 'semantic-scholar' as const,
      arxivId: '2301.11313',
    })
    vi.mocked(fetchBinary).mockResolvedValue({ ok: false, error: 'arXiv returned 503' })
    await expect(tool.execute({ doi: '10.1109/TPWRD.2019.2912345' }, execCtx())).rejects.toThrow('landing page')
  })

  it('rethrows for a generic paywalled DOI with no extractable arXiv id (no arXiv attempt)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TPWRD.2019.2912345'))
    await expect(tool.execute({ doi: '10.1109/TPWRD.2019.2912345' }, execCtx())).rejects.toThrow('landing page')
    expect(fetchBinary).not.toHaveBeenCalled()
  })
})

describe('free_download_by_doi Semantic Scholar arXiv reverse-lookup', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  /** A minimal Paper carrying the fields the fallback reads (arxivId). */
  const PAPER_WITH_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: '2301.11313',
  }
  const PAPER_WITHOUT_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: undefined,
  }

  it('pure paywalled DOI reverse-looks-up the arXiv id via Semantic Scholar (source arxiv, note mentions it)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITH_ARXIV)
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())
    expect(out.source).toBe('arxiv')
    expect(out.note).toContain('Semantic Scholar')
    expect(out.pdfUrl).toBe('https://arxiv.org/pdf/2301.11313')
    expect(getSemanticPaper).toHaveBeenCalledWith('10.1109/TAC.2023.3339435', expect.any(AbortSignal))
    expect(downloadPdfByDoi).toHaveBeenCalledTimes(1)
  })

  it('rethrows the original DOI error when the Semantic Scholar lookup throws', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockRejectedValue(new Error('Semantic Scholar lookup failed: rate limited'))
    await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
    expect(fetchBinary).not.toHaveBeenCalled()
  })

  it('rethrows the original DOI error when the Semantic Scholar paper has no arxivId', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
    expect(fetchBinary).not.toHaveBeenCalled()
  })

  it('10.48550/arXiv.* input uses the direct arXiv route and never calls getSemanticPaper', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.48550/arXiv.2301.11313'))
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.48550/arXiv.2301.11313' }, execCtx())
    expect(out.source).toBe('arxiv')
    expect(getSemanticPaper).not.toHaveBeenCalled()
    expect(downloadPdfByDoi).not.toHaveBeenCalled()
  })

  it('a plain arXiv id input uses the direct arXiv route and never calls getSemanticPaper', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(fetchBinary).mockResolvedValue({
      ok: true,
      data: PDF_BYTES,
      finalUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '2301.11313' }, execCtx())
    expect(out.source).toBe('arxiv')
    expect(getSemanticPaper).not.toHaveBeenCalled()
    expect(downloadPdfByDoi).not.toHaveBeenCalled()
  })
})

describe('Task 20 output schemas accept source/note additions', () => {
  it('download_by_doi schema accepts both doi and arxiv-fallback shapes', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')?.output as { schema: JsonSchema }).schema
    expectValid(schema, { doi: '10.1038/s41586-021-03819-2', pdfUrl: 'https://x/paper.pdf', contentType: 'application/pdf', bytes: 12345, source: 'doi' })
    expectValid(schema, {
      doi: '2301.11313',
      pdfUrl: 'https://arxiv.org/pdf/2301.11313',
      contentType: 'application/pdf',
      bytes: 12345,
      source: 'arxiv',
      note: 'via arXiv pre-print fallback',
    })
  })

  it('read_by_doi schema accepts an arxiv-fallback slice with source + note', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      id: '2301.11313',
      pdfUrl: 'https://arxiv.org/pdf/2301.11313',
      pages: 3,
      totalChars: 40,
      offset: 0,
      text: 'Mocked full text extracted from the PDF.',
      truncated: false,
      source: 'arxiv',
      note: 'via arXiv pre-print fallback',
    })
  })

  it('download_biorxiv / download_medrxiv schemas accept their source field', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const biorxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_biorxiv')?.output as { schema: JsonSchema }).schema
    const medrxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_medrxiv')?.output as { schema: JsonSchema }).schema
    expectValid(biorxiv, { doi: '10.1101/2024.01.01.123456', finalUrl: 'https://www.biorxiv.org/content/10.1101/2024.01.01.123456v2.full.pdf', contentType: 'application/pdf', size: 123, source: 'biorxiv' })
    expectValid(medrxiv, { doi: '10.1101/2024.01.01.123456', finalUrl: 'https://www.medrxiv.org/content/10.1101/2024.01.01.123456v2.full.pdf', contentType: 'application/pdf', size: 456, source: 'medrxiv' })
  })

  it('read_biorxiv_paper / read_medrxiv_paper schemas accept their source field', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const biorxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_read_biorxiv_paper')?.output as { schema: JsonSchema }).schema
    const medrxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_read_medrxiv_paper')?.output as { schema: JsonSchema }).schema
    expectValid(biorxiv, { doi: '10.1101/2024.01.01.123456', text: 'Abstract. Text.', offset: 0, hasMore: false, totalPages: 5, source: 'biorxiv' })
    expectValid(medrxiv, { doi: '10.1101/2024.01.01.123456', text: 'Abstract. Text.', offset: 0, hasMore: false, totalPages: 5, source: 'medrxiv' })
  })
})

// ---- Task 23: Unpaywall (legal OA, default ON) + Sci-Hub (opt-in, default OFF) fallback ----

describe('free_download_by_doi Unpaywall fallback', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  /** A minimal S2 paper with no arXiv mapping, so the reverse-lookup yields nothing. */
  const PAPER_WITHOUT_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: undefined,
  }

  it('falls back to a legal Unpaywall OA copy when DOI is paywalled and S2 has no arXiv (source unpaywall)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { unpaywallEmail: 'free-academic-search@users.noreply.github.com' })
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue({
      bytes: PDF_BYTES,
      finalUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/pdf/main.pdf',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())
    expect(out.source).toBe('unpaywall')
    expect(out.note).toContain('Unpaywall')
    expect(out.pdfUrl).toBe('https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/pdf/main.pdf')
    expect(downloadUnpaywallPdf).toHaveBeenCalledWith(
      '10.1109/TAC.2023.3339435',
      expect.objectContaining({ email: 'free-academic-search@users.noreply.github.com', signal: expect.anything() }),
    )
    expect(downloadSciHubPdf).not.toHaveBeenCalled()
  })

  it('does NOT call downloadUnpaywallPdf when config.unpaywall is false', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { unpaywall: false })
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
    expect(downloadUnpaywallPdf).not.toHaveBeenCalled()
    expect(downloadSciHubPdf).not.toHaveBeenCalled()
  })

  it('read_by_doi also resolves a paywalled DOI through the Unpaywall layer', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue({
      bytes: PDF_BYTES,
      finalUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/pdf/main.pdf',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())
    expect(out.source).toBe('unpaywall')
    expect(out.note).toContain('Unpaywall')
    expect(out.text).toBe('Mocked full text extracted from the PDF.')
    expect(out.id).toBe('10.1109/TAC.2023.3339435')
  })
})

describe('free_download_by_doi Sci-Hub fallback (opt-in, off by default)', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  const PAPER_WITHOUT_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: undefined,
  }

  it('tries Sci-Hub as the last layer only when config.scihub is true (source scihub)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { scihub: true })
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue(undefined) // Unpaywall finds no OA copy
    vi.mocked(downloadSciHubPdf).mockResolvedValue({
      bytes: PDF_BYTES,
      finalUrl: 'https://sci-hub.se/downloads/main.pdf',
      contentType: 'application/pdf',
    })
    const out = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())
    expect(out.source).toBe('scihub')
    expect(out.note).toContain('Sci-Hub')
    expect(out.note).toContain('EXPERIMENTAL')
    expect(downloadUnpaywallPdf).toHaveBeenCalled()
    expect(downloadSciHubPdf).toHaveBeenCalledWith('10.1109/TAC.2023.3339435', expect.objectContaining({ signal: expect.anything() }))
  })

  it('does NOT call downloadSciHubPdf when config.scihub is false (default)', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue(undefined)
    await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
    expect(downloadSciHubPdf).not.toHaveBeenCalled() // critical: default-off never touches Sci-Hub
    expect(downloadUnpaywallPdf).toHaveBeenCalled()
  })

  it('rethrows the original landing-page error when every fallback layer fails', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { scihub: true })
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue(undefined)
    vi.mocked(downloadSciHubPdf).mockResolvedValue(undefined)
    await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
    expect(downloadUnpaywallPdf).toHaveBeenCalled()
    expect(downloadSciHubPdf).toHaveBeenCalled()
  })
})

describe('Task 23 output schemas accept unpaywall/scihub source values', () => {
  it('download_by_doi schema accepts unpaywall and scihub source shapes', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      doi: '10.1109/TAC.2023.3339435',
      pdfUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/pdf/main.pdf',
      contentType: 'application/pdf',
      bytes: 12345,
      source: 'unpaywall',
      note: 'via Unpaywall legal open-access',
    })
    expectValid(schema, {
      doi: '10.1109/TAC.2023.3339435',
      pdfUrl: 'https://sci-hub.se/downloads/main.pdf',
      contentType: 'application/pdf',
      bytes: 12345,
      source: 'scihub',
      note: 'via Sci-Hub (EXPERIMENTAL, may be illegal in your jurisdiction)',
    })
  })

  it('read_by_doi schema accepts unpaywall and scihub source values', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const schema = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_read_by_doi')?.output as { schema: JsonSchema }).schema
    expectValid(schema, {
      id: '10.1109/TAC.2023.3339435',
      pdfUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/pdf/main.pdf',
      pages: 3,
      totalChars: 40,
      offset: 0,
      text: 'Mocked full text extracted from the PDF.',
      truncated: false,
      source: 'unpaywall',
      note: 'via Unpaywall legal open-access',
    })
    expectValid(schema, {
      id: '10.1109/TAC.2023.3339435',
      pdfUrl: 'https://sci-hub.se/downloads/main.pdf',
      pages: 3,
      totalChars: 40,
      offset: 0,
      text: 'Mocked full text extracted from the PDF.',
      truncated: false,
      source: 'scihub',
      note: 'via Sci-Hub (EXPERIMENTAL, may be illegal in your jurisdiction)',
    })
  })
})

// ---- Task 24: final-review cleanups (#7 abort propagation, #8 debug logs, M2 dead schema field) ----

describe('Task 24 final-review cleanups', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  /** A minimal S2 paper with no arXiv mapping (the reverse-lookup yields nothing). */
  const PAPER_WITHOUT_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: undefined,
  }

  it('#7 propagates AbortError instead of the original DOI error when the signal is aborted', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    // The DOI resolves to a landing page AND the user aborts: the caller must
    // see AbortError, never the masked landing-page error.
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue(undefined)
    const controller = new AbortController()
    controller.abort()
    const err = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, { signal: controller.signal }).catch((e: unknown) => e)
    expect((err as Error).name).toBe('AbortError')
    expect((err as Error).message).not.toContain('landing page')
  })

  it('#8 logs the swallowed Unpaywall failure via console.debug', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockRejectedValue(new Error('Unpaywall API 422: invalid email'))
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    try {
      await expect(tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx())).rejects.toThrow('landing page')
      expect(debugSpy).toHaveBeenCalled()
      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Unpaywall'), expect.anything())
    } finally {
      debugSpy.mockRestore()
    }
  })

  it('M2 download_biorxiv / download_medrxiv schemas do not declare a note field (never populated)', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const biorxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_biorxiv')?.output as { schema: JsonSchema }).schema
    const medrxiv = (toolNamed(ctx as unknown as { _list: unknown[] }, 'free_download_medrxiv')?.output as { schema: JsonSchema }).schema
    expect(biorxiv.properties).not.toHaveProperty('note')
    expect(medrxiv.properties).not.toHaveProperty('note')
  })
})

// ---- Task 25: #7 closed — an abort mid-chain must propagate as AbortError through every layer ----

describe('Task 25 abort propagation through fallback layers', () => {
  beforeEach(() => {
    vi.mocked(downloadPdfByDoi).mockReset()
    vi.mocked(downloadSciHubPdf).mockReset()
    vi.mocked(downloadUnpaywallPdf).mockReset()
    vi.mocked(fetchBinary).mockReset()
    vi.mocked(getSemanticPaper).mockReset()
  })

  /** A minimal S2 paper with no arXiv mapping, so the reverse-lookup yields nothing. */
  const PAPER_WITHOUT_ARXIV = {
    id: 'abc',
    title: 'A paywalled paper',
    authors: [],
    source: 'semantic-scholar' as const,
    arxivId: undefined,
  }

  /** The abort thrown by a fallback layer mid-chain, as the internal fetch emits on abort. */
  const ABORT = () => new DOMException('The operation was aborted', 'AbortError')

  it('propagates AbortError when the signal aborts during the Unpaywall layer', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    // The DOI is paywalled, S2 finds no arXiv, then the Unpaywall request is
    // aborted mid-flight: the caller must see AbortError, not the original
    // landing-page error (which would otherwise be rethrown at the end).
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockRejectedValue(ABORT())
    const err = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx()).catch((e: unknown) => e)
    expect((err as Error).name).toBe('AbortError')
    expect((err as Error).message).not.toContain('landing page')
  })

  it('propagates AbortError when the signal aborts during the Sci-Hub layer', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { scihub: true })
    const tool = execTool(ctx as unknown as { _list: unknown[] }, 'free_download_by_doi')
    // Sci-Hub is the last layer: Unpaywall finds no OA copy, then the Sci-Hub
    // request is aborted mid-flight — AbortError must win over the original
    // landing-page error.
    vi.mocked(downloadPdfByDoi).mockRejectedValue(LANDING_PAGE_ERROR('10.1109/TAC.2023.3339435'))
    vi.mocked(getSemanticPaper).mockResolvedValue(PAPER_WITHOUT_ARXIV)
    vi.mocked(downloadUnpaywallPdf).mockResolvedValue(undefined)
    vi.mocked(downloadSciHubPdf).mockRejectedValue(ABORT())
    const err = await tool.execute({ doi: '10.1109/TAC.2023.3339435' }, execCtx()).catch((e: unknown) => e)
    expect((err as Error).name).toBe('AbortError')
    expect((err as Error).message).not.toContain('landing page')
  })
})

// ---- Task 26: /free-academic slash command (search | help | status) ----

type CommandResult = { kind: 'success'; text: string } | { kind: 'error'; text: string }

type CommandInvocation = {
  commandId: string
  agent: unknown
  rawInput: string
  attachments: readonly unknown[]
  signal: AbortSignal
}

type CommandDefinition = {
  name: string
  description: string
  input?: { hint: string }
  handler: (invocation: CommandInvocation) => CommandResult | Promise<CommandResult>
}

/** Invoke a registered command handler with one raw input line. */
function invokeCommand(command: CommandDefinition, rawInput: string, signal = new AbortController().signal) {
  return command.handler({ commandId: 'cmd-test-1', agent: undefined, rawInput, attachments: [], signal })
}

/**
 * Fire the lazily-injected `commands` callback captured by `ctx.inject` and
 * return the `/free-academic` definition it registered.
 */
function freeAcademicCommand(ctx: { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> }): CommandDefinition {
  for (const { keys, cb } of ctx._injects) {
    if (keys.includes('commands')) {
      const defs: CommandDefinition[] = []
      cb({ commands: { register: (def: CommandDefinition) => { defs.push(def) } } })
      const def = defs.find((d) => d.name === 'free-academic')
      expect(def, '/free-academic registered via commands.register').toBeDefined()
      return def!
    }
  }
  throw new Error('no `commands` inject registered')
}

describe('Task 26 /free-academic slash command', () => {
  beforeEach(() => {
    vi.mocked(searchPapers).mockReset()
  })

  it('registers /free-academic by default via a lazy `commands` inject', () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const ctxTyped = ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> }
    expect(ctxTyped._injects.some(({ keys }) => keys.includes('commands'))).toBe(true)
    const command = freeAcademicCommand(ctxTyped)
    expect(command.name).toBe('free-academic')
    expect(command.description.length).toBeGreaterThan(0)
    expect(command.input?.hint).toBe('search <query> | help | status')
    expect(typeof command.handler).toBe('function')
  })

  it('skips command registration when config.command is false', () => {
    const ctx = makeCtx() as never
    apply(ctx, { command: false })
    const ctxTyped = ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> }
    expect(ctxTyped._injects.some(({ keys }) => keys.includes('commands'))).toBe(false)
  })

  it('help (or empty input) lists the free_* tools', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const command = freeAcademicCommand(ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> })
    for (const rawInput of ['', 'help']) {
      const result = await invokeCommand(command, rawInput)
      expect(result.kind).toBe('success')
      if (result.kind === 'success') {
        expect(result.text).toContain('free_search_papers')
        expect(result.text).toContain('free_download_by_doi')
        expect(result.text).toContain('free_search_arxiv')
      }
    }
  })

  it('status shows every config toggle and the unpaywall email', async () => {
    const ctx = makeCtx() as never
    apply(ctx, { unpaywallEmail: 'free-academic-search@users.noreply.github.com' })
    const command = freeAcademicCommand(ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> })
    const result = await invokeCommand(command, 'status')
    expect(result.kind).toBe('success')
    if (result.kind === 'success') {
      expect(result.text).toContain('arxiv')
      expect(result.text).toContain('unpaywall')
      expect(result.text).toContain('scihub')
      expect(result.text).toContain('free-academic-search@users.noreply.github.com')
    }
  })

  it('search <query> calls searchPapers with parsed flags and the Semantic Scholar + arXiv sources', async () => {
    vi.mocked(searchPapers).mockResolvedValue([
      { id: 'p1', title: 'Distributed Optimization Survey', authors: ['A'], source: 'arxiv', year: 2024, citationCount: 5, arxivId: '2401.12345' },
      { id: 'p2', title: 'Federated Learning Convergence', authors: ['B'], source: 'semantic-scholar', year: 2023, doi: '10.1000/xyz' },
    ])
    const ctx = makeCtx() as never
    apply(ctx, {})
    const command = freeAcademicCommand(ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> })
    const signal = new AbortController().signal
    const result = await invokeCommand(command, 'search distributed optimization --n 5 --year 2023-2026', signal)
    expect(result.kind).toBe('success')
    if (result.kind === 'success') expect(result.text).toContain('Distributed Optimization Survey')
    expect(vi.mocked(searchPapers)).toHaveBeenCalledWith(expect.objectContaining({
      query: 'distributed optimization',
      maxResults: 5,
      yearFrom: 2023,
      yearTo: 2026,
      sources: ['semantic-scholar', 'arxiv'],
      signal,
    }))
  })

  it('search returns an error result when searchPapers rejects', async () => {
    vi.mocked(searchPapers).mockRejectedValue(new Error('arXiv API is down'))
    const ctx = makeCtx() as never
    apply(ctx, {})
    const command = freeAcademicCommand(ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> })
    const result = await invokeCommand(command, 'search distributed optimization')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.text).toContain('arXiv API is down')
  })

  it('returns an error result for an unknown subcommand', async () => {
    const ctx = makeCtx() as never
    apply(ctx, {})
    const command = freeAcademicCommand(ctx as unknown as { _injects: Array<{ keys: string[]; cb: (c: unknown) => void }> })
    const result = await invokeCommand(command, 'frobnicate')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.text).toContain('Unknown subcommand')
  })
})
