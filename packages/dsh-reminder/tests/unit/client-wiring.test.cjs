/**
 * Client wiring integration test (notification edition): boots the REAL
 * client bundle apply() in Node against a fake ctx/sessions runtime with a
 * fake Notification, driving the cross-window popup logic end-to-end:
 *   foreground -> NO popup (either kind)
 *   background + turn completes -> 「任务完成」 popup with duration
 *   background + approval arrives -> 「等待你的许可」 popup with toolName
 *   dedupe: same approval id / same turn never pops twice
 *   click -> focuses window and opens the session
 *   settings gate: approvalEnabled=false suppresses approval popups
 */
'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function createSnapshotStore(initial) {
  let snapshot = initial
  const listeners = new Set()
  return {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    set: (next) => {
      snapshot = next
      for (const fn of [...listeners]) fn()
    },
  }
}

// ---- fake browser environment ---------------------------------------------
let focusState = true // true = DSH window foreground
let windowFocused = 0
const notificationInstances = []

class FakeNotification {
  static permission = 'granted'
  static requestPermission = async () => 'granted'
  constructor(title, options) {
    this.title = title
    this.options = options
    this.closed = false
    notificationInstances.push(this)
  }
  close() {
    this.closed = true
  }
}

global.Notification = FakeNotification
global.document = {
  visibilityState: 'visible',
  hasFocus: () => focusState,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  getElementById: () => null,
  createElement: () => ({ setAttribute() {}, style: {}, appendChild() {} }),
  head: { appendChild() {} },
}
global.window = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  focus: () => { windowFocused += 1 },
}

function loadBundle() {
  const file = path.join(__dirname, '..', '..', 'lib', 'client.js')
  const code = fs.readFileSync(file, 'utf8')
  let handoff
  global.window.__ModuleLoader__ = { load: (h) => { handoff = h } }
  try {
    vm.runInThisContext(code, { filename: 'lib/client.js' })
  } finally {
    delete global.window.__ModuleLoader__
  }
  assert.ok(handoff, 'bundle handshake registered')
  return handoff.factory((spec) => {
    if (spec === '@deepseek-ai/dsh-client-runtime/client') return { createSnapshotStore }
    return {}
  })
}

function conversation(sessionId, overrides) {
  return {
    sessionId,
    running: false,
    lastAgentError: null,
    turnEnds: new Map(),
    turnTimings: new Map(),
    pending: [],
    openState: 'open',
    ...overrides,
  }
}

function buildRuntime() {
  const convStores = new Map()
  const sessionsList = createSnapshotStore({
    ids: ['s1'],
    byId: {
      s1: { id: 's1', displayTitle: 'Alpha', running: false, pendingInteraction: undefined, completed: undefined },
    },
    current: 's1',
  })
  const opened = []
  const sessions = {
    list: {
      getSnapshot: () => sessionsList.getSnapshot(),
      subscribe: (fn) => sessionsList.subscribe(fn),
    },
    binding: (id) => {
      let store = convStores.get(id)
      if (store === undefined) {
        store = createSnapshotStore(conversation(id))
        convStores.set(id, store)
      }
      return {
        session: {
          getSnapshot: () => store.getSnapshot(),
          subscribe: (fn) => store.subscribe(fn),
        },
      }
    },
    open: (id) => {
      opened.push(id)
    },
  }
  return { sessions, sessionsList, convStores, opened }
}

function buildHarness() {
  const { sessions, sessionsList, convStores, opened } = buildRuntime()
  const resetHandlers = []
  let settingsValue = {
    approvalEnabled: true,
    completionEnabled: true,
    completionDuration: 8,
    approvalClosable: true,
    maxStack: 5,
    failureEnabled: false,
  }
  const remoteFace = {
    getSettings: async () => ({ ok: true, value: settingsValue }),
    updateSettings: async (update) => {
      settingsValue = { ...settingsValue, [update.field]: update.value }
      return { ok: true, value: settingsValue }
    },
  }
  const ctx = {
    get: (name) => (name === 'sessions' ? sessions : undefined),
    effect: (fn) => {
      fn()
    },
    on: (name, handler) => {
      if (name === 'connection/reset') resetHandlers.push(handler)
      return () => undefined
    },
    locale: {
      register: () => () => undefined,
      bind: () => (key) => ({ 'popup.completion': '任务完成', 'popup.approval': '等待你的许可' })[key] ?? key,
      getSnapshot: () => ({ active: 'zh', revision: 1 }),
      subscribe: () => () => undefined,
    },
    remote: { $mount: async () => async () => undefined },
    reflect: { get: (name) => (name === 'remote.reminder' ? remoteFace : undefined) },
    slots: { inject: () => undefined, register: () => undefined },
  }
  return {
    ctx, sessions, sessionsList, convStores, opened,
    setSettings(value) { settingsValue = value },
    async reloadSettings() {
      for (const handler of resetHandlers) handler()
      await settle(10)
    },
  }
}

