//lib/toss/paymentDB.ts   

import { pool } from '@/lib/db'
import {
  getVIPPlan,
  isVIPPlan,
  type VIPPlan,
} from '@/lib/payments/vipPlans'
import { isVIPSignupOrderId } from '@/lib/payments/orderId'

const DAY_MS = 24 * 60 * 60 * 1000

const VIP_PLAN_DAYS: Record<VIPPlan, number> = {
  MONTHLY: 30,
  HALF: 180,
  YEAR: 365,
}

export type VIPSignupEntitlementErrorCode =
  | 'INVALID_SIGNUP_ORDER_ID'
  | 'INVALID_PAYMENT_KEY'
  | 'INVALID_FIREBASE_UID'
  | 'INVALID_VIP_PLAN'
  | 'VIP_PLAN_AMOUNT_MISMATCH'
  | 'PAYMENT_ROW_NOT_FOUND_AFTER_INSERT'
  | 'PAYMENT_ROW_MISMATCH'
  | 'PAYMENT_PAID_AT_MISSING'
  | 'ENTITLEMENT_STATE_MISMATCH'
  | 'INVALID_DB_TIME_VALUE'
  | 'ENTITLEMENT_MARK_UPDATE_FAILED'

export class VIPSignupEntitlementError extends Error {
  readonly code: VIPSignupEntitlementErrorCode

  constructor(code: VIPSignupEntitlementErrorCode) {
    super(code)
    this.name = 'VIPSignupEntitlementError'
    this.code = code
  }
}

export type ApplyVIPSignupEntitlementResult = {
  applied: boolean
  alreadyApplied: boolean
  expiredAt: number
  entitlementAppliedAt: number
}

type VIPPaymentEntitlementRow = {
  order_id: string
  user_id: string
  provider: string
  plan: string
  amount: number | string
  status: string
  payment_key: string | null
  paid_at: number | string | null
  entitlement_applied_at: number | string | null
}

type VIPUserEntitlementRow = {
  user_id: string
  level: string
  expired_at: number | string
  grace_until: number | string | null
  updated_at: number | string
  price_id: string | null
  addons: Record<string, unknown> | null
}

function parseSafeEpochMilliseconds(value: number | string): number {
  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new VIPSignupEntitlementError('INVALID_DB_TIME_VALUE')
  }

  return parsed
}

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

