// app/[locale]/vip/page.tsx

import { requireVIP } from '@/lib/vip/requireVIP'

export default async function VIPPage() {
  await requireVIP('vip')

  return (
    <main className="min-h-screen px-6 py-20 text-white">
      <h1 className="text-3xl font-bold">VIP Dashboard</h1>
      <p className="mt-3 text-slate-400">
        VIP 전용 콘텐츠에 접근할 수 있습니다.
      </p>
    </main>
  )
}
