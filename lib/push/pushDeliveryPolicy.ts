//lib/push/pushDeliveryPolicy.ts

export function isPushDeliveryDisabled(): boolean {
  return process.env.PUSH_DELIVERY_DISABLED?.trim() === 'true'
}
