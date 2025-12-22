'use client';

export function WSStatusBadge({ status }: { status: string }) {
  const color =
    status === 'open'
      ? 'green'
      : status === 'connecting'
      ? 'orange'
      : 'red';

  return (
    <span style={{ fontSize: 12, color }}>
      ● WS {status}
    </span>
  );
}
