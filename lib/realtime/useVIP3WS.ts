'use client';

import { useEffect, useRef, useState } from 'react';

type WSStatus = 'connecting' | 'open' | 'closed' | 'error';

export function useVIP3WS(
  url: string,
  onMessage: (data: any) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const [status, setStatus] = useState<WSStatus>('connecting');

  useEffect(() => {
    let alive = true;

    const connect = () => {
      if (!alive) return;

      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setStatus('open');
      };

      ws.onmessage = (e) => {
        try {
          onMessage(JSON.parse(e.data));
        } catch {}
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        if (!alive) return;
        setStatus('error');

        const delay = Math.min(
          1000 * 2 ** retryRef.current,
          15000
        );
        retryRef.current++;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      alive = false;
      wsRef.current?.close();
      setStatus('closed');
    };
  }, [url, onMessage]);

  return { status };
}
