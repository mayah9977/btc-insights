import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentAdminUser } from '@/lib/auth/adminAccess'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params
  const admin = await getCurrentAdminUser()

  if (!admin) {
    redirect(`/${locale}/login`)
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="mt-2 text-sm text-zinc-400">
            운영자 전용 관리 페이지입니다.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href={`/${locale}/admin/vip`}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            VIP 관리
          </Link>

          <Link
            href={`/${locale}/admin/system`}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            Cron / Notification 상태
          </Link>

          <Link
            href={`/${locale}/admin/features`}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            Feature Flags
          </Link>
        </div>
      </div>
    </main>
  )
}
