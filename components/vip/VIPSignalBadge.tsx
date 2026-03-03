'use client'

type Props = {
  dominant: 'LONG' | 'SHORT' | 'NONE'
  confidence: number
}

export default function VIPSignalBadge({
  dominant,
  confidence,
}: Props) {

  if (confidence < 10)
    return (
      <div className="px-3 py-1 text-xs rounded bg-zinc-600 text-white">
        ⚪ 관망
      </div>
    )

  if (dominant === 'LONG' && confidence >= 45)
    return (
      <div className="px-3 py-1 text-xs rounded bg-emerald-500 text-black font-bold animate-pulse">
        🔥 강한 매수 신호
      </div>
    )

  if (dominant === 'SHORT' && confidence >= 45)
    return (
      <div className="px-3 py-1 text-xs rounded bg-blue-500 text-black font-bold animate-pulse">
        🔥 강한 매도 신호
      </div>
    )

  if (dominant === 'LONG')
    return (
      <div className="px-3 py-1 text-xs rounded bg-emerald-400 text-black">
        🟢 매수 우세
      </div>
    )

  if (dominant === 'SHORT')
    return (
      <div className="px-3 py-1 text-xs rounded bg-blue-400 text-black">
        🔵 매도 우세
      </div>
    )

  return null
}
