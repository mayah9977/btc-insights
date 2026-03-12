'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { chartRealtimeBridge } from '@/lib/chart/chartRealtimeBridge'

const FLASH_DURATION = 200

type MarketState = {
  oi: number | null
  oiDelta: number | null
  volume: number | null
  whaleIntensity: number | null
  whaleSpike: boolean
}

function VIPLiveStatusStripComponent() {

  const marketRef = useRef<MarketState>({
    oi: null,
    oiDelta: null,
    volume: null,
    whaleIntensity: null,
    whaleSpike: false,
  })

  const [renderState, setRenderState] = useState(marketRef.current)

  const lastRenderRef = useRef(0)

  const prevVolumeRef = useRef<number | null>(null)

  const [pulse, setPulse] = useState(false)
  const [flash, setFlash] = useState(false)
  const [volumeFlash, setVolumeFlash] =
    useState<'UP' | 'DOWN' | null>(null)

  /* ===============================
     realtime register
  =============================== */

  useEffect(() => {

    chartRealtimeBridge.register(
      'liveStatus_desktop',
      (data: Partial<MarketState>) => {

        marketRef.current = {
          ...marketRef.current,
          ...data,
        }

        const now = performance.now()

        if (now - lastRenderRef.current > 120) {
          setRenderState({ ...marketRef.current })
          lastRenderRef.current = now
        }

      }
    )

    return () => {
      chartRealtimeBridge.unregister('liveStatus_desktop')
    }

  }, [])

  const {
    oi,
    oiDelta,
    volume,
    whaleIntensity,
    whaleSpike,
  } = renderState

  /* ===============================
     Volume flash
  =============================== */

  useEffect(() => {

    if (volume == null) return

    if (prevVolumeRef.current != null) {

      const diff = volume - prevVolumeRef.current

      if (diff !== 0) {

        setVolumeFlash(diff > 0 ? 'UP' : 'DOWN')

        const t = setTimeout(() => {
          setVolumeFlash(null)
        }, FLASH_DURATION)

        prevVolumeRef.current = volume

        return () => clearTimeout(t)
      }
    }

    prevVolumeRef.current = volume

  }, [volume])

  /* ===============================
     Composite intensity
  =============================== */

  const normalized = useMemo(() => {

    const volScore = volume ? Math.log10(volume + 1) / 6 : 0
    const whaleScore = whaleIntensity ?? 0

    const oiScore =
      oiDelta && Math.abs(oiDelta) > 0
        ? Math.min(Math.abs(oiDelta) / 1_000_000, 1)
        : 0

    return Math.min(
      volScore * 0.5 +
      whaleScore * 0.3 +
      oiScore * 0.2,
      1
    )

  }, [volume, whaleIntensity, oiDelta])

  const isExtreme = normalized > 0.9

  /* ===============================
     AI Level
  =============================== */

  const aiLevel = useMemo(() => {

    if (normalized > 0.85) return 'CRITICAL'
    if (normalized > 0.65) return 'WARNING'
    if (normalized > 0.4) return 'WATCH'
    return 'STABLE'

  }, [normalized])

  const AI_COLOR: Record<string, string> = {
    STABLE: 'text-emerald-400',
    WATCH: 'text-yellow-400',
    WARNING: 'text-orange-400',
    CRITICAL: 'text-red-500',
  }

  /* ===============================
     Squeeze Detection
  =============================== */

  const squeezeType = useMemo(() => {

    if (!oi || !oiDelta || !volume || !whaleIntensity)
      return null

    const oiRatio = oiDelta / oi
    const volCondition = volume > 600000
    const whaleCondition = whaleIntensity > 0.7

    if (oiRatio > 0.015 && volCondition && whaleCondition)
      return 'SHORT SQUEEZE'

    if (oiRatio < -0.015 && volCondition && whaleCondition)
      return 'LONG SQUEEZE'

    return null

  }, [oi, oiDelta, volume, whaleIntensity])

  /* ===============================
     Pulse
  =============================== */

  useEffect(() => {

    if (whaleSpike || normalized > 0.85) {

      setPulse(true)

      const t = setTimeout(
        () => setPulse(false),
        800
      )

      return () => clearTimeout(t)
    }

  }, [whaleSpike, normalized])

  /* ===============================
     Flash
  =============================== */

  useEffect(() => {

    if (isExtreme) {

      setFlash(true)

      const t = setTimeout(
        () => setFlash(false),
        300
      )

      return () => clearTimeout(t)
    }

  }, [isExtreme])

  const shake =
    isExtreme
      ? { x: [0, -3, 3, -3, 3, 0] }
      : pulse
      ? { x: [0, -1.5, 1.5, -1.5, 1.5, 0] }
      : { x: 0 }

  const whaleOverlayOpacity = Math.min(
    (whaleIntensity ?? 0) * 0.85,
    0.85,
  )

  const volumeFlashClass =
    volumeFlash === 'UP'
      ? 'volume-flash-up'
      : volumeFlash === 'DOWN'
      ? 'volume-flash-down'
      : ''

  return (

    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0, ...shake }}
      transition={{ duration: 0.35 }}
      className="
      sticky top-[64px] z-50 mb-4
      border-b border-red-900
      backdrop-blur-lg
      relative overflow-hidden
      "
      style={{
        backgroundColor: isExtreme
          ? 'rgba(40,0,0,0.95)'
          : 'rgba(15,5,5,0.92)',
      }}
    >

      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,0,0,0.85), transparent 65%)',
            }}
          />
        )}
      </AnimatePresence>

      {squeezeType && (
        <div className="absolute top-0 left-0 w-full text-center text-xs py-1 bg-red-800 text-white">
          🧨 {squeezeType} DETECTED
        </div>
      )}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: whaleOverlayOpacity }}
        transition={{ duration: 0.4 }}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.75), transparent 75%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">

        <div className={`font-semibold ${AI_COLOR[aiLevel]}`}>
          AI is observing the market in real time : {aiLevel}
        </div>

        <div className="text-zinc-200">
          Open Interest {oi != null ? oi.toLocaleString() : '--'}
        </div>

        <div className={`font-bold text-red-400 ${volumeFlashClass}`}>
          실시간 체결량 {volume != null ? volume.toLocaleString() : '--'}
        </div>

        <div className="text-yellow-300">
          Whale intensity (고래급기관 체결강도) {whaleIntensity?.toFixed(2) ?? '--'}
        </div>

      </div>

      <motion.div
        className="absolute bottom-0 left-0 h-[4px]"
        initial={{ width: 0 }}
        animate={{ width: `${normalized * 100}%` }}
        transition={{ duration: 0.2 }}
        style={{
          background: `linear-gradient(
          90deg,
          rgba(255,0,0,${normalized}),
          rgba(120,0,0,0.9)
        )`,
          boxShadow: `0 0 ${15 + normalized * 30}px rgba(255,0,0,0.9)`,
        }}
      />

    </motion.div>
  )
}

export default React.memo(VIPLiveStatusStripComponent)
