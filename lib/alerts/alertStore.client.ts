/* =========================
 * Alert Conditions
 * ========================= */
export type AlertCondition =
  | 'ABOVE'         // 가격 이상 상승
  | 'BELOW'         // 가격 이하 하락
  | 'REACH'         // 정확히 도달
  | 'PERCENT_UP'    // % 이상 상승
  | 'PERCENT_DOWN'  // % 이상 하락

/* =========================
 * Repeat Mode
 * ========================= */
export type RepeatMode = 'ONCE' | 'REPEAT'

/* =========================
 * Core Alert Type (CLIENT)
 * 👉 UI / Engine / API 공통
 * ========================= */
export type PriceAlert = {
  /* identity */
  id: string
  userId: string

  /* market */
  exchange: 'BINANCE'
  symbol: string

  /* condition */
  condition: AlertCondition

  // 가격 기반
  targetPrice?: number

  // % 기반
  basePrice?: number
  percent?: number

  /* behavior */
  enabled: boolean
  repeatMode: RepeatMode
  cooldownMs: number

  /* state */
  triggered: boolean
  lastTriggeredAt?: number

  /* meta */
  createdAt: number
  memo?: string
}

/* =========================
 * UI Status
 * ========================= */
export type AlertStatus =
  | 'WAITING'
  | 'COOLDOWN'
  | 'ALREADY_TRIGGERED'
  | 'DISABLED'

/* =========================
 * Status Resolver (UI 전용)
 * ⚠️ 단일 기준 (중복 구현 금지)
 * ========================= */
export function getAlertStatus(alert: PriceAlert): AlertStatus {
  // 1️⃣ 완전 비활성
  if (!alert.enabled) {
    return 'DISABLED'
  }

  // 2️⃣ 1회성 + 이미 발동
  if (alert.repeatMode === 'ONCE' && alert.triggered) {
    return 'ALREADY_TRIGGERED'
  }

  // 3️⃣ 반복 알림 + 쿨타임 중
  if (
    alert.repeatMode === 'REPEAT' &&
    alert.cooldownMs > 0 &&
    alert.lastTriggeredAt &&
    Date.now() - alert.lastTriggeredAt < alert.cooldownMs
  ) {
    return 'COOLDOWN'
  }

  // 4️⃣ 기본 대기
  return 'WAITING'
}

/* =========================
 * UI Helper (밀도 & 비율용)
 * ========================= */

/**
 * 알림 중요도 (Row 정렬 / 강조용)
 * 값이 높을수록 시각적 우선순위 ↑
 */
export function getAlertPriority(alert: PriceAlert): number {
  const status = getAlertStatus(alert)

  switch (status) {
    case 'WAITING':
      return 3
    case 'COOLDOWN':
      return 2
    case 'ALREADY_TRIGGERED':
      return 1
    case 'DISABLED':
      return 0
    default:
      return 0
  }
}

/**
 * 모바일/리스트 밀도 계산용
 */
export function isInactiveAlert(alert: PriceAlert) {
  const status = getAlertStatus(alert)
  return status === 'DISABLED' || status === 'ALREADY_TRIGGERED'
}
