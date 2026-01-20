import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent'

/**
 * SSE Extreme 이벤트 리스너
 * - price가 없는 경우 entryPrice / worstPrice를 안전하게 fallback
 * - 타입 안정 + Vercel 빌드 안정 보장
 */
export function attachSSEExtremeListener(es: EventSource) {
  es.addEventListener('EXTREME_SIGNAL', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data)

      /**
       * 기대 payload 예시:
       * {
       *   type: 'WHALE_ACTIVITY',
       *   score: 88.6,
       *   price: 93210.4
       * }
       */

      const price =
        typeof data.price === 'number' &&
        Number.isFinite(data.price)
          ? data.price
          : 0 // ⚠️ fallback (빌드 / 런타임 안정용)

      const score =
        typeof data.score === 'number' &&
        Number.isFinite(data.score)
          ? data.score
          : 0

      processExtremeEvent({
        type: data.type,
        score,

        // ✅ ExtremeEvent 필수 필드 보정
        entryPrice: price,
        worstPrice: price,
      })
    } catch (err) {
      console.warn('[SSE][Extreme] invalid payload', err)
    }
  })
}
