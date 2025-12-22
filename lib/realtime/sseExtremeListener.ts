import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent';

/**
 * SSE Extreme 이벤트 리스너 예제
 */
export function attachSSEExtremeListener(es: EventSource) {
  es.addEventListener('EXTREME_SIGNAL', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);

      processExtremeEvent({
        type: data.type,
        score: data.score,
      });
    } catch {
      // 무시
    }
  });
}
