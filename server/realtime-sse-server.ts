//server/realtime-sse-server.ts   

import { createHmac, timingSafeEqual } from 'crypto'
import http, {
  IncomingMessage,
  ServerResponse,
} from 'http'

import { createRedisSubscriber } from '../lib/redis/server'

type RealtimeScope = 'public' | 'vip'

type RealtimeTokenPayload = {
  sub: string
  email?: string
  scope: 'vip'
  level: 'VIP'
  iat: number
  exp: number
  nonce: string
}

type SSEClient = {
  id: string
  scope: RealtimeScope
  connectedAt: number
  res: ServerResponse
}

const PORT = Number(process.env.PORT ?? 4000)

const PUBLIC_CHANNEL = 'realtime:derived:public'
const VIP_CHANNEL = 'realtime:derived:vip'

const HEARTBEAT_INTERVAL_MS = 15_000

const clientsByScope: Record<RealtimeScope, Set<SSEClient>> = {
  public: new Set<SSEClient>(),
  vip: new Set<SSEClient>(),
}

let lastRedisMessageAt: number | null = null
let lastPublicMessageAt: number | null = null
let lastVipMessageAt: number | null = null
let redisSubscribed = false
let redisSubscribeError: string | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`[REALTIME_SSE_SERVER] ${name} is not defined`)
  }

  return value
}

function parseCsvEnv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function getAllowedOrigins(): string[] {
  return parseCsvEnv('REALTIME_ALLOWED_ORIGINS')
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true
  }

  const allowedOrigins = getAllowedOrigins()

  if (allowedOrigins.length === 0) {
    return false
  }

  return allowedOrigins.includes(origin)
}

function setCorsHeaders(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  const origin = req.headers.origin

  if (!isOriginAllowed(origin)) {
    res.writeHead(403, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(
      JSON.stringify({
        ok: false,
        error: 'ORIGIN_NOT_ALLOWED',
      }),
    )

    return false
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS',
  )

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization',
  )

  res.setHeader('Access-Control-Max-Age', '86400')

  return true
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input
    .replaceAll('-', '+')
    .replaceAll('_', '/')

  const padded =
    normalized +
    '='.repeat((4 - (normalized.length % 4)) % 4)

  return Buffer.from(padded, 'base64')
}

function signValue(value: string, secret: string): string {
  return base64UrlEncode(
    createHmac('sha256', secret).update(value).digest(),
  )
}

function verifyRealtimeToken(
  token: string,
  expectedScope: RealtimeScope,
): RealtimeTokenPayload | null {
  if (expectedScope !== 'vip') {
    return null
  }

  const secret = getRequiredEnv('REALTIME_TOKEN_SECRET')

  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const [encodedHeader, encodedPayload, signature] = parts

  if (!encodedHeader || !encodedPayload || !signature) {
    return null
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = signValue(signingInput, secret)

  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null
  }

  let payload: RealtimeTokenPayload

  try {
    payload = JSON.parse(
      base64UrlDecode(encodedPayload).toString('utf8'),
    ) as RealtimeTokenPayload
  } catch {
    return null
  }

  const now = Math.floor(Date.now() / 1000)

  if (payload.scope !== 'vip') {
    return null
  }

  if (payload.level !== 'VIP') {
    return null
  }

  if (!payload.sub) {
    return null
  }

  if (
    typeof payload.exp !== 'number' ||
    typeof payload.iat !== 'number'
  ) {
    return null
  }

  if (payload.exp < now) {
    return null
  }

  if (payload.iat > now + 30) {
    return null
  }

  return payload
}

function getRequestUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? `127.0.0.1:${PORT}`

  return new URL(req.url ?? '/', `http://${host}`)
}

function writeJson(
  res: ServerResponse,
  status: number,
  body: unknown,
) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })

  res.end(JSON.stringify(body))
}

