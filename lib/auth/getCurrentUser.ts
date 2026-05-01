import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export type AuthUser = {
  id: string
  email?: string
}

export async function getCurrentUser(
  req?: NextRequest,
): Promise<AuthUser | null> {
  const userIdFromReq = req?.cookies.get('userId')?.value

  if (userIdFromReq) {
    return { id: userIdFromReq }
  }

  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return null

  return { id: userId }
}
