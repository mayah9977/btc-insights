// lib/vip/vipSseHub.ts
type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();
const clients = new Map<string, Set<Client>>();

/**
 * userId 기준 SSE 등록
 */
export function addVipClient(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const client: Client = { controller };

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  clients.get(userId)!.add(client);

  return () => {
    clients.get(userId)?.delete(client);
  };
}

/**
 * VIP 변경 실시간 전파
 */
export function pushVipUpdate(
  userId: string,
  payload: unknown
) {
  const set = clients.get(userId);
  if (!set) return;

  const message = encoder.encode(
    `data: ${JSON.stringify(payload)}\n\n`
  );

  for (const client of set) {
    try {
      client.controller.enqueue(message);
    } catch {
      set.delete(client);
    }
  }
}
