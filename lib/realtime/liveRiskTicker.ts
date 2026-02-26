// lib/realtime/liveRiskTicker.ts

/**
 * 🔥 Performance Optimized
 *
 * 기존:
 * - 1초마다 liveRiskState.update() 호출
 * - durationSec 갱신 목적
 *
 * 현재:
 * - durationSec store 제거
 * - 리스크는 SSE 기반 업데이트만 사용
 *
 * 따라서 ticker는 더 이상 사용하지 않음.
 */

export function startLiveRiskTicker() {
  // 🔕 no-op (intentionally disabled)
}

export function stopLiveRiskTicker() {
  // 🔕 no-op (intentionally disabled)
}
