/* =========================================================
   Narrative Signal Priority Engine (ULTRA LIGHT)
========================================================= */

export interface NarrativeSignalGroups {
  liquidationSignals?: string[]
  whaleSignals?: string[]
  pressureSignals?: string[]
  structureSignals?: string[]
  regimeSignals?: string[]
}

/* =========================================================
   🔥 Signal Weight Mapping (핵심)
========================================================= */
function amplify(signal: string): string {
  switch (signal) {
    /* =========================
       Structure
    ========================= */
    case 'OI_INCREASE':
      return '🔥 OI 급증'
    case 'OI_DECREASE':
      return '⚠️ OI 감소'

    case 'VOLUME_SPIKE':
      return '⚡ Vol 확장'
    case 'VOLUME_DROP':
      return '🧊 Vol 감소'

    case 'ACCUMULATION':
      return '🚀 기관급 매집감지'
    case 'DISTRIBUTION':
      return '💥 기관급 매도감지'

    /* =========================
       Pressure
    ========================= */
    case 'LONG_BUILDUP':
      return '📈 롱 증가'
    case 'SHORT_BUILDUP':
      return '📉 숏 증가'

    case 'LONG_OVERHEAT':
      return '🔥 롱 과열'
    case 'SHORT_OVERHEAT':
      return '🔥 숏 과열'

    case 'SQUEEZE_RISK':
      return '💣 스퀴즈 위험'

    /* =========================
       Whale
    ========================= */
    case 'WHALE_BUY_CONTROL':
      return '🐳 고래 집중매수'
    case 'WHALE_SELL_CONTROL':
      return '🐳 고래 집중매도'

    case 'WHALE_ACCUMULATION':
      return '🐳 고래 매집 강화'
    case 'WHALE_DISTRIBUTION':
      return '🐳 고래 매도 강화'

    case 'WHALE_INFLUENCE':
      return '🐳 영향력 확대'

    /* =========================
       Liquidation
    ========================= */
    case 'LONG_LIQUIDATION':
      return '💀 롱 청산'
    case 'SHORT_LIQUIDATION':
      return '💀 숏 청산'

    case 'CASCADE_LIQUIDATION':
      return '☠️ 연쇄 청산'

    /* =========================
       Regime
    ========================= */
    case 'TREND':
      return '📊 추세'
    case 'RANGE':
      return '📦 횡보'
    case 'VOLATILE':
      return '⚡ 변동성'

    default:
      return signal
  }
}

/* =========================================================
   🔥 ultra fast map (dedupe + map 통합)
========================================================= */
function fastMap(arr?: string[]): string[] {
  if (!arr || arr.length === 0) return []

  const seen = new Set<string>()
  const out: string[] = []

  for (let i = 0; i < arr.length; i++) {
    const s = arr[i]
    if (!s) continue

    const mapped = amplify(s)

    if (!seen.has(mapped)) {
      seen.add(mapped)
      out.push(mapped)
    }
  }

  return out
}

/* =========================================================
   Apply Priority (🔥 초경량)
========================================================= */
export function applySignalPriority(
  input: NarrativeSignalGroups,
): NarrativeSignalGroups {
  return {
    liquidationSignals: fastMap(input.liquidationSignals),
    whaleSignals: fastMap(input.whaleSignals),
    pressureSignals: fastMap(input.pressureSignals),
    structureSignals: fastMap(input.structureSignals),
    regimeSignals: fastMap(input.regimeSignals),
  }
}
