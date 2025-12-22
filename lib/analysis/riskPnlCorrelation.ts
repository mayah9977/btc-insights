import { getSimulatedTrades } from '@/lib/simulation/positionSimulationStore'

type RiskRecord = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  pnl: number
}

const records: RiskRecord[] = []

export function recordRiskPnL(
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  pnl: number
) {
  records.push({ risk, pnl })
  if (records.length > 200) records.shift()
}

export function analyzeRiskPnLCorrelation() {
  const result = {
    LOW: { count: 0, avgPnL: 0 },
    MEDIUM: { count: 0, avgPnL: 0 },
    HIGH: { count: 0, avgPnL: 0 },
  }

  records.forEach((r) => {
    result[r.risk].count++
    result[r.risk].avgPnL += r.pnl
  })

  ;(['LOW', 'MEDIUM', 'HIGH'] as const).forEach(
    (k) => {
      if (result[k].count > 0) {
        result[k].avgPnL /=
          result[k].count
      }
    }
  )

  return result
}
