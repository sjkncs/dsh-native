/**
 * dsh-reminder client detection logic: pure diff helpers over the DSH
 * client snapshots (session list + staged conversation). No DOM, no React,
 * no package imports — unit-tested through the standalone test build.
 */
/** Interaction statuses the session list projects (see PendingInteractionStatus). */
export type InteractionStatus = 'approval' | 'plan-review' | 'question'

/** The session-list projection this controller consumes. */
export interface SessionRow {
  sessionId: string
  displayTitle: string
  running: boolean
  pendingInteraction?: InteractionStatus
  completed?: boolean
}

/** One pending approval wait from a conversation snapshot. */
export interface PendingApprovalView {
  approvalId: string
  toolName: string
  reason?: string
}

/** Turn timing pair from the conversation snapshot. */
export interface TurnTiming {
  startTime: number
  endTime?: number
}

/** The staged conversation projection this controller consumes. */
export interface StagedConversationView {
  running: boolean
  lastAgentError: string | null
  /** Sorted turn numbers with a recorded turn/end. */
  turnEnds: number[]
  turnTimings: ReadonlyMap<number, TurnTiming>
  pendingApprovals: PendingApprovalView[]
  /** Window state; 'loading' means the history rebuild is still in flight. */
  openState: string
}

/**
 * Completed-flag edge diff over the session list: rows whose completed bit
 * flipped from absent/false to true. First observation only records the
 * baseline (mirrors the app's own reminder semantics).
 */
export interface CompletedFlagDiff {
  additions: Array<{ sessionId: string; displayTitle: string }>
}

export function diffCompletedFlags(
  prev: ReadonlyMap<string, boolean> | undefined,
  next: ReadonlyMap<string, SessionRow>,
): CompletedFlagDiff {
  if (prev === undefined) return { additions: [] }
  const additions: CompletedFlagDiff['additions'] = []
  for (const [id, row] of next) {
    const nowCompleted = row.completed === true
    const wasCompleted = prev.get(id) === true
    if (nowCompleted && !wasCompleted) {
      additions.push({ sessionId: id, displayTitle: row.displayTitle })
    }
  }
  return { additions }
}

/**
 * Running→idle edge diff over the session list for NON-current sessions:
 * a background session that just stopped running counts as a completion
 * signal (fallback when the platform's own completed flag does not arm).
 * First observation only records the baseline.
 */
export interface RunningIdleDiff {
  additions: Array<{ sessionId: string; displayTitle: string }>
}

export function diffRunningIdle(
  prev: ReadonlyMap<string, boolean> | undefined,
  next: ReadonlyMap<string, SessionRow>,
  current: string | undefined,
): RunningIdleDiff {
  if (prev === undefined) return { additions: [] }
  const additions: RunningIdleDiff['additions'] = []
  for (const [id, row] of next) {
    if (id === current) continue
    const wasRunning = prev.get(id) === true
    const nowRunning = row.running === true
    if (wasRunning && !nowRunning) {
      additions.push({ sessionId: id, displayTitle: row.displayTitle })
    }
  }
  return { additions }
}

/** Staged-conversation edge diff: every fresh turn end without an agent error. */
export interface StagedDiff {
  completedTurn?: { turn: number; startTime?: number; endTime?: number }
}

export function diffStagedConversation(
  prev: StagedConversationView | undefined,
  next: StagedConversationView,
): StagedDiff {
  if (prev === undefined) return {}
  if (next.lastAgentError !== null) return {}
  const prevLast = prev.turnEnds.length > 0 ? prev.turnEnds[prev.turnEnds.length - 1] : -1
  const nextLast = next.turnEnds.length > 0 ? next.turnEnds[next.turnEnds.length - 1] : -1
  if (nextLast <= prevLast) return {}
  const timing = next.turnTimings.get(nextLast)
  return {
    completedTurn: {
      turn: nextLast,
      startTime: timing?.startTime,
      endTime: timing?.endTime,
    },
  }
}

/** Format a millisecond duration as "Xm Ys" / "Ys" / "<1s". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '<1s'
  if (ms < 1000) return '<1s'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return seconds + 's'
  return minutes + 'm ' + seconds + 's'
}
