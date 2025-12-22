import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent';

/**
 * VIP3 WebSocket Extreme 이벤트 리스너 예제
 */
export function attachWSExtremeListener(ws: WebSocket) {
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);

      /**
       * 기대 payload 예시:
       * {
       *   type: 'EXTREME_SIGNAL',
       *   payload: {
       *     type: 'WHALE_ACTIVITY',
       *     score: 91.3
       *   }
       * }
       */
      if (data.type === 'EXTREME_SIGNAL') {
        processExtremeEvent({
          type: data.payload.type,
          score: data.payload.score,
        });
      }
    } catch {
      // 무시 (깨진 패킷)
    }
  };
}