const flush = () => settle(30)

test('wiring: every turn completion pops regardless of focus', async () => {
  notificationInstances.length = 0
  focusState = true
  const exports = loadBundle()
  const harness = buildHarness()
  // 预置基线：apply 前已有 turn 2（不弹）
  harness.sessions.binding('s1')
  harness.convStores.get('s1').set(conversation('s1', { running: true, turnEnds: new Map([[2, 10]]) }))
  exports.apply(harness.ctx)
  await flush()

  // 回合结束：任何焦点状态下都弹（用户定稿：前台也弹）
  harness.convStores.get('s1').set(conversation('s1', { running: true, turnEnds: new Map([[2, 10], [3, 11]]) }))
  await flush()
  assert.equal(notificationInstances.length, 1, 'completion pops even in foreground')
  assert.equal(notificationInstances[0].title, '任务完成')
})

test('wiring: background completion pops 「任务完成」 with duration, once per turn', async () => {
  notificationInstances.length = 0
  focusState = false
  const exports = loadBundle()
  const harness = buildHarness()
  // 预置基线：apply 前会话已有 turn 2 结束（不弹）
  harness.sessions.binding('s1')
  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    turnEnds: new Map([[2, 10]]),
    turnTimings: new Map([[2, { startTime: 1000, endTime: 3200 }]]),
  }))
  exports.apply(harness.ctx)
  await flush()
  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    turnEnds: new Map([[2, 10], [3, 11]]),
    turnTimings: new Map([[2, { startTime: 1000, endTime: 3200 }], [3, { startTime: 4000, endTime: 8400 }]]),
  }))
  await flush()
  assert.equal(notificationInstances.length, 1, 'background: one completion popup')
  const popup = notificationInstances[0]
  assert.equal(popup.title, '任务完成')
  assert.match(popup.options.body, /Alpha/)
  assert.match(popup.options.body, /4s/)
  assert.equal(popup.options.silent, true)
  assert.equal(popup.options.actions, undefined, 'no actions: Chrome page notifications reject them')

  // 同一回合不重复弹
  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    turnEnds: new Map([[2, 10], [3, 11]]),
    turnTimings: new Map([[2, { startTime: 1000, endTime: 3200 }], [3, { startTime: 4000, endTime: 8400 }]]),
  }))
  await flush()
  assert.equal(notificationInstances.length, 1, 'dedupe: same turn does not pop twice')
})

test('wiring: background approval pops 「等待你的许可」, dedupes by id, click opens session', async () => {
  notificationInstances.length = 0
  focusState = false
  const exports = loadBundle()
  const harness = buildHarness()
  exports.apply(harness.ctx)
  await flush()

  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    pending: [{ kind: 'approval', payload: { approvalId: 'a1', toolName: 'bash' } }],
  }))
  const snap = harness.sessionsList.getSnapshot()
  harness.sessionsList.set({
    ...snap,
    byId: { ...snap.byId, s1: { ...snap.byId.s1, pendingInteraction: 'approval' } },
  })
  await flush()
  assert.equal(notificationInstances.length, 1, 'one approval popup')
  assert.equal(notificationInstances[0].title, '等待你的许可')
  assert.match(notificationInstances[0].options.body, /bash/)

  // 同一审批 id 不重复
  harness.sessionsList.set({
    ...harness.sessionsList.getSnapshot(),
    byId: { ...harness.sessionsList.getSnapshot().byId, s1: { ...harness.sessionsList.getSnapshot().byId.s1, pendingInteraction: 'approval' } },
  })
  await flush()
  assert.equal(notificationInstances.length, 1, 'dedupe: same approval id pops once')

  // 点击弹窗 -> window.focus + sessions.open
  windowFocused = 0
  notificationInstances[0].onclick()
  assert.equal(windowFocused, 1, 'click focuses the DSH window')
  assert.deepEqual(harness.opened, ['s1'], 'click opens the session')

  // 新的审批 id -> 再弹
  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    pending: [{ kind: 'approval', payload: { approvalId: 'a2', toolName: 'write' } }],
  }))
  harness.sessionsList.set({
    ...harness.sessionsList.getSnapshot(),
    byId: { ...harness.sessionsList.getSnapshot().byId, s1: { ...harness.sessionsList.getSnapshot().byId.s1, pendingInteraction: 'approval' } },
  })
  await flush()
  assert.equal(notificationInstances.length, 2, 'new approval id pops again')
})

