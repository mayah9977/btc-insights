// lib/realtime/liveRiskTicker.ts
import { useLiveRiskState } from './liveRiskState'

let timer: NodeJS.Timeout | null = null

export function startLiveRiskTicker() {
  if (timer) return

  timer = setInterval(() => {
    const state = useLiveRiskState.getState().state
    if (!state) return

    // ❗ level은 그대로, 시간만 흐르게
    useLiveRiskState.getState().update({
      level: state.level,
      ts: Date.now(),
      whaleAccelerated: state.whaleAccelerated,
    })
  }, 1000)
}

export function stopLiveRiskTicker() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
