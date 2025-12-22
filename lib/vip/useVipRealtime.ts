// lib/vip/useVipRealtime.ts
'use client';

import { useEffect } from 'react';
import { VIPLevel } from './vipTypes';

export function useVipRealtime(
  userId: string,
  setVIP: (vip: VIPLevel) => void
) {
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(
      `ws://localhost:3000/api/ws/vip?userId=${userId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'VIP_UPDATE') {
        setVIP(data.vip);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId, setVIP]);
}
