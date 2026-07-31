// lib/realtime/sseConnectionManager.ts

import { SSE_EVENT } from './types'
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from './whaleEffects'
import { handleRiskUpdate } from './vipEffects'

import { applyRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { applyLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type Handler = (data: any) => void

type RealtimeTransport = 'vps' | 'vercel'

type RealtimeVercelScope = 'vip' | 'realtime'

type RealtimeTokenResponse = {
  ok?: boolean
  url?: unknown
  error?: unknown
}

const REALTIME_SSE_STALE_MS = 55_000
const REALTIME_MARKET_DATA_STALE_MS = 90_000
const REALTIME_SSE_WATCHDOG_INTERVAL_MS = 15_000
const REALTIME_VPS_HANDSHAKE_TIMEOUT_MS = 5_000
const REALTIME_VPS_RECOVERY_INTERVAL_MS =
  5 * 60_000
const REALTIME_VPS_RECOVERY_JITTER_MS =
  30_000

const REALTIME_VPS_ENABLED =
  process.env.NEXT_PUBLIC_REALTIME_VPS_ENABLED === 'true'

const REALTIME_SSE_DEBUG =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_REALTIME_SSE_DEBUG === 'true'

const REALTIME_SSE_SUMMARY_LOG_INTERVAL_MS =
  30_000

const MARKET_DATA_EVENTS = new Set([
  'PRICE_TICK',
  'OI_TICK',
  'VOLUME_TICK',
  'FUNDING_RATE_TICK',
  'WHALE_INTENSITY',
  'WHALE_TRADE_FLOW',
  'WHALE_NET_PRESSURE',
])

const VIP_EVENTS = new Set([
  SSE_EVENT.PRICE_TICK,
  SSE_EVENT.OI_TICK,
  SSE_EVENT.VOLUME_TICK,
  SSE_EVENT.FUNDING_RATE_TICK,
  SSE_EVENT.SENTIMENT_UPDATE,

  'RISK_UPDATE',

  'MARKET_STATE',
  'FINAL_DECISION',

  'FMAI',

  SSE_EVENT.WHALE_INTENSITY,
  SSE_EVENT.WHALE_TRADE_FLOW,
  SSE_EVENT.WHALE_NET_PRESSURE,
  SSE_EVENT.WHALE_ABSORPTION,
  SSE_EVENT.LIQUIDITY_SWEEP,
  SSE_EVENT.MARKET_REGIME,

  SSE_EVENT.BB_SIGNAL,
  SSE_EVENT.BB_LIVE_COMMENTARY,
])

const THROTTLE_EVENTS = new Set([
  SSE_EVENT.PRICE_TICK,
  SSE_EVENT.OI_TICK,
  SSE_EVENT.VOLUME_TICK,
  SSE_EVENT.FUNDING_RATE_TICK,
  SSE_EVENT.SENTIMENT_UPDATE,
])

class SSEConnectionManager {
  private static instance: SSEConnectionManager

  private es: EventSource | null = null
  private handlers = new Map<string, Set<Handler>>()
  private refCount = 0

  private connecting = false
  private transport: RealtimeTransport | null = null
  private connectionCycle = 0
  private vpsFallbackActivated = false
  private vercelScope: RealtimeVercelScope = 'vip'

  private tokenAbortController: AbortController | null =
    null

  private vpsHandshakeTimer:
    | ReturnType<typeof setTimeout>
    | null = null

  private reconnectAttempts = 0
  private reconnectTimer:
    | ReturnType<typeof setTimeout>
    | null = null

  private vpsRecoveryTimer:
    | ReturnType<typeof setTimeout>
    | null = null

  private vpsRecoveryAbortController:
    | AbortController
    | null = null

  private vpsRecoveryProbeCleanup:
    | ((closeEventSource?: boolean) => void)
    | null = null

  private vpsRecoveryGeneration = 0
  private vpsRecoveryInFlight = false

  private watchdogTimer:
    | ReturnType<typeof setInterval>
    | null = null

  private lastEventAt = 0
  private lastMarketDataAt = 0

  private lastDispatchByType = new Map<string, number>()

  private debugRate = {
    count: 0,
    start: 0,
  }

  private summaryLogAt = 0
  private summaryTypeCount = new Map<string, number>()

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }

    return this.instance
  }

  private clearWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
      this.watchdogTimer = null
    }
  }

  private clearVpsHandshakeTimer() {
    if (this.vpsHandshakeTimer) {
      clearTimeout(this.vpsHandshakeTimer)
      this.vpsHandshakeTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private clearVpsRecoveryTimer() {
    if (this.vpsRecoveryTimer) {
      clearTimeout(this.vpsRecoveryTimer)
      this.vpsRecoveryTimer = null
    }
  }

  private clearVpsRecoveryProbe(
    closeEventSource = true,
  ) {
    const controller =
      this.vpsRecoveryAbortController

    this.vpsRecoveryAbortController = null

    if (controller) {
      try {
        controller.abort()
      } catch {}
    }

    const cleanup =
      this.vpsRecoveryProbeCleanup

    this.vpsRecoveryProbeCleanup = null

    if (cleanup) {
      try {
        cleanup(closeEventSource)
      } catch {}
    }

    this.vpsRecoveryInFlight = false
  }

  private clearVpsRecoveryState() {
    this.vpsRecoveryGeneration += 1

    this.clearVpsRecoveryTimer()
    this.clearVpsRecoveryProbe(true)
  }

  private canRecoverVps(
    activeVercel?: EventSource,
  ) {
    return (
      REALTIME_VPS_ENABLED &&
      this.refCount > 0 &&
      this.vpsFallbackActivated &&
      this.vercelScope === 'vip' &&
      this.transport === 'vercel' &&
      this.es !== null &&
      (
        !activeVercel ||
        this.es === activeVercel
      )
    )
  }

  private scheduleVpsRecovery() {
    if (!this.canRecoverVps()) {
      return
    }

    if (
      this.vpsRecoveryTimer ||
      this.vpsRecoveryInFlight
    ) {
      return
    }

    const delay =
      REALTIME_VPS_RECOVERY_INTERVAL_MS +
      Math.floor(
        Math.random() *
          (REALTIME_VPS_RECOVERY_JITTER_MS + 1),
      )

    this.vpsRecoveryTimer = setTimeout(() => {
      this.vpsRecoveryTimer = null

      if (!this.canRecoverVps()) {
        return
      }

      void this.probeVpsRecovery()
    }, delay)
  }

  private failVpsRecovery(
    generation: number,
    activeVercel: EventSource,
  ) {
    if (
      generation !==
        this.vpsRecoveryGeneration ||
      !this.vpsRecoveryInFlight
    ) {
      return
    }

    this.vpsRecoveryGeneration += 1
    this.clearVpsRecoveryProbe(true)

    if (
      this.canRecoverVps(activeVercel)
    ) {
      this.scheduleVpsRecovery()
    }
  }

  private promoteVpsRecoveryConnection(
    generation: number,
    activeVercel: EventSource,
    probeEs: EventSource,
    probeCleanup: (
      closeEventSource?: boolean,
    ) => void,
  ) {
    if (
      generation !==
        this.vpsRecoveryGeneration ||
      !this.vpsRecoveryInFlight ||
      this.refCount <= 0 ||
      !this.vpsFallbackActivated ||
      this.vercelScope !== 'vip' ||
      this.transport !== 'vercel' ||
      this.es !== activeVercel ||
      this.vpsRecoveryProbeCleanup !==
        probeCleanup
    ) {
      this.failVpsRecovery(
        generation,
        activeVercel,
      )

      return
    }

    this.vpsRecoveryGeneration += 1
    this.clearVpsRecoveryTimer()

    this.vpsRecoveryProbeCleanup = null
    this.vpsRecoveryAbortController = null
    this.vpsRecoveryInFlight = false

    /*
     * Probe EventSource의 소유권을 활성 연결로
     * 이전합니다. listener와 probe handshake
     * timer만 제거하고 EventSource는 닫지 않습니다.
     */
    probeCleanup(false)

    const nextCycle = ++this.connectionCycle

    /*
     * 기존 Vercel watchdog을 성공 시점에만
     * 정리합니다. 이 시점 전까지 Vercel은 계속
     * 정상 데이터를 전달합니다.
     */
    this.clearWatchdog()
    this.clearVpsHandshakeTimer()

    this.es = probeEs
    this.transport = 'vps'
    this.connecting = false
    this.vpsFallbackActivated = false
    this.reconnectAttempts = 0

    /*
     * Probe 단계에서는 정상 message handler를
     * 연결하지 않았으므로 승격 후 정확히 한 번만
     * 정상 VPS handler를 연결합니다.
     */
    this.bindEventSourceHandlers(
      probeEs,
      'vps',
      nextCycle,
    )

    /*
     * Probe의 open/connected 이벤트는 이미
     * 발생했으므로 onopen을 기다리지 않고
     * 활성 연결 시각과 watchdog을 시작합니다.
     */
    this.markConnectionAlive()
    this.startWatchdog(
      nextCycle,
      probeEs,
      'vps',
    )

    console.log('[realtime-sse] recovery-success', {
      ts: this.lastEventAt,
      from: 'vercel',
      to: 'vps',
    })

    /*
     * connectionCycle과 this.es 소유권을 먼저
     * 이전했으므로, 이 close에서 발생하는 이전
     * Vercel onerror는 현재 연결로 인정되지
     * 않습니다.
     */
    try {
      activeVercel.close()
    } catch {}
  }

  private async probeVpsRecovery() {
    if (
      this.vpsRecoveryInFlight ||
      !this.canRecoverVps()
    ) {
      return
    }

    const activeVercel = this.es

    if (!activeVercel) {
      return
    }

    const generation =
      ++this.vpsRecoveryGeneration

    const controller =
      new AbortController()

    this.vpsRecoveryInFlight = true
    this.vpsRecoveryAbortController =
      controller

    const isCurrentProbe = () =>
      generation ===
        this.vpsRecoveryGeneration &&
      this.vpsRecoveryInFlight &&
      this.vpsRecoveryAbortController ===
        controller &&
      this.canRecoverVps(activeVercel)

    try {
      const response = await fetch(
        '/api/realtime/token?scope=vip',
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        },
      )

      if (!isCurrentProbe()) {
        return
      }

      if (!response.ok) {
        this.failVpsRecovery(
          generation,
          activeVercel,
        )

        return
      }

      let tokenResponse: RealtimeTokenResponse

      try {
        tokenResponse =
          (await response.json()) as RealtimeTokenResponse
      } catch {
        this.failVpsRecovery(
          generation,
          activeVercel,
        )

        return
      }

      if (!isCurrentProbe()) {
        return
      }

      if (
        tokenResponse.ok !== true ||
        typeof tokenResponse.url !== 'string' ||
        !tokenResponse.url
      ) {
        this.failVpsRecovery(
          generation,
          activeVercel,
        )

        return
      }

      /*
       * token fetch는 완료됐으므로 이후 cleanup이
       * 정상 VPS-first token 요청에 영향을 주지
       * 않도록 recovery controller 소유권만
       * 해제합니다.
       */
      this.vpsRecoveryAbortController = null

      const probeEs = new EventSource(
        tokenResponse.url,
      )

      if (
        generation !==
          this.vpsRecoveryGeneration ||
        !this.vpsRecoveryInFlight ||
        !this.canRecoverVps(activeVercel)
      ) {
        try {
          probeEs.close()
        } catch {}

        return
      }

      let probeDetached = false

      let handshakeTimer:
        | ReturnType<typeof setTimeout>
        | null = null

      const onConnected = () => {
        if (
          generation !==
            this.vpsRecoveryGeneration ||
          !this.vpsRecoveryInFlight ||
          !this.canRecoverVps(activeVercel)
        ) {
          this.failVpsRecovery(
            generation,
            activeVercel,
          )

          return
        }

        this.promoteVpsRecoveryConnection(
          generation,
          activeVercel,
          probeEs,
          probeCleanup,
        )
      }

      const onError = () => {
        this.failVpsRecovery(
          generation,
          activeVercel,
        )
      }

      const probeCleanup = (
        closeEventSource = true,
      ) => {
        if (probeDetached) {
          return
        }

        probeDetached = true

        if (handshakeTimer) {
          clearTimeout(handshakeTimer)
          handshakeTimer = null
        }

        probeEs.removeEventListener(
          'connected',
          onConnected,
        )

        probeEs.onerror = null

        if (closeEventSource) {
          try {
            probeEs.close()
          } catch {}
        }
      }

      this.vpsRecoveryProbeCleanup =
        probeCleanup

      probeEs.addEventListener(
        'connected',
        onConnected,
      )

      probeEs.onerror = onError

      handshakeTimer = setTimeout(() => {
        this.failVpsRecovery(
          generation,
          activeVercel,
        )
      }, REALTIME_VPS_HANDSHAKE_TIMEOUT_MS)
    } catch {
      if (
        generation !==
          this.vpsRecoveryGeneration
      ) {
        return
      }

      this.failVpsRecovery(
        generation,
        activeVercel,
      )
    }
  }

  private abortTokenRequest() {
    if (this.tokenAbortController) {
      try {
        this.tokenAbortController.abort()
      } catch {}

      this.tokenAbortController = null
    }
  }

  private isCurrentCycle(cycle: number) {
    return (
      cycle === this.connectionCycle &&
      this.refCount > 0
    )
  }

  private isCurrentEventSource(
    cycle: number,
    es: EventSource,
  ) {
    return (
      this.isCurrentCycle(cycle) &&
      this.es === es
    )
  }

  private closeCurrentEventSource() {
    const current = this.es

    this.es = null
    this.transport = null

    if (!current) {
      return
    }

    try {
      current.close()
    } catch {}
  }

  private markConnectionAlive() {
    this.lastEventAt = Date.now()
  }

  private markMarketDataAlive() {
    this.lastMarketDataAt = Date.now()

    try {
      useVIPMarketStore
        .getState()
        .markRealtimeDelayed(false)
    } catch {}
  }

  private markRealtimeDelayed() {
    try {
      useVIPMarketStore
        .getState()
        .markRealtimeDelayed(true)
    } catch {}
  }

  private scheduleReconnect(reason: string) {
    if (this.refCount <= 0) {
      return
    }

    if (this.reconnectTimer) {
      return
    }

    const scheduledCycle = this.connectionCycle

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      10000,
    )

    console.warn('[realtime-sse] reconnecting', {
      reason,
      transport:
        this.vpsFallbackActivated
          ? 'vercel'
          : this.transport,
      delay,
      reconnectAttempts: this.reconnectAttempts,
      lastEventAt: this.lastEventAt,
      lastMarketDataAt: this.lastMarketDataAt,
      connectionStaleForMs:
        this.lastEventAt > 0
          ? Date.now() - this.lastEventAt
          : null,
      marketDataStaleForMs:
        this.lastMarketDataAt > 0
          ? Date.now() - this.lastMarketDataAt
          : null,
    })

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null

      if (
        this.refCount <= 0 ||
        scheduledCycle !== this.connectionCycle
      ) {
        return
      }

      this.reconnectAttempts += 1
      this.connect()
    }, delay)
  }

  private fallbackToVercel(
    cycle: number,
    reason: string,
    options?: {
      es?: EventSource
      markDelayed?: boolean
    },
  ) {
    if (!this.isCurrentCycle(cycle)) {
      return
    }

    if (
      options?.es &&
      this.es !== options.es
    ) {
      return
    }

    console.warn('[realtime-sse] fallback', {
      from: 'vps',
      to: 'vercel',
      reason,
      ts: Date.now(),
    })

    this.clearVpsRecoveryState()

    this.vpsFallbackActivated = true

    this.clearVpsHandshakeTimer()
    this.clearWatchdog()
    this.abortTokenRequest()

    if (options?.markDelayed) {
      this.markRealtimeDelayed()
    }

    this.closeCurrentEventSource()
    this.connecting = false

    const nextCycle = ++this.connectionCycle

    this.connectVercel(nextCycle)
  }

  private startWatchdog(
    cycle: number,
    es: EventSource,
    transport: RealtimeTransport,
  ) {
    this.clearWatchdog()

    this.watchdogTimer = setInterval(() => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      const now = Date.now()

      const connectionGap =
        this.lastEventAt > 0
          ? now - this.lastEventAt
          : Number.POSITIVE_INFINITY

      const marketDataGap =
        this.lastMarketDataAt > 0
          ? now - this.lastMarketDataAt
          : Number.POSITIVE_INFINITY

      if (
        connectionGap < REALTIME_SSE_STALE_MS &&
        marketDataGap <
          REALTIME_MARKET_DATA_STALE_MS
      ) {
        return
      }

      const staleReason =
        connectionGap >= REALTIME_SSE_STALE_MS
          ? 'CONNECTION_STALE'
          : 'MARKET_DATA_STALE'

      console.warn('[realtime-sse] stale-detected', {
        reason: staleReason,
        transport,
        connectionGap,
        marketDataGap,
        staleMs: REALTIME_SSE_STALE_MS,
        marketDataStaleMs:
          REALTIME_MARKET_DATA_STALE_MS,
        readyState: es.readyState,
      })

      this.markRealtimeDelayed()

      if (transport === 'vps') {
        this.fallbackToVercel(
          cycle,
          'STALE_WATCHDOG',
          {
            es,
            markDelayed: false,
          },
        )

        return
      }

      this.clearVpsRecoveryState()

      this.clearWatchdog()
      this.closeCurrentEventSource()
      this.connecting = false

      this.connectionCycle += 1

      this.scheduleReconnect('STALE_WATCHDOG')
    }, REALTIME_SSE_WATCHDOG_INTERVAL_MS)
  }

  private handleMessage(e: MessageEvent<string>) {
    const now = Date.now()

    this.markConnectionAlive()

    if (!this.debugRate.start) {
      this.debugRate.start = now
    }

    this.debugRate.count++

    if (now - this.debugRate.start > 1000) {
      this.debugRate.count = 0
      this.debugRate.start = now
    }

    let msg: any

    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }

    const type = msg?.type

    if (!type) {
      return
    }

    if (REALTIME_SSE_DEBUG) {
      const count =
        this.summaryTypeCount.get(type) ?? 0

      this.summaryTypeCount.set(
        type,
        count + 1,
      )

      if (
        now - this.summaryLogAt >=
        REALTIME_SSE_SUMMARY_LOG_INTERVAL_MS
      ) {
        console.log('[realtime-sse] message-summary', {
          ts: now,
          counts: Object.fromEntries(
            this.summaryTypeCount,
          ),
        })

        this.summaryTypeCount.clear()
        this.summaryLogAt = now
      }
    }

    if (MARKET_DATA_EVENTS.has(type)) {
      this.markMarketDataAlive()
    }

    if (type === 'MARKET_STATE') {
    }

    if (type === 'FINAL_DECISION') {
    }

    ;(globalThis as any).__TYPE_COUNT__ =
      (globalThis as any).__TYPE_COUNT__ ?? {}

    ;(globalThis as any).__TYPE_COUNT__[type] =
      ((globalThis as any).__TYPE_COUNT__[type] ??
        0) + 1

    if (!VIP_EVENTS.has(type)) {
      return
    }

    if (THROTTLE_EVENTS.has(type)) {
      const last =
        this.lastDispatchByType.get(type) ?? 0

      if (now - last < 100) {
        return
      }

      this.lastDispatchByType.set(type, now)
    }

    if (type === 'RISK_UPDATE') {
      try {
        handleRiskUpdate(msg)
      } catch {}
    }

    if (type === SSE_EVENT.WHALE_INTENSITY) {
      try {
        handleWhaleIntensityEffect({
          symbol: msg.symbol,
          intensity: msg.intensity,
          avg: msg.avg,
          trend: msg.trend,
          isSpike: msg.isSpike,
          ts: msg.ts ?? Date.now(),
        })
      } catch {}
    }

    if (type === SSE_EVENT.WHALE_WARNING) {
      try {
        handleWhaleWarningEffect({
          symbol: msg.symbol,
          whaleIntensity: msg.whaleIntensity,
          avgWhale: msg.avgWhale,
          tradeUSD: msg.tradeUSD,
          ts: msg.ts ?? Date.now(),
        })
      } catch {}
    }

    if (type === SSE_EVENT.BB_SIGNAL) {
      try {
        applyRealtimeBollingerSignal(msg)
      } catch {}
    }

    if (
      type === SSE_EVENT.BB_LIVE_COMMENTARY
    ) {
      try {
        applyLiveBollingerCommentary(msg)
      } catch {}
    }

    this.handlers
      .get(type)
      ?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })

    this.handlers
      .get('*')
      ?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })
  }

  private bindEventSourceHandlers(
    es: EventSource,
    transport: RealtimeTransport,
    cycle: number,
  ) {
    es.onopen = () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      const wasReconnect =
        this.reconnectAttempts > 0

      this.markConnectionAlive()

      console.log('[realtime-sse] open', {
        ts: this.lastEventAt,
        wasReconnect,
        transport,
      })

      if (wasReconnect) {
        console.log(
          '[realtime-sse] reconnect-success',
          {
            ts: this.lastEventAt,
            reconnectAttempts:
              this.reconnectAttempts,
            transport,
          },
        )
      }

      this.reconnectAttempts = 0

      if (
        transport === 'vercel' &&
        this.canRecoverVps(es)
      ) {
        this.scheduleVpsRecovery()
      }

      this.startWatchdog(
        cycle,
        es,
        transport,
      )
    }

    if (transport === 'vps') {
      es.addEventListener('connected', () => {
        if (
          !this.isCurrentEventSource(
            cycle,
            es,
          )
        ) {
          return
        }

        this.clearVpsRecoveryState()

        this.clearVpsHandshakeTimer()
        this.markConnectionAlive()

        console.log('[realtime-sse] connected', {
          ts: this.lastEventAt,
          transport,
        })
      })
    }

    es.addEventListener('ping', () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      this.markConnectionAlive()

      if (REALTIME_SSE_DEBUG) {
        console.log('[realtime-sse] ping', {
          ts: this.lastEventAt,
          transport,
        })
      }
    })

    es.onmessage = (e) => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      this.handleMessage(e)
    }

    es.onerror = () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      console.warn('[realtime-sse] error', {
        ts: Date.now(),
        readyState: es.readyState,
        transport,
      })

      if (transport === 'vps') {
        this.fallbackToVercel(
          cycle,
          'EVENTSOURCE_ERROR',
          {
            es,
            markDelayed: true,
          },
        )

        return
      }

      this.clearVpsRecoveryState()

      this.clearWatchdog()
      this.clearVpsHandshakeTimer()

      this.closeCurrentEventSource()
      this.connecting = false

      this.markRealtimeDelayed()

      this.connectionCycle += 1

      this.scheduleReconnect(
        'EVENTSOURCE_ERROR',
      )
    }
  }

  private connectVercel(cycle: number) {
    if (!this.isCurrentCycle(cycle)) {
      this.connecting = false
      return
    }

    if (this.es) {
      this.connecting = false
      return
    }

    this.abortTokenRequest()
    this.clearVpsHandshakeTimer()

    try {
      const streamUrl =
        this.vercelScope === 'vip'
          ? '/api/realtime/stream?scope=vip'
          : '/api/realtime/stream'

      const es = new EventSource(streamUrl)

      if (!this.isCurrentCycle(cycle)) {
        try {
          es.close()
        } catch {}

        this.connecting = false
        return
      }

      this.es = es
      this.transport = 'vercel'
      this.connecting = false

      this.bindEventSourceHandlers(
        es,
        'vercel',
        cycle,
      )
    } catch (error) {
      if (!this.isCurrentCycle(cycle)) {
        this.connecting = false
        return
      }

      console.warn('[realtime-sse] error', {
        ts: Date.now(),
        readyState: null,
        transport: 'vercel',
        reason: 'EVENTSOURCE_CREATE_FAILED',
        error,
      })

      this.clearVpsRecoveryState()

      this.es = null
      this.transport = null
      this.connecting = false

      this.markRealtimeDelayed()

      this.connectionCycle += 1

      this.scheduleReconnect(
        'EVENTSOURCE_CREATE_FAILED',
      )
    }
  }

  private async connectVpsFirst(
    cycle: number,
  ) {
    const controller = new AbortController()

    this.tokenAbortController = controller

    try {
      const response = await fetch(
        '/api/realtime/token?scope=vip',
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        },
      )

      if (!this.isCurrentCycle(cycle)) {
        return
      }

      if (!response.ok) {
        let tokenError: unknown

        try {
          const errorResponse =
            (await response.json()) as RealtimeTokenResponse

          tokenError = errorResponse.error
        } catch {}

        if (
          (response.status === 401 &&
            (tokenError === 'UNAUTHENTICATED' ||
              tokenError === 'USER_ID_NOT_FOUND')) ||
          (response.status === 403 &&
            tokenError === 'VIP_REQUIRED')
        ) {
          this.vercelScope = 'realtime'
        }

        this.fallbackToVercel(
          cycle,
          `TOKEN_HTTP_${response.status}`,
        )

        return
      }

      let tokenResponse: RealtimeTokenResponse

      try {
        tokenResponse =
          (await response.json()) as RealtimeTokenResponse
      } catch {
        this.fallbackToVercel(
          cycle,
          'TOKEN_JSON_ERROR',
        )

        return
      }

      if (!this.isCurrentCycle(cycle)) {
        return
      }

      if (
        tokenResponse.ok !== true ||
        typeof tokenResponse.url !== 'string' ||
        !tokenResponse.url
      ) {
        this.fallbackToVercel(
          cycle,
          'TOKEN_URL_MISSING',
        )

        return
      }

      if (!REALTIME_VPS_ENABLED) {
        this.fallbackToVercel(
          cycle,
          'VPS_DISABLED',
        )

        return
      }

      const es = new EventSource(
        tokenResponse.url,
      )

      if (!this.isCurrentCycle(cycle)) {
        try {
          es.close()
        } catch {}

        return
      }

      this.tokenAbortController = null
      this.es = es
      this.transport = 'vps'
      this.connecting = false

      this.bindEventSourceHandlers(
        es,
        'vps',
        cycle,
      )

      this.clearVpsHandshakeTimer()

      this.vpsHandshakeTimer = setTimeout(() => {
        if (
          !this.isCurrentEventSource(
            cycle,
            es,
          )
        ) {
          return
        }

        this.fallbackToVercel(
          cycle,
          'VPS_HANDSHAKE_TIMEOUT',
          {
            es,
            markDelayed: true,
          },
        )
      }, REALTIME_VPS_HANDSHAKE_TIMEOUT_MS)
    } catch (error) {
      if (!this.isCurrentCycle(cycle)) {
        return
      }

      const errorName =
        typeof error === 'object' &&
        error !== null &&
        'name' in error
          ? String(
              (error as { name?: unknown }).name,
            )
          : ''

      if (
        errorName === 'AbortError' &&
        this.refCount <= 0
      ) {
        return
      }

      this.fallbackToVercel(
        cycle,
        errorName === 'AbortError'
          ? 'TOKEN_FETCH_ABORTED'
          : 'TOKEN_FETCH_FAILED',
      )
    } finally {
      if (
        this.tokenAbortController ===
        controller
      ) {
        this.tokenAbortController = null
      }
    }
  }

  private connect() {
    if (this.refCount <= 0) {
      return
    }

    if (this.es || this.connecting) {
      return
    }

    this.connecting = true

    const cycle = ++this.connectionCycle

    if (this.vercelScope === 'realtime') {
      this.connectVercel(cycle)
      return
    }

    if (!this.vpsFallbackActivated) {
      void this.connectVpsFirst(cycle)
      return
    }

    this.connectVercel(cycle)
  }

  refreshAuthorization() {
    this.connectionCycle += 1

    this.abortTokenRequest()
    this.clearVpsHandshakeTimer()
    this.clearReconnectTimer()
    this.clearWatchdog()
    this.clearVpsRecoveryState()

    this.closeCurrentEventSource()

    this.connecting = false
    this.vpsFallbackActivated = false
    this.vercelScope = 'vip'
    this.reconnectAttempts = 0

    if (this.refCount <= 0) {
      return
    }

    this.connect()
  }

  usePublicRealtime() {
    this.connectionCycle += 1

    this.abortTokenRequest()
    this.clearVpsHandshakeTimer()
    this.clearReconnectTimer()
    this.clearWatchdog()
    this.clearVpsRecoveryState()

    this.closeCurrentEventSource()

    this.connecting = false
    this.vpsFallbackActivated = true
    this.vercelScope = 'realtime'
    this.reconnectAttempts = 0

    if (this.refCount <= 0) {
      return
    }

    this.connect()
  }

  subscribe(type: string, handler: Handler) {
    this.refCount++

    this.connect()

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)

      this.refCount = Math.max(
        0,
        this.refCount - 1,
      )

      if (this.refCount === 0) {
        this.connectionCycle += 1

        this.abortTokenRequest()
        this.clearVpsHandshakeTimer()
        this.clearReconnectTimer()
        this.clearWatchdog()
        this.clearVpsRecoveryState()

        this.closeCurrentEventSource()

        this.connecting = false
        this.transport = null
        this.vpsFallbackActivated = false
        this.vercelScope = 'vip'

        this.reconnectAttempts = 0

        this.lastEventAt = 0
        this.lastMarketDataAt = 0

        this.debugRate = {
          count: 0,
          start: 0,
        }

        this.summaryLogAt = 0
        this.summaryTypeCount.clear()
        this.lastDispatchByType.clear()
      }
    }
  }
}

export const sseManager =
  SSEConnectionManager.getInstance()
  