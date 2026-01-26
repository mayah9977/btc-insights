'use client'

type Props = {
  /** 어제 대비 변화율 (%), null이면 표시 안 함 */
  deltaPercent: number | null
}

/**
 * VIPDeltaIndicator
 *
 * 역할:
 * - 어제 대비 변화율 시각화
 * - ▲ / ▼ / 0% 표시
 * - 색상 + 방향 아이콘만 담당 (Presenter Only)
 */
export default function VIPDeltaIndicator({
  deltaPercent,
}: Props) {
  // ❌ 데이터 없으면 숨김 (UX 기준)
  if (deltaPercent === null) return null

  const isUp = deltaPercent > 0
  const isDown = deltaPercent < 0
  const isFlat = deltaPercent === 0

  const colorClass = isUp
    ? 'text-emerald-400'
    : isDown
    ? 'text-red-400'
    : 'text-zinc-400'

  const arrow = isUp ? '▲' : isDown ? '▼' : '–'

  return (
    <div
      className="flex items-center gap-1 text-sm font-medium"
      aria-label={`어제 대비 변화율 ${deltaPercent}%`}
    >
      <span className={colorClass}>{arrow}</span>

      <span className={colorClass}>
        {Math.abs(deltaPercent).toFixed(2)}%
      </span>

      <span className="text-xs text-zinc-500">
        어제 대비
      </span>
    </div>
  )
}
