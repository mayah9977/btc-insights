export type AlertPerformance = {
  id: string
  alertId: string
  userId: string

  symbol: string
  entryPrice: number
  exitPrice?: number

  hit: boolean | null
  pnlPercent?: number

  createdAt: number
  closedAt?: number
}

const performances: AlertPerformance[] = []

export async function openPerformance(input: {
  alertId: string
  userId: string
  symbol: string
  entryPrice: number
}) {
  const p: AlertPerformance = {
    id: crypto.randomUUID(),
    hit: null,
    createdAt: Date.now(),
    ...input,
  }
  performances.push(p)
  return p
}

export async function closePerformance(
  alertId: string,
  exitPrice: number
) {
  const p = performances.find(
    v => v.alertId === alertId && v.hit === null
  )
  if (!p) return null

  p.exitPrice = exitPrice
  p.pnlPercent =
    ((exitPrice - p.entryPrice) / p.entryPrice) * 100
  p.hit = p.pnlPercent > 0
  p.closedAt = Date.now()
  return p
}

export async function listPerformances(userId: string) {
  return performances.filter(p => p.userId === userId)
}
