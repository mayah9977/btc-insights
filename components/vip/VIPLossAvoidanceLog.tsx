type AvoidanceCase = {
  date: string
  market: string
  avoidedLossPercent: number
  reason: string
}

type Props = {
  cases: AvoidanceCase[]
}

export default function VIPLossAvoidanceLog({ cases }: Props) {
  return (
    <div className="space-y-4">
      {cases.map((c, i) => (
        <div
          key={i}
          className="bg-vipCard border border-vipBorder rounded-2xl p-5"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">
              {c.date} · {c.market}
            </div>
            <div className="text-vipSafe font-semibold">
              -{c.avoidedLossPercent}%
            </div>
          </div>

          <div className="mt-2 text-white">
            진입 회피로 손실 방어
          </div>

          <div className="mt-1 text-sm text-zinc-400">
            사유: {c.reason}
          </div>
        </div>
      ))}
    </div>
  )
}
