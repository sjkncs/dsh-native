/* 策略测试：全仓措辞红线（只写「正式版」，禁「预览版」「测试版」）与禁 emoji 扫描。
   扫描面向用户的文本产物；tests/ 与 DESIGN.md（红线定义处自引用）除外。
   packages 下的 lib 与 dist 为构建产物：本仓库已验证其内容干净，一并纳入扫描。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const TEXT_EXT = new Set(['.md', '.html', '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.yml', '.yaml', '.json', '.ps1', '.sh', '.svg'])
const SCAN_DIRS = ['site', 'presets', 'scripts', 'desktop', 'profile', 'settings', 'packages']
const SCAN_FILES = ['README.md', 'LICENSE']
const BANNED_WORDS = ['预览版', '测试版']

const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

function collect(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'tests' || name === 'test') continue
      collect(p, out)
    } else if (TEXT_EXT.has(path.extname(name))) {
      out.push(p)
    }
  }
  return out
}

const files = []
for (const d of SCAN_DIRS) collect(path.join(root, d), files)
for (const f of SCAN_FILES) if (existsSync(path.join(root, f))) files.push(path.join(root, f))

test('扫描面：覆盖全部用户可见产物目录', () => {
  assert.ok(files.length >= 120, `被扫描文件数异常：${files.length}`)
  const rel = files.map((f) => path.relative(root, f).replace(/\\/g, '/'))
  assert.ok(rel.some((f) => f.startsWith('site/')), '应扫描 site/')
  assert.ok(rel.some((f) => f.startsWith('packages/dsh-worktable/')), '应扫描 worktable')
  assert.ok(rel.some((f) => f.startsWith('packages/dsh-reminder/')), '应扫描 reminder')
  assert.ok(rel.some((f) => f.startsWith('presets/model-code/')), '应扫描 model-code 预设')
})

test('措辞红线：面向用户产物一律不出现「预览版」或「测试版」', () => {
  const hits = []
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    for (const banned of BANNED_WORDS) {
      if (src.includes(banned)) hits.push(`${path.relative(root, f)} [${banned}]`)
    }
  }
  assert.deepEqual(hits, [], `以下文件违反措辞红线：${hits.join(', ')}`)
})

test('禁 emoji：面向用户产物不含 emoji 码位', () => {
  const hits = []
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    const m = src.match(emoji)
    if (m) hits.push(`${path.relative(root, f)} -> U+${m[0].codePointAt(0).toString(16).toUpperCase()}`)
  }
  assert.deepEqual(hits, [], `以下文件含 emoji：${hits.join(', ')}`)
})

test('README 必须声明「正式版」阶段', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8')
  assert.ok(readme.includes('正式版'), 'README 应写明正式版阶段')
})

test('密钥卫生：仓库内不得出现疑似 API key', () => {
  const hits = []
  const keyLike = /sk-[a-zA-Z0-9]{16,}/
  for (const f of files) {
    if (keyLike.test(readFileSync(f, 'utf8'))) hits.push(path.relative(root, f))
  }
  assert.deepEqual(hits, [], `疑似密钥：${hits.join(', ')}`)
})