test('wiring: approvalEnabled=false suppresses approval popups', async () => {
  notificationInstances.length = 0
  focusState = false
  const exports = loadBundle()
  const harness = buildHarness()
  exports.apply(harness.ctx)
  await flush()

  harness.setSettings({
    approvalEnabled: false,
    completionEnabled: true,
    completionDuration: 8,
    approvalClosable: true,
    maxStack: 5,
    failureEnabled: false,
  })
  await harness.reloadSettings()

  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    pending: [{ kind: 'approval', payload: { approvalId: 'a3', toolName: 'bash' } }],
  }))
  const snap = harness.sessionsList.getSnapshot()
  harness.sessionsList.set({
    ...snap,
    byId: { ...snap.byId, s1: { ...snap.byId.s1, pendingInteraction: 'approval' } },
  })
  await flush()
  assert.equal(notificationInstances.length, 0, 'gate off: no approval popup')
})
test('wiring: background session running→idle fires without the platform completed flag', async () => {
  notificationInstances.length = 0
  focusState = false
  const exports = loadBundle()
  const harness = buildHarness()
  exports.apply(harness.ctx)
  await flush()

  // 列表出现第二个后台会话 s2，running=true（基线记录），随后 running→false
  let snap = harness.sessionsList.getSnapshot()
  harness.sessionsList.set({
    ...snap,
    ids: ['s1', 's2'],
    byId: {
      ...snap.byId,
      s2: { id: 's2', displayTitle: 'Beta', running: true, pendingInteraction: undefined, completed: undefined },
    },
  })
  snap = harness.sessionsList.getSnapshot()
  harness.sessionsList.set({
    ...snap,
    byId: { ...snap.byId, s2: { ...snap.byId.s2, running: false } },
  })
  await flush()
  const popup = notificationInstances.find((n) => n.options.tag.includes('s2'))
  assert.ok(popup, 'running→idle fallback pops for the background session')
  assert.equal(popup.title, '任务完成')
})

test('wiring: re-attaching a session absorbs historical turns (no late popup)', async () => {
  notificationInstances.length = 0
  focusState = false
  const exports = loadBundle()
  const harness = buildHarness()
  // 真实时序：切回会话时窗口还在重建（openState='loading'，历史尚未到达）
  harness.sessions.binding('s1')
  harness.convStores.get('s1').set(conversation('s1', {
    running: false,
    openState: 'loading',
    turnEnds: new Map(),
  }))
  exports.apply(harness.ctx)
  await flush()

  // history 陆续到达（仍 loading）：全部进基线，不弹
  harness.convStores.get('s1').set(conversation('s1', {
    running: false,
    openState: 'loading',
    turnEnds: new Map([[4, 40], [5, 50]]),
  }))
  // 窗口 open：历史回合吸收完成，仍不弹
  harness.convStores.get('s1').set(conversation('s1', {
    running: false,
    openState: 'open',
    turnEnds: new Map([[4, 40], [5, 50]]),
  }))
  await flush()
  assert.equal(notificationInstances.length, 0, 'historical turns are absorbed into the baseline')

  // 之后真正的新回合结束才弹
  harness.convStores.get('s1').set(conversation('s1', {
    running: true,
    openState: 'open',
    turnEnds: new Map([[4, 40], [5, 50], [6, 60]]),
  }))
  await flush()
  const popup = notificationInstances.find((n) => n.options.tag.includes('#turn6'))
  assert.ok(popup, 'new turn after the window opened pops normally')
})
