'use client';

type Status = 'connecting' | 'open' | 'error' | 'closed';

function dot(status: Status) {
  if (status === 'open') return '🟢';
  if (status === 'connecting') return '🟠';
  return '🔴';
}

export function RealtimeStatusBadge({
  sse,
  ws,
}: {
  sse: Status;
  ws?: Status;
}) {
  return (
    <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
      <span>{dot(sse)} SSE</span>
      {ws && <span>{dot(ws)} WS</span>}
    </div>
  );
}
