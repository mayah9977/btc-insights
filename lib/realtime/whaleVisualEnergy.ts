export type EnergyInput = {
  base: number
  previous?: number
  spike?: boolean
}

export function applyWhaleVisualEnergy({
  base,
  previous,
  spike,
}: EnergyInput) {
  const velocity =
    previous != null ? base - previous : 0

  const velocityBoost =
    velocity * 0.6

  const microNoise =
    (Math.random() - 0.5) * 0.015

  const wave =
    0.01 * Math.sin(Date.now() / 300)

  const spikeBoost =
    spike ? 0.02 : 0

  const visual =
    base +
    velocityBoost +
    microNoise +
    wave +
    spikeBoost

  return Math.max(0, Math.min(1, visual))
}
