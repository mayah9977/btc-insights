type RiskRecord = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  pnl: number
}

let records: RiskRecord[] = []

export function recordRiskResult(
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  pnl: number
) {
  records.push({ risk, pnl })
  if (records.length > 500) records.shift()
}

export function calcRiskAccuracyScore(): number {
  if (records.length === 0) return 0

  let correct = 0
  let total = 0

  for (const r of records) {
    if (r.risk === 'HIGH') {
      total++
      // HIGH Risk → 손실 회피 or 이익이면 성공
      if (r.pnl <= 0) correct++
    }
  }

  if (total === 0) return 50 // 판단 샘플 부족

  return Math.round((correct / total) * 100)
}
