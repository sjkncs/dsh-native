/**
 * Client bundle smoke test: materializes lib/client.js under a fake
 * ModuleLoader handshake (no jsdom needed) and asserts the factory exports,
 * the plugin identity, and that every external require stays inside the
 * declared externals (react / react-dom / @deepseek-ai scopes). Catches
 * handshake and require-typo regressions without a browser.
 */
'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

test('client bundle materializes under the ModuleLoader handshake', () => {
  const file = path.join(__dirname, '..', '..', 'lib', 'client.js')
  const code = fs.readFileSync(file, 'utf8')
  let handoff
  global.window = {
    __ModuleLoader__: {
      load: (h) => { handoff = h },
    },
  }
  try {
    vm.runInThisContext(code, { filename: 'lib/client.js' })
  } finally {
    delete global.window
  }
  assert.ok(handoff, 'bundle registered a factory handshake')
  assert.equal(handoff.id, 'dsh-reminder')

  const specs = []
  const requireStub = (spec) => {
    specs.push(spec)
    return {}
  }
  const exports = handoff.factory(requireStub)
  assert.equal(typeof exports.apply, 'function', 'client exports apply()')
  // 客户端 bundle 不导出 name（身份由 dsh.plugin.json / 握手 id 提供）
  assert.deepEqual(exports.inject, ['sessions', 'connection', 'remote', 'slots', 'locale'])

  for (const spec of specs) {
    assert.match(
      spec,
      /^(react|react-dom|scheduler|@deepseek-ai\/)/,
      'unexpected external require: ' + spec,
    )
  }
  const runtimeSpecs = specs.filter((spec) => spec.startsWith('@deepseek-ai/'))
  for (const spec of runtimeSpecs) {
    assert.match(
      spec,
      /^@deepseek-ai\/(dsh-client-runtime|dsh-client-ui-slots|dsh-client-ui-settings|dsh-client-locale|dsh-client-connection|dsh-api-remotes)\//,
      'runtime require outside the declared inject list: ' + spec,
    )
  }
})

test('host bundle parses and keeps the settings import external', () => {
  const file = path.join(__dirname, '..', '..', 'lib', 'index.js')
  const code = fs.readFileSync(file, 'utf8')
  assert.match(code, /from "@deepseek-ai\/dsh-settings"/, 'settings import stays external')
  assert.match(code, /export \{[\s\S]*\bname\b[\s\S]*\}/, 'host exports name')
})
