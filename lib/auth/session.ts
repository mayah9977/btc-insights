// lib/auth/session.ts
import { cookies } from 'next/headers'

export type Session = {
  id: string
  userId: string
  vipLevel: number
  role?: 'USER' | 'VIP' | 'ADMIN'
}

export async function getSession(): Promise<Session | null> {
  /**
   * 🔥 DEV 환경 우회 세션
   * - VIP SSE / Stream / Push 테스트용
   * - 프로덕션에는 영향 없음
   */
  if (process.env.NODE_ENV === 'development') {
    return {
      id: 'dev-user',
      userId: 'dev-user',
      vipLevel: 3,
      role: 'VIP',
    }
  }

  const cookieStore = await cookies()

  const userId = cookieStore.get('userId')?.value
  if (!userId) return null

  return {
    id: userId,
    userId,
    vipLevel: 3, // TODO: DB 연동 시 교체
    role: 'VIP',
  }
}

export async function verifySession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}
