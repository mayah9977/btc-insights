export type PaymentProvider = 'toss' | 'stripe'

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER

  if (provider === 'stripe') return 'stripe'
  return 'toss'
}

export function isStripeEnabled() {
  return getPaymentProvider() === 'stripe'
}

export function isTossEnabled() {
  return getPaymentProvider() === 'toss'
}
