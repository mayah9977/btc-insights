import {
  saveWhaleIntensity,
  loadWhaleIntensityHistory,
} from '@/lib/market/whaleRedisStore'

export type WhaleTrend =
  | 'UP'
  | 'DOWN'
  | 'FLAT'

export type WhaleIntensityOutput = {
  /**
   * 🔥 SSOT = 0~100
   */
  value: number
  avg: number

  trend: WhaleTrend
  isSpike: boolean
}

type Input = {
  symbol: string

  oiDelta: number
  volumeDelta: number

  absoluteVolume?: number
  volumeShock?: number
  mediumDensityScore?: number
}

export async function computeWhaleIntensitySSOT(
  input: Input,
): Promise<WhaleIntensityOutput> {

  const {
    symbol,
    oiDelta,
    volumeDelta,
    absoluteVolume = 0,
    volumeShock = 0,
    mediumDensityScore = 0,
  } = input

  const safeOi =
    Number.isFinite(oiDelta)
      ? Math.max(0, oiDelta)
      : 0

  const safeVolDelta =
    Number.isFinite(volumeDelta)
      ? Math.max(0, volumeDelta)
      : 0

  const safeAbsVol =
    Number.isFinite(absoluteVolume)
      ? Math.max(0, absoluteVolume)
      : 0

  const safeShock =
    Number.isFinite(volumeShock)
      ? Math.max(0, volumeShock)
      : 0

  const safeDensity =
    Number.isFinite(mediumDensityScore)
      ? Math.max(0, mediumDensityScore)
      : 0

  /* =========================
     Raw score
  ========================= */

  const oiPart =
    1 - Math.exp(-safeOi / 6)

  const vd =
    Math.max(0, safeVolDelta - 1)

  const volPart =
    1 - Math.exp(-vd / 0.8)

  const absPart =
    1 - Math.exp(-safeAbsVol / 600_000)

  const shockPart =
    1 - Math.exp(-safeShock / 0.6)

  const densityPart =
    Math.tanh(safeDensity * 0.08)

  const raw =
    (oiPart * 0.38) +
    (volPart * 0.38) +
    (absPart * 0.12) +
    (shockPart * 0.08) +
    (densityPart * 0.04)

  /**
   * 🔥 SSOT = 0~100
   */
  const k = 2.2

  let normalized =
    1 - Math.exp(-k * raw)

  normalized =
    Math.max(0, Math.min(1, normalized))

  const value =
    normalized * 100

  /* =========================
     History
  ========================= */

  const history =
    await loadWhaleIntensityHistory(symbol)

  const last =
    history.length
      ? history[history.length - 1]
      : undefined

  const N = 15

  const slice =
    history.slice(-N)

  const avg =
    slice.length
      ? slice.reduce((a, b) => a + b, 0) / slice.length
      : value

  let trend: WhaleTrend = 'FLAT'

  if (typeof last === 'number') {

    const diff = value - last

    if (diff > 2) trend = 'UP'
    else if (diff < -2) trend = 'DOWN'
  }

  /**
   * 🔥 0~100 기준 spike
   */
  const isSpike =
    (avg > 0 &&
      value >= avg * 1.55 &&
      value >= 35)
    ||
    (
      shockPart >= 0.75 &&
      value >= 40
    )

  /**
   * 🔥 저장도 0~100
   */
  await saveWhaleIntensity(
    symbol,
    value,
  )

  return {
    value,
    avg,
    trend,
    isSpike,
  }
}
