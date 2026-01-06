// lib/vip/vipStateMachine.ts

import { VIPLevel } from './vipTypes'
import {
  getUserVIPState,
  recoverVIP,
  forceExpireVIP,
} from './vipDB'
import {
  recordVIPChange,
  VIPAuditReason,
} from './vipAuditLog'

export type VipStatus =
  | 'FREE'
  | 'ACTIVE'
  | 'GRACE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'BANNED'

type TransitionInput = {
  userId: string
  toStatus: VipStatus
  level?: VIPLevel
  extendDays?: number
  reason: VIPAuditReason
}

export async function transitionVIP(input: TransitionInput) {
  const prev = await getUserVIPState(input.userId)
  const beforeLevel: VIPLevel = prev?.level ?? 'FREE'
  const now = Date.now()

  switch (input.toStatus) {
    case 'ACTIVE': {
      if (!input.level) {
        throw new Error('ACTIVE transition requires VIP level')
      }

      await recoverVIP(
        input.userId,
        input.level,
        input.extendDays ?? 30
      )

      recordVIPChange({
        userId: input.userId,
        before: beforeLevel,
        after: input.level,
        reason: input.reason,
        at: now,
      })
      break
    }

    case 'EXPIRED':
    case 'CANCELLED':
    case 'BANNED': {
      await forceExpireVIP(input.userId)

      recordVIPChange({
        userId: input.userId,
        before: beforeLevel,
        after: 'FREE',
        reason: input.reason,
        at: now,
      })
      break
    }

    default:
      throw new Error(
        `Unsupported VIP transition: ${input.toStatus}`
      )
  }
}
