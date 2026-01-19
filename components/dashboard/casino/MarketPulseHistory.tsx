'use client'

import { useVipOverviewStore } from '@/lib/vip/overviewStore'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type HistoryItem = {
  level: RiskLevel
  label: string
}

const toneStyle: Record<
  RiskLevel,
  { color: string; emoji: string }
> = {
  LOW: {
    color: 'text-emerald-300',
    emoji: '🟢',
  },
  MEDIUM: {
    color: 'text-sky-300',
    emoji: '🟡',
  },
  HIGH: {
    color: 'text-orange-400',
    emoji: '🟠',
  },
  EXTREME: {
    color: 'text-red-400',
    emoji: '🔴',
  },
}

/**
 * MarketPulse Mini History
 * - 연출 전용
 * - store 확장 전까지는 fallback 데이터 사용
 */
export default function MarketPulseHistory() {
  const overview = useVipOverviewStore() as {
    pulseHistory?: HistoryItem[]
  }

  // ⬇️ store에 아직 없을 경우를 대비한 안전 장치
  const history: HistoryItem[] =
    overview.pulseHistory ??
    [
      { level: 'LOW', label: '조용한 흐름' },
      { level: 'MEDIUM', label: '움직임 감지' },
      { level: 'HIGH', label: '경고 신호 증가' },
      { level: 'EXTREME', label: '과열 진입' },
    ]

  const items = history.slice(-5)

  return (
    <section className="rounded-xl border border-vipBorder bg-vipCard px-4 py-3 space-y-2">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        최근 긴장 변화
      </div>

      <div className="flex gap-3 overflow-x-auto">
        {items.map((item: HistoryItem, idx: number) => {
          const tone = toneStyle[item.level]

          return (
            <div
              key={idx}
              className="min-w-[120px] rounded-lg border border-vipBorder bg-black/30 px-3 py-2"
            >
              <div className={`text-sm font-semibold ${tone.color}`}>
                {tone.emoji} {item.level}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
