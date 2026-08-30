/**
 * Build for dsh-research-agent（配方照抄 E:\dsh-plugins\dsh-reminder\build.mjs）：
 * - 服务端半边：ESM，external 仅 @deepseek-ai/* 与 node 内建，`yaml` 内联进产物；
 * - 客户端半边：单文件 CJS，ModuleLoader factory 握手包装，@deepseek-ai/* 与
 *   react 系 external（宿主模块表运行时提供）。
 * esbuild JS API 优先；JS API 拿不到平台二进制时回退到已知可用的本地二进制。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const fallbackBinaries = [
  join(here, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe'),
  'E:/dsh-plugins/dsh-worktable/01_content/node_modules/@esbuild/win32-x64/esbuild.exe',
]

mkdirSync('lib', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']
// yaml 保持 external：其 dist 内含 require('process')，内联进 ESM 产物会
// 触发 "Dynamic require of process is not supported"；安装时随包附带副本。
const serverExternal = [...dshExternal, 'node:*', 'yaml']
const clientExternal = [...dshExternal, 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler']

const clientBanner = {
  js: "window.__ModuleLoader__.load({ id: 'dsh-research-agent', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
}
const clientFooter = {
  js: 'return module.exports; } });',
}

const jobs = [
  {
    entryPoints: ['src/index.ts'], outfile: 'lib/index.js',
    platform: 'node', format: 'esm', target: ['node22'],
    external: serverExternal,
  },
  {
    entryPoints: ['src/client/index.tsx'], outfile: 'lib/client.js',
    platform: 'browser', format: 'cjs', target: ['es2022'], jsx: 'automatic',
    external: clientExternal, banner: clientBanner, footer: clientFooter,
  },
]

const common = ['--bundle', '--sourcemap', '--log-level=info']

const toArgs = (job) => {
  const args = [...common]
  args.push(...job.entryPoints)
  args.push('--outfile=' + job.outfile)
  args.push('--platform=' + job.platform)
  args.push('--format=' + job.format)
  args.push(...job.target.map(t => '--target=' + t))
  if (job.jsx !== undefined) args.push('--jsx=' + job.jsx)
  for (const ext of job.external ?? []) args.push('--external:' + ext)
  if (job.banner !== undefined) args.push('--banner:js=' + job.banner.js)
  if (job.footer !== undefined) args.push('--footer:js=' + job.footer.js)
  return args
}

let done = false
try {
  const esbuild = await import('esbuild')
  for (const job of jobs) {
    await esbuild.build({ ...job, bundle: true, sourcemap: true, logLevel: 'info' })
  }
  done = true
} catch (error) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
  if (code !== 'EPERM' && code !== 'ERR_MODULE_NOT_FOUND') throw error
}

if (!done) {
  const binary = fallbackBinaries.find(candidate => existsSync(candidate))
  if (binary === undefined) throw new Error('no esbuild available: npm i -D esbuild, or fix the fallback binary path')
  for (const job of jobs) {
    execFileSync(binary, toArgs(job), { stdio: 'inherit' })
  }
}

console.log('dsh-research-agent: build ok → lib/index.js + lib/client.js')
