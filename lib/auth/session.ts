import { cookies } from 'next/headers'

export type Session = {
  id: string
  userId: string
  vipLevel: number
  role?: 'USER' | 'VIP' | 'ADMIN'
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return null

  return {
    id: userId,
    userId,
    vipLevel: 0,
    role: 'USER',
  }
}

export async function verifySession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}
