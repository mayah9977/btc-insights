import { NextRequest } from 'next/server'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url!, 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (!userId) {
      ws.close()
      return
    }

    const vip = await getUserVIPLevel(userId)

    // ✅ VIP 기준으로 수정
    if (vip !== 'VIP') {
      ws.close()
      return
    }

    const timer = setInterval(() => {
      try {
        ws.send(
          JSON.stringify({
            signal: 'VIP_REALTIME_STREAM',
          }),
        )
      } catch {
        ws.close()
      }
    }, 2000)

    ws.on('close', () => clearInterval(timer))
  } catch {
    ws.close()
  }
})

export async function GET(req: NextRequest) {
  const anyReq = req as any

  if (!anyReq.socket?.server?.ws) {
    anyReq.socket.server.ws = wss
  }

  return new Response(null, { status: 200 })
}
