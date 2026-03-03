'use client'

import { motion } from 'framer-motion'

type Props = {
  ratio: number
  net: number
}

export default function VIPWhaleTradeGuideCard({
  ratio,
  net,
}: Props) {

  const ratioPercent = (ratio * 100).toFixed(0)
  const netPercent = (net * 100).toFixed(0)

  const netDirection =
    net > 0 ? 'LONG' :
    net < 0 ? 'SHORT' : 'NEUTRAL'

  const levelColor =
    netDirection === 'LONG'
      ? '#10b981'
      : netDirection === 'SHORT'
      ? '#3b82f6'
      : '#6b7280'

  const strongFlow = ratio >= 0.7
  const mediumFlow = ratio >= 0.55

  /* =====================================================
     상태 해석 고급화
  ===================================================== */

  let phase = '기관급 큰고래 체결감지중'
  let interpretation =
    '대형 체결 흐름을 모니터링 중입니다.'
  let status = '큰고래 체결강도 감지중'

  if (strongFlow && net > 0.2) {
    phase = '기관매집 집중 구간'
    interpretation =
      '기관 순매수 자금이 강하게 유입되고 있습니다. 추세 확장 가능성이 높은 상태입니다.'
    status = '매수 우위'
  }
  else if (strongFlow && net < -0.2) {
    phase = '기관매도 집중 구간'
    interpretation =
      '기관 순매도 자금이 강하게 유입되고 있습니다. 하락 압력이 뚜렷합니다.'
    status = '매도 우위'
  }
  else if (mediumFlow && Math.abs(net) < 0.1) {
    phase = '에너지 축적 구간'
    interpretation =
      '대형 체결은 증가하고 있으나 방향 정렬은 아직 형성되지 않았습니다.'
    status = '방향성 대기'
  }
  else if (net > 0.15) {
    phase = '매수 압력 우세'
    interpretation =
      '기관 순매수 압력이 점진적으로 강화되고 있습니다.'
    status = '매수 우위'
  }
  else if (net < -0.15) {
    phase = '매도 압력 우세'
    interpretation =
      '기관 순매도 압력이 점진적으로 강화되고 있습니다.'
    status = '매도 우위'
  }

  /* =====================================================
     렌더
  ===================================================== */

  return (
    <motion.div
      animate={
        strongFlow
          ? { scale: [1, 1.02, 1] }
          : { scale: 1 }
      }
      transition={{
        duration: 0.8,
        repeat: strongFlow ? Infinity : 0,
      }}
      className="mt-4 rounded-xl border p-6 text-sm text-neutral-300 relative overflow-hidden"
      style={{
        borderColor: levelColor,
        background:
          'linear-gradient(145deg, rgba(10,10,10,0.9), rgba(0,0,0,0.95))',
        boxShadow: `0 0 25px ${levelColor}35`,
      }}
    >
      {/* 상단 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white text-base">
            🐋 큰고래(200k이상) 자금 흐름 분석
          </div>
          <div className="text-xs text-neutral-400">
            (큰고래 체결 강도 정밀분석)
          </div>
        </div>

        <div
          className="px-3 py-1 text-xs rounded font-semibold text-black"
          style={{ backgroundColor: levelColor }}
        >
          {phase}
        </div>
      </div>

      {/* 핵심 수치 */}
      <div className="mb-4 text-xs text-neutral-400">
        대형 체결 비중{' '}
        <span className="text-yellow-400 font-semibold">
          {ratioPercent}%
        </span>
        <span className="mx-3 text-neutral-600">|</span>
        기관 순매수 압력{' '}
        <span
          style={{ color: levelColor }}
          className="font-semibold"
        >
          {netPercent}%
        </span>
      </div>

      {/* 해석 */}
      <div
        className="mb-4 text-sm font-medium"
        style={{ color: levelColor }}
      >
        {interpretation}
      </div>

      {/* 전략 힌트 */}
      <div className="text-xs text-neutral-500 leading-relaxed space-y-1">
        <div>• 70% 이상 → 대형 자금 집중 구간</div>
        <div>• 순매수 압력 + 체결 비중 동시 상승 → 상승 추세 가능성 증가</div>
        <div>• 순매도 압력 + 체결 비중 동시 상승 → 하락 압력 강화</div>
        <div>• 체결 비중은 높으나 순압력 약함 → 축적/압축 구간</div>
      </div>

      {/* 상태 */}
      <div className="mt-5 text-center text-xs font-semibold text-white">
        Current Status: {status}
      </div>
    </motion.div>
  )
}
