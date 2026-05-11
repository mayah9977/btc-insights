// lib/payments/vipPlans.ts

export const VIP_PLANS = {
  MONTHLY: {
    id: 'MONTHLY',
    months: 1,
    amount: 30000,
    orderName: '1개월 VIP 이용권',
  },

  HALF: {
    id: 'HALF',
    months: 6,
    amount: 150000,
    orderName: '6개월 VIP 이용권',
  },

  YEAR: {
    id: 'YEAR',
    months: 12,
    amount: 270000,
    orderName: '12개월 VIP 이용권',
  },
} as const

/**
 * 🔥 핵심:
 * 프론트/서버 단일 타입 source
 */
export type VIPPlan = keyof typeof VIP_PLANS

export function isVIPPlan(
  value: unknown,
): value is VIPPlan {
  if (typeof value !== 'string') {
    return false
  }

  return value in VIP_PLANS
}

export function getVIPPlan(
  plan: VIPPlan,
) {
  return VIP_PLANS[plan]
}
