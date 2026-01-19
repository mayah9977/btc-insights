import type { ReactNode } from 'react'

export default function VIPLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      {children}
    </div>
  )
}
