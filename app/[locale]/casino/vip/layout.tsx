import { ReactNode } from 'react'

export default function VIPLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-10 space-y-10 overflow-x-hidden">
      {children}
    </div>
  )
}
