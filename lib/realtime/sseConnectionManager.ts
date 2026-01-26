// lib/realtime/sseConnectionManager.ts

type Handler = (data: any) => void

class SSEConnectionManager {
  private static instance: SSEConnectionManager
  private es: EventSource | null = null
  private handlers = new Map<string, Set<Handler>>()
  private refCount = 0

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }
    return this.instance
  }

  private connect() {
    if (this.es) return

    this.es = new EventSource('/api/realtime/stream')

    this.es.onmessage = (e) => {
      let msg: any
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }

      const key = msg.type
      const payload = msg

      // ✅ exact type handlers
      this.handlers.get(key)?.forEach((h) => h(payload))

      // ✅ wildcard handlers
      this.handlers.get('*')?.forEach((h) => h(payload))
    }

    this.es.onerror = () => {
      console.error('[SSE] error')
    }
  }

  subscribe(type: string, handler: Handler) {
    this.connect()
    this.refCount++

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)
      this.refCount--

      // optional: no subscribers → close connection
      if (this.refCount <= 0) {
        this.es?.close()
        this.es = null
      }
    }
  }
}

export const sseManager = SSEConnectionManager.getInstance()
