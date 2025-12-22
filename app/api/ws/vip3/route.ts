import { NextRequest } from 'next/server';
import { getUserVIPLevel } from '@/lib/vip/vipServer';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (ws, req) => {
  const userId = new URL(req.url!, 'http://localhost').searchParams.get('userId')!;
  const vip = await getUserVIPLevel(userId);

  if (vip !== 'VIP3') {
    ws.close();
    return;
  }

  const timer = setInterval(() => {
    ws.send(JSON.stringify({ signal: 'VIP3_REALTIME_STREAM' }));
  }, 2000);

  ws.on('close', () => clearInterval(timer));
});

export async function GET(req: NextRequest) {
  const { socket } = req as any;
  if (!socket.server.ws) {
    socket.server.ws = wss;
  }
  return new Response(null, { status: 200 });
}
