// lib/vip/vipServer.ts

import { getUserVIPState } from './vipDB'
import type { VIPLevel } from './vipTypes'

import { adminDB } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

/**
 * 🔥 수정 이유:
 * 기존 ADMIN_USER_IDS 구조 유지
 */
const ADMIN_USER_IDS: string[] = (
  process.env.ADMIN_USER_IDS ?? ''
)
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

/**
 * 🔥 수정 이유:
 * ADMIN_EMAILS 기반 VIP/ADMIN 처리 추가
 * 현재 실제 운영 환경은 email 기반 관리
 */
const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS ?? ''
)
  .split(',')
  .map((email) =>
    email.replace(/[\[\]\(\)"]/g, '').trim().toLowerCase(),
  )
  .filter(Boolean)

function isAdminUserId(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}

/**
 * 🔥 수정 이유:
 * 현재 Redis session → getCurrentUser()
 * 에서 email 읽어서 ADMIN_EMAILS 기반 판별
 */
async function isAdminEmail(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser()

    const email = currentUser?.email
      ?.trim()
      .toLowerCase()

    if (!email) {
      return false
    }

    return ADMIN_EMAILS.includes(email)
  } catch {
    return false
  }
}

async function getRealVIPLevel(
  userId: string,
): Promise<VIPLevel> {
  const state = await getUserVIPState(userId)

  return state?.level ?? 'FREE'
}

/**
 * 🔥 수정 이유:
 * 기존 ADMIN_USER_IDS 유지
 * ADMIN_EMAILS 기반 VIP 처리 추가
 * 기존 VIP DB fallback 유지
 */
export async function getUserVIPLevel(
  userId: string,
): Promise<VIPLevel> {
  /**
   * 🔥 기존 userId admin 유지
   */
  if (isAdminUserId(userId)) {
    return 'VIP'
  }

  /**
   * 🔥 신규:
   * ADMIN_EMAILS 기반 VIP 처리
   */
  const adminByEmail = await isAdminEmail()

  if (adminByEmail) {
    return 'VIP'
  }

  /**
   * 🔥 기존 VIP DB fallback 유지
   */
  return getRealVIPLevel(userId)
}

/**
 * Worker / PM2 / background-safe VIP lookup.
 *
 * 주의:
 * - getCurrentUser() 호출 금지
 * - cookies() 호출 금지
 * - request scope 없는 환경에서만 사용
 */
export async function getUserVIPLevelByUserIdOnly(
  userId: string,
): Promise<VIPLevel> {
  if (isAdminUserId(userId)) {
    return 'VIP'
  }

  return getRealVIPLevel(userId)
}

/**
 * 🔥 기존 구조 유지
 */
export async function isVIP(
  userId: string,
): Promise<boolean> {
  const level = await getUserVIPLevel(userId)

  return level === 'VIP'
}

/* =========================================================
   🔥 기존 VIP 활성화 구조 유지
========================================================= */

export async function setUserVIPLevel(
  userId: string,
  level: VIPLevel,
) {
  await adminDB
    .collection('vip_users')
    .doc(userId)
    .set(
      {
        level,
        updatedAt: new Date(),
      },
      { merge: true },
    )
}
