'use client'

import 'dotenv/config'

import { generateVipRiskSnapshot } from '../../lib/vip/summary/generateVipRiskSnapshot'
import type { RiskLevel } from '../../lib/vip/riskTypes'
import { createRedisSubscriber } from '../../lib/redis/index'

/* =========================
 * Redis Client
 * ========================= */
const redis = createRedisSubscriber()

/* =========================
 * Types (저장용)
 * ========================= */
type LastVipRiskRecord = {
  riskLevel: RiskLevel
  judgement: string
  confidence: number

  pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
  preExtreme?: boolean
  whaleAccelerated?: boolean

  ts: number
}

/* =========================
 * Data Access Layer
 * ========================= */
async function fetchLastVipRisk(): Promise<LastVipRiskRecord | null> {
  const raw = await redis.get('vip:lastRisk')
  if (!raw) return null

  try {
    return JSON.parse(raw) as LastVipRiskRecord
  } catch (e) {
    console.error('[VIP SNAPSHOT] invalid lastRisk JSON', e)
    return null
  }
}

async function saveVipRiskSnapshot(snapshot: any) {
  await redis.lpush(
    'vip:risk:snapshots',
    JSON.stringify(snapshot),
  )

  await redis.ltrim('vip:risk:snapshots', 0, 999)

  console.log('[VIP SNAPSHOT SAVE]', {
    ts: snapshot.ts,
    riskLevel: snapshot.riskLevel,
    summary: snapshot.summary,
  })
}

/* =========================
 * Cron Runner
 * ========================= */

async function run() {
  console.log('[VIP SNAPSHOT] generation start')

  try {
    const lastRisk = await fetchLastVipRisk()

    if (!lastRisk) {
      console.warn('[VIP SNAPSHOT] no last risk found — skip')
      return
    }

    // 🔥 핵심 수정 (인자 제거)
    const snapshot = generateVipRiskSnapshot()

    await saveVipRiskSnapshot(snapshot)

    console.log('[VIP SNAPSHOT] generation done')
  } catch (e) {
    console.error('[VIP SNAPSHOT] generation failed', e)
  } finally {
    process.exit(0)
  }
}

run()
