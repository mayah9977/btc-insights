'use client';

import { useEffect, useRef } from 'react';
import type { VIPLevel } from './vipTypes';
import { notifyVipUpgrade } from './vipNotifier';

type VipPayload =
  | { type: 'vip'; vipLevel: VIPLevel }
  | { type: 'heartbeat' };

const HEARTBEAT_TIMEOUT = 15_000; // 15s
const BASE_RETRY_DELAY = 3_000;   // 3s
const MAX_RETRY_DELAY = 30_000;

export function useVipRealtime(
  userId: string,
  setVip: (level: VIPLevel) => void
) {
  const esRef = useRef<EventSource | null>(null);
  const lastVipRef = useRef<VIPLevel | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);
  const retryDelay = useRef(BASE_RETRY_DELAY);

  // ✅ setter 고정 (핵심)
  const setVipRef = useRef(setVip);
  setVipRef.current = setVip;

  useEffect(() => {
    if (!userId) return;

    function cleanup() {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (heartbeatTimer.current) {
        clearTimeout(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    }

    function connect() {
      cleanup();

      const es = new EventSource(`/api/vip/stream?userId=${userId}`);
      esRef.current = es;

      const resetHeartbeat = () => {
        if (heartbeatTimer.current) {
          clearTimeout(heartbeatTimer.current);
        }
        heartbeatTimer.current = setTimeout(() => {
          es.close(); // heartbeat timeout → reconnect
        }, HEARTBEAT_TIMEOUT);
      };

      es.onopen = () => {
        retryDelay.current = BASE_RETRY_DELAY;
        resetHeartbeat();
      };

      es.onmessage = (event) => {
        resetHeartbeat();

        const data: VipPayload = JSON.parse(event.data);
        if (data.type === 'heartbeat') return;

        if (data.vipLevel !== lastVipRef.current) {
          const prev = lastVipRef.current;
          lastVipRef.current = data.vipLevel;

          // ✅ ref 통해 안전 호출
          setVipRef.current(data.vipLevel);

          if (prev) {
            notifyVipUpgrade(userId, prev, data.vipLevel);
          }
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, MAX_RETRY_DELAY);

        retryTimer.current = setTimeout(connect, delay);
      };
    }

    connect();

    return cleanup;
  }, [userId]); // ✅ setVip 제거 (핵심)
}
