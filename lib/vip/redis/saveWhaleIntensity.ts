//lib/vip/redis/saveWhaleIntensity.ts 

import { redis } from '@/lib/redis/server'
import { buildWhaleInterpretation } from '@/lib/analysis/whaleInterpretation'

/**
 * Whale Snapshot Key (숫자 SSOT)
 */
const KEY = 'vip:intel:whale'

/**
 * Whale Interpretation Key (문장 SSOT)
 */
const TEXT_KEY = 'vip:intel:whale:text'

export type WhaleIntensitySnapshot = {
  intensity: number
  level: 'LOW' | 'MID' | 'HIGH'
  updatedAt: number
}

/**
 * 🐋 Save Whale Intensity Snapshot
 * - 숫자 저장
 * - 해석 문장 저장 (PDF / APP 공통 SSOT)
 */
export async function saveWhaleIntensity(
  intensity: number,
) {
  let level: WhaleIntensitySnapshot['level'] = 'LOW'

  if (intensity > 0.7) level = 'HIGH'
  else if (intensity > 0.3) level = 'MID'

  const snapshot: WhaleIntensitySnapshot = {
    intensity,
    level,
    updatedAt: Date.now(),
  }

  /* 1️⃣ 숫자 저장 */
  await redis.set(KEY, JSON.stringify(snapshot))

  /* 2️⃣ 해석 문장 생성 */
  const interpretation = buildWhaleInterpretation(intensity)

  /* 3️⃣ 문장 저장 */
  await redis.set(TEXT_KEY, interpretation)
}

/**
 * 🐋 Get Whale Intensity Snapshot
 */
export async function getWhaleIntensity(): Promise<WhaleIntensitySnapshot | null> {
  const raw = await redis.get(KEY)
  if (!raw) return null
  return JSON.parse(raw)
}
