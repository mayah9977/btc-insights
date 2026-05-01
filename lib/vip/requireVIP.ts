// lib/vip/requireVIP.ts

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'

export async function requireVIP(locale: string, from?: string) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/notices${from ? `?from=${from}` : ''}`)
  }

  const vipLevel = await getUserVIPLevel(user.id)

  if (vipLevel !== 'VIP') {
    redirect(`/${locale}/notices${from ? `?from=${from}` : ''}`)
  }

  return user
}
