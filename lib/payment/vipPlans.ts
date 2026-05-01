export type VIPPlan = 'MONTHLY' | 'SIX_MONTHS' | 'TWELVE_MONTHS'

export type VIPPlanConfig = {
  plan: VIPPlan
  amount: number
  days: number
  orderName: string
}

export const VIP_PLANS: Record<VIPPlan, VIPPlanConfig> = {
  MONTHLY: {
    plan: 'MONTHLY',
    amount: 30_000,
    days: 30,
    orderName: 'VIP 멤버십 1개월',
  },
  SIX_MONTHS: {
    plan: 'SIX_MONTHS',
    amount: 150_000,
    days: 180,
    orderName: 'VIP 멤버십 6개월',
  },
  TWELVE_MONTHS: {
    plan: 'TWELVE_MONTHS',
    amount: 270_000,
    days: 365,
    orderName: 'VIP 멤버십 12개월',
  },
}

export function isVIPPlan(value: unknown): value is VIPPlan {
  return (
    value === 'MONTHLY' ||
    value === 'SIX_MONTHS' ||
    value === 'TWELVE_MONTHS'
  )
}

export function getVIPPlan(plan: VIPPlan): VIPPlanConfig {
  return VIP_PLANS[plan]
}
