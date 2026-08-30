# free-academic-core

Free academic paper search & download **core library** — fully free, **no API key, no credits**.

All data comes from public interfaces: Semantic Scholar, PubMed, arXiv, bioRxiv, medRxiv, DOI/Crossref, Unpaywall.

## Features

- **Multi-source search** with dedupe/merge and source-priority ranking
- **PDF text extraction** (pdf-parse)
- **DOI resolution** with download fallback chain: direct → Unpaywall legal OA → (opt-in) Sci-Hub
- **Unified search** across all enabled sources in one call
- Zero dependencies beyond `pdf-parse`

## Install

```bash
npm install free-academic-core
```

## Quick usage

```js
import { searchPapers, downloadPdfByDoi, normalizeDoi } from 'free-academic-core'

// search across Semantic Scholar + arXiv (default) or all sources
const results = await searchPapers({
  query: 'distributed optimization',
  sources: ['semantic-scholar', 'arxiv'],
  yearFrom: 2023,
  maxResults: 20,
})

// download by DOI (auto fallback: direct → Unpaywall → Sci-Hub if enabled)
const pdf = await downloadPdfByDoi('10.1109/TAC.2023.3339435')
```

## Public API

Exported from `src/index.ts`:

- `searchPapers`, `searchSemanticScholar`, `searchPubMed`, `searchArxiv`, `searchBiorxiv`, `searchMedrxiv`
- `mergePaperLists`, `normalizeDoi`, `resolveDoi`, `lookupDoiMetadata`
- `downloadPdfByDoi`, `downloadPdfByUrl`, `isPdfPayload`
- `downloadUnpaywallPdf`, `lookupUnpaywallOa`, `downloadSciHubPdf`, `SCIHUB_MIRRORS`
- `extractPdfText`, `fetchBinary`

Full types in `dist/index.d.ts`.

## Acknowledgements

- [dsh-ai4scholar](https://github.com/literaf/dsh-ai4scholar) — core reference project (architecture & design). Powered by [ai4scholar.net](https://ai4scholar.net).
- [pdf-parse](https://github.com/ModestyZ/PDF-js) — PDF text extraction
- Free data APIs: [Semantic Scholar](https://www.semanticscholar.org/product/api), [arXiv](https://arxiv.org/help/api), [PubMed](https://www.ncbi.nlm.nih.gov/books/NBK25501/), [bioRxiv/medRxiv](https://api.biorxiv.org/), [Crossref](https://www.crossref.org/documentation/), [Unpaywall](https://unpaywall.org/), [OpenAlex](https://openalex.org/), [DOI.org](https://www.doi.org/)

## License

MIT