function getBearerToken(req: IncomingMessage): string | null {
  const authorization = req.headers.authorization

  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

function isMetricsAuthorized(
  req: IncomingMessage,
  url: URL,
): boolean {
  const metricsToken = process.env.METRICS_TOKEN

  if (!metricsToken) {
    return false
  }

  const queryToken = url.searchParams.get('token')
  const bearerToken = getBearerToken(req)

  return (
    queryToken === metricsToken ||
    bearerToken === metricsToken
  )
}

function createClientId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function sendSSE(
  client: SSEClient,
  payload: string,
): boolean {
  try {
    return client.res.write(payload)
  } catch (error) {
    console.error('[REALTIME_SSE] write failed', error)
    return false
  }
}

function sendSSEEvent(
  client: SSEClient,
  eventName: string,
  data: unknown,
): boolean {
  return sendSSE(
    client,
    `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`,
  )
}

function removeClient(client: SSEClient) {
  clientsByScope[client.scope].delete(client)

  try {
    client.res.end()
  } catch {}
}

function fanout(scope: RealtimeScope, message: string) {
  const clients = clientsByScope[scope]

  if (clients.size === 0) {
    return
  }

  const payload = `data: ${message}\n\n`

  for (const client of Array.from(clients)) {
    const ok = sendSSE(client, payload)

    if (!ok) {
      removeClient(client)
    }
  }
}

function handleHealth(res: ServerResponse) {
  writeJson(res, 200, {
    ok: true,
    service: 'realtime-sse-server',
    uptime: process.uptime(),
    redisSubscribed,
    ts: Date.now(),
  })
}

function handleMetrics(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) {
  if (!isMetricsAuthorized(req, url)) {
    writeJson(res, 401, {
      ok: false,
      error: 'UNAUTHORIZED',
    })

    return
  }

  writeJson(res, 200, {
    ok: true,
    service: 'realtime-sse-server',
    uptime: process.uptime(),
    clients:
      clientsByScope.public.size + clientsByScope.vip.size,
    publicClients: clientsByScope.public.size,
    vipClients: clientsByScope.vip.size,
    redisSubscribed,
    redisSubscribeError,
    lastRedisMessageAt,
    lastPublicMessageAt,
    lastVipMessageAt,
    ts: Date.now(),
  })
}

function handleStream(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) {
  const scopeParam = url.searchParams.get('scope')

  const scope: RealtimeScope =
    scopeParam === 'vip' ? 'vip' : 'public'

  if (scopeParam && scopeParam !== 'vip' && scopeParam !== 'public') {
    writeJson(res, 400, {
      ok: false,
      error: 'INVALID_SCOPE',
    })

    return
  }

  if (scope === 'vip') {
    const token = url.searchParams.get('token')

    if (!token) {
      writeJson(res, 401, {
        ok: false,
        error: 'TOKEN_REQUIRED',
      })

      return
    }

    const payload = verifyRealtimeToken(token, scope)

    if (!payload) {
      writeJson(res, 401, {
        ok: false,
        error: 'INVALID_TOKEN',
      })

      return
    }
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const client: SSEClient = {
    id: createClientId(),
    scope,
    connectedAt: Date.now(),
    res,
  }

  clientsByScope[scope].add(client)

  sendSSE(client, 'retry: 1000\n: connected\n\n')

  sendSSEEvent(client, 'connected', {
    ok: true,
    scope,
    ts: Date.now(),
  })

  const heartbeat = setInterval(() => {
    const ok = sendSSEEvent(client, 'ping', {
      ts: Date.now(),
    })

    if (!ok) {
      clearInterval(heartbeat)
      removeClient(client)
    }
  }, HEARTBEAT_INTERVAL_MS)

  const cleanup = () => {
    clearInterval(heartbeat)
    clientsByScope[scope].delete(client)
  }

  req.on('close', cleanup)
  req.on('aborted', cleanup)
  res.on('close', cleanup)
  res.on('error', cleanup)
}

async function startRedisSubscriber() {
  const subscriber = createRedisSubscriber()

  subscriber.on('message', (channel: string, message: string) => {
    lastRedisMessageAt = Date.now()

    if (channel === PUBLIC_CHANNEL) {
      lastPublicMessageAt = lastRedisMessageAt
      fanout('public', message)
      fanout('vip', message)
      return
    }

    if (channel === VIP_CHANNEL) {
      lastVipMessageAt = lastRedisMessageAt
      fanout('vip', message)
      return
    }
  })

  subscriber.on('ready', () => {
    console.log('[REALTIME_SSE] Redis subscriber ready')
  })

  subscriber.on('reconnecting', (delay: number) => {
    console.warn(
      '[REALTIME_SSE] Redis subscriber reconnecting',
      delay,
    )
  })

  subscriber.on('error', (error) => {
    redisSubscribeError =
      error instanceof Error ? error.message : String(error)

    console.error('[REALTIME_SSE] Redis subscriber error', error)
  })

  await subscriber.subscribe(PUBLIC_CHANNEL, VIP_CHANNEL)

  redisSubscribed = true
  redisSubscribeError = null

  console.log('[REALTIME_SSE] subscribed', {
    channels: [PUBLIC_CHANNEL, VIP_CHANNEL],
  })
}

const server = http.createServer((req, res) => {
  try {
    if (!setCorsHeaders(req, res)) {
      return
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = getRequestUrl(req)

    if (req.method !== 'GET') {
      writeJson(res, 405, {
        ok: false,
        error: 'METHOD_NOT_ALLOWED',
      })

      return
    }

    if (url.pathname === '/health') {
      handleHealth(res)
      return
    }

    if (url.pathname === '/metrics') {
      handleMetrics(req, res, url)
      return
    }

    if (url.pathname === '/stream') {
      handleStream(req, res, url)
      return
    }

    writeJson(res, 404, {
      ok: false,
      error: 'NOT_FOUND',
    })
  } catch (error) {
    console.error('[REALTIME_SSE] request failed', error)

    if (!res.headersSent) {
      writeJson(res, 500, {
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
      })
    } else {
      try {
        res.end()
      } catch {}
    }
  }
})

server.keepAliveTimeout = 70_000
server.headersTimeout = 75_000

startRedisSubscriber()
  .then(() => {
    server.listen(PORT, () => {
      console.log('[REALTIME_SSE] listening', {
        port: PORT,
        channels: [PUBLIC_CHANNEL, VIP_CHANNEL],
      })
    })
  })
  .catch((error) => {
    console.error('[REALTIME_SSE] boot failed', error)
    process.exit(1)
  })

function shutdown(signal: string) {
  console.log('[REALTIME_SSE] shutdown', { signal })

  for (const client of Array.from(clientsByScope.public)) {
    removeClient(client)
  }

  for (const client of Array.from(clientsByScope.vip)) {
    removeClient(client)
  }

  server.close(() => {
    process.exit(0)
  })

  setTimeout(() => {
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
