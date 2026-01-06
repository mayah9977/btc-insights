import { redis } from '../redis'

/* =========================
 * Types (Server)
 * ========================= */
export type AlertCondition =
  | 'ABOVE'
  | 'BELOW'
  | 'REACH'
  | 'PERCENT_UP'
  | 'PERCENT_DOWN'

export type RepeatMode = 'ONCE' | 'REPEAT'

export type PriceAlert = {
  id: string
  userId: string
  exchange: 'BINANCE'
  symbol: string

  /* =========================
   * Condition
   * ========================= */
  condition: AlertCondition

  // 가격 기반
  targetPrice?: number

  // % 기반
  basePrice?: number
  percent?: number

  // 🔥 트레일링 % (익절/손절용)
  trailingPercent?: number

  /* =========================
   * State
   * ========================= */
  enabled: boolean
  repeatMode: RepeatMode
  cooldownMs: number
  triggered: boolean
  lastTriggeredAt?: number

  /* =========================
   * Meta
   * ========================= */
  createdAt: number
  memo?: string
}

export type CreateAlertInput = {
  userId: string
  exchange: 'BINANCE'
  symbol: string
  condition: AlertCondition

  targetPrice?: number
  basePrice?: number
  percent?: number
  trailingPercent?: number

  repeatMode?: RepeatMode
  cooldownMs?: number
  memo?: string
}

const ALERT_KEY = 'alerts'

/* =========================
 * 조회
 * ========================= */
export async function listAlerts(userId: string): Promise<PriceAlert[]> {
  const raw = await redis.hgetall(ALERT_KEY)
  return Object.values(raw)
    .map(v => JSON.parse(v) as PriceAlert)
    .filter(a => a.userId === userId)
}

/* =========================
 * 엔진용 조회
 * ========================= */
export async function getActiveAlerts(symbol: string): Promise<PriceAlert[]> {
  const raw = await redis.hgetall(ALERT_KEY)
  return Object.values(raw)
    .map(v => JSON.parse(v) as PriceAlert)
    .filter(a => {
      if (!a.enabled) return false
      if (a.symbol !== symbol.toUpperCase()) return false
      if (a.repeatMode === 'ONCE' && a.triggered) return false
      return true
    })
}

/* =========================
 * 생성
 * ========================= */
export async function createAlert(input: CreateAlertInput) {
  const now = Date.now()

  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    userId: input.userId,
    exchange: input.exchange,
    symbol: input.symbol.toUpperCase(),

    condition: input.condition,
    targetPrice: input.targetPrice,
    basePrice: input.basePrice,
    percent: input.percent,
    trailingPercent: input.trailingPercent,

    enabled: true,
    repeatMode: input.repeatMode ?? 'ONCE',
    cooldownMs: input.cooldownMs ?? 0,

    triggered: false,
    createdAt: now,
    memo: input.memo,
  }

  await redis.hset(ALERT_KEY, alert.id, JSON.stringify(alert))
  return alert
}

/* =========================
 * 수정
 * ========================= */
export async function updateAlert(
  id: string,
  patch: Partial<PriceAlert>,
) {
  const raw = await redis.hget(ALERT_KEY, id)
  if (!raw) return null

  const next: PriceAlert = {
    ...(JSON.parse(raw) as PriceAlert),
    ...patch,
  }

  await redis.hset(ALERT_KEY, id, JSON.stringify(next))
  return next
}

/* =========================
 * 삭제
 * ========================= */
export async function deleteAlert(id: string) {
  await redis.hdel(ALERT_KEY, id)
}

/* =========================
 * 트리거 처리
 * ========================= */
export async function markAlertTriggered(id: string) {
  const raw = await redis.hget(ALERT_KEY, id)
  if (!raw) return

  const alert = JSON.parse(raw) as PriceAlert
  const now = Date.now()

  const next: PriceAlert = {
    ...alert,
    lastTriggeredAt: now,
    triggered:
      alert.repeatMode === 'ONCE'
        ? true
        : alert.triggered,
  }

  await redis.hset(ALERT_KEY, id, JSON.stringify(next))
}
