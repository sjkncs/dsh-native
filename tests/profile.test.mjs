/* Profile 清单测试：发行版 web profile 依赖/ bundles 与本机生产环境一致，设置模板安全。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(path.join(root, 'profile', 'package.json'), 'utf8'))

const VENDORED = ['dsh-free-academic-search', 'dsh-reminder', 'dsh-research-agent', 'dsh-worktable']
const COMMUNITY = ['@nanmicoder/dsh-agent-teams', '@sanqi-normal/dsh-webui-market-plugin', 'dsh-usage']

test('profile 清单：内置插件以 file: 指向随库 packages', () => {
  for (const name of VENDORED) {
    const spec = manifest.dependencies[name]
    assert.ok(spec && spec.startsWith('file:PACKAGES/'), `${name} 应为 file: 依赖`)
    const dir = path.join(root, 'packages', spec.slice('file:PACKAGES/'.length))
    assert.ok(existsSync(path.join(dir, 'package.json')), `${name} 的 vendored 目录缺 package.json`)
  }
})

test('profile 清单：社区插件按上游来源引用', () => {
  for (const name of COMMUNITY) {
    assert.ok(manifest.dependencies[name], `缺社区插件：${name}`)
  }
  assert.match(manifest.dependencies['dsh-usage'], /^github:Aisland-SJL\/dsh-usage/)
})

test('profile 清单：bundles 与生产环境一致（8 项）', () => {
  assert.deepEqual(manifest.dsh.profile.bundles, [
    '@deepseek-ai/dsh-base',
    '@deepseek-ai/dsh-web-app',
    'dsh-worktable',
    '@sanqi-normal/dsh-webui-market-plugin',
    '@nanmicoder/dsh-agent-teams',
    'dsh-usage',
    'dsh-reminder',
    'dsh-research-agent',
  ])
})

test('设置模板：可解析、默认科研预设、无密钥', () => {
  const raw = readFileSync(path.join(root, 'settings', 'settings.template.yaml'), 'utf8')
  const settings = YAML.parse(raw)
  assert.equal(settings['agent-presets'].default, 'research', '默认预设应为内置科研版')
  assert.equal(settings['agent-default-model'].provider, 'deepseek-official')
  assert.ok(!/sk-[a-zA-Z0-9]{16,}/.test(raw), '模板内不得含密钥')
  assert.ok(!/apiKey/i.test(raw), '模板内不得直接写 apiKey 字段')
})
