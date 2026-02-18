/* =========================================================
   Server Candle Chart Renderer (Node Canvas)
   - 15m Candles
   - VIP Premium Gold Style
   - Return base64 PNG
========================================================= */

import { createCanvas } from 'canvas'
import type { Candle15m } from '@/lib/market/fetchCandle15m'

export async function renderCandleChartBase64(
  candles: Candle15m[],
  width = 900,
  height = 420,
): Promise<string> {
  if (!candles.length) return ''

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  /* =========================
     Background
  ========================= */
  ctx.fillStyle = '#0b0f17'
  ctx.fillRect(0, 0, width, height)

  /* =========================
     Price Range 계산
  ========================= */
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)

  const maxPrice = Math.max(...highs)
  const minPrice = Math.min(...lows)

  const priceRange = maxPrice - minPrice
  const paddingY = 40
  const chartHeight = height - paddingY * 2

  const candleWidth = width / candles.length

  /* =========================
     Grid Lines
  ========================= */
  ctx.strokeStyle = 'rgba(255,215,0,0.08)'
  ctx.lineWidth = 1

  for (let i = 0; i < 5; i++) {
    const y =
      paddingY +
      (chartHeight / 4) * i

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  /* =========================
     Draw Candles
  ========================= */
  candles.forEach((candle, i) => {
    const x =
      i * candleWidth + candleWidth * 0.1

    const bodyWidth = candleWidth * 0.8

    const openY =
      paddingY +
      ((maxPrice - candle.open) / priceRange) *
        chartHeight

    const closeY =
      paddingY +
      ((maxPrice - candle.close) /
        priceRange) *
        chartHeight

    const highY =
      paddingY +
      ((maxPrice - candle.high) /
        priceRange) *
        chartHeight

    const lowY =
      paddingY +
      ((maxPrice - candle.low) /
        priceRange) *
        chartHeight

    const isBull =
      candle.close >= candle.open

    /* ===== Wick ===== */
    ctx.strokeStyle = isBull
      ? '#facc15'
      : '#ef4444'

    ctx.beginPath()
    ctx.moveTo(x + bodyWidth / 2, highY)
    ctx.lineTo(x + bodyWidth / 2, lowY)
    ctx.stroke()

    /* ===== Body ===== */
    ctx.fillStyle = isBull
      ? '#facc15'
      : '#ef4444'

    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.max(
      2,
      Math.abs(closeY - openY),
    )

    ctx.fillRect(
      x,
      bodyTop,
      bodyWidth,
      bodyHeight,
    )
  })

  /* =========================
     Title
  ========================= */
  ctx.fillStyle = '#facc15'
  ctx.font = 'bold 18px Arial'
  ctx.fillText(
    'BTCUSDT 15m Chart',
    20,
    30,
  )

  /* =========================
     Latest Price 표시
  ========================= */
  const last = candles[candles.length - 1]

  ctx.fillStyle = '#ffffff'
  ctx.font = '14px Arial'
  ctx.fillText(
    `Last: ${last.close.toFixed(2)}`,
    width - 180,
    30,
  )

  return canvas.toDataURL('image/png')
}
