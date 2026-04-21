import NoticesPageClient from './NoticesPageClient'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import { getNoticeNotifications } from '@/lib/notification/repository'

export default async function NoticesPage({
  searchParams,
}: {
  searchParams?: { from?: string }
}) {
  try {
    const viewerId = 'local'
    const isVIP = await getUserVIP('local')

    const notifications = await getNoticeNotifications({
      viewerId,
      isVIP,
    })

    return (
      <>
        {/* 🔥 추가: 접근 제한 안내 메시지 */}
        {searchParams?.from === 'notifications' && (
          <main className="bg-black px-4 pt-24 text-white">
            <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              ⚠️ 알림(Notification)은 VIP 사용자만 이용 가능합니다.  
              현재 공지사항 페이지로 이동되었습니다.
            </div>
          </main>
        )}

        <NoticesPageClient
          initialNotifications={notifications}
        />
      </>
    )
  } catch (error) {
    console.error('[NOTICES_PAGE]', error)

    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          Failed to load notices.
        </div>
      </main>
    )
  }
}
