type Stat = {
  received: number
  dropped: number
}

/**
 * ⚠️ 전역 단일 인스턴스
 * - SSE / WS 상태 표시용
 * - UI 리렌더를 유발하지 않도록 React state 사용 ❌
 */
const stat: Stat = {
  received: 0,
  dropped: 0,
}

let lastReceivedAt = Date.now()

/**
 * 메시지 정상 수신 시 호출
 */
export function markMessageReceived() {
  stat.received++
  lastReceivedAt = Date.now()
}

/**
 * 주기적으로 호출하여 Drop 여부 판단
 * - timeout 초과 시 1회만 drop 카운트
 */
export function checkDrop(timeoutMs = 5000) {
  const now = Date.now()

  if (now - lastReceivedAt > timeoutMs) {
    stat.dropped++
    lastReceivedAt = now // 중복 증가 방지
  }
}

/**
 * 스트림 품질 지표 반환 (읽기 전용)
 */
export function getStreamQuality() {
  const total = stat.received + stat.dropped

  const dropRate =
    total === 0 ? 0 : stat.dropped / total

  return {
    received: stat.received,
    dropped: stat.dropped,
    dropRate,
  }
}
