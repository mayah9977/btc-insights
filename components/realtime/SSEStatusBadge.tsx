'use client';

export function SSEStatusBadge({ status }: { status: string }) {
  const color =
    status === 'open'
      ? 'green'
      : status === 'connecting'
      ? 'orange'
      : 'red';

  return (
    <span style={{ color, fontSize: 12 }}>
      ● 실시간 {status}
    </span>
  );
}
