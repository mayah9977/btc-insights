type FeatureName =
  | 'EXTREME_GRAPH'
  | 'PRESSURE_GAUGE'
  | 'VIP3_PREDICTION'
  | 'RISK_REPORT_PDF'
  | 'POSITION_GUIDE'
  | 'HEATMAP'
  | 'RISK_DASHBOARD'

type UsageRecord = {
  count: number
  lastUsedAt: number
}

const usageMap: Record<
  FeatureName,
  UsageRecord
> = {} as any

export function trackFeatureUsage(
  feature: FeatureName
) {
  const now = Date.now()

  if (!usageMap[feature]) {
    usageMap[feature] = {
      count: 0,
      lastUsedAt: now,
    }
  }

  usageMap[feature].count++
  usageMap[feature].lastUsedAt = now
}

/**
 * 관리자 / 내부 분석용
 */
export function getFeatureUsageStats() {
  return Object.entries(usageMap).map(
    ([feature, data]) => ({
      feature,
      count: data.count,
      lastUsedAt: data.lastUsedAt,
    })
  )
}
