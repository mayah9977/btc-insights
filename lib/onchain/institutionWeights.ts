/* =========================================================
   Institutional Weight Configuration
   - Fusion Engine Weight Source
   - Separated Config Layer
   - Hedge-Fund Grade Structure
========================================================= */

export interface InstitutionWeight {
  name: string
  weight: number
  tier: 'CORE' | 'PRIMARY' | 'SECONDARY'
}

/* =========================================================
   🔥 기본 가중치 설정
   - CORE: 기관급 온체인 데이터 업체
   - PRIMARY: 리서치 기반 분석 업체
   - SECONDARY: 미디어/보조 분석
========================================================= */

export const INSTITUTION_WEIGHTS: InstitutionWeight[] = [
  { name: 'Glassnode', weight: 1.6, tier: 'CORE' },
  { name: 'CryptoQuant', weight: 1.5, tier: 'CORE' },
  { name: 'CoinMetrics', weight: 1.4, tier: 'CORE' },

  { name: 'Santiment', weight: 1.3, tier: 'PRIMARY' },
  { name: 'The Block', weight: 1.2, tier: 'PRIMARY' },
  { name: 'Messari', weight: 1.2, tier: 'PRIMARY' },

  { name: 'CoinDesk', weight: 1.0, tier: 'SECONDARY' },
]

/* =========================================================
   🔥 평균 가중치 계산
========================================================= */

export function getAverageInstitutionWeight(): number {
  const total = INSTITUTION_WEIGHTS.reduce(
    (sum, inst) => sum + inst.weight,
    0,
  )

  return total / INSTITUTION_WEIGHTS.length
}

/* =========================================================
   🔥 특정 기관 가중치 조회
========================================================= */

export function getInstitutionWeight(name: string): number {
  const found = INSTITUTION_WEIGHTS.find(
    inst => inst.name.toLowerCase() === name.toLowerCase(),
  )

  return found?.weight ?? 1.0
}

/* =========================================================
   🔥 Tier 기반 평균 가중치
========================================================= */

export function getTierAverageWeight(
  tier: 'CORE' | 'PRIMARY' | 'SECONDARY',
): number {
  const filtered = INSTITUTION_WEIGHTS.filter(
    inst => inst.tier === tier,
  )

  if (filtered.length === 0) return 1

  const total = filtered.reduce(
    (sum, inst) => sum + inst.weight,
    0,
  )

  return total / filtered.length
}