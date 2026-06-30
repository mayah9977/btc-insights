import { ReactNode } from 'react'

export default function VIPLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className="
        mx-auto max-w-7xl px-4 md:px-6
        pt-0 md:pt-10 pb-8 md:pb-10   // FIX: remove top padding on mobile, keep desktop spacing
        space-y-10
        overflow-x-hidden
      "
    >
      {children}
    </div>
  )
}
