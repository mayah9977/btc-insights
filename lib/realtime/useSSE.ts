'use client';

import { useEffect, useState } from 'react';

export function useSSE(
  url: string,
  onData: (data: any) => void
) {
  const [status, setStatus] = useState<
    'connecting' | 'open' | 'error'
  >('connecting');

  useEffect(() => {
    if (!url) return;

    console.log('[SSE] connecting to:', url);

    const es = new EventSource(url);

    es.onopen = () => {
      console.log('[SSE] connection opened');
      setStatus('open');
    };

    es.onmessage = (event) => {
      console.log('[SSE] raw message:', event.data);
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (e) {
        console.warn('[SSE] JSON parse error', e);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] error', err);
      setStatus('error');
      es.close();
    };

    return () => {
      console.log('[SSE] connection closed');
      es.close();
    };
  }, [url, onData]);

  return { status };
}
