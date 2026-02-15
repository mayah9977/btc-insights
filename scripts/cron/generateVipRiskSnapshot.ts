/**
 * VIP Risk Snapshot Generator (Cron)
 *
 * 역할:
 * 1️⃣ Redis 에서 마지막 VIP RISK_UPDATE 조회
 * 2️⃣ generateVipRiskSnapshot() 호출
 * 3️⃣ Snapshot 결과를 Redis (히스토리) 저장
 *
 * ⚠️ 실시간 Store / SSE / Client 코드 절대 접근 금지
 */

import 'dotenv/config'

import { generateVipRiskSnapshot } from '../../lib/vip/summary/generateVipRiskSnapshot'
import type { RiskLevel } from '../../lib/vip/riskTypes'
import { createRedisSubscriber } from '../../lib/redis/index'


/* =========================
 * Redis Client
 * ========================= */
const redis = createRedisSubscriber()
const raw = await redis.get('vip:lastRisk')

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

/**
 * 🔹 마지막 VIP RISK 상태 조회
 * - vipSSEHub.setLastVipRisk() 에서 저장된 값
 * - Redis SSOT
 */
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

/**
 * 🔹 Snapshot 저장
 * - Redis list (히스토리 / 리포트)
 */
async function saveVipRiskSnapshot(snapshot: any) {
  await redis.lpush(
    'vip:risk:snapshots',
    JSON.stringify(snapshot),
  )

  // 메모리 보호 (최근 1000개만 유지)
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
    /* 1️⃣ 마지막 Risk 상태 조회 */
    const lastRisk = await fetchLastVipRisk()

    if (!lastRisk) {
      console.warn('[VIP SNAPSHOT] no last risk found — skip')
      return
    }

    /* 2️⃣ Snapshot 생성 */
    const snapshot = generateVipRiskSnapshot({
      riskLevel: lastRisk.riskLevel,
      judgement: lastRisk.judgement,
      confidence: lastRisk.confidence,

      pressureTrend: lastRisk.pressureTrend,
      preExtreme: lastRisk.preExtreme,
      whaleAccelerated: lastRisk.whaleAccelerated,

      ts: Date.now(),
    })

    /* 3️⃣ 저장 */
    await saveVipRiskSnapshot(snapshot)

    console.log('[VIP SNAPSHOT] generation done')
  } catch (e) {
    console.error('[VIP SNAPSHOT] generation failed', e)
  } finally {
    process.exit(0)
  }
}

run()
