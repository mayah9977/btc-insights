'use client'

type Status = 'connecting' | 'open' | 'error' | 'closed'

function dot(status: Status) {
  if (status === 'open') return '🟢'
  if (status === 'connecting') return '🟠'
  return '🔴'
}

export function RealtimeStatusBadge({
  sse,
  ws,
}: {
  sse: Status
  ws?: Status
}) {
  // ✅ Dev Only
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="flex items-center gap-3 text-xs text-[#D1D4DC]">
      <span className="flex items-center gap-1">
        <span>{dot(sse)}</span>
        <span>SSE</span>
      </span>

      {ws && (
        <span className="flex items-center gap-1">
          <span>{dot(ws)}</span>
          <span>WS</span>
        </span>
      )}
    </div>
  )
}
