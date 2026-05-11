export const VIP_SIGNUP_ORDER_PREFIX = 'vip_signup_'
export const VIP_BILLING_ORDER_PREFIX = 'vip_billing_'

export type TossPaymentFlow =
  | 'VIP_SIGNUP'
  | 'VIP_BILLING_LEGACY'
  | 'UNKNOWN'

export function createVIPSignupOrderId() {
  return `${VIP_SIGNUP_ORDER_PREFIX}${Date.now()}_${crypto
    .randomUUID()
    .replaceAll('-', '')}`
}

export function createVIPBillingOrderId() {
  return `${VIP_BILLING_ORDER_PREFIX}${Date.now()}_${crypto
    .randomUUID()
    .replaceAll('-', '')}`
}

export function getPaymentFlowFromOrderId(orderId: string): TossPaymentFlow {
  if (orderId.startsWith(VIP_SIGNUP_ORDER_PREFIX)) {
    return 'VIP_SIGNUP'
  }

  if (orderId.startsWith(VIP_BILLING_ORDER_PREFIX)) {
    return 'VIP_BILLING_LEGACY'
  }

  return 'UNKNOWN'
}

export function isVIPSignupOrderId(orderId: string) {
  return getPaymentFlowFromOrderId(orderId) === 'VIP_SIGNUP'
}

export function isVIPBillingOrderId(orderId: string) {
  return getPaymentFlowFromOrderId(orderId) === 'VIP_BILLING_LEGACY'
}
