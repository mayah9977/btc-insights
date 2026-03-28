export function buildMetaKey(snapshot: any): string {
  const oiDelta = snapshot?.oiDelta ?? 0
  const whaleNetRatio = snapshot?.whaleNetRatio ?? 0
  const fundingRate = snapshot?.fundingRate ?? 0
  const volumeRatio = snapshot?.volumeRatio ?? 1

  /* =========================
     1. Trend (OI 기반)
  ========================= */
  const trend =
    oiDelta > 0.02
      ? 'OI_UP'
      : oiDelta < -0.02
      ? 'OI_DOWN'
      : 'OI_FLAT'

  /* =========================
     2. Whale Pressure
  ========================= */
  const whale =
    whaleNetRatio > 0.005
      ? 'WHALE_BUY'
      : whaleNetRatio < -0.005
      ? 'WHALE_SELL'
      : 'WHALE_NEUTRAL'

  /* =========================
     3. Funding Bias
  ========================= */
  const funding =
    fundingRate > 0.00005
      ? 'LONG_HEAVY'
      : fundingRate < -0.00005
      ? 'SHORT_HEAVY'
      : 'NEUTRAL'

  /* =========================
     4. Volume Regime
  ========================= */
  const volume =
    volumeRatio > 1.5
      ? 'HIGH_VOL'
      : volumeRatio < 0.8
      ? 'LOW_VOL'
      : 'NORMAL_VOL'

  return [trend, whale, funding, volume].join('|')
}
