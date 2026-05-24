//components/vip/VIPWhaleTradeGuideCard.tsx  

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
     Trade Participation 해석
  ===================================================== */

  let phase = 'Trade Participation 모니터링'
  let interpretation = '대형 체결 참여 비중과 방향 압력을 추적 중입니다.'
  let status = '대형 체결 참여 흐름 관찰중'

  if (strongFlow && net > 0.2) {
    phase = 'High Participation + Buy Pressure'
    interpretation =
      '대형 체결 참여 비중이 높고 매수 방향 압력이 우세합니다. 다만 이는 체결 참여와 방향 압력이며, 최종 방향 확신도는 Institutional Conviction Engine에서 확인해야 합니다.'
    status = 'Strong Buy-side Participation'
  }

  else if (strongFlow && net < -0.2) {
    phase = 'High Participation + Sell Pressure'
    interpretation =
      '대형 체결 참여 비중이 높고 매도 방향 압력이 우세합니다. 다만 이는 체결 참여와 방향 압력이며, 최종 방향 확신도는 Institutional Conviction Engine에서 확인해야 합니다.'
    status = 'Strong Sell-side Participation'
  }

  else if (mediumFlow && Math.abs(net) < 0.1) {
    phase = 'High Participation / Neutral Pressure'
    interpretation =
      '대형 체결 참여는 증가하고 있지만 방향 압력은 아직 정렬되지 않았습니다. 유동성 축적 또는 방향성 대기 구간일 수 있습니다.'
    status = 'Participation Building'
  }

  else if (net > 0.15) {
    phase = 'Buy Pressure Dominant'
    interpretation =
      '대형 체결 흐름에서 매수 방향 압력이 점진적으로 증가하고 있습니다.'
    status = 'Buy Pressure'
  }

  else if (net < -0.15) {
    phase = 'Sell Pressure Dominant'
    interpretation =
      '대형 체결 흐름에서 매도 방향 압력이 점진적으로 증가하고 있습니다.'
    status = 'Sell Pressure'
  }

  /* =====================================================
     Render
  ===================================================== */

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        borderColor: levelColor,
      }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mt-4 rounded-xl border p-6 text-sm text-neutral-300 relative overflow-hidden"
      style={{
        borderColor: strongFlow
          ? `${levelColor}99`
          : `${levelColor}55`,
        background:
          'linear-gradient(145deg, rgba(12,12,12,0.96), rgba(3,3,3,0.98))',
        boxShadow:
          strongFlow
            ? `0 18px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.045), 0 0 0 1px ${levelColor}18`
            : `0 14px 34px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.035)`,
      }}
    >

      {/* premium static surface */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            `radial-gradient(circle at top right, ${levelColor}18, transparent 34%)`,
        }}
      />

      <div
        className="pointer-events-none absolute left-6 right-6 top-0 h-px"
        style={{
          background:
            `linear-gradient(90deg, transparent, ${levelColor}66, transparent)`,
        }}
      />

      {/* 헤더 */}
      <div className="relative z-10 mb-4 flex items-center justify-between">

        <div>
          <div className="font-semibold text-white text-base tracking-[0.01em]">
            🐋 Trade Participation & Directional Pressure
          </div>

          <div className="text-xs text-neutral-500">
            (대형 체결 참여 비중과 방향 압력 분석)
          </div>
        </div>

        <div
          className="px-3 py-1 text-xs rounded font-semibold text-black"
          style={{ backgroundColor: levelColor }}
        >
          {phase}
        </div>

      </div>

      {/* 핵심 데이터 */}
      <div className="relative z-10 mb-4 text-xs text-neutral-400">

        Whale Trade Ratio (시장 거래 중 대형 체결이 차지하는 실제 비중)

        <span className="text-yellow-400 font-semibold ml-1">
          {ratioPercent}%
        </span>

        <span className="mx-3 text-neutral-600">|</span>

        Whale Net Pressure (대형 체결 흐름의 매수·매도 방향 압력)

        <span
          style={{ color: levelColor }}
          className="font-semibold ml-1"
        >
          {netPercent}%
        </span>

      </div>

      {/* 해석 */}
      <div
        className="relative z-10 mb-4 text-sm font-medium leading-relaxed"
        style={{ color: levelColor }}
      >
        {interpretation}
      </div>

      {/* 트레이딩 가이드 */}
      <div className="relative z-10 text-xs text-neutral-500 leading-relaxed space-y-1">

        <div>• Whale Trade Ratio → 실제 대형 체결 참여 비중</div>
        <div>• Net Pressure → 대형 체결의 순매수 / 순매도 방향 압력</div>
        <div>• Ratio 상승 + Net 상승 → 매수 방향 체결 참여 증가</div>
        <div>• Ratio 상승 + Net 하락 → 매도 방향 체결 참여 증가</div>
        <div>• Trade Participation은 Institutional Energy와 별도 layer입니다.</div>
        <div>• 최종 방향 확신도는 energy × directional alignment × consistency로 판단됩니다.</div>

      </div>

      {/* 상태 */}
      <div className="relative z-10 mt-5 text-center text-xs font-semibold text-white">
        Observing trade participation and directional pressure : {status}
      </div>

    </motion.div>
  )
}
