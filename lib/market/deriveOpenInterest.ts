let lastOIBySymbol: Record<string, number> = {}

export function deriveOpenInterest(symbol: string, currentOI: number) {
  const prev = lastOIBySymbol[symbol]

  const delta =
    typeof prev === 'number'
      ? currentOI - prev
      : 0

  lastOIBySymbol[symbol] = currentOI

  return {
    openInterest: currentOI,
    delta,
    direction:
      delta > 0 ? 'UP'
      : delta < 0 ? 'DOWN'
      : 'FLAT',
  }
}
