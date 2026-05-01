import { pool } from '@/lib/db'
import type { VIPPlan } from '@/lib/payment/vipPlans'

export type TossBillingRecord = {
  userId: string
  customerKey: string
  billingKey: string
  plan: VIPPlan
  status: 'ACTIVE' | 'FAILED' | 'CANCELED'
  lastPaymentKey?: string
  lastOrderId?: string
  createdAt: number
  updatedAt: number
}

type TossBillingRow = {
  user_id: string
  customer_key: string
  billing_key: string
  plan: VIPPlan
  status: 'ACTIVE' | 'FAILED' | 'CANCELED'
  last_payment_key: string | null
  last_order_id: string | null
  created_at: string | number
  updated_at: string | number
}

function mapBillingRow(row: TossBillingRow): TossBillingRecord {
  return {
    userId: row.user_id,
    customerKey: row.customer_key,
    billingKey: row.billing_key,
    plan: row.plan,
    status: row.status,
    lastPaymentKey: row.last_payment_key ?? undefined,
    lastOrderId: row.last_order_id ?? undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

export async function saveBillingKey({
  userId,
  customerKey,
  billingKey,
  plan,
}: {
  userId: string
  customerKey: string
  billingKey: string
  plan: VIPPlan
}): Promise<void> {
  const now = Date.now()

  await pool.query(
    `
    INSERT INTO toss_billing_keys (
      user_id,
      customer_key,
      billing_key,
      plan,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      customer_key = EXCLUDED.customer_key,
      billing_key = EXCLUDED.billing_key,
      plan = EXCLUDED.plan,
      status = 'ACTIVE',
      updated_at = EXCLUDED.updated_at
    `,
    [userId, customerKey, billingKey, plan, now],
  )
}

export async function getBillingKey(
  userId: string,
): Promise<TossBillingRecord | null> {
  const result = await pool.query<TossBillingRow>(
    `
    SELECT
      user_id,
      customer_key,
      billing_key,
      plan,
      status,
      last_payment_key,
      last_order_id,
      created_at,
      updated_at
    FROM toss_billing_keys
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  const row = result.rows[0]
  return row ? mapBillingRow(row) : null
}

export async function markBillingPaymentSuccess({
  userId,
  paymentKey,
  orderId,
}: {
  userId: string
  paymentKey: string
  orderId: string
}): Promise<void> {
  await pool.query(
    `
    UPDATE toss_billing_keys
    SET
      status = 'ACTIVE',
      last_payment_key = $2,
      last_order_id = $3,
      updated_at = $4
    WHERE user_id = $1
    `,
    [userId, paymentKey, orderId, Date.now()],
  )
}

export async function markBillingPaymentFailed(
  userId: string,
): Promise<void> {
  await pool.query(
    `
    UPDATE toss_billing_keys
    SET status = 'FAILED', updated_at = $2
    WHERE user_id = $1
    `,
    [userId, Date.now()],
  )
}

export async function getActiveBillingUsers(): Promise<TossBillingRecord[]> {
  const result = await pool.query<TossBillingRow>(
    `
    SELECT
      user_id,
      customer_key,
      billing_key,
      plan,
      status,
      last_payment_key,
      last_order_id,
      created_at,
      updated_at
    FROM toss_billing_keys
    WHERE status = 'ACTIVE'
    `,
  )

  return result.rows.map(mapBillingRow)
}
