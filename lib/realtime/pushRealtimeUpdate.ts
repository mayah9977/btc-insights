// lib/realtime/pushRealtimeUpdate.ts

type SSEClient = {
  controller: ReadableStreamDefaultController;
};

const clients = new Set<SSEClient>();

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add({ controller });
}

export function removeClient(controller: ReadableStreamDefaultController) {
  for (const c of clients) {
    if (c.controller === controller) {
      clients.delete(c);
      break;
    }
  }
}

export function pushRealtimeUpdate(payload: unknown) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const { controller } of clients) {
    try {
      controller.enqueue(
        new TextEncoder().encode(message)
      );
    } catch {
      removeClient(controller);
    }
  }
}
