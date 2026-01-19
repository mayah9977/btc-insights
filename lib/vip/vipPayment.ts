// lib/vip/vipPayment.ts
import { applyVIPPaymentSuccess } from './vipDB'

/**
 * 결제 성공 처리 (SSOT Entry)
 * - Stripe / Toss / Crypto 결제 성공 시 호출
 */
export async function handleVIPPaymentSuccess(
  userId: string,
  priceId: string
) {
  await applyVIPPaymentSuccess(userId, priceId)
}