export async function applyVIPSignupEntitlement({
  orderId,
  paymentKey,
  firebaseUid,
  plan,
  amount,
}: {
  orderId: string
  paymentKey: string
  firebaseUid: string
  plan: VIPPlan
  amount: number
}): Promise<ApplyVIPSignupEntitlementResult> {
  if (!orderId || !isVIPSignupOrderId(orderId)) {
    throw new VIPSignupEntitlementError('INVALID_SIGNUP_ORDER_ID')
  }

  if (!paymentKey.trim()) {
    throw new VIPSignupEntitlementError('INVALID_PAYMENT_KEY')
  }

  if (!firebaseUid.trim()) {
    throw new VIPSignupEntitlementError('INVALID_FIREBASE_UID')
  }

  if (!isVIPPlan(plan)) {
    throw new VIPSignupEntitlementError('INVALID_VIP_PLAN')
  }

  const planConfig = getVIPPlan(plan)

  if (
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount !== planConfig.amount
  ) {
    throw new VIPSignupEntitlementError('VIP_PLAN_AMOUNT_MISMATCH')
  }

  const durationDays = VIP_PLAN_DAYS[plan]
  const durationMs = durationDays * DAY_MS
  const now = Date.now()

  if (
    !Number.isSafeInteger(durationMs) ||
    durationMs <= 0 ||
    !Number.isSafeInteger(now)
  ) {
    throw new VIPSignupEntitlementError('INVALID_DB_TIME_VALUE')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `
      INSERT INTO public.vip_payments (
        order_id,
        user_id,
        provider,
        plan,
        amount,
        status,
        payment_key,
        failure_reason,
        created_at,
        paid_at,
        failed_at,
        entitlement_applied_at
      )
      VALUES (
        $1,
        $2,
        'TOSS',
        $3,
        $4,
        'PAID',
        $5,
        NULL,
        $6,
        $6,
        NULL,
        NULL
      )
      ON CONFLICT (order_id)
      DO NOTHING
      `,
      [orderId, firebaseUid, plan, amount, paymentKey, now],
    )

    const paymentResult = await client.query<VIPPaymentEntitlementRow>(
      `
      SELECT
        order_id,
        user_id,
        provider,
        plan,
        amount,
        status,
        payment_key,
        paid_at,
        entitlement_applied_at
      FROM public.vip_payments
      WHERE order_id = $1
      FOR UPDATE
      `,
      [orderId],
    )

    const paymentRow = paymentResult.rows[0]

    if (!paymentRow) {
      throw new VIPSignupEntitlementError(
        'PAYMENT_ROW_NOT_FOUND_AFTER_INSERT',
      )
    }

    const storedAmount = Number(paymentRow.amount)

    if (
      paymentRow.order_id !== orderId ||
      paymentRow.user_id !== firebaseUid ||
      paymentRow.provider !== 'TOSS' ||
      paymentRow.plan !== plan ||
      !Number.isSafeInteger(storedAmount) ||
      storedAmount !== amount ||
      paymentRow.status !== 'PAID' ||
      paymentRow.payment_key !== paymentKey
    ) {
      throw new VIPSignupEntitlementError('PAYMENT_ROW_MISMATCH')
    }

    if (paymentRow.paid_at === null) {
      throw new VIPSignupEntitlementError('PAYMENT_PAID_AT_MISSING')
    }

    parseSafeEpochMilliseconds(paymentRow.paid_at)

    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        hashtextextended($1::text, 0)
      )
      `,
      [firebaseUid],
    )

    if (paymentRow.entitlement_applied_at !== null) {
      const entitlementAppliedAt = parseSafeEpochMilliseconds(
        paymentRow.entitlement_applied_at,
      )

      const existingVIPResult = await client.query<VIPUserEntitlementRow>(
        `
        SELECT
          user_id,
          level,
          expired_at,
          grace_until,
          updated_at,
          price_id,
          addons
        FROM public.vip_users
        WHERE user_id = $1
        FOR UPDATE
        `,
        [firebaseUid],
      )

      const existingVIP = existingVIPResult.rows[0]

      if (!existingVIP) {
        throw new VIPSignupEntitlementError('ENTITLEMENT_STATE_MISMATCH')
      }

      const existingExpiredAt = parseSafeEpochMilliseconds(
        existingVIP.expired_at,
      )

      await client.query('COMMIT')

      return {
        applied: false,
        alreadyApplied: true,
        expiredAt: existingExpiredAt,
        entitlementAppliedAt,
      }
    }

    const existingVIPResult = await client.query<VIPUserEntitlementRow>(
      `
      SELECT
        user_id,
        level,
        expired_at,
        grace_until,
        updated_at,
        price_id,
        addons
      FROM public.vip_users
      WHERE user_id = $1
      FOR UPDATE
      `,
      [firebaseUid],
    )

    const existingVIP = existingVIPResult.rows[0]
    const existingExpiredAt = existingVIP
      ? parseSafeEpochMilliseconds(existingVIP.expired_at)
      : null
    const base =
      existingExpiredAt !== null && existingExpiredAt > now
        ? existingExpiredAt
        : now
    const expiredAt = base + durationMs

    if (!Number.isSafeInteger(expiredAt) || expiredAt <= base) {
      throw new VIPSignupEntitlementError('INVALID_DB_TIME_VALUE')
    }

    await client.query(
      `
      INSERT INTO public.vip_users (
        user_id,
        level,
        expired_at,
        grace_until,
        updated_at,
        price_id,
        addons
      )
      VALUES (
        $1,
        'VIP',
        $2,
        NULL,
        $3,
        $4,
        '{}'::jsonb
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        level = 'VIP',
        expired_at = EXCLUDED.expired_at,
        grace_until = NULL,
        updated_at = EXCLUDED.updated_at,
        price_id = EXCLUDED.price_id
      `,
      [firebaseUid, expiredAt, now, plan],
    )

    const entitlementResult = await client.query<{
      entitlement_applied_at: number | string
    }>(
      `
      UPDATE public.vip_payments
      SET entitlement_applied_at = $2
      WHERE order_id = $1
        AND entitlement_applied_at IS NULL
      RETURNING entitlement_applied_at
      `,
      [orderId, now],
    )

    if (entitlementResult.rowCount !== 1 || !entitlementResult.rows[0]) {
      throw new VIPSignupEntitlementError('ENTITLEMENT_MARK_UPDATE_FAILED')
    }

    const entitlementAppliedAt = parseSafeEpochMilliseconds(
      entitlementResult.rows[0].entitlement_applied_at,
    )

    await client.query('COMMIT')

    return {
      applied: true,
      alreadyApplied: false,
      expiredAt,
      entitlementAppliedAt,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Preserve the original error.
    }

    throw error
  } finally {
    client.release()
  }
}
