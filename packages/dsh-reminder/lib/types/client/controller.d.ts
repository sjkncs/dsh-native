/**
 * dsh-reminder client detection logic: pure diff helpers over the DSH
 * client snapshots (session list + staged conversation). No DOM, no React,
 * no package imports — unit-tested through the standalone test build.
 */
/** Interaction statuses the session list projects (see PendingInteractionStatus). */
export type InteractionStatus = 'approval' | 'plan-review' | 'question';
/** The session-list projection this controller consumes. */
export interface SessionRow {
    sessionId: string;
    displayTitle: string;
    running: boolean;
    pendingInteraction?: InteractionStatus;
    completed?: boolean;
}
/** One pending approval wait from a conversation snapshot. */
export interface PendingApprovalView {
    approvalId: string;
    toolName: string;
    reason?: string;
}
/** Turn timing pair from the conversation snapshot. */
export interface TurnTiming {
    startTime: number;
    endTime?: number;
}
/** The staged conversation projection this controller consumes. */
export interface StagedConversationView {
    running: boolean;
    lastAgentError: string | null;
    /** Sorted turn numbers with a recorded turn/end. */
    turnEnds: number[];
    turnTimings: ReadonlyMap<number, TurnTiming>;
    pendingApprovals: PendingApprovalView[];
    /** Window state; 'loading' means the history rebuild is still in flight. */
    openState: string;
}
/**
 * Completed-flag edge diff over the session list: rows whose completed bit
 * flipped from absent/false to true. First observation only records the
 * baseline (mirrors the app's own reminder semantics).
 */
export interface CompletedFlagDiff {
    additions: Array<{
        sessionId: string;
        displayTitle: string;
    }>;
}
export declare function diffCompletedFlags(prev: ReadonlyMap<string, boolean> | undefined, next: ReadonlyMap<string, SessionRow>): CompletedFlagDiff;
/**
 * Running→idle edge diff over the session list for NON-current sessions:
 * a background session that just stopped running counts as a completion
 * signal (fallback when the platform's own completed flag does not arm).
 * First observation only records the baseline.
 */
export interface RunningIdleDiff {
    additions: Array<{
        sessionId: string;
        displayTitle: string;
    }>;
}
export declare function diffRunningIdle(prev: ReadonlyMap<string, boolean> | undefined, next: ReadonlyMap<string, SessionRow>, current: string | undefined): RunningIdleDiff;
/** Staged-conversation edge diff: every fresh turn end without an agent error. */
export interface StagedDiff {
    completedTurn?: {
        turn: number;
        startTime?: number;
        endTime?: number;
    };
}
export declare function diffStagedConversation(prev: StagedConversationView | undefined, next: StagedConversationView): StagedDiff;
/** Format a millisecond duration as "Xm Ys" / "Ys" / "<1s". */
export declare function formatDuration(ms: number): string;
