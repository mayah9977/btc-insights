'use client'

type Summary = {
  period: '7d' | '30d'
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

export default function VIPSummaryCards({
  weekly,
  monthly,
}: {
  weekly: Summary
  monthly: Summary
}) {
  /**
   * 🔒 Exposure Rule
   * - 관측 기록이 없으면 카드 비노출
   * - EXTREME 관측 이력 1회 이상일 때만 표시
   */
  const shouldShowWeekly =
    typeof weekly.avoidedExtremeCount === 'number' &&
    weekly.avoidedExtremeCount > 0

  const shouldShowMonthly =
    typeof monthly.avoidedExtremeCount === 'number' &&
    monthly.avoidedExtremeCount > 0

  // ✅ 둘 다 조건 미충족 시 전체 카드 비노출
  if (!shouldShowWeekly && !shouldShowMonthly) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[weekly, monthly].map((s) => {
        const shouldShow =
          typeof s.avoidedExtremeCount === 'number' &&
          s.avoidedExtremeCount > 0

        // 🔒 개별 카드 단위 비노출
        if (!shouldShow) return null

        return (
          <div
            key={s.period}
            className="bg-vipCard border border-vipBorder rounded-2xl p-5"
          >
            {/* 기간 명시 (과거 집계 고정) */}
            <div className="text-sm text-zinc-400">
              최근 {s.period === '7d' ? '7일' : '30일'} 관측 요약
            </div>

            {/* 핵심 문구: 현재 판단 ❌ / 기록 ⭕ */}
            <div className="mt-2 text-base font-semibold text-white">
              고위험 상태 관측 기록이 {s.avoidedExtremeCount}회 존재합니다
            </div>

            {/* 보조 설명: 기록 기준 명시 */}
            <div className="mt-1 text-sm text-zinc-400">
              실제 시장 흐름에서 관측된 고위험 상태의 누적 기록 기준입니다.
              해당 구간에서는 추가 관찰이 수행되었습니다.
            </div>

            {/*
              🔒 avoidedLossUSD
              - 철학적으로 제거 대상
              - 수익/손실 암시 UI 비노출
              - 데이터/타입/계산은 유지 (SSOT 보호)
            */}
          </div>
        )
      })}
    </div>
  )
}
