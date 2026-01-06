export type PaperPosition = {
  id: string
  userId: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice?: number
  pnlPercent?: number
  openedAt: number
  closedAt?: number
}

const positions: PaperPosition[] = []

export async function openPaperPosition(input: {
  userId: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
}) {
  const pos: PaperPosition = {
    id: crypto.randomUUID(),
    openedAt: Date.now(),
    ...input,
  }
  positions.push(pos)
  return pos
}

export async function closePaperPosition(
  positionId: string,
  exitPrice: number
) {
  const p = positions.find(v => v.id === positionId && !v.closedAt)
  if (!p) return null

  p.exitPrice = exitPrice
  p.pnlPercent =
    p.side === 'LONG'
      ? ((exitPrice - p.entryPrice) / p.entryPrice) * 100
      : ((p.entryPrice - exitPrice) / p.entryPrice) * 100

  p.closedAt = Date.now()
  return p
}

export async function listPaperPositions(userId: string) {
  return positions.filter(p => p.userId === userId)
}
