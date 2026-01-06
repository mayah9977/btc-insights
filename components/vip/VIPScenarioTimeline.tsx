type Scenario = {
  id: string
  title: string
  description: string
  probability: number // 0 ~ 100
  tone: 'bull' | 'bear' | 'neutral'
}

type Props = {
  scenarios: Scenario[]
}

const toneStyle = {
  bull: {
    dot: 'bg-vipSafe',
    bar: 'bg-vipSafe',
  },
  bear: {
    dot: 'bg-vipDanger',
    bar: 'bg-vipDanger',
  },
  neutral: {
    dot: 'bg-zinc-400',
    bar: 'bg-zinc-400',
  },
} as const

export default function VIPScenarioTimeline({ scenarios }: Props) {
  return (
    <div className="space-y-4">
      {scenarios.map((s, i) => {
        const tone = toneStyle[s.tone]

        return (
          <div
            key={s.id}
            className="flex items-start gap-4 rounded-xl border border-vipBorder bg-vipCard p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${tone.dot}`} />
              {i !== scenarios.length - 1 && (
                <div className="w-px flex-1 bg-vipBorder mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">
                  {s.title}
                </h4>
                <span className="text-sm text-zinc-400">
                  {s.probability}%
                </span>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed">
                {s.description}
              </p>

              {/* Probability Bar */}
              <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${tone.bar}`}
                  style={{ width: `${s.probability}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
