/**
 * Build for dsh-reminder: ESM host half + single-file CJS client half +
 * a standalone controller build for the node:test unit suite.
 *
 * The web server serves exactly one file per client plugin
 * (/plugins/dsh-reminder/client.js), so the client half is one CJS bundle
 * wrapped in the ModuleLoader factory handshake; @deepseek-ai/dsh-* and
 * react stay external (the bundle layers and the app's module system
 * provide them). The host half is plain ESM for Node, externalizing
 * @deepseek-ai/* plus cordis while bundling schemastery.
 *
 * Tooling: the esbuild JS API is preferred. When the JS API cannot spawn
 * its platform binary (e.g. a sandboxed runner that forbids piped child
 * stdio), the build falls back to invoking the platform binary directly
 * with inherited stdio. Type declarations are always emitted with tsc.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const localBinary = join(here, '..', '03_local', 'codes', 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe')

mkdirSync('lib', { recursive: true })
mkdirSync('lib-testing', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']
const clientExternal = [...dshExternal, 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler']

const clientBanner = {
  js: "window.__ModuleLoader__.load({ id: 'dsh-reminder', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
}
const clientFooter = {
  js: 'return module.exports; } });',
}

const jobs = [
  { entryPoints: ['src/index.ts'], outfile: 'lib/index.js', platform: 'node', format: 'esm', target: ['node22'], external: dshExternal },
  {
    entryPoints: ['src/client/index.ts'], outfile: 'lib/client.js', platform: 'browser', format: 'cjs',
    target: ['es2022'], jsx: 'automatic', external: clientExternal, banner: clientBanner, footer: clientFooter,
  },
  { entryPoints: ['src/client/controller.ts'], outfile: 'lib-testing/controller.cjs', platform: 'node', format: 'cjs', target: ['node22'] },
  { entryPoints: ['src/contract.ts'], outfile: 'lib-testing/contract.cjs', platform: 'node', format: 'cjs', target: ['node22'] },
]

const common = ['--bundle', '--sourcemap', '--log-level=info']

const runWithBinary = (args) => {
  execFileSync(localBinary, args, { stdio: 'inherit' })
}

const runWithApi = async (esbuild, job) => {
  await esbuild.build({
    ...job,
    bundle: true,
    sourcemap: true,
    logLevel: 'info',
  })
}

let apiFailed = false
try {
  const esbuild = await import('esbuild')
  for (const job of jobs) {
    await runWithApi(esbuild, job)
  }
} catch (error) {
  if (error === null || error === undefined) throw error
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
  if (code !== 'EPERM' && code !== 'ERR_MODULE_NOT_FOUND') throw error
  apiFailed = true
}

if (apiFailed) {
  const toArgs = (job) => {
    const args = [...common]
    args.push(...job.entryPoints)
    args.push('--outfile=' + job.outfile)
    args.push('--platform=' + job.platform)
    args.push('--format=' + job.format)
    args.push('--target=' + job.target[0])
    if (job.jsx !== undefined) args.push('--jsx=' + job.jsx)
    for (const ext of job.external ?? []) args.push('--external:' + ext)
    if (job.banner !== undefined) args.push('--banner:js=' + job.banner.js)
    if (job.footer !== undefined) args.push('--footer:js=' + job.footer.js)
    return args
  }
  console.log('[build] esbuild JS API unavailable (sandboxed runner); invoking the platform binary directly')
  for (const job of jobs) {
    runWithBinary(toArgs(job))
  }
}

execFileSync(process.execPath, ['node_modules/typescript/lib/tsc.js', '-p', 'tsconfig.json'], { stdio: 'inherit' })
