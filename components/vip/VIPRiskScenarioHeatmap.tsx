'use client'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type HeatmapCell = {
  hour: number // 0~23
  risk: RiskLevel
  scenarioBias: 'bull' | 'bear' | 'neutral'
}

type Props = {
  data: HeatmapCell[]
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

export default function VIPRiskScenarioHeatmap({ data }: Props) {
  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
      {data.map((cell) => (
        <div
          key={cell.hour}
          className={`h-14 rounded-lg border ${riskColor[cell.risk]} ${scenarioBorder[cell.scenarioBias]} flex flex-col items-center justify-center`}
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
