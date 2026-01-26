'use client'

import { useWhaleWarning } from '@/lib/realtime/useWhaleWarning'

type Props = {
  symbol: string
}

/**
 * VIPWhaleWarningBanner
 *
 * 역할
 * - EXTREME 이전 단계 사전 경보 전용
 * - WHALE_WARNING 발생 시에만 표시
 * - RiskPanel / EXTREME 배너보다 항상 위
 */
export default function VIPWhaleWarningBanner({
  symbol,
}: Props) {
  const { warning } = useWhaleWarning(symbol)

  // 경보 없으면 렌더 안 함
  if (!warning) return null

  return (
    <section
      className="
        mb-3
        rounded-xl
        border border-amber-600/60
        bg-amber-950/40
        px-4 py-3
        shadow-[0_0_40px_rgba(245,158,11,0.15)]
        animate-pulse
      "
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="text-amber-400 text-lg leading-none">
          ⚠️
        </div>

        {/* 메시지 */}
        <div className="flex-1 space-y-1">
          <div className="text-sm font-semibold text-amber-300">
            고래 체결 강도 급증 감지
          </div>

          <div className="text-xs text-amber-200/80">
            단기 변동성 확대 가능성이 높아지고 있습니다.
            <br />
            EXTREME 전환 가능성에 유의하세요.
          </div>
        </div>

        {/* 수치 (보조) */}
        <div className="text-right text-[11px] text-amber-300/80">
          <div>
            whale {warning.whaleIntensity.toFixed(2)}
          </div>
        </div>
      </div>
    </section>
  )
}
