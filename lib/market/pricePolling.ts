import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'

/* =========================
 * Internal State (가격 캐시)
 * ========================= */

/**
 * 🔑 마지막으로 수신된 실시간 가격
 * - polling / websocket → onPriceUpdate에서만 갱신
 * - forceEvaluatePrice는 읽기 전용
 */
const lastPriceMap: Record<string, number> = {}

/* =========================
 * Cache API (읽기 전용)
 * ========================= */

export function getLastPrice(symbol: string): number | null {
  const price = lastPriceMap[symbol.toUpperCase()]
  return Number.isFinite(price) ? price : null
}

/* =========================
 * 🔥 REALTIME PRICE FEED (SSOT)
 * ========================= */

/**
 * ✅ 모든 실시간 가격 업데이트의 단일 진입점
 * polling / websocket / stream 은
 * 반드시 이 함수만 호출해야 함
 */
export async function onPriceUpdate(
  symbol: string,
  price: number,
) {
  if (!symbol || !Number.isFinite(price)) return

  const upperSymbol = symbol.toUpperCase()

  // 1️⃣ 최신 가격 캐시
  lastPriceMap[upperSymbol] = price

  // 2️⃣ 🔥 반드시 Alert Engine으로 전달
  await handlePriceTick({
    symbol: upperSymbol,
    price,
    mode: 'tick',
  })
}

/* =========================
 * 🔥 Alert 생성 직후 즉시 평가
 * ========================= */

/**
 * - Alert 생성 직후 1회만 호출
 * - 실시간 루프에서는 절대 사용 금지
 */
export async function forceEvaluatePrice(params: {
  symbol: string
  reason?: string
}) {
  const symbol = params.symbol.toUpperCase()

  let price: number

  const cached = lastPriceMap[symbol]

  // 1️⃣ 실시간 가격이 이미 있으면 사용
  if (Number.isFinite(cached)) {
    price = cached
  } else {
    // 2️⃣ 없을 때만 fetch (fallback)
    const fetched = await fetchCurrentMarketPrice(symbol)

    if (typeof fetched !== 'number' || !Number.isFinite(fetched)) {
      console.warn('[FORCE_EVAL] invalid fetched price', symbol, fetched)
      return
    }

    price = fetched
    lastPriceMap[symbol] = fetched
  }

  console.log('[FORCE_EVAL]', symbol, price, params.reason)

  // 🔥 initial 평가 (딱 1회)
  await handlePriceTick({
    symbol,
    price,
    mode: 'initial',
  })
}
