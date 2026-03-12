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
     Institutional Flow 해석
  ===================================================== */

  let phase = 'Institutional Flow 모니터링'
  let interpretation = '대형 자금 흐름을 추적 중입니다.'
  let status = '기관급 자금의 흐름 탐지중'

  if (strongFlow && net > 0.2) {
    phase = 'Institutional Accumulation'
    interpretation =
      '기관급 자금이 적극적으로 매수 포지션을 구축하고 있습니다. 상승 추세가 시작될 가능성이 높습니다.'
    status = 'Strong Buy Pressure'
  }

  else if (strongFlow && net < -0.2) {
    phase = 'Institutional Distribution'
    interpretation =
      '기관급 자금이 매도 포지션을 구축하고 있습니다. 시장에 하락 압력이 형성되고 있습니다.'
    status = 'Strong Sell Pressure'
  }

  else if (mediumFlow && Math.abs(net) < 0.1) {
    phase = 'Liquidity Build-up'
    interpretation =
      '대형 체결은 증가하고 있지만 방향성은 아직 정렬되지 않았습니다. 세력이 유동성을 축적하는 단계일 가능성이 있습니다.'
    status = 'Energy Building'
  }

  else if (net > 0.15) {
    phase = 'Buy Pressure Dominant'
    interpretation =
      '기관 순매수 압력이 점진적으로 증가하고 있습니다.'
    status = 'Buy Pressure'
  }

  else if (net < -0.15) {
    phase = 'Sell Pressure Dominant'
    interpretation =
      '기관 순매도 압력이 점진적으로 증가하고 있습니다.'
    status = 'Sell Pressure'
  }

  /* =====================================================
     Render
  ===================================================== */

  return (
    <motion.div
      className="mt-4 rounded-xl border p-6 text-sm text-neutral-300 relative overflow-hidden"
      style={{
        borderColor: levelColor,
        background:
          'linear-gradient(145deg, rgba(10,10,10,0.9), rgba(0,0,0,0.95))',
        boxShadow: `0 0 25px ${levelColor}35`,
        animation: strongFlow
          ? 'glow 2.5s ease-in-out infinite alternate'
          : 'none'
      }}
    >

      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">

        <div>
          <div className="font-semibold text-white text-base">
            🐋 Institutional Flow(기관급 자금(Whale / Large Player)의 매수·매도 흐름을 관찰중.)
          </div>

          <div className="text-xs text-neutral-400">
            (기관급 자금 흐름 분석)
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
      <div className="mb-4 text-xs text-neutral-400">

        Whale Trade Ratio (시장 거래 중에서 대형 고래 체결이 차지하는 비율)

        <span className="text-yellow-400 font-semibold ml-1">
          {ratioPercent}%
        </span>

        <span className="mx-3 text-neutral-600">|</span>

        Whale Net Pressure (큰 자금이 지금 매수 우위인지 매도 우위인지를 보여주는 값)

        <span
          style={{ color: levelColor }}
          className="font-semibold ml-1"
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

      {/* 트레이딩 가이드 */}
      <div className="text-xs text-neutral-500 leading-relaxed space-y-1">

        <div>• Whale Trade Ratio → 대형 체결 비중</div>
        <div>• Net Pressure → 고래 순매수 / 순매도 방향</div>
        <div>• Ratio + Net 상승 → 기관 매집 가능성 증가</div>
        <div>• Ratio 상승 + Net 하락 → 기관 분배 가능성</div>
        <div>• Sweep → 유동성 스탑 헌팅 가능성</div>
        <div>• Absorption → 고래 물량 흡수 패턴</div>

      </div>

      {/* 상태 */}
      <div className="mt-5 text-center text-xs font-semibold text-white">
        Observing the flow of institutional funds : {status}
      </div>

    </motion.div>
  )
}
