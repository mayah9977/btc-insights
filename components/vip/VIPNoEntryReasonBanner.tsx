'use client'

import { motion } from 'framer-motion'

type Props = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

  /**
   * 🧠 오늘 요약 문구 (자동 생성)
   * ex) "오늘 EXTREME 2회, HIGH 3회 회피로 약 $12,400 손실을 방어했습니다"
   */
  summary?: string | null

  /**
   * 🔗 실제 RiskEvent.reason
   * - 서버(getLatestRiskEvent)에서 전달
   */
  reason?: string | null
}

/**
 * 🔒 오늘 왜 진입하면 안 되는지 (고정 배너)
 *
 * 우선순위:
 * 1️⃣ summary (오늘 요약)
 * 2️⃣ reason (최신 RiskEvent)
 * 3️⃣ level fallback
 *
 * ⚠️ 계산 / 판단 ❌
 * ✅ 상태 설명만 담당
 */
export default function VIPNoEntryReasonBanner({
  riskLevel,
  summary,
  reason,
}: Props) {
  // LOW일 때는 배너 노출 ❌
  if (riskLevel === 'LOW') return null

  const levelMap = {
    MEDIUM: {
      label: '관망 권장',
      color: 'bg-yellow-950/40 border-yellow-700 text-yellow-300',
      fallback:
        '변동성이 확대되고 있으나 방향성이 아직 명확하지 않습니다',
    },
    HIGH: {
      label: '진입 비추천',
      color: 'bg-orange-950/40 border-orange-700 text-orange-300',
      fallback:
        '고위험 시그널이 감지되어 진입 시 손실 가능성이 큽니다',
    },
    EXTREME: {
      label: '⚠️ 진입 금지',
      color: 'bg-red-950/50 border-red-700 text-red-300',
      fallback:
        '극단적 변동성 구간으로 예측 불가능한 가격 움직임이 발생 중입니다',
    },
  } as const

  const meta = levelMap[riskLevel]

  // ✅ 요약 → reason → fallback
  const displayReason =
    (typeof summary === 'string' && summary.trim()) ||
    (typeof reason === 'string' && reason.trim()) ||
    meta.fallback

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`
        sticky top-[64px] z-30
        mx-4 mt-2
        rounded-xl border px-4 py-3
        ${meta.color}
      `}
    >
      <div className="flex items-start gap-3">
        {/* 상태 라벨 */}
        <span className="text-sm font-bold whitespace-nowrap">
          {meta.label}
        </span>

        {/* 표시 문구 */}
        <p className="text-sm leading-relaxed">
          {displayReason}
        </p>
      </div>
    </motion.div>
  )
}
