// lib/vip/vipCompensation.ts
import { predictVIP3Churn } from './vipChurnPredictor';
import { enableVIPAddon } from './vipAddon';
import { VIPAddon } from './vipTypes';

export type CompensationAction =
  | 'NONE'
  | 'FREE_ADDON'
  | 'DISCOUNT_COUPON';

export async function triggerVIP3Compensation(
  userId: string
): Promise<CompensationAction> {
  const risk = predictVIP3Churn(userId);

  if (risk === 'HIGH') {
    await enableVIPAddon(
      userId,
      'EXTREME_BOOST',
      7,
      'ADMIN'
    );
    return 'FREE_ADDON';
  }

  if (risk === 'MEDIUM') {
    return 'DISCOUNT_COUPON';
  }

  return 'NONE';
}
