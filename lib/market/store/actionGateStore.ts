/**
 * =========================================
 * Action Gate Store (SSOT)
 * - Market Interpretation Allow / Block State
 * - OBSERVE / CAUTION / IGNORE
 *
 * Rules:
 * - Write: marketRealtimeConsumer only
 * - Read: UI / SSE / hooks
 * - Update ONLY on state change
 * - No history persistence (snapshot only)
 * =========================================
 */

/* =========================
 * Types
 * ========================= */

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

export type ActionGateSnapshot = {
  state: ActionGateState
  updatedAt: number
}

/**
 * State transition log (for test / telemetry)
 * - History storage ❌
 * - External handling only
 */
export type ActionGateTransition = {
  symbol: string
  from: ActionGateState | null
  to: ActionGateState
  ts: number
}

/* =========================
 * Internal SSOT
 * ========================= */

// symbol → latest snapshot
const actionGateMap = new Map<string, ActionGateSnapshot>()

/* =========================
 * Optional transition logger
 * (can be replaced / mocked in tests)
 * ========================= */

let transitionLogger:
  | ((transition: ActionGateTransition) => void)
  | null = null

export function setActionGateTransitionLogger(
  logger: (transition: ActionGateTransition) => void,
) {
  transitionLogger = logger
}

/* =========================
 * Write API (consumer only)
 * ========================= */

/**
 * Update Action Gate state ONLY if changed
 *
 * @returns true  -> state changed
 * @returns false -> ignored (same state)
 */
export function updateActionGateState(
  symbol: string,
  nextState: ActionGateState,
): boolean {
  const prev = actionGateMap.get(symbol)

  if (prev?.state === nextState) {
    return false // ❌ no state change
  }

  const now = Date.now()
  const prevState = prev?.state ?? null

  actionGateMap.set(symbol, {
    state: nextState,
    updatedAt: now,
  })

  // fire transition log (if registered)
  if (transitionLogger) {
    transitionLogger({
      symbol,
      from: prevState,
      to: nextState,
      ts: now,
    })
  }

  return true // ✅ state updated
}

/* =========================
 * Read API (UI / hooks / SSE)
 * ========================= */

export function getActionGateSnapshot(
  symbol: string,
): ActionGateSnapshot | undefined {
  return actionGateMap.get(symbol)
}

/**
 * Convenience selector (UI-friendly)
 */
export function getActionGateState(
  symbol: string,
): ActionGateState | undefined {
  return actionGateMap.get(symbol)?.state
}
