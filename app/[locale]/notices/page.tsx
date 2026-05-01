// app/[locale]/notices/page.tsx

import NoticesPageClient from './NoticesPageClient'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { getNoticeNotifications } from '@/lib/notification/repository'
import { logger } from '@/lib/logger'

export default async function NoticesPage({
  searchParams,
}: {
  searchParams?: { from?: string }
}) {
  try {
    const user = await getCurrentUser()

    const viewerId = user?.id ?? 'guest'
    const vipLevel = user
      ? await getUserVIPLevel(user.id)
      : 'FREE'

    const isVIP = vipLevel === 'VIP'

    const notifications = await getNoticeNotifications({
      viewerId,
      isVIP,
    })

    return (
      <>
        {/* 🔥 VIP 안내 UI */}
        {searchParams?.from && (
          <main className="bg-black px-4 pt-24 text-white">
            <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              ⚠️ 해당 기능은 VIP 전용입니다.
              <div className="mt-2">
                <a
                  href="/ko/vip"
                  className="text-emerald-400 underline"
                >
                  VIP 업그레이드 →
                </a>
              </div>
            </div>
          </main>
        )}

        <NoticesPageClient
          initialNotifications={notifications}
        />
      </>
    )
  } catch (error) {
    logger.error('[NOTICES_PAGE]', error)

    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        Failed to load notices.
      </main>
    )
  }
}
