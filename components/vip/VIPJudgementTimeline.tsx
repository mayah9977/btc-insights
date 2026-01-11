import { useVipJudgementStore } from '@/lib/vip/judgementStore'

type TimelineItem = {
  time: string
  state: string
  note: string
}

export default function VIPJudgementTimeline() {
  const { timeline } = useVipJudgementStore()

  if (!timeline || timeline.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {timeline.map((t: TimelineItem, i: number) => (
        <div
          key={i}
          className="flex gap-4 bg-vipCard border border-vipBorder rounded-xl p-4"
        >
          <div className="text-xs text-zinc-500 w-16">
            {t.time}
          </div>

          <div className="flex-1">
            <div className="text-white font-medium">
              {t.state}
            </div>
            <div className="text-sm text-zinc-400 mt-1">
              {t.note}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
