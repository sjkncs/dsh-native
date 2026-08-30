/* 预设测试：三个内置预设（research / model-code / paper）的结构、红线与最小工具面不变量。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(path.join(root, p), 'utf8')

/* !!js 是 cordis 的 JS 表达式标签；测试只关心结构，把它还原成普通字符串。 */
const parseCordis = (p) => YAML.parse(read(p).replace(/!!js\s+/g, ''))

const PRESETS = ['research', 'model-code', 'paper']
const EXPECTED_CARDS = ['topic', 'literature', 'experiment', 'writing', 'review', 'submission']
const EXPECTED_MODULES = ['ideas', 'reading', 'experiment-log', 'draft', 'submission']
const FORBIDDEN_SERVICES = ['subagent', 'workflow', 'plan-mode', 'tool-goal', 'jobs']

test('三个预设目录齐全', () => {
  const dirs = readdirSync(path.join(root, 'presets'))
  for (const name of PRESETS) assert.ok(dirs.includes(name), `缺少预设：${name}`)
})

for (const name of PRESETS) {
  test(`${name}: preset.yml 名称/描述为英文且措辞合规`, () => {
    const preset = YAML.parse(read(`presets/${name}/preset.yml`))
    assert.ok(typeof preset.name === 'string' && preset.name.length > 2, `${name} 缺 name`)
    assert.match(preset.name, /^[\x20-\x7E]+$/, `${name} 显示名必须为纯英文（宿主不翻译用户预设名）`)
    assert.ok(typeof preset.description === 'string' && preset.description.length > 10)
    assert.match(preset.description, /^[\x20-\x7E\n]+$/, `${name} 描述必须为纯英文`)
    for (const banned of ['预览版', '测试版']) {
      assert.ok(!JSON.stringify(preset).includes(banned), `${name} 违反措辞红线：${banned}`)
    }
  })

  test(`${name}: agent.cordis.yml 可解析且包含 persona`, () => {
    const entries = parseCordis(`presets/${name}/agent.cordis.yml`)
    assert.ok(Array.isArray(entries) && entries.length >= 5, `${name} 服务清单过短`)
    const persona = entries.find((e) => e.id === 'persona')
    assert.ok(persona, `${name} persona 服务必须存在`)
    assert.equal(persona.name, '@deepseek-ai/dsh-persona')
  })

  test(`${name}: agent.cordis.yml 高权限能力必须缺席`, () => {
    const entries = parseCordis(`presets/${name}/agent.cordis.yml`)
    for (const entry of entries) {
      const hay = `${entry.id} ${entry.name}`.toLowerCase()
      for (const banned of FORBIDDEN_SERVICES) {
        assert.ok(!hay.includes(banned), `${name} 不应包含高权限服务：${banned}`)
      }
    }
  })

  test(`${name}: skills 目录非空`, () => {
    const skills = readdirSync(path.join(root, 'presets', name, 'skills'))
    assert.ok(skills.length >= 1, `${name} 应至少带一个技能包`)
  })
}

test('research: 显示名为 Research Mode', () => {
  const preset = YAML.parse(read('presets/research/preset.yml'))
  assert.equal(preset.name, 'Research Mode')
})

test('model-code / paper: 显示名固定', () => {
  assert.equal(YAML.parse(read('presets/model-code/preset.yml')).name, 'Modeling & Coding Agent')
  assert.equal(YAML.parse(read('presets/paper/preset.yml')).name, 'Paper Agent')
})

test('research: persona 红线三段式必须完整', () => {
  const entries = parseCordis('presets/research/agent.cordis.yml')
  const persona = entries.find((e) => e.id === 'persona')
  const text = persona.config.text
  for (const phrase of ['红线高于一切流程', '不编造数据', '不协助学术不端', '证据不足时明说不足']) {
    assert.ok(text.includes(phrase), `persona 缺少红线措辞：${phrase}`)
  }
})

test('research: 最小工具面——保留项齐全', () => {
  const entries = parseCordis('presets/research/agent.cordis.yml')
  const ids = new Set(entries.map((e) => e.id))
  for (const id of [
    'tool-bash',
    'tool-pwsh',
    'tool-fs',
    'tool-fs-search',
    'skill-filesystem',
    'tool-skill',
    'tool-ask-user',
    'tool-todo',
    'tool-web',
    'compaction',
  ]) {
    assert.ok(ids.has(id), `缺少服务：${id}`)
  }
})

test('research: compaction 组必须 isolate（防跨 preset 冲突）', () => {
  const entries = parseCordis('presets/research/agent.cordis.yml')
  const group = entries.find((e) => e.id === 'compaction')
  assert.ok(group, 'compaction 组必须存在')
  assert.equal(group.group, true)
  assert.ok(group.isolate && group.isolate.compaction, 'compaction 必须 isolate')
})

test('research: shell 按平台二选一（bash / pwsh 互斥）', () => {
  const raw = read('presets/research/agent.cordis.yml')
  assert.match(raw, /tool-bash[\s\S]*?win32/, 'bash 应有平台条件')
  assert.match(raw, /tool-pwsh[\s\S]*?win32/, 'pwsh 应有平台条件')
})

test('research: cards.yml 六张情境卡，字段齐全且 key 唯一', () => {
  const cards = YAML.parse(read('presets/research/cards.yml'))
  assert.equal(cards.length, EXPECTED_CARDS.length, '卡片数量应为 6')
  const keys = cards.map((c) => c.key)
  assert.deepEqual(keys.sort(), [...EXPECTED_CARDS].sort())
  for (const c of cards) {
    for (const f of ['key', 'title', 'hint', 'template']) {
      assert.ok(typeof c[f] === 'string' && c[f].trim() !== '', `卡片 ${c.key} 缺字段 ${f}`)
    }
  }
})

test('research: modules.yml 五个工作台模块回退源，key 唯一', () => {
  const modules = YAML.parse(read('presets/research/modules.yml'))
  assert.equal(modules.length, EXPECTED_MODULES.length, '模块数量应为 5')
  assert.deepEqual(
    modules.map((m) => m.key).sort(),
    [...EXPECTED_MODULES].sort(),
  )
  for (const m of modules) {
    for (const f of ['key', 'title', 'hint', 'template']) {
      assert.ok(typeof m[f] === 'string' && m[f].trim() !== '', `模块 ${m.key} 缺字段 ${f}`)
    }
  }
})
