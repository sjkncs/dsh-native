# dsh-free-academic-search

Free academic paper search & download plugin for **DeepSeek Harness** — **no API key, no credits**.

Registers 25 `free_*` tools plus a `/free-academic` slash command:

- `/free-academic search <query> [--n N] [--year YYYY-YYYY]` — search top papers (Semantic Scholar + arXiv)
- `/free-academic help` — list all 25 tools
- `/free-academic status` — show config toggles

All data comes from public interfaces (Semantic Scholar, PubMed, arXiv, bioRxiv, medRxiv, DOI/Crossref, Unpaywall).

## Install

```bash
# from a DSH profile directory
dsh plugin --profile desktop add dsh-free-academic-search
# or
npm install dsh-free-academic-search
```

Then restart DSH Desktop. The 25 `free_*` tools appear in the tool list with no credit/billing prompts, and `/free-academic` pops up in the composer.

> Tools are prefixed `free_` to coexist with the paid `dsh-ai4scholar` plugin (DSH `ctx.tools` is a global namespace).

## Config

All toggles are on by default (`enabled(v) = v !== false`):

- `arxiv`, `semanticScholar`, `pubmed`, `biorxiv`, `medrxiv`, `doi`, `unified` — sources
- `unpaywall` — legal OA fallback (default on)
- `scihub` — **EXPERIMENTAL & HIGH-RISK** opt-in Sci-Hub fallback (default **off**). Sci-Hub
  hosts unauthorized copies of copyrighted works; using it may be **illegal** in your
  jurisdiction. Not recommended, not advertised — enable only when you are legally
  entitled to access the content.
- `unpaywallEmail` — email sent to Unpaywall API (default `free-academic-search@users.noreply.github.com`)
- `command` — enable `/free-academic` slash command (default on)

## Build / test

```bash
pnpm install
pnpm --filter dsh-free-academic-search build
pnpm --filter dsh-free-academic-search test
pnpm --filter dsh-free-academic-search typecheck
```

## Acknowledgements

- [dsh-ai4scholar](https://github.com/literaf/dsh-ai4scholar) — core reference project (architecture & design). Powered by [ai4scholar.net](https://ai4scholar.net).
- DeepSeek Harness plugin framework ([@deepseek-ai/dsh-tools](https://github.com/deepseek-ai), cordis, schemastery, dsh-commands)
- Free data APIs: [Semantic Scholar](https://www.semanticscholar.org/product/api), [arXiv](https://arxiv.org/help/api), [PubMed](https://www.ncbi.nlm.nih.gov/books/NBK25501/), [bioRxiv/medRxiv](https://api.biorxiv.org/), [Crossref](https://www.crossref.org/documentation/), [Unpaywall](https://unpaywall.org/), [OpenAlex](https://openalex.org/), [DOI.org](https://www.doi.org/)

## License

MIT
