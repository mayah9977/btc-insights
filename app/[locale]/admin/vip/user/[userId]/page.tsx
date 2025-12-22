'use client';

import { useEffect, useState } from 'react';

type Audit = {
  before: string;
  after: string;
  reason: string;
  at: number;
};

type Usage = {
  event: string;
  at: number;
};

type Churn = {
  reason: string;
  at: number;
};

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default function VIPUserDetailPage({ params }: PageProps) {
  const [userId, setUserId] = useState<string>('');

  const [audit, setAudit] = useState<Audit[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [churn, setChurn] = useState<Churn[]>([]);
  const [retention, setRetention] = useState<string>('UNKNOWN');

  useEffect(() => {
    params.then(({ userId }) => {
      setUserId(userId);

      fetch(`/api/admin/vip/user/${userId}`)
        .then((r) => r.json())
        .then((d) => {
          setAudit(d.audit ?? []);
          setUsage(d.usage ?? []);
          setChurn(d.churn ?? []);
          setRetention(d.retention ?? 'UNKNOWN');
        });
    });
  }, [params]);

  if (!userId) return null;

  return (
    <main style={{ padding: 24 }}>
      <h1>👤 VIP User Detail</h1>
      <p>
        User: <b>{userId}</b>
      </p>
      <p>
        Retention Signal: <b>{retention}</b>
      </p>

      <h2>📜 Audit</h2>
      <ul>
        {audit.map((a, i) => (
          <li key={i}>
            {new Date(a.at).toLocaleString()} — {a.reason} ({a.before} → {a.after})
          </li>
        ))}
      </ul>

      <h2>⚙️ Usage</h2>
      <ul>
        {usage.map((u, i) => (
          <li key={i}>
            {new Date(u.at).toLocaleString()} — {u.event}
          </li>
        ))}
      </ul>

      <h2>🚪 Churn</h2>
      <ul>
        {churn.map((c, i) => (
          <li key={i}>
            {new Date(c.at).toLocaleString()} — {c.reason}
          </li>
        ))}
      </ul>
    </main>
  );
}
