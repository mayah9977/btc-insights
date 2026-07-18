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
const SESSION_AUTH_VERSION = 2
const SESSION_AUTH_PROVIDER = 'firebase'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies()

    const sessionCookie =
      cookieStore.get(SESSION_COOKIE_NAME)

    const sessionId = sessionCookie?.value

    if (!sessionId) {
      return null
    }

    const raw = await redis.get(
      `session:${sessionId}`,
    )

    if (!raw) {
      return null
    }

    const session =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw

    if (!session?.userId) {
      return null
    }

    if (
      session.authVersion !==
        SESSION_AUTH_VERSION ||
      session.authProvider !==
        SESSION_AUTH_PROVIDER
    ) {
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
