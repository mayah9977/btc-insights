type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  riskLevel: RiskLevel
  cooldownMinutes?: number
}

const riskConfig = {
  LOW: {
    text: 'text-emerald-300',
    label: '리스크 낮음',
    action: '추세 전략 진입 가능',
  },
  MEDIUM: {
    text: 'text-sky-300',
    label: '리스크 보통',
    action: '소액 또는 분할 접근 권장',
  },
  HIGH: {
    text: 'text-red-300',
    label: '리스크 높음',
    action: '관망 또는 대기 권장',
  },
  EXTREME: {
    text: 'text-red-200',
    label: '과열 구간',
    action: '신규 진입 비추천',
  },
} as const

export default function VIPRiskPanel({
  riskLevel,
  cooldownMinutes,
}: Props) {
  const config = riskConfig[riskLevel]

  return (
    <section className="rounded-2xl border border-vipBorder bg-vipCard p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest text-zinc-400 uppercase">
          Risk Control
        </span>
        <span className={`text-sm font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="text-lg font-medium text-white">
        {config.action}
      </div>

      {cooldownMinutes !== undefined && (
        <div className="text-sm text-zinc-400">
          다음 재평가까지 <b className="text-zinc-300">{cooldownMinutes}</b>분
        </div>
      )}
    </section>
  )
}
