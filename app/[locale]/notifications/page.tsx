import NotificationsPageClient from './NotificationsPageClient'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import {
  getNotificationsLast12h,
  getUnreadCountLast12h,
} from '@/lib/notification/repository'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
  try {
    const viewerId = 'local'
    const isVIP = await getUserVIP('local')

    // 🔥 추가: VIP 접근 제어 (쿼리 포함)
    if (!isVIP) {
      return redirect('/ko/notices?from=notifications')
    }

    const notifications = await getNotificationsLast12h({
      viewerId,
      isVIP,
    })

    const unreadCount = await getUnreadCountLast12h({
      viewerId,
      isVIP,
    })

    return (
      <NotificationsPageClient
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
        isVIP={isVIP}
      />
    )
  } catch (error) {
    console.error('[NOTIFICATIONS_PAGE]', error)

    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          Failed to load notifications.
        </div>
      </main>
    )
  }
}
