'use client'

export function SSEStatusBadge({ status }: { status: string }) {
  // ✅ Dev Only
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const color =
    status === 'open'
      ? 'green'
      : status === 'connecting'
      ? 'orange'
      : 'red'

  return (
    <span style={{ color, fontSize: 12 }}>
      ● 실시간 {status}
    </span>
  )
}
