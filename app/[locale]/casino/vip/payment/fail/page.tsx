// app/[locale]/casino/vip/payment/fail/page.tsx
import Link from 'next/link'

type PageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    code?: string
    message?: string
    orderId?: string
  }>
}

const messageMap: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다',
  PAY_PROCESS_ABORTED: '결제가 중단되었습니다',
}

export default async function VIPPaymentFailPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params
  const { code, message } = await searchParams

  const finalMessage =
    (code && messageMap[code]) ||
    message ||
    '결제 중 오류가 발생했습니다.'

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_35%),linear-gradient(135deg,#020617,#020617_55%,#1f0f12)] text-white">
      <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-[0_0_45px_rgba(239,68,68,0.18)] backdrop-blur-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-300/30 bg-red-400/10 text-2xl">
          !
        </div>

        <h1 className="text-2xl font-extrabold text-red-300">
          결제가 완료되지 않았습니다
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          {finalMessage}
        </p>

        <Link
          href={`/${locale}/casino/vip`}
          className="mt-6 block rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
        >
          VIP 결제 다시 시도하기
        </Link>
      </div>
    </main>
  )
}
