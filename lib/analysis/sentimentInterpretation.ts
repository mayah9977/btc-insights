/**
 * Sentiment Interpretation Builder (SSOT)
 * - APP / PDF 동일 문장 사용
 * - 계산 ❌
 * - 단순 해석 생성 전용
 */

export function buildSentimentInterpretation(index: number): string {
  let regimeEn: 'Fear' | 'Neutral' | 'Greed' = 'Neutral'
  let regimeKo = '중립'

  if (index < 35) {
    regimeEn = 'Fear'
    regimeKo = '공포'
  } else if (index > 65) {
    regimeEn = 'Greed'
    regimeKo = '탐욕'
  }

  return `현재 지수는 ${index} 입니다. ${regimeEn} (${regimeKo}) 구간입니다.`
}
