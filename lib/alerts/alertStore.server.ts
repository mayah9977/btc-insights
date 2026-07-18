//lib/alerts/alertStore.server.ts

import { redis } from '../redis'
import type {
  AlertCondition,
  AlertRepeatMode,
  PriceAlert,
} from './alertTypes'

/* =========================
 * Create Input
 * ========================= */
export type CreateAlertInput = {
  userId: string
  exchange: 'BINANCE'
  symbol: string
  condition: AlertCondition

  // 절대값 조건
  targetPrice?: number

  // % 조건
  basePrice?: number
  percent?: number

  repeatMode?: AlertRepeatMode
  cooldownMs?: number
  memo?: string
}

/* =========================
 * Redis Key
 * ========================= */
const ALERT_KEY = 'alerts'

/* =========================
 * 조회 (UI)
 * ========================= */
export async function listAlerts(
  userId: string,
): Promise<PriceAlert[]> {
  const raw = await redis.hgetall(ALERT_KEY)

  return Object.values(raw)
    .map(v => JSON.parse(v) as PriceAlert)
    .filter(a => a.userId === userId)
}

/* =========================
 * 조회 (Engine)
 * ✅ SSOT: status === 'WAITING' 만 평가
 * ========================= */
export async function getActiveAlerts(
  symbol: string,
): Promise<PriceAlert[]> {
  const raw = await redis.hgetall(ALERT_KEY)

  return Object.values(raw)
    .map(v => JSON.parse(v) as PriceAlert)
    .filter(a => {
      if (a.symbol !== symbol.toUpperCase()) return false
      if (a.status !== 'WAITING') return false
      return true
    })
}

/* =========================
 * 생성
 * ========================= */
export async function createAlert(
  input: CreateAlertInput,
): Promise<PriceAlert> {
  const now = Date.now()

  const alert: PriceAlert = {
    /* identity */
    id: crypto.randomUUID(),
    userId: input.userId,
    exchange: input.exchange,
    symbol: input.symbol.toUpperCase(),

    /* condition */
    condition: input.condition,
    targetPrice: input.targetPrice,
    basePrice: input.basePrice,
    percent: input.percent,

    /* state (SSOT) */
    status: 'WAITING',
    repeatMode: input.repeatMode ?? 'ONCE',
    cooldownMs: input.cooldownMs ?? 0,
    lastTriggeredAt: undefined,

    /* meta */
    createdAt: now,
    memo: input.memo,
  }

  console.log('[CREATE_ALERT][REDIS_WRITE]', alert)

  await redis.hset(ALERT_KEY, alert.id, JSON.stringify(alert))
  return alert
}

/* =========================
 * 수정 (PATCH)
 * ✅ status SSOT 보호
 * ========================= */
export async function updateAlert(
  id: string,
  patch: Partial<PriceAlert>,
): Promise<PriceAlert | null> {
  const raw = await redis.hget(ALERT_KEY, id)
  if (!raw) return null

  const prev = JSON.parse(raw) as PriceAlert

  const next: PriceAlert = {
    ...prev,
    ...patch,

    // 🔒 이미 TRIGGERED 된 알림은 되돌리지 않음
    status:
      prev.status === 'TRIGGERED'
        ? 'TRIGGERED'
        : patch.status ?? prev.status,
  }

  await redis.hset(ALERT_KEY, id, JSON.stringify(next))
  return next
}

export async function updateAlertForUser(
  userId: string,
  id: string,
  patch: Partial<PriceAlert>,
): Promise<PriceAlert | null> {
  const raw = await redis.hget(ALERT_KEY, id)

  if (!raw) {
    return null
  }

  const alert = JSON.parse(raw) as PriceAlert

  if (alert.userId !== userId) {
    return null
  }

  const safePatch = {
    ...patch,
  }

  delete safePatch.id
  delete safePatch.userId
  delete safePatch.createdAt

  return updateAlert(id, safePatch)
}

/* =========================
 * 삭제
 * ========================= */
export async function deleteAlert(id: string) {
  await redis.hdel(ALERT_KEY, id)
}

export async function deleteAlertForUser(
  userId: string,
  id: string,
): Promise<boolean> {
  const raw = await redis.hget(ALERT_KEY, id)

  if (!raw) {
    return false
  }

  const alert = JSON.parse(raw) as PriceAlert

  if (alert.userId !== userId) {
    return false
  }

  await redis.hdel(ALERT_KEY, id)

  return true
}

/* =========================
 * 트리거 처리 (Engine 전용)
 * ✅ status만 변경 (SSOT)
 * ========================= */
export async function markAlertTriggered(id: string) {
  const raw = await redis.hget(ALERT_KEY, id)
  if (!raw) return

  const alert = JSON.parse(raw) as PriceAlert
  const now = Date.now()

  const next: PriceAlert = {
    ...alert,

    status:
      alert.repeatMode === 'ONCE'
        ? 'TRIGGERED'
        : 'WAITING',

    lastTriggeredAt: now,
  }

  await redis.hset(ALERT_KEY, id, JSON.stringify(next))
}
