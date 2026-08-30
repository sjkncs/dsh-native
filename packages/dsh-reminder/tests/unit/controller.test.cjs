/**
 * Unit tests for the dsh-reminder client detection logic (pure).
 * Run with: node tests/unit/controller.test.cjs
 * The controller is built to lib-testing/controller.cjs by build.mjs.
 */
'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  diffCompletedFlags,
  diffRunningIdle,
  diffStagedConversation,
  formatDuration,
} = require('../../lib-testing/controller.cjs')
const { defaultReminderSettings, normalizeReminderSettings } = require('../../lib-testing/contract.cjs')

const row = (overrides) => ({
  sessionId: 's1',
  displayTitle: 'Session 1',
  running: false,
  ...overrides,
})

const staged = (overrides) => ({
  running: false,
  lastAgentError: null,
  turnEnds: [],
  turnTimings: new Map(),
  pendingApprovals: [],
  openState: 'open',
  ...overrides,
})

// ---- diffCompletedFlags ------------------------------------------------------

test('diffCompletedFlags: first observation only baselines (no fires)', () => {
  const next = new Map([['s1', row({ completed: true })]])
  const diff = diffCompletedFlags(undefined, next)
  assert.deepEqual(diff.additions, [])
})

test('diffCompletedFlags: false→true edge fires once per session', () => {
  const prev = new Map([['s1', false], ['s2', false]])
  const next = new Map([
    ['s1', row({ sessionId: 's1', completed: true })],
    ['s2', row({ sessionId: 's2', completed: false })],
    ['s3', row({ sessionId: 's3', completed: true })],
  ])
  const diff = diffCompletedFlags(prev, next)
  assert.deepEqual(diff.additions, [
    { sessionId: 's1', displayTitle: 'Session 1' },
    { sessionId: 's3', displayTitle: 'Session 1' },
  ])
  const again = diffCompletedFlags(new Map([['s1', true], ['s3', true]]), next)
  assert.deepEqual(again.additions, [])
})

// ---- diffStagedConversation --------------------------------------------------

test('diffStagedConversation: baseline (undefined prev) never fires', () => {
  const diff = diffStagedConversation(undefined, staged({ running: false, turnEnds: [3] }))
  assert.deepEqual(diff, {})
})

test('diffStagedConversation: same turn set never fires', () => {
  const diff = diffStagedConversation(staged({ running: true, turnEnds: [3] }), staged({ running: true, turnEnds: [3] }))
  assert.deepEqual(diff, {})
})

test('diffStagedConversation: every fresh turn end fires with timing (running still true)', () => {
  const prev = staged({ running: true, turnEnds: [2] })
  const next = staged({
    running: true,
    turnEnds: [2, 3],
    turnTimings: new Map([[3, { startTime: 1000, endTime: 5400 }]]),
  })
  const diff = diffStagedConversation(prev, next)
  assert.deepEqual(diff, { completedTurn: { turn: 3, startTime: 1000, endTime: 5400 } })
})

test('diffStagedConversation: agent error suppresses the fire', () => {
  const prev = staged({ running: true, turnEnds: [2] })
  const next = staged({ running: true, turnEnds: [2, 3], lastAgentError: 'boom' })
  assert.deepEqual(diffStagedConversation(prev, next), {})
})

test('diffStagedConversation: no new turn end does not fire', () => {
  const prev = staged({ running: true, turnEnds: [2] })
  const next = staged({ running: false, turnEnds: [2] })
  assert.deepEqual(diffStagedConversation(prev, next), {})
})

// ---- diffRunningIdle -------------------------------------------------------------

test('diffRunningIdle: first observation only baselines', () => {
  const next = new Map([['s1', row({ running: false })]])
  assert.deepEqual(diffRunningIdle(undefined, next, 's2'), { additions: [] })
})

test('diffRunningIdle: running→idle edge fires for non-current sessions only', () => {
  const prev = new Map([['s1', true], ['s2', true], ['s3', false]])
  const next = new Map([
    ['s1', row({ sessionId: 's1', running: false })],
    ['s2', row({ sessionId: 's2', running: false })],
    ['s3', row({ sessionId: 's3', running: false })],
  ])
  const diff = diffRunningIdle(prev, next, 's2') // s2 是当前会话，排除
  assert.deepEqual(diff.additions, [{ sessionId: 's1', displayTitle: 'Session 1' }])
})

test('diffRunningIdle: idle→idle and running→running never fire', () => {
  const prev = new Map([['s1', false], ['s2', true]])
  const next = new Map([
    ['s1', row({ sessionId: 's1', running: false })],
    ['s2', row({ sessionId: 's2', running: true })],
  ])
  assert.deepEqual(diffRunningIdle(prev, next, 's9'), { additions: [] })
})

// ---- formatters ----------------------------------------------------------------

test('formatDuration', () => {
  assert.equal(formatDuration(-1), '<1s')
  assert.equal(formatDuration(500), '<1s')
  assert.equal(formatDuration(45000), '45s')
  assert.equal(formatDuration(200000), '3m 20s')
  assert.equal(formatDuration(60000), '1m 0s')
})

// ---- normalizeReminderSettings --------------------------------------------------

test('normalizeReminderSettings: defaults fill missing fields', () => {
  assert.deepEqual(normalizeReminderSettings(undefined), defaultReminderSettings())
  assert.deepEqual(normalizeReminderSettings(null), defaultReminderSettings())
  assert.deepEqual(normalizeReminderSettings({}), defaultReminderSettings())
})

test('normalizeReminderSettings: clamps out-of-range numbers and fixes bad types', () => {
  const value = normalizeReminderSettings({
    completionDuration: 4.7,
    maxStack: 999,
    approvalEnabled: 'yes',
  })
  assert.equal(value.completionDuration, 5)
  assert.equal(value.maxStack, 10)
  assert.equal(value.approvalEnabled, true)
  const low = normalizeReminderSettings({ completionDuration: 1, maxStack: -3 })
  assert.equal(low.completionDuration, 3)
  assert.equal(low.maxStack, 1)
})
