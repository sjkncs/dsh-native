/* 站点测试：snapshot.json 数据契约与措辞红线。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snap = JSON.parse(readFileSync(path.join(root, 'site', 'data', 'snapshot.json'), 'utf8'))

const isLeaf = (v) => v && typeof v === 'object' && ('zh' in v || 'en' in v)

test('snapshot.json: meta 基础字段与阶段措辞', () => {
  const m = snap.meta
  assert.equal(m.name, 'dsh-native')
  assert.equal(m.repo, 'https://github.com/sjkncs/dsh-native')
  assert.ok(m.pages.startsWith('https://sjkncs.github.io/dsh-native'))
  assert.ok(isLeaf(m.stage), 'stage 必须是双语叶')
  assert.equal(m.stage.zh, '正式版', '阶段措辞必须是「正式版」')
  assert.equal(m.stage.en, 'GA')
  assert.equal(m.host, '@deepseek-ai/dsh@0.1.1-rc.2', '宿主版本必须锁定')
  assert.ok(!JSON.stringify(snap).includes('预览版'), '全站禁用「预览版」')
  assert.ok(!JSON.stringify(snap).includes('测试版'), '全站禁用「测试版」')
})

test('snapshot.json: i18n 双语键完全对齐', () => {
  const zh = Object.keys(snap.i18n.zh).sort()
  const en = Object.keys(snap.i18n.en).sort()
  assert.deepEqual(zh, en, 'i18n.zh 与 i18n.en 的键必须一致')
  assert.ok(zh.length >= 40, `i18n 键数量异常：${zh.length}`)
})

test('snapshot.json: index.html 的 data-i18n 键全部有定义', () => {
  const html = readFileSync(path.join(root, 'site', 'index.html'), 'utf8')
  const used = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1])
  assert.ok(used.length >= 30, `data-i18n 节点数异常：${used.length}`)
  const missing = used.filter((k) => snap.i18n.zh[k] == null || snap.i18n.en[k] == null)
  assert.deepEqual(missing, [], `缺少 i18n 定义：${missing.join(', ')}`)
})

test('snapshot.json: kpis / stack / presets / research / redlines / roadmap 完整', () => {
  assert.equal(snap.kpis.length, 4, 'KPI 数量')
  for (const k of snap.kpis) assert.ok(isLeaf(k.label), `KPI label 需双语：${k.num}`)

  assert.equal(snap.stack.length, 8, '插件栈应含宿主 + 7 插件')
  const origins = new Set(snap.stack.map((p) => p.origin))
  assert.deepEqual([...origins].sort(), ['community', 'official', 'vendored'])
  assert.equal(snap.stack.filter((p) => p.origin === 'vendored').length, 4, '内置插件应为 4 个')
  assert.equal(snap.stack.filter((p) => p.origin === 'community').length, 3, '社区插件应为 3 个')
  for (const p of snap.stack) {
    assert.ok(p.name && p.version, `栈条目缺名称/版本：${p.key}`)
    assert.ok(isLeaf(p.role), `栈条目 role 需双语：${p.key}`)
  }

  assert.equal(snap.presets.length, 3, '预设数量')
  const names = snap.presets.map((p) => p.name)
  assert.deepEqual(names, ['Research Mode', 'Modeling & Coding Agent', 'Paper Agent'])
  for (const p of snap.presets) {
    assert.ok(isLeaf(p.tagline), `预设 tagline 需双语：${p.key}`)
    assert.equal(p.points.length, 3, `预设 ${p.key} 要点数应为 3`)
    for (const pt of p.points) assert.ok(isLeaf(pt), `预设 ${p.key} 要点需双语`)
  }

  assert.equal(snap.research.modules.length, 5, '科研工作台模块数')
  assert.equal(snap.research.cards.length, 6, '情境卡数')
  for (const m of snap.research.modules) assert.ok(isLeaf(m))
  for (const c of snap.research.cards) assert.ok(isLeaf(c))

  assert.ok(snap.redlines.length >= 5, '红线过少')
  for (const r of snap.redlines) assert.ok(isLeaf(r))

  assert.ok(snap.roadmap.length >= 6, '路线图过短')
  assert.ok(snap.roadmap.some((r) => r.done), '路线图应有已完成项')
  assert.ok(snap.roadmap.some((r) => !r.done), '路线图应有待办项')
  for (const r of snap.roadmap) assert.ok(isLeaf(r.label))
})

test('站点静态文件齐全', () => {
  for (const f of [
    'site/index.html',
    'site/404.html',
    'site/assets/css/app.css',
    'site/assets/js/app.js',
    'site/assets/img/hero.svg',
    'site/data/snapshot.json',
  ]) {
    assert.ok(existsSync(path.join(root, f)), `缺文件：${f}`)
  }
})
