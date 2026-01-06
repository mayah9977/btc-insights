import { listPaperPositions } from '@/lib/paper/paperTradeStore'

export async function rankUsersByAI(users: string[]) {
  const results = []

  for (const userId of users) {
    const positions = await listPaperPositions(userId)

    const closed = positions.filter(p => p.pnlPercent !== undefined)
    const avgPnL =
      closed.reduce((s, p) => s + (p.pnlPercent ?? 0), 0) /
      (closed.length || 1)

    results.push({
      userId,
      trades: closed.length,
      avgPnL,
    })
  }

  return results.sort((a, b) => b.avgPnL - a.avgPnL)
}
