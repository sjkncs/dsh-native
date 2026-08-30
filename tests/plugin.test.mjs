/* 插件测试：四个内置插件包（+ 共享核心库）的清单、构建产物与补丁声明完整性。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkgDir = (name) => path.join(root, 'packages', name)
const pkgJson = (name) => JSON.parse(readFileSync(path.join(pkgDir(name), 'package.json'), 'utf8'))

const PLUGINS = [
  { name: 'dsh-research-agent', entry: 'lib/index.js', version: '0.1.0' },
  { name: 'dsh-worktable', entry: 'lib/index.js', version: '0.2.2' },
  { name: 'dsh-reminder', entry: 'lib/index.js', version: '0.1.0' },
  { name: 'dsh-free-academic-search', entry: 'dist/index.js', version: '0.1.0' },
]

for (const { name, entry, version } of PLUGINS) {
  test(`${name}: package.json 基础字段`, () => {
    const pkg = pkgJson(name)
    assert.equal(pkg.name, name)
    assert.equal(pkg.version, version, `${name} 版本应锁定为 ${version}`)
    assert.ok(pkg.dsh, `${name} 应有 dsh 清单`)
    assert.ok(pkg.dsh.bundle && pkg.dsh.bundle.patch, `${name} 应声明 cordis patch`)
  })

  test(`${name}: 构建产物与补丁文件存在`, () => {
    assert.ok(existsSync(path.join(pkgDir(name), entry)), `${name} 缺 ${entry}`)
    assert.ok(existsSync(path.join(pkgDir(name), 'cordis.patch.yml')), `${name} 缺 cordis.patch.yml`)
  })

  test(`${name}: 源码随库分发（可审计、可重建）`, () => {
    assert.ok(existsSync(path.join(pkgDir(name), 'src')), `${name} 缺 src/`)
  })
}

test('dsh-worktable: 客户端产物存在（SVG 图标 + 数据速览窗补丁）', () => {
  assert.ok(existsSync(path.join(pkgDir('dsh-worktable'), 'lib', 'client.js')))
  const client = readFileSync(path.join(pkgDir('dsh-worktable'), 'lib', 'client.js'), 'utf8')
  assert.ok(client.length > 100_000, 'client.js 体积异常（补丁可能丢失）')
})

test('dsh-worktable: 图标别名映射仍在（旧数据兼容键）', () => {
  const src = readFileSync(path.join(pkgDir('dsh-worktable'), 'src', 'client', 'icons.tsx'), 'utf8')
  assert.ok(src.includes("'monitor'"), 'ALIASES 语义键缺失')
  assert.ok(/\\u\{1F9F1\}/.test(src), '旧版存储键（转义形式）应保留以兼容存量数据')
})

test('dsh-reminder: 通知预览图与双语文档齐全', () => {
  assert.ok(existsSync(path.join(pkgDir('dsh-reminder'), 'assets', 'toast-preview.svg')))
  assert.ok(existsSync(path.join(pkgDir('dsh-reminder'), 'README.md')))
  assert.ok(existsSync(path.join(pkgDir('dsh-reminder'), 'README.zh.md')))
})

test('free-academic-core: 共享核心库随库分发', () => {
  const pkg = pkgJson('free-academic-core')
  assert.equal(pkg.name, 'free-academic-core')
  assert.ok(existsSync(path.join(pkgDir('free-academic-core'), 'dist', 'index.js')))
})

test('dsh-free-academic-search: 依赖指向随库核心（非 workspace 协议）', () => {
  const pkg = pkgJson('dsh-free-academic-search')
  assert.equal(pkg.dependencies['free-academic-core'], 'file:../free-academic-core')
})

test('dsh-research-agent: 客户端入口与皮肤/工作台模块存在', () => {
  const srcDir = path.join(pkgDir('dsh-research-agent'), 'src', 'client')
  for (const f of ['index.tsx', 'skin.ts', 'workbench.tsx', 'cards.ts', 'locale.ts']) {
    assert.ok(existsSync(path.join(srcDir, f)), `缺 src/client/${f}`)
  }
})
