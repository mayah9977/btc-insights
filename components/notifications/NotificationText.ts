// 안전한 알림 텍스트 매핑
export function getSafeNotificationText(type: string) {
  switch (type) {
    case 'CONDITION_DETECTED':
      return '특정 시장 조건이 감지되었습니다.';
    case 'VOLATILITY_INCREASE':
      return '시장 변동성 참고 지표가 증가했습니다.';
    default:
      return '시장 데이터 업데이트가 있습니다.';
  }
}
