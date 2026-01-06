import Link from 'next/link'

type Props = {
  preview: string
}

export default function VIPPreviewCTA({ preview }: Props) {
  return (
    <div className="bg-vipCard border border-vipBorder rounded-2xl p-6 space-y-3">
      <div className="text-sm text-zinc-400">
        VIP 미리보기
      </div>

      <div className="text-white text-lg blur-sm select-none">
        {preview}
      </div>

      <Link
        href="/ko/casino/vip"
        className="inline-block mt-3 px-5 py-2 rounded-full bg-vipAccent text-black font-semibold"
      >
        VIP에서 전체 판단 보기
      </Link>
    </div>
  )
}
