import Link from 'next/link'

type Props = {
  variant?: 'A' | 'B'
}

export default function CasinoVIPCTA({ variant = 'B' }: Props) {
  if (variant === 'A') {
    return (
      <Link
        href="/ko/casino/vip"
        className="inline-block px-5 py-2 rounded-full bg-vipAccent text-black font-semibold"
      >
        VIP 판단 바로 보기 →
      </Link>
    )
  }

  return (
    <Link
      href="/ko/casino/judgement"
      className="inline-block px-5 py-2 rounded-full bg-neutral-800 text-slate-100 hover:bg-vipAccent hover:text-black transition font-semibold"
    >
      이 판단의 요약을 먼저 봅니다 →
    </Link>
  )
}
