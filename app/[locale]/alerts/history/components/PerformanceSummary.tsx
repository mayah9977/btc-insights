type Props = {
  histories: {
    percent?: number
  }[]
}

export default function PerformanceSummary({ histories }: Props) {
  const percents = histories
    .map(h => h.percent)
    .filter((v): v is number => typeof v === 'number')

  const avg =
    percents.reduce((a, b) => a + b, 0) / (percents.length || 1)

  const winRate =
    percents.filter(p => p > 0).length / (percents.length || 1)

  return (
    <div className="grid grid-cols-3 gap-6">
      <Card label="총 트리거" value={histories.length} />
      <Card
        label="평균 변동률"
        value={`${avg.toFixed(2)} %`}
        accent="text-indigo-400"
      />
      <Card
        label="승률"
        value={`${(winRate * 100).toFixed(1)} %`}
        accent="text-emerald-400"
      />
    </div>
  )
}

function Card({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-[#0f131a] border border-white/10 p-6">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent ?? ''}`}>
        {value}
      </div>
    </div>
  )
}
