import { pool } from '@/lib/db'
import type { VIPPlan } from '@/lib/payment/vipPlans'

export async function createPendingPayment({
  orderId,
  userId,
  plan,
  amount,
}: {
  orderId: string
  userId: string
  plan: VIPPlan | 'ADMIN'
  amount: number
}): Promise<void> {
  const now = Date.now()

  await pool.query(
    `
    INSERT INTO vip_payments (
      order_id,
      user_id,
      provider,
      plan,
      amount,
      status,
      created_at
    )
    VALUES ($1, $2, 'TOSS', $3, $4, 'PENDING', $5)
    ON CONFLICT (order_id)
    DO NOTHING
    `,
    [orderId, userId, plan, amount, now],
  )
}

export async function markPaymentPaid({
  orderId,
  paymentKey,
}: {
  orderId: string
  paymentKey: string
}): Promise<boolean> {
  const now = Date.now()

  const result = await pool.query(
    `
    UPDATE vip_payments
    SET
      status = 'PAID',
      payment_key = $2,
      paid_at = $3
    WHERE order_id = $1
      AND status = 'PENDING'
    `,
    [orderId, paymentKey, now],
  )

  return (result.rowCount ?? 0) > 0
}

export async function markPaymentFailed({
  orderId,
  reason,
}: {
  orderId: string
  reason: string
}): Promise<void> {
  const now = Date.now()

  await pool.query(
    `
    UPDATE vip_payments
    SET
      status = 'FAILED',
      failure_reason = $2,
      failed_at = $3
    WHERE order_id = $1
      AND status = 'PENDING'
    `,
    [orderId, reason, now],
  )
}

export async function getPaymentByOrderId(orderId: string): Promise<{
  orderId: string
  userId: string
  plan: VIPPlan | 'ADMIN'
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'DUPLICATE'
} | null> {
  const result = await pool.query<{
    order_id: string
    user_id: string
    plan: VIPPlan | 'ADMIN'
    amount: number
    status: 'PENDING' | 'PAID' | 'FAILED' | 'DUPLICATE'
  }>(
    `
    SELECT order_id, user_id, plan, amount, status
    FROM vip_payments
    WHERE order_id = $1
    LIMIT 1
    `,
    [orderId],
  )

  const row = result.rows[0]
  if (!row) return null

  return {
    orderId: row.order_id,
    userId: row.user_id,
    plan: row.plan,
    amount: Number(row.amount),
    status: row.status,
  }
}
