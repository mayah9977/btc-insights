import type { ReactNode } from 'react'

export default function ReferralLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="py-20">
      <div className="max-w-6xl mx-auto px-6 space-y-16">
        {children}
      </div>
    </main>
  )
}
