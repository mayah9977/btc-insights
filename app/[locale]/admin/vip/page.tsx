'use client';

import { useState } from 'react';
import type { VIPLevel } from '@/lib/vip/vipTypes';
import { setAdminVIP } from '@/lib/vip/vipAdmin';

export default function AdminVIPPage() {
  const [userId, setUserId] = useState('');
  const [level, setLevel] = useState<VIPLevel>('VIP');
  const [priceId, setPriceId] = useState('');

  /** 1️⃣ Admin Override (즉시 VIP 강제 적용) */
  const applyAdminVIP = () => {
    if (!userId) return alert('userId를 입력하세요');
    setAdminVIP(userId, level);
    alert(`Admin Override 적용: ${userId} → ${level}`);
  };

  /** 2️⃣ 강제 만료 */
  const forceExpire = async () => {
    if (!userId) return alert('userId를 입력하세요');

    await fetch('/api/admin/vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'expire',
      }),
    });

    alert(`강제 만료 처리됨: ${userId}`);
  };

  /** 3️⃣ 복구 (priceId 기준) */
  const recoverVIP = async () => {
    if (!userId || !priceId) {
      return alert('userId와 priceId를 입력하세요');
    }

    await fetch('/api/admin/vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'recover',
        priceId,
      }),
    });

    alert(`VIP 복구 완료: ${userId}`);
  };

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>👑 Admin VIP Control</h1>

      {/* User ID */}
      <input
        placeholder="userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: '100%', marginTop: 12 }}
      />

      {/* VIP Level */}
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value as VIPLevel)}
        style={{ width: '100%', marginTop: 12 }}
      >
        <option value="FREE">FREE</option>
        <option value="VIP">VIP</option>
      </select>

      {/* Admin Override */}
      <button
        style={{ width: '100%', marginTop: 12 }}
        onClick={applyAdminVIP}
      >
        Admin Override 적용
      </button>

      <hr style={{ margin: '24px 0' }} />

      {/* 강제 만료 */}
      <button
        style={{ width: '100%' }}
        onClick={forceExpire}
      >
        강제 만료 (Expire)
      </button>

      <hr style={{ margin: '24px 0' }} />

      {/* 복구 */}
      <input
        placeholder="priceId (예: MONTHLY / YEAR)"
        value={priceId}
        onChange={(e) => setPriceId(e.target.value)}
        style={{ width: '100%', marginTop: 12 }}
      />

      <button
        style={{ width: '100%', marginTop: 12 }}
        onClick={recoverVIP}
      >
        VIP 복구 (Recover)
      </button>
    </main>
  );
}
