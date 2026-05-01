// app/[locale]/notifications/page.tsx

import NotificationsPageClient from './NotificationsPageClient'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  getNotificationsLast12h,
  getUnreadCountLast12h,
} from '@/lib/notification/repository'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/ko/notices?from=notifications')
  }

  const viewerId = user.id

  const vipLevel = await getUserVIPLevel(viewerId)
  const isVIP = vipLevel === 'VIP'

  try {
    const notifications = isVIP
      ? await getNotificationsLast12h({ viewerId, isVIP })
      : []

    const unreadCount = isVIP
      ? await getUnreadCountLast12h({ viewerId, isVIP })
      : 0

    return (
      <NotificationsPageClient
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
        isVIP={isVIP}
      />
    )
  } catch (error) {
    logger.error('[NOTIFICATIONS_PAGE_DATA]', error)

    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          Failed to load notifications.
        </div>
      </main>
    )
  }
}
