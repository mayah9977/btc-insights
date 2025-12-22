'use client'

import { getNotificationHistory } from '@/lib/notification/notificationHistoryStore'
import { calcPressureIndex } from '@/lib/notification/calcPressureIndex'

export function NotificationHeatmap() {
  const history = getNotificationHistory()
  const pressure = calcPressureIndex()

  // 최근 24시간 (시간 단위 버킷)
  const buckets = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
  }))

  history.forEach((n) => {
    const h = new Date(n.at).getHours()
    const bucket = buckets.find((b) => b.hour === h)
    if (bucket) bucket.count++
  })

  const max = Math.max(...buckets.map((b) => b.count), 1)

  // Pressure → base color 결정
  const baseColor =
    pressure > 75
      ? [239, 68, 68] // red
      : pressure > 40
      ? [234, 179, 8] // yellow
      : [34, 197, 94] // green

  return (
    <div className="grid grid-cols-12 gap-1">
      {buckets.map((b) => {
        const intensity = b.count / max

        return (
          <div
            key={b.hour}
            title={`${b.hour}시 · ${b.count}건`}
            className="h-6 rounded"
            style={{
              backgroundColor: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${Math.max(
                0.15,
                intensity
              )})`,
            }}
          />
        )
      })}
    </div>
  )
}
