// lib/vip/redis/getVIP3Metrics.ts
import { redis } from '@/lib/redis/index'


export type VIP3Metrics = {
  extremeAccuracy: number
  avgAvoidedLoss30d: number
  stableZoneRatio: number
  confidenceScore: number
}

const fallback: VIP3Metrics = {
  extremeAccuracy: 0,
  avgAvoidedLoss30d: 0,
  stableZoneRatio: 0,
  confidenceScore: 0,
}

export async function getVIP3Metrics(): Promise<VIP3Metrics> {
  try {
    const raw = await redis.get('vip:metrics:vip3')
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<VIP3Metrics>

    return {
      extremeAccuracy: Number(parsed.extremeAccuracy ?? 0),
      avgAvoidedLoss30d: Number(parsed.avgAvoidedLoss30d ?? 0),
      stableZoneRatio: Number(parsed.stableZoneRatio ?? 0),
      confidenceScore: Number(parsed.confidenceScore ?? 0),
    }
  } catch {
    return fallback
  }
}
