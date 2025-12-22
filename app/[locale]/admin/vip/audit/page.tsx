'use client';

import { useEffect, useState } from 'react';

type VIPAuditLog = {
  userId: string;
  before: string;
  after: string;
  reason: string;
  at: number;
};

const reasonColor: Record<string, string> = {
  PAYMENT: 'green',
  EXTEND: 'green',
  ADMIN: 'blue',
  RECOVER: 'blue',
  CANCEL: 'orange',
  EXPIRE: 'gray',
  ABUSE: 'red',
};

export default function VIPAuditPage() {
  const [logs, setLogs] = useState<VIPAuditLog[]>([]);

  useEffect(() => {
    fetch('/api/admin/vip/audit')
      .then((r) => r.json())
      .then(setLogs);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        📜 VIP Audit Timeline
      </h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {logs.map((l, i) => (
          <li
            key={i}
            style={{
              padding: '10px 12px',
              marginBottom: 8,
              border: '1px solid #ddd',
              borderRadius: 6,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                padding: '2px 6px',
                borderRadius: 4,
                background: reasonColor[l.reason] ?? '#999',
                color: '#fff',
                minWidth: 64,
                textAlign: 'center',
              }}
            >
              {l.reason}
            </span>

            <span style={{ fontSize: 12, color: '#666' }}>
              {new Date(l.at).toLocaleString()}
            </span>

            <span style={{ fontWeight: 500 }}>
              {l.userId}
            </span>

            <span>
              {l.before} → {l.after}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
