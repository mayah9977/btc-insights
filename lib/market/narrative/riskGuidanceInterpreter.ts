/* =========================================================
Risk Guidance Result
Strategy guidance layer
========================================================= */

export interface RiskGuidanceResult {
  guidanceSignals: string[]
}


/* =========================================================
Interpret Risk Guidance
Market analysis results → strategy guide
========================================================= */

export function interpretRiskGuidance(
  signals: string[]
): RiskGuidanceResult {

  const guidanceSignals: string[] = []

  for (const s of signals) {

    /* =========================
    기관 매집
    ========================= */

    if (s.includes('기관 매집')) {
      guidanceSignals.push(
        '기관 매집 흐름이 감지되고 있어 추격 매수보다는 분할 진입 전략을 고려하는 것이 유리할 수 있습니다.'
      )
    }


    /* =========================
    롱 청산
    ========================= */

    if (s.includes('롱 포지션 청산')) {
      guidanceSignals.push(
        '현재 구간에서는 무리한 진입보다는 시장 안정 여부를 확인하며 관망 대응이 보다 유리할 수 있습니다.'
      )
    }


    /* =========================
    숏 청산
    ========================= */

    if (s.includes('숏 포지션 청산')) {
      guidanceSignals.push(
        '단기 반등 이후 변동성이 확대될 수 있어 신중한 접근과 리스크 관리가 필요할 수 있습니다.'
      )
    }


    /* =========================
    고래 매수
    ========================= */

    if (s.includes('고래 매수')) {
      guidanceSignals.push(
        '고래 매수 흐름이 감지되고 있어 시장 안정 여부를 확인하며 점진적인 포지션 구축 전략을 고려할 수 있습니다.'
      )
    }


    /* =========================
    고래 매도
    ========================= */

    if (s.includes('고래 매도')) {
      guidanceSignals.push(
        '고래 매도 압력이 감지되고 있어 보수적인 대응과 리스크 관리 중심 전략이 필요할 수 있습니다.'
      )
    }


    /* =========================
    박스권
    ========================= */

    if (s.includes('박스권')) {
      guidanceSignals.push(
        '명확한 추세 형성 전까지는 무리한 진입보다는 관망하며 돌파 여부를 확인하는 전략이 유리할 수 있습니다.'
      )
    }


    /* =========================
    변동성 확대
    ========================= */

    if (s.includes('변동성')) {
      guidanceSignals.push(
        '변동성이 확대되는 구간에서는 포지션 규모를 조절하고 리스크 관리 기준을 함께 설정하는 전략이 필요할 수 있습니다.'
      )
    }

  }


  /* =========================================================
  Default Strategy
  ========================================================= */

  if (guidanceSignals.length === 0) {

    guidanceSignals.push(
      '현재 시장 방향성이 명확하지 않아 무리한 진입보다는 관망하며 시장 흐름을 확인하는 전략이 유리할 수 있습니다.'
    )
  }

  return {
    guidanceSignals,
  }
}
