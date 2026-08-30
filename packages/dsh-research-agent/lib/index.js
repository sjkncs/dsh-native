// src/index.ts
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parse } from "yaml";
var name = "dsh-research-agent";
var inject = ["webServer", "agentPresets"];
var PRESET_ID = "research";
var RESEARCH_WORKSPACE_PATH = "E:\\DeepSeek harness\\\u79D1\u7814\u5DE5\u4F5C\u53F0";
var YAML_ROUTES = {
  "/dsh-research-agent/cards": "cards.yml",
  "/dsh-research-agent/modules": "modules.yml"
};
function isCardRow(row) {
  if (typeof row !== "object" || row === null) return false;
  const record = row;
  return ["key", "title", "hint", "template"].every((field) => typeof record[field] === "string" && record[field] !== "");
}
function apply(ctx) {
  ctx.effect(() => {
    void mkdir(RESEARCH_WORKSPACE_PATH, { recursive: true }).catch(() => {
    });
    return () => {
    };
  }, "dsh-research-agent: workspace dir");
  for (const [route, file] of Object.entries(YAML_ROUTES)) {
    ctx.effect(() => ctx.webServer.register({
      kind: "exact",
      path: route,
      handler: async (_req, res) => {
        try {
          const preset = await ctx.agentPresets.resolve(PRESET_ID);
          const text = await readFile(join(dirname(preset.path), file), "utf8");
          const rows = parse(text);
          const cards = Array.isArray(rows) ? rows.filter(isCardRow) : [];
          if (cards.length === 0) throw new Error(`${file} carries no valid card rows`);
          res.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
          });
          res.end(JSON.stringify({ cards }));
        } catch {
          res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
          res.end('{"cards":[]}');
        }
      }
    }), `dsh-research-agent: ${file} route`);
  }
}
export {
  RESEARCH_WORKSPACE_PATH,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
