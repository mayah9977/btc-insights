// lib/auth/session.ts
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis/index'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import type { VIPLevel } from '@/lib/vip/vipTypes'

export type SessionRole = 'USER' | 'VIP' | 'ADMIN'
export type DeviceType = 'desktop' | 'mobile'

export type Session = {
  id: string
  userId: string
  email?: string
  vipLevel: VIPLevel
  role: SessionRole
  isAdmin: boolean
  isVIP: boolean
  deviceType?: DeviceType
  createdAt?: number
  updatedAt?: number
}

const SESSION_COOKIE_NAME = 'session'

function parseSession(raw: unknown): any | null {
  try {
    if (!raw) return null

    if (typeof raw === 'string') {
      return JSON.parse(raw)
    }

    return raw
  } catch {
    return null
  }
}

function normalizeRole({
  isAdmin,
  isVIP,
}: {
  isAdmin: boolean
  isVIP: boolean
}): SessionRole {
  if (isAdmin) return 'ADMIN'
  if (isVIP) return 'VIP'
  return 'USER'
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

    /** 🔥 수정 이유:
     * legacy userId cookie 제거
     * Redis session cookie만 auth source로 사용
     */
    if (!sessionId) return null

    const raw = await redis.get(`session:${sessionId}`)
    const session = parseSession(raw)

    if (!session) return null

    const userId =
      typeof session.userId === 'string'
        ? session.userId
        : typeof session.id === 'string'
          ? session.id
          : ''

    if (!userId) return null

    /** 🔥 수정 이유:
     * 현재 프로젝트 VIP 타입은 숫자 VIP3가 아니라 FREE | VIP
     * 기존 getUserVIPLevel 구조를 그대로 사용
     */
    const realVipLevel = await getUserVIPLevel(userId)

    const isAdmin = session.isAdmin === true
    const isVIP = session.isVIP === true || realVipLevel === 'VIP'
    const vipLevel: VIPLevel = isVIP ? 'VIP' : 'FREE'

    return {
      id: sessionId,
      userId,
      email:
        typeof session.email === 'string'
          ? session.email
          : undefined,
      vipLevel,
      isAdmin,
      isVIP,
      role: normalizeRole({
        isAdmin,
        isVIP,
      }),
      deviceType:
        session.deviceType === 'mobile' ||
        session.deviceType === 'desktop'
          ? session.deviceType
          : undefined,
      createdAt:
        typeof session.createdAt === 'number'
          ? session.createdAt
          : undefined,
      updatedAt:
        typeof session.updatedAt === 'number'
          ? session.updatedAt
          : undefined,
    }
  } catch {
    return null
  }
}

export async function verifySession(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  return session
}
