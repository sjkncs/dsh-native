/**
 * node 半边：
 * 1. GET /dsh-research-agent/cards|modules —— 从「科研模式」preset 目录读
 *    cards.yml / modules.yml 并以 JSON 返回，让卡片跟着 preset 走（改 YAML
 *    即生效）。preset 或文件缺失时返回 404，浏览器半边回退内置清单。
 * 2. 启动时确保科研专用工作区目录存在（开启模式时客户端会把它注册为工作区）。
 */
import { readFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parse } from 'yaml'

export const name = 'dsh-research-agent'

export const inject = ['webServer', 'agentPresets']

/** 卡片行（与浏览器半边 cards.ts 的 SituationCard 同形）。 */
interface CardRow {
  key: string
  title: string
  hint: string
  template: string
}

const PRESET_ID = 'research'
/** 科研专用工作区目录（客户端开关开启时注册为工作区并进入）。 */
export const RESEARCH_WORKSPACE_PATH = 'E:\\DeepSeek harness\\科研工作台'
/** 路由 → preset 目录内的 YAML 文件（同为 CardRow 列表）。 */
const YAML_ROUTES: Record<string, string> = {
  '/dsh-research-agent/cards': 'cards.yml',
  '/dsh-research-agent/modules': 'modules.yml',
}

function isCardRow(row: unknown): row is CardRow {
  if (typeof row !== 'object' || row === null) return false
  const record = row as Record<string, unknown>
  return ['key', 'title', 'hint', 'template']
    .every(field => typeof record[field] === 'string' && record[field] !== '')
}

/** 本插件真正触碰的 host 服务面（结构子集，见 dsh-host-webserver / dsh-agent-presets）。 */
interface HostCtx {
  effect(callback: () => () => void, label?: string): void
  webServer: {
    register(route: {
      kind: 'exact' | 'prefix'
      path: string
      handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
    }): () => void
  }
  agentPresets: {
    resolve(id?: string): Promise<{ path: string }>
  }
}

/** Loader 挂载入口。 */
export function apply(ctx: HostCtx): void {
  // 工作区目录先备好：客户端 create({path}) 只做注册，目录不存在会失败。
  ctx.effect(() => {
    void mkdir(RESEARCH_WORKSPACE_PATH, { recursive: true }).catch(() => {})
    return () => {}
  }, 'dsh-research-agent: workspace dir')

  for (const [route, file] of Object.entries(YAML_ROUTES)) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: route,
      handler: async (_req, res) => {
        try {
          const preset = await ctx.agentPresets.resolve(PRESET_ID)
          const text = await readFile(join(dirname(preset.path), file), 'utf8')
          const rows: unknown = parse(text)
          const cards = Array.isArray(rows) ? rows.filter(isCardRow) : []
          if (cards.length === 0) throw new Error(`${file} carries no valid card rows`)
          res.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          })
          res.end(JSON.stringify({ cards }))
        } catch {
          res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
          res.end('{"cards":[]}')
        }
      },
    }), `dsh-research-agent: ${file} route`)
  }
}
