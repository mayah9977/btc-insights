import { processExtremeEvent } from '@/lib/extreme/processExtremeEvent';

/**
 * 🔥 Extreme 이벤트 수신 예제
 * - WebSocket / SSE / polling 공통 사용 가능
 */
export function onExtremeEventReceived(raw: any) {
  /**
   * raw 예시:
   * {
   *   type: 'WHALE_ACTIVITY',
   *   score: 87.23
   * }
   */

  processExtremeEvent({
    type: raw.type,
    score: raw.score,
  });
}
