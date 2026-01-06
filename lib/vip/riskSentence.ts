import type { RiskLevel } from './riskEngine'

export function generateRiskSentence(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return '리스크가 낮아 통계적으로 진입이 허용되는 구간입니다.'
    case 'MEDIUM':
      return '리스크가 존재하므로 분할 또는 보수적 접근이 필요합니다.'
    case 'HIGH':
      return '현재 구간은 손실 확률이 높아 관망이 유리합니다.'
    case 'EXTREME':
      return '과열 또는 비정상 구간으로 신규 진입은 권장되지 않습니다.'
  }
}
