// lib/ws/vipSocket.ts
import { WebSocketServer } from 'ws';
import { getUserVIPLevel } from '@/lib/vip/vipServer';

let wss: WebSocketServer | null = null;

export function getVIPWSServer() {
  if (wss) return wss;

  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', async (ws, request) => {
    try {
      const url = new URL(request.url ?? '', 'http://localhost');
      const userId = url.searchParams.get('userId');

      if (!userId) {
        ws.close();
        return;
      }

      const vip = await getUserVIPLevel(userId);

      ws.send(
        JSON.stringify({
          type: 'VIP_UPDATE',
          vip,
        })
      );
    } catch {
      ws.close();
    }
  });

  return wss;
}
