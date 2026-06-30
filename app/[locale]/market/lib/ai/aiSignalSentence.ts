export function generateAISignalSentence(params: {
  aiScore: number
  volatility: number
  whaleBias: 'BUY' | 'SELL' | 'NEUTRAL'
}) {
  const { aiScore, volatility, whaleBias } = params

  if (aiScore >= 75) {
    return 'AI는 현재 시장을 강한 추세 구간으로 인식하고 있습니다.'
  }

  if (aiScore >= 60) {
    return volatility > 0.7
      ? '변동성이 높은 중립 구간으로, 진입 리스크가 존재합니다.'
      : '완만한 추세 구간으로 해석됩니다.'
  }

  if (aiScore >= 45) {
    return whaleBias === 'SELL'
      ? '고래 매도 압력이 감지되며 주의가 필요합니다.'
      : '방향성이 불분명한 구간으로 관망이 유리합니다.'
  }

  return '시장 신뢰도가 낮은 구간으로 신규 진입은 불리합니다.'
}
