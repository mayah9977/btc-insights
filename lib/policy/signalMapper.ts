import { POLICY } from './switch';

export type SignalUIAction = {
  showEntryButton: boolean;
  showPaidLock: boolean;
  entryLabel: string;
  disclaimer?: string;
};

export function mapActionToUI(params: {
  aiScore: number;
  hasPermission: boolean;
}): SignalUIAction {
  const { aiScore, hasPermission } = params;

  // 🔒 권한 없음
  if (!hasPermission) {
    return {
      showEntryButton: false,
      showPaidLock: true,
      entryLabel: POLICY.entryLabelSafe
        ? 'VIP 기능'
        : 'PRO 전용',
      disclaimer: POLICY.disclaimerRequired
        ? '본 정보는 투자 조언이 아닙니다.'
        : undefined,
    };
  }

  // ⏳ 점수 부족
  if (aiScore < 85 || !POLICY.enableEntryUI) {
    return {
      showEntryButton: false,
      showPaidLock: false,
      entryLabel: POLICY.entryLabelSafe
        ? '분석 중'
        : '대기',
      disclaimer: POLICY.disclaimerRequired
        ? '본 기능은 참고용 시각화입니다.'
        : undefined,
    };
  }

  // ✅ 조건 충족
  return {
    showEntryButton: true,
    showPaidLock: false,
    entryLabel: POLICY.entryLabelSafe
      ? '신호 확인'
      : 'ENTRY NOW',
    disclaimer: POLICY.disclaimerRequired
      ? '실제 거래는 외부에서 직접 수행해야 합니다.'
      : undefined,
  };
}
