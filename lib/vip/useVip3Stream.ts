'use client';

import { useEffect } from 'react';

export function useVip3Stream(userId: string, onData: (d: any) => void) {
  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:3000/api/ws/vip3?userId=${userId}`
    );
    ws.onmessage = (e) => onData(JSON.parse(e.data));
    return () => ws.close();
  }, [userId, onData]);
}
