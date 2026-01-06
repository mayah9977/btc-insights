import { updateAlert } from './alertStore.server'
import { rankAlerts } from './alertRanking'

type PruneRule = {
  minSamples: number
  minHitRate: number
  minAvgPnL: number
}

const DEFAULT_RULE: PruneRule = {
  minSamples: 5,
  minHitRate: 0.4,
  minAvgPnL: -1,
}

export async function autoPruneAlerts(userId: string) {
  const ranked = await rankAlerts(userId)
  const pruned: string[] = []

  for (const a of ranked) {
    if (a.count < DEFAULT_RULE.minSamples) continue

    if (
      a.hitRate < DEFAULT_RULE.minHitRate ||
      a.avgPnL < DEFAULT_RULE.minAvgPnL
    ) {
      await updateAlert(a.alertId, { enabled: false })
      pruned.push(a.alertId)
    }
  }

  return pruned
}
