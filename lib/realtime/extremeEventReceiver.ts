import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent'

/**
 * 🔥 Extreme 이벤트 수신
 * - WebSocket / SSE / polling 공통 사용
 * - ExtremeEvent 규격을 여기서 보정해서 맞춘다
 */
export function onExtremeEventReceived(raw: any) {
  /**
   * raw 예시:
   * {
   *   type: 'WHALE_ACTIVITY',
   *   score: 87.23,
   *   price: 93250.5            // ✅ 현재가 (있다고 가정)
   * }
   */

  const price =
    typeof raw.price === 'number' && Number.isFinite(raw.price)
      ? raw.price
      : 0 // ❗️fallback (실서비스에서는 반드시 price 주입 권장)

  processExtremeEvent({
    type: raw.type,
    score: raw.score,

    // ✅ ExtremeEvent 필수 필드
    entryPrice: price,
    worstPrice: price,
  })
}
