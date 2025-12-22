let currentStart: number | null = null
const durations: number[] = []

export function recordRiskLevel(risk: 'LOW' | 'MEDIUM' | 'HIGH') {
  const now = Date.now()

  if (risk === 'HIGH') {
    if (currentStart === null) {
      currentStart = now
    }
  } else {
    if (currentStart !== null) {
      durations.push(now - currentStart)
      currentStart = null
    }
  }
}

export function getRiskDurationStats() {
  if (durations.length === 0) {
    return {
      count: 0,
      averageMs: 0,
      totalMs: 0,
    }
  }

  const totalMs = durations.reduce((a, b) => a + b, 0)
  const averageMs = totalMs / durations.length

  return {
    count: durations.length,
    totalMs,
    averageMs,
  }
}
