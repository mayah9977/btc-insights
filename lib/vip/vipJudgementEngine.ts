export type VipMarketState =
  | 'SAFE'
  | 'CAUTION'
  | 'DANGER'
  | 'OVERHEAT'

type Params = {
  aiScore: number
  whaleIntensity: number // 0 ~ 1
  volatility: number // 0 to 1

  // 🔥 [ADD] Risk 전이 방향 (LiveRiskState 연동용, 선택값)
  // - 기존 호출부 영향 없음
  direction?: 'UP' | 'DOWN' | 'STABLE'

  // 🔥 [ADD] Risk 체류 시간 (초, 선택값)
  // - Risk 계산 ❌
  // - Judgment 문구 톤 분기 전용
  durationSec?: number
}

/**
 * VIP Strategy Decision Engine (SSOT)
 *
 * Role:
 * - Based on Risk / aiScore / whale / volatility
 * - Generate a single “action-oriented strategy statement”
 *
 * Principle:
 * - UI interpretation ❌
 * - RiskPanel / Snapshot / Judgment use the same sentence
 */
export function judgeVipMarketState({
  aiScore,
  whaleIntensity,
  volatility,
  direction, // 🔥 [ADD]
  durationSec, // 🔥 [ADD]
}: Params): {
  state: VipMarketState
  strategy: string
} {
  /**
   * 🔬 Composite Risk Index
   * - volatility: market instability
   * - whaleIntensity: Intensity of large fund intervention
   * - aiScore: Trend confidence (inverse weighted)
   */
  const riskIndex =
    volatility * 0.45 +
    whaleIntensity * 0.35 +
    (1 - aiScore / 100) * 0.2

  /**
   * =========================
   * Action-oriented strategic judgment
   * =========================
   */

  // 🔥 Overheating section → Avoidance
  if (riskIndex >= 0.78) {
    return {
      state: 'OVERHEAT',
      strategy:
        '고변동성과 고래 개입 신호가 동시에 관측되고 있습니다. 직전 흐름 대비 긴장도가 높아진 모습이며, 아직 확정적으로 단정하지 않고 다음 업데이트를 관찰하는 상태입니다. 관측은 계속 진행 중입니다.',
    }
  }

  // ⚠️ Danger zone → wait and see
  if (riskIndex >= 0.6) {
    return {
      state: 'DANGER',
      strategy:
        typeof durationSec === 'number' && durationSec >= 180
          ? '불안정 구간이 일정 시간 이상 이어지는 모습이 관측되고 있습니다. 직전 상태 대비 흔들림이 누적되는지 확인 중이며, 아직 확정 신호로 단정하지 않고 관측을 유지합니다. 관측은 계속 진행 중입니다.'
          : '변동성 신호가 우세하게 관측되며 불안정 구간이 이어지고 있습니다. 직전 상태와 비교해 변화가 계속되는지 아직 확인 중이며, 추가 신호를 기다리며 관측을 유지합니다. 관측은 계속 진행 중입니다.',
    }
  }

  // ⚠️ Caution section → Conditional entry
  if (riskIndex >= 0.42) {
    // 🔥 [ADD] Risk 전이 직전 긴장감 (MEDIUM + UP)
    if (direction === 'UP') {
      return {
        state: 'CAUTION',
        strategy:
          '추세 신뢰 신호는 아직 충분히 확인되지 않았지만, 위험 지표가 상방으로 이동하는 모습이 관측됩니다. 직전 흐름 대비 변화가 진행 중인지 확정되지 않았으며, 다음 업데이트에서 신호가 유지되는지 관찰하는 상태입니다. 관측은 계속 진행 중입니다.',
      }
    }

    return {
      state: 'CAUTION',
      strategy:
        typeof durationSec === 'number'
          ? durationSec < 60
            ? '짧은 변동 시도가 관측되지만, 아직 시장 구조 전반에서 확정 신호로 보기 어렵습니다. 직전 상태 대비 변화가 일시적인지 확인 중이며, 추가 흐름을 관찰하는 상태입니다. 관측은 계속 진행 중입니다.'
            : durationSec >= 300
            ? '주의 구간이 일정 시간 유지되며 안정성이 서서히 약해지는 모습이 관측됩니다. 다만 아직 단계 전환으로 단정할 수 없으며, 다음 신호가 누적되는지 관찰을 유지합니다. 관측은 계속 진행 중입니다.'
            : '주의 구간이 이어지며 추세 신뢰 신호가 충분히 확정되지 않은 상태로 관측됩니다. 직전 흐름 대비 변화가 이어지는지 확인 중이며, 관측을 유지합니다. 관측은 계속 진행 중입니다.'
          : '추세 신뢰 신호가 아직 충분히 확인되지 않은 상태로 관측됩니다. 직전 흐름 대비 변화가 이어지는지 확인 중이며, 관측을 유지합니다. 관측은 계속 진행 중입니다.',
    }
  }

  // ✅ Stable section → Entry possible
  return {
    state: 'SAFE',
    strategy:
      '시장은 비교적 안정적인 구간으로 관측되고 있습니다. 직전 흐름 대비 큰 흔들림은 제한적으로 보이며, 현재 상태가 유지되는지 아직 확인 중입니다. 관측은 계속 진행 중입니다.',
  }
}
