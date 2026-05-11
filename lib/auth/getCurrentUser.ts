// lib/auth/getCurrentUser.ts

import { cookies } from 'next/headers'
import { redis } from '@/lib/redis/index'

export type CurrentUser = {
  id: string
  email?: string
  isDev?: boolean
  isAdmin?: boolean
}

const SESSION_COOKIE_NAME = 'session'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies()

    const allCookies = cookieStore.getAll()

    console.log(
      '[GET_CURRENT_USER] all cookies',
      allCookies,
    )

    const sessionCookie =
      cookieStore.get(SESSION_COOKIE_NAME)

    console.log(
      '[GET_CURRENT_USER] session cookie',
      {
        exists: !!sessionCookie,
        value: sessionCookie?.value,
      },
    )

    const sessionId = sessionCookie?.value

    if (!sessionId) {
      console.log(
        '[GET_CURRENT_USER] no session cookie',
      )

      return null
    }

    const raw = await redis.get(
      `session:${sessionId}`,
    )

    console.log(
      '[GET_CURRENT_USER] redis session',
      {
        exists: !!raw,
      },
    )

    if (!raw) {
      return null
    }

    const session =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw

    console.log(
      '[GET_CURRENT_USER] parsed session',
      session,
    )

    if (!session?.userId) {
      return null
    }

    return {
      id: session.userId,
      email: session.email,
      isDev: session.isDev === true,
      isAdmin: session.isAdmin === true,
    }
  } catch (error) {
    console.error(
      '[GET_CURRENT_USER] failed',
      error,
    )

    return null
  }
}
