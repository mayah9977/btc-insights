type PositionGuide = {
  action: 'LONG' | 'SHORT' | 'WAIT'
  confidence: number // 0~1
  reason: string
}

export function calcPositionGuide(
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  pressure: number
): PositionGuide {
  if (risk === 'HIGH') {
    return {
      action: 'SHORT',
      confidence: Math.min(1, pressure / 100),
      reason: 'High systemic risk detected',
    }
  }

  if (risk === 'MEDIUM') {
    return {
      action: 'WAIT',
      confidence: 0.5,
      reason: 'Unstable conditions, wait for confirmation',
    }
  }

  return {
    action: 'LONG',
    confidence: 0.6,
    reason: 'Market pressure is low and stable',
  }
}
