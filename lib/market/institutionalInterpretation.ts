// lib/market/institutionalInterpretation.ts

export type InstitutionalLevel =
  | 'LOW'
  | 'WATCH'
  | 'BUILDING'
  | 'STRONG'
  | 'EXTREME'

export type InstitutionalDirection =
  | 'LONG'
  | 'SHORT'
  | 'NEUTRAL'

/* =========================================================
   🔥 1️⃣ 점수 → 레벨
========================================================= */
export function getInstitutionalLevel(
  score: number,
): InstitutionalLevel {
  if (score >= 85) return 'EXTREME'
  if (score >= 70) return 'STRONG'
  if (score >= 55) return 'BUILDING'
  if (score >= 40) return 'WATCH'
  return 'LOW'
}

/* =========================================================
   🎨 2️⃣ 점수 → 색상
========================================================= */
export function getInstitutionalColor(
  score: number,
): string {
  if (score >= 85) return '#ef4444' // 강한 빨강
  if (score >= 70) return '#f97316' // 오렌지
  if (score >= 55) return '#facc15' // 노랑
  if (score >= 40) return '#22c55e' // 연두
  return '#10b981' // 녹색
}

/* =========================================================
   💡 3️⃣ 글로우 색상
========================================================= */
export function getInstitutionalGlow(
  score: number,
): string {
  const base = getInstitutionalColor(score)
  return `0 0 25px ${base}66`
}

/* =========================================================
   📈 4️⃣ 방향성 판단
========================================================= */
export function getInstitutionalDirection(
  netRatio: number,
): InstitutionalDirection {
  if (netRatio > 0.1) return 'LONG'
  if (netRatio < -0.1) return 'SHORT'
  return 'NEUTRAL'
}

/* =========================================================
   🧠 5️⃣ 자동 해석 문장 생성
========================================================= */
export function getInstitutionalInterpretation({
  score,
  whaleRatio,
  netRatio,
  oiDelta,
}: {
  score: number
  whaleRatio: number
  netRatio: number
  oiDelta: number
}) {
  const level = getInstitutionalLevel(score)
  const direction = getInstitutionalDirection(netRatio)

  let summary = ''
  let detail = ''

  /* =========================
     EXTREME
  ========================= */
  if (level === 'EXTREME') {
    summary = '🔥 기관급 자금의 강한 포지션 구축 신호'

    if (direction === 'LONG') {
      detail =
        '고래 체결 강도와 순매수 압력이 동시에 극단적으로 상승했습니다. ' +
        '신규 대형 포지션 구축 가능성이 매우 높으며 단기 변동성 확장이 예상됩니다.'
    } else if (direction === 'SHORT') {
      detail =
        '강한 순매도 압력과 함께 고래 체결 집중이 발생했습니다. ' +
        '하방 급변 가능성이 존재하며 레버리지 구간에서는 각별한 주의가 필요합니다.'
    } else {
      detail =
        '체결 집중은 높지만 방향성은 아직 중립입니다. ' +
        '흡수/교차 매매 구간일 가능성이 있으며 OI 추이를 추가 확인해야 합니다.'
    }
  }

  /* =========================
     STRONG
  ========================= */
  else if (level === 'STRONG') {
    summary = '⚡ 기관 진입 가능성 높음'

    detail =
      '고래 체결 강도와 OI 변화가 동반되고 있습니다. ' +
      '추세 전환 또는 확장 초기 구간일 수 있습니다.'
  }

  /* =========================
     BUILDING
  ========================= */
  else if (level === 'BUILDING') {
    summary = '📈 기관 포지션 구축 진행 가능성'

    detail =
      '강도는 평균 대비 상승 구간입니다. ' +
      '아직 확정적이지 않으나 자금 유입 징후가 감지됩니다.'
  }

  /* =========================
     WATCH
  ========================= */
  else if (level === 'WATCH') {
    summary = '👀 관찰 구간'

    detail =
      '기관 방향성은 명확하지 않습니다. ' +
      '강도 및 OI 동조 여부를 추가 관찰해야 합니다.'
  }

  /* =========================
     LOW
  ========================= */
  else {
    summary = '🟢 일반 유동성 구간'

    detail =
      '현재는 기관급 개입이 뚜렷하지 않은 상태입니다. ' +
      '일반 시장 참여자 중심의 움직임으로 해석됩니다.'
  }

  return {
    level,
    direction,
    summary,
    detail,
  }
}

/* =========================================================
   🚀 6️⃣ UI에서 바로 쓰는 통합 헬퍼
========================================================= */
export function buildInstitutionalUIState(params: {
  score: number
  whaleRatio: number
  netRatio: number
  oiDelta: number
}) {
  const { score, whaleRatio, netRatio, oiDelta } =
    params

  const color = getInstitutionalColor(score)
  const glow = getInstitutionalGlow(score)

  const interpretation =
    getInstitutionalInterpretation({
      score,
      whaleRatio,
      netRatio,
      oiDelta,
    })

  return {
    color,
    glow,
    ...interpretation, // level, direction 여기서만 가져옴
  }
}
