'use client'

import { useVipScenarioStore } from '@/lib/vip/scenarioStore'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export type HeatmapCell = {
  hour: number // 0~23
  risk: RiskLevel
  scenarioBias: 'bull' | 'bear' | 'neutral'
}

const riskColor: Record<RiskLevel, string> = {
  LOW: 'bg-vipSafe/30',
  MEDIUM: 'bg-vipAccent/30',
  HIGH: 'bg-vipDanger/40',
  EXTREME: 'bg-red-700/60',
}

const scenarioBorder: Record<
  HeatmapCell['scenarioBias'],
  string
> = {
  bull: 'border-vipSafe',
  bear: 'border-vipDanger',
  neutral: 'border-vipBorder',
}

/**
 * VIP Risk Scenario Heatmap
 * - Presenter-only
 * - props ❌
 * - 계산 ❌
 * - 시나리오 데이터는 SSOT(store)에서 직접 구독
 */
export default function VIPRiskScenarioHeatmap() {
  const { heatmap } = useVipScenarioStore()

  if (!heatmap || heatmap.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
      {heatmap.map((cell) => (
        <div
          key={cell.hour}
          className={[
            'h-14 rounded-lg border flex flex-col items-center justify-center',
            riskColor[cell.risk],
            scenarioBorder[cell.scenarioBias],
          ].join(' ')}
        >
          <div className="text-xs text-zinc-300">
            {cell.hour}:00
          </div>
          <div className="text-[10px] text-zinc-400">
            {cell.risk}
          </div>
        </div>
      ))}
    </div>
  )
}
