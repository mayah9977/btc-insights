// lib/realtime/sseHub.ts

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const clients = new Set<Client>();
const encoder = new TextEncoder();

/** SSE client 등록 */
export function addSSEClient(
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const client: Client = { controller };
  clients.add(client);

  console.log('[SSE] client connected. total:', clients.size);

  return () => {
    clients.delete(client);
    console.log('[SSE] client disconnected. total:', clients.size);
  };
}

/** 서버 내부에서 호출하는 push 함수 */
export function pushRealtimeUpdate(payload: unknown) {
  const message = encoder.encode(
    `data: ${JSON.stringify(payload)}\n\n`
  );

  for (const client of clients) {
    try {
      client.controller.enqueue(message);
    } catch {
      // 이미 닫힌 스트림 → 제거
      clients.delete(client);
      console.warn('[SSE] drop closed client');
    }
  }
}
