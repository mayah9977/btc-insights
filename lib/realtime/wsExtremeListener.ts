import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent'

/**
 * VIP3 WebSocket Extreme 이벤트 리스너
 * - payload 변형에도 안전
 * - ExtremeEvent 타입 완전 충족
 */
export function attachWSExtremeListener(ws: WebSocket) {
  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data)

      /**
       * 기대 payload 예시:
       * {
       *   type: 'EXTREME_SIGNAL',
       *   payload: {
       *     type: 'WHALE_ACTIVITY',
       *     score: 91.3,
       *     price: 93420.5
       *   }
       * }
       */
      if (data.type !== 'EXTREME_SIGNAL') return

      const payload = data.payload ?? {}

      const price =
        typeof payload.price === 'number' &&
        Number.isFinite(payload.price)
          ? payload.price
          : 0 // ⚠️ fallback (빌드 / 런타임 안정)

      const score =
        typeof payload.score === 'number' &&
        Number.isFinite(payload.score)
          ? payload.score
          : 0

      processExtremeEvent({
        type: payload.type,
        score,

        // ✅ ExtremeEvent 필수 필드 보정
        entryPrice: price,
        worstPrice: price,
      })
    } catch (err) {
      console.warn('[WS][Extreme] invalid payload', err)
    }
  }
}
