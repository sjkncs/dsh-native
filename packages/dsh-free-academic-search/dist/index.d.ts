/**
 * dsh-free-academic-search — free academic search & download for DeepSeek
 * Harness. Registers the full free tool set on `ctx.tools`, each family gated
 * by its config toggle (all on by default): arXiv search/download/read,
 * Semantic Scholar search, PubMed search, bioRxiv/medRxiv search, DOI
 * resolution + full-text reading, and a unified multi-platform search. Every
 * tool is backed by `free-academic-core` as a workspace dependency, so no API
 * key and no credits are involved.
 * @module dsh-free-academic-search
 */
import Schema from '@deepseek-ai/schemastery';
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "free-academic-search";
/** Services required before `apply` runs. */
export declare const inject: string[];
export declare const Config: Schema<Schemastery.ObjectS<{
    arxiv: Schema<boolean, boolean>;
    semanticScholar: Schema<boolean, boolean>;
    pubmed: Schema<boolean, boolean>;
    biorxiv: Schema<boolean, boolean>;
    medrxiv: Schema<boolean, boolean>;
    doi: Schema<boolean, boolean>;
    unified: Schema<boolean, boolean>;
    unpaywall: Schema<boolean, boolean>;
    scihub: Schema<boolean, boolean>;
    unpaywallEmail: Schema<string, string>;
    command: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    arxiv: Schema<boolean, boolean>;
    semanticScholar: Schema<boolean, boolean>;
    pubmed: Schema<boolean, boolean>;
    biorxiv: Schema<boolean, boolean>;
    medrxiv: Schema<boolean, boolean>;
    doi: Schema<boolean, boolean>;
    unified: Schema<boolean, boolean>;
    unpaywall: Schema<boolean, boolean>;
    scihub: Schema<boolean, boolean>;
    unpaywallEmail: Schema<string, string>;
    command: Schema<boolean, boolean>;
}>>;
/** Validated output type of the Config schema (schemastery schemas are callable). */
type PluginConfig = ReturnType<typeof Config>;
/**
 * Register the enabled tools. Each registration is an effect on `ctx`, so
 * disposing the plugin fiber removes the tools together.
 * @param ctx - plugin context with the `tools` service ready.
 * @param config - schemastery-validated config with defaults applied.
 */
export declare function apply(ctx: Context, config: PluginConfig): void;
export {};
