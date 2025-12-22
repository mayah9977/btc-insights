// app/api/ws/vip/route.ts
import { NextRequest } from 'next/server';
import { getVIPWSServer } from '@/lib/ws/vipSocket';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { socket } = req as any;
  const wss = getVIPWSServer();

  if (!socket?.server?.ws) {
    socket.server.ws = wss;

    socket.server.on('upgrade', (request: any, socket: any, head: any) => {
      socket.server.ws.handleUpgrade(
        request,
        socket,
        head,
        (ws: any) => {
          socket.server.ws.emit('connection', ws, request);
        }
      );
    });
  }

  return new Response(null, { status: 200 });
}
