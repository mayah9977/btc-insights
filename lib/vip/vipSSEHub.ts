// lib/vip/vipSSEHub.ts

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const clients = new Set<Client>();
const encoder = new TextEncoder();

/** VIP SSE client 등록 */
export function addVIPClient(
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const client: Client = { controller };
  clients.add(client);

  console.log('[VIP SSE] client connected. total:', clients.size);

  return () => {
    clients.delete(client);
    console.log('[VIP SSE] client disconnected. total:', clients.size);
  };
}

/** VIP 변경 시 서버 내부에서 호출 */
export function pushVIPUpdate(payload: unknown) {
  const message = encoder.encode(
    `data: ${JSON.stringify(payload)}\n\n`
  );

  for (const client of clients) {
    try {
      client.controller.enqueue(message);
    } catch {
      clients.delete(client);
      console.warn('[VIP SSE] drop closed client');
    }
  }
}
